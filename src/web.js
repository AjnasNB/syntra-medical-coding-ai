const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseQuestion } = require('./parsers');
const { getReferenceContext, searchCodes, getAllCodes } = require('./reference');
const { answerQuestion } = require('./llm');
const { processPdfFiles, processSingleQuestion } = require('./index');

// Set up Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
const publicPath = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
  console.log(`Created public directory at ${publicPath}`);
}
app.use(express.static(publicPath));

// Fallback to frontend directory if public doesn't exist
const frontendPath = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

// Create required directories if they don't exist
['uploads', 'public'].forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created ${dir} directory`);
  }
});

// API endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Process a single question
app.post('/api/question', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    console.log(`Processing question: ${question.substring(0, 50)}...`);
    
    // Parse the question
    const parsedQuestion = parseQuestion(question);
    
    // Get reference context
    const reference = getReferenceContext(parsedQuestion);
    
    // Get answer from LLM
    const llmResponse = await answerQuestion(parsedQuestion, reference);
    
    // Extract answer letter and explanation
    const firstChar = llmResponse.trim().charAt(0).toUpperCase();
    const explanation = llmResponse.trim();
    
    res.json({
      question: parsedQuestion.question,
      options: parsedQuestion.options,
      modelAnswer: firstChar,
      explanation
    });
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ error: error.message || 'An unknown error occurred' });
  }
});

// Process PDF files
app.post('/api/pdf', upload.fields([
  { name: 'questionsPdf', maxCount: 1 },
  { name: 'answersPdf', maxCount: 1 }
]), async (req, res) => {
  try {
    const questionsPdfPath = req.files.questionsPdf[0].path;
    const answersPdfPath = req.files.answersPdf ? req.files.answersPdf[0].path : null;
    
    // Process PDF files
    const results = await processPdfFiles(questionsPdfPath, answersPdfPath);
    
    // Calculate score if answer key is available
    let score = null;
    if (results.some(r => r.isCorrect !== null)) {
      score = results.filter(r => r.isCorrect).length;
    }
    
    // Clean up uploaded files
    fs.unlinkSync(questionsPdfPath);
    if (answersPdfPath) {
      fs.unlinkSync(answersPdfPath);
    }
    
    res.json({
      results,
      score: score,
      total: results.length
    });
  } catch (error) {
    console.error('Error processing PDF files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all medical codes
app.get('/api/codes', (req, res) => {
  try {
    const codes = getAllCodes();
    res.json(codes);
  } catch (error) {
    console.error('Error fetching codes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search medical codes
app.get('/api/codes/search', (req, res) => {
  try {
    const { query, category } = req.query;
    let results = searchCodes(query);
    
    // Filter by category if specified
    if (category && category !== 'all') {
      results = results.filter(code => code.category === category);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error searching codes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the main frontend HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 