
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js'
import app from './app.js'
import connectDB from './db/index.js'

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`App listens at ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        // these
        console.error('MONGODB CONNECTION ERROR', err)
        process.exit(1)
    })
