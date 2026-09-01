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
  const token = '01d4241c-a8c4-492a-8f3b-320b871b9adc';
  const { data, error } = await supabase.from('usuarios').select('id, nome, role, bairro').eq('id', token).maybeSingle();
  console.log('Result:', data, error);
}
run();
