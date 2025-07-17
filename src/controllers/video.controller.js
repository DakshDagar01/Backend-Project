import ApiError from "../utils/ApiError.js"
import asyncHandler from "../utils/asyncHandler.js"
import User from "../models/user.model.js"
import mongoose from "mongoose"
import Video from "../models/video.model.js"
import ApiResponse from "../utils/ApiResponse.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/Cloudinary.js"

const getAllVideos=asyncHandler(async(req,res)=>{
    // Todo: Get all videos based on query,sort,pagination
    // Check UserId and find user and check if it exists
    // In Aggregation Pipeline:
    // filter based on user id
    // find the videos for the user
    // seperate each video
    // apply the query and sort operation 
    // set properties for pagination
    // regroup the videos into an array
    const { page = 1, limit = 10, query, sortBy="createdAt", sortType="desc", userId } = req.query

    if(!userId){
        throw new ApiError(400,"UserId is required")
    }

    const existingUser=await User.findById(userId)

    if(!existingUser){
        throw new ApiError(400,"User not found");
    }

    const pageNumber=parseInt(page,10)
    const limitNumber=parseInt(limit,10)

    const user=User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foriegnField:"owner",
                as:"videos"
            }
        },
        {
            $unwind:"$videos"
        },
        {
            $match:{
                ...(query && {"videos.title":{$regex:query,$options:"i"}})
            }
        },
        {
            $sort:{
                [`videos.${sortBy}`]:sortType==="asc" ? 1:-1
            }
        },
        {
            $skip: (pageNumber-1)*limitNumber
        },
        {
            $limit:limitNumber
        },
        {
            $group:{
                _id:"$_id",
                videos:{ $push:"$videos"}
            }
        }
    ])

    if(!user || !user.length){
        throw new ApiError(404,"No Videos Found")
    }

    const videos=user[0].videos
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                currentPage:pageNumber,
                totalVideos:videos.length,
                videos
            },
            "Videos Fetched Successfully")
    )
})
const publishAvideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body
    if([title,description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    const videoLocalPath=req.file?.videofile[0]?.path
    const thumbnailLocalPath=req.file?.thumbnail[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400,"Video is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    const video=await uploadOnCloudinary(videoLocalPath)
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)

    if(!video || !thumbnail){
        throw new ApiError(500,"Failed to upload Video and Thumbnail")
    }
    const newVideo=Video.create({
        videoFile:video.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:video.duration,
        owner:req.user._id
    })
    if(!newVideo){
        throw new ApiError(500,"Something went wrong while creating newVideo")
    }

    return res.status(200).json(
        200,
        newVideo,
        "NewVideo created successfully"
    )
})
const getVideoById=asyncHandler(async(req,res)=>{
    const {videoId}=req.params

    if(!videoId?.trim()){
        throw new ApiError(400,"VideoId is required")
    }
    const video=Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not Found!")
    }
    return res.status(200).json(
        200,
        video,
        "Video Fetched successfully"
    )
})
const updateVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const {title,description}=req.body

    if(videoId?.trim()===""){
        throw new ApiError(400,"VideoId is required")
    }

    if([title,description].some((field)=>field.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }
    let thumbnailLocalPath;
    if(req.file && req.file.path){
        thumbnailLocalPath=req.file.path
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail){
        throw new ApiError(500,"Error Uploading file on Cloudinary")
    }

    const video=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title:title,
                description:description,
                thumbnail:thumbnail.url
            }
        },
        {
            new:true
        }
    )

    if(!video){
        throw new ApiError(500,"Something went wrong,Couldn't update the video details")
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video details updated successfully"
        )
    )
})
const deleteAVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params

    if(videoId?.trim()===""){
        throw new ApiError(400,"VideoId is required")
    }

    const video=Video.findByIdandDelete(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    let url=video.videoFile
    url.split('/upload/')[1].split('/')
    url.shift()
    let filename=url.pop().split('.')[0]
    const public_id=[...url,filename]

    const deletefromcloudinary=await deleteFromCloudinary(public_id)

    if(!deletefromcloudinary){
        throw new ApiError(500,"Unable to delete file from Cloudinary")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video deleted successfully"
        )
    )
})
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(videoId?.trim()===""){
        throw new ApiError(400,"Video Id is required")
    }

    const video=Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!isPublished
            }
        },
        {
            new:true
        }
    )

    if(!video){
        throw new ApiError(404,"Video not found!")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "isPublished toggled successfully"
        )
    )
})
export {
    getAllVideos,
    publishAvideo,
    getVideoById,
    updateVideo,   
    deleteAVideo,
    togglePublishStatus
}