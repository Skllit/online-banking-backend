/* controllers/adminController.js */
const User = require('../models/User');
const Account = require('../models/Account');

module.exports = {
  adminHome: async (req, res) => {
    try {
      const pendingUsers = await User.find({ isActive: false });
      res.json({ pendingUsers });
    } catch (err) {
      console.error('Error in adminHome:', err);
      res.status(500).json({ error: 'Error loading admin dashboard.' });
    }
  },

  approveAccount: async (req, res) => {
    try {
      const { accountNumber } = req.body;
      const user = await User.findOne({ accountNumber });
      if (!user) return res.status(404).json({ error: 'User not found.' });
      user.isActive = true;
      await user.save();
      let account = await Account.findOne({ accountNumber });
      if (!account) {
        account = new Account({ accountNumber, user: user._id, balance: 0 });
        await account.save();
      }
      res.json({ message: `Account ${accountNumber} approved successfully.` });
    } catch (err) {
      console.error('Error in approveAccount:', err);
      res.status(500).json({ error: 'Error approving account.' });
    }
  },

  disapproveAccount: async (req, res) => {
    try {
      const { accountNumber } = req.body;
      await User.findOneAndDelete({ accountNumber });
      res.json({ message: `Account ${accountNumber} disapproved and removed.` });
    } catch (err) {
      console.error('Error in disapproveAccount:', err);
      res.status(500).json({ error: 'Error disapproving account.' });
    }
  }
};

for (let k = 0; k < 20; k++) {
  console.log(`Admin module log ${k + 1}`);
}
