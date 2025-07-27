/**
 * Score Manager
 * Handles score display, statistics, and high scores
 */

class ScoreManager {
  constructor() {
    this.audioManager = new AudioManager();
    this.gameStats = null;
    this.categoryData = null;
    this.achievements = [];
    
    // Bind methods
    this.handleBackClick = this.handleBackClick.bind(this);
    this.handleRestartClick = this.handleRestartClick.bind(this);
    this.handleToggleStats = this.handleToggleStats.bind(this);
  }

  /**
   * Initialize score manager
   * @returns {Promise<boolean>} - Success status
   */
  async init() {
    try {
      this.showLoading(MESSAGES.LOADING.score);
      
      await this.audioManager.init();
      await this.audioManager.changeBGM('score');
      
      await this.loadGameData();
      await this.displayScore();
      await this.setupEventListeners();
      
      this.hideLoading();
      return true;
    } catch (error) {
      console.error('Score manager initialization failed:', error);
      this.showError(MESSAGES.ERRORS.loadFailed);
      return false;
    }
  }

  /**
   * Load game data and statistics
   */
  async loadGameData() {
    // Get basic score data
    const score = Utils.getStorageItem(CONFIG.STORAGE_KEYS.SCORE, 0);
    const totalQuestions = Utils.getStorageItem(CONFIG.STORAGE_KEYS.TOTAL_QUESTIONS, 0);
    
    // Get detailed game statistics
    this.gameStats = Utils.getStorageItem('game_stats', {
      score,
      totalQuestions,
      percentage: Utils.calculatePercentage(score, totalQuestions),
      category: Utils.getGameCategory(),
      totalTime: 0,
      averageTime: 0,
      questionTimes: [],
      completedAt: new Date().toISOString()
    });

    // Get category data
    this.categoryData = GAME_DATA[this.gameStats.category];
    
    if (!this.categoryData) {
      throw new Error(`Invalid category: ${this.gameStats.category}`);
    }

    // Calculate achievements
    this.calculateAchievements();
    
    console.log('Loaded game stats:', this.gameStats);
  }

  /**
   * Display score and statistics
   */
  async displayScore() {
    await this.animateScoreDisplay();
    await this.displayScoreMessage();
    await this.updateProgressBar();
    await this.setupDetailedStats();
    await this.displayHighScores();
  }

  /**
   * Animate score display with counting effect
   */
  async animateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return;

    const { score, totalQuestions, percentage } = this.gameStats;
    
    // Start with 0 and animate to final score
    let currentScore = 0;
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();

