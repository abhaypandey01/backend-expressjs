import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    publishTweet,
    updateTweet,
    deleteTweet,
    ListAllTweets
} from "../controllers/tweet.controller.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/")
    .post(publishTweet)
    .get(ListAllTweets);

router
    .route("/:tweetId")
    .patch(updateTweet)
    .delete(deleteTweet);

export default router;
