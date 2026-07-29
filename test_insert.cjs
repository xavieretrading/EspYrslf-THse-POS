const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const userData = {
    username: "admin",
    email: "philip@allsetdigital.com",
    password: "admin123",
    role: "admin",
    permissions: ["/", "/pos", "/orders", "/kitchen", "/tables", "/inventory", "/branches", "/reports", "/settings", "/audit"],
    full_name: "Philip Macairan",
    branch_id: null,
    is_active: 1
  };

  const { data, error } = await supabase.from('users_espresso').insert([userData]).select();
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

test();
