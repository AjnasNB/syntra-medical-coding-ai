/**
 * MediCode AI - UI Module
 * Handles UI interaction functionality
 */

// Handle question form submission
async function handleQuestionSubmit() {
  const questionText = document.getElementById('question-text').value;
  const optionA = document.getElementById('option-a').value;
  const optionB = document.getElementById('option-b').value;
  const optionC = document.getElementById('option-c').value;
  const optionD = document.getElementById('option-d').value;
  
  if (!questionText || !optionA || !optionB || !optionC || !optionD) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  try {
    showLoading('Analyzing your question...');
    
    const startTime = Date.now();
    const response = await API.submitQuestion(questionText, {
      A: optionA,
      B: optionB,
      C: optionC,
      D: optionD
    });
    
    const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Update stats
    state.questionsProcessed++;
    state.avgResponseTime = responseTime;
    document.getElementById('stat-questions').textContent = state.questionsProcessed;
    document.getElementById('stat-time').textContent = state.avgResponseTime + 's';
    
    // Display result
    document.getElementById('answer-letter').textContent = response.answer;
    document.getElementById('answer-text').innerHTML = response.answerText;
    document.getElementById('explanation-text').innerHTML = response.explanation;
    document.getElementById('response-time').textContent = responseTime;
    
    // Display code references
    const referencesList = document.getElementById('code-references-list');
    referencesList.innerHTML = '';
    
    if (response.codeReferences && Array.isArray(response.codeReferences)) {
      response.codeReferences.forEach(ref => {
        const referenceItem = document.createElement('div');
        referenceItem.className = 'reference-item';
        referenceItem.innerHTML = `
          <span class="reference-code">${ref.code || ''}</span>
          <span class="reference-desc">${ref.description || ''}</span>
        `;
        referencesList.appendChild(referenceItem);
      });
    }
    
    // Show result
    document.getElementById('question-result').classList.remove('hidden');
    
    // Add to recent activity
    addActivity('Question analyzed', `Answer: ${response.answer}`);
    
    hideLoading();
    showToast('Question analyzed successfully', 'success');
  } catch (error) {
    hideLoading();
    showToast('Failed to analyze question', 'error');
    console.error(error);
  }
}

// Clear question form
function clearQuestionForm() {
  document.getElementById('question-text').value = '';
  document.getElementById('option-a').value = '';
  document.getElementById('option-b').value = '';
  document.getElementById('option-c').value = '';
  document.getElementById('option-d').value = '';
  document.getElementById('question-result').classList.add('hidden');
}

// Handle JSON file upload
function handleJsonFileSelection() {
  const fileInput = document.getElementById('questions-json');
  const fileNameDisplay = document.getElementById('json-filename');
  
  if (fileInput.files.length > 0) {
    fileNameDisplay.textContent = fileInput.files[0].name;
    
    // Read the file content
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const jsonContent = JSON.parse(e.target.result);
        document.getElementById('json-content').value = JSON.stringify(jsonContent, null, 2);
      } catch (error) {
        showToast('Invalid JSON file format', 'error');
        console.error(error);
      }
    };
    reader.readAsText(fileInput.files[0]);
  } else {
    fileNameDisplay.textContent = 'No file chosen';
  }
}

