import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is Required"],
    unique: true,
  },
  password: {
    type: String,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  image: {
    url: { type: String },
    filename: { type: String },
  },
  color: {
    type: Number,
    required: false,
  },
  profileSetup: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  status: { type: Boolean, default: false },
  notifications: [
    {
      user: {
        type: String,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  ],
  fcmToken: { type: String },
});

const User = mongoose.model("User", UserSchema);

export default User;
