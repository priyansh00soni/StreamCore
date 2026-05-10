import { Router } from "express";
import {registerUser,loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getChannelProfile,getWatchHistory} from "../controllers/user.controller.js";
const router=Router()
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

router.route('/login').post(loginUser)


//secure routes - web application paths accessible only to authenticated or authorized users

router.route('/logout').post(verifyJWT,logoutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route('/change-password').patch(verifyJWT,changeCurrentPassword)

router.route('/current-user').get(verifyJWT,getCurrentUser)

router.route('/update-account-details').patch(verifyJWT,updateAccountDetails)

router.route('/update-avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route('/update-coverImage').patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route('/channel/:username').get(verifyJWT,getChannelProfile)

router.route('/watch-history').get(verifyJWT,getWatchHistory)



export default router