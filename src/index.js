import express from "express";
import connectDB from "./config/db.js";
import cors from 'cors';
import 'dotenv/config';
import userRouter from "./routes/userRoute.js";



const app=express();

const port=6001;

connectDB()


app.use(express(json));
app.use(cors());

app.use("/api/user/",userRouter);





app.get('/',(req,res)=>{
    res.status(200).send("The site is working finely");

});


app.listen(port,()=>{
    console.log(`Listening on ${port}`);
});