// Process bulk questions from JSON
async function handleBulkQuestionsSubmit() {
  const jsonContent = document.getElementById('json-content').value;
  
  if (!jsonContent) {
    showToast('Please upload or paste JSON content', 'error');
    return;
  }
  
  try {
    // Check if this is a file reference format (@filename)
    if (jsonContent.trim().startsWith('@')) {
      const filename = jsonContent.trim().substring(1);
      showLoading(`Loading questions from ${filename}. This may take a few moments...`);
      
      try {
        // Fetch the referenced file
        const response = await fetch(filename);
        if (!response.ok) {
          throw new Error(`Failed to load file: ${filename}`);
        }
        
        const fileContent = await response.json();
        if (!Array.isArray(fileContent)) {
          showToast('File must contain an array of questions', 'error');
          hideLoading();
          return;
        }
        
        // Process the questions from the file
        const startTime = Date.now();
        const response2 = await API.submitBulkQuestions(fileContent);
        
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // Update stats and display results
        processAndDisplayBulkResults(response2, fileContent.length, responseTime);
      } catch (error) {
        hideLoading();
        showToast(`Error loading file: ${error.message}`, 'error');
        console.error('File loading error:', error);
      }
      return;
    }
    
    // Regular JSON processing
    // Parse the JSON content
    const questions = JSON.parse(jsonContent);
    
    if (!Array.isArray(questions)) {
      showToast('JSON must contain an array of questions', 'error');
      return;
    }
    
    showLoading(`Processing ${questions.length} questions. This may take a few moments...`);
    
    const startTime = Date.now();
    const response = await API.submitBulkQuestions(questions);
    
    const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Process and display results
    processAndDisplayBulkResults(response, questions.length, responseTime);
    
  } catch (error) {
    hideLoading();
    if (error.message.includes('JSON')) {
      showToast('Invalid JSON format. Please check your input.', 'error');
    } else {
      showToast('Failed to process questions: ' + error.message, 'error');
    }
    console.error(error);
  }
}

// Helper function to process and display bulk results
function processAndDisplayBulkResults(response, questionCount, responseTime) {
  // Update stats
  state.questionsProcessed += questionCount;
  document.getElementById('stat-questions').textContent = state.questionsProcessed;
  
  // Display results
  document.getElementById('processed-count').textContent = response.processedQuestions;
  document.getElementById('bulk-response-time').textContent = responseTime;
  
  // Display individual results
  const resultsList = document.getElementById('bulk-results-list');
  resultsList.innerHTML = '';
  
  response.results.forEach(result => {
    const resultItem = document.createElement('div');
    resultItem.className = 'bulk-result-item';
    
    // Create the HTML for the result item with styling to match single question
    let optionsHTML = '';
    if (result.answerText && result.answer) {
      optionsHTML = `
        <div class="answer">
          <div class="answer-letter" style="color: #fff; background-color: #6f67e4;">${result.answer}</div>
          <div class="answer-details">
            <h4>Best Answer</h4>
            <p>${result.answerText}</p>
          </div>
        </div>
      `;
    }
    
    // Create references HTML
    let referencesHTML = '';
    if (result.codeReferences && result.codeReferences.length > 0) {
      result.codeReferences.forEach(ref => {
        referencesHTML += `
          <div class="reference-item">
            <span class="reference-code">${ref.code}</span>
            <span class="reference-desc">${ref.description}</span>
          </div>
        `;
      });
    }
    
    resultItem.innerHTML = `
      <div class="question-header">
        <div class="question-number">Question ${result.question_number}</div>
        <div class="answer-badge" style="background-color: #6f67e4; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem;">${result.answer}</div>
      </div>
      <div class="question-text">${result.question}</div>
      <div class="result-content">
        ${optionsHTML}
        <div class="explanation">
          <h4>Explanation</h4>
          <p>${result.explanation}</p>
        </div>
        <div class="code-references">
          <h4>Code References</h4>
          <div class="references-list">
            ${referencesHTML}
          </div>
        </div>
      </div>
    `;
    
    resultsList.appendChild(resultItem);
  });
  
  // Show results container
  document.getElementById('bulk-results').classList.remove('hidden');
  
  // Add to recent activity
  addActivity('Bulk questions processed', `Processed ${response.processedQuestions} questions in ${responseTime}s`);
  
  hideLoading();
  showToast(`Successfully processed ${response.processedQuestions} questions`, 'success');
}

