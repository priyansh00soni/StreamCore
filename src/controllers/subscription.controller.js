import { isValidObjectId } from 'mongoose'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { Subscription } from '../models/subscription.model.js'
import ApiResponse from '../utils/ApiResponse.js'
import mongoose from 'mongoose'

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!isValidObjectId(channelId)) throw new ApiError(400, 'Id not valid.')
    if (req.user._id.toString() === channelId.toString())
        throw new ApiError(400, "You Can't subscribe yourself.")
    let isSubscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id,
    })
    if (isSubscribed)
        isSubscribed = await Subscription.findOneAndDelete({
            channel: channelId,
            subscriber: req.user._id,
        })
    else
        isSubscribed = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        })
    if (!isSubscribed)
        throw new ApiError(
            500,
            'Something went wrong while toggling subscription.'
        )
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                isSubscribed,
                'Subscription Toggled Successfully.'
            )
        )
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    //find/aggreagte never return null, if nothing found,returns empty array.
    const subscribers = await Subscription.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(req.user._id) },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriber',
            },
        },
        {
            $addFields: {
                subscriber: {
                    $first: '$subscriber',
                },
            },
        },
        {
            $project: {
                'subscriber.fullName': 1,
                'subscriber.username': 1,
                'subscriber.avatar': 1,
                'subscriber.coverImage': 1,
                channel: 1,
            },
        },
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                'Subscribers Fetched Successfully.'
            )
        )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const channels = await Subscription.aggregate([
        {
            $match: { subscriber: new mongoose.Types.ObjectId(req.user._id) },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'channel',
                foreignField: '_id',
                as: 'channel',
            },
        },
        {
            $addFields: {
                channel: {
                    $first: '$channel',
                },
            },
        },
        {
            $project: {
                'channel.fullName': 1,
                'channel.username': 1,
                'channel.avatar': 1,
                'channel.coverImage': 1,
                subscriber: 1,
            },
        },
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, channels, 'channels Fetched Successfully.'))
})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }
