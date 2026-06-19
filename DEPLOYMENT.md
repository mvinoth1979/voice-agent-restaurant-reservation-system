# Deployment Guide

## 1) Push to GitHub
1. Create a new GitHub repository.
2. Add the repo as a remote and push the current project.
3. Keep the root folder as the repository root so Railway and Vercel can detect both apps.

## 2) Deploy backend to Railway
1. In Railway, create a new project and connect the GitHub repo.
2. Set the service root to the `backend` folder.
3. Set the build command to `npm install && npm run build` (Railway will usually detect this automatically).
4. Set the start command to `npm run start`.
5. Add the environment variables listed in `backend/.env.example`.
6. Copy the Railway URL and use it as the backend base URL.

## 3) Deploy frontend to Vercel
1. In Vercel, import the GitHub repo.
2. Set the project root to the `frontend` folder.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add the environment variable:
   - `VITE_API_URL=<your Railway backend URL>`

## 4) Verify
- Backend health check: `GET /api/voice/process` is not a GET endpoint, so confirm the server starts and logs the port.
- Frontend should call the backend URL via `VITE_API_URL`.
- Ensure your Google API credentials and AI keys are configured in Railway.
