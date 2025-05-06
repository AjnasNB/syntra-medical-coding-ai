# MediCode AI - Frontend

This is the frontend for the MediCode AI medical coding assistant. It provides a modern UI for interacting with the medical coding AI.

## Features

- **Dashboard**: View statistics and quick actions
- **Single Question**: Submit individual medical coding questions with four options
- **PDF Upload**: Upload PDF files for batch processing
- **Code Lookup**: Search and browse medical codes
- **History**: View your question history

## Getting Started

### Quick Start (Recommended)
The simplest way to start the application:

```
node start-web.js
```

This will:
1. Create a default .env file if needed
2. Create necessary directories
3. Update frontend files in the public directory
4. Start the web server

### Manual Setup

1. Install all dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   npm run setup
   ```

3. Update frontend files:
   ```
   npm run update-frontend
   ```

4. Start the web server:
   ```
   npm run web
   ```

5. Open your browser at `http://localhost:3000`

## Development

For development with auto-restart on changes:

```
npm run dev
```

## PDF Upload Guide

1. Navigate to the PDF Upload section in the UI
2. Select a questions PDF file (e.g., practice_test_no_answers.pdf)
3. Optionally, add an answers PDF file if you want to compare results
4. Click "Process Files"
5. View the results which will show each question with the AI-generated answer

## Troubleshooting

- **API Connection Issues**: If you see "Failed to load resource" errors, check that the server is running and that the baseUrl in frontend/js/api.js is correctly set.
- **PDF Processing Issues**: Ensure your PDFs follow the expected format with numbered questions and options labeled A, B, C, D.
- **Missing Dependencies**: If you see module not found errors, run `npm install` to install all required packages.

## Technologies

- **HTML/CSS/JavaScript**: Modern frontend technologies
- **Express.js**: Backend server
- **Groq API**: AI model for medical coding
- **PDF Parser**: For processing PDF files
- **RAG Implementation**: Retrieval-Augmented Generation for better context 