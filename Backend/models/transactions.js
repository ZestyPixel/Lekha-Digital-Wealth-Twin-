const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    amount: {
      type: Number,
      min: 0,
    },

    category: {
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

    riskReason: {
      type: String,
      trim: true,
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
