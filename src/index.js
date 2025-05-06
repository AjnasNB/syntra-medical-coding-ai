require('dotenv').config();
const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const readline = require('readline');

const { extractQuestions, extractAnswerKey, parseQuestion } = require('./parsers');
const { getReferenceContext } = require('./reference');
const { answerQuestion } = require('./llm');
const { evaluateResults } = require('./utils');

// Function to handle a single question
async function processSingleQuestion(questionText, questionNumber = 1) {
  try {
    // Parse the question
    const question = parseQuestion(questionText, questionNumber);
    
    // Get reference context
    const reference = getReferenceContext(question);
    
    // Get answer from LLM
    const llmResponse = await answerQuestion(question, reference);
    
    // Extract answer letter and explanation
    const firstChar = llmResponse.trim().charAt(0).toUpperCase();
    const explanation = llmResponse.trim();
    
    return {
      number: question.number,
      question: question.question,
      options: question.options,
      modelAnswer: firstChar,
      explanation
    };
  } catch (error) {
    console.error('Error processing question:', error);
    return {
      error: error.message,
      questionText
    };
  }
}

// Function to handle PDF files
async function processPdfFiles(questionsPdfPath, answersPdfPath = null) {
  try {
    // Read questions PDF
    const qBuffer = fs.readFileSync(questionsPdfPath);
    const qData = await pdf(qBuffer);
    
    // Extract questions
    const questions = extractQuestions(qData.text);
    
    // If answers PDF is provided, extract answer key
    let answerKey = {};
    if (answersPdfPath) {
      const aBuffer = fs.readFileSync(answersPdfPath);
      const aData = await pdf(aBuffer);
      answerKey = extractAnswerKey(aData.text);
    }
    
    // Process each question
    const results = [];
    for (const q of questions) {
      const reference = getReferenceContext(q);
      const llmResponse = await answerQuestion(q, reference);
      
      // Extract answer letter and explanation
      const firstChar = llmResponse.trim().charAt(0).toUpperCase();
      const explanation = llmResponse.trim();
      
      // Check if correct (if answer key is available)
      const correct = answerKey[q.number];
      const isCorrect = correct ? firstChar === correct : null;
      
      results.push({
        number: q.number,
        question: q.question,
        options: q.options,
        modelAnswer: firstChar,
        correctAnswer: correct || null,
        isCorrect,
        explanation
      });
      
      console.log(`Q${q.number}: model→${firstChar}${correct ? ` (${isCorrect ? '✓' : '✗'})` : ''}`);
    }
    
    // Calculate score if answer key is available
    if (Object.keys(answerKey).length > 0) {
      const score = results.filter(r => r.isCorrect).length;
      console.log(`\nFinal Score: ${score}/${questions.length}`);
    }
    
    // Save results to JSON
    fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('Error processing PDF files:', error);
    throw error;
  }
}

// Interactive mode for entering questions manually
async function startInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('Interactive mode - Enter a question or type "exit" to quit');
  console.log('Format: Question text, followed by options A, B, C, D on separate lines');
  
  let questionNumber = 1;
  let questionText = '';
  
  const promptQuestion = () => {
    rl.question('Enter your question (or "exit" to quit):\n', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }
      
      questionText = input;
      
      // Prompt for options
      rl.question('Option A: ', (optA) => {
        rl.question('Option B: ', (optB) => {
          rl.question('Option C: ', (optC) => {
            rl.question('Option D: ', async (optD) => {
              // Construct full question text
              const fullQuestion = `${questionText}\nA. ${optA}\nB. ${optB}\nC. ${optC}\nD. ${optD}`;
              
              console.log('\nProcessing question...');
              const result = await processSingleQuestion(fullQuestion, questionNumber++);
              
              console.log(`\nAnswer: ${result.modelAnswer}`);
              console.log(`Explanation: ${result.explanation}\n`);
              
              // Prompt for next question
              promptQuestion();
            });
          });
        });
      });
    });
  };
  
  promptQuestion();
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  // Check for command line arguments
  if (args.length === 0) {
    console.log('No arguments provided. Starting interactive mode...');
    startInteractiveMode();
    return;
  }
  
  // Check if the first argument is a file or a question
  if (fs.existsSync(args[0])) {
    // Process PDF file(s)
    const questionsPdfPath = args[0];
    const answersPdfPath = args.length > 1 && fs.existsSync(args[1]) ? args[1] : null;
    
    await processPdfFiles(questionsPdfPath, answersPdfPath);
  } else {
    // Process as a single question
    console.log('Processing input as a single question...');
    const questionText = args.join(' ');
    const result = await processSingleQuestion(questionText);
    
    console.log(`\nAnswer: ${result.modelAnswer}`);
    console.log(`Explanation: ${result.explanation}`);
  }
}

// Export functions for use in web.js
module.exports = { processPdfFiles, processSingleQuestion };

// Only run main if this file is executed directly
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
} 