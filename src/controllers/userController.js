import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import  nodemailer from "nodemailer";
import validator from "validator";
const crypto=require("crypto");


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



//register
const registerUser=async(req,res)=>{
    try{
        const{email,password}=req.body;
        if(!email || !password){
            return res.json({success:false,message:"Missing details."})
        }
    

        if(!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email." })
        }

        const users={}
        const transporter=nodemailer.createTransport({
            service:gmail,
            auth:{
                user:''
            }

        });
     
        const generateOTP=()=>{

            return Math.floor(100000+Math.random()*900000);
        };
        
        app.post('/send-otp',(req,res)=>{
            const{email}=req.body;
            //generate otp
            const otp=generateOTP();

            users[email] = {otp, verified: false};
            const mailOptions={
                from:'leepakshirath3@gmail.com',
                to:email,
                subject:'Email verification OTP',
                text:`Your email verification OTP is ${otp}`

            };

            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.error("Error");
                    res.status(500).send("Failed to send OTP.");

                }
                console.log("Email sent "+info.response);
                res.status(200).send("OTP sent sucessfully.");


            });

            
        });
        app.post('/verifyOTP',(req,res)=>{
            const {email,otp}=req.body;
            if(!user[email]){
                return res.status(200).send("User not found.");

            }
            if(user[email].otp===parseInt(otp)){
                user[email].verified=true;
                return res.status(200).send("Otp verified successfully.");

            }else{
                return res.status(401).send("Invalid OTP");
            }


        });







        if(password.length<8){
            return res.json({success:false,message:"Please enter a valid password."})
        }
        const salt = await bcrypt.genSalt(5);
        const hashedPassword=await bcrypt.hash(password,salt);

        const userData={
            email,
            password:hashedPassword
        };
    
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


//login
const loginUser=async(req,res)=>{

    try{
        const{email,password}=req.body;
        const user=userModel.findOne({email});
        if(!user){
            res.json({success:false,message:"User does not exist."});

        }
        const isMatch=await bcrypt.compare(password,user.password);

        if(isMatch){
            const token=jwt.sign({id:user._id,},process.env.JWT_Secret)
            res.json({success:true,token})
        }else{
            res.json({success:false,message:"Invalid Credentials."})
        }
    }catch(error){
        res.json({succes:false,message:error.message});
    }


    

}


const forgotPassword=async(req,res)=>{
    try{
        const{email}=req.body;
        const user=userModel.findOne({email});
        if (!user){
            res.json({success:false,message:"Email ID does not exist!!!"});

        }else{
            const{newPassword}=req.body;

        }
        if(newPassword.length<8){
            res.json({success:false,message:"Enter a valid Password."});

        }

        const salt=await bcrypt.genSalt(10);
        const hashedPasswordNew=await bcrypt.hash(newPassword,salt);

        const userData={
            email,
            password=hashedPasswordNew,
        };

    }catch(error){
        res.json({success:false,message:error.message})
    }

}
