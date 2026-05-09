import { Router } from "express";
import {registerUser,loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getChannelProfile} from "../controllers/user.controller.js";
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

router.route('/change-password').post(verifyJWT,changeCurrentPassword)

router.route('/get-current-user').post(verifyJWT,getCurrentUser)

router.route('/update-account-details').post(verifyJWT,updateAccountDetails)

router.route('/update-user-avatar').post(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route('/update-user-coverImage').post(verifyJWT,upload.single("coverImage"),updateUserCoverImage)




export default router