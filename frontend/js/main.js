/**
 * MediCode AI - Main Application Logic
 */

// State management
const state = {
  activeTab: 'dashboard',
  isLoading: false,
  questionsProcessed: 0,
  accuracy: 0,
  codeCounts: 0,
  avgResponseTime: 0
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Hide the loading overlay
  document.getElementById('loading-overlay').classList.add('hidden');
  
  // Setup navigation
  setupNavigation();
  
  // Setup form handlers
  setupForms();
  
  // Load medical codes
  loadMedicalCodes();
  
  // Set some initial stats for demo
  initializeStats();
  
  // Check URL hash to determine initial page
  const hash = window.location.hash.substring(1);
  if (hash) {
    navigateTo(hash);
  }
});

// Initialize demo stats
function initializeStats() {
  // Add null checks for each element
  const questionsEl = document.getElementById('stat-questions');
  const accuracyEl = document.getElementById('stat-accuracy');
  const timeEl = document.getElementById('stat-time');
  
  if (questionsEl) questionsEl.textContent = state.questionsProcessed;
  if (accuracyEl) accuracyEl.textContent = state.accuracy + '%';
  if (timeEl) timeEl.textContent = state.avgResponseTime + 's';
}

// Set up navigation
function setupNavigation() {
  // Handle tab clicks
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = e.currentTarget.getAttribute('href').substring(1);
      navigateTo(targetId);
    });
  });
  
  // Handle quick action buttons
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-target');
      navigateTo(targetTab);
    });
  });
}

// Navigate to a specific tab
function navigateTo(tabId) {
  // Update active state for navigation links
  document.querySelectorAll('.nav-links li').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-page') === tabId);
  });
  
  // Show the selected tab
  document.querySelectorAll('.page').forEach(tab => {
    tab.classList.toggle('active', tab.id === tabId);
  });
  
  // Update page title
  document.getElementById('current-page-title').textContent = 
    tabId.charAt(0).toUpperCase() + tabId.slice(1).replace('-', ' ');
  
  // Store the active tab
  state.activeTab = tabId;
  
  // If navigating to code lookup, reload the codes
  if (tabId === 'code-lookup') {
    loadMedicalCodes();
  }
}

// Set up form handlers
function setupForms() {
  // Single question form
  const submitBtn = document.getElementById('submit-question');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleQuestionSubmit);
  }
  
  const clearBtn = document.getElementById('clear-question');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearQuestionForm);
  }
  
  // Bulk questions form
  const questionsJsonInput = document.getElementById('questions-json');
  if (questionsJsonInput) {
    questionsJsonInput.addEventListener('change', handleJsonFileSelection);
  }
  
  const processJsonBtn = document.getElementById('process-json');
  if (processJsonBtn) {
    processJsonBtn.addEventListener('click', handleBulkQuestionsSubmit);
  }
  
  const exportCsvBtn = document.getElementById('export-csv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportResultsAsCsv);
  }
  
  const exportJsonBtn = document.getElementById('export-json');
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', exportResultsAsJson);
  }
  
  const filterResultsBtn = document.getElementById('filter-results');
  if (filterResultsBtn) {
    filterResultsBtn.addEventListener('click', filterResults);
  }
  
  const resultsSearchInput = document.getElementById('results-search');
  if (resultsSearchInput) {
    resultsSearchInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        filterResults();
      }
    });
  }
  
  // PDF upload form
  const processPdfsBtn = document.getElementById('process-pdfs');
  if (processPdfsBtn) {
    processPdfsBtn.addEventListener('click', handlePdfSubmit);
  }
  
  // File input handlers to update display names
  const questionsPdfInput = document.getElementById('questions-pdf');
  if (questionsPdfInput) {
    questionsPdfInput.addEventListener('change', function() {
      const fileNameDisplay = document.getElementById('questions-filename');
      fileNameDisplay.textContent = this.files.length > 0 ? this.files[0].name : 'No file chosen';
    });
  }
  
  const answersPdfInput = document.getElementById('answers-pdf');
  if (answersPdfInput) {
    answersPdfInput.addEventListener('change', function() {
      const fileNameDisplay = document.getElementById('answers-filename');
      fileNameDisplay.textContent = this.files.length > 0 ? this.files[0].name : 'No file chosen';
    });
  }
  
  // Code search form
  const codeSearchBtn = document.getElementById('code-search-btn');
  if (codeSearchBtn) {
    codeSearchBtn.addEventListener('click', handleCodeSearch);
  }
  
  const codeSearchInput = document.getElementById('code-search');
  if (codeSearchInput) {
    // Listen for Enter key press
    codeSearchInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        handleCodeSearch();
      }
    });
    
    // Add input event for real-time searching (debounced)
    let searchTimeout;
    codeSearchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (this.value.trim().length >= 2 || this.value.trim().length === 0) {
          handleCodeSearch();
        }
      }, 500); // Delay of 500ms to avoid too many searches while typing
    });
  }
  
  // Setup global search field
  const globalSearchInput = document.getElementById('global-search');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        // Navigate to code-lookup tab and set the search value
        const searchValue = this.value.trim();
        if (searchValue) {
          navigateTo('code-lookup');
          const codeSearchInput = document.getElementById('code-search');
          if (codeSearchInput) {
            codeSearchInput.value = searchValue;
            handleCodeSearch();
          }
        }
      }
    });
  }
  
  // Setup category filter for code lookup
  setupCategoryFilter();
}

