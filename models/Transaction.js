/* models/Transaction.js */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, default: uuidv4, unique: true },
  accountNumber: { type: String, required: true },
  type: { type: String, enum: ['debit', 'credit'], default: 'debit' },
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['NEFT', 'RTGS', 'IMPS', 'CASH'], default: 'NEFT' },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'failed', 'completed'], default: 'completed' },
  details: { type: String }
});

module.exports = mongoose.model('Transaction', transactionSchema);
