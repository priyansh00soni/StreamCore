import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt' 
const userSchema= new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true, // removes front and backward spaces.
        index:true, // Enables searching through username. Don't index everything. It affects performance.
    },
    email:{
        type:String, 
        required:true,
        unique:true,
        lowercase:true,
        trim:true, // removes front and backward spaces.
    },
    fullName:{
        type:String,
        required:true,
        trim:true, // removes front and backward spaces.
    },
    avatar:{
        type:String, // will store a url for the image that will be hosted on an backend server. eg: cloudinary
        required:true,
    },
    coverImage:{
        type:String, // will store a url for the image that will be hosted on an backend server. eg: cloudinary
    },
    watchHistory:[  // this will be an array that stores the id of the videos that were watched. 
    {
        type: mongoose.Schema.Types.objectId,
        ref:"Video"
    }
    ],
    password:{
        type:String, // We eill not use String here as databases gets hacked. So we will encrypt it.
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String
    },
},{timestamps:true})

userSchema.pre("save",async function(next){ // don't use arrow fn here as they don't have their own this.
    if(!this.isModified("password")) return next()  
    this.password= await bcrypt.hash(this.password,10)
    next()
})
//Even though you don’t see a class, Mongoose internally treats schemas like blueprints for objects (documents).So we have to use this here.


//After signup (where password is hashed), during login we need to answer:
//“Does the entered password match the stored hashed password?”

userSchema.methods.isPasswordCorrect=async function (password) { // Every user document (object) created from this schema should have this method.
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id:this._id,
        email: this.email,
        username:this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
//A refresh token is a long-lived token used to generate a new access token when the original access token expires. It allows users to stay logged in without repeatedly entering credentials while maintaining security by keeping access tokens short-lived.

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}
export const User= mongoose.model("User",userSchema)