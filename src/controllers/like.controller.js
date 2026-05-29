import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import ApiResponse from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400,"Id is not valid.")
    
    const existingLike = await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    })
    if(existingLike){
        const like=await Like.findByIdAndDelete(existingLike._id)
        if(!like) throw new ApiError(404,"Like not found.") 
        return res.status(200).json(new ApiResponse(200,like,"Like Deleted Successfully."))
    }

    const like = await Like.create({
        video:videoId,
        likedBy:req.user._id
    })
    if(!like) throw new ApiError(404,"Like not found.") 
    return res.status(201).json(new ApiResponse(201,like,"Like Created Successfully."))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)) throw new ApiError(400,"Id is not valid.")
    
    const existingLike = await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
    })
    if(existingLike){
        const like=await Like.findByIdAndDelete(existingLike._id)
        if(!like) throw new ApiError(404,"Like not found.") 
        return res.status(200).json(new ApiResponse(200,like,"Like Deleted Successfully."))
    }

    const like = await Like.create({
        comment:commentId,
        likedBy:req.user._id
    })
    if(!like) throw new ApiError(404,"Like not found.") 
    return res.status(201).json(new ApiResponse(201,like,"Like Created Successfully."))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)) throw new ApiError(400,"Id is not valid.")
    
    const existingLike = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
    })
    if(existingLike){
        const like=await Like.findByIdAndDelete(existingLike._id)
        if(!like) throw new ApiError(404,"Like not found.") 
        return res.status(200).json(new ApiResponse(200,like,"Like Deleted Successfully."))
    }

    const like = await Like.create({
        tweet:tweetId,
        likedBy:req.user._id
    })
    if(!like) throw new ApiError(404,"Like not found.") 
    return res.status(201).json(new ApiResponse(201,like,"Like Created Successfully."))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const videos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
            
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video"
            }
        },
        {
            $project:{
                video:1
            }
        }
    ])

    if(!videos.length) throw new ApiError(404,"Videos Not Found")
    return res.status(200).json(new ApiResponse(200,videos,"Videos fetched Successfully."))
})

export {toggleCommentLike, toggleTweetLike,toggleVideoLike,getLikedVideos}