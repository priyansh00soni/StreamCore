import mongoose, { isValidObjectId } from 'mongoose'
import { Video } from '../models/videos.model.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import { User } from '../models/user.model.js'
import { deleteFromCloudinary } from '../utils/deleteFromCloudinary.js'
import { generateTags, semanticSearch } from '../utils/aiService.js'

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = '',
        sortBy = 'createdAt',
        sortType = 'desc',
        userId,
    } = req.query
    let matchConditions = {} 
    
    let optimizedQuery 
    if(query) optimizedQuery =  await semanticSearch(query) 
    else optimizedQuery = query
    
    console.log("Original:", query, "→ Semantic:", optimizedQuery)

    if(optimizedQuery){
    const terms = optimizedQuery.trim().split(" ").filter(Boolean).map(t => t.replace(/_/g, " "))
    const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); //["apple.", "pears?"] ==>> ["apple\.", "pears\?"]
    const regexPattern = escapedTerms.map(t => `\\b${t}\\b`).join("|")
    matchConditions.$or = [
        { title: { $regex: regexPattern, $options: 'i' } },
        { description: { $regex: regexPattern, $options: 'i' } }, 
        { tags: { $elemMatch: { $regex: regexPattern, $options: 'i' } } }
    ]
}
    //$regex means: match any title that CONTAINS this pattern anywhere inside it. So { title: { $regex: "java" } } returns every video whose title has "java" anywhere in it. $options: "i" means case insensitive. So "Java", "JAVA", "java" all match. Without this option "Java" and "java" would be treated as different things.


    //Recommendations
    
    let tags=[]

    if(req.user && !query && req.user.watchHistory.length>0){
        const recentHistory = req.user.watchHistory.slice(-100)
        const recentVideosTags = await Video.find({ _id: { $in: recentHistory } }).select("tags")
        tags = recentVideosTags.flatMap(video=>video.tags)

        matchConditions.tags={$in:tags}
        matchConditions._id = {$nin:recentHistory}


    }


    if (userId) matchConditions.owner = new mongoose.Types.ObjectId(userId)
    //MongoDB compares a string against an ObjectId. They are different data types. Even if the value looks the same, the types do not match. MongoDB returns nothing.So you need to convert that string into a proper ObjectId before using it in a query. That is what mongoose.Types.ObjectId(userId) does. It takes the string and converts it into the ObjectId type that MongoDB understands and can compare correctly.

    const sortTypeOrder = sortType === 'desc' ? -1 : 1
    const pageNumber = Number(page)
    const limitNumber = Number(limit)

   const videos = await Video.aggregate([
        {
          $match: matchConditions,
        },
        {
            $facet: {
                data: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                            {
                                $project: {
                                fullName: 1,
                                avatar: 1,
                                username: 1,
                                },
                            },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                            ...(query ? {} :{
                                matchedTagsCount:{
                                    $size:{
                                        $setIntersection:[
                                            {
                                                $cond:{
                                                    if:{$isArray: "$tags"},
                                                    then: "$tags",
                                                    else: []
                                                }
                                            },tags]
                                    }
                                }
                            })
                        }
                    },
                    {
                        $sort: query
                            ? { [sortBy]: sortTypeOrder }
                            : { matchedTagsCount: -1 },
                    },
                    { $skip: (pageNumber - 1) * limitNumber },
                    { $limit: limitNumber },
                ],

                totalCount: [{ $count: "total" }],
            },
        }
])

    let hasNextPage = false

    if(!videos[0].data.length) throw new ApiError(404,"Videos Not found")

    if(videos[0]?.totalCount[0]?.total > pageNumber * limitNumber) hasNextPage=true

    return res.status(200).json(new ApiResponse(200, {
    videos: videos[0].data,
    totalCount: videos[0]?.totalCount[0]?.total,
    hasNextPage,
    }, 'Videos Fetched Successfully'))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    if (!title) throw new ApiError(400, 'Title required')
    if (!description) throw new ApiError(400, 'Description required')

    const videoLocalPath = req.files?.videoFile[0]?.path
    if (!videoLocalPath) throw new ApiError(400, 'Video is required.')

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) throw new ApiError(400, 'Thumbnail is required.')

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if (!videoFile) throw new ApiError(400, 'Error while uploading video.')

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) throw new ApiError(400, 'Error while uploading thumbnail.')

    const tagsString = await generateTags(title, description)
    const tags = tagsString.split(",").map(tag => tag.trim())

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        owner: req.user?._id,
        tags
    })

    const uploadedVideo = await Video.findById(video._id)
    if (!uploadedVideo)
        throw new ApiError(500, 'Something went wrong while uploading video')

    return res
        .status(200)
        .json(new ApiResponse(200, video, 'Video Uploaded Successfully.'))
})

