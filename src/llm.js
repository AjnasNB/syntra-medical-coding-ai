require('dotenv').config();
const fetch = require('node-fetch');
const { Groq } = require('groq-sdk');

const USE_GROQ = process.env.USE_GROQ === 'true';
const GROQ_MODEL = process.env.GROQ_MODEL ;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ = new Groq({ apiKey: GROQ_API_KEY });

const OLLAMA_URL = process.env.OLLAMA_URL ;

/**
 * Creates a system prompt for medical coding questions
 * @returns {string} - The system prompt
 */
function createSystemPrompt() {
  return `You are an expert medical coder with deep knowledge of CPT, ICD-10, and HCPCS codes.
Your task is to answer multiple-choice medical coding questions accurately.

Guidelines:
1. Analyze the question carefully, considering all relevant details about procedures, diagnoses, or services.
2. Review each option and its code description.
3. Select the most appropriate code based on medical coding principles and guidelines.
4. Begin your response with the letter (A, B, C, or D) of the correct answer.
5. After the letter, provide a brief explanation of why this is the correct choice and why the others are incorrect.
6. Be precise and focus on coding rules, anatomical details, and procedural specifics.`;
}

/**
 * Creates a user prompt for a specific question
 * @param {object} q - The question object
 * @param {string} referenceContext - The reference context
 * @returns {string} - The user prompt
 */
function createUserPrompt(q, referenceContext) {
  return `Question ${q.number}:
${q.question}

${referenceContext}

Based on the question and code descriptions, which option (A, B, C, or D) is the correct answer?
Respond with the letter of your choice followed by a detailed explanation.`;
}

/**
 * Answer one question via the chosen LLM.
 * @param {{number:number, question:string, options:object}} q 
 * @param {string} referenceContext 
 */
async function answerQuestion(q, referenceContext) {
  const systemMsg = {
    role: 'system',
    content: createSystemPrompt()
  };
  
  const userMsg = {
    role: 'user',
    content: createUserPrompt(q, referenceContext)
  };

  if (USE_GROQ) {
    try {
      console.log(`Sending question ${q.number} to Groq...`);
      const resp = await GROQ.chat.completions.create({
        model: GROQ_MODEL,
        messages: [systemMsg, userMsg],
        temperature: 0.2, // Lower temperature for more deterministic responses
        max_tokens: 500,  // Limit response length
        top_p: 0.95       // Slightly reduce randomness
      });
      return resp.choices[0].message.content;
    } catch (error) {
      console.error(`Error from Groq API: ${error.message}`);
      return `Error: Unable to get response from Groq. ${error.message}`;
    }
  } else {
    // Ollama
    try {
      const prompt = `[SYSTEM]\n${systemMsg.content}\n\n[USER]\n${userMsg.content}`;
      const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'llama2-70b',
          prompt,
          stream: false,
          temperature: 0.2
        })
      });
      
      if (!resp.ok) {
        throw new Error(`HTTP error ${resp.status}`);
      }
      
      const json = await resp.json();
      return json.response;
    } catch (error) {
      console.error(`Error from Ollama API: ${error.message}`);
      return `Error: Unable to get response from Ollama. ${error.message}`;
    }
  }
}

module.exports = { answerQuestion }; 