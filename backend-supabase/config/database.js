const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
  try {
    // Testa a conexão com uma query simples
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    console.log('✅ Supabase conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error.message);
    process.exit(1);
  }
};

module.exports = { supabase, connectDB };
