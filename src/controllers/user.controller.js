import asyncHandler from '../utils/asyncHandler.js'

const registerUser= asyncHandler(async (req, res)=>{
    // get user details from frontend as reference to userModel.
    // Validation  - not empty
    // check for duplicate users: username and email
    // check for images, check for avatar
    // upload on cloudinary, avatar
    // create user Object/ Instance, - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response or error 

})

export default registerUser