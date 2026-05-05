import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import {User} from  '../models/user.model.js'
import router from '../routes/user.routes.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js'

const generateAccessandRefreshTokens = async(userId)=>{ // readability is topmost priority.
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.")
    }
}





const registerUser= asyncHandler(async (req, res)=>{
    // get user details from frontend as reference to userModel.
    // Validation  - not empty
    // check for duplicate users: username and email
    // check for images, check for avatar
    // upload on cloudinary, avatar
    // create user Object/ Instance, - create entry in db
    // remove password field from response , only send 
    // check for user creation 
    // return response or error 

    //get data
    const {fullName, email, username, password}=req.body //for data coming from form or json. For URl, this is not aplicable.

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
    const existingUser=await User.findOne({username})
    const existingEmail=await User.findOne({email})
    if(existingUser) throw new ApiError(409, "User with existing Username")
    if(existingEmail) throw new ApiError(409, "User with existing email ")

    //check for images, check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath = req.files?.coverImage[0]?.path
    
    if(!avatarLocalPath) throw new ApiError("400", "Avatar is required")
    if(!coverImageLocalPath) coverImageLocalPath=""
    
    //uploadOnCloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar) throw new ApiError("400", "Avatar is required") //properly upload hui hai ya nai
    
    //create object and upload on db

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    //check 

    //const createdUser = await User.findById(user._id) //is the user really created or just empty?? this does some extra calls but is full proof than simplee isnull as agar ye user mil gaya to matlab hogaya create warna nai hua as mongo gives this _id automatically when creating user.

    //we will use this to remove pass field. we could have also done by assigning those fields to undefined with help of user. But, this helps
    const createdUser = await User.findById(user._id).select(
        "-password" //- means reject it . this is the syntax.
    )
    if(!createdUser) throw new ApiError(500, "Something went wrong while registering the user.")

    //return response.
    return res.status(201).json( //createdUser would also work but we need structure and thats why we made that utility. 
        new ApiResponse(200, createdUser,"User is registered Succesfully.")
    )
})

const loginUser=asyncHandler(async (req, res)=>{
    //TODOS:
    // req body —> data
    // username or email
    // find the user
    //password check
    //access and referesh token // this is recuuring work so we will create a method for this at the top.
    // send cookie

    const {password, username, email}=req.body

    if(!email && !username) throw new ApiError(400,"username or email required.")

    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user) throw new ApiError(404, "User dosen't exists.")

    const isPasswordVaid = await user.isPasswordCorrect(password) //ye saare methods, jese checkpass, generateTokens ye sab aapke small u waale user me ya aapke banaye hue available hai. Jo findOne, FindById wagera hai ye bade u waale User me ya mongoose ke available hai.

    if(!isPasswordVaid) throw new ApiError(401, "Invalid password.")

    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)

    /// at this point, the user that we found using finOne has refresh token but its empty as at that time, it didnt had refresh token. so we need to update it. 2 methods- update the object manually  or use one more db call. you have to decide what to do based on the project, and can it afford that db call.

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options={ //`httpOnly: true` means JavaScript cannot read OR modify the cookie. Only the browser sends it automatically with requests. Frontend JS has zero access.
        httpOnly: true, //prevents JavaScript from reading the cookie. XSS attack can't steal it.
        secure:true //cookie only sent over HTTPS. Not plain HTTP.
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser, accessToken, refreshToken //we had already send these tokens in cookie, why sent it in response? so that if user want to save them in local storage, he could. 
        }, 
        "User Logged-In Successfully."
    )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {new:true //returns updated user (we dont need it afterwards, just a good habit)
            })
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out "))
})

export {registerUser, loginUser, logoutUser}