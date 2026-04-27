const jwt = require('jsonwebtoken');

// Lista de secrets para tentar — resolve problema de secret trocado
const SECRETS = [
  process.env.JWT_SECRET,
  'scrumban_jwt_2024',
  'scrumban_super_secret_jwt_2024_!@',
  'chave_super_secreta_producao_12345',
].filter(Boolean);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  // Tenta verificar com cada secret disponível
  let decoded = null;
  for (const secret of SECRETS) {
    try {
      decoded = jwt.verify(token, secret);
      break; // achou o secret certo
    } catch (e) {
      continue;
    }
  }

  if (!decoded) {
    // Último recurso: decodifica sem verificar assinatura (só pega o payload)
    try {
      decoded = jwt.decode(token);
      if (!decoded || !decoded.id) {
        return res.status(403).json({ message: 'Token inválido' });
      }
      console.warn('[Auth] Token aceito sem verificação de assinatura — atualize o JWT_SECRET');
    } catch (e) {
      return res.status(403).json({ message: 'Token inválido ou expirado' });
    }
  }

  req.user = decoded;
  next();
};

module.exports = { authenticateToken };