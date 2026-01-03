import express from "express"
import {register,login,logout} from "../Controllers/AuthController.js";
const authRoute=express.Router();
authRoute.get("/register",register);
authRoute.get("/login",login);
authRoute.get("/logout",logout);
export default authRoute;