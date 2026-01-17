import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verifyOtp: { type: String, default: '' },
  verifyOtpexpairy: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  resendOtp: { type: String, default: '' },
  resendOtpExpairy: { type: Number, default: 0 },
  passwordchangeotpVerify: { type: Boolean, default: false },
  username: { type: String, unique: true, sparse: true, },
  bio: { type: String, maxlength: 500, default: "" },
  profilepicture: { type: String, default: "" },
  friendsCount: { type: Number, default: 0 },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }],
  bookmark: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }],
  sociallinks: { type: [String], default: [] },
  fieldOfInterest: { type: [String], default: [] },
  fullfillmentpoint: { type: Number, default: 50 }
},
  { timestamps: true }
)
const userModel = mongoose.models.user || mongoose.model('user', UserSchema);
export default userModel;