// Load medical codes
async function loadMedicalCodes() {
  try {
    const loadingEl = document.getElementById('codes-loading');
    const emptyEl = document.getElementById('codes-empty');
    
    // Show loading indicator if we're on the code lookup page
    if (state.activeTab === 'code-lookup' && loadingEl) {
      loadingEl.classList.remove('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
    }
    
    console.log('Fetching medical codes from API...');
    
    let codes;
    try {
      // First try to get from API
      codes = await API.getMedicalCodes();
    } catch (apiError) {
      console.warn('API request failed, loading fallback codes:', apiError);
      // If API fails, try to directly load from data/codes.json
      try {
        const response = await fetch('/data/codes.json');
        if (!response.ok) {
          throw new Error('Failed to load fallback codes');
        }
        codes = await response.json();
        console.log('Loaded fallback codes from data/codes.json');
      } catch (fetchError) {
        console.error('Failed to load from fetch, using hardcoded fallback');
        // Last resort: use hardcoded fallback with a few basic codes
        codes = [
          { code: "E11.9", description: "Type 2 diabetes mellitus without complications", category: "ICD-10" },
          { code: "I10", description: "Essential (primary) hypertension", category: "ICD-10" },
          { code: "J18.9", description: "Pneumonia, unspecified organism", category: "ICD-10" },
          { code: "99213", description: "Office visit, established patient, expanded problem-focused", category: "CPT" },
          { code: "99214", description: "Office visit, established patient, detailed", category: "CPT" },
          { code: "G0008", description: "Administration of influenza virus vaccine", category: "HCPCS" }
        ];
        console.log('Using hardcoded fallback codes');
      }
    }
    
    console.log(`Received ${codes ? codes.length : 0} codes`);
    
    // Update state only if we got valid data
    if (codes && Array.isArray(codes)) {
      state.codeCounts = codes.length;
      
      // Update stat on dashboard
      const statElement = document.getElementById('stat-codes');
      if (statElement) {
        statElement.textContent = state.codeCounts;
      }
      
      // Display codes if we're on the code lookup page
      if (state.activeTab === 'code-lookup') {
        displayCodes(codes);
      }
    } else {
      console.error('Invalid code data received:', codes);
      // Hide loading and show empty state if on code lookup page
      if (state.activeTab === 'code-lookup') {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
        showToast('Failed to load medical codes', 'error');
      }
    }
  } catch (error) {
    console.error('Error loading medical codes:', error);
    
    // Handle error UI if on code lookup page
    if (state.activeTab === 'code-lookup') {
      const loadingEl = document.getElementById('codes-loading');
      const emptyEl = document.getElementById('codes-empty');
      
      if (loadingEl) loadingEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      
      showToast('Failed to load medical codes from server', 'error');
    }
  }
}

// Show loading overlay
function showLoading(message = 'Processing your request...') {
  state.isLoading = true;
  const overlay = document.getElementById('loading-overlay');
  document.getElementById('loading-message').textContent = message;
  overlay.classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
  state.isLoading = false;
  document.getElementById('loading-overlay').classList.add('hidden');
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} toast-icon"></i>
    <span>${message}</span>
  `;
  
  const container = document.getElementById('toast-container');
  container.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Display codes in the table
function displayCodes(codes) {
  const tbody = document.getElementById('codes-tbody');
  const loadingEl = document.getElementById('codes-loading');
  const emptyEl = document.getElementById('codes-empty');
  
  // Clear previous results
  tbody.innerHTML = '';
  
  // Hide loading indicator
  if (loadingEl) {
    loadingEl.classList.add('hidden');
  }
  
  // If no codes found or codes is not an array, show empty state
  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    if (emptyEl) {
      emptyEl.classList.remove('hidden');
    }
    return;
  }
  
  // If we have codes, hide empty state
  if (emptyEl) {
    emptyEl.classList.add('hidden');
  }
  
  // Add rows for each code
  codes.forEach(code => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${code.code || 'N/A'}</td>
      <td>${code.description || 'No description available'}</td>
      <td>${code.category || 'Unspecified'}</td>
    `;
    tbody.appendChild(row);
  });
}
