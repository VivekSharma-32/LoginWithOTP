const express = require("express");
const {
  signupController,
  signinController,
} = require("../controllers/userController");
const router = express.Router();

router.post("/register", signupController);
router.post("/login", signinController);

module.exports = router;
