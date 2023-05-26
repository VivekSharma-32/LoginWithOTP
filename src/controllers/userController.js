const User = require("../models/user");
const nodemailer = require("nodemailer");
const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");
const { generateJWTToken } = require("../middleware/auth");
const secretkey = "irshad09";
const signupController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.send({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Email already exists. Please login",
      });
    }

    const lastOtpGenerationTime = new Date().getTime() - 60 * 1000;
    const lastUserOtp = await User.findOne({
      email,
      otpGenerationTime: { $gte: lastOtpGenerationTime },
    });
    if (lastUserOtp) {
      return res.status(429).send({
        success: false,
        message: "Please wait for 1 minute before generating a new OTP.",
      });
    }
    // Generate OTP
    const secret = speakeasy.generateSecret({ length: 20 });
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32",
      window: 5 * 60, // OTP valid for 5 minutes
    });
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "vivek.sharma1275@gmail.com",
        pass: "sccilgawfzqevgzj",
      },
    });
    const options = {
      from: "vivek.sharma1275@gmail.com",
      to: email,
      subject: "Login OTP",
      text: `Your OTP for login is: ${token}`,
    };

    transporter.sendMail(options, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send("Failed to send OTP.");
      }
      console.log("OTP sent:", info.response);
      return res.status(200).send("OTP sent to your email.");
    });
    const user = await new User({
      email,
      otpSecret: secret.base32,
      otpGenerationTime: new Date(),
    }).save();

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
const signinController = async function (req, res) {
  try {
    const { email, otp } = req.body;

    const findUser = await User.findOne({ email });

    if (!findUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (findUser.blockedUntil && findUser.blockedUntil > Date.now()) {
      const remainingTime = Math.ceil(
        (findUser.blockedUntil - Date.now()) / 1000 / 60
      );
      return res.status(403).json({
        success: false,
        message:
          "Account blocked. Please try again after " +
          remainingTime +
          " minutes",
      });
    }

    const verified = speakeasy.totp.verify({
      secret: findUser.otpSecret,
      encoding: "base32",
      token: otp,
      window: 5 * 60,
    });

    const otpExpirationTime =
      findUser.otpGenerationTime.getTime() + 5 * 60 * 1000;
    // OTP is valid for 5 minutes
    if (Date.now() > otpExpirationTime) {
      return res.status(401).json({
        success: false,
        message: "OTP has expired",
      });
    }
    if (!verified) {
      findUser.wrongOtpAttempts += 1;

      if (findUser.wrongOtpAttempts >= 5) {
        findUser.blockedUntil = new Date(Date.now() + 60 * 60 * 1000); // Blocked for 1 hour
      }

      await findUser.save();

      const attemptsRemaining = 5 - findUser.wrongOtpAttempts;

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining,
      });
    }

    findUser.wrongOtpAttempts = 0;
    await findUser.save();

    const token = generateJWTToken(findUser);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
module.exports = { signinController, signupController };
