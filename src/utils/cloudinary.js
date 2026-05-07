import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary =  async(localFilePath)=>{
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath,{
          resource_type: "auto"
        })
        console.log("File is uploaded on cloudinary.", response.url)
          console.log("cloudinary response: ");
          fs.unlinkSync(localFilePath)
        return response
    }catch(err){
      console.log(err)
      fs.unlinkSync(localFilePath) //removes the locally saved temporary file as the upload operation got failed.
      return null
    }
}
export default uploadOnCloudinary