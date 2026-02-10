import mongoose from "mongoose";
import { env } from "./env.config.js";


const connectDB=async()=>{
    try{
        await mongoose.connect(env.MONGO_URI)
        console.log("Db connected")
    
}
    catch{
        console.log("failed to connect db")
        mongoose.connection.on("error",(err)=>{
            console.log("Not connected");
            console.log(err);
        })
    }
}

export default connectDB