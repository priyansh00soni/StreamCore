import { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";

const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) throw new ApiError(400,"Id not valid.")
    
})