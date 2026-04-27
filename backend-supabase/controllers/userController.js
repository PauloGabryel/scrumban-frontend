const { supabase } = require('../config/database');

// Obter perfil do usuário
exports.getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
};

// Atualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ name, email: email ? email.toLowerCase() : undefined, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select('id, name, email')
      .single();

    if (error) throw error;

    res.json({ message: 'Perfil atualizado com sucesso', user });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};

// Listar todos os usuários (admin/debug)
exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, created_at');

    if (error) throw error;

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};

// Verificar se um email está cadastrado (usado pelo frontend ao convidar)
exports.checkByEmail = async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single();

    if (!user) {
      return res.json({ exists: false });
    }

    res.json({ exists: true, name: user.name, id: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar email' });
  }
};