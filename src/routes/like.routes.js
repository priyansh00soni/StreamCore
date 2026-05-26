import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";
const router = Router()

router.route('/toggle/v/:videoId').patch(verifyJWT,toggleVideoLike)
router.route('/toggle/c/:commentId').patch(verifyJWT,toggleCommentLike)
router.route('/toggle/t/:tweetId').patch(verifyJWT,toggleTweetLike)
router.route('/videos').get(verifyJWT,getLikedVideos)

export default router
