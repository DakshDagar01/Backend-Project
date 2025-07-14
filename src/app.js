import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))//parse incoming Request Object as a JSON Object
app.use(express.urlencoded())//can only parse incoming Request Object if strings or arrays
app.use(express.static("public"))//Serving static files such as images CSS files ,JS files etc.
app.use(cookieParser())

//Routes Import

import userRouter from "./routes/user.routes.js"
app.use("/api/v1/users",userRouter)



export default app