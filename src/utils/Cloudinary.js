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
        fs.unlinkSync(localFilePath)
        return response
    } 
    catch (error) {
        fs.unlinkSync(localFilePath)//Upload Failed,therefore remove the locally saved file
        return null
    }
}
const deleteFromCloudinary=async function(url){
    try{
        // Extract part after /upload/
        let path = url.split('/upload/')[1];
        if (!path) return null;

        // Split into folders and filename
        let parts = path.split('/');
        if (parts[0].startsWith('v')) {
            parts.shift();
        }

        // Extract filename without extension
        let filenameWithExt = parts.pop();
        let filename = filenameWithExt.split('.')[0];

        // Reconstruct public_id as string
        const public_id = [...parts, filename].join('/');
        if (!public_id) return null;

        const videoExtensions=['mp4','webm','mov']
        const isVideo=videoExtensions.includes(filenameWithExt.split('.')[1].toLowerCase())
        configureCloudinary(); 
        const response = await cloudinary.uploader.destroy(public_id,{
                resource_type:isVideo ? 'video':'image'
            });
        return response;

    }
    catch(error){
        return null
    }
}
export {
     uploadOnCloudinary,
     deleteFromCloudinary
    }