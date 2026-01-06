import express from "express";
import userauth from "../middleware/userAuth.js";
import { getUserById, getUserData } from "../Controllers/userController.js";
const userRouter=express.Router();
userRouter.get("/data", userauth, getUserData);
userRouter.get("/:userId",getUserById)
export default userRouter;
