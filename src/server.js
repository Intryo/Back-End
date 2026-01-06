import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectdb from "./config/mongodb.js";
import authRoute from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
connectdb();
const app=express();
const port= process.env.PORT ||  4000;
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

console.log("JWT_SECRET =", process.env.JWT_SECRET);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRoute);
app.use('/api/user',userRouter)
app.get("/",(req,res)=>{
    res.send("Welcome to Our Website ")
})

app.listen(port,()=>{
    console.log(`You are in ${port}`);
    
})
