# StudyVibe

A smart study scheduler and planner powered by AI. StudyVibe helps students create personalized study plans, manage timetables, and optimize their learning schedules using Google Gemini AI and OpenAI integration.

## Features

- **AI-Powered Study Plans**: Automatically generate personalized study plans based on subjects and exam dates
- **Smart Timetable Management**: Create and manage study schedules with intelligent time slot allocation
- **Schedule Parsing**: Upload and parse physical schedules (PDF, images) using AI
- **Weekly Planning**: Visual calendar interface for weekly schedule management
- **Progress Tracking**: Dashboard to monitor study progress and completion
- **Motivational Features**: Daily quotes and notifications to stay motivated
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: Context API
- **UI Components**: React Router, React Icons
- **Calendar**: FullCalendar (React integration)
- **Date Handling**: Day.js
- **Authentication**: Firebase
- **HTTP Client**: Custom API service layer

### Backend

- **Runtime**: Node.js 24.x
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **AI Services**:
  - Google Gemini API for study plan generation
  - OpenAI API for advanced text processing
- **File Handling**: Multer for schedule uploads
- **Development**: Nodemon for hot reloading
- **Task Runner**: npm scripts with concurrently for parallel execution

## Project Structure

```
study_vibe/
├── frontend/                          # React frontend application
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Planner/             # Scheduling and planning components
│   │   │   │   ├── AdvancedSchedulerForm.jsx
│   │   │   │   ├── AdvancedSubjectInput.jsx
│   │   │   │   ├── AICustomizer.jsx
│   │   │   │   ├── ProgressDashboard.jsx
│   │   │   │   ├── StudyCalendar.jsx
│   │   │   │   ├── SubjectForm.jsx
│   │   │   │   ├── Timetable.jsx
│   │   │   │   └── WeeklyScheduleGrid.jsx
│   │   │   └── Reusable/            # Shared components
│   │   │       ├── Footer.jsx
│   │   │       ├── MotivationalQuote.jsx
│   │   │       ├── NotificationSettings.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── pages/                    # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── Blog.jsx
│   │   │   ├── BlogPost.jsx
│   │   │   ├── Contact.jsx
│   │   │   └── NotFound.jsx
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAdvancedScheduler.js
│   │   │   ├── useGeneratePlan.js
│   │   │   ├── useLogin.js
│   │   │   ├── useLogout.js
│   │   │   ├── useSignup.js
│   │   │   └── useSmartTimetable.js
│   │   ├── services/                 # API and external services
│   │   │   ├── api.js
│   │   │   └── firebase.js
│   │   ├── contexts/                 # Context providers
│   │   │   └── authContext.jsx
│   │   ├── utils/                    # Utility functions
│   │   │   ├── advancedScheduler.js
│   │   │   └── studyPlanGenerator.js
│   │   ├── data/                     # Static data
│   │   │   └── blogData.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── public/                       # Static assets
│   ├── package.json
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── vercel.json                  # Vercel deployment config
│
├── backend/                           # Express.js backend API
│   ├── app/
│   │   ├── main.js                  # Application entry point
│   │   ├── controllers/             # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── planner.controller.js
│   │   │   ├── schedule.controller.js
│   │   │   ├── subject.controller.js
│   │   │   └── timeTable.controller.js
│   │   ├── db/                      # Database configuration
│   │   │   └── connectToMongoDB.js
│   │   ├── middleware/              # Express middleware
│   │   │   ├── logging.js
│   │   │   └── verifyToken.js
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── Subject.js
│   │   │   └── Timetable.js
│   │   ├── routes/                  # API route definitions
│   │   │   ├── planner.route.js
│   │   │   ├── schedule.route.js
│   │   │   ├── subject.route.js
│   │   │   └── timeTable.route.js
│   │   ├── services/                # External service integrations
│   │   │   ├── gemini_api.js
│   │   │   ├── openai_api.js
│   │   │   └── scheduleParser.js
│   │   └── utils/                   # Helper functions
│   │       └── studyPlanGenerator.js
│   ├── uploads/                     # User uploaded files storage
│   │   └── schedules/
│   ├── package.json
│   ├── render.yaml                  # Render.com deployment config
│   └── .env.example                 # Environment variables template
│
├── package.json                      # Root package.json for monorepo
└── README.md                         # This file
```

## Quick Start

### Prerequisites

- Node.js 24.x and npm 11.x
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- OpenAI API key
- Firebase project setup

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ShailavMalik/study_vibe.git
   cd study_vibe
   ```

2. **Install root dependencies**

   ```bash
   npm install
   ```

3. **Backend setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studyvibe
   GOOGLE_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Frontend setup**

   ```bash
   cd ../frontend
   npm install
   ```

5. **Start development servers**
   ```bash
   cd ..
   npm run dev
   ```

This will start both frontend (http://localhost:5173) and backend (http://localhost:3001) in parallel.

## API Endpoints

### Health & Status

**GET** `/`

- Returns API information and available endpoints

**GET** `/health`

- Health check endpoint for monitoring services

### Study Planner

**POST** `/api/planner`

- Generate a personalized study plan

Request body:

```json
{
  "subjects": [
    {
      "name": "Mathematics",
      "examDate": "2025-11-15",
      "hours": 20
    }
  ],
  "dailyHours": 3
}
```

### Timetable Management

**GET** `/api/timetable`

- Retrieve all timetables for a user

**POST** `/api/timetable`

- Create a new timetable

**PUT** `/api/timetable/:id`

- Update an existing timetable

**DELETE** `/api/timetable/:id`

- Remove a timetable

### Subject Management

**GET** `/api/subject`

- Get all subjects

**POST** `/api/subject`

- Create a new subject

**PUT** `/api/subject/:id`

- Update a subject

**DELETE** `/api/subject/:id`

- Delete a subject

### Schedule Processing

**POST** `/api/schedule/upload`

- Upload a schedule file (PDF, image, etc.)
- Content-Type: multipart/form-data

**POST** `/api/schedule/parse`

- Parse uploaded schedule data using AI

## Database Models

### Subject Model

Stores information about subjects the user needs to study.

**Fields:**

- `name` (String, required) - Subject name
- `examDate` (Date, required) - Exam date
- `hours` (Number, required) - Total study hours needed
- `userId` (ObjectId, required) - User reference
- `createdAt` (Date) - Auto-generated timestamp
- `updatedAt` (Date) - Auto-generated timestamp

### Timetable Model

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

# AI Services
GOOGLE_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# CORS (optional)
CORS_ORIGIN=http://localhost:5173
```

### Frontend Configuration

Configure Firebase in `src/services/firebase.js` with your Firebase project credentials.

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

- Google Gemini API for AI study plan generation
- OpenAI for advanced text processing
- FullCalendar for calendar functionality
- Tailwind CSS for styling
- Vite for frontend tooling
- Express.js for backend framework
- MongoDB for data persistence
