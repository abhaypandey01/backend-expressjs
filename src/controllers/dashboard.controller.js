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

})

export {
    getChannnelStats,
    getChannnelVideos,
}