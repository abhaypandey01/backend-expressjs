import {v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

const uploadOnCloudinary = async (localfilepath, type = "image") => {
    try {
        if(!localfilepath) return console.log('File not provided');
        const response = await cloudinary.uploader.upload(localfilepath,
            {
                resource_type: type,
            }
        )
        //fs.unlinkSync(localfilepath)
        return response
        
    } catch (error) {
        fs.unlinkSync(localfilepath)
        return console.log("cloudinary.js something went wrong in uploading files!!!")
    }
}

const deleteFromCloudinary = async (publicId, type = "image") => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: type,
        })

        if (result.result !== "ok") {
            console.log("error while deleting files from cloudinary", result);
        }
        return true
    } catch (error) {
        console.error("cloudinary.js something went wrong while deleting files", error);
        return false
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}