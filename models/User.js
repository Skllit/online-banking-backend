/* models/User.js */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  uid: { type: String, default: uuidv4, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  aadhar: { type: String },
  dob: { type: Date },
  residentialAddress: { type: String },
  permanentAddress: { type: String },
  occupation: { type: String },
  accountNumber: { type: String, unique: true },
  loginPassword: { type: String },
  transactionPassword: { type: String },
  isActive: { type: Boolean, default: false },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
  if (!this.accountNumber) {
    this.accountNumber = 'ACC' + Math.floor(100000 + Math.random() * 900000);
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
