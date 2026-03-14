import { getTestPool } from './dbTestHarness.js';

type Filter = {
  column: string;
  operator: 'eq' | 'in' | 'ilike' | 'gte' | 'lte' | 'lt';
  value: any;
};

type OrGroup = {
  column: string;
  operator: 'eq' | 'ilike';
  value: any;
}[];

type OrderBy = { column: string; ascending: boolean };

type SelectOptions = {
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
};

function normalizeColumns(columns?: string) {
  if (!columns || columns.trim() === '*') return '*';
  if (columns.includes('(')) return '*';
  return columns
    .split(',')
    .map((entry) => entry.trim().split(':')[0])
    .filter(Boolean)
    .join(', ');
}

function buildWhere(filters: Filter[], orGroups: OrGroup[], params: any[]) {
  const clauses: string[] = [];

  for (const filter of filters) {
    if (filter.operator === 'in') {
      params.push(filter.value);
      clauses.push(`${filter.column} = ANY($${params.length})`);
      continue;
    }

    params.push(filter.value);
    const op =
      filter.operator === 'eq'
        ? '='
        : filter.operator === 'ilike'
          ? 'ILIKE'
          : filter.operator === 'gte'
            ? '>='
            : filter.operator === 'lte'
              ? '<='
              : '<';
    clauses.push(`${filter.column} ${op} $${params.length}`);
  }

  for (const orGroup of orGroups) {
    const parts: string[] = [];
    for (const orFilter of orGroup) {
      params.push(orFilter.value);
      const op = orFilter.operator === 'eq' ? '=' : 'ILIKE';
      parts.push(`${orFilter.column} ${op} $${params.length}`);
    }
    if (parts.length > 0) {
      clauses.push(`(${parts.join(' OR ')})`);
    }
  }

  if (clauses.length === 0) return '';
  return `WHERE ${clauses.join(' AND ')}`;
}

function parseOrExpression(expression: string): OrGroup {
  return expression
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const [column, operator, ...rest] = token.split('.');
      return {
        column,
        operator: operator === 'ilike' ? 'ilike' : 'eq',
        value: rest.join('.')
      };
    });
}

