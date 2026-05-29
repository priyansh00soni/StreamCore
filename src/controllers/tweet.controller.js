import mongoose, { isValidObjectId } from 'mongoose'
import { Tweet } from '../models/tweet.model.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    if (!content) throw new ApiError(400, 'Tweet content Required.')
    const tweet = await Tweet.create({
        content,
        owner: req.user._id,
    })
    if (!tweet)
        throw new ApiError(500, 'Somwthing went wrong while creating Tweet.')
    return res
        .status(201)
        .json(new ApiResponse(201, tweet, 'Tweet created successfully.'))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) throw new ApiError(400, 'id is not valid.')
    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 })

    if (!tweets.length) throw new ApiError(404, 'Tweets not found.')

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, 'Tweets fetched Successfully.'))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) throw new ApiError(400, 'id is not valid.')
    const { content } = req.body
    if (!content) throw new ApiError(400, 'content is empty.')
    const tweet = await Tweet.findOneAndUpdate(
        { owner: req.user._id, _id: tweetId },
        { $set: { content } },
        { new: true, runValidators: true }
    )
    if (!tweet)
        throw new ApiError(500, 'Something went wrong while updating the tweet')
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, 'Tweet Updated Successfully.'))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) throw new ApiError(400, 'id is not valid.')

    const tweet = await Tweet.findOneAndDelete({
        owner: req.user._id,
        _id: tweetId,
    })

    if (!tweet)
        throw new ApiError(500, 'Something went wrong while deleting the tweet')
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, 'Tweet Deleted Successfully.'))
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }
