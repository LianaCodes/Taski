# Taski - Study Planner

A clean, minimalist study planner web application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- **User Authentication**: Sign up, log in with email and password
- **Task Management**: Create, edit, delete, and mark tasks as complete
- **Classes**: Organize and manage your classes
- **Exams**: Track upcoming exams with dates and times
- **Study Sessions**: Log your study sessions
- **Notes**: Create and manage study notes
- **Statistics**: View task completion stats
- **Theme Support**: Light/dark mode toggle
- **Responsive Design**: Works on desktop and mobile

## Project Structure

```
Taski-Fresh/
├── frontend/
│   ├── index.html          # Landing page
│   ├── signup.html         # Sign up page
│   ├── login.html          # Login page
│   ├── dashboard.html      # Main dashboard
│   ├── styles.css          # Minimalist CSS
│   ├── auth.js             # Authentication logic
│   └── dashboard.js        # Dashboard logic
└── backend/
    ├── server.js           # Express server
    ├── package.json        # Dependencies
    ├── .env                # Environment variables
    ├── config/
    │   └── db.js           # MongoDB connection
    ├── models/
    │   ├── User.js
    │   ├── Task.js
    │   ├── Class.js
    │   ├── Exam.js
    │   ├── Note.js
    │   └── StudySession.js
    └── routes/
        ├── auth.js         # Auth endpoints
        ├── tasks.js        # Task endpoints
        ├── classes.js      # Class endpoints
        ├── exams.js        # Exam endpoints
        ├── notes.js        # Note endpoints
        └── sessions.js     # Session endpoints
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Update `.env` file with your MongoDB URI:
```
MONGO_URI=mongodb://localhost:27017/taski
JWT_SECRET=your_secret_key
PORT=5000
```

4. Start the server:
```bash
npm start
```

Server runs on `http://localhost:5000`

### Frontend Setup

1. Open `frontend/index.html` in a browser or serve with a local server:
```bash
cd frontend
python -m http.server 8000
```

Access at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user

### Tasks
- `GET /api/tasks/user/:userId` - Get all tasks
- `POST /api/tasks/add` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Classes
- `GET /api/classes/user/:userId` - Get all classes
- `POST /api/classes/add` - Create class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Exams
- `GET /api/exams/user/:userId` - Get all exams
- `POST /api/exams/add` - Create exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

### Notes
- `GET /api/notes/user/:userId` - Get all notes
- `POST /api/notes/add` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Study Sessions
- `GET /api/sessions/user/:userId` - Get all sessions
- `POST /api/sessions/add` - Create session
- `DELETE /api/sessions/:id` - Delete session

## Usage

1. **Sign Up**: Create a new account with email and password
2. **Log In**: Access your dashboard
3. **Add Tasks**: Create tasks with category, priority, and due date
4. **Manage Classes**: Add your classes and subjects
5. **Track Exams**: Log upcoming exams
6. **Take Notes**: Create study notes
7. **View Stats**: Check your task completion statistics
8. **Toggle Theme**: Switch between light and dark mode

## Styling

The app uses a clean, minimalist design with:
- Subtle shadows and rounded corners
- Consistent font hierarchy
- Light/dark theme support
- Fully responsive layout
- No heavy gradients

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Other**: CORS, dotenv

## Future Enhancements

- Search and filter functionality
- Task sorting options
- Exam reminders
- Study session analytics
- Collaborative features
- Mobile app

## License

MIT
