import { ApiError } from "../utils/ApiError.js";
import  { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleSubscribe = asyncHandler( async (req, res) => {
    const { channelId } = req.params;
    if(!isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid id, channel not found!")
    }

    const subscribedAlready = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id,
    })

    if(subscribedAlready) {
        await Subscription.deleteOne({
            channel: channelId,
            subscriber: req.user?._id,
        })

        return res.status(200)
        .json( new ApiResponse(
            200,
            { isSubscribed: false },
            "Subscription removed successfully."
        ) )
    }

    await Subscription.create(
        {
            channel: channelId,
            subscriber: req.user?._id,
        }
    )

    return res.status(200)
    .json( new ApiResponse(
        200,
        { isSubscribed: true },
        "Subscription added successfully."
    ) )
} )

const listAllSubscribers = asyncHandler( async (req, res) => {
    const { channelId } = req.params;
    if(!isValidObjectId(channelId)) {
        throw new ApiError(200, "Invalid id, channel not found.")
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $project:{
                _id: 0,
                "subscriber.fullname": 1,
                "subscriber.username": 1,
                "subscriber.avatar": 1
            }
        }
    ])

    if(!subscriberList) {
        throw new ApiError(500, "Subsribers list cannot be fetched!!!")
    }

    return res.status(200)
    .json( new ApiResponse(
        200,
        subscriberList,
        "Subscribers detail fetched."
    ) )
})

const channelsSubscribed = asyncHandler( async (req, res) => {
    const { userId } = req.params;
    if(!isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid id, user not found!")
    }

    const channelsList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
            }
        },
        {
            $unwind: "$channel"
        },
        {
            $project: {
                _id: 0,
                "channel.fullname": 1,
                "channel.username": 1,
                "channel.avatar": 1,
            }
        }
    ])

    if(!channelsList) {
        throw new ApiError(500, "Channels list cannot be fetched!!!")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            channelsList,
            "Channels list found successfully."
        )
    )
})

export {
    toggleSubscribe,
    listAllSubscribers,
    channelsSubscribed,
}