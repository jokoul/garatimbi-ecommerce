import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import seedRouter from "./routes/seedRoutes.js";
import productRouter from "./routes/productRoutes.js";
import userRouter from "./routes/userRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import cors from "cors";

//call config method to fetch all Environment Variable define in .env
dotenv.config();

//connection to mongodb database
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connection to db");
  })
  .catch((err) => {
    console.log(err.message);
  });

//we create server app
const app = express();

//configuration middleware
app.use(express.json()); //change all request content-type from json string to javascript object
app.use(express.urlencoded({ extended: true }));
app.use(cors()); //to enable frontend app and backend app communication

//Paypal api
app.get("/api/keys/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "sb");
});
//Google Maps api
app.get("/api/keys/google", (req, res) => {
  res.send({ key: process.env.GOOGLE_API_KEY || "" });
});

//api to seed our database
app.use("/api/upload", uploadRouter);

//api to seed our database
app.use("/api/seed", seedRouter);

//middleware get to send an anwser if this endpoint is hit by frontend app
// app.get("/api/products", (req, res) => {
//   res.send(data.products);
// });
app.use("/api/products", productRouter);

//middleware to manage user request
app.use("/api/users", userRouter);

//middleware to manage order request
app.use("/api/orders", orderRouter);

//get the current directory path
const __dirname = path.resolve();
//to serve all files inside frontend build folder as static file (images, script files, html file,etc.)
app.use(express.static(path.join(__dirname, "/frontend/build")));
//this route allows to redirect user and serve index.html if everything user enter after website domain doesn't correspond to any existing route.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/build/index.html"));
});

//Middleware to Define an error handler thanks this package "express-async-handler"
app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message }); //500 means server error
});

//define port
const port = process.env.PORT || 5000; //use free port if available or use port 5000

//to make server listening request
app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});
