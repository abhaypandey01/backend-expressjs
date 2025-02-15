import {v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if(!localfilepath) return console.log('File not provided');
        const response = await cloudinary.uploader.upload(localfilepath,
            {
                format: "auto"
            }
        )
        fs.unlinkSync(localfilepath)
        return response
        
    } catch (error) {
        fs.unlinkSync(localfilepath)
        return console.log("cloudinary.js something went wrong in uploading files!!!")
    }
}

export {uploadOnCloudinary}