import { Video } from "../models/video.model.js";

export const createVideoIndexes = async () => {
    try {
        await Video.createIndexes({ title: "text" }); // Creating text index
        console.log("Indexes created successfully.");
    } catch (error) {
        console.error("Error creating indexes:", error);
    }
};
