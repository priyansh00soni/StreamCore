import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler(async(req,res)=>{
    const stats = await User.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(req.user._id)}
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"videos",
                pipeline:[
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"video",
                            as:"likes"
                        }
                    },
                    {
                        $lookup:{
                            from:"comments",
                            localField:"_id",
                            foreignField:"video",
                            as:"comments"
                        }
                    },
                    {
                        $addFields:{
                            videoLikeCount:{$size:"$likes"},
                            videoCommentCount:{$size:"$comments"}
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"tweets",
                localField:"_id",
                foreignField:"owner",
                as:"tweets",
                pipeline:[
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"tweet",
                            as:"likes"
                        }
                    },
                    {
                        $addFields:{
                            tweetLikeCount:{$size:"$likes"},
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likeCount:{$sum:"$videos.videoLikeCount"},
                commentLikeCount:{$sum:"$videos.videoCommentCount"},
                tweetLikeCount:{$sum:"$tweets.tweetLikeCount"},
                videoCount:{$size:"$videos"},
                totalViews:{$sum:"$videos.views"},
                subscriberCount:{$size:"$subscribers"}
            }
        },
        {
            $project:{
                videoCount:1,
                totalViews:1,
                subscriberCount:1,
                likeCount:1,
                commentLikeCount:1,
                tweetLikeCount:1
            }
        }
    ])

    if(!stats[0]) throw new ApiError(500,"Something went wrong while fetching the stats.")
    
    return res.status(200).json(new ApiResponse(200,stats[0],"Stats Fetched Successfully."))
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    
    const videos = await Video.find({ owner: req.user._id }).sort({createdAt: -1, })

    if(!videos) throw new ApiError(404,"Videos not found.") 
    return res.status(200).json(new ApiResponse(200,videos[0].videos,"Videos fetched successfully."))
})

export {getChannelStats, getChannelVideos}