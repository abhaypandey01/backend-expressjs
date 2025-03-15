import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    toggleSubscribe,
    listAllSubscribers,
    listchannelsSubscribed,
} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/:channelId")
    .post(toggleSubscribe)
    .get(listAllSubscribers);

router.route("/:userId/subscribedTo").get(listchannelsSubscribed);

export default router;