// require('dotenv').config()
import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config(
    {
        path: './.env'
    }
)

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("Error: ", error);
        throw error;
    })

    

    app.listen(process.env.PORT || 3000, () => {
        console.log("DB connection successful, port: ", process.env.PORT);
    });
    
})
.catch((err) => {
    console.log("MONGODB connection error!!! ", err);
})