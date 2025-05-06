# MediCode AI - Medical Coding Assistant

A web-based application designed to help medical coders with their daily tasks, including answering coding questions, processing medical documents, and looking up medical codes.

## Features

- **Dashboard** - Overview of coding activity and quick access to features
- **Single Question** - Submit individual medical coding questions for AI analysis
- **PDF Upload** - Process multiple questions from PDF documents
- **Code Lookup** - Search for medical codes by description or code number
- **History** - Review past questions and answers

## Installation

1. Make sure you have Node.js installed (v14+ recommended)
2. Install dependencies:
```
npm install express cors body-parser
```

## Running the Application

### Option 1: Start both servers with one command
```
node start-web.js
```

### Option 2: Start servers individually
Start backend server:
```
node backend.js
```

Start frontend server (in a separate terminal):
```
node frontend-server.js
```

The application will be available at http://localhost:8080

## Development

To update the frontend with test data:
```
node update-frontend.js
```

## Configuration

- Backend API URL can be configured in `frontend/js/config.js`
- Default port for backend server: 3000
- Default port for frontend server: 8080

## Tech Stack

- Frontend: HTML, CSS, JavaScript (Vanilla)
- Backend: Node.js, Express

## License

MIT 