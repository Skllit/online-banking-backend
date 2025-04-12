/* controllers/dashboardController.js */
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcrypt');
const transporter = require('../utils/mailer'); // Reuse our SMTP transporter from utils/mailer.js

module.exports = {
  dashboard: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const account = await Account.findOne({ accountNumber: user.accountNumber });
      res.json({ user, account });
    } catch (err) {
      console.error('Error in dashboard:', err);
      res.status(500).json({ error: 'Error loading dashboard.' });
    }
  },

  accountStatement: async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const user = await User.findById(req.user.id);
      const transactions = await Transaction.find({
        accountNumber: user.accountNumber,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).sort({ date: -1 });
      res.json({ transactions });
    } catch (err) {
      console.error('Error in accountStatement:', err);
      res.status(500).json({ error: 'Error fetching statement.' });
    }
  },

  accountSummary: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const account = await Account.findOne({ accountNumber: user.accountNumber });
      const recentTransactions = await Transaction.find({ accountNumber: account.accountNumber })
        .sort({ date: -1 })
        .limit(5);
      // Calculate total service charge transactions (with details: "Service Charge")
      const serviceTxs = await Transaction.find({
        accountNumber: account.accountNumber,
        details: "Service Charge"
      });
      const totalServiceCharges = serviceTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
      res.json({ account, recentTransactions, totalServiceCharges });
    } catch (err) {
      console.error('Error in accountSummary:', err);
      res.status(500).json({ error: 'Error retrieving summary.' });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword, confirmNewPassword } = req.body;
      if (newPassword !== confirmNewPassword)
        return res.status(400).json({ error: 'New passwords do not match.' });
      const user = await User.findById(req.user.id);
      const isMatch = await bcrypt.compare(oldPassword, user.loginPassword || '');
      if (!isMatch)
        return res.status(400).json({ error: 'Incorrect old password.' });
      user.loginPassword = await bcrypt.hash(newPassword, 10);
      await user.save();
      const info = await transporter.sendMail({
        from: `"Online Banking" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Password Changed Successfully',
        text: `Hello ${user.fullName},\nYour password has been updated successfully.`
      });
      console.log('Password Change Email Preview URL:', nodemailer.getTestMessageUrl(info));
      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      console.error('Error in changePassword:', err);
      res.status(500).json({ error: 'Error updating password.' });
    }
  },

  addCash: async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(amount) || Number(amount) <= 0)
        return res.status(400).json({ error: 'Invalid amount.' });
      const user = await User.findById(req.user.id);
      const account = await Account.findOne({ accountNumber: user.accountNumber });
      account.balance += Number(amount);
      await account.save();
      // Create a transaction for cash addition
      const tx = new Transaction({
        accountNumber: account.accountNumber,
        type: 'credit',
        amount: Number(amount),
        mode: 'CASH',
        details: 'Cash added'
      });
      await tx.save();
      const info = await transporter.sendMail({
        from: `"Online Banking" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Cash Added Notification',
        text: `Hello ${user.fullName},\nAn amount of $${amount} has been added to your account.`
      });
      console.log('Cash Addition Email Preview URL:', nodemailer.getTestMessageUrl(info));
      res.json({ message: `Successfully added $${amount} to your account.`, balance: account.balance });
    } catch (err) {
      console.error('Error in addCash:', err);
      res.status(500).json({ error: 'Error adding cash.' });
    }
  },

  logout: (req, res) => {
    // For JWT, the client must discard the token.
    res.json({ message: 'Logged out successfully. Please discard your token.' });
  }
};

for (let i = 0; i < 10; i++) {
  console.log(`Dashboard debug log ${i + 1}`);
}