    return new Promise(resolve => {
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        currentScore = Math.floor(score * easeProgress);
        
        const currentPercentage = Utils.calculatePercentage(currentScore, totalQuestions);
        
        scoreDisplay.textContent = `Skor Anda: ${currentScore} dari ${totalQuestions} (${currentPercentage}%)`;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          scoreDisplay.textContent = `Skor Anda: ${score} dari ${totalQuestions} (${percentage}%)`;
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  /**
   * Display appropriate score message
   */
  async displayScoreMessage() {
    const messageElement = document.getElementById('score-message');
    if (!messageElement) return;

    const message = Utils.getScoreMessage(this.gameStats.percentage);
    
    // Add fade-in animation
    messageElement.style.opacity = '0';
    messageElement.textContent = message;
    
    await Utils.delay(500);
    
    messageElement.style.transition = 'opacity 0.5s ease';
    messageElement.style.opacity = '1';
  }

  /**
   * Update progress bar animation
   */
  async updateProgressBar() {
    const progressFill = document.getElementById('score-fill');
    if (!progressFill) return;

    await Utils.delay(200);
    
    progressFill.style.width = `${this.gameStats.percentage}%`;
    
    // Add color based on performance
    if (this.gameStats.percentage >= SCORE_THRESHOLDS.EXCELLENT) {
      progressFill.style.background = 'linear-gradient(90deg, #2ed573, #27ae60)';
    } else if (this.gameStats.percentage >= SCORE_THRESHOLDS.GOOD) {
      progressFill.style.background = 'linear-gradient(90deg, #4ecdc4, #45b7d1)';
    } else if (this.gameStats.percentage >= SCORE_THRESHOLDS.AVERAGE) {
      progressFill.style.background = 'linear-gradient(90deg, #ffa726, #ff9800)';
    } else {
      progressFill.style.background = 'linear-gradient(90deg, #ff4757, #ff3742)';
    }
  }

  /**
   * Setup detailed statistics display
   */
  async setupDetailedStats() {
    const categoryElement = document.getElementById('stat-category');
    const timeElement = document.getElementById('stat-time');
    const avgTimeElement = document.getElementById('stat-avg-time');
    const accuracyElement = document.getElementById('stat-accuracy');

    if (!categoryElement) return;

    // Category
    categoryElement.textContent = this.categoryData.title.split(' - ')[1] || this.gameStats.category;

    // Total time
    if (this.gameStats.totalTime > 0) {
      const minutes = Math.floor(this.gameStats.totalTime / 60000);
      const seconds = Math.floor((this.gameStats.totalTime % 60000) / 1000);
      timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeElement.textContent = 'N/A';
    }

    // Average time per question
    if (this.gameStats.averageTime > 0) {
      const avgSeconds = Math.floor(this.gameStats.averageTime / 1000);
      avgTimeElement.textContent = `${avgSeconds}s`;
    } else {
      avgTimeElement.textContent = 'N/A';
    }

    // Accuracy
    accuracyElement.textContent = `${this.gameStats.percentage}%`;

    // Setup achievements
    await this.displayAchievements();
  }

  /**
   * Calculate achievements based on performance
   */
  calculateAchievements() {
    this.achievements = [];

    const { score, totalQuestions, percentage, totalTime } = this.gameStats;

    // Perfect score achievement
    if (score === totalQuestions) {
      this.achievements.push({
        id: 'perfect',
        title: 'Sempurna!',
        description: 'Menjawab semua soal dengan benar',
        icon: '🌟',
        rarity: 'legendary'
      });
    }

    // High score achievements
    if (percentage >= SCORE_THRESHOLDS.EXCELLENT) {
      this.achievements.push({
        id: 'excellent',
        title: 'Luar Biasa!',
        description: 'Mencapai skor 90% atau lebih',
        icon: '🏆',
        rarity: 'epic'
      });
    } else if (percentage >= SCORE_THRESHOLDS.GOOD) {
      this.achievements.push({
        id: 'good',
        title: 'Hebat!',
        description: 'Mencapai skor 70% atau lebih',
        icon: '🥇',
        rarity: 'rare'
      });
    }

    // Speed achievements (if time data available)
    if (totalTime > 0 && totalTime < 60000) { // Less than 1 minute
      this.achievements.push({
        id: 'speed',
        title: 'Kilat!',
        description: 'Menyelesaikan permainan dalam waktu kurang dari 1 menit',
        icon: '⚡',
        rarity: 'rare'
      });
    }

    // First time achievement
    const categoryScores = Utils.getStorageItem(CONFIG.STORAGE_KEYS.HIGH_SCORES, {});
    if (!categoryScores[this.gameStats.category] || categoryScores[this.gameStats.category].length <= 1) {
      this.achievements.push({
        id: 'first_time',
        title: 'Pemula!',
        description: `Pertama kali bermain kategori ${this.categoryData.title.split(' - ')[1]}`,
        icon: '🎯',
        rarity: 'common'
      });
    }

    // Improvement achievement
    if (categoryScores[this.gameStats.category] && categoryScores[this.gameStats.category].length > 1) {
      const previousBest = categoryScores[this.gameStats.category][1]; // Second best score
      if (score > previousBest.score) {
        this.achievements.push({
          id: 'improvement',
          title: 'Berkembang!',
          description: 'Meningkatkan skor terbaik sebelumnya',
          icon: '📈',
          rarity: 'uncommon'
        });
      }
    }
  }

  /**
   * Display achievements
   */
  async displayAchievements() {
    const badgeContainer = document.getElementById('badge-container');
    if (!badgeContainer || this.achievements.length === 0) {
      const achievementsSection = document.getElementById('achievements');
      if (achievementsSection) {
        achievementsSection.style.display = 'none';
      }
      return;
    }

    badgeContainer.innerHTML = '';

    this.achievements.forEach((achievement, index) => {
      const badge = document.createElement('div');
      badge.className = `achievement-badge ${achievement.rarity}`;
      badge.innerHTML = `
        <div class="badge-icon">${achievement.icon}</div>
        <div class="badge-info">
          <div class="badge-title">${achievement.title}</div>
          <div class="badge-description">${achievement.description}</div>
        </div>
      `;

      // Add entrance animation
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(20px)';
      
      badgeContainer.appendChild(badge);

      // Animate in with delay
      setTimeout(() => {
        badge.style.transition = 'all 0.5s ease';
        badge.style.opacity = '1';
        badge.style.transform = 'translateY(0)';
      }, index * 200);
    });
  }

  /**
   * Display high scores for current category
   */
  async displayHighScores() {
    const highScoresList = document.getElementById('high-scores-list');
    const highScoresSection = document.getElementById('high-scores');
    
    if (!highScoresList || !highScoresSection) return;

    const allHighScores = Utils.getStorageItem(CONFIG.STORAGE_KEYS.HIGH_SCORES, {});
    const categoryScores = allHighScores[this.gameStats.category] || [];

    if (categoryScores.length === 0) {
      highScoresSection.style.display = 'none';
      return;
    }

    highScoresList.innerHTML = '';

    categoryScores.slice(0, 5).forEach((scoreData, index) => {
      const scoreItem = document.createElement('div');
      scoreItem.className = 'high-score-item';
      
      const date = new Date(scoreData.date).toLocaleDateString('id-ID');
      const timeDisplay = scoreData.totalTime ? 
        `${Math.floor(scoreData.totalTime / 60000)}:${Math.floor((scoreData.totalTime % 60000) / 1000).toString().padStart(2, '0')}` : 
        'N/A';

      scoreItem.innerHTML = `
        <div class="score-rank">#${index + 1}</div>
        <div class="score-details">
          <div class="score-points">${scoreData.score} poin (${scoreData.percentage}%)</div>
          <div class="score-meta">
            <span class="score-date">${date}</span>
            <span class="score-time">${timeDisplay}</span>
          </div>
        </div>
        ${index === 0 ? '<div class="score-crown">👑</div>' : ''}
      `;

      // Highlight current score if it matches
      if (scoreData.score === this.gameStats.score && 
          Math.abs(new Date(scoreData.date) - new Date(this.gameStats.completedAt)) < 5000) {
        scoreItem.classList.add('current-score');
      }

      highScoresList.appendChild(scoreItem);
    });
  }

  /**
   * Setup event listeners
   */
  async setupEventListeners() {
    const backBtn = document.querySelector('.back-link');
    const restartBtn = document.getElementById('restart-btn');
    const toggleStatsBtn = document.getElementById('toggle-stats');

    if (backBtn) {
      backBtn.addEventListener('click', this.handleBackClick);
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', this.handleRestartClick);
    }

    if (toggleStatsBtn) {
      toggleStatsBtn.addEventListener('click', this.handleToggleStats);
    }
  }

  /**
   * Handle back to home click
   */
  async handleBackClick(event) {
    event.preventDefault();
    
    if (this.audioManager) {
      this.audioManager.play('back');
    }

    this.showLoading('Kembali ke beranda...');
    
    await Utils.delay(CONFIG.TRANSITION_DELAY);
    window.location.href = 'index.html';
  }

  /**
   * Handle restart game click
   */
  async handleRestartClick(event) {
    event.preventDefault();
    
    if (this.audioManager) {
      this.audioManager.play('restart');
    }

    const category = this.gameStats.category || 'fruits';
    
    this.showLoading('Memulai permainan baru...');
    
    await Utils.delay(CONFIG.TRANSITION_DELAY);
    window.location.href = `game.html?category=${category}`;
  }

  /**
   * Handle toggle statistics display
   */
  handleToggleStats(event) {
    const detailedStats = document.getElementById('detailed-stats');
    const toggleBtn = event.currentTarget;
    
    if (!detailedStats) return;

    const isHidden = detailedStats.classList.contains('hidden');
    
    if (isHidden) {
      detailedStats.classList.remove('hidden');
      Utils.fadeIn(detailedStats, 300);
      toggleBtn.textContent = '📈 Sembunyikan Detail';
    } else {
      Utils.fadeOut(detailedStats, 300);
      toggleBtn.textContent = '📈 Lihat Detail Statistik';
    }

    if (this.audioManager) {
      this.audioManager.play('click');
    }
  }

  /**
   * Show loading overlay
   */
  showLoading(message = MESSAGES.LOADING.score) {
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
   */
  showError(message) {
    Utils.showError(message);
    this.hideLoading();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    const backBtn = document.querySelector('.back-link');
    const restartBtn = document.getElementById('restart-btn');
    const toggleStatsBtn = document.getElementById('toggle-stats');

    if (backBtn) {
      backBtn.removeEventListener('click', this.handleBackClick);
    }
    if (restartBtn) {
      restartBtn.removeEventListener('click', this.handleRestartClick);
    }
    if (toggleStatsBtn) {
      toggleStatsBtn.removeEventListener('click', this.handleToggleStats);
    }

    if (this.audioManager) {
      this.audioManager.cleanup();
    }

    console.log('Score manager cleaned up');
  }
}

// === INITIALIZATION ===
Utils.ready(async () => {
  try {
    window.scoreManager = new ScoreManager();
    const success = await window.scoreManager.init();
    
    if (!success) {
      console.error('Failed to initialize score manager');
    }
  } catch (error) {
    console.error('Score page initialization error:', error);
    Utils.showError('Terjadi kesalahan saat memuat halaman skor');
  }
});

// === CLEANUP ON PAGE UNLOAD ===
window.addEventListener('beforeunload', () => {
  if (window.scoreManager) {
    window.scoreManager.cleanup();
  }
});

// === EXPORT FOR MODULE SYSTEMS ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoreManager;
}