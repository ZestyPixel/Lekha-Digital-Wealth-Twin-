const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    type: {
      type: String,
      enum: ["Lumpsum", "SIP", "Transfer", "Withdraw", "Expense"],
    },

    amount: {
      type: Number,
      min: 0,
    },

    category: {
      type: String,
      trim: true,
    },

    fundName: {
      type: String,
      trim: true,
    },

    assetType: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Blocked", "Flagged", "Fake-Success"],
      default: "Pending",
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    riskReasons: [{ type: String }],

    securityDecision: {
      type: String,
      enum: ["ALLOW", "WARN", "BLOCK", "OTP-Verified"],
    },

    isDuress: {
      type: Boolean,
      default: false,
    },

    metadata: {
      location: {
        lat: Number,
        lng: Number,
      },

      deviceIP: {
        type: String,
      },

      evidenceUrl: {
        type: String,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", transactionSchema);
