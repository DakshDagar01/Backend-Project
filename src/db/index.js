import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

const DBconnect=async ()=>{
    try {
       const connection=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`) 
       console.log(`\n Mongo DB connected successfully !!, ${connection.Connection}`)
    } 
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1)
    }
}
export default DBconnect