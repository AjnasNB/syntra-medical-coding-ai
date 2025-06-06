/**
 * MediCode AI - API Module
 */

const API = {
  baseUrl: Config.apiUrl,
  
  async submitQuestion(question, options) {
    try {
      const formattedQuestion = `${question}\nA. ${options.A}\nB. ${options.B}\nC. ${options.C}\nD. ${options.D}`;
      
      const response = await fetch(`${this.baseUrl}/api/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: formattedQuestion
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process question');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async submitBulkQuestions(questions) {
    try {
      const response = await fetch(`${this.baseUrl}/api/bulk-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questions
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process questions in bulk');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async uploadPdfs(questionsPdf, answersPdf) {
    try {
      const formData = new FormData();
      formData.append('questionsPdf', questionsPdf);
      
      if (answersPdf) {
        formData.append('answersPdf', answersPdf);
      }
      
      const response = await fetch(`${this.baseUrl}/api/pdf`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to process PDFs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async getMedicalCodes() {
    try {
      console.log('Fetching codes from backend API');
      const response = await fetch(`${this.baseUrl}/api/codes`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch medical codes');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error, falling back to local file:', error);
      // Fallback to directly loading from data file
      try {
        console.log('Loading codes from frontend/data/codes.json');
        const localResponse = await fetch('/data/codes.json');
        if (!localResponse.ok) {
          throw new Error('Failed to load local medical codes file');
        }
        const codes = await localResponse.json();
        console.log(`Loaded ${codes.length} codes from local file`);
        return codes;
      } catch (localError) {
        console.error('Failed to load local codes file:', localError);
        throw localError;
      }
    }
  },
  
  async searchCodes(query, category = 'all') {
    try {
      // First try to use the backend API for searching
      const url = new URL(`${this.baseUrl}/api/codes/search`);
      url.searchParams.append('query', query || '');
      if (category !== 'all') {
        url.searchParams.append('category', category);
      }
      
      console.log(`Calling API: ${url.toString()}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to search codes');
      }
      
      const data = await response.json();
      console.log(`API returned ${data.length} codes`);
      return data;
    } catch (error) {
      console.error('API Error for search, using local filtering fallback:', error);
      
      // Fallback to local filtering
      try {
        console.log('Loading and filtering codes locally');
        // Get all codes first from data/codes.json
        const localResponse = await fetch('/data/codes.json');
        
        if (!localResponse.ok) {
          throw new Error('Failed to load local medical codes file');
        }
        
        const allCodes = await localResponse.json();
        console.log(`Loaded ${allCodes.length} codes locally for filtering`);
        
        // Apply filters locally
        const filteredCodes = allCodes.filter(code => {
          // Make sure we have valid data
          if (!code || typeof code !== 'object') {
            return false;
          }
          
          // Filter by category if specified
          const categoryMatch = category === 'all' || 
            (code.category && code.category.toUpperCase() === category.toUpperCase());
          
          // No query, just return category match
          if (!query || query.trim() === '') {
            return categoryMatch;
          }
          
          // Filter by query text if provided - case insensitive search
          const queryLower = query.toLowerCase().trim();
          const codeMatch = code.code && code.code.toLowerCase().includes(queryLower);
          const descMatch = code.description && code.description.toLowerCase().includes(queryLower);
          
          // Return true if category matches AND either code or description matches query
          return categoryMatch && (codeMatch || descMatch);
        });
        
        console.log(`Local filtering result: ${filteredCodes.length} codes found`);
        return filteredCodes;
      } catch (localError) {
        console.error('Failed to filter codes locally:', localError);
        // Return an empty array instead of throwing to avoid UI errors
        return [];
      }
    }
  }
};
