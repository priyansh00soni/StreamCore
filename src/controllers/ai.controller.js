import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import generateWithAI from '../utils/gemini.js'

const generateDescription = asyncHandler(async(req,res)=>{
    const {title} = req.body
    if(!title) throw new ApiError(400,"Title is required")
    
    const description = await generateWithAI(`You are a YouTube description writer. Generate ONE concise, engaging YouTube video description for a video titled: "${title}". Include relevant hashtags at the end. Return only the description, nothing else.`)
    if(!description) throw new ApiError(500,"Could not generate description. Please type it manually.")
    return res.status(200).json(new ApiResponse(200,description,"Description generated successfully."))
})

export {generateDescription}