import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB=async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`\n mongoDB connected || DB HOST:${connectionInstance.connection.host}`);
        
    }catch(err){
        console.error("Error",err)
        process.exit(1)
    }
} //we wrote an asynchronous method. Which commonly always returns a promise. A JavaScript Promise is an object representing the eventual result of an asynchronous operation.
export default connectDB