import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import User from "../models/user.model.js"
import uploadOnCloudinary from "../utils/Cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"

const registerUser=asyncHandler(async(req,res)=>{
   // get user details from frontend
   // validation-not Empty
   // check if user already exists:username and email
   // check for images,check for avatar
   // upload them to cloudinary 
   // create user object-create entry in db
   // remove passwrod and refresh token field from response
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

    console.log(avatarLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File is required")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    console.log(avatar)
    console.log(coverImage)

    if(!avatar){
        throw new ApiError(400,"Avatar File is required")
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
export default registerUser