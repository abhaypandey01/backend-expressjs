import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import fs from "fs";
import util from "util";
import { title } from "process";
import { watchHistory } from "./user.controller.js";

const unlinkFile = util.promisify(fs.unlink);

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
            videofile:{
                url: videofile.url,
                public_id: videofile.public_id,
            },
            thumbnail:{
                url: thumbnail.url,
                public_id: thumbnail.public_id,
            },
            title,
            description,
            duration: videofile.duration,
            owner: req.user?._id,
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

const getVideoDetails = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id, video not found!")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscriberCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id, "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false,
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscriberCount: 1,
                            isSubscribed: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "commentOwner",
                    }
                    },
                {
                    $unwind: "$commentOwner"
                },
                {
                    $sort:{
                        createdAt: -1,
                    }
                },
                {
                    $limit: 5,
                },
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        //video: 1,
                        "commentOwner.fullname": 1,
                        "commentOwner.username": 1,
                        "commentOwner.avatar": 1,
                        createdAt: 1,
                    }
                }
                ]
            }
        },
        {
            $addFields: {
                totalComments: {
                    $size: "$comments"
                },
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [ req.user?._id, "$likes.likedBy" ]
                        },
                        then: true,
                        else: false,
                    }
                }
            }
        },
        {
            $project:{
                title: 1,
                description: 1,
                "videofile.url": 1,
                "thumbnail.url": 1,
                duration: 1,
                createdAt: 1,
                views: 1,
                owner: 1,
                comments: 1,
                likesCount: 1,
                totalComments: 1,
                isLiked: 1,
            }
        }
    ]);

    // console.log(video);
    

    if (!video) {
        throw new ApiError(404, "Cant find video something went wrong!!!")
    }

    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: {
                views: 1,
            }
        }
    );

    await User.findByIdAndUpdate( req.user?._id,{
        $addToSet:{
            watchHistory: videoId,
        }
    } );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video[0],
            "Video details fetched succesfully."
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const userId = req.user._id;

    if(!videoId){
        throw new ApiError(400, "Video Id required!!!")
    }

    if (!(mongoose.Types.ObjectId.isValid(videoId))) {
        throw new ApiError(401, "Invallid ID")
    }

    const video = await Video.findById(videoId)

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(402, "Only the owner can delete videos.")
    }

    const deleteVideo = await deleteFromCloudinary(video.videofile.public_id, "video")

    const deleteThumbnail = await deleteFromCloudinary(video.thumbnail.public_id, "image")

    if(!(deleteThumbnail || deleteVideo)){
        throw new ApiError(500, "Couldnt delete video and thumbnail!!!")
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Video deleted successfully."
        )
    )

})

// getvideos based on querry
const getAllVideos = asyncHandler(async (req, res) => {

    const { searchQuery, sortType, page = 1, limit = 10 } = req.query;

    if (!(searchQuery || sortType)) {
        throw new ApiError(401, "Invalid query or query missing!!!")
    }

    let sorted = sortType === "asc" ? 1 : -1

    const videoList = await Video.aggregate([
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $sort:{
                createdAt: sorted,
            }
        },
        {
            $skip: (parseInt(page) -1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $project: {
                videofile: 1,
                thumbnail: 1,
                description: 1,
                title: 1,
                "owner.fullname": 1,
                "owner.username" : 1,
                "owner.avatar" : 1,
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videoList,
            "Search query executed succefully"
        )
    )

})

const updateVideoDetails = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const userId = req.user?._id

    if(!( title || description)) {
        throw new ApiError(401, "Title and description missing in body.")
    }

    if( !mongoose.Types.ObjectId.isValid(videoId) ) {
        throw new ApiError(401, "Invalid video id.")
    }

    const video = await Video.findById(videoId);

    

    if(!video) {
        throw new ApiError(401, "Cannot find video.")
    }

    console.log(video.owner);

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(402, "Only the owner can update video.")
    }

    const thumbnailLocalPath = req.file?.path;

    if(!thumbnailLocalPath){
        throw new ApiError(401, "Thumbnail missing!!!")
    }

    const thumbnailToDelete = video.thumbnail.public_id;

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail) {
        throw new ApiError(500, "Error while uploading thumbnail on cloudinary");
    }

    console.log(`thumbnail url: ${thumbnail.url}, thumbnail public id: ${thumbnail.public_id}`);
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail:{
                    url: thumbnail.url,
                    public_id: thumbnail.public_id,
                }
            }
        },
        {
            new: true,
        }
    ).select("title description thumbnail videofile owner")

    if(!updatedVideo) {
        throw new ApiError(500, "Could not update the video details.")
    }

    await deleteFromCloudinary(thumbnailToDelete);
    await unlinkFile(thumbnailLocalPath);

    return res.status(200)
    .json(
        200,
        updatedVideo,
        "Video details updated successfully."
    )
})

const togglePublishVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if(!(mongoose.Types.ObjectId.isValid(videoId))) {
        throw new ApiError(402, "Invalid video id.")
    }

    const video = await Video.findById(videoId)

    if(video.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "Only owner can toggle the publish status.")
    }

    const videoPublishToggled = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished: !(video.isPublished),
            }
        },
        {
            new: true,
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
        200,
        videoPublishToggled,
        "Publish status toggled succesfully"
        )
    )
})

export {
    publishVideo,
    getVideoDetails,
    deleteVideo,
    getAllVideos,
    updateVideoDetails,
    togglePublishVideo
}