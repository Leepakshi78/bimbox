//importing the required libraries 
//worker->listens to bullmq queues
//nodemailer->used to send email
//redis->to connnect with redis server
import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import { redisConnection } from "../config/redis.js";


//creating email transporter 
//this transporter will help us to send email ,using the email credenetials from env variables 
const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS,
    },
});

//create worker 
//worker will listen to the email queue whenever any job will be listed worker will process that job 

new Worker(
    "emailQueue",

    //job processor function
    //this function will run when any job will arrive

    async(job)=>{

        console.log("Job received:", job.name);
        //extract job data
        const {email,name,status}=job.data;

        console.log("Preparing email for:", email);

        let subject="";
        let message="";
        

        //email content based on user status 

        if(status === "Suspended"){
            subject="Account Suspended";
            message=`Hello,
            Your account has been suspended by the adminstrator.
            
            If you believe this is a mistake,Please contact support.
            Thank You.`;

        }

        if(status === "Deactivated"){
            subject="Account Deactivated";
            message=`Hello,
            Your account has been deactivated by the adminstrator.
            
            You can no longer access the system.
            Thank you.`;
        }


        if(status === "Active"){
            subject="Account Reactivated";
            message=`Hello,
            Good news!

            Your account has been reactivated by the adminstrator.

            You can now log in again.
            `;

        }


        //Send email
        try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: subject,
                    text: message,
                });

                console.log("Status email sent to:", email);

            } catch (error) {
                console.error("Email failed:", error);
            }
        console.log("Status email sent to:", email);


    },


    //Redis connection
    //Bullmq uses redis to store and manage job
    {
        connection:redisConnection,
    }

);


// Admin changes user status
//         ↓
// adminController adds job to emailQueue
//         ↓
// Redis stores job
//         ↓
// emailWorker detects job
//         ↓
// Creates email message
//         ↓
// Sends email using nodemailer


