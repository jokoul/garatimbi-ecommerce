import express from "express";
import Product from "../models/productModel.js";
import data from "../data.js"; //It is IMPORTANT to proecise extension otherwise we face issues
import User from "../models/userModel.js";

//Create router
const seedRouter = express.Router();

//routes definition with controller as callback function
seedRouter.get("/", async (req, res) => {
  //first we remove all previous record product
  await Product.remove({}); //it means return all records inside product
  //create new product
  const createdProducts = await Product.insertMany(data.products); //we copy and paste data from data.js to our cloud mongodb
  await User.remove({}); //it means return all records inside product
  //create new User
  const createdUsers = await User.insertMany(data.users); //we copy and paste data from data.js to our cloud mongodb
  res.send({ createdUsers, createdProducts }); //send back answer to the frontend app
});

export default seedRouter;
