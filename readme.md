<div align="center">

<img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white" /> 
<img src="https://img.shields.io/badge/Express-v5.2-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-v9.3-47A248?style=for-the-badge&logo=mongodb&logoColor=white" /> 
<img src="https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
<img src="https://img.shields.io/badge/Gemini_AI-Integrated-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/JWT-Auth-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
<img src="https://img.shields.io/badge/API-Live-brightgreen?style=for-the-badge&logo=render&logoColor=white" />

# 🎬 StreamCore API

### A production-grade YouTube-like backend, built from scratch with Node.js, MongoDB, and Gemini AI.

[Features](#-features) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Quick Start](#-quick-start) · [Design Decisions](#-design-decisions) · [Live API](https://stream-core.onrender.com/api/v1/healthcheck)

</div>

---

## What Is This?

StreamCore is a **fully-featured REST API** powering a video-sharing platform. It handles everything a modern video platform needs : user identity, media uploads, subscriptions, engagement (likes/comments), AI-assisted discovery, and creator analytics.

This isn't a tutorial clone. It's built with production patterns:

- **Dual-token JWT auth** with rotation + server-side revocation
- **Cloudinary CDN** for media (images + videos) : zero binary data in MongoDB
- **MongoDB Aggregation Pipelines** for complex relational queries without a SQL database
- **Gemini AI** for comment moderation, semantic search expansion, and auto-SEO tagging
- **Tiered rate limiting** : global, auth-specific, and AI-specific limits
- **Content-based video recommendations** from watch history : no external ML service

---

## ✨ Features

| Domain | Capabilities |
|--------|-------------|
| **Auth** | Register, Login, Logout, Refresh Token, Password Change |
| **Users** | Profile management, Avatar/Cover upload, Watch History |
| **Videos** | Upload, Publish/Unpublish toggle, Paginated feed, Recommendations |
| **Engagement** | Like/Unlike videos, comments & tweets : polymorphic model |
| **Comments** | CRUD with AI content moderation before save |
| **Subscriptions** | Subscribe/Unsubscribe, Subscriber list, Subscribed channels |
| **Playlists** | Create, manage, add/remove videos |
| **Creator Dashboard** | Channel stats : total views, subscribers, videos, likes |
| **AI Features** | Semantic search expansion, auto-tag generation, description generator |
| **Search** | Tag-based + AI-expanded full-text search with watch history recommendations |

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                 │
│              (Browser / Mobile / Postman)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  MIDDLEWARE CHAIN                        │   │
│  │  Rate Limiter → CORS → Body Parser → Cookie Parser       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ROUTER LAYER                          │   │
│  │  /users  /videos  /comments  /likes  /subscriptions      │   │
│  │  /playlists  /dashboard  /ai  /tweets  /healthcheck      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌──────────┐  ┌───────────┴──────────┐  ┌──────────────────┐   │
│  │ verifyJWT│  │    CONTROLLERS       │  │  multer (upload) │   │
│  │middleware│  │  Business Logic      │  │  middleware      │   │
│  └──────────┘  └──────────┬───────────┘  └──────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼────────────────┐
           ▼               ▼                ▼
    ┌─────────────┐  ┌──────────┐   ┌──────────────┐
    │  MongoDB    │  │Cloudinary│   │  Gemini AI   │
    │  Atlas      │  │  CDN     │   │  (Google)    │
    │             │  │          │   │              │
    │  Users      │  │  Avatars │   │  Moderation  │
    │  Videos     │  │  Covers  │   │  Tags        │
    │  Comments   │  │  Videos  │   │  Search      │
    │  Likes      │  │  Thumbs  │   │  Descriptions│
    │  Subs       │  └──────────┘   └──────────────┘
    │  Playlists  │
    └─────────────┘
```

### Request Lifecycle

Every request passes through this exact sequence:

```
Incoming Request
      │
      ├─► [1] generalRateLimiter     (200 req / 15 min per IP)
      ├─► [2] cors()                  (validates Origin header)
      ├─► [3] express.json()          (parses JSON body)
      ├─► [4] express.urlencoded()    (parses form data)
      └─► [5] cookieParser()          (parses req.cookies)
                    │
         ┌──────────┴──────────┐
         │  Route-level MW     │
         │  verifyJWT          │  → decodes JWT → attaches req.user
         │  multer.upload()    │  → saves file to /public/temp
         └──────────┬──────────┘
                    │
             Controller
                    │
             ┌──────┴──────┐
             │ Success     │ Error
             ▼             ▼
        ApiResponse    ApiError → global error handler
        res.json()     res.status(code).json({ message })
```

### Authentication Flow

**Register**

| Step | Action |
|------|--------|
| 1 | Validate fields + password strength |
| 2 | Upload avatar to Cloudinary |
| 3 | Hash password with bcrypt (10 rounds) |
| 4 | Save user to MongoDB |
| 5 | Return `201 Created` |

**Login**

| Step | Action |
|------|--------|
| 1 | Find user by username or email |
| 2 | Verify password with `bcrypt.compare()` |
| 3 | Generate access token (1d) + refresh token (10d) |
| 4 | Store refresh token in MongoDB |
| 5 | Set both tokens as `httpOnly` + `Secure` cookies |
| 6 | Return user object + tokens in response body |

**Authenticated Request**

| Step | Action |
|------|--------|
| 1 | Extract token from cookie or `Authorization` header |
| 2 | Verify with `jwt.verify()` using `ACCESS_TOKEN_SECRET` |
| 3 | Fetch user from DB, exclude `password` and `refreshToken` |
| 4 | Attach to `req.user` : available in all downstream controllers |

**Token Refresh**

| Step | Action |
|------|--------|
| 1 | Extract refresh token from cookie or request body |
| 2 | Verify signature with `REFRESH_TOKEN_SECRET` |
| 3 | Compare against token stored in MongoDB (rotation check) |
| 4 | Generate new access + refresh token pair |
| 5 | Update MongoDB with new refresh token |
| 6 | Set new cookies, return new tokens |

**Logout**

| Step | Action |
|------|--------|
| 1 | Remove refresh token from MongoDB via `$unset` |
| 2 | Clear both cookies from browser |
| 3 | Access token remains valid until expiry (stateless trade-off) |

### Database Schema Relationships

```
User ──────────────────────────────────────┐
│ _id, username, email, fullName           │
│ avatar, coverImage (Cloudinary URLs)     │
│ password (bcrypt), refreshToken          │
│ watchHistory: [VideoId]                  │
└──────┬──────────────────────────────────-┘
       │
       │ 1:N                         M:N (via Subscription)
       ▼                             ┌──────────────────────┐
   Video                             │ subscriber: UserId   │
   │ _id, title, description         │ channel:    UserId   │
   │ videoFile, thumbnail (URLs)     └──────────────────────┘
   │ duration, views, isPublished
   │ owner: UserId
   │ tags: [String]
   └──────┬────────────────────────
          │
          │ 1:N
          ▼
      Comment
      │ _id, content
      │ video: VideoId
      │ owner: UserId
      └────────────────────────────
                                    Like (Polymorphic)
                                    │ video?:   VideoId
                                    │ comment?: CommentId
                                    │ tweet?:   TweetId
                                    │ likedBy:  UserId

                                    Playlist
                                    │ name, description
                                    │ videos: [VideoId]
                                    │ owner: UserId
```

---

## 📁 Folder Structure

```
professional-project/
├── src/
│   ├── index.js                    # Entry: DB connect → server start
│   ├── app.js                      # Express app, middleware, route mounts
│   ├── constants.js                # DB_NAME constant
│   │
│   ├── db/
│   │   └── index.js                # MongoDB connection (Mongoose)
│   │
│   ├── models/
│   │   ├── user.model.js           # Schema + bcrypt hooks + JWT methods
│   │   ├── videos.model.js         # Schema + aggregate-paginate plugin
│   │   ├── comment.model.js        # Schema + aggregate-paginate plugin
│   │   ├── like.model.js           # Polymorphic: video/comment/tweet
│   │   ├── subscription.model.js   # subscriber ↔ channel junction
│   │   └── playlist.model.js       # videos array + owner
│   │
│   ├── controllers/
│   │   ├── user.controller.js      # Register, Login, Profile, History
│   │   ├── video.controller.js     # Upload, CRUD, Feed, Recommendations
│   │   ├── comment.controller.js   # CRUD + AI moderation
│   │   ├── like.controller.js      # Toggle likes
│   │   ├── subscription.controller.js
│   │   ├── playlist.controller.js
│   │   ├── dashboard.controller.js # Channel analytics aggregation
│   │   └── ai.controller.js        # Description generation endpoint
│   │
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── videos.routes.js
│   │   ├── comment.routes.js
│   │   ├── like.routes.js
│   │   ├── subscription.routes.js
│   │   ├── playlist.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── ai.routes.js
│   │   ├── tweet.routes.js
│   │   └── healthcheck.routes.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification → req.user
│   │   └── multer.middleware.js    # Multipart file handling → /public/temp
│   │
│   └── utils/
│       ├── asyncHandler.js         # Async error wrapper for controllers
│       ├── ApiError.js             # Custom error class (extends Error)
│       ├── ApiResponse.js          # Standardized success envelope
│       ├── cloudinary.js           # Upload helper
│       ├── deleteFromCloudinary.js # Delete helper
│       ├── aiService.js            # Moderation, semantic search, tags
│       ├── gemini.js               # Gemini API abstraction
│       └── validatePasswordStrength.js
│
├── public/
│   └── temp/                       # Temporary file storage (pre-Cloudinary)
│
├── .env.example                    # Required environment variables
├── .gitignore
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js v18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)
- A [Cloudinary](https://cloudinary.com) account (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### 1. Clone & Install

```bash
git clone https://github.com/priyansh00soni/streamcore-api.git
cd streamcore-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in every value:

```env
PORT=8000

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/streamcore?retryWrites=true&w=majority

# Set to your frontend URL in production. Never use * in production.
CORS_ORIGIN=http://localhost:3000

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ACCESS_TOKEN_SECRET=your_32_byte_hex_secret
ACCESS_TOKEN_EXPIRY=1d

# Use a DIFFERENT secret from access token
REFRESH_TOKEN_SECRET=your_different_32_byte_hex_secret
REFRESH_TOKEN_EXPIRY=10d

# From your Cloudinary dashboard → Settings → Access Keys
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# From Google AI Studio
GEMINI_API_KEY=your_gemini_api_key
```

> **Tip:** Generate strong secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> Run it twice : use one for ACCESS_TOKEN_SECRET, one for REFRESH_TOKEN_SECRET.

### 3. Run

```bash
# Development (hot reload)
npm run dev

# Production
node src/index.js
```

Server starts at `http://localhost:8000`

### 4. Verify

```bash
curl http://localhost:8000/api/v1/healthcheck
# → { "statusCode": 200, "data": "OK", "message": "Health check passed", "success": true }
```

---

## 📡 API Reference

**Base URL:** `https://stream-core.onrender.com/api/v1`

> Local development: `http://localhost:8000/api/v1`

All responses follow this envelope:

```json
// Success
{ "statusCode": 200, "data": { ... }, "message": "...", "success": true }

// Error
{ "statusCode": 400, "message": "...", "success": false }
```

---

### 🔐 Auth & Users : `/users`

| Method | Endpoint | Auth | Body / Params | Description |
|--------|----------|------|---------------|-------------|
| `POST` | `/users/register` | ❌ | `fullName, email, username, password` + `avatar` (file) + `coverImage` (file, optional) | Register new user. Avatar required. |
| `POST` | `/users/login` | ❌ | `username` or `email` + `password` | Login. Returns tokens in cookies + body. |
| `POST` | `/users/logout` | ✅ | - | Clears cookies, revokes refresh token in DB. |
| `POST` | `/users/refresh-token` | ❌ | `refreshToken` (cookie or body) | Get new access + refresh tokens. |
| `PATCH` | `/users/change-password` | ✅ | `oldPassword, newPassword` | Change password. Validates strength. |
| `GET` | `/users/current-user` | ✅ | - | Get logged-in user's full profile. |
| `PATCH` | `/users/update-account-details` | ✅ | `fullName, email` | Update name and email. |
| `PATCH` | `/users/update-avatar` | ✅ | `avatar` (file) | Replace avatar. Old file deleted from Cloudinary. |
| `PATCH` | `/users/update-cover-image` | ✅ | `coverImage` (file) | Replace cover image. |
| `GET` | `/users/channel/:username` | ✅ | - | Get public channel profile with subscriber count + isSubscribed. |
| `GET` | `/users/watch-history` | ✅ | - | Get watch history with full video + owner details. |

---

### 🎥 Videos : `/videos`

| Method | Endpoint | Auth | Body / Params | Description |
|--------|----------|------|---------------|-------------|
| `GET` | `/videos` | ❌ | `?query, page, limit, sortBy, sortType, userId` | Paginated feed. With query: text search. Without: personalized recommendations from watch history. |
| `POST` | `/videos/publish` | ✅ | `title, description` + `videoFile` (file) + `thumbnail` (file) | Upload video. Auto-generates tags via Gemini. |
| `GET` | `/videos/:videoId` | Optional | - | Get video details. Increments views. Tracks watch history if authenticated. |
| `PATCH` | `/videos/:videoId` | ✅ | `title, description` + `thumbnail` (file, optional) | Update video. Owner only. |
| `DELETE` | `/videos/:videoId` | ✅ | - | Delete video + Cloudinary files. Owner only. |
| `PATCH` | `/videos/toggle-publish/:videoId` | ✅ | - | Toggle public/private. Owner only. |

---

### 💬 Comments : `/comments`

| Method | Endpoint | Auth | Body / Params | Description |
|--------|----------|------|---------------|-------------|
| `GET` | `/comments/:videoId` | ❌ | `?page, limit` | Get paginated comments for a video. |
| `POST` | `/comments/:videoId` | ✅ | `content` | Add comment. Passes AI moderation before save. |
| `PATCH` | `/comments/c/:commentId` | ✅ | `content` | Edit comment. Owner only. |
| `DELETE` | `/comments/c/:commentId` | ✅ | - | Delete comment. Owner only. |

---

### 👍 Likes : `/likes`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `PATCH` | `/likes/toggle/v/:videoId` | ✅ | Toggle like on a video |
| `PATCH` | `/likes/toggle/c/:commentId` | ✅ | Toggle like on a comment |
| `PATCH` | `/likes/toggle/t/:tweetId` | ✅ | Toggle like on a tweet |
| `GET` | `/likes/videos` | ✅ | Get all videos liked by current user |

---

### 🔔 Subscriptions : `/subscriptions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/subscriptions/c/:channelId` | ✅ | Subscribe / Unsubscribe toggle |
| `GET` | `/subscriptions/c` | ✅ | Get channels current user subscribes to |
| `GET` | `/subscriptions/u` | ✅ | Get subscribers of current user's channel |

---

### 📋 Playlists : `/playlists`

| Method | Endpoint | Auth | Body / Params | Description |
|--------|----------|------|---------------|-------------|
| `POST` | `/playlists` | ✅ | `name, description` | Create playlist |
| `GET` | `/playlists/user/:userId` | ❌ | - | Get all playlists of a user |
| `PATCH` | `/playlists/add/:playlistId/:videoId` | ✅ | - | Add video to playlist |

---

### 📊 Dashboard : `/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard/stats` | ✅ | Channel stats: total views, subscribers, videos, likes |
| `GET` | `/dashboard/videos` | ✅ | All videos of current channel with engagement metrics |

---

### 🤖 AI : `/ai`

> Rate limited: **5 requests / minute**

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/ai/description` | ✅ | `title` | Generate a YouTube-style video description using Gemini |

---

### 🏥 Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/healthcheck` | ❌ | Server + DB health status |

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 10 salt rounds : one-way, rainbow-table resistant |
| Token storage | httpOnly + Secure cookies : inaccessible to JavaScript |
| Token rotation | Each refresh generates a new refresh token, invalidating the old |
| Rate limiting | 3-tier: global (200/15min), auth (10/1min), AI (5/1min) |
| CORS | Configurable origin whitelist via `CORS_ORIGIN` env variable |
| Authorization | Owner checks at DB level : `findOne({ _id: id, owner: req.user._id })` |
| Secret exclusion | `select('-password -refreshToken')` on all user queries |

---

## 🧱 Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Runtime | Node.js | v18+ | Non-blocking I/O, large ecosystem |
| Framework | Express | v5.2.1 | Minimal, flexible, industry standard |
| Database | MongoDB + Mongoose | v9.3.3 | Flexible schema, excellent for aggregation |
| Auth | jsonwebtoken + bcrypt | v9.0.3 / v6.0.0 | Industry-standard JWT + secure hashing |
| Media | Cloudinary | v2.9.0 | Managed CDN, no binary storage in DB |
| File upload | Multer | v2.1.1 | Multipart form handling |
| AI | @google/genai (Gemini) | v2.7.0 | Content moderation + semantic features |
| Rate limiting | express-rate-limit | v8.5.2 | Brute force + abuse prevention |
| Pagination | mongoose-aggregate-paginate-v2 | v1.1.4 | Cursor-based pagination on aggregates |

---

## 📬 Postman Collection

Import the collection into Postman to test all 30+ endpoints with pre-configured variables and example payloads.

**[Open Postman Workspace](https://www.postman.com/priyansh00soni-6158823/workspace/stream-core)**

Set the `BASE_URL` environment variable to `https://stream-core.onrender.com/api/v1` for production or `http://localhost:8000/api/v1` for local testing.

**Quick manual test : register a user:**

```bash
curl -X POST http://localhost:8000/api/v1/users/register \
  -F "fullName=Test User" \
  -F "email=test@example.com" \
  -F "username=testuser" \
  -F "password=Test@12345" \
  -F "avatar=@/path/to/avatar.jpg"
```

---

## 👤 Author

**Priyansh**
Built as a production-grade backend project demonstrating real-world patterns in Node.js, MongoDB, and AI integration.

---

<div align="center">

If this helped you : drop a ⭐ on the repo.

</div>
