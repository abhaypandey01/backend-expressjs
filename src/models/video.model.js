import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { title } from "process";

const videoSchema = new Schema(
    {
        videofile: {
            type: {
                url: String,
                public_id: String,
            },
            required: true,
        },
        thumbnail: {
            type: {
                url: String,
                public_id: String,
            },
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref:"User",
        },
        duration: {
            type: Number,
            default: 0,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished:{
            type: Boolean,
            default: true,
        }
    },
    {timestamps: true}
)

videoSchema.index({
    title: "text", description: "text"
})
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)
