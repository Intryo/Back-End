import mongoose from "mongoose";
const UserSchema=new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true,unique:true},
    password:{type:String,required:true},
    verifyOtp:{type:String,default:''},
    verifyOtpexpairy:{type:Number,default:0},
    isVerified:{type:Boolean,default:false},
    resendOtp:{type:String,default:''},
    resendOtpExpairy:{type:Number,default:0},
})
const userModel=mongoose.models.user|| mongoose.model('user',UserSchema);
export default userModel;