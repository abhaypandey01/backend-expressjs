import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";

const getChannnelStats = asyncHandler( async(req, res) => {
    const { channelId } = req.params;

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid user id, user not found!")
    }

    const channel = await User.findById(channelId).select("fullname username avatar coverImage").lean();

    if(!channel) {
        throw new ApiError(404, "channel stats not found!")
    }

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    const totalSubscriberCount = await Subscription.countDocuments({ channel: channelId }).exec();

    const stats = {
        channel,
        totalVideos: videoStats.length > 0 ? videoStats[0].totalVideos : 0,
        totalViews: videoStats.length > 0 ? videoStats[0].totalViews : 0,
        totalSubscribers: totalSubscriberCount
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        stats,
        "Channel stats fetched successfully."
    ) )

} )

const getChannnelVideos = asyncHandler( async(req, res) => {
    const { channelId, page=1, limit=5 } = req.params;
    //const userId = req.user?._id;

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid id, channel not find.")
    }

    const videoList = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(channelId),
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
                as: "comments"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                totalComments: {
                    $size: "$comments"
                },
            }
        },
        {
            $sort:{
                createdAt: -1,
            }
        },
        {
            $skip: (parseInt(page) -1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit),
        },
        {
            $project: {
                "videofile.url": 1,
                "thumbnail.url": 1,
                title: 1,
                duration: 1,
                isPublished: 1,
                likesCount: 1,
                totalComments: 1,
                createdAt: 1,
            }
        }
    ]);

    return res.status(200)
    .json( new ApiResponse(
        200,
        videoList,
        "Channel videos listed successfully."
    ) )
})

export {
    getChannnelStats,
    getChannnelVideos,
}