import express from "express";
//Cloudinary is an end-to-end image- and video-management solution for websites and mobile apps,
//covering everything from image and video uploads, storage, manipulations, optimizations to delivery.
import { v2 as cloudinary } from "cloudinary";
//allow to Converts a Buffer/String into a readable stream
import streamifier from "streamifier";
//multer is a package to handle upload file
import multer from "multer";
import { isAdmin, isAuth } from "../Utils.js";

const upload = multer();

//Create router
const uploadRouter = express.Router();

//routes definition with controller and several checking middleware
uploadRouter.post(
  "/",
  isAuth,
  isAdmin,
  upload.single("file"),
  async (req, res) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    //stream upload fn
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        //call upload_stream fn
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result); //if everything ok return result
          } else {
            reject(error); //if not return error
          }
        });
        //Call createReadStream from streamifier to use it on the buffer in req.file and pipe it to the stream
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };
    //run the fn
    const result = await streamUpload(req);
    res.send(result);
  }
);

export default uploadRouter;
