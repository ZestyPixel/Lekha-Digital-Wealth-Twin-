const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    fundName: {
      type: String,
      required: true,
      trim: true,
    },

    assetType: {
      type: String,
      enum: ["MutualFund", "Stocks", "Gold"],
      required: true,
    },

    amountInvested: {
      type: Number,
      required: true,
      min: 0,
    },

    currentValue: {
      type: Number,
      required: true,
      min: 0,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Active", "PartiallyRedeemed", "Redeemed"],
      default: "Active",
    },

    redeemedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // MF-specific fields for NAV tracking
    schemeCode: {
      type: String,
      trim: true,
    },

    isin: {
      type: String,
      trim: true,
    },

    navAtPurchase: {
      type: Number,
    },

    unitsPurchased: {
      type: Number,
    },

    schemeName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Investment", investmentSchema);
