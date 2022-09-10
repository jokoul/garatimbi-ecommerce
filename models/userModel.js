import mongoose from "mongoose";

//We create Schema for our product
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, //get rid of unique because two user can have same name
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
  },
  {
    //in this object we define all options we need
    timestamps: true, //this option allow to set automatically the created_at and updated_at fields
  }
);

//Create model based on this schema
const User = mongoose.model("User", userSchema);

export default User;
