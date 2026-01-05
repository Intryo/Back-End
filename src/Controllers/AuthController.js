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
        const user=new userModel({name,email,password:hashpassword});
        await user.save();
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn: '7d'});
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge:7*24*60*60*1000,
        })
        const mailoption={
             from: process.env.SENDER_EMAIL,
             to: email,
             subject: "Welcome to Our Community Intryo 🎉",
             text: `Hello ${name},
Welcome aboard! 👋
We’re excited to have you join us.

Your account has been successfully created, and you’re now part of a growing community where ideas, intent, and meaningful connections matter.

Here’s what you can do next:
• Complete your profile
• Explore posts and discussions
• Share your thoughts or ask for help

If you ever need assistance, feel free to reply to this email—we’re always here to help.

Thanks for joining us,
Warm regards,
The Team`, 
    }
    await transporter.sendMail(mailoption);
    return res.json({success:true,message:"Registration Complete"});

   } catch (error) {
       return  res.json({success:false,message:error.message})
    
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
        return res.json({success:false,message:"User Not Found!!! Please check or FUrther Registration "});
    }
    const ismatch=await bcrypt.compare(password,user.password);
    if(!ismatch){
        return res.status(401).json({success:false,message:"Invalid Password"});
    }
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn: '7d'});
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge:7*24*60*60*1000,
        })
      return res.json({success:true,message:"Login Complete",userId: user._id});
    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}

export const logout=async(req,res)=>{
try {
    res.clearCookie('token',
        {
            httpOnly:true,
            secure: process.env.NODE_ENV==='production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        })
        return res.json({success:true,message:"Logout"});
} catch (error) {
    return res.json({success:false,message:error.message})
}
}
export const sendverifyOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.json({ success: false, message: "User already verified" });
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

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "OTP send failed" });
  }
};


export const verifyMail=async(req,res)=>{
     const userId = req.user.id;
    const{otp}=req.body;
    if(!userId || !otp){
        return res.json({success:false,message:"missing details"});
    }
    try {
        const user=await userModel.findById(userId);
        if(!user){
            return res.json({success:false,message:"No user Found "});
        }
        if(user.verifyOtp===''||user.verifyOtp!==otp){
            return res.json({success:false,message:"invalid Otp"});
        }
        if(user.verifyOtpExpairy<Date.now()){
             return res.json({success:false,message:"otp expire"});
        }
        user.isverified=true;
        user.verifyOtp='';
        user.verifyOtpExpairy=0;
        await user.save();
        return res.json({success:true,message:"verified succesfully"});
    } catch (error) {
         return res.json({success:false,message:error.message})
    }

}
export const isAuthenticated=async(req,res)=>{
    try {
        return res.json({success:true,message:"Authenticated"})
    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}
export const sendResetOtp=async(req,res)=>{
    const {email}=req.body;
    if(!email){
        return res.json({success:false,message:"Email is Required"})
    }
    try {
        const user=await userModel.findOne({email});
        if(!user){
             return res.json({success:false,message:"User Not Found"});
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
        return res.json({success:true,message:"OTP Send to your email"})
    } catch (error) {
         return res.json({success:false,message:error.message})
    }
}

export const resetpass=async(req,res)=>{
    const {email,otp,newpassword}=req.body;
    if(!email || !otp || !newpassword){
        return res.json({success:false,message:"Missing Details "})
    }
    try {
        const user=await userModel.findOne({email});
        if(!user){
            return res.json({success:false,message:"User Not Found"})
        }
        if(user.resendOtp===''||user.resendOtp!==otp){
            return res.json({success:false,message:"otp does not match"})
        }
        if(user.resendOtpExpairy<Date.now()){
            return res.json({success:false,message:"Otp Expire"})
        }
        const hashedPassword=await bcrypt.hash(newpassword,10);
        user.password=hashedPassword;
        user.resendOtp="";
        user.resendOtppExpairy=0;
        await user.save();
        return res.json({success:true,message:"Password Reset succesfully"});
    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}