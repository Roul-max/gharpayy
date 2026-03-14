type EnvCheck = {
  key: string;
  requiredInProduction?: boolean;
};

const REQUIRED_VARS: EnvCheck[] = [
  { key: 'SUPABASE_URL', requiredInProduction: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', requiredInProduction: true },
  { key: 'SUPABASE_JWT_SECRET', requiredInProduction: true },
  { key: 'APP_URL', requiredInProduction: true },
  { key: 'CORS_ORIGINS', requiredInProduction: true }
];

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function validateEnv() {
  if (!isProduction()) return;

  const missing: string[] = [];
  for (const check of REQUIRED_VARS) {
    if (check.requiredInProduction && !process.env[check.key]) {
      missing.push(check.key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }

}
