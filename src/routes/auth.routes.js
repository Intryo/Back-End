import express from "express"
import {register,login,logout, verifyMail, isAuthenticated, sendResetOtp, resetpass, refreshTokenController, resendOtp} from "../Controllers/AuthController.js";
import userauth from "../middleware/userAuth.js";

const authRoute=express.Router();
authRoute.post("/register", register);
authRoute.post("/resend-otp",resendOtp);
authRoute.post("/verify-account", verifyMail);
authRoute.post("/login", login);
authRoute.post("/logout", logout);
authRoute.post("/refresh-token", refreshTokenController);
authRoute.post("/is-auth", userauth, isAuthenticated);
authRoute.post("/send-reset-otp", sendResetOtp);
authRoute.post("/reset-password", resetpass);

export default authRoute;