const getVideoById = asyncHandler(async (req, res) => {
    //returns ONE specific video with FULL details — description, full video URL, view count, likes, complete owner profile. Also increments view count.
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Invalid Video Id')

    let video = await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 },
    })

    if (!video) throw new ApiError(401, 'Video Not found')

    video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId) },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',
            },
        },
        {
            $addFields: {
                owner: {
                    $first: '$owner',
                },
            },
        },
        {
            $project: {
                'owner.fullName': 1,
                'owner.username': 1,
                'owner.avatar': 1,
                'owner.coverImage': 1,
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
            },
        },
    ])

    if (!video[0]) throw new ApiError(401, 'Video Not found')

    if(req.user){
        const updatedWatchList = await User.findByIdAndUpdate(req.user._id,{
        $addToSet:{watchHistory: videoId}
    }) 
    
    if(!updatedWatchList) throw new ApiError(500,"Something went wrong while updating the watchList.")

    }
    return res
        .status(200)
        .json(new ApiResponse(200, video[0], 'Video Fetched Successfully'))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Invalid Video Id')

    const { title, description } = req.body

    const updatedDetails = {}
    if (title) updatedDetails.title = title
    if (description) updatedDetails.description = description

    const thumbnailLocalPath = req.file?.path
    if (thumbnailLocalPath) {
        const vid = await Video.findById(videoId)
        if (!vid) throw new ApiError(400, 'Video not found.')

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) throw new ApiError(400, 'Thumbnail Upload Failed.')

        const thumbnailPublicId = vid.thumbnail.split('/').at(-1).split('.')[0]
        if (!(await deleteFromCloudinary(thumbnailPublicId)))
            throw new ApiError(400, 'Thumbnail deletion failed.')

        updatedDetails.thumbnail = thumbnail.url
    }

    if (Object.keys(updatedDetails).length === 0)
        throw new ApiError(400, 'Update atleast one parameter.')

    const video = await Video.findOneAndUpdate(
        //not findByIdAndUpdate
        { _id: videoId, owner: req.user._id },
        { $set: updatedDetails },
        { new: true, runValidators: true } //new: true: By default, Mongoose returns the original document before the update was applied. Setting this to true tells Mongoose to return the modified, updated document instead.runValidators: true: Mongoose's built-in validation (e.g., required, min, max, enum) is designed for .save() and .create() operations. Update operations like findOneAndUpdate() skip this validation by default. Setting this flag to true forces Mongoose to run your schema's validators on the updated fields
    )

    if (!video) throw new ApiError(400, 'Video not found')

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, 'Video details Updated Successfully.')
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Invalid Video Id')

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, 'Video not found.')

    const videoPublicId = video.videoFile.split('/').at(-1).split('.')[0]
    const thumbnailPublicId = video.thumbnail.split('/').at(-1).split('.')[0]

    const deletedVideo = await Video.findOneAndDelete({
        _id: videoId,
        owner: req.user._id,
    })
    if (!deletedVideo) throw new ApiError(401, 'Unauthorized.')

    if (!(await deleteFromCloudinary(videoPublicId)))
        throw new ApiError(400, 'Unable to delete the Video.')
    if (!(await deleteFromCloudinary(thumbnailPublicId)))
        throw new ApiError(400, 'Unable to delete the Thumbnail.')

    return res
        .status(200)
        .json(new ApiResponse(200, 'Video Deleted Successfully.'))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Invalid Video ID')
    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(400, 'Video Not Found.')
    if (req.user._id.toString() !== video.owner.toString())
        throw new ApiError(
            401,
            "This video dosen't belong to current loggedIn user."
        )

    video.isPublished = !video.isPublished
    await video.save()
    return res
        .status(200)
        .json(new ApiResponse(200, video, 'Publish Status Flipped.'))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
}
