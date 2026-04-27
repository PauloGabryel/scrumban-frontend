const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/profile',     userController.getProfile);
router.put('/profile',     userController.updateProfile);
router.get('/all',         userController.getAllUsers);
router.get('/check',       userController.checkByEmail);   // GET /api/users/check?email=...

module.exports = router;