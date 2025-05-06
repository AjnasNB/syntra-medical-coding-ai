/**
 * MediCode AI - Medical Coding Assistant
 * Main JavaScript File
 */

// DOM Elements
const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.sidebar-nav a'),
    contentSections: document.querySelectorAll('.content-section'),
    actionButtons: document.querySelectorAll('.action-btn'),
    
    // Theme Toggle
    themeToggle: document.getElementById('theme-toggle'),
    
    // Single Question
    questionText: document.getElementById('question-text'),
    optionA: document.getElementById('option-a'),
    optionB: document.getElementById('option-b'),
    optionC: document.getElementById('option-c'),
    optionD: document.getElementById('option-d'),
    submitQuestion: document.getElementById('submit-question'),
    clearQuestion: document.getElementById('clear-question'),
    questionResult: document.getElementById('question-result'),
    answerLetter: document.getElementById('answer-letter'),
    answerOption: document.getElementById('answer-option'),
    answerExplanation: document.getElementById('answer-explanation'),
    responseSeconds: document.getElementById('response-seconds'),
    codeReferencesList: document.getElementById('code-references-list'),
    
    // PDF Upload
    questionsPdf: document.getElementById('questions-pdf'),
    answersPdf: document.getElementById('answers-pdf'),
    questionsFilename: document.getElementById('questions-filename'),
    answersFilename: document.getElementById('answers-filename'),
    processPdfs: document.getElementById('process-pdfs'),
    pdfResults: document.getElementById('pdf-results'),
    scoreValue: document.getElementById('score-value'),
    scoreTotal: document.getElementById('score-total'),
    pdfResultsList: document.getElementById('pdf-results-list'),
    
    // Code Lookup
    codeSearchInput: document.getElementById('code-search-input'),
    categoryFilter: document.getElementById('category-filter'),
    codesTable: document.getElementById('codes-table'),
    codesTbody: document.getElementById('codes-tbody'),
    codeCount: document.querySelector('.code-count'),
    
    // History
    historyEmpty: document.getElementById('history-empty'),
    historyList: document.getElementById('history-list'),
    
    // Loading & Notifications
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingMessage: document.getElementById('loading-message'),
    toastContainer: document.getElementById('toast-container')
};

// State
const state = {
    darkTheme: false,
    questionsAnswered: 0,
    correctAnswers: 0,
    totalResponseTime: 0,
    history: [],
    codes: [],
    isLoading: false
};

// ============================
// Navigation & UI Functions
// ============================

/**
 * Initialize the application
 */
function initApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Load user preferences
    loadUserPreferences();
    
    // Load medical codes
    loadMedicalCodes();
    
    // Load question history
    loadQuestionHistory();
    
    // Update stats
    updateStats();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Quick action buttons
    elements.actionButtons.forEach(button => {
        button.addEventListener('click', handleQuickAction);
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Single Question Form
    elements.submitQuestion.addEventListener('click', handleQuestionSubmit);
    elements.clearQuestion.addEventListener('click', clearQuestionForm);
    
    // PDF Upload
    elements.questionsPdf.addEventListener('change', updateFilename);
    elements.answersPdf.addEventListener('change', updateFilename);
    elements.processPdfs.addEventListener('click', handlePdfUpload);
    
    // Code Lookup
    elements.codeSearchInput.addEventListener('input', handleCodeSearch);
    elements.categoryFilter.addEventListener('change', handleCodeSearch);
}

/**
 * Handle navigation between sections
 */
function handleNavigation(e) {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href').substring(1);
    
    // Update active navigation item
    elements.navLinks.forEach(link => {
        if (link === e.currentTarget) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
    
    // Show the corresponding section
    elements.contentSections.forEach(section => {
        if (section.id === targetId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
}

/**
 * Handle quick action button clicks
 */
function handleQuickAction(e) {
    const targetSection = e.currentTarget.getAttribute('data-target');
    
    // Find the corresponding nav link and simulate a click
    elements.navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${targetSection}`) {
            link.click();
        }
    });
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    state.darkTheme = !state.darkTheme;
    
    if (state.darkTheme) {
        document.body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkTheme', state.darkTheme);
}

/**
 * Load user preferences from localStorage
 */
function loadUserPreferences() {
    // Load theme preference
    const darkTheme = localStorage.getItem('darkTheme');
    if (darkTheme === 'true') {
        state.darkTheme = true;
        document.body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

/**
 * Update the statistics on the dashboard
 */
function updateStats() {
    const statsElements = document.querySelectorAll('.stat-number');
    
    // Questions answered
    statsElements[0].textContent = state.questionsAnswered;
    
    // Accuracy
    const accuracy = state.questionsAnswered > 0 
        ? Math.round((state.correctAnswers / state.questionsAnswered) * 100) 
        : 0;
    statsElements[1].textContent = `${accuracy}%`;
    
    // Codes in database
    statsElements[2].textContent = state.codes.length;
    
    // Average response time
    const avgTime = state.questionsAnswered > 0 
        ? Math.round((state.totalResponseTime / state.questionsAnswered) * 10) / 10 
        : 0;
    statsElements[3].textContent = `${avgTime}s`;
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon} toast-icon"></i>
        <div>${message}</div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

/**
 * Show or hide the loading overlay
 */
function toggleLoading(show, message = 'Processing your request...') {
    state.isLoading = show;
    
    if (show) {
        elements.loadingMessage.textContent = message;
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 