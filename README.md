# Cloud-Based File Storage and Sharing System

A premium, cloud-based file storage system with military-grade security and a futuristic UI design. Built with React, Vite, Node.js, Express, MongoDB Atlas, and AWS S3.

## Features
- **Modern SaaS UI**: Glassmorphism, animations, responsive design.
- **Secure Authentication**: JWT-based login and registration.
- **File Management**: Upload, preview, download, delete, and rename files.
- **Public Sharing**: Secure link generation for sharing files with others.
- **Cloud Storage Integration**: Ready-to-go AWS S3 integration (with local fallback).

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion, Axios, React Router.
- **Backend**: Node.js, Express.js, Mongoose.
- **Database**: MongoDB Atlas.
- **Storage**: AWS S3 & Multer (for local development fallback).

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- MongoDB connection string (Atlas or Local)
- AWS Account (for S3 storage)

### 2. Backend Setup
Navigate to the `backend` folder:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory (I already created a default one for you):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cloud-storage
JWT_SECRET=supersecretjwtkey_12345
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
FRONTEND_URL=http://localhost:5173
```
*Note: If AWS credentials are not provided, the backend automatically falls back to storing files locally in the `uploads/` folder.*

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the `frontend` folder:
```bash
cd frontend
npm install
```
Start the frontend:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📖 API Documentation

### Auth APIs
- `POST /api/auth/register` - Register a new user (Body: `name`, `email`, `password`)
- `POST /api/auth/login` - Authenticate user & get token (Body: `email`, `password`)
- `GET /api/auth/profile` - Get user profile (Headers: `Authorization: Bearer <token>`)

### File APIs (Protected with JWT)
- `POST /api/files` - Upload a file (Form Data: `file`)
- `GET /api/files` - Get all files uploaded by user
- `DELETE /api/files/:id` - Delete a file
- `PUT /api/files/:id` - Rename a file (Body: `newName`)
- `POST /api/files/:id/share` - Generate a share link

### Public Share APIs
- `GET /api/files/shared/:shareId` - Get details & signed download URL of a shared file

---

## 🚀 Deployment Guide

### Database (MongoDB Atlas)
1. Go to MongoDB Atlas, create a free cluster.
2. Under "Network Access", allow IP access from anywhere (`0.0.0.0/0`).
3. Under "Database Access", create a user and copy the connection string.
4. Replace `MONGODB_URI` in your production environment variables.

### Storage (AWS S3)
1. Create an S3 Bucket in AWS. Ensure CORS is configured if you upload directly from frontend, but our architecture routes uploads through the backend.
2. Create an IAM User with `AmazonS3FullAccess`.
3. Save the Access Key and Secret Key and put them in your production environment variables.

### Backend (Render/Railway)
1. Push your code to GitHub.
2. Create a new Web Service on Render and connect your repository.
3. Set the Root Directory to `backend`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add all the Environment Variables from your `.env` file.

### Frontend (Vercel)
1. Connect your repository to Vercel.
2. Set the Framework Preset to `Vite`.
3. Set the Root Directory to `frontend`.
4. Ensure you have an environment variable in frontend (or hardcode the Axios base URL) pointing to your deployed Render backend URL.
