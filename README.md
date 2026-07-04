# Connecto

Connecto is a full-stack academic productivity dashboard built for students and teachers. It combines classroom management, routines, attendance, assignments, learning resources, chat, and profile management in one role-based platform.

The project is organized as two independent apps:
- `frontend/` for the React user interface
- `backend/` for the Express + MongoDB API

## Quick Start (one command)

> Prerequisites: a recent Node.js LTS release, npm, a running MongoDB instance, and a configured `backend/.env` file.

```powershell
npm install --prefix backend; npm install --prefix frontend; Start-Process powershell -WorkingDirectory . -ArgumentList '-NoExit','-Command','npm --prefix backend run dev'; npm --prefix frontend start
```

This PowerShell command installs dependencies for both apps, starts the backend in a new terminal window, and launches the frontend in the current terminal.

Default local URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

If you prefer manual startup, run `npm --prefix backend run dev` and `npm --prefix frontend start` in two separate terminals.

## 📌 Project Overview

Connecto is designed to reduce context switching in academic workflows. Instead of separating attendance, assignments, notes, routines, and communication into different tools, the platform brings them together in one structured interface.

Teachers can create and manage classrooms, publish content, track student participation, and coordinate communication. Students can view their subjects, routine, learning materials, attendance history, assignments, and reminders from a single dashboard.

## 🎯 Objectives

- Centralize day-to-day academic workflows for both students and teachers.
- Simplify subject and classroom management with clear role-based access.
- Improve visibility into attendance, deadlines, and routine planning.
- Make educational content sharing easier through notes, resources, and video links.
- Create a focused collaboration space with chat rooms and announcements.

## 👥 User Roles

### Student

- Register and sign in to a student account
- View assigned subjects and classroom content
- Track attendance history and attendance percentage
- Check assignments, deadlines, and submission status
- View routine and manage personal reminders
- Access chat rooms and announcements
- Update profile details and profile photo

### Teacher

- Register and sign in to a teacher account
- Create and manage subjects or classroom groups
- Add owners, faculty members, and students to subjects
- Upload notes, assignments, and learning resources
- Share video lecture links
- Manage routine entries and classroom schedules
- Mark attendance and review student summaries
- Create chat rooms and publish announcements

## 🧠 Key Features

- Role-based authentication for students and teachers
- Protected student and teacher dashboards
- Subject and classroom management with owners, faculty, and students
- Routine planning with teacher and student views
- Attendance marking, summaries, and historical tracking
- Assignment creation, PDF attachments, and student submissions
- Notes upload and subject-wise note access
- Resource sharing through links and categorized study material
- Video lecture management by subject
- Chat rooms with messages and announcements
- Personal reminders for students
- Profile editing and profile photo uploads

## 🏗️ High-Level Architecture

```text
React Frontend (Student + Teacher Dashboards)
                |
                v
        Express REST API
                |
    +-----------+-----------+
    |                       |
    v                       v
MongoDB               Local File Storage
(users, subjects,     (notes, assignments,
routine, attendance,  profile photos)
chat, assignments,
resources, reminders)
```

How the application flows:
- The React frontend handles routing, layouts, and role-specific UI.
- The Express backend exposes authenticated REST endpoints under `/api/*`.
- JWT middleware protects private endpoints and enforces role-based access.
- MongoDB stores core academic and user data through Mongoose models.
- Uploaded files are stored locally in `backend/uploads` and served from `/uploads`.

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router, Axios |
| Styling | Tailwind CSS, custom CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JWT, bcryptjs |
| File Uploads | Multer |
| Email Dependency | Nodemailer |
| Dev Tools | Nodemon, Create React App, PostCSS |

## 📂 Project Structure

```text
Connecto/
|-- backend/
|   |-- controllers/          # Auth controller
|   |-- middleware/           # JWT auth + upload handlers
|   |-- models/               # Mongoose schemas
|   |-- routes/               # API routes
|   |-- uploads/              # Local file storage
|   |-- package.json
|   `-- server.js             # Express entry point
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/       # Shared UI blocks
|   |   |-- layouts/          # Student and teacher layouts
|   |   |-- pages/
|   |   |   |-- student/      # Student-facing pages
|   |   |   `-- teacher/      # Teacher-facing pages
|   |   |-- App.js            # App routing
|   |   `-- index.js
|   |-- package.json
|   `-- tailwind.config.js
|-- .gitignore
`-- README.md
```

Major backend route groups:
- `/api/auth`
- `/api/user`
- `/api/subjects`
- `/api/syllabus`
- `/api/notes`
- `/api/video-lectures`
- `/api/assignments`
- `/api/resources`
- `/api/attendance`
- `/api/chat`
- `/api/routine`
- `/api/personal-reminders`

## Environment Variables

Create a file at `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/connecto
JWT_SECRET=replace-this-with-a-long-random-secret
```

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Port used by the Express server. Defaults to `5000`. |
| `MONGO_URI` | Yes | MongoDB connection string used by Mongoose. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWT tokens. |

Important note:
- The frontend currently uses hardcoded API URLs pointing to `http://localhost:5000`, so no frontend environment variables are required yet.

## 📝 Important Notes

- The frontend already includes `Forgot Password` and `Reset Password` screens.
- The backend currently implements `register` and `login` routes, but password reset endpoints are not wired yet.
- File uploads are stored locally in `backend/uploads`, which is convenient for development but not ideal for production-scale deployments.
- The repo is structured as two standalone Node.js apps rather than a single root package workspace.

## 🔐 Security

Current protections in the project:
- Passwords are hashed with `bcryptjs` before storage.
- Protected backend routes require a valid `Bearer` token.
- JWT payloads carry the authenticated user id and role.
- Teacher-only and student-only routes are enforced in both backend logic and frontend route guards.
- Assignment uploads accept PDF files only and enforce a size limit of `10 MB`.
- Profile photo uploads accept image files only and enforce a size limit of `5 MB`.
- Notes uploads are filtered to PDF files.

Recommended hardening steps:
- Use a long, unique `JWT_SECRET` in every environment.
- Keep `backend/.env` private and never commit real secrets.
- Add rate limiting, audit logging, and request validation middleware.
- Move uploads to cloud storage or private object storage for production use.
- Replace hardcoded frontend API URLs with environment-driven configuration.

## 🚀 Future Enhancements

- Complete the backend flow for forgot-password and reset-password with email delivery.
- Replace hardcoded frontend API endpoints with `REACT_APP_*` configuration.
- Add WebSocket or Socket.IO support for real-time chat updates.
- Add automated tests for API routes, auth flows, and critical UI pages.
- Introduce Docker or Docker Compose for easier environment setup.
- Add CI/CD pipelines for linting, testing, and deployment.
- Add role-based audit logs for important teacher actions.
- Move local uploads to cloud storage such as S3 or Cloudinary.
- Add analytics and progress insights for both students and teachers.
- Publish API documentation for easier integration and maintenance.

## 💡 Why This Project Stands Out

- It solves a real academic workflow problem instead of focusing on a single feature.
- It supports both teaching and learning journeys in one product.
- It already has a strong modular base, making it easy to extend with notifications, live chat, or deployment automation.
- The separation between frontend and backend keeps the codebase understandable for learning, collaboration, and future scaling.