// Export results as CSV
function exportResultsAsCsv() {
  const resultsList = document.querySelectorAll('.bulk-result-item');
  
  if (resultsList.length === 0) {
    showToast('No results to export', 'info');
    return;
  }
  
  let csvContent = 'Question Number,Question,Answer,Explanation\n';
  
  resultsList.forEach(item => {
    const questionNumber = item.querySelector('.question-number').textContent.replace('Question ', '');
    const question = item.querySelector('.question-text').textContent.replace(/"/g, '""'); // Escape quotes
    const answer = item.querySelector('.answer-badge').textContent;
    const explanation = item.querySelector('.explanation p').textContent.replace(/"/g, '""');
    
    csvContent += `"${questionNumber}","${question}","${answer}","${explanation}"\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `medical_coding_results_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export results as JSON
function exportResultsAsJson() {
  const resultsList = document.querySelectorAll('.bulk-result-item');
  
  if (resultsList.length === 0) {
    showToast('No results to export', 'info');
    return;
  }
  
  const results = [];
  
  resultsList.forEach(item => {
    const questionNumber = parseInt(item.querySelector('.question-number').textContent.replace('Question ', ''), 10);
    const question = item.querySelector('.question-text').textContent;
    const answer = item.querySelector('.answer-badge').textContent;
    const explanation = item.querySelector('.explanation p').textContent;
    
    // Get code references
    const codeRefs = [];
    item.querySelectorAll('.reference-item').forEach(ref => {
      codeRefs.push({
        code: ref.querySelector('.reference-code').textContent,
        description: ref.querySelector('.reference-desc').textContent
      });
    });
    
    results.push({
      question_number: questionNumber,
      question: question,
      answer: answer,
      explanation: explanation,
      codeReferences: codeRefs
    });
  });
  
  const jsonContent = JSON.stringify(results, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `medical_coding_results_${new Date().toISOString().slice(0,10)}.json`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Filter bulk results
function filterResults() {
  const searchQuery = document.getElementById('results-search').value.toLowerCase();
  const resultItems = document.querySelectorAll('.bulk-result-item');
  
  resultItems.forEach(item => {
    const questionText = item.querySelector('.question-text').textContent.toLowerCase();
    const explanationText = item.querySelector('.explanation p').textContent.toLowerCase();
    
    if (questionText.includes(searchQuery) || explanationText.includes(searchQuery)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Handle PDF submission
async function handlePdfSubmit() {
  const questionsPdfInput = document.getElementById('questions-pdf');
  const answersPdfInput = document.getElementById('answers-pdf');
  
  if (!questionsPdfInput.files || questionsPdfInput.files.length === 0) {
    showToast('Please select a questions PDF file', 'error');
    return;
  }
  
  try {
    showLoading('Processing PDF files. This may take a few moments...');
    
    const response = await API.uploadPdfs(
      questionsPdfInput.files[0],
      answersPdfInput.files.length > 0 ? answersPdfInput.files[0] : null
    );
    
    // Show results
    const resultsList = document.getElementById('pdf-results-list');
    resultsList.innerHTML = '';
    
    response.results.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.className = `result-item ${result.isCorrect ? 'correct' : 'incorrect'}`;
      resultItem.innerHTML = `
        <div class="result-number">Q${result.questionNumber}</div>
        <div class="result-answers">
          <div class="ai-answer">AI: ${result.aiAnswer}</div>
          ${result.correctAnswer ? `<div class="correct-answer">Correct: ${result.correctAnswer}</div>` : ''}
        </div>
        <div class="result-status">
          <i class="fas fa-${result.isCorrect ? 'check' : 'times'}-circle"></i>
        </div>
      `;
      resultsList.appendChild(resultItem);
    });
    
    // Update score
    document.getElementById('score-value').textContent = response.score;
    document.getElementById('total-questions').textContent = response.totalQuestions;
    
    // Show results
    document.getElementById('pdf-results').classList.remove('hidden');
    
    // Update stats
    state.questionsProcessed += response.totalQuestions;
    if (response.totalQuestions > 0) {
      state.accuracy = Math.round((response.score / response.totalQuestions) * 100);
    }
    
    document.getElementById('stat-questions').textContent = state.questionsProcessed;
    document.getElementById('stat-accuracy').textContent = state.accuracy + '%';
    
    // Add to recent activity
    addActivity('PDF analyzed', `Score: ${response.score}/${response.totalQuestions}`);
    
    hideLoading();
    showToast('PDF files processed successfully', 'success');
  } catch (error) {
    hideLoading();
    showToast('Failed to process PDF files', 'error');
    console.error(error);
  }
}

// Handle code search
async function handleCodeSearch() {
  const query = document.getElementById('code-search').value.trim();
  const category = document.getElementById('category-filter').value;
  
  try {
    // Show loading indicator and hide empty state
    document.getElementById('codes-loading').classList.remove('hidden');
    document.getElementById('codes-empty').classList.add('hidden');
    
    console.log(`Searching for codes with query: '${query}' in category: ${category}`);
    
    // Use the API to search codes with the query and category
    const codes = await API.searchCodes(query, category);
    console.log(`Found ${codes.length} codes matching criteria`);
    
    // Display the filtered codes
    displayCodes(codes);
    
    // Hide loading indicator
    document.getElementById('codes-loading').classList.add('hidden');
    
    // Show empty state if no codes found
    if (codes.length === 0) {
      document.getElementById('codes-empty').classList.remove('hidden');
    }
    
    // Add activity for tracking
    addActivity('Code search', `Found ${codes.length} codes for "${query || 'all'}" in ${category} category`);
    
  } catch (error) {
    // Handle errors
    document.getElementById('codes-loading').classList.add('hidden');
    document.getElementById('codes-empty').classList.remove('hidden');
    showToast('Failed to search codes: ' + error.message, 'error');
    console.error('Search error:', error);
  }
}

// Display codes in the table
function displayCodes(codes) {
  const tbody = document.getElementById('codes-tbody');
  const loadingEl = document.getElementById('codes-loading');
  const emptyEl = document.getElementById('codes-empty');
  const codesCountEl = document.getElementById('codes-count');
  const filterStatusEl = document.getElementById('filter-status');
  
  // Clear previous results
  tbody.innerHTML = '';
  
  // Always hide loading indicator
  if (loadingEl) {
    loadingEl.classList.add('hidden');
  }
  
  // If no codes found or codes is not an array, show empty state
  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    console.error('No codes available to display:', codes);
    if (emptyEl) {
      emptyEl.classList.remove('hidden');
    }
    
    // Update status elements
    if (codesCountEl) codesCountEl.textContent = '0 codes found';
    
    const query = document.getElementById('code-search')?.value?.trim() || '';
    const category = document.getElementById('category-filter')?.value || 'all';
    
    if (filterStatusEl) {
      if (query && category !== 'all') {
        filterStatusEl.textContent = `No results for "${query}" in ${category} category`;
      } else if (query) {
        filterStatusEl.textContent = `No results for "${query}"`;
      } else if (category !== 'all') {
        filterStatusEl.textContent = `No codes found in ${category} category`;
      } else {
        filterStatusEl.textContent = '';
      }
    }
    
    return;
  }
  
  // If we have codes, hide empty state
  if (emptyEl) {
    emptyEl.classList.add('hidden');
  }
  
  // Update codes count
  if (codesCountEl) {
    codesCountEl.textContent = `${codes.length} ${codes.length === 1 ? 'code' : 'codes'} found`;
  }
  
  // Update filter status
  if (filterStatusEl) {
    const query = document.getElementById('code-search')?.value?.trim() || '';
    const category = document.getElementById('category-filter')?.value || 'all';
    
    if (query && category !== 'all') {
      filterStatusEl.textContent = `Filtered by: "${query}" in ${category}`;
    } else if (query) {
      filterStatusEl.textContent = `Filtered by: "${query}"`;
    } else if (category !== 'all') {
      filterStatusEl.textContent = `Filtered by: ${category} category`;
    } else {
      filterStatusEl.textContent = 'Showing all codes';
    }
  }
  
  // Add rows for each code
  try {
    codes.forEach(code => {
      if (!code || typeof code !== 'object') {
        console.warn('Invalid code object:', code);
        return;
      }
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${code.code || 'N/A'}</td>
        <td>${code.description || 'No description available'}</td>
        <td>${code.category || 'Unspecified'}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error displaying codes:', error);
    showToast('Error displaying medical codes', 'error');
  }
}

// Add activity to recent activity list
function addActivity(title, description) {
  const activityList = document.getElementById('recent-activity-list');
  const emptyActivity = document.getElementById('empty-activity');
  
  if (emptyActivity) {
    emptyActivity.style.display = 'none';
  }
  
  const activityItem = document.createElement('div');
  activityItem.className = 'activity-item';
  
  const timestamp = new Date().toLocaleTimeString();
  
  activityItem.innerHTML = `
    <div class="activity-header">
      <h4>${title}</h4>
      <span class="activity-time">${timestamp}</span>
    </div>
    <p>${description}</p>
  `;
  
  activityList.prepend(activityItem);
  
  // Limit to 5 most recent activities
  const items = activityList.querySelectorAll('.activity-item');
  if (items.length > 5) {
    activityList.removeChild(items[items.length - 1]);
  }
  
  // Also add to history tab
  addToHistory(title, description);
}

// Add to history tab
function addToHistory(title, description) {
  const historyList = document.getElementById('history-list');
  const emptyHistory = document.getElementById('empty-history');
  
  if (emptyHistory) {
    emptyHistory.style.display = 'none';
  }
  
  const historyItem = document.createElement('div');
  historyItem.className = 'history-item';
  
  const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
  
  historyItem.innerHTML = `
    <div class="history-header">
      <h4>${title}</h4>
      <span class="history-time">${timestamp}</span>
    </div>
    <p>${description}</p>
  `;
  
  historyList.prepend(historyItem);
}

// Function to initialize the code lookup table with data directly on page load
function initializeCodeLookup() {
  if (document.getElementById('codes-table')) {
    console.log('Initializing code lookup table');
    
    // Show loading indicator
    const loadingEl = document.getElementById('codes-loading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    
    // Get the currently selected category filter value
    const categoryFilter = document.getElementById('category-filter');
    const categoryValue = categoryFilter ? categoryFilter.value : 'all';
    
    // Clear search field for a fresh start
    const searchField = document.getElementById('code-search');
    if (searchField) searchField.value = '';
    
    // Direct fetch from the data file to ensure immediate data display
    fetch('/data/codes.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load codes file');
        }
        return response.json();
      })
      .then(codes => {
        console.log(`Loaded ${codes.length} codes for initialization`);
        
        // Filter by category if not "all"
        if (categoryValue !== 'all') {
          codes = codes.filter(code => code.category === categoryValue);
          console.log(`Filtered to ${codes.length} ${categoryValue} codes`);
        }
        
        displayCodes(codes);
      })
      .catch(error => {
        console.error('Error initializing code lookup:', error);
        // Hide loading, show empty state
        if (loadingEl) loadingEl.classList.add('hidden');
        const emptyEl = document.getElementById('codes-empty');
        if (emptyEl) emptyEl.classList.remove('hidden');
      });
  }
}

// Add event listener for category filter change
function setupCategoryFilter() {
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
      // Get current search query and new category
      const query = document.getElementById('code-search').value.trim();
      const category = this.value;
      
      console.log(`Category filter changed to: ${category}`);
      
      // Show loading indicator and hide empty state
      document.getElementById('codes-loading').classList.remove('hidden');
      document.getElementById('codes-empty').classList.add('hidden');
      
      // Search with current query and new category
      API.searchCodes(query, category)
        .then(codes => {
          console.log(`Filtered to ${codes.length} codes by category: ${category}`);
          displayCodes(codes);
          
          // Add activity for tracking
          if (query) {
            addActivity('Code filter', `Filtered to ${codes.length} codes for "${query}" in ${category} category`);
          } else {
            addActivity('Code filter', `Filtered to ${codes.length} codes in ${category} category`);
          }
          
          // Show empty state if no codes found
          if (codes.length === 0) {
            document.getElementById('codes-empty').classList.remove('hidden');
          }
        })
        .catch(error => {
          document.getElementById('codes-loading').classList.add('hidden');
          document.getElementById('codes-empty').classList.remove('hidden');
          showToast('Failed to filter codes: ' + error.message, 'error');
          console.error('Filter error:', error);
        });
    });
  }
}

// Add to document ready event
document.addEventListener('DOMContentLoaded', function() {
  // Initialize code lookup if we're on that page
  if (window.location.hash === '#code-lookup') {
    initializeCodeLookup();
  }
  
  // Add event listener for hash changes to initialize code lookup when navigating to it
  window.addEventListener('hashchange', function() {
    if (window.location.hash === '#code-lookup') {
      initializeCodeLookup();
    }
  });
});

// Initialize UI event listeners on DOMContentLoaded in main.js
