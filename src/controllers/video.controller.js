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

    const videoLocalPath = req.files?.videofile[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400, "Video file missing!!!")
    }

    let thumbnailLocalPath;

    if ( req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    const videofile = await uploadOnCloudinary(videoLocalPath, "video");

    if(!videofile){
        throw new ApiError(400, "Error while uploading video file");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail){
        throw new ApiError(400, "Error while uploading thumbnail file");
    }

    const video = await Video.create(
        {
            videofile: videofile.url,
            thumbnail: thumbnail.url,
            title,
            description,
            duration: videofile.duration,
        }
    )

    //const publishedVideo = await Video.findById(video._id)

    const publishedVideo = await Video.aggregate(
        [
            {
                $lookup:{
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                }
            },
            {
                $unwind: "$ownerDetails"
            },
            {
                $project:{
                    videofile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    "ownerDetails._id": 1,
                    "ownerDetails.username": 1,
                    "ownerDetails.avatar": 1,
                }
            }
        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            publishedVideo[0],
            "Video published successfully."
        )
    )
})

export {
    publishVideo,
}