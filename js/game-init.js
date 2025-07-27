// === GAME INITIALIZER ===

class GameInitializer {
  constructor() {
    this.audioManager = null;
    this.gameManager = null;
    this.initialized = false;
  }

  /**
   * Initialize the game application
   */
  async init() {
    try {
      console.log('Initializing game application...');
      
      // Initialize audio first
      this.audioManager = new AudioManager();
      await this.audioManager.init();
      await this.audioManager.changeBGM('game');
      
      // Make audio manager globally available
      window.audioManager = this.audioManager;
      
      // Initialize game manager
      this.gameManager = new GameManager();
      const gameSuccess = await this.gameManager.init();
      
      if (!gameSuccess) {
        throw new Error('Game manager initialization failed');
      }
      
      // Make game manager globally available for legacy compatibility
      window.gameManager = this.gameManager;
      this.setupGlobalFunctions();
      
      // Setup cleanup handlers
      this.setupCleanupHandlers();
      
      this.initialized = true;
      console.log('Game application initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Game initialization failed:', error);
      this.handleInitializationError(error);
      return false;
    }
  }

  /**
   * Setup global functions for backward compatibility
   */
  setupGlobalFunctions() {
    // Make game functions globally available for onclick handlers
    window.saveAnswer = () => {
      if (this.gameManager) {
        this.gameManager.handleSaveAnswer();
      }
    };

    window.nextQuestion = () => {
      if (this.gameManager) {
        this.gameManager.handleNextQuestion();
      }
    };

    window.showScore = () => {
      if (this.gameManager) {
        this.gameManager.handleShowScore();
      }
    };

    // Legacy audio function
    window.playSfx = (soundName) => {
      if (this.audioManager) {
        this.audioManager.play(soundName);
      }
    };
  }

  /**
   * Setup cleanup handlers
   */
  setupCleanupHandlers() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Cleanup on page visibility change (mobile apps)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, pause audio if needed
        if (this.audioManager) {
          // Audio manager handles this automatically
        }
      }
    });

    // Handle errors globally
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
      
      if (!this.initialized) {
        this.handleInitializationError(event.error);
      }
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (!this.initialized) {
        this.handleInitializationError(event.reason);
      }
    });
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    console.error('Handling initialization error:', error);
    
    // Hide loading overlay if present
    const loading = document.getElementById('loading');
    if (loading) {
      Utils.fadeOut(loading, 200);
    }
    
    // Show error message to user
    const errorMessage = this.getUserFriendlyErrorMessage(error);
    Utils.showError(errorMessage, 5000);
    
    // Provide fallback functionality
    this.setupFallbackMode();
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyErrorMessage(error) {
    if (error.message) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return MESSAGES.ERRORS.networkError;
      }
      if (error.message.includes('audio')) {
        return MESSAGES.ERRORS.audioFailed;
      }
    }
    
    return MESSAGES.ERRORS.loadFailed;
  }

  /**
   * Setup fallback mode when initialization fails
   */
  setupFallbackMode() {
    console.log('Setting up fallback mode...');
    
    // Disable audio
    window.audioManager = {
      play: () => {}, // No-op
      init: () => Promise.resolve(false),
      cleanup: () => {}
    };
    
    // Basic game functions without full functionality
    window.saveAnswer = () => {
      Utils.showError('Game tidak dapat dimuat dengan benar. Refresh halaman untuk mencoba lagi.');
    };
    
    window.nextQuestion = () => {
      Utils.showError('Game tidak dapat dimuat dengan benar. Refresh halaman untuk mencoba lagi.');
    };
    
    window.showScore = () => {
      window.location.href = 'index.html';
    };
    
    // Show retry button
    this.showRetryOption();
  }

  /**
   * Show retry option to user
   */
  showRetryOption() {
    const retryButton = document.createElement('button');
    retryButton.textContent = '🔄 Coba Lagi';
    retryButton.className = 'btn-base';
    retryButton.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      padding: 12px 24px;
      font-size: 16px;
    `;
    
    retryButton.addEventListener('click', () => {
      window.location.reload();
    });
    
    document.body.appendChild(retryButton);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (retryButton.parentNode) {
        retryButton.parentNode.removeChild(retryButton);
      }
    }, 10000);
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    console.log('Cleaning up game application...');
    
    if (this.gameManager) {
      this.gameManager.cleanup();
      this.gameManager = null;
    }
    
    if (this.audioManager) {
      this.audioManager.cleanup();
      this.audioManager = null;
    }
    
    // Clear global references
    window.audioManager = null;
    window.gameManager = null;
    window.saveAnswer = null;
    window.nextQuestion = null;
    window.showScore = null;
    window.playSfx = null;
    
    this.initialized = false;
    console.log('Game application cleanup complete');
  }

  /**
   * Get current application state
   */
  getState() {
    return {
      initialized: this.initialized,
      audioManager: this.audioManager ? this.audioManager.getStatus() : null,
      gameManager: this.gameManager ? this.gameManager.getGameState() : null
    };
  }
}

// === INITIALIZATION ===
Utils.ready(async () => {
  try {
    // Only initialize if we're on a game page
    if (document.getElementById('game')) {
      console.log('Game page detected, initializing...');
      
      window.gameInitializer = new GameInitializer();
      const success = await window.gameInitializer.init();
      
      if (!success) {
        console.error('Game initialization failed');
      }
    } else {
      console.log('Not a game page, skipping game initialization');
    }
  } catch (error) {
    console.error('Game initialization error:', error);
  }
});

// === EXPORT FOR MODULE SYSTEMS ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameInitializer;
}