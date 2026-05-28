import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app=express()  //In Express.js, const app = express() is the command used to initialize an Express application instance. It creates an object, typically named app, which contains the entire framework API and serves as the foundation for building your web server.


//app.use(cors()) // doing this much allows all the frontends to access your backend. 
// app.use() = apply middleware
// Middleware runs on every request
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

// These app.use() calls define global middleware that process every incoming request in sequence. Each middleware conditionally acts on the request (e.g., parsing JSON, serving static files, reading cookies) before passing control to the next middleware or route handler.

app.use(express.json({limit: "16kb"}))  // This middleware lets your server read JSON data sent in the request body. If request contains JSON, parse it and give me a JS object.

app.use(express.urlencoded({extended:true,limit:"16kb"})) //If request comes from a form, convert it into usable JS object.

app.use(express.static("public")) //if asked by get, If file exists in public, just send it.

app.use(cookieParser()) //Reads cookies from incoming requests. Cookies are a way for the backend to remember a user between requests. Since HTTP is stateless (every request is independent), cookies help maintain things like login sessions, preferences, etc.
 

//routes
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/videos.routes.js'
import tweetRouter from './routes/tweets.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import healthcheckRouter from './routes/healthCheck.routes.js'


//routes declaration
// app.get - not applicable here. You can use app.get(), app.post(), etc. directly in app.js. But then every single route in your entire backend has to live in app.js.
app.use("/api/v1/users",userRouter) //http://localhost:8000/api/v1/users/
app.use("/api/v1/videos",videoRouter) 
app.use("/api/v1/tweets",tweetRouter) 
app.use("/api/v1/subscriptions",subscriptionRouter) 
app.use("/api/v1/playlists",playlistRouter) 
app.use("/api/v1/likes",likeRouter) 
app.use("/api/v1/comments",commentRouter) 
app.use("/api/v1/dashboard",dashboardRouter) 
app.use("/api/v1/healthcheck",healthcheckRouter) 

export default app