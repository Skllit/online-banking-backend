/* controllers/fundTransferController.js */
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

module.exports = {
  addPayee: (req, res) => {
    if (!req.user)
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    const { beneficiaryName, beneficiaryAccount, nickname } = req.body;
    if (!beneficiaryName || !beneficiaryAccount)
      return res.status(400).json({ error: 'Please provide beneficiary details.' });
    if (!req.session.payees)
      req.session.payees = [];
    req.session.payees.push({
      beneficiaryName,
      beneficiaryAccount,
      nickname: nickname || beneficiaryName
    });
    res.json({ message: 'Payee added successfully.' });
  },

  fundTransfer: async (req, res) => {
    try {
      if (!req.user)
        return res.status(401).json({ error: 'Unauthorized. Please login.' });
      const { fromAccount, toAccount, amount, mode } = req.body;
      if (!fromAccount || !toAccount || !amount || !mode)
        return res.status(400).json({ error: 'Incomplete transaction details.' });
      
      const transferAmount = Number(amount);
      const serviceCharge = transferAmount * 0.01;  // 1% service charge
      const hiddenCharge = transferAmount * 0.005;    // 0.5% hidden charge
      const totalDeduction = transferAmount + serviceCharge + hiddenCharge;
      
      const senderAccount = await Account.findOne({ accountNumber: fromAccount });
      if (!senderAccount)
        return res.status(404).json({ error: 'Sender account not found.' });
      if (senderAccount.balance < totalDeduction)
        return res.status(400).json({ error: 'Insufficient funds including service and hidden charges.' });
      
      // Deduct total amount from sender account
      senderAccount.balance -= totalDeduction;
      await senderAccount.save();
      
      // Record a debit transaction for the transfer amount
      const transferDebitTx = new Transaction({
        accountNumber: fromAccount,
        type: 'debit',
        amount: transferAmount,
        mode,
        details: `Transfer of $${transferAmount} to account ${toAccount}`
      });
      await transferDebitTx.save();
      
      // Record separate debit transactions for the charges
      const serviceChargeTx = new Transaction({
        accountNumber: fromAccount,
        type: 'debit',
        amount: serviceCharge,
        mode,
        details: 'Service Charge'
      });
      await serviceChargeTx.save();
      
      const hiddenChargeTx = new Transaction({
        accountNumber: fromAccount,
        type: 'debit',
        amount: hiddenCharge,
        mode,
        details: 'Hidden Charge'
      });
      await hiddenChargeTx.save();
      
      // Credit the beneficiary with the full transfer amount
      const beneficiaryAccount = await Account.findOne({ accountNumber: toAccount });
      if (beneficiaryAccount) {
        beneficiaryAccount.balance += transferAmount;
        await beneficiaryAccount.save();
        const creditTx = new Transaction({
          accountNumber: toAccount,
          type: 'credit',
          amount: transferAmount,
          mode,
          details: `Received $${transferAmount} from account ${fromAccount}`
        });
        await creditTx.save();
      }
      
      res.json({
        message: `Transfer successful. Service Charge: $${serviceCharge.toFixed(2)} and Hidden Charge: $${hiddenCharge.toFixed(2)} applied.`,
        newBalance: senderAccount.balance,
        charges: {
          serviceCharge: serviceCharge.toFixed(2),
          hiddenCharge: hiddenCharge.toFixed(2)
        }
      });
    } catch (err) {
      console.error('Error in fundTransfer:', err);
      res.status(500).json({ error: 'Error processing fund transfer.' });
    }
  }
};

for (let j = 0; j < 15; j++) {
  console.log(`Fund Transfer logging entry ${j + 1}`);
}
