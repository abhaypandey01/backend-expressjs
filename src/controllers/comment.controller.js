import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";
import { Comment } from "../models/comment.model.js";

/*
controllers to write:
1. get all comments
2. add comment
3. update comment
4. delete comment
*/

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(401, "Comment cannot be empty!!!");
    }

    if(!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid video id, video not found!!!");
    }

    const comment = await Comment.create(
        {
            content,
            video: videoId,
            owner: userId,
        }
    )

    const newComment = await Comment.findById(comment._id);

    if(!newComment) {
        throw new ApiError(401, "Comment not added try again.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newComment,
            "Comment added successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if(!isValidObjectId(commentId)) {
        throw new ApiError(401, "Invalid video id.")
    }

    if(!content) {
        throw new ApiError(401, "Comment cannot be empty.")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content,
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
            comment,
            "Comment updated successfully."
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if(!isValidObjectId(commentId)) {
        throw new ApiError(401, "Invalid comment id.");
    }

    const comment = await Comment.findById(commentId);

    if( comment.owner.toString() !== userId.toString() ) {
        throw new ApiError(402, "Only owner can delete comment.");
    }

    const commentDeleted = await Comment.findByIdAndDelete(commentId);

    if(!commentDeleted) {
        throw new ApiError(500, "Error while deleting comment.")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully."
        )
    )
})

const listAllComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if( !(isValidObjectId(videoId)) ) {
        throw new ApiError(401, "Invalid video ID/ video not found.")
    }

    const commentAggregate = await Comment.aggregate([
        {
            $match:{
            video: new mongoose.Types.ObjectId(videoId),
        },
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
        $lookup:{
            from: "likes",
            localField: "_id",
            foreignField: "comment",
            as: "likes"
        }
    },
    {
        $addFields:{
            likesCount:{
                $size: "$likes"
            },
            owner: {
                $first: "$owner"
            },
            isLiked: {
                $cond:{
                    if: { $in: [new mongoose.Types.ObjectId(req.user?._id), "$like.likedBy"] },
                    then: true,
                    else: false,
                }
            }
        }
    },
    {
        $sort: {
            createdAt: -1,
        }
    },
    {
        $project:{
            content: 1,
            createdAt: 1,
            likesCount: 1,
            owner: {
                username: 1,
                fullname: 1,
                avatar: 1,
            },
            isLiked: 1
        }
    }
    ]);

    if( !commentAggregate ) {
        throw new ApiError(401, "Comments aggregation failed.")
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregatePaginate(
        commentAggregate,
        options
    );

    if (comments.length == 0) {
        throw new ApiError(500, "Couldnt fetch comments!!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Comments fetched successfully."
        )
    )
})

export {
    addComment,
    updateComment,
    deleteComment,
    listAllComments,
    
}