/* routes/auth.js */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// All endpoints under /api/auth

router.get('/', authController.homePage);

router.post(
  '/openAccount',
  [
    body('fullName').notEmpty().withMessage('Full Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('mobile').isLength({ min: 10 }).withMessage('A valid mobile number is required.')
  ],
  authController.openAccount
);

router.post('/register', authController.registerBanking);
router.post('/login', authController.login);
router.post('/generateOTP', authController.generateOTP);
router.post('/forgotUserID', authController.forgotUserID);
router.post('/forgotPassword', authController.forgotPassword);
// Using forgotPassword function for setNewPassword as well; you can adjust if separate logic is needed.
router.post('/setNewPassword', authController.forgotPassword);

module.exports = router;

for (let x = 0; x < 25; x++) {
  console.log(`Auth route log ${x + 1}`);
}
