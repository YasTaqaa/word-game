// === DASHBOARD MANAGER ===
class DashboardManager {
  constructor() {
    this.audioManager = new AudioManager();
    this.currentScreen = 'start';
    
    // Bind methods
    this.handleStartGame = this.handleStartGame.bind(this);
    this.handleCategorySelect = this.handleCategorySelect.bind(this);
  }

  /**
   * Initialize dashboard
   * @returns {Promise<boolean>} 
   */
  async init() {
    try {
      await this.audioManager.init();
      await this.audioManager.changeBGM('menu');
      
      this.setupEventListeners();
      this.preloadGameAssets();
      
      return true;
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      return false;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const startGameBtn = document.querySelector('.start-game-button');
    const categoryButtons = document.querySelectorAll('.category-btn');

    if (startGameBtn) {
      startGameBtn.addEventListener('click', this.handleStartGame);
    }

    categoryButtons.forEach(button => {
      button.addEventListener('click', this.handleCategorySelect);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && this.currentScreen === 'start') {
        this.handleStartGame();
      }
    });
  }

  async handleStartGame(event) {
    if (event) event.preventDefault();

    if (this.audioManager) {
      this.audioManager.play('start');
    }

    // Hide start screen
    const startScreen = document.getElementById('start-screen');
    const categorySection = document.getElementById('category-selection');
    const subtitles = document.querySelectorAll('.big-subtitle');

    if (startScreen && categorySection) {
      // Fade out start screen
      Utils.fadeOut(startScreen, 300);
      
      // Hide subtitles
      subtitles.forEach(subtitle => {
        Utils.fadeOut(subtitle, 200);
      });

      // Wait for fade out, then show category selection
      await Utils.delay(350);
      
      startScreen.style.display = 'none';
      categorySection.classList.remove('hidden');
      
      // Fade in category selection
      Utils.fadeIn(categorySection, 400);
      
      this.currentScreen = 'category';
      
      // Add entrance animations to category buttons
      this.animateCategoryButtons();
    }
  }

  animateCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach((button, index) => {
      button.style.opacity = '0';
      button.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        button.style.transition = 'all 0.5s ease';
        button.style.opacity = '1';
        button.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  async handleCategorySelect(event) {
    if (event) event.preventDefault();

    const button = event.currentTarget;
    const category = button.dataset.category;

    if (!category || !GAME_DATA[category]) {
      Utils.showError('Kategori tidak valid');
      return;
    }

    if (this.audioManager) {
      this.audioManager.play('click');
    }

    // Add selection animation
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 150);

    // Show loading
    this.showLoading(`Memuat permainan ${GAME_DATA[category].title.split(' - ')[1]}...`);

    // Save category choice
    Utils.setStorageItem(CONFIG.STORAGE_KEYS.CATEGORY, category);

    // Navigate to game
    await Utils.delay(CONFIG.TRANSITION_DELAY);
    window.location.href = `game.html?category=${category}`;
  }


  async preloadGameAssets() {
    try {
      const criticalImages = [
        'images/bgutama.jpg',
        'images/bghewan.jpg',
        'images/bgbuah.png',
        'images/bgsayur.jpg',
        'images/bghari.png',
        'images/bggreetings.jpg'
      ];

      await Utils.preloadImages(criticalImages);
      console.log('Critical images preloaded');
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }

  showLoading(message = 'Memuat...') {
    const existingLoading = document.getElementById('loading');
    
    if (existingLoading) {
      existingLoading.querySelector('p').textContent = message;
      existingLoading.classList.remove('hidden');
      Utils.fadeIn(existingLoading, 200);
      return;
    }

    // Create loading overlay if it doesn't exist
    const loading = Utils.createSpinner(message);
    loading.id = 'loading';
    document.body.appendChild(loading);
    
    Utils.fadeIn(loading, 200);
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
   * Get current dashboard state
   */
  getCurrentState() {
    return {
      currentScreen: this.currentScreen,
      audioEnabled: this.audioManager ? this.audioManager.getStatus().enabled : false
    };
  }

  /**
   * Cleanup dashboard resources
   */
  cleanup() {
    const startGameBtn = document.querySelector('.start-game-button');
    const categoryButtons = document.querySelectorAll('.category-btn');

    if (startGameBtn) {
      startGameBtn.removeEventListener('click', this.handleStartGame);
    }

    categoryButtons.forEach(button => {
      button.removeEventListener('click', this.handleCategorySelect);
    });

    if (this.audioManager) {
      this.audioManager.cleanup();
    }

    console.log('Dashboard cleaned up');
  }
}

// === INITIALIZATION ===
Utils.ready(async () => {
  try {
    window.dashboardManager = new DashboardManager();
    const success = await window.dashboardManager.init();
    
    if (!success) {
      console.error('Failed to initialize dashboard');
      Utils.showError('Gagal memuat halaman utama');
    }
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    Utils.showError('Terjadi kesalahan saat memuat halaman');
  }
});

// === CLEANUP ON PAGE UNLOAD ===
window.addEventListener('beforeunload', () => {
  if (window.dashboardManager) {
    window.dashboardManager.cleanup();
  }
});

// === EXPORT FOR MODULE SYSTEMS ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardManager;
}