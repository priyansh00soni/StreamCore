import { Tweet } from "../models/tweet.model"
import ApiError from "../utils/ApiError"
import ApiResponse from "../utils/ApiResponse"
import asyncHandler from "../utils/asyncHandler"

const createTweet = asyncHandler(async(req,res)=>{
    const {content} = req.body
    if(!content) throw new ApiError(400,"Tweet content Required.")
    const tweet = await Tweet.create({
        content,
        owner:req.user._id
    }) 
    if(!tweet) throw new ApiError(500,"Somwthing went wrong while creating Tweet.")
    return res.status(201).json(new ApiResponse(201,tweet,"Tweet created successfully."))
})

export {createTweet}