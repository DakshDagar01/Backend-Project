import dotenv from "dotenv"
import DBconnect from "./db/index.js"
import app from "./app.js"
dotenv.config({ path: '../.env' });
const PORT=process.env.PORT

DBconnect()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server is Running on Port ${PORT}`)
    })
})
.catch((err)=>{
    console.log("MongoDb connection Failed",err) 
})