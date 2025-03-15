import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getChannnelStats, 
    getChannnelVideos
} from "../controllers/dashboard.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/:channelId").get(getChannnelStats);

router.route("/:channelId/videos").get(getChannnelVideos);

export default router;