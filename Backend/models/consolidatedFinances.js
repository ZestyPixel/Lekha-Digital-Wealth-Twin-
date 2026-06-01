const mongoose = require('mongoose');

const financesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },

    // Raw computed values
    bankBalance: {
      type: Number,
    },

    investedAssets: {
      type: Number,
    },

    totalAssets: {
      type: Number,
    },

    totalMonthlyEMI: {
      type: Number,
    },

    totalRemainingBalance: {
      type: Number,
    },

    // Derived ratios & metrics
    savingsRate: {
      type: Number,
    },

    essentialExpenses: {
      type: Number,
    },

    emergencyMonths: {
      type: Number,
    },

    discretionaryRate: {
      type: Number,
    },

    investmentRatio: {
      type: Number,
    },

    dtiRatio: {
      type: Number,
    },

    netWorth: {
      type: Number,
    },

    hasBadDebt: {
      type: Boolean,
      default: false,
    },

    // Score output
    score: {
      type: Number,
      min: 0,
      max: 100,
    },

    breakdown: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Finances", financesSchema);