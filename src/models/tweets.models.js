import mongoose from "mongoose";

const tweetSchema=new mongoose.Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        type:String,
    }
},{timestamps:true})
const Tweets=mongoose.model("Tweets",tweetSchema)

export {Tweets}