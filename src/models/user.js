const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    otpSecret: {
      type: String,
    },
    otpGenerationTime: {
      type: Date,
    },
    wrongOtpAttempts: {
      type: Number,
      default: 0,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
