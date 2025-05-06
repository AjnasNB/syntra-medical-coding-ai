/**
 * MediCode AI - Medical Coding Assistant
 * UI Interaction Module
 */

// ============================
// Single Question Functions
// ============================

/**
 * Handle question submission
 */
async function handleQuestionSubmit() {
    // Validate form
    const question = elements.questionText.value.trim();
    const optionA = elements.optionA.value.trim();
    const optionB = elements.optionB.value.trim();
    const optionC = elements.optionC.value.trim();
    const optionD = elements.optionD.value.trim();
    
    if (!question || !optionA || !optionB || !optionC || !optionD) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Submit question to API
    try {
        toggleLoading(true, 'Analyzing question...');
        const startTime = Date.now();
        
        const result = await API.submitQuestion(question, {
            A: optionA,
            B: optionB,
            C: optionC,
            D: optionD
        });
        
        // Calculate response time
        const responseTime = (Date.now() - startTime) / 1000;
        
        // Update stats
        state.questionsAnswered++;
        state.totalResponseTime += responseTime;
        updateStats();
        
        // Display result
        displayQuestionResult(result, responseTime);
        
        // Add to history
        addToHistory(question, result, responseTime);
        
        showToast('Question analyzed successfully!', 'success');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        toggleLoading(false);
    }
}

/**
 * Display the result of a question
 */
function displayQuestionResult(result, responseTime) {
    // Set answer letter and option
    elements.answerLetter.textContent = result.modelAnswer;
    
    let answerText = '';
    switch (result.modelAnswer) {
        case 'A': answerText = elements.optionA.value; break;
        case 'B': answerText = elements.optionB.value; break;
        case 'C': answerText = elements.optionC.value; break;
        case 'D': answerText = elements.optionD.value; break;
    }
    
    elements.answerOption.textContent = answerText;
    
    // Set explanation
    elements.answerExplanation.textContent = result.explanation;
    
    // Set response time
    elements.responseSeconds.textContent = responseTime.toFixed(1);
    
    // Extract code references
    const codes = extractCodesFromText(result.explanation);
    displayCodeReferences(codes);
    
    // Show result container
    elements.questionResult.classList.remove('hidden');
}

/**
 * Extract medical codes from text
 */
function extractCodesFromText(text) {
    const codePatterns = [
        /[A-Z]\d{2}(?:\.\d+)?/g,  // ICD-10-CM (e.g., E11.9)
        /\d{5}/g,                 // CPT (e.g., 99213)
        /[A-Z]\d{4}/g             // HCPCS (e.g., G0101)
    ];
    
    const codes = new Set();
    
    codePatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(code => codes.add(code));
    });
    
    return Array.from(codes);
}

/**
 * Display code references in the UI
 */
function displayCodeReferences(codes) {
    elements.codeReferencesList.innerHTML = '';
    
    if (codes.length === 0) {
        elements.codeReferencesList.innerHTML = '<p>No code references found.</p>';
        return;
    }
    
    codes.forEach(code => {
        // Find code description in state.codes
        const codeObj = state.codes.find(c => c.code === code);
        const description = codeObj ? codeObj.description : 'Description not available';
        const category = codeObj ? codeObj.category : 'Unknown';
        
        const referenceEl = document.createElement('div');
        referenceEl.className = 'reference-item';
        referenceEl.innerHTML = `
            <div class="reference-code">${code} (${category})</div>
            <div>${description}</div>
        `;
        
        elements.codeReferencesList.appendChild(referenceEl);
    });
}

/**
 * Clear the question form
 */
function clearQuestionForm() {
    elements.questionText.value = '';
    elements.optionA.value = '';
    elements.optionB.value = '';
    elements.optionC.value = '';
    elements.optionD.value = '';
    elements.questionResult.classList.add('hidden');
}

// ============================
// PDF Upload Functions
// ============================

/**
 * Update filename display when file is selected
 */
function updateFilename(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileNameElement = e.target === elements.questionsPdf 
        ? elements.questionsFilename 
        : elements.answersFilename;
        
    fileNameElement.textContent = file.name;
}

/**
 * Handle PDF upload
 */
