import asyncHandler from "../utils/asyncHandler.js"

const registerUser=asyncHandler(async(req,res)=>{
    res.status(200).send({
        message:"Request Recieved"
    })
})
export default registerUser