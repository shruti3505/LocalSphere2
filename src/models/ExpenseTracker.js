const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  budgetLimit: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  expenses: [{
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    amount: Number,
    category: String,
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('ExpenseTracker', expenseSchema);