async function handlePdfUpload() {
    // Check if questions PDF is selected
    const questionsPdf = elements.questionsPdf.files[0];
    const answersPdf = elements.answersPdf.files[0] || null;
    
    if (!questionsPdf) {
        showToast('Please select a questions PDF', 'error');
        return;
    }
    
    // Upload PDFs to API
    try {
        toggleLoading(true, 'Processing PDF files...');
        
        const result = await API.uploadPdfs(questionsPdf, answersPdf);
        
        // Display results
        displayPdfResults(result);
        
        showToast('PDFs processed successfully!', 'success');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        toggleLoading(false);
    }
}

/**
 * Display PDF processing results
 */
function displayPdfResults(result) {
    // Update score if available
    if (result.score !== undefined) {
        elements.scoreValue.textContent = result.score;
        elements.scoreTotal.textContent = result.total;
        elements.pdfResults.querySelector('#score-display').style.display = 'block';
    } else {
        elements.pdfResults.querySelector('#score-display').style.display = 'none';
    }
    
    // Clear previous results
    elements.pdfResultsList.innerHTML = '';
    
    // Add results
    result.results.forEach(item => {
        const resultEl = document.createElement('div');
        resultEl.className = 'result-item';
        
        // Format options for display
        const optionsHtml = Object.keys(item.options).map(letter => {
            let optionClass = '';
            if (item.modelAnswer === letter) {
                optionClass = 'selected';
                // Add to state
                state.questionsAnswered++;
            }
            if (item.correctAnswer === letter) {
                optionClass = 'correct';
                if (item.modelAnswer === letter) {
                    state.correctAnswers++;
                }
            } else if (item.modelAnswer === letter && item.correctAnswer !== null) {
                optionClass = 'incorrect';
            }
            
            return `
                <div class="result-option ${optionClass}">
                    <div class="option-letter">${letter}</div>
                    <div>${item.options[letter]}</div>
                </div>
            `;
        }).join('');
        
        resultEl.innerHTML = `
            <div class="result-item-header">
                <div class="question-number">Question ${item.number}</div>
                ${item.isCorrect !== null ? `<div class="result-status ${item.isCorrect ? 'correct' : 'incorrect'}">
                    <i class="fas ${item.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${item.isCorrect ? 'Correct' : 'Incorrect'}
                </div>` : ''}
            </div>
            <div class="result-question">${item.question}</div>
            <div class="result-options">${optionsHtml}</div>
            <div class="result-explanation">${item.explanation}</div>
        `;
        
        elements.pdfResultsList.appendChild(resultEl);
    });
    
    // Update stats
    updateStats();
    
    // Show results container
    elements.pdfResults.classList.remove('hidden');
}

// ============================
// Code Lookup Functions
// ============================

/**
 * Load medical codes from API
 */
async function loadMedicalCodes() {
    try {
        // Fetch codes from localStorage first for quick load
        const cachedCodes = localStorage.getItem('medicalCodes');
        if (cachedCodes) {
            state.codes = JSON.parse(cachedCodes);
            elements.codeCount.textContent = state.codes.length;
            displayCodes(state.codes);
        }
        
        // Then try to fetch from API
        const codes = await API.getMedicalCodes();
        state.codes = codes;
        
        // Update the code count and table
        elements.codeCount.textContent = codes.length;
        displayCodes(codes);
        
        // Cache codes in localStorage
        localStorage.setItem('medicalCodes', JSON.stringify(codes));
    } catch (error) {
        console.error('Failed to load medical codes:', error);
        // If API fails but we have cached codes, use those
        if (!state.codes.length) {
            showToast('Failed to load medical codes. Please try again later.', 'error');
        }
    }
}

/**
 * Display codes in the codes table
 */
function displayCodes(codes) {
    // Clear table
    elements.codesTbody.innerHTML = '';
    
    // Add codes to table
    codes.slice(0, 100).forEach(code => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${code.code}</td>
            <td>${code.description}</td>
            <td>${code.category}</td>
        `;
        elements.codesTbody.appendChild(row);
    });
    
    if (codes.length > 100) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3" style="text-align: center; padding: 1rem;">
                Showing 100 of ${codes.length} codes. Use the search to narrow down results.
            </td>
        `;
        elements.codesTbody.appendChild(row);
    }
}

