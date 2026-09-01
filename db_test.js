import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if(match) env[match[1]] = match[2];
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('usuarios').select('*').limit(1);
  console.log('ID:', data[0].id, 'Type:', typeof data[0].id);
}
run();