class QueryBuilder {
  private table: string;
  private filters: Filter[] = [];
  private orGroups: OrGroup[] = [];
  private orderBy: OrderBy | null = null;
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private selectColumns = '*';
  private selectOptions: SelectOptions | undefined;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private insertRows: Record<string, any>[] = [];
  private updatePayload: Record<string, any> | null = null;
  private upsertPayload: Record<string, any> | Record<string, any>[] | null = null;
  private upsertConflict: string | null = null;
  private returning = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string, options?: SelectOptions) {
    this.selectColumns = normalizeColumns(columns);
    this.selectOptions = options;
    if (this.action === 'select') {
      return this;
    }
    this.returning = true;
    return this;
  }

  insert(rows: Record<string, any>[]) {
    this.action = 'insert';
    this.insertRows = rows;
    return this;
  }

  update(payload: Record<string, any>) {
    this.action = 'update';
    this.updatePayload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  upsert(payload: Record<string, any> | Record<string, any>[], options: { onConflict: string; ignoreDuplicates?: boolean }) {
    this.action = 'upsert';
    this.upsertPayload = payload;
    this.upsertConflict = options.onConflict;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  in(column: string, value: any[]) {
    this.filters.push({ column, operator: 'in', value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ column, operator: 'ilike', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  or(expression: string) {
    this.orGroups.push(parseOrExpression(expression));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = Math.max(0, to - from + 1);
    return this;
  }

  single() {
    return this.executeSingle(true);
  }

  maybeSingle() {
    return this.executeSingle(false);
  }

  async executeSingle(requireRow: boolean) {
    const result = await this.execute();
    if (result.error) return result as any;
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row && requireRow) {
      return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
    }
    return { data: row ?? null, error: null };
  }

  async execute() {
    const pool = getTestPool();
    const params: any[] = [];
    const whereSql = buildWhere(this.filters, this.orGroups, params);

    try {
      if (this.action === 'select') {
        if (this.selectOptions?.head && this.selectOptions.count) {
          const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM ${this.table} ${whereSql}`, params);
          return { data: null, error: null, count: countResult.rows[0]?.count ?? 0 };
        }

        let sql = `SELECT ${this.selectColumns} FROM ${this.table} ${whereSql}`;
        if (this.orderBy) {
          sql += ` ORDER BY ${this.orderBy.column} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`;
        }
        if (this.limitCount != null) {
          sql += ` LIMIT ${this.limitCount}`;
        }
        if (this.offsetCount != null) {
          sql += ` OFFSET ${this.offsetCount}`;
        }
        const result = await pool.query(sql, params);
        return { data: result.rows, error: null, count: result.rowCount ?? 0 };
      }

      if (this.action === 'insert') {
        const rows = this.insertRows;
        if (rows.length === 0) return { data: [], error: null };

        const columns = Object.keys(rows[0]);
        const values: string[] = [];
        const insertParams: any[] = [];
        let paramIndex = 1;

        for (const row of rows) {
          const rowParams: string[] = [];
          for (const column of columns) {
            insertParams.push((row as any)[column]);
            rowParams.push(`$${paramIndex++}`);
          }
          values.push(`(${rowParams.join(', ')})`);
        }

        const returning = this.returning ? 'RETURNING *' : '';
        const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES ${values.join(', ')} ${returning}`;
        const result = await pool.query(sql, insertParams);
        return { data: this.returning ? result.rows : null, error: null };
      }

      if (this.action === 'update') {
        const payload = this.updatePayload ?? {};
        const columns = Object.keys(payload);
        const setClauses: string[] = [];
        const updateParams: any[] = [];
        let paramIndex = 1;

        for (const column of columns) {
          updateParams.push((payload as any)[column]);
          setClauses.push(`${column} = $${paramIndex++}`);
        }

        const whereParams: any[] = [];
        const whereSqlUpdate = buildWhere(this.filters, this.orGroups, whereParams);
        const returning = this.returning ? 'RETURNING *' : '';
        const sql = `UPDATE ${this.table} SET ${setClauses.join(', ')} ${whereSqlUpdate} ${returning}`;
        const result = await pool.query(sql, [...updateParams, ...whereParams]);
        return { data: this.returning ? result.rows : null, error: null };
      }

      if (this.action === 'delete') {
        const whereParams: any[] = [];
        const whereSqlDelete = buildWhere(this.filters, this.orGroups, whereParams);
        const returning = this.returning ? 'RETURNING *' : '';
        const sql = `DELETE FROM ${this.table} ${whereSqlDelete} ${returning}`;
        const result = await pool.query(sql, whereParams);
        return { data: this.returning ? result.rows : null, error: null };
      }

      if (this.action === 'upsert') {
        const payloads = Array.isArray(this.upsertPayload) ? this.upsertPayload : [this.upsertPayload];
        if (!payloads[0]) return { data: null, error: null };
        const columns = Object.keys(payloads[0]);
        const insertValues: string[] = [];
        const insertParams: any[] = [];
        let paramIndex = 1;

        for (const row of payloads) {
          const rowParams: string[] = [];
          for (const column of columns) {
            insertParams.push((row as any)[column]);
            rowParams.push(`$${paramIndex++}`);
          }
          insertValues.push(`(${rowParams.join(', ')})`);
        }

        const conflictColumns = this.upsertConflict ?? columns[0];
        const returning = this.returning ? 'RETURNING *' : '';
        const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES ${insertValues.join(', ')} ON CONFLICT (${conflictColumns}) DO NOTHING ${returning}`;
        const result = await pool.query(sql, insertParams);

        if (result.rows.length > 0) {
          return { data: this.returning ? result.rows : null, error: null };
        }

        const firstRow = payloads[0] as Record<string, any>;
        const conflictKeys = conflictColumns.split(',').map((col) => col.trim()).filter(Boolean);
        if (conflictKeys.length === 0) {
          return { data: null, error: null };
        }

        const whereParts: string[] = [];
        const whereParams: any[] = [];
        conflictKeys.forEach((key) => {
          whereParams.push(firstRow[key]);
          whereParts.push(`${key} = $${whereParams.length}`);
        });

        const existing = await pool.query(
          `SELECT * FROM ${this.table} WHERE ${whereParts.join(' AND ')}`,
          whereParams
        );
        return { data: this.returning ? existing.rows : null, error: null };
      }

      return { data: null, error: { message: 'Unsupported operation', code: 'TEST_UNSUPPORTED' } };
    } catch (error: any) {
      return { data: null, error: { message: error?.message ?? 'Unknown error', code: error?.code ?? 'DB_ERROR' } };
    }
  }

  then(resolve: (value: any) => any, reject?: (reason?: any) => any) {
    return this.execute().then(resolve, reject);
  }
}

export function createSupabaseMock() {
  return {
    from(table: string) {
      return new QueryBuilder(table);
    },
    auth: {
      async getUser() {
        return { data: { user: null }, error: { message: 'Not implemented', code: 'TEST_AUTH' } };
      }
    },
    rpc() {
      return Promise.resolve({ data: null, error: { message: 'RPC not implemented', code: 'TEST_RPC' } });
    }
  };
}
