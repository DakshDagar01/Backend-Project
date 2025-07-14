import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import User from "../models/user.model.js"
import uploadOnCloudinary from "../utils/Cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        //find user with this id
        //generate tokens
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
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

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File is required")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

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
            $set:{
                refreshToken:undefined
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
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(400,"unauthorized request")
    }
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.Refresh_TOKEN_SECRET)

    const user=await User.findOne(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"Invalid Refresh Token")
    }
    if(incomingRefreshToken!==user?.refreshToken){
        throw new ApiError(401,"Refresh Token expired")
    }
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,newrefreshToken}=await generateAccessAndRefreshToken(user._id)
    return res.status(200)
    .cookie("AccessToken",accessToken,options)
    .cookie("RefreshToken",newrefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {accessToken,refreshToken:newrefreshToken},
            "New access token generated successfully"
        )
    )


})
export {registerUser,loginUser,logoutUser,refreshAccessToken}