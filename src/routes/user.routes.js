import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAvatar, updateCoverImage, userChannelProfile, updateAccountDetails, watchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    deleteVideo, 
    getAllVideos, 
    publishVideo, 
    togglePublishVideo, 
    updateVideoDetails, 
    videoDetails
    } from "../controllers/video.controller.js";
import {
    addComment, 
    deleteComment, 
    listAllComments, 
    updateComment,

    } from "../controllers/comment.controller.js";

const router = Router()

// user routes

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// SECURED ROUTES

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-details").patch(verifyJWT, updateAccountDetails);

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);

router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:username").get(verifyJWT, userChannelProfile);

router.route("/history").get(verifyJWT, watchHistory);

// video routes

router.route("/publish-video").post(verifyJWT, upload.fields(
    [
        {
            name: "videofile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]
) , publishVideo)

router.route("/video-details").get(verifyJWT, videoDetails)

router.route("/search").get(verifyJWT, getAllVideos)

router.route("/delete/:videoId").post(verifyJWT, deleteVideo)

router.route("/v/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideoDetails)

router.route("/toggle-publish/:videoId").patch(verifyJWT, togglePublishVideo)

// playlist routes



// comment routes
router.route("/add-comment/:videoId").post(verifyJWT, addComment)

router.route("/edit-comment/:commentId").patch(verifyJWT, updateComment)

router.route("/delete-comment/:commentId").post(verifyJWT, deleteComment)

router.route("/comments/:videoId").get(verifyJWT, listAllComments)

export default router;