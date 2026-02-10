// import redisClient from "./config/redis.config.js";

// async function  init(){
//     await client.set("msg:6","Hey from Nodejs");
//     const result=await client.get("user:3");
//     console.log("Result -> ",result);

//     await redisClient.setex()


// }


// //functio  to set JSON data in Redis 
// function set JSONData(Key,data){
//     client.set(key,JSON.stringify(data),(error,reply)=>{
//         if(error){
//             console.error('Error setting JSON data in Redis:',error);
//         }else{
//             console.log('JSON data cached sucessfully:',reply);
        
//         }


      
//     }

//     )};

// //function to get JSON data from redis
// function getJSONData(key,callback){
//     client.get(key,(error,reply)=>{
//         if(error){
//             console.error('Error getting JSON data from redis:',error);
//             callback(error,null);
//         }else{
//             console.log('JSON data retrieved sucessfully:',reply);
//             callback(null,JSON.parse(reply));
        

//         }

//         }
//     )}; 





// init();
