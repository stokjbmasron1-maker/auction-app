import { createClient } from './node_modules/@supabase/supabase-js/dist/main/index.js'

const supabaseUrl = 'https://koocigiljxlatoutudwt.supabase.co'
const supabaseKey = 'sb_publishable_O5ZGtuPxLueBrMODB3_M4g_iN1cXUGV'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log("Signing up...");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: 'testuser', full_name: 'Test User' } }
  });
  
  if (error) {
    console.error("SignUp Error:", error);
    return;
  }
  
  console.log("User signed up:", data.user.id);
  
  const newProfile = {
    id: data.user.id,
    username: `testuser_${data.user.id.substring(0,5)}`,
    full_name: 'Test User',
    avatar_url: ''
  };
  
  console.log("Attempting insert...");
  const { data: pData, error: pError } = await supabase.from('profiles').insert([newProfile]).select();
  
  if (pError) {
    console.error("Insert Error:", pError);
  } else {
    console.log("Insert Success:", pData);
  }
}

test();
