import mongoose from "mongoose";
import { Video } from "../models/videos.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async(req,res)=>{
    const {page = 1, limit = 10, query="", sortBy="createdAt", sortType="desc", userId} = req.query
    let matchConditions={}

    if(query) matchConditions.title={ $regex: query, $options: "i" } //$regex means: match any title that CONTAINS this pattern anywhere inside it. So { title: { $regex: "java" } } returns every video whose title has "java" anywhere in it. $options: "i" means case insensitive. So "Java", "JAVA", "java" all match. Without this option "Java" and "java" would be treated as different things.


    if(userId) matchConditions.owner = new mongoose.Types.ObjectId(userId)
        //MongoDB compares a string against an ObjectId. They are different data types. Even if the value looks the same, the types do not match. MongoDB returns nothing.So you need to convert that string into a proper ObjectId before using it in a query. That is what mongoose.Types.ObjectId(userId) does. It takes the string and converts it into the ObjectId type that MongoDB understands and can compare correctly.

    const sortTypeOrder = sortType === "desc" ? -1 : 1
    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    const videos= await Video.aggregate([
        {
            $match:matchConditions
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            avatar:1,
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        },
        { $sort: { [sortBy]: sortTypeOrder } },
        { $skip: (pageNumber - 1) * limitNumber },
        { $limit: Number(limit) }
    ])

    return res.status(200).json(
        new ApiResponse(200,videos,"Videos Fetched Successfully")
    )
})

const publishAVideo = asyncHandler(async(req, res)=>{
    const {title,description} =req.body
    if(!title) throw new ApiError(400,"Title required")
    if(!description) throw new ApiError(400,"Description required")

    const videoLocalPath = req.files?.videoFile[0]?.path
    if(!videoLocalPath) throw new ApiError(400, "Video is required.")

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required.")

    const videoFile= await uploadOnCloudinary(videoLocalPath)
    if(!videoFile) throw new ApiError(400,"Error while uploading video.")

    const thumbnail= await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail) throw new ApiError(400,"Error while uploading thumbnail.")

    const video=await Video.create({
        title,
        description,
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        duration:videoFile.duration,
        owner:req.user?._id
    })

    const uploadedVideo = await Video.findById(video._id)
    if(!uploadedVideo) throw new ApiError(500,"Something went wrong while uploading video")

    return res.status(200).json(
        new ApiResponse(200,video,"Video Uploaded Successfully.")
    )
})



export {getAllVideos,publishAVideo}