const mongoose = require("mongoose");

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connection established successfully!!!");
  } catch (error) {
    console.log("Unable to connect with the database...");
  }
};

module.exports = connectToDb;
