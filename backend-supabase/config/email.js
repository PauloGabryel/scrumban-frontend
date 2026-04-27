const nodemailer = require('nodemailer');

// Retorna null se email não estiver configurado
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  // Se ainda são os valores placeholder, não cria o transporter
  if (!user || !pass || user.includes('seu_email') || pass.includes('sua_senha')) {
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user, pass },
  });
};

// ─── Email de Verificação de Conta ───────────────────────────────────────────

const sendVerificationEmail = async (toEmail, token, userName) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false; // email não configurado → modo dev

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    const verifyLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"Scrumban Manager" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Confirme seu email - Scrumban Manager',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0f172a;">
          <div style="background:linear-gradient(135deg,#007bff,#4d9fff);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Scrumban Manager</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
            <h2 style="font-size:18px;font-weight:700;margin:0 0 12px;">Olá, ${userName}!</h2>
            <p style="color:#475569;margin:0 0 24px;">Obrigado por criar sua conta. Clique no botão abaixo para confirmar seu email e ativar o acesso.</p>
            <a href="${verifyLink}"
               style="display:inline-block;background:linear-gradient(135deg,#007bff,#0056b3);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Confirmar Email
            </a>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;">
              Este link expira em <strong>24 horas</strong>. Se você não criou uma conta, ignore este email.
            </p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('[sendVerificationEmail] Erro:', error.message);
    return false;
  }
};

// ─── Email de Redefinição de Senha ───────────────────────────────────────────

const sendPasswordResetEmail = async (toEmail, token, userName) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      // Email não configurado: loga o link no console para debug
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
      console.log(`[DEV] Link de reset para ${toEmail}: ${frontendUrl}/login.html?reset_token=${token}`);
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    const resetLink = `${frontendUrl}/login.html?reset_token=${token}`;

    await transporter.sendMail({
      from: `"Scrumban Manager" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Redefinição de senha - Scrumban Manager',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0f172a;">
          <div style="background:linear-gradient(135deg,#007bff,#4d9fff);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Scrumban Manager</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
            <h2 style="font-size:18px;font-weight:700;margin:0 0 12px;">Redefinir sua senha</h2>
            <p style="color:#475569;margin:0 0 8px;">Olá, <strong>${userName}</strong>!</p>
            <p style="color:#475569;margin:0 0 24px;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo:</p>
            <a href="${resetLink}"
               style="display:inline-block;background:linear-gradient(135deg,#007bff,#0056b3);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Redefinir Senha
            </a>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;">
              Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este email — sua senha permanece a mesma.
            </p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('[sendPasswordResetEmail] Erro:', error.message);
    return false;
  }
};

// ─── Convite para Projeto ─────────────────────────────────────────────────────

const sendInviteEmail = async (toEmail, token, projectName, inviterName) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    const inviteLink = `${frontendUrl}/accept-invite.html?token=${token}`;

    await transporter.sendMail({
      from: `"Scrumban Manager" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Convite para o projeto: ${projectName}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#0f172a;">
          <div style="background:linear-gradient(135deg,#007bff,#4d9fff);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Scrumban Manager</h1>
          </div>
          <div style="background:#fff;padding:32px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
            <h2 style="font-size:18px;font-weight:700;margin:0 0 12px;">Você foi convidado!</h2>
            <p style="color:#475569;margin:0 0 24px;">
              <strong>${inviterName}</strong> convidou você para participar do projeto <strong>${projectName}</strong>.
            </p>
            <a href="${inviteLink}"
               style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
              Aceitar Convite
            </a>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;">
              Este convite expira em 7 dias. Se você não esperava este convite, ignore este email.
            </p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('[sendInviteEmail] Erro:', error.message);
    return false;
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendInviteEmail };