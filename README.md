## StudyVibe — Simple Overview

StudyVibe is a lightweight study planner that helps students organize and track study sessions, create timetables, and generate structured study plans.

Features

- Personalized study plans
- Weekly timetable view and editing
- Create, update, and delete subjects and timetables
- Progress tracking dashboard
- Motivational quotes and simple notifications

Tech stack

- Frontend: React (Vite), Tailwind CSS, Context API, Axios
- Backend: Node.js, Express, MongoDB (Mongoose), JWT authentication

Quick start

1. Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. Copy environment template and set values:

```bash
cp backend/.env.example backend/.env
```

3. Start development (root npm script runs both servers if configured):

```bash
npm run dev
```

Where to look

- Frontend: `frontend/src` (pages, components, hooks)
- Backend: `backend/app` (controllers, routes, models)

If you want a more detailed API reference or deployment notes, tell me which sections to expand.

Manages study schedules with time slots.

**Fields:**

- `userId` (ObjectId, required) - User reference
- `plan` (Array, required) - Study slots
  - `date` (Date) - Session date
  - `subject` (String) - Subject name
  - `hours` (Number) - Duration
- `createdAt` (Date) - Auto-generated timestamp
- `updatedAt` (Date) - Auto-generated timestamp

## Environment Configuration

### Backend (.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Application Info
APP_NAME=StudyVibe Backend
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studyvibe

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# AI Services
GROQ_API_KEY=your_groq_api_key

# CORS (optional)
CORS_ORIGIN=http://localhost:5173
```

### Frontend Configuration

The frontend uses environment variables to configure the API connection. Update `frontend/.env` with your backend URL (default is `http://localhost:3001` for development).

## Development Guide

### Adding New Features

#### 1. Create a Database Model (if needed)

```javascript
// backend/app/models/YourModel.js
import mongoose from "mongoose";

const YourSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("YourModel", YourSchema);
```

#### 2. Create a Controller

```javascript
// backend/app/controllers/your.controller.js

/**
 * Handler for your feature
 */
export const yourHandler = async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### 3. Create Routes

```javascript
// backend/app/routes/your.route.js
import express from "express";
import { yourHandler } from "../controllers/your.controller.js";

const router = express.Router();
router.post("/", yourHandler);

export default router;
```

#### 4. Register Routes in main.js

```javascript
import yourRoute from "./routes/your.route.js";
app.use("/api/your-feature", yourRoute);
```

#### 5. Create Frontend Components

```jsx
// frontend/src/components/YourComponent.jsx
import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export const YourComponent = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get("/api/your-feature")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return <div>{/* Your component JSX */}</div>;
};
```

### Middleware

The application includes custom middleware for:

- **Logging**: All requests and responses are logged with timing information
- **Token Verification**: Middleware to verify authentication tokens on protected routes

## Available Scripts

### Root Directory

```bash
npm run dev          # Start both frontend and backend in parallel
```

### Backend

```bash
npm run start        # Run production server
npm run server       # Run with nodemon
npm run dev          # Development mode with auto-reload
```

### Frontend

```bash
npm run start        # Start Vite dev server
npm run dev          # Alias for start
npm run build        # Build for production
npm run preview      # Preview production build
npm install-deps     # Install dependencies
```

## Deployment

### Render.com (Backend)

The backend is configured for deployment on Render using `render.yaml`.

**Requirements:**

- Node.js 24.x
- MongoDB Atlas database
- Environment variables configured in Render dashboard

**Deployment steps:**

1. Push code to GitHub
2. Connect repository to Render
3. Select the backend directory
4. Configure environment variables
5. Deploy

### Vercel (Frontend)

The frontend is configured for deployment on Vercel using `vercel.json`.

**Deployment steps:**

1. Push code to GitHub
2. Connect repository to Vercel
3. Select the frontend directory
4. Configure build settings
5. Deploy

## Testing

### Manual API Testing

Use curl or Postman:

```bash
# Test health endpoint
curl https://studyvibe-backend.onrender.com/health

# Test planner endpoint
curl -X POST https://studyvibe-backend.onrender.com/api/planner \
  -H "Content-Type: application/json" \
  -d '{"subjects":[{"name":"Math","examDate":"2025-11-15","hours":20}]}'
```

## Troubleshooting

### Common Issues

**Port already in use (Backend)**

```bash
# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# On Mac/Linux
lsof -ti:3001 | xargs kill
```

**MongoDB connection fails**

- Verify connection string in `.env`
- Check MongoDB Atlas IP whitelist (should include your IP or 0.0.0.0)
- Ensure database user has proper permissions
- Verify credentials are correct

**Module not found errors**

- Run `npm install` in the affected directory
- Check import paths use `.js` extension in ES modules
- Verify file names match imports exactly (case-sensitive)

**Frontend won't load**

- Ensure backend is running on port 3001
- Check API service configuration in `src/services/api.js`
- Clear browser cache and restart dev server
- Check browser console for CORS errors

**AI API calls failing**

- Verify API keys are correct in `.env`
- Check API quotas and usage limits
- Ensure API keys have required permissions
- Check network connectivity

## Performance Optimization

### Backend

- Use MongoDB indexes for frequently queried fields
- Implement caching for AI responses (Redis recommended)
- Add request rate limiting for public endpoints
- Enable gzip compression for responses
- Use connection pooling for database

### Frontend

- Code splitting with React lazy loading
- Image optimization and lazy loading
- CSS minification with Tailwind
- Bundling optimization with Vite

## Security Best Practices

- Never commit `.env` file (use `.env.example`)
- Use HTTPS in production
- Validate and sanitize all inputs
- Implement proper authentication and authorization
- Set secure CORS policies
- Keep dependencies updated (`npm audit`)
- Use environment variables for all secrets
- Enable rate limiting on API endpoints
- Implement request validation middleware

## Contributing

When contributing code:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Write clear, descriptive comments
4. Follow existing code style and conventions
5. Test your changes locally
6. Update relevant documentation
7. Commit with descriptive messages
8. Push to your branch
9. Open a Pull Request

### Code Style Guidelines

- Use ES6+ features
- Follow existing indentation and naming conventions
- Write clear function and variable names
- Add JSDoc comments for functions
- Handle errors appropriately
- Use consistent formatting

## Acknowledgments

- GROQ (console.groq.com) for AI study plan generation
- FullCalendar for calendar functionality
- Tailwind CSS for styling
- Vite for frontend tooling
- Express.js for backend framework
- MongoDB for data persistence
