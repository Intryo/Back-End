import jwt from "jsonwebtoken"
const userauth=async(req,res,next)=>{
    const token=req.cookies?.token;
    if(!token){
        return res.json({success:false,message:"Unauthrized Login"});
    }
    try {
        const tokenDecode=jwt.verify(token,process.env.JWT_SECRET);
        if(tokenDecode.id){
           req.user={id:tokenDecode.id};
        }
        else{
            return res.send({success:false,message:"Unauthorized Login"});
        }
        next();
        
    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}
export default userauth;