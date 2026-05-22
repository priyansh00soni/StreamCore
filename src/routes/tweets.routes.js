import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller";
const router = Router()

router.route('/').post(verifyJWT,createTweet)
router.route('/:userId').get(getUserTweets)
router.route('/:tweetId').patch(verifyJWT,updateTweet)
router.route('/:tweetId').delete(verifyJWT,deleteTweet)