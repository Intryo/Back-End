import userModel from "../Models/UserModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register=async(req,res)=>{
    const {name,email,password}=req.body;
    if(!name || !email || !password){
        return res.json({success:false,message:"Missing Details. Required Field Must be submitted"});
    }
   try {
        const existing_user=await userModel.findOne({email});
        if(existing_user){
            return res.json({success:false,message:"User already Exist, Please Login"});
        }
        const hashpassword=await bcrypt.hash(password,10);
        const user=new userModel({name,email,password:hashpassword});
        await user.save();
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn: '7d'});
        res.cookies('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:none,
            maxAge:7*24*60*60*100
        })
      return res.json({success:true,message:"Registration Complete"});

   } catch (error) {
        res.json({success:false,message:error.message})
    
   }

}

