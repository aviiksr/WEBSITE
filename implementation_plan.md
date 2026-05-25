# Cloud-Based File Storage and Sharing System

Develop a full-stack, cloud-based file storage and sharing platform with a modern, futuristic UI. The system will support secure user authentication, file uploads to AWS S3, file management, and sharing via secure links. The tech stack includes React.js (Vite), Node.js, Express, MongoDB Atlas, and AWS S3.

> [!CAUTION]
> ## User Review Required
> Please review the proposed architecture and tech stack to confirm it aligns perfectly with your vision. Note that full AWS S3 and MongoDB Atlas integration requires active cloud accounts. We will develop the code to be production-ready and supply mocked storage adapters for initial local testing if cloud credentials are not immediately available.

> [!IMPORTANT]
> ## Open Questions
> 1. **AWS S3 Configuration**: Do you have an active AWS account to provide an Access Key, Secret Key, and Bucket Name for the S3 integration during development, or should I start with local disk storage (via Multer) and provide the S3 code to be activated later?
> 2. **MongoDB Atlas**: Do you have a MongoDB Atlas connection string ready, or should I use a local MongoDB instance/memory-server for the initial build?
> 3. **UI Theme**: The requested palette focuses on Indigo, Purple, and Cyan with a Dark background. Do you want the system to be strictly Dark Mode, or should we implement a full Light/Dark mode toggle from the start?

## Proposed Architecture

### Backend (Node.js + Express)
The backend will follow an MVC-like modular structure:
- **Routes**: Define API endpoints (`/api/auth`, `/api/files`).
- **Controllers**: Business logic for handling requests and responses.
- **Middleware**: JWT authentication, role-based access, error handling, Multer file upload handling.
- **Models**: Mongoose schemas for `User` and `File`.
- **Services**: AWS S3 integration service for generating signed URLs and handling uploads/deletes.

### Frontend (React + Vite)
- **State Management**: React Context or Zustand for user session and UI state.
- **Styling**: Tailwind CSS for utility-first styling, creating glassmorphism and modern UI components.
- **Animations**: Framer Motion for page transitions, interactive cards, and smooth micro-animations.
- **Routing**: React Router DOM for protected routes (Dashboard) and public routes (Landing Page, Login, Share Link).

---

## Proposed Changes

### 1. Project Initialization
#### [NEW] `frontend/`
Initialize a React application using Vite (`npx create-vite@latest frontend --template react`).
- Setup Tailwind CSS, Framer Motion, Axios, React Router, and Lucide Icons.
- Configure Tailwind theme with the requested color palette (#6366F1, #8B5CF6, #06B6D4, #0F172A).

#### [NEW] `backend/`
Initialize a Node.js project (`npm init -y`).
- Install dependencies: `express`, `mongoose`, `cors`, `dotenv`, `bcrypt`, `jsonwebtoken`, `multer`, `@aws-sdk/client-s3`.

### 2. Backend Implementation
#### [NEW] `backend/models/User.js`
Mongoose schema for user registration (name, email, password hash, storage usage).
#### [NEW] `backend/models/File.js`
Mongoose schema for file metadata (original name, S3 key, S3 URL, size, mime type, uploadedBy, shareId).
#### [NEW] `backend/routes/authRoutes.js` & `backend/controllers/authController.js`
Endpoints for Registration, Login, and Profile fetching.
#### [NEW] `backend/routes/fileRoutes.js` & `backend/controllers/fileController.js`
Endpoints for Uploading, Fetching, Deleting, Renaming, and Sharing files.
#### [NEW] `backend/middleware/authMiddleware.js`
JWT verification middleware to protect dashboard and file management routes.
#### [NEW] `backend/services/s3Service.js`
AWS SDK v3 integration for putting objects, getting signed URLs, and deleting objects from an S3 bucket.

### 3. Frontend Implementation
#### [NEW] `frontend/src/pages/Landing.jsx`
Modern landing page with Hero section, Features, and animated CTA buttons.
#### [NEW] `frontend/src/pages/Login.jsx` & `frontend/src/pages/Register.jsx`
Glassmorphism styled authentication forms with validation.
#### [NEW] `frontend/src/pages/Dashboard.jsx`
Main user interface displaying storage stats, recent files, and a grid/list of all uploaded files.
#### [NEW] `frontend/src/components/UploadModal.jsx`
Drag and drop file upload interface with visual progress indicators.
#### [NEW] `frontend/src/pages/SharePreview.jsx`
Public-facing page to view and download shared files securely.

---

## Verification Plan

### Automated Tests / Scripts
- Backend API tests using Postman/Thunder Client to ensure endpoints (`/api/auth/*` and `/api/files/*`) return correct status codes and payloads.
- Local validation of file upload routing (S3 integration validation vs local Multer storage).

### Manual Verification
1. Start the backend server (`npm run dev`) and frontend server (`npm run dev`).
2. Register a new user and log in to receive a JWT.
3. Access the Dashboard, verify the responsive design and animations.
4. Upload a test file (image/pdf) and monitor the progress UI and network requests.
5. Verify the file appears in the dashboard file list.
6. Generate a share link, open it in an incognito window, and attempt to download the file.
7. Verify all glassmorphism and UI/UX requirements map to a high-end SaaS feel.
