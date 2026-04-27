const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/database');

// Registro
exports.register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({ message: 'Por favor, preencha todos os campos' });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'As senhas não conferem' });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Este email já está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email: email.toLowerCase(), password: hashedPassword })
      .select('id, name, email')
      .single();

    if (error) throw error;

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET || 'chave_super_secreta_producao_12345',
      { expiresIn: '7d' }
    ); // <-- fechamento correto aqui

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no registro: ' + error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor, preencha email e senha' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'chave_super_secreta_producao_12345',
      { expiresIn: '7d' }
    ); // <-- fechamento correto aqui

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no login: ' + error.message });
  }
};

// Verificar token
exports.verifyToken = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar token' });
  }
};