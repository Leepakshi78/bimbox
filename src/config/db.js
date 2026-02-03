import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Db connected")
    //     mongoose.connection.on('connected',()=>
    //         {
    //             console.log("Database connected");
    //         }
        
    // )
    // mongoose.connection.on("")
}
    catch{
        console.log("failed to connect db")
        mongoose.connection.on("error",(err)=>{
            console.log("Not connected");
        })
    }
}

export default connectDB