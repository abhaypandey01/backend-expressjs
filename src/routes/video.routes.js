import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    publishVideo,
    getAllVideos,
    getVideoDetails,
    deleteVideo,
    updateVideoDetails,
    togglePublishVideo,
} from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videofile",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishVideo
    );

router
    .route("/:videoId")
    .get(getVideoDetails)
    .delete(deleteVideo)
    .patch(
        upload.single("thumbnail"),
        updateVideoDetails);

router.route("/toggle-publish/:videoId").patch(togglePublishVideo);

export default router;