import userModel from "../Models/UserModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
      return res.json({success:true,message:"Registration Complete"});

   } catch (error) {
       return  res.json({success:false,message:error.message})
    
   }

}

export const Login=async(req,res)=>{
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
      return res.json({success:true,message:"Login Complete"});
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
