// Loads code_definitions.json and provides lookup
const path = require('path');
const fs = require('fs');

// Load code definitions
let codeDefsArray = [];
let codeDefsMap = {};
try {
  // Try to load from code_definitions.json first
  const codeDefsPath = path.join(__dirname, '..', 'code_definitions.json');
  if (fs.existsSync(codeDefsPath)) {
    codeDefsArray = require(codeDefsPath);
    console.log(`Loaded ${codeDefsArray.length} code definitions from code_definitions.json`);
  } else {
    // If that fails, try to load from data/codes.json
    const dataCodesPath = path.join(__dirname, '..', 'data', 'codes.json');
    if (fs.existsSync(dataCodesPath)) {
      codeDefsArray = require(dataCodesPath);
      console.log(`Loaded ${codeDefsArray.length} code definitions from data/codes.json`);
    } else {
      console.warn('No code definitions found. Code lookup functionality may be limited.');
    }
  }
  
  // Convert array to map for quick lookups
  codeDefsMap = codeDefsArray.reduce((map, item) => {
    map[item.code] = item.description;
    return map;
  }, {});
} catch (error) {
  console.error('Error loading code definitions:', error.message);
}

/**
 * Extract medical codes from text
 * @param {string} text - The text to extract codes from
 * @returns {string[]} - Array of extracted codes
 */
function extractCodes(text) {
  // Patterns for different types of medical codes
  const patterns = [
    /[A-Z]\d{2}(?:\.\d+)?/g,  // ICD-10-CM (e.g., E11.9)
    /\d{5}/g,                 // CPT (e.g., 99213)
    /[A-Z]\d{4}/g             // HCPCS (e.g., G0101)
  ];
  
  const codes = new Set();
  
  // Extract codes using patterns
  for (const pattern of patterns) {
    let match;
    const textCopy = text.toString();
    while ((match = pattern.exec(textCopy)) !== null) {
      codes.add(match[0]);
    }
  }
  
  return Array.from(codes);
}

/**
 * Get description for a medical code
 * @param {string} code - The medical code
 * @returns {string} - The description or a default message
 */
function getCodeDescription(code) {
  // Clean up the code (remove any non-alphanumeric characters)
  const cleanCode = code.trim().replace(/[^A-Z0-9\.]/gi, '');
  
  // Look up in code definitions
  const description = codeDefsMap[cleanCode];
  
  // Return description or default message
  return description || `Code ${cleanCode} (description not available)`;
}

/**
 * Search for codes that match or are similar to a search term
 * @param {string} searchTerm - Term to search for
 * @returns {Array} - Array of matching code objects
 */
function searchCodes(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const term = searchTerm.toLowerCase();
  return codeDefsArray.filter(item => {
    return item.code.toLowerCase().includes(term) || 
           item.description.toLowerCase().includes(term) ||
           (item.category && item.category.toLowerCase().includes(term));
  }).slice(0, 10); // Limit to 10 results
}

/**
 * Given a question object, return a string listing each option and its description.
 * @param {{options:{A:string,B:string,C:string,D:string}}} q 
 */
function getReferenceContext(q) {
  // Build context with code descriptions
  let context = '';
  
  // First, add the question text context
  const questionCodes = extractCodes(q.question);
  if (questionCodes.length > 0) {
    context += 'Context from question:\n';
    questionCodes.forEach(code => {
      context += `${code} - ${getCodeDescription(code)}\n`;
    });
    context += '\n';
  }
  
  // Then add option contexts
  context += 'Options with descriptions:\n';
  ['A', 'B', 'C', 'D'].forEach(letter => {
    // Extract the code (first token) from the option text
    const optionText = q.options[letter];
    const code = optionText.split(/\s/)[0];
    const desc = getCodeDescription(code);
    
    context += `${letter}: ${optionText} - ${desc}\n`;
  });
  
  return context;
}

module.exports = { 
  getReferenceContext, 
  extractCodes, 
  getCodeDescription, 
  searchCodes, 
  getAllCodes: () => codeDefsArray 
}; 