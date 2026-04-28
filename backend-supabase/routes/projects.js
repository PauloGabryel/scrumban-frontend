const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', projectController.createProject);
router.get('/', projectController.getMyProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.delete('/:id/members/:userId', projectController.removeMember);

module.exports = router;