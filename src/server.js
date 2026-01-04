import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectdb from "./config/mongodb.js";
import authRoute from "./routes/auth.routes.js";
connectdb();
const app=express();
const port= process.env.PORT ||  4000;
console.log("JWT_SECRET =", process.env.JWT_SECRET);
app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials:true}));
app.use("/api/auth",authRoute);
app.get("/",(req,res)=>{
    res.send("Welcome to Our Website ")
})

app.listen(port,()=>{
    console.log(`You are in ${port}`);
    
})
