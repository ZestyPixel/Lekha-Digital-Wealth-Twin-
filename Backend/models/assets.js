import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["Bank Account", "Gold", "Stocks", "Real Estate"],
      required: true,
    },

    currentValue: {
      type: Number,
      required: true,
      min: 0,
    },

    isManualEntry: {
      type: Boolean,
      default: true,
    },

    institution: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);