import express from "express";
import userauth from "../middleware/userAuth.js";
import { getUserById, getUserData } from "../Controllers/userController.js";
import { editprofile } from "../Controllers/AuthController.js";
import upload from "../middleware/multer.js";
const userRouter=express.Router();
userRouter.get("/data", userauth, getUserData);
userRouter.get("/:userId",getUserById)
userRouter.patch("/profile/edit",userauth,upload.single('profilepicture'),editprofile)
export default userRouter;
