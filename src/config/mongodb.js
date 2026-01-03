import mongoose from "mongoose";
const connectdb=async()=>{
    try {
        mongoose.connection.on("connected",()=>{
            console.log("Database Connected");
        })
         await mongoose.connect(`${process.env.MONGODB_URI}/intryo_userAuth`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
export default connectdb;