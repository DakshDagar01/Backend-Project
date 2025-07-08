import dotenv from "dotenv"
import DBconnect from "./db/index.js"
dotenv.config({ path: '../.env' });

DBconnect()