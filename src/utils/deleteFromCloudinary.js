import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const deleteFromCloudinary = async (cloudinaryLink) => {
    try {
        if (!cloudinaryLink) return null
        const response = await cloudinary.uploader.destroy(cloudinaryLink, {
            resource_type: 'auto',
        })
        console.log('File is uploaded on cloudinary.', response.url)
        return response
    } catch (error) {
        console.log(error)
        return null
    }
}
