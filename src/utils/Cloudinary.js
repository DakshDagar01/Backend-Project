import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
let isConfigured = false;

function configureCloudinary() {
  if (isConfigured) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  isConfigured = true;
}


const uploadOnCloudinary=async function(localFilePath){
    try {
        if(!localFilePath) return null
        configureCloudinary(); 

        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log(response)
        fs.unlinkSync(localFilePath)
        return response
    } 
    catch (error) {
        fs.unlinkSync(localFilePath)//Upload Failed,therefore remove the locally saved file
        return null
    }
}
export default uploadOnCloudinary