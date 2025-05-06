const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const pdf = require('pdf-parse');

/**
 * This utility helps build a comprehensive code_definitions.json file
 * by extracting codes from the practice test PDF and looking them up.
 */
async function extractCodesFromPdf(pdfPath) {
  console.log(`Extracting codes from ${pdfPath}...`);
  
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdf(buffer);
  
  // Extract code patterns (e.g., ICD-10, CPT, HCPCS)
  const codePatterns = [
    /[A-Z]\d{2}(?:\.\d+)?/g,  // ICD-10-CM (e.g., E11.9)
    /\d{5}/g,                 // CPT (e.g., 99213)
    /[A-Z]\d{4}/g             // HCPCS (e.g., G0101)
  ];
  
  const foundCodes = new Set();
  
  for (const pattern of codePatterns) {
    let match;
    while ((match = pattern.exec(data.text)) !== null) {
      foundCodes.add(match[0]);
    }
  }
  
  console.log(`Found ${foundCodes.size} unique codes`);
  return Array.from(foundCodes);
}

async function enrichCodesWithGroq(codes, apiKey) {
  console.log(`Enriching ${codes.length} codes with descriptions using Groq...`);
  
  const { Groq } = require('groq-sdk');
  const groq = new Groq({ apiKey });
  
  const codeDefinitions = {};
  
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(codes.length/batchSize)}`);
    
    const promises = batch.map(async (code) => {
      try {
        const response = await groq.chat.completions.create({
          model: "llama2-70b-chat",
          messages: [
            {
              role: "system",
              content: "You are an expert in medical coding. Provide accurate, concise descriptions of medical codes."
            },
            {
              role: "user",
              content: `What is the description for the medical code ${code}? Provide only the description, no other text.`
            }
          ]
        });
        
        return { code, description: response.choices[0].message.content.trim() };
      } catch (error) {
        console.error(`Error getting description for ${code}:`, error.message);
        return { code, description: "Description unavailable" };
      }
    });
    
    const results = await Promise.all(promises);
    results.forEach(({code, description}) => {
      codeDefinitions[code] = description;
    });
    
    // Wait a bit between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return codeDefinitions;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node build_references.js <pdf_path> [existing_json]');
    process.exit(1);
  }
  
  const pdfPath = args[0];
  const existingJsonPath = args[1] || path.join(__dirname, '..', 'code_definitions.json');
  
  // Extract unique codes from the PDF
  const codes = await extractCodesFromPdf(pdfPath);
  
  // Load existing definitions if available
  let existingDefinitions = {};
  if (fs.existsSync(existingJsonPath)) {
    existingDefinitions = JSON.parse(fs.readFileSync(existingJsonPath, 'utf8'));
    console.log(`Loaded ${Object.keys(existingDefinitions).length} existing code definitions`);
  }
  
  // Find codes that don't have definitions yet
  const codesToEnrich = codes.filter(code => !existingDefinitions[code]);
  console.log(`Need to enrich ${codesToEnrich.length} new codes`);
  
  if (codesToEnrich.length > 0) {
    // Get API key from environment or prompt
    const apiKey = process.env.GROQ_API_KEY || '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';
    
    // Enrich codes with descriptions using Groq
    const newDefinitions = await enrichCodesWithGroq(codesToEnrich, apiKey);
    
    // Merge with existing definitions
    const mergedDefinitions = { ...existingDefinitions, ...newDefinitions };
    
    // Save to file
    fs.writeFileSync(
      existingJsonPath,
      JSON.stringify(mergedDefinitions, null, 2)
    );
    
    console.log(`Saved ${Object.keys(mergedDefinitions).length} code definitions to ${existingJsonPath}`);
  } else {
    console.log('No new codes to enrich, definitions file is up to date');
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 