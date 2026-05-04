// import dotenv from "dotenv";
// dotenv.config({ path: "./.env" }); --not req as we wrote in nodeman, package.json
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js';
import app from './app.js'
import connectDB from './db/index.js'
//old wayy function connectDB(){} connectDB();
//modern way-
//iife function that executes instantly - ;()()
// ;(async()=>{
//     try{
//         const connectionInstance=await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
//         console.log(`\n mongoDB connected || DB HOST:${connectionInstance.connection.host}`);
//
//          app.on("error",(error)=>{ 
// ✅ on
// Used to listen to events
// ✅ listen
// Used to start the server
    // console.log("Err:",error);
    // })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App listens at ${process.env.PORT}`);
//         })
//     }catch(err){
//         console.error("MONGODB CONNECTION ERROR",err); 
//         process.exit(1);
//     }
// }) ()


// way 2- use a different file and just call it. =>> connectDB();x`
connectDB()
.then(()=>{ // what happens after the async promise response from the above function call.
    app.listen(process.env.PORT || 8000,()=>{ //if port isnt available, switches to 8000.
        console.log(`App listens at ${process.env.PORT}`);
    })
})
.catch((err)=>{ // these 
    console.error("MONGODB CONNECTION ERROR",err); 
    process.exit(1);
})
 