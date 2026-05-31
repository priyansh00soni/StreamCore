import mongoose, { connect, isValidObjectId } from 'mongoose'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { Comment } from '../models/comment.model.js'
import ApiResponse from '../utils/ApiResponse.js'
import { isContentModerated } from '../utils/aiService.js'


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Id not valid.')
    const { page = 1, limit = 10 } = req.query
    const pageNumber = Number(page)
    const limitNumber = Number(limit)
    const comments = await Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) },
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
                content: 1,
                video: 1,
                'owner._id': 1,
                'owner.fullName': 1,
                'owner.username': 1,
                'owner.avatar': 1,
                'owner.avatar': 1,
            },
        },
        {
            $skip: (pageNumber - 1) * limitNumber,
        },
        { $limit: Number(limit) },
    ])

    if (!comments) throw new ApiError(404, 'Comments not found.')

    return res
        .status(200)
        .json(new ApiResponse(200, comments, 'Comments fetched Successfully.'))
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Id not valid.')
    const { content } = req.body
    if (!content) throw new ApiError(400, 'Content is Required.')

    if(!await isContentModerated(content)) throw new ApiError(400,"Your comment dosen't follow our comment moderation standards. Please write a new comment.")

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    })
    if (!comment)
        throw new ApiError(500, 'Something went wrong while creating comment.')
    return res
        .status(201)
        .json(new ApiResponse(201, comment, 'Comment created Successfully.'))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    if (!isValidObjectId(commentId)) throw new ApiError(400, 'Id not valid.')
    if (!content) throw new ApiError(400, 'Content is required.')
    const updatedComment = await Comment.findOneAndUpdate(
        { owner: req.user._id, _id: commentId },
        { $set: { content } },
        { new: true, runValidators: true }
    )
    if (!updatedComment)
        throw new ApiError(
            500,
            'Something went wrong while updating the Comment'
        )
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                'Comment Updated Successfully.'
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) throw new ApiError(400, 'Id not valid.')

    const comment = await Comment.findOneAndDelete({
        owner: req.user._id,
        _id: commentId,
    })

    if (!comment)
        throw new ApiError(
            500,
            'Something went wrong while deleting the Comment'
        )
    return res
        .status(200)
        .json(new ApiResponse(200, comment, 'Comment deleted Successfully.'))
})

export { getVideoComments, addComment, updateComment, deleteComment }
