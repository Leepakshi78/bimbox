import mongoose from "mongoose";

const userSchema=new mongoose.schema({
    email:{type:String, required: true,unique:true},
    password:{type:String,required:true},
    //otp: String,
    //otpExpiration: Date,

});
const userModel=mongoose.models.user || mongoose.model("user",userSchema);
export default userModel;
