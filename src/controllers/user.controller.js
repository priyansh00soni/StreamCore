import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import {User} from  '../models/user.model.js'
import router from '../routes/user.routes.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js'

const registerUser= asyncHandler(async (req, res)=>{
    // get user details from frontend as reference to userModel.
    // Validation  - not empty
    // check for duplicate users: username and email
    // check for images, check for avatar
    // upload on cloudinary, avatar
    // create user Object/ Instance, - create entry in db
    // remove password and refresh token field from response , only send 
    // check for user creation 
    // return response or error 

    //get data
    const {fullName, email, username, password}=req.body //for data coming from form or json. For URl, this is not aplicable.
    console.log("email : ", email); 
    console.log(req.body); //for curiosity

    // check for empty fields.
    // Beginners - if(fullName==="") throw new ApiError(400, :"FullName is required")
    //Pro - 
    if([fullName, email, username, password].some((data)=>
        data?.trim()==="")
    ){
        throw new ApiError(400, "All Fields are required")
    }
    
    //Check for duplicacy
    //User.findOne({username}) // but we want to check for both email and username, so we will do:
    // const existingUser=User.findOne({
    //     $or:[{username},{email}]
    // }) // but this will not explicitly tell that which field is duplicate. So we do:
    const existingUser=User.findOne({username})
    const existingEmail=User.findOne({email})
    if(existingUser || existingEmail) throw new ApiError(409, "User with email or Username")

    //check for images, check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log(req.files); //for curiosity
    
    if(!avatarLocalPath) throw new ApiError("400", "Avatar is required")
    
    //uploadOnCloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) throw new ApiError("400", "Avatar is required") //properly upload hui hai ya nai
    
    //create object and upload on db

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    //check 

    //const createdUser = await User.findById(user._id) //is the user really created or just empty?? this does some extra calls but is full proof than simplee isnull as agar ye user mil gaya to matlab hogaya create warna nai hua as mongo gives this _id automatically when creating user.

    //we will use this to remove pass and refresh field. we could have also done by assigning those fields to undefined with help of user. But, this helps
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //- means reject them . this is the syntax.
    )
    if(!createdUser) throw new ApiError(500, "Something went wrong while registering the user.")

    //return response.
    return res.status(201).json( //createdUser would also work but we need structure and thats why we made that utility. 
        new ApiResponse(status(200), createdUser,"User is registered Succesfully.")
    )
})

export default registerUser