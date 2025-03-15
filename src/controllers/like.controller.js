import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!(isValidObjectId(videoId))) {
        throw new ApiError(401, "Invalid Id, video not found!!!")
    }

    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    })

    if(likedAlready) {
        await Like.deleteOne({
            video: videoId,
            likedBy: req.user?._id,
        })

        return res
        .status(200)
        .json( new ApiResponse(200, { isLiked: false }, "Video like removed.") )
    }

    await Like.create(
        {
            video: videoId,
            likedBy: req.user?._id,
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked: true}, "Video liked.")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if(!(isValidObjectId(commentId))){
        throw new ApiError(401, "Invalid id, comment not found!!!")
    }

    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    })

    if(likedAlready) {
        await Like.deleteOne({
            comment: commentId,
            likedBy: req.user?._id,
        })

        return res.status(200)
        .json(new ApiResponse(200, { isLiked: false }, "Comment like removed."))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    })

    return res.status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Comment liked."))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!(isValidObjectId(tweetId))) {
        throw new ApiError(401, "Invalid id, tweet not found.")
    }

    const likedAlready = await Tweet.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    })

    if(likedAlready) {
        await Like.deleteOne({
            tweet: tweetId,
            likedBy: req.user?._id,
        })

        return res.status(200)
        .json(new ApiResponse(200, { isLiked: false }, "Comment like removed."))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    })

    return res.status(200)
    .json( new ApiResponse(
        200,
        { isLiked: true },
        "Tweet liked."
    ) )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
}