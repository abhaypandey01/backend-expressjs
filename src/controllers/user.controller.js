import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js" 
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken= refreshToken
        await user.save({validateBeforeSave: false})

        return {
            refreshToken,
            accessToken
        }

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token!!!");
    }
} 

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
    //console.log("email: ",email)
    if(
        [username, email, fullname, password].some((field)=> 
        field?.trim() === ""
        )
    ){
        throw new ApiError(400,"All fields are compulsory!!!")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User already Exists!!!")
    }

    console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
    }

    //console.log(avatarLocalPath, "AVATAR PATH, ",coverImageLocalPath,"cover image path");

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

const loginUser = asyncHandler(async (req, res) => {
    //take username and password from body
    //email and password validation
    //find the user
    //password check
    //refresh and access token
    // send coockies
    const { email, password } = await req.body
    if (!email) {
        throw new ApiError(400,"Email is required")
    }
    const user = await User.findOne(
        {email}
    )

    if (!user) {
        throw new ApiError(404,"User doesnt exists!!!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401,"Invalid credentials")
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken,
        },
        "User logged in successfully"
    )
)
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {},"User Logged Out." )
    )

})

const refreshAccessToken = asyncHandler(async(req, res) => 
    {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401,"Unauthorized  Token" )
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        if (!decodedToken) {
            throw new ApiError(401,"Unauthorized Token" )
        }

        const user = User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401,"Token is expired or already used!!!" )
        }

        const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

        const options = {
            httpOnly: true,
            secure: true,
        }

        return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            200,
            {
                accessToken, refreshToken: refreshToken
            },
            "Access token refreshed."
        )
    } )

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}