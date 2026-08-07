const mongoose = require("mongoose");

const sipSchema = new mongoose.Schema(
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

    monthlyAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    sipDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },

    status: {
      type: String,
      enum: ["Active", "Paused", "Stopped"],
      default: "Active",
    },

    startDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Sip", sipSchema);
