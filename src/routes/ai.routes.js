import { Router } from "express";
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { generateDescription } from "../controllers/ai.controller.js";

const router= Router()

router.route('/description').post(verifyJWT,generateDescription)

export default router