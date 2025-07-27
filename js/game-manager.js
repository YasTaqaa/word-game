/**
 * Game Manager
 * Core game logic and state management
 */

class GameManager {
  constructor() {
    this.currentQuestion = 0;
    this.score = 0;
    this.totalQuestions = 0;
    this.questions = [];
    this.selectedLetters = [];
    this.letterSlots = [];
    this.gameState = GAME_STATES.LOADING;
    this.category = '';
    this.gameData = null;
    this.startTime = null;
    this.questionStartTime = null;
    this.questionTimes = [];
    
    // Bind methods to 'this' in the constructor once
    // This creates stable references for add/removeEventListener
    this._handleSlotClick = this.handleSlotClick.bind(this);
    this._handleLetterClick = this.handleLetterClick.bind(this);
    this._handleSaveAnswer = this.handleSaveAnswer.bind(this);
    this._handleNextQuestion = this.handleNextQuestion.bind(this);
    this._handleShowScore = this.handleShowScore.bind(this);
  }

  /**
   * Initialize game
   * @returns {Promise<boolean>} - Success status
   */
  async init() {
    try {
      this.showLoading(MESSAGES.LOADING.game);
      
      await this.loadGameData();
      await this.setupQuestions();
      await this.preloadAssets();
      
      this.gameState = GAME_STATES.READY;
      this.startTime = Date.now();
      
      await this.loadQuestion();
      
      this.hideLoading();
      return true;
    } catch (error) {
      console.error('Game initialization failed:', error);
      this.gameState = GAME_STATES.ERROR;
      this.showError(MESSAGES.ERRORS.loadFailed);
      return false;
    }
  }

  /**
   * Load game data based on category
   */
  async loadGameData() {
    this.category = Utils.getGameCategory();
    this.gameData = GAME_DATA[this.category];
    
    if (!this.gameData) {
      throw new Error(`Invalid game category: ${this.category}`);
    }

    // Update page title and background
    this.updatePageAppearance();
  }

  /**
   * Update page title and background based on category
   */
  updatePageAppearance() {
    if (!this.gameData) return;

    // Update page title
    document.title = this.gameData.title;
    
    // Update game title
    const titleElement = document.getElementById('game-title');
    if (titleElement) {
      titleElement.textContent = this.gameData.title;
    }

    // Update body background class
    const body = document.getElementById('game-body') || document.body;
    body.className = `full-bg ${this.gameData.background}`;
  }

  /**
   * Setup questions for the game
   */
  async setupQuestions() {
    if (!this.gameData?.questions) {
      throw new Error('No questions available for this category');
    }

    // Shuffle and select questions
    const allQuestions = Utils.shuffleArray(this.gameData.questions);
    this.questions = allQuestions.slice(0, CONFIG.QUESTIONS_PER_GAME);
    this.totalQuestions = this.questions.length;

    // Validate minimum questions
    if (this.questions.length < CONFIG.MIN_QUESTIONS_REQUIRED) {
      throw new Error('Insufficient questions for game');
    }

    console.log(`[GameManager] Initializing: Selected ${this.questions.length} questions for category: ${this.category}. Total available in data: ${allQuestions.length}`);
    console.log("[GameManager] Selected questions array (details):", this.questions);
  }

  /**
   * Preload game assets
   */
  async preloadAssets() {
    const imagePaths = this.questions.map(q => q.image);
    
    try {
      await Utils.preloadImages(imagePaths);
      console.log('Game images preloaded successfully');
    } catch (error) {
      console.warn('Some images failed to preload:', error);
      // Continue anyway, images will load on demand
    }
  }

