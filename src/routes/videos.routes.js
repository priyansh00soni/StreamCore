import { Router } from "express";
const router =  Router()
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, publishAVideo } from "../controllers/video.controller.js";

router.route('/').get(getAllVideos)
router.route('/publish').post(verifyJWT,upload.fields([
    {
        name:"videoFile",
        maxCount:1,
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishAVideo)

export default router