const mongoose = require("mongoose");

const logsSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },

    action: {
      type: String,
      trim: true,
    },

    signalsDetected: {
      type: [String],
      default: [],
    },

    outcome: {
      type: String,
      enum: ["Allowed", "Blocked", "Flagged"],
    },

    userNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Log", logsSchema);