  /**
   * Load current question
   */
  async loadQuestion() {
    console.log(`[GameManager] Loading question: currentQuestion=${this.currentQuestion}, totalQuestions=${this.totalQuestions}`);
    
    if (this.currentQuestion >= this.questions.length) {
      // If no more questions, navigate to score page
      this.handleShowScore(); // Automatically go to score page if all questions answered
      console.log("[GameManager] All questions completed, navigating to score.");
      return;
    }

    this.gameState = GAME_STATES.PLAYING;
    this.questionStartTime = Date.now();
    
    const question = this.questions[this.currentQuestion];
    
    try {
      await this.displayQuestion(question);
      this.resetAnswerState(question);
      this.createGameElements(question);
      this.updateUI(); // Reset UI state for new question
      this.updateProgress();
      
      console.log(`[GameManager] Successfully loaded question ${this.currentQuestion + 1}/${this.totalQuestions}. Question: "${question.translation}"`);
    } catch (error) {
      console.error('Failed to load question:', error);
      this.showError('Gagal memuat soal');
    }
  }

  /**
   * Display question image and text
   * @param {Object} question - Question data
   */
  async displayQuestion(question) {
    const container = document.getElementById('question-container');
    if (!container) throw new Error('Question container not found');

    // Create image with loading state
    const img = new Image();
    img.className = 'question-image';
    img.alt = question.translation;
    
    // Show loading state
    container.innerHTML = `
      <div class="image-loading">
        <div class="spinner small"></div>
        <p>Memuat gambar...</p>
      </div>
      <p class="question-text"><strong>${question.translation}</strong></p>
    `;

    // Load image
    return new Promise((resolve, reject) => {
      img.onload = () => {
        container.innerHTML = `
          <img src="${question.image}" alt="${question.translation}" class="question-image">
          <p class="question-text"><strong>${question.translation}</strong></p>
        `;
        
        // Add fade-in animation
        const loadedImg = container.querySelector('.question-image');
        if (loadedImg) {
          loadedImg.style.opacity = '0';
          Utils.fadeIn(loadedImg, 300);
        }
        
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to load image: ${question.image}`);
        container.innerHTML = `
          <div class="image-placeholder">
            <span class="placeholder-icon">${this.gameData.icon}</span>
            <p class="placeholder-text">Gambar tidak tersedia</p>
          </div>
          <p class="question-text"><strong>${question.translation}</strong></p>
        `;
        resolve(); // Continue even if image fails
      };
      
      img.src = question.image;
    });
  }

  /**
   * Reset answer state for new question
   * @param {Object} question - Question data
   */
  resetAnswerState(question) {
    const answerLength = Utils.removeSpaces(question.answer).length;
    this.selectedLetters = new Array(answerLength).fill('');
    this.letterSlots = [];
  }

  /**
   * Create game elements (answer slots and letter buttons)
   * @param {Object} question - Question data
   */
  createGameElements(question) {
    this.createAnswerSlots(question.answer);
    this.createLetterButtons(question.answer);
  }

  /**
   * Create answer slots
   * @param {string} answer - Correct answer
   */
  createAnswerSlots(answer) {
    const container = document.getElementById('answer-box');
    if (!container) throw new Error('Answer box not found');

    container.innerHTML = '';
    this.letterSlots = [];

    for (let i = 0; i < answer.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'letter-box';
      
      if (answer[i] === ' ') {
        slot.classList.add('space');
        slot.setAttribute('aria-hidden', 'true');
      } else {
        slot.dataset.index = this.letterSlots.length;
        slot.setAttribute('role', 'button');
        slot.setAttribute('tabindex', '0');
        slot.setAttribute('aria-label', 'Slot jawaban, klik untuk menghapus huruf');
        
        // Use the bound method here
        slot.addEventListener('click', this._handleSlotClick);
        slot.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleSlotClick(e); // Use the bound method
          }
        });
        
        this.letterSlots.push(slot);
      }
      
      container.appendChild(slot);
      
      // Add entrance animation
      slot.style.opacity = '0';
      slot.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        slot.style.transition = 'all 0.3s ease';
        slot.style.opacity = '1';
        slot.style.transform = 'scale(1)';
      }, i * 50);
    }
  }

  /**
   * Create letter buttons
   * @param {string} answer - Correct answer
   */
  createLetterButtons(answer) {
    const container = document.getElementById('letter-buttons');
    if (!container) throw new Error('Letter buttons container not found');

    const letters = Utils.shuffleArray(Utils.removeSpaces(answer).split(''));
    container.innerHTML = '';

    letters.forEach((letter, index) => {
      const button = document.createElement('button');
      button.className = 'letter-btn';
      button.textContent = letter;
      button.type = 'button';
      button.setAttribute('aria-label', `Huruf ${letter}`);
      
      // Use the bound method here
      button.addEventListener('click', this._handleLetterClick);
      
      container.appendChild(button);
      
      // Add entrance animation
      button.style.opacity = '0';
      button.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        button.style.transition = 'all 0.3s ease';
        button.style.opacity = '1';
        button.style.transform = 'translateY(0)';
      }, index * 30);
    });
  }

  /**
   * Handle answer slot click
   * @param {Event} event - Click event
   */
  handleSlotClick(event) {
    const slot = event.currentTarget;
    const index = parseInt(slot.dataset.index);
    
    if (!slot.textContent || isNaN(index)) return;

    // Play undo sound
    if (window.audioManager) {
      window.audioManager.play('undo');
    }

    // Return letter to buttons
    this.returnLetterToButtons(slot.textContent);
    
    // Clear slot
    this.selectedLetters[index] = '';
    slot.textContent = '';
    slot.classList.remove('filled');
    
    // Add removal animation
    slot.style.transform = 'scale(0.9)';
    setTimeout(() => {
      slot.style.transform = 'scale(1)';
    }, 150);
  }

  /**
   * Handle letter button click
   * @param {Event} event - Click event
   */
  handleLetterClick(event) {
    const button = event.currentTarget;
    const letter = button.textContent;
    
    // Find empty slot
    const emptyIndex = this.selectedLetters.findIndex(l => l === '');
    if (emptyIndex === -1) return;

    // Play click sound
    if (window.audioManager) {
      window.audioManager.play('click');
    }

    // Fill slot
    this.selectedLetters[emptyIndex] = letter;
    this.letterSlots[emptyIndex].textContent = letter;
    this.letterSlots[emptyIndex].classList.add('filled');
    
    // Add placement animation
    const slot = this.letterSlots[emptyIndex];
    slot.style.transform = 'scale(1.1)';
    setTimeout(() => {
      slot.style.transform = 'scale(1)';
    }, 150);

    // Remove button with animation
    button.style.transform = 'scale(0)';
    button.style.opacity = '0';
    
    setTimeout(() => {
      button.remove();
    }, 200);
  }

  /**
   * Return letter to buttons area
   * @param {string} letter - Letter to return
   */
  returnLetterToButtons(letter) {
    const container = document.getElementById('letter-buttons');
    if (!container) return;

    const button = document.createElement('button');
    button.className = 'letter-btn';
    button.textContent = letter;
    button.type = 'button';
    button.setAttribute('aria-label', `Huruf ${letter}`);
    
    button.addEventListener('click', this._handleLetterClick); // Use bound method here
    
    // Add entrance animation
    button.style.opacity = '0';
    button.style.transform = 'scale(0)';
    
    container.appendChild(button);
    
    setTimeout(() => {
      button.style.transition = 'all 0.3s ease';
      button.style.opacity = '1';
      button.style.transform = 'scale(1)';
    }, 50);
  }

  /**
   * Update UI state
   */
  updateUI() {
    console.log(`[GameManager] Updating UI. currentQuestion=${this.currentQuestion}, totalQuestions=${this.totalQuestions}`);
    const elements = {
      result: document.getElementById('result'),
      saveBtn: document.getElementById('save-btn'),
      nextBtn: document.getElementById('next-btn'),
      scoreBtn: document.getElementById('score-btn'),
      answerStatus: document.getElementById('answer-status')
    };

    // Reset UI state
    if (elements.result) {
      elements.result.textContent = '';
      elements.result.className = 'result-message';
    }
    
    if (elements.saveBtn) {
      elements.saveBtn.style.display = 'inline-block';
      elements.saveBtn.disabled = false;
      elements.saveBtn.textContent = '💾 Simpan Jawaban';
      elements.saveBtn.classList.remove('hidden');
      elements.saveBtn.style.opacity = '1';
    }
    
    if (elements.nextBtn) {
      elements.nextBtn.style.display = 'none';
      elements.nextBtn.classList.add('hidden');
    }
    
    if (elements.scoreBtn) {
      elements.scoreBtn.style.display = 'none';
      elements.scoreBtn.classList.add('hidden');
    }
    
    if (elements.answerStatus) {
      elements.answerStatus.style.display = 'none';
      elements.answerStatus.classList.add('hidden');
    }

    // Setup event listeners
    this.setupUIEventListeners();
  }

  /**
   * Setup UI event listeners
   */
  setupUIEventListeners() {
    const saveBtn = document.getElementById('save-btn');
    const nextBtn = document.getElementById('next-btn');
    const scoreBtn = document.getElementById('score-btn');

    // Remove previous listeners using the stable bound methods
    if (saveBtn) {
      saveBtn.removeEventListener('click', this._handleSaveAnswer);
      saveBtn.addEventListener('click', this._handleSaveAnswer);
    }

    if (nextBtn) {
      nextBtn.removeEventListener('click', this._handleNextQuestion);
      nextBtn.addEventListener('click', this._handleNextQuestion);
    }

    if (scoreBtn) {
      scoreBtn.removeEventListener('click', this._handleShowScore);
      scoreBtn.addEventListener('click', this._handleShowScore);
    }
  }

  /**
   * Update progress indicator
   */
  updateProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) {
      const percentage = ((this.currentQuestion + 1) / this.totalQuestions) * 100;
      progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `Soal ${this.currentQuestion + 1} dari ${this.totalQuestions}`;
    }
  }

  /**
   * Handle save answer
   */
  async handleSaveAnswer() {
    console.log(`[GameManager] handleSaveAnswer: currentQuestion=${this.currentQuestion}`);
    if (this.gameState !== GAME_STATES.PLAYING) return;

    // Check if answer is complete
    const currentAnswerLength = Utils.removeSpaces(this.questions[this.currentQuestion].answer).length;
    if (this.selectedLetters.filter(l => l !== '').length !== currentAnswerLength) {
        Utils.showError(MESSAGES.FEEDBACK.incomplete);
        if (window.audioManager) {
            window.audioManager.play('wrong');
        }
        return;
    }

    this.gameState = GAME_STATES.CHECKING;
    
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Memeriksa...';
    }

    // Record question time
    const questionTime = Date.now() - this.questionStartTime;
    this.questionTimes.push(questionTime);

    await Utils.delay(CONFIG.LOADING_DELAY);

    const userAnswer = this.selectedLetters.join('');
    const correctAnswer = Utils.removeSpaces(this.questions[this.currentQuestion].answer);
    const isCorrect = userAnswer === correctAnswer;

    await this.showResult(isCorrect);
    this.updateUIAfterAnswer();

    if (isCorrect) {
      this.score++;
    }

    console.log(`[GameManager] Question ${this.currentQuestion + 1} answered. Correct: ${isCorrect}.`);
  }

  /**
   * Show result of answer
   * @param {boolean} isCorrect - Whether answer is correct
   */
  async showResult(isCorrect) {
    const result = document.getElementById('result');
    const question = this.questions[this.currentQuestion];
    
    if (!result) return;

    if (isCorrect) {
      result.textContent = `${MESSAGES.FEEDBACK.correct} ${question.answer}`;
      result.className = 'result-message correct';
      
      if (window.audioManager) {
        window.audioManager.play('correct');
      }
      
      // Add celebration animation
      this.addCelebrationEffect();
    } else {
      result.textContent = `${MESSAGES.FEEDBACK.wrong} Jawaban: ${question.answer}`;
      result.className = 'result-message incorrect';
      
      if (window.audioManager) {
        window.audioManager.play('wrong');
      }
      
      // Add shake animation to incorrect letters
      this.addShakeEffect();
    }

    // Animate result appearance
    result.style.opacity = '0';
    result.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      result.style.transition = 'all 0.3s ease';
      result.style.opacity = '1';
      result.style.transform = 'translateY(0)';
    }, 100);
  }

  /**
   * Add celebration effect for correct answer
   */
  addCelebrationEffect() {
    // Add glow effect to correct slots
    this.letterSlots.forEach((slot, index) => {
      setTimeout(() => {
        slot.classList.add('correct-glow');
        setTimeout(() => {
          slot.classList.remove('correct-glow');
        }, 500);
      }, index * 50);
    });
  }

  /**
   * Add shake effect for incorrect answer
   */
  addShakeEffect() {
    const answerBox = document.getElementById('answer-box');
    if (answerBox) {
      answerBox.classList.add('shake');
      setTimeout(() => {
        answerBox.classList.remove('shake');
      }, 500);
    }
  }

  /**
   * Update UI after answer is checked
   */
  updateUIAfterAnswer() {
    console.log(`[GameManager] updateUIAfterAnswer: currentQuestion=${this.currentQuestion}, totalQuestions=${this.totalQuestions}`);
    const saveBtn = document.getElementById('save-btn');
    const nextBtn = document.getElementById('next-btn');
    const scoreBtn = document.getElementById('score-btn');
    const answerStatus = document.getElementById('answer-status');

    if (saveBtn) {
      // Use fadeOut for animation and to hide it completely
      Utils.fadeOut(saveBtn, 200); 
    }

    if (answerStatus) {
      // You might want to fade this in as well for consistency
      answerStatus.textContent = MESSAGES.FEEDBACK.saved;
      Utils.fadeIn(answerStatus, 200);
    }

    if (this.currentQuestion < this.questions.length - 1) {
      // Not the last question, show "Next Question"
      if (nextBtn) {
        // Ensure it's not hidden by 'display: none' then fade in
        Utils.fadeIn(nextBtn, 200);
      }
    } else {
      // Last question, show "See Score"
      if (scoreBtn) {
        // Ensure it's not hidden by 'display: none' then fade in
        Utils.fadeIn(scoreBtn, 200);
      }
    }
  }

  /**
   * Handle next question
   */
  async handleNextQuestion() {
    console.log(`[GameManager] handleNextQuestion: currentQuestion before increment=${this.currentQuestion}`);
    if (this.gameState !== GAME_STATES.CHECKING) return;

    if (window.audioManager) {
      window.audioManager.play('next');
    }

    this.currentQuestion++; // Increment the question index
    console.log(`[GameManager] handleNextQuestion: currentQuestion after increment=${this.currentQuestion}`);
    
    // Show loading for next question
    this.showLoading('Memuat soal berikutnya...');
    
    await Utils.delay(CONFIG.TRANSITION_DELAY);
    
    try {
      await this.loadQuestion();
      this.hideLoading();
    } catch (error) {
      console.error('Failed to load next question:', error);
      this.showError('Gagal memuat soal berikutnya');
    }
  }

  /**
   * Handle show score
   */
  async handleShowScore() {
    console.log("[GameManager] handleShowScore: Game finished.");
    if (window.audioManager) {
      window.audioManager.play('score');
    }

    this.gameState = GAME_STATES.COMPLETED;

    // Calculate game statistics
    const gameStats = this.calculateGameStats();
    
    // Save results
    this.saveGameResults(gameStats);

    // Show loading
    this.showLoading(MESSAGES.LOADING.score);
    
    await Utils.delay(CONFIG.TRANSITION_DELAY);
    
    // Navigate to score page
    window.location.href = 'score.html';
  }

  /**
   * Calculate game statistics
   * @returns {Object} - Game statistics
   */
  calculateGameStats() {
    const totalTime = Date.now() - this.startTime;
    const averageTime = this.questionTimes.length > 0 
      ? this.questionTimes.reduce((a, b) => a + b, 0) / this.questionTimes.length 
      : 0;

    return {
      score: this.score,
      totalQuestions: this.totalQuestions,
      percentage: Utils.calculatePercentage(this.score, this.totalQuestions),
      totalTime,
      averageTime,
      questionTimes: [...this.questionTimes],
      category: this.category,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Save game results to storage
   * @param {Object} stats - Game statistics
   */
  saveGameResults(stats) {
    // Save current game results
    Utils.setStorageItem(CONFIG.STORAGE_KEYS.SCORE, stats.score);
    Utils.setStorageItem(CONFIG.STORAGE_KEYS.TOTAL_QUESTIONS, stats.totalQuestions);
    
    // Save detailed stats
    Utils.setStorageItem('game_stats', stats);

    // Update high scores
    this.updateHighScores(stats);
  }

  /**
   * Update high scores
   * @param {Object} stats - Game statistics
   */
  updateHighScores(stats) {
    const highScores = Utils.getStorageItem(CONFIG.STORAGE_KEYS.HIGH_SCORES, {});
    
    if (!highScores[this.category]) {
      highScores[this.category] = [];
    }

    highScores[this.category].push({
      score: stats.score,
      percentage: stats.percentage,
      totalTime: stats.totalTime,
      date: stats.completedAt
    });

    // Keep only top 10 scores
    highScores[this.category] = highScores[this.category]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.totalTime - b.totalTime; // Faster time wins for same score
      })
      .slice(0, 10);

    Utils.setStorageItem(CONFIG.STORAGE_KEYS.HIGH_SCORES, highScores);
  }

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = MESSAGES.LOADING.game) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.querySelector('p').textContent = message;
      loading.classList.remove('hidden');
      Utils.fadeIn(loading, 200);
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      Utils.fadeOut(loading, 200);
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    Utils.showError(message);
    this.hideLoading();
  }

  /**
   * Get current game state
   * @returns {Object} - Current game state
   */
  getGameState() {
    return {
      currentQuestion: this.currentQuestion,
      score: this.score,
      totalQuestions: this.totalQuestions,
      gameState: this.gameState,
      category: this.category,
      selectedLetters: [...this.selectedLetters],
      progress: Utils.calculatePercentage(this.currentQuestion, this.totalQuestions)
    };
  }

  /**
   * Cleanup game resources
   */
  cleanup() {
    // Remove event listeners using the stable bound methods
    const saveBtn = document.getElementById('save-btn');
    const nextBtn = document.getElementById('next-btn');
    const scoreBtn = document.getElementById('score-btn');

    if (saveBtn) {
      saveBtn.removeEventListener('click', this._handleSaveAnswer);
    }
    if (nextBtn) {
      nextBtn.removeEventListener('click', this._handleNextQuestion);
    }
    if (scoreBtn) {
      scoreBtn.removeEventListener('click', this._handleShowScore);
    }

    // Clear slot event listeners
    this.letterSlots.forEach(slot => {
      slot.removeEventListener('click', this._handleSlotClick); // Use bound method for removal
    });

    // Remove letter button event listeners if they are dynamically added and persist
    // (This part is tricky if buttons are re-created, but for clarity, ensure cleanup)
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(button => {
        button.removeEventListener('click', this._handleLetterClick); // Use bound method for removal
    });


    console.log('Game manager cleaned up');
  }
}

// === EXPORT FOR MODULE SYSTEMS ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameManager;
}