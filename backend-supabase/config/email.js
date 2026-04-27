const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendInviteEmail = async (toEmail, token, projectName, inviterName) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/accept-invite.html?token=${token}`;

    await transporter.sendMail({
      from: `"Scrumban App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Convite para o projeto: ${projectName}`,
      html: `
        <h2>Você foi convidado!</h2>
        <p><strong>${inviterName}</strong> convidou você para participar do projeto <strong>${projectName}</strong>.</p>
        <p>Clique no link abaixo para aceitar o convite:</p>
        <a href="${inviteLink}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Aceitar Convite
        </a>
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">
          Este convite expira em 7 dias. Se você não esperava este convite, ignore este email.
        </p>
      `,
    });

    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error.message);
    return false;
  }
};

module.exports = { sendInviteEmail };
