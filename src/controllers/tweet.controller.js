import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";

const publishTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if(!content) {
        throw new ApiError(401, "Tweet content missing, tweet cannot be empty.");
    }

    const createTweet = await Tweet.create({
        content,
        owner: req.user?._id,
    })

    const tweet = await Tweet.findById(createTweet._id);

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet published successfully."
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if(!content) {
        throw new ApiError(401, "Tweet content missing, tweet cannot be empty.");
    }
    
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(401, "Invalid Id, tweet could not be found.")
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(401, "Tweet not found.")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(402, "Only owner can update the tweet.")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate( tweetId, 
        {
            content,
        },
        { new: true }
    )

    return res.status(200)
    .json( new ApiResponse(
        200,
        updatedTweet,
        "Tweet updated successfully."
    ))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!tweetId) {
        throw new ApiError(401, "Tweet id required.")
    }

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(402, "Invalid id, tweet not found.")
    }

    const tweet = await Tweet.findById(tweetId);

    if( tweet.owner.toString() !== req.user?._id.toString() ) {
        throw new ApiError(402, "Only owner can delete tweet!!!")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet deleted successfully."
        )
    )
})

const ListAllTweets = asyncHandler(async (req, res) => {
    const { query, sortType, page = 1, limit = 10 } = req.query;

    if(!(query || sortType)) {
        throw new ApiError(401, "Search index and sort type required to specify.")
    }

    const sorted = sortType === "asc" ? 1 : -1;

    const allTweets = await Tweet.aggregate([
        {
            $match:{
                $text: { $search: query.toString() }
            }
        },
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
            $sort: {
                createdAt: sorted,
            }
        },
        {
            $skip: (parseInt(page) -1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
        {
            $project:{
                content: 1,
                "owner.fullname": 1,
                "owner.username": 1,
                "owner.avatar": 1,
                createdAt: 1,
                updatedAt: 1,
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(
        200,
        allTweets,
        "Tweets fetched successfully."
        )
    )
})

export {
    publishTweet,
    updateTweet,
    deleteTweet,
    ListAllTweets
}