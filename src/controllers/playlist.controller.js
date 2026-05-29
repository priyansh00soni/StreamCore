import { isValidObjectId } from 'mongoose'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import { Playlist } from '../models/playlist.model.js'

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if (!name) throw new ApiError(400, 'Name is not valid.')
    if (!description) throw new ApiError(400, 'description is not valid.')

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    })
    if (!playlist)
        throw new ApiError(500, 'Something went wrong while creating playlist.')
    return res
        .status(201)
        .json(new ApiResponse(201, playlist, 'Playlist created Successfully.'))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) throw new ApiError(400, 'It not valid.')
    const playlists = await Playlist.find({ owner: userId })
    if (!playlists || playlists.length === 0)
        throw new ApiError(404, 'Playlist not found')
    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, 'Playlists fetched Successfully.')
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, 'It not valid.')
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, 'Playlist not found')
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'Playlist fetched Successfully.'))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, 'Id not valid.')
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Id not valid.')
    const playlistOwner = (await Playlist.findById(playlistId))?.owner
    if (!playlistOwner) throw new ApiError(404, 'Playlist not found.')
    if (req.user._id.toString() !== playlistOwner.toString())
        throw new ApiError(403, 'Only Owner is allowed to edit their playlist')
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } }, //addToSet to avoid duplicacy, otherwise use push.
        { new: true, runValidators: true }
    )
    if (!playlist) throw new ApiError(404, 'Not found.')
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'Video added Successfully.'))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, 'Id not valid.')
    if (!isValidObjectId(videoId)) throw new ApiError(400, 'Id not valid.')

    const playlistOwner = (await Playlist.findById(playlistId))?.owner
    if (!playlistOwner) throw new ApiError(404, 'Playlist not found.')
    if (req.user._id.toString() !== playlistOwner.toString())
        throw new ApiError(403, 'Only Owner is allowed to edit their playlist')

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } }, //addToSet to avoid duplicacy, otherwise use push.
        { new: true, runValidators: true }
    )
    if (!playlist) throw new ApiError(404, 'Not found.')
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'Video removed Successfully.'))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, 'Id not valid.')

    const playlistOwner = (await Playlist.findById(playlistId))?.owner
    if (!playlistOwner) throw new ApiError(404, 'Playlist not found.')
    if (req.user._id.toString() !== playlistOwner.toString())
        throw new ApiError(403, 'Only Owner is allowed to edit their playlist')

    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if (!playlist) throw new ApiError(404, 'Not found.')
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'Playlist deleted Successfully.'))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    if (!isValidObjectId(playlistId)) throw new ApiError(400, 'Id not valid.')

    if (!name && !description)
        throw new ApiError(400, 'Updated atleast one field.')

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, 'Playlist not found.')
    if (playlist.owner.toString() !== req.user._id.toString())
        throw new ApiError(403, 'Forbidden.')

    if (name) playlist.name = name
    if (description) playlist.description = description

    const updated = await playlist.save()
    if (!updated) throw new ApiError(500, 'Something went wrong.')

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'Playlist updated Successfully.'))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
}
