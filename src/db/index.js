import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

const DBconnect=async ()=>{
    try {
       const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`) 
       console.log(`Mongo DB connected successfully !!, ${connectionInstance.connection.host}`)
    } 
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1)//Immediately terminates the Node.Js process
    }
}
export default DBconnect