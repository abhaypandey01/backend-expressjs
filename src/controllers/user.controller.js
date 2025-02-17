import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js" 
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res,next) => {
    //get user details from frontend
    //validation on entries given by user
    //check if user already exists
    //file avatar and coverimage 
    //upload avatar and image to cloudinary, avatar check
    //create user object - create entry db
    //dont include password and refresh token
    //check for user creation
    //return response

    const { username, email, fullname, password } = req.body;
    console.log(req.body);
    console.log("email: ",email)
    if(
        [username, email, fullname, password].some((field)=> 
        field?.trim() === ""
        )
    ){
        throw new ApiError(400,"All fields are compulsory!!!")
    }

    if(User.findOne({
        $or: [{username},{email}]
    })){
        throw new ApiError(409,"User already Exists!!!")
    }

    console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    console.log(avatarLocalPath, "AVATAR PATH, ",coverImageLocalPath,"cover image path");

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while creating user!!!")
    }

    return res.status(201).json( new ApiResponse(201, createdUser, "User Created Successfully"))

})

export {registerUser}