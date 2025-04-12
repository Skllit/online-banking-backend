/* dummyData/seed.js */
const connectDB = require('../config/db');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcrypt');

async function seedData() {
  try {
    await connectDB();
    await User.deleteMany({});
    await Account.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Seeding dummy data...');

    for (let i = 1; i <= 10; i++) {
      const newUser = new User({
        fullName: `Test User ${i}`,
        email: `user${i}@example.com`,
        mobile: `98765432${i < 10 ? '0' + i : i}`,
        aadhar: `1111-2222-33${i}`,
        dob: new Date(`1990-01-${i < 10 ? '0' + i : i}`),
        residentialAddress: `123 Test Street Apt ${i}`,
        permanentAddress: `456 Permanent Rd, City ${i}`,
        occupation: 'Engineer',
        isActive: i <= 5  // first five users are approved
      });
      newUser.loginPassword = await bcrypt.hash("password123", 10);
      newUser.transactionPassword = await bcrypt.hash("txn123", 10);
      await newUser.save();

      if (newUser.isActive) {
        const newAccount = new Account({
          accountNumber: newUser.accountNumber,
          user: newUser._id,
          balance: 1000 * i,
          accountType: 'Savings'
        });
        await newAccount.save();

        const tx = new Transaction({
          accountNumber: newAccount.accountNumber,
          type: 'credit',
          amount: 1000 * i,
          mode: 'NEFT',
          details: 'Initial credit from seed data'
        });
        await tx.save();
      }
    }
    console.log('Dummy data seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
