import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
const router = Router()

router.route('/c').get(verifyJWT,getSubscribedChannels)
router.route('/c/:channelId').post(verifyJWT,toggleSubscription)
router.route('/u').get(verifyJWT,getUserChannelSubscribers)


export default router