/**
 * Handle code search
 */
async function handleCodeSearch() {
    const query = elements.codeSearchInput.value.trim();
    const category = elements.categoryFilter.value;
    
    if (query.length < 2 && category === 'all') {
        displayCodes(state.codes);
        return;
    }
    
    try {
        let filteredCodes = [];
        
        if (query.length >= 2) {
            // Search by query
            filteredCodes = await API.searchCodes(query, category);
        } else {
            // Just filter by category
            filteredCodes = state.codes.filter(code => 
                category === 'all' || code.category === category
            );
        }
        
        displayCodes(filteredCodes);
    } catch (error) {
        console.error('Search error:', error);
        showToast('Error searching codes', 'error');
    }
}

// ============================
// History Functions
// ============================

/**
 * Add a question to history
 */
function addToHistory(question, result, responseTime) {
    const historyItem = {
        id: Date.now(),
        date: new Date(),
        question,
        answer: result.modelAnswer,
        explanation: result.explanation,
        responseTime
    };
    
    // Add to state
    state.history.unshift(historyItem);
    if (state.history.length > 100) {
        state.history.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('questionHistory', JSON.stringify(state.history));
    
    // Update UI
    updateHistoryUI();
}

/**
 * Load question history from localStorage
 */
function loadQuestionHistory() {
    const history = localStorage.getItem('questionHistory');
    if (history) {
        state.history = JSON.parse(history);
        updateHistoryUI();
    }
}

/**
 * Update the history UI
 */
function updateHistoryUI() {
    if (state.history.length === 0) {
        elements.historyEmpty.style.display = 'flex';
        elements.historyList.style.display = 'none';
        return;
    }
    
    elements.historyEmpty.style.display = 'none';
    elements.historyList.style.display = 'grid';
    elements.historyList.innerHTML = '';
    
    state.history.forEach(item => {
        // Format date
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Truncate question
        const truncatedQuestion = item.question.substring(0, 100) + (item.question.length > 100 ? '...' : '');
        
        const historyEl = document.createElement('div');
        historyEl.className = 'history-item';
        historyEl.setAttribute('data-id', item.id);
        historyEl.innerHTML = `
            <div class="history-item-header">
                <div class="history-date">${formattedDate}</div>
                <span class="response-time">${item.responseTime.toFixed(1)}s</span>
            </div>
            <div class="history-answer">
                <div class="history-letter">${item.answer}</div>
                <strong>Option ${item.answer}</strong>
            </div>
            <p>${truncatedQuestion}</p>
        `;
        
        // Add click event to show the question details
        historyEl.addEventListener('click', () => {
            showHistoryDetails(item);
        });
        
        elements.historyList.appendChild(historyEl);
    });
}

/**
 * Show history item details
 */
function showHistoryDetails(item) {
    // Navigate to single question section
    document.querySelector('.sidebar-nav a[href="#single-question"]').click();
    
    // Clear form
    clearQuestionForm();
    
    // Set question text (parse question to extract options)
    const lines = item.question.split('\n');
    const questionText = lines[0];
    
    // Extract options
    const optionA = lines[1]?.replace('A. ', '') || '';
    const optionB = lines[2]?.replace('B. ', '') || '';
    const optionC = lines[3]?.replace('C. ', '') || '';
    const optionD = lines[4]?.replace('D. ', '') || '';
    
    // Fill form
    elements.questionText.value = questionText;
    elements.optionA.value = optionA;
    elements.optionB.value = optionB;
    elements.optionC.value = optionC;
    elements.optionD.value = optionD;
    
    // Set result
    elements.answerLetter.textContent = item.answer;
    
    // Set option text
    let answerText = '';
    switch (item.answer) {
        case 'A': answerText = optionA; break;
        case 'B': answerText = optionB; break;
        case 'C': answerText = optionC; break;
        case 'D': answerText = optionD; break;
    }
    
    elements.answerOption.textContent = answerText;
    elements.answerExplanation.textContent = item.explanation;
    elements.responseSeconds.textContent = item.responseTime.toFixed(1);
    
    // Extract code references
    const codes = extractCodesFromText(item.explanation);
    displayCodeReferences(codes);
    
    // Show result
    elements.questionResult.classList.remove('hidden');
} 