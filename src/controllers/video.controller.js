import { Video } from "../models/videos.model";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";

const getAllVideos = asyncHandler(async(req,res)=>{
    const {page = 1, limit = 10, query="", sortBy="createdAt", sortType="desc", userId} = req.query
    if(!req.user) throw new ApiError(401,"User is not loggedIn.")
    matchConditions={}

    if(query) matchConditions.title={ $regex: query, $options: "i" } //$regex means: match any title that CONTAINS this pattern anywhere inside it. So { title: { $regex: "java" } } returns every video whose title has "java" anywhere in it. $options: "i" means case insensitive. So "Java", "JAVA", "java" all match. Without this option "Java" and "java" would be treated as different things.


    if(userId) matchConditions.owner = new mongoose.Types.ObjectId(userId)
        //MongoDB compares a string against an ObjectId. They are different data types. Even if the value looks the same, the types do not match. MongoDB returns nothing.So you need to convert that string into a proper ObjectId before using it in a query. That is what mongoose.Types.ObjectId(userId) does. It takes the string and converts it into the ObjectId type that MongoDB understands and can compare correctly.


    const videos= await Video.aggregate([
        {
            $match:matchConditions
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails"
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$ownerDetails"
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                avatar: 1
            }
        }
    ])
})

export {getAllVideos}