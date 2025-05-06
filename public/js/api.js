/**
 * MediCode AI - Medical Coding Assistant
 * API Communication Module
 */

const API = {
    /**
     * Base URL for API requests
     */
    baseUrl: window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin,
    
    /**
     * Submit a single question to the API
     * @param {string} question - The question text
     * @param {object} options - Object containing options A, B, C, D
     * @returns {Promise} - Promise resolving to the API response
     */
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
                const error = await response.json();
                throw new Error(error.error || 'Failed to process question');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * Upload PDF files for processing
     * @param {File} questionsPdf - The questions PDF file
     * @param {File} answersPdf - The answers PDF file (optional)
     * @returns {Promise} - Promise resolving to the API response
     */
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
                const error = await response.json();
                throw new Error(error.error || 'Failed to process PDFs');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * Get medical codes from the database
     * @returns {Promise} - Promise resolving to the medical codes
     */
    async getMedicalCodes() {
        try {
            const response = await fetch(`${this.baseUrl}/api/codes`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch medical codes');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    /**
     * Search for medical codes
     * @param {string} query - The search query
     * @param {string} category - The category filter
     * @returns {Promise} - Promise resolving to the search results
     */
    async searchCodes(query, category = 'all') {
        try {
            const url = new URL(`${this.baseUrl}/api/codes/search`);
            url.searchParams.append('query', query);
            if (category !== 'all') {
                url.searchParams.append('category', category);
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to search codes');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}; 