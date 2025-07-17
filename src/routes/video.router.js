import {Router} from "express"
import Upload from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    deleteAVideo,
    getAllVideos, 
    getVideoById, 
    publishAvideo, 
    togglePublishStatus, 
    updateVideo
} from "../controllers/video.controller.js"

const router=Router()
router.use(verifyJWT)

router.route("/")
    .get(getAllVideos)
    .post(
        Upload.fields([
            {
                name:"videoFile",
                maxCount:1
            },
            {
                name:"thumbnail",
                maxCount:1
            }
        ]),
        publishAvideo
    )
router.route("/:videoId")
    .get(getVideoById)
    .patch(Upload.single("thumbnail"),updateVideo)
    .delete(deleteAVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router
