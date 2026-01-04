import express from "express"
import {register,login,logout, sendverifyOtp, verifyMail, isAuthenticated, sendResetOtp, resetpass} from "../Controllers/AuthController.js";
import userauth from "../middleware/userAuth.js";

const authRoute=express.Router();
authRoute.post("/register",register);
authRoute.post("/login",login);
authRoute.post("/logout",logout);
authRoute.post("/send-verify-otp",userauth,sendverifyOtp);
authRoute.post("/verify-account",userauth,verifyMail);
authRoute.post("/is-auth",userauth,isAuthenticated);
authRoute.post("/send-reset-otp",sendResetOtp);
authRoute.post("/reset-password",resetpass)
export default authRoute;
