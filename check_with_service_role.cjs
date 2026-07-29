const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aziowvhzfrmtrbypiodm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYxNDMxOCwiZXhwIjoyMTAwMTkwMzE4fQ.6TzWshOMqE72fhGKfAYhJY448s_1Fw_wIvVIgtKiS0o';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const { data: users, error: userError } = await supabase.from('users_espresso').select('*');
  const { data: branches, error: branchError } = await supabase.from('branches_espresso').select('*');

  console.log('--- Checking with Service Role Key ---');
  if (userError) console.error('User Select Error:', userError);
  else console.log('Users in DB count:', users.length, users);

  if (branchError) console.error('Branch Select Error:', branchError);
  else console.log('Branches in DB count:', branches.length, branches);
}

check();
