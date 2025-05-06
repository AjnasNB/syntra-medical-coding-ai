// Parses text from the practice-test PDF into structured questions and the answer key
const QUESTION_REGEX = /(\d{1,3})\.\s+([\s\S]*?)(?=\nA\.)\nA\.\s*([^\n]+)\nB\.\s*([^\n]+)\nC\.\s*([^\n]+)\nD\.\s*([^\n]+)(?=\n\d{1,3}\.|$)/g;
const ANSWER_REGEX = /(\d{1,3})\.\s*\[?\]?\s*([A-D])\s*[\r\n]/g;

// Parse a single question string
function parseQuestion(questionText, questionNumber = 1) {
  // Format: questions start with number, then text, then options A-D
  const singleQuestionRegex = /\s*(.*?)(?=\s*A\.|\s*$)\s*A\.\s*(.*?)\s*B\.\s*(.*?)\s*C\.\s*(.*?)\s*D\.\s*(.*?)$/s;
  
  const match = questionText.match(singleQuestionRegex);
  
  if (!match) {
    throw new Error("Question format not recognized");
  }
  
  return {
    number: questionNumber,
    question: match[1].trim().replace(/\s+/g, ' '),
    options: {
      A: match[2].trim(),
      B: match[3].trim(),
      C: match[4].trim(),
      D: match[5].trim()
    }
  };
}

// Extracts an array of { number, question, options }
function extractQuestions(text) {
  const qs = [];
  let m;
  while ((m = QUESTION_REGEX.exec(text)) !== null) {
    const num = parseInt(m[1], 10);
    const qText = m[2].trim().replace(/\s+/g,' ');
    qs.push({
      number: num,
      question: qText,
      options: {
        A: m[3].trim(),
        B: m[4].trim(),
        C: m[5].trim(),
        D: m[6].trim()
      }
    });
  }
  return qs;
}

// Extracts { number: correctLetter }
function extractAnswerKey(text) {
  const key = {};
  let m;
  while ((m = ANSWER_REGEX.exec(text)) !== null) {
    key[parseInt(m[1],10)] = m[2];
  }
  return key;
}

module.exports = { extractQuestions, extractAnswerKey, parseQuestion }; 