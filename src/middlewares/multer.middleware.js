import multer from "multer";
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        console.log("Saving file to","../public/temp")
        cb(null,"../public/temp")
    },
    filename:function(req,file,cb){
        console.log("files are: ",file)
        cb(null,file.originalname)
    }
})
const Upload=multer({storage,})
export default Upload