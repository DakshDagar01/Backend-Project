import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import User from "../models/user.model.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/Cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        //find user with this id
        //generate tokens
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.RefreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    } 
    catch (error) {
        throw new ApiError(500,"Something Went Wrong while generating Tokens")
    }
}
const registerUser=asyncHandler(async(req,res)=>{
   // get user details from frontend
   // validation-not Empty
   // check if user already exists:username and email
   // check for images,check for avatar
   // upload them to cloudinary 
   // create user object-create entry in db
   // remove password and refresh token field from response
   // check for response
   // return res

    const {fullname,email,username,password}=req.body

    if([fullname,email,username,password].some(field => field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }
    const pattern=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if(!pattern.test(email)){
        console.log("Invalid Email Format")
    }

    const existingUser=await User.findOne({
        $or:[{email},{username}]
    })
    if(existingUser){
        throw new ApiError(409,"User Already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverImageLocalPath=req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File is required")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500,"Error while Uploading on Avatar")
    }
    const user=await User.create({
        fullname,
        email,
        password,
        username:username.toLowerCase(),
        coverImage:coverImage?.url,
        avatar:avatar.url
    })
    const CreatedUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!CreatedUser){
        throw new ApiError(500,"Something Went Wrong while registering User")
    }
    return res.status(201).json( 
        new ApiResponse(200,CreatedUser,"User Registered")
    )
})
const loginUser=asyncHandler(async(req,res)=>{
    //req-body->data
    //username or email based login
    //find the user
    //password check
    //access and refresh token
    //send cookie 
    const {username,email,password}=req.body
    if(!(username || email)){
        throw new ApiError(404,"Username or Email required")
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(401,"User doesnot exist")
    }
    const match=await user.isPasswordCorrect(password)

    if(!match){
        throw new ApiError(400,"Invalid Password")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(201)
    .cookie("AccessToken",accessToken,options)
    .cookie("RefreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("AccessToken",options)
    .clearCookie("RefreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User Logged Out Successfully"  
        )
    )
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies?.RefreshToken || req.body?.RefreshToken
    if(!incomingRefreshToken){
        throw new ApiError(400,"unauthorized request")
    }
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.Refresh_TOKEN_SECRET)
    const user=await User.findOne({_id:decodedToken?._id})
    if(!user){
        throw new ApiError(401,"Invalid Refresh Token")
    }
    if(incomingRefreshToken!==user?.RefreshToken){
        throw new ApiError(401,"Refresh Token expired")
    }
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
    return res.status(200)
    .cookie("AccessToken",accessToken,options)
    .cookie("RefreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {accessToken,RefreshToken:refreshToken},
            "New access token generated successfully"
        )
    )


})
const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Old Password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,{},"Password Updated Successfully")
    )
})
const getCurrentUser=asyncHandler(async(req,res)=>{
    const user=req.user
    return res.status(200).json(
        new ApiResponse(200,user,"Current User fetched successfully")
    )
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body

    if(!fullname || !email){
        throw new ApiError(400,"All Fields Are required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")
    console.log(user)
    return res.status(200).json(
        new ApiResponse(200,user,"Account Details Updated Successfully")
    )
})  
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File is required")
    }
    const newAvatar=await uploadOnCloudinary(avatarLocalPath)
    if(!newAvatar.url){
        throw new ApiError(400,"Error while Uploading on Cloduinary")
    }

    const user1=await User.findById(req.user?._id)
    const deleted=await deleteFromCloudinary(user1.avatar)  
    if(!deleted){
        throw new ApiError(500,"Unable to delete from Cloudinary")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:newAvatar.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"Avatar Updated Successfully")
    )
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage File is required")
    }
    const newCoverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!newCoverImage.url){
        throw new ApiError(400,"Error while Uploading on Cloudinary")
    }

    const user1=await User.findById(req.user?._id)
    const deleted=await deleteFromCloudinary(user1.coverImage)  
    if(!deleted){
        throw new ApiError(500,"Unable to delete from Cloudinary")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:newCoverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"coverImage Updated Successfully")
    )
})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")
    }
    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?.id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                email:1,
                avatar:1,
                coverImage:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(400,"Channel does not exists")
    }
    return res.status(200).json(
        new ApiResponse(200,channel[0],"User Channel Fetched Successfully")
    )
})
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(200,user[0].watchHistory,"Fetched User's watch history")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}