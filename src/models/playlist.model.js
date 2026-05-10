import mongoose, { model, Schema } from "mongoose";
const playListSchema=new Schema({
    name:{
        type:String,
        requied:true,
    },
    description:{
        type:String,
        required:true,
    },
    videos:[
        {
            type:Schema.Types.ObjectId,
            ref:"video"
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User" 
    }
},{timestamps:true})

export const Playlist=mongoose.model("Playlist",playListSchema)