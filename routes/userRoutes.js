const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
router.get('/profile', auth, userController.getUserProfile);
router.put('/profile', auth, userController.updateUserProfile);
router.get('/', auth, role(['Admin', 'TeamLeader']), userController.getUsers);
router.get('/:id', auth, role(['Admin', 'TeamLeader']), userController.getUser);
router.post('/', auth, role(['Admin','TeamLeader']), userController.createUser);
router.put('/:id', auth, role(['Admin', 'TeamLeader']), userController.updateUser);
router.delete('/:id', auth, role(['Admin']), userController.deleteUser);

module.exports = router;
