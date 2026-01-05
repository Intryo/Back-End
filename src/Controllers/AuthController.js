import userModel from "../Models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";

export const register=async(req,res)=>{
    const {name,email,password}=req.body;
    if(!name || !email || !password){
        return res.status(400).json({success:false,message:"Missing Details. Required Field Must be submitted"});
    }
   try {
        const existing_user=await userModel.findOne({email});
        if(existing_user){
            return res.status(409).json({success:false,message:"User already Exist, Please Login"});
        }
        const hashpassword=await bcrypt.hash(password,10);
        const user=await userModel.create({name,email,password:hashpassword,isVerified:false});
        const otp=String(Math.floor(100000+Math.random()*900000));
        user.verifyOtp=otp;
        user.verifyOtpExpairy=Date.now()+24*60*60*1000;
        await user.save();
        const mailoption={
             from: process.env.SENDER_EMAIL,
             to: email,
             subject: "Verify your Intryo account 🔐",
             text: `Hello ${name},

Welcome to Intryo 👋

Your One-Time Password (OTP) to verify your email is:

👉 ${otp}

This OTP is valid for 10 minutes.
Please do not share it with anyone.

— Team Intryo`
    }
    await transporter.sendMail(mailoption);
    return res.status(201).json({success:true,message:" Otp Send to Mail",next:"Verify_OTP"});

   } catch (error) {
       return  res.status(500).json({success:false,message:error.message})
    
   }

}

export const login=async(req,res)=>{
    try {
        const{email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({success:false,message:"Details Missing."});
    }
    const user=await userModel.findOne({email});
    if(!user){
        return res.status(404).json({success:false,message:"User Not Found!!! Please check or FUrther Registration "});
    }
    const ismatch=await bcrypt.compare(password,user.password);
    if(!ismatch){
        return res.status(401).json({success:false,message:"Invalid Password"});
    }
    
    const accessToken = jwt.sign({ id: user._id },process.env.JWT_SECRET,{ expiresIn:"15m" });
    const refreshToken = jwt.sign({ id: user._id },process.env.JWT_REFRESH_SECRET,{ expiresIn: "7d" });

        res.cookie("token", accessToken, {
             httpOnly: true,
             secure: process.env.NODE_ENV === "production",
             sameSite: "lax",
             maxAge: 15 * 60 * 1000
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

      return res.status(200).json({success:true,message:"Login Complete",userId: user._id});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message})
    }
}
export const logout = async (req, res) => {
        try {
         const cookieOptions = {
             httpOnly: true,
             secure: process.env.NODE_ENV === "production",
             sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        };

            res.clearCookie("token", cookieOptions);
            res.clearCookie("refreshToken", cookieOptions);

            return res.status(200).json({success: true,message: "Logout successful",});
             } 
        catch (error) {
          return res.status(500).json({
            success: false,
            message: error.message,
          });
        }
};

export const sendverifyOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const OTP_EXPIRY_MINUTES = 24 * 60;

    user.verifyOtp = otp;
    user.verifyOtpexpairy = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
    await user.save();

    const mailoption = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Verify Your Email – OTP Inside 🔐",
      text: `Hello,

Your OTP for email verification is: ${otp}
.
Please do not share it with anyone.

Regards,
The Team`
    };

    await transporter.sendMail(mailoption);

    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "OTP send failed" });
  }
};


export const verifyMail=async(req,res)=>{
     const userId = req.user.id;
    const{otp}=req.body;
    if(!userId || !otp){
        return res.status(400).json({success:false,message:"missing details"});
    }
    try {
        const user=await userModel.findById(userId);
        if(!user){
            return res.status(404).json({success:false,message:"No user Found "});
        }
        if(user.verifyOtp===''||user.verifyOtp!==otp){
            return res.status(400).json({success:false,message:"invalid Otp"});
        }
        if(user.verifyOtpExpairy<Date.now()){
             return res.status(400).json({success:false,message:"otp expire"});
        }
        user.isVerified=true;
        user.verifyOtp='';
        user.verifyOtpExpairy=0;
        await user.save();
        return res.status(200).json({success:true,message:"verified succesfully"});
    } catch (error) {
         return res.status(500).json({success:false,message:error.message})
    }

}
export const isAuthenticated=async(req,res)=>{
    try {
        return res.status(200).json({success:true,message:"Authenticated"})
    } catch (error) {
        return res.status(500).json({success:false,message:error.message})
    }
}
export const sendResetOtp=async(req,res)=>{
    const {email}=req.body;
    if(!email){
        return res.status(400).json({success:false,message:"Email is Required"})
    }
    try {
        const user=await userModel.findOne({email});
        if(!user){
             return res.status(404).json({success:false,message:"User Not Found"});
        }
        const otp=String(Math.floor(10000+Math.random()*900000));
        user.resendOtp=otp;
        user.resendOtpExpairy=Date.now()+15*60*1000;
        await user.save();
        const mailOption={
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Password Reset OTP",
        text: `Your Reset Otp is ${otp}`
        }
        await transporter.sendMail(mailOption);
        return res.status(200).json({success:true,message:"OTP Send to your email"})
    } catch (error) {
         return res.status(500).json({success:false,message:error.message})
    }
}

export const resetpass=async(req,res)=>{
    const {email,otp,newpassword}=req.body;
    if(!email || !otp || !newpassword){
        return res.status(400).json({success:false,message:"Missing Details "})
    }
    try {
        const user=await userModel.findOne({email});
        if(!user){
            return res.status(404).json({success:false,message:"User Not Found"})
        }
        if(user.resendOtp===''||user.resendOtp!==otp){
            return res.status(400).json({success:false,message:"otp does not match"})
        }
        if(user.resendOtpExpairy<Date.now()){
            return res.status(400).json({success:false,message:"Otp Expire"})
        }
        const hashedPassword=await bcrypt.hash(newpassword,10);
        user.password=hashedPassword;
        user.resendOtp="";
        user.resendOtppExpairy=0;
        await user.save();
        return res.status(200).json({success:true,message:"Password Reset succesfully"});
    } catch (error) {
        return res.status(500).json({success:false,message:error.message})
    }
}
export const refreshTokenController = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "No refresh token" });
         }

         try {
                 const decoded = jwt.verify(refreshToken,process.env.JWT_REFRESH_SECRET);
                 const newAccessToken = jwt.sign({ id: decoded.id },process.env.JWT_SECRET,{expiresIn: "15m" });

            res.cookie("token", newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 15 * 60 * 1000
            });

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid refresh token" });
  }
};
