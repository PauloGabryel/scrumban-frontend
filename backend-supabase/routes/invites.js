const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/inviteController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/',                        ctrl.sendInvite);         // enviar convite
router.get('/my',                       ctrl.getMyInvites);       // convites para o usuário logado (sino)
router.get('/project/:projectId',       ctrl.getProjectInvites);  // convites de um projeto
router.post('/:inviteId/accept',        ctrl.acceptInvite);       // aceitar por ID
router.get('/accept/:token',            ctrl.acceptInvite);       // aceitar por token (link de email)
router.delete('/:inviteId',             ctrl.cancelInvite);       // recusar/cancelar

module.exports = router;