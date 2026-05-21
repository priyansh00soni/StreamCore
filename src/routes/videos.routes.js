import { Router } from "express";
const router =  Router()
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

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

router.route('/:videoId').get(getVideoById)
router.route('/updateVideo/:videoId').patch(verifyJWT,upload.single("thumbnail"),updateVideo)
router.route('/delete/:videoId').delete(verifyJWT,deleteVideo)
router.route('/togglePublish/:videoId').patch(verifyJWT,togglePublishStatus)

export default router