const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { supabase } = require('../config/database');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../config/email');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta_producao_12345';

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── Registro ────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({ message: 'Por favor, preencha todos os campos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });
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
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        email_verified: false,
        verify_token: verifyToken,
      })
      .select('id, name, email')
      .single();

    if (error) throw error;

    // Tenta enviar email de verificação
    const emailSent = await sendVerificationEmail(newUser.email, verifyToken, newUser.name);

    if (!emailSent) {
      // Email não configurado (modo dev): ativa a conta direto
      await supabase
        .from('users')
        .update({ email_verified: true, verify_token: null })
        .eq('id', newUser.id);

      const token = makeToken(newUser);
      return res.status(201).json({
        message: 'Conta criada com sucesso!',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
    }

    return res.status(201).json({
      message: 'Conta criada! Verifique seu email para ativar a conta antes de fazer login.',
      requiresVerification: true,
    });

  } catch (error) {
    console.error('[register]', error);
    res.status(500).json({ message: 'Erro no registro: ' + error.message });
  }
};

// ─── Verificar Email ─────────────────────────────────────────────────────────

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Token inválido' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, email_verified')
      .eq('verify_token', token)
      .single();

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou já utilizado' });
    }
    if (user.email_verified) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
      return res.redirect(`${frontendUrl}/login.html?verified=already`);
    }

    await supabase
      .from('users')
      .update({ email_verified: true, verify_token: null })
      .eq('id', user.id);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    return res.redirect(`${frontendUrl}/login.html?verified=1`);

  } catch (error) {
    console.error('[verifyEmail]', error);
    res.status(500).json({ message: 'Erro ao verificar email' });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor, preencha email e senha' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, password, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    if (user.email_verified === false) {
      return res.status(403).json({
        message: 'Confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
        requiresVerification: true,
      });
    }

    const token = makeToken(user);
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ message: 'Erro no login: ' + error.message });
  }
};

// ─── Verificar Token JWT ─────────────────────────────────────────────────────

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

    res.json({ user: { id: user.id, name: user.name, email: user.email } });

  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar token' });
  }
};

// ─── Esqueci a Senha ─────────────────────────────────────────────────────────
// ALTERADO: agora informa claramente se o email não está cadastrado.

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Por favor, informe seu email' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .single();

    // ← MUDANÇA: resposta diferente quando email não existe
    if (!user) {
      return res.status(404).json({
        message: 'Este email não está cadastrado. Verifique o endereço ou crie uma conta.',
        notFound: true,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    const { error } = await supabase
      .from('password_resets')
      .upsert(
        {
          user_id: user.id,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
          used: false,
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.name);

    if (!emailSent) {
      // Email não configurado no servidor — informa o admin no log
      console.error('[forgotPassword] Email não enviado: variáveis EMAIL_USER/EMAIL_PASSWORD não configuradas no servidor.');
      return res.status(500).json({
        message: 'Erro ao enviar email. O serviço de email não está configurado. Entre em contato com o suporte.',
      });
    }

    return res.json({
      message: 'Email enviado! Verifique sua caixa de entrada (e a pasta de spam) para redefinir sua senha.',
    });

  } catch (error) {
    console.error('[forgotPassword]', error);
    res.status(500).json({ message: 'Erro ao processar solicitação. Tente novamente.' });
  }
};

// ─── Redefinir Senha ─────────────────────────────────────────────────────────

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, passwordConfirm } = req.body;

    if (!token || !password || !passwordConfirm) {
      return res.status(400).json({ message: 'Por favor, preencha todos os campos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'As senhas não conferem' });
    }

    const { data: record } = await supabase
      .from('password_resets')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (!record) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }
    if (record.used) {
      return res.status(400).json({ message: 'Este link já foi utilizado' });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Token expirado. Solicite um novo link.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', record.user_id);

    if (updateError) throw updateError;

    await supabase
      .from('password_resets')
      .update({ used: true })
      .eq('token', token);

    res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });

  } catch (error) {
    console.error('[resetPassword]', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
};