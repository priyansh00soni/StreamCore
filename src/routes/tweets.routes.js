import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
const router = Router()

router.route('/').post(verifyJWT,createTweet)
router.route('/:userId').get(getUserTweets)
router.route('/:tweetId').patch(verifyJWT,updateTweet)
                        .delete(verifyJWT,deleteTweet)

export default router