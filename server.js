const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const connectToDb = require("./src/config/config");

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectToDb();

app.use("/auth", require("./src/routes/user"));
const PORT = process.env.PORT || 5000;

// Listen the server
app.listen(PORT, () => {
  console.log(`Server is running port: ${PORT}`);
});
