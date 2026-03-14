import fs from 'fs';
import path from 'path';

const root = process.cwd();
const requiredFiles = [
  'database/schema.sql',
  'database/rls_policies.sql',
  'database/triggers.sql',
  'database/production_hardening.sql'
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length > 0) {
  console.error(`Missing required migration files: ${missing.join(', ')}`);
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

const schema = read('database/schema.sql');
const rls = read('database/rls_policies.sql');
const triggers = read('database/triggers.sql');
const hardening = read('database/production_hardening.sql');

const assertions = [
  { name: 'schema tables', value: /CREATE TABLE/i.test(schema) },
  { name: 'rls policies', value: /CREATE POLICY/i.test(rls) },
  { name: 'triggers', value: /CREATE TRIGGER/i.test(triggers) || /CREATE FUNCTION/i.test(triggers) },
  { name: 'hardening indexes', value: /CREATE INDEX/i.test(hardening) }
];

const failed = assertions.filter((item) => !item.value).map((item) => item.name);
if (failed.length > 0) {
  console.error(`Migration validation failed: ${failed.join(', ')}`);
  process.exit(1);
}

console.log('Migration validation passed.');
