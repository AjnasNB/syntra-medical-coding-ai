#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parseQuestion } = require('./parsers');
const { getReferenceContext } = require('./reference');
const { answerQuestion } = require('./llm');

/**
 * Simple utility to test a single question from a file or command line
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node test_question.js <question_file.txt>');
    console.error('   or: node test_question.js "question text" "A. option A" "B. option B" "C. option C" "D. option D"');
    process.exit(1);
  }
  
  let questionText;
  
  if (args.length === 1 && fs.existsSync(args[0])) {
    // Read from file
    questionText = fs.readFileSync(args[0], 'utf8');
  } else {
    // Combine arguments into question text
    questionText = args.join('\n');
  }
  
  try {
    console.log('Processing question...\n');
    
    // Parse the question
    const question = parseQuestion(questionText);
    
    // Get reference context
    const reference = getReferenceContext(question);
    console.log('Reference context:');
    console.log(reference);
    console.log('\nSending to LLM...');
    
    // Get answer from LLM
    const llmResponse = await answerQuestion(question, reference);
    
    // Extract answer letter and explanation
    const firstChar = llmResponse.trim().charAt(0).toUpperCase();
    
    console.log('\nAnswer:');
    console.log(llmResponse);
    
    console.log(`\nSelected option: ${firstChar}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 