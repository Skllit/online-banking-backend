/* controllers/authController.js */
const User = require('../models/User');
const Account = require('../models/Account');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const transporter = require('../utils/mailer'); // Use SMTP transporter from utils/mailer.js

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Helper to generate OTP (6 digits, valid for 5 minutes)
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  return { otp, expiry };
};

module.exports = {
  homePage: (req, res) => {
    res.json({ message: 'Welcome to the Online Banking API' });
  },

  openAccount: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array() });
    try {
      const data = req.body;
      const newUser = new User({
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        aadhar: data.aadhar || '',
        dob: data.dob || null,
        residentialAddress: data.residentialAddress || '',
        permanentAddress: data.permanentAddress || '',
        occupation: data.occupation || ''
      });
      await newUser.save();
      res.json({
        message: 'Account opening request submitted. Await admin approval.',
        accountNumber: newUser.accountNumber
      });
    } catch (err) {
      console.error('Error in openAccount:', err);
      res.status(500).json({ error: 'Error opening account.' });
    }
  },

  registerBanking: async (req, res) => {
    try {
      const { accountNumber, loginPassword, confirmLoginPassword, transactionPassword, confirmTransactionPassword } = req.body;
      if (loginPassword !== confirmLoginPassword)
        return res.status(400).json({ error: 'Login passwords do not match.' });
      if (transactionPassword !== confirmTransactionPassword)
        return res.status(400).json({ error: 'Transaction passwords do not match.' });
      const user = await User.findOne({ accountNumber });
      if (!user) return res.status(404).json({ error: 'Account not found.' });
      if (!user.isActive) return res.status(403).json({ error: 'Account not approved by admin yet.' });
      user.loginPassword = await bcrypt.hash(loginPassword, 10);
      user.transactionPassword = await bcrypt.hash(transactionPassword, 10);
      await user.save();
      const accountExists = await Account.findOne({ accountNumber: user.accountNumber });
      if (!accountExists) {
        const newAccount = new Account({
          accountNumber: user.accountNumber,
          user: user._id,
          balance: 0
        });
        await newAccount.save();
      }
      res.json({ message: 'Registration successful. You can now login.' });
    } catch (err) {
      console.error('Error in registerBanking:', err);
      res.status(500).json({ error: 'Error during registration.' });
    }
  },

  login: async (req, res) => {
    try {
      const { accountNumber, loginPassword } = req.body;
      const user = await User.findOne({ accountNumber });
      if (!user) return res.status(404).json({ error: 'User not found.' });
      if (user.lockUntil && user.lockUntil > Date.now())
        return res.status(403).json({ error: 'Account temporarily locked. Please try again later.' });
      const isMatch = await bcrypt.compare(loginPassword, user.loginPassword || '');
      if (!isMatch) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 3) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await user.save();
          return res.status(403).json({ error: 'Account locked due to multiple invalid attempts. Try again after 15 minutes.' });
        }
        await user.save();
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      const token = jwt.sign({ id: user._id, accountNumber: user.accountNumber }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ message: 'Login successful.', token });
    } catch (err) {
      console.error('Error in login:', err);
      res.status(500).json({ error: 'Error during login.' });
    }
  },

  generateOTP: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found.' });
      const { otp, expiry } = generateOTP();
      user.otp = otp;
      user.otpExpiry = expiry;
      await user.save();
      const info = await transporter.sendMail({
        from: `"Online Banking" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Your OTP Code',
        text: `Hello ${user.fullName},\nYour OTP is: ${otp}\nIt is valid until ${expiry.toLocaleTimeString()}.`
      });
      console.log('OTP Email Preview URL:', nodemailer.getTestMessageUrl(info));
      res.json({ message: 'OTP generated and sent to your email.' });
    } catch (err) {
      console.error('Error generating OTP:', err);
      res.status(500).json({ error: 'Error generating OTP.' });
    }
  },

  forgotUserID: async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found.' });
      if (!user.otp || !user.otpExpiry || user.otp !== otp || user.otpExpiry < Date.now())
        return res.status(400).json({ error: 'Invalid or expired OTP.' });
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      const info = await transporter.sendMail({
        from: `"Online Banking" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'User ID Recovery',
        text: `Hello ${user.fullName},\nYour account number is: ${user.accountNumber}`
      });
      console.log('ForgotUserID Email Preview URL:', nodemailer.getTestMessageUrl(info));
      res.json({ message: 'User ID recovery email sent.', accountNumber: user.accountNumber });
    } catch (err) {
      console.error('Error in forgotUserID:', err);
      res.status(500).json({ error: 'Error processing forgotUserID.' });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email, otp, newPassword, confirmNewPassword } = req.body;
      if (newPassword !== confirmNewPassword)
        return res.status(400).json({ error: 'Passwords do not match.' });
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found.' });
      if (!user.otp || !user.otpExpiry || user.otp !== otp || user.otpExpiry < Date.now())
        return res.status(400).json({ error: 'Invalid or expired OTP.' });
      user.otp = null;
      user.otpExpiry = null;
      user.loginPassword = await bcrypt.hash(newPassword, 10);
      await user.save();
      const info = await transporter.sendMail({
        from: `"Online Banking" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Password Changed Successfully',
        text: `Hello ${user.fullName},\nYour password has been updated successfully.`
      });
      console.log('Password Change Email Preview URL:', nodemailer.getTestMessageUrl(info));
      res.json({ message: 'Password updated successfully. You can now login.' });
    } catch (err) {
      console.error('Error in forgotPassword:', err);
      res.status(500).json({ error: 'Error updating password.' });
    }
  }

  // Optionally, you can add a setNewPassword function if needed.
};

for (let i = 0; i < 30; i++) {
  console.log(`Auth module log entry ${i + 1}`);
}
