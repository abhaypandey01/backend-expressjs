import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { URL } from "url";
import mongoose from "mongoose";

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if(
        [title, description].some((field) => field?.trim() === "")
    ){
        throw new ApiError(401, "Title and description are compulsory!!!")
    }

    let videoLocalPath;

    let thumbnailLocalPath;

    if ( req.files && Array.isArray(req.files.video) && req.files.video > 0) {
        videoLocalPath = req.files.video[0].path;
    }

    if ( req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    const videofile = await uploadOnCloudinary(videoLocalPath);

    if(!video){
        throw new ApiError(401, "Error while uploading video file");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail){
        throw new ApiError(401, "Error while uploading thumbnail file");
    }

    const video = await Video.create(
        {
            videofile: videofile.url,
            thumbnail: thumbnail.url,
            title,
            description,
        }
    )

    const publishedVideo = await Video.findById(video._id)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            publishedVideo,
            "Video published successfully."
        )
    )
})

export {
    publishVideo,
}