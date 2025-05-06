# MediCode AI - Medical Coding Assistant

An AI-powered tool for medical coding test preparation and assistance, featuring Retrieval Augmented Generation (RAG) for enhanced accuracy.

## Quick Setup

### Option 1: All-in-One Server

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   node start-web.js
   ```

3. Open your browser at `http://localhost:8080`

### Option 2: Separate Frontend and Backend

1. Install dependencies:
   ```
   npm install
   ```

2. Start the backend server:
   ```
   node backend.js
   ```

3. Start the frontend server:
   ```
   node frontend-server.js
   ```
   
4. Open your browser at `http://localhost:8080`

## Features

- **Modern Dashboard**: Intuitive interface with statistics and quick actions
- **Single Question Mode**: Submit individual medical coding questions
- **Bulk Question Processing**: Process JSON files with multiple questions
- **PDF Upload**: Process entire test PDFs at once
- **Code Lookup**: Search and explore medical codes in the database
- **History**: View your past questions and answers

## AI Architecture

MediCode AI implements a **Retrieval Augmented Generation (RAG)** architecture to enhance the accuracy of medical coding answers:

### RAG Implementation

1. **Retrieval System**:
   - Medical codes (ICD-10, CPT, HCPCS) are stored in a knowledge base (`code_definitions.json`/`data/codes.json`)
   - When a question is submitted, relevant codes are automatically extracted using regex patterns
   - Code descriptions are retrieved from the knowledge base

2. **Context Enhancement**:
   - The extracted codes and their descriptions are combined with the original question
   - This creates a context-rich prompt that contains domain-specific knowledge

3. **LLM Processing**:
   - The enhanced prompt is sent to an LLM (via Groq or Ollama)
   - The system prompt instructs the model to act as a medical coding expert
   - The model generates answers with higher accuracy due to the provided context

4. **Answer Parsing**:
   - The system extracts the answer letter, explanation, and relevant codes
   - Results are presented to the user in a structured format

### Data Flow

```
User Question → Code Extraction → Knowledge Retrieval → Context Assembly → 
LLM Processing → Answer Extraction → User Display
```

### LLM Integration

The system supports two LLM providers:
- **Groq**: Cloud-based LLM service for high performance
- **Ollama**: Local LLM option for offline processing

## Technical Details

### System Architecture

- **Frontend**: HTML/CSS/JavaScript with responsive UI
- **Backend**: Node.js with Express
- **Data Storage**: JSON files for code definitions and user history
- **AI Processing**: RAG implementation with LLM integration

### API Endpoints

- `POST /api/question` - Process a single question
- `POST /api/bulk-questions` - Process multiple questions
- `POST /api/pdf` - Process PDF files
- `GET /api/codes` - Get all medical codes
- `GET /api/codes/search` - Search for medical codes

### Dependencies

- Node.js
- Express
- pdf-parse
- Groq/Ollama for LLM processing
- Fetch API for front-end communication

## Offline Capability

The application includes fallback mechanisms:
- Loads codes from local JSON files when backend is unavailable
- Includes hardcoded fallback data for essential functionality
- Gracefully handles API connection failures

## Troubleshooting

- **Missing Dependencies**: Run `npm install`
- **PDF Processing Issues**: Check that PDFs follow the expected format (numbered questions with A/B/C/D options)
- **Server Not Starting**: Check for port conflicts and ensure all dependencies are installed
- **API Connection Issues**: Check that backend server is running and configured correctly in frontend/js/config.js
- **Code Lookup Problems**: Ensure `data/codes.json` is properly formatted and accessible

## PDF Upload Guide

1. Navigate to the "PDF Upload" section in the sidebar
2. Select your questions PDF file
3. Optionally upload an answers PDF if you want to compare with correct answers
4. Click "Process Files"
5. View results with AI-generated answers and explanations 