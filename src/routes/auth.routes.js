import express from "express"
import {register,login,logout, sendverifyOtp, verifyMail} from "../Controllers/AuthController.js";
import userAuth from "../../middleware/userAuth.js";
const authRoute=express.Router();
authRoute.post("/register",register);
authRoute.post("/login",login);
authRoute.post("/logout",logout);
authRoute.post("/send-verify-otp",userAuth,sendverifyOtp);
authRoute.post("/verify-account",userAuth,verifyMail);
export default authRoute;