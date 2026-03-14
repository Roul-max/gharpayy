import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const users = [
  { id: '00000000-0000-0000-0000-000000000005', email: 'aisha@gharpayy.com', role: 'agent' },
  { id: '00000000-0000-0000-0000-000000000006', email: 'vikram@gharpayy.com', role: 'agent' },
  { id: '00000000-0000-0000-0000-000000000007', email: 'meera@gharpayy.com', role: 'manager' },
  { id: '00000000-0000-0000-0000-000000000008', email: 'rohan@gharpayy.com', role: 'agent' },
  { id: '00000000-0000-0000-0000-000000000009', email: 'nisha.owner@gharpayy.com', role: 'owner' },
  { id: '00000000-0000-0000-0000-000000000010', email: 'arjun@gharpayy.com', role: 'agent' },
];

const defaultPassword = 'Temp@12345';

for (const u of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    id: u.id,
    email: u.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: { role: u.role ?? 'agent' },
  });

  if (error) {
    console.error('Create user failed', u.id, u.email, error.message);
  } else {
    console.log('Created', u.id, u.email, data.user?.id);
  }
}
