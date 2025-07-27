/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

class Utils {
  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array copy
   */
  static shuffleArray(array) {
    if (!Array.isArray(array)) {
      console.warn('shuffleArray: Expected array, got', typeof array);
      return [];
    }
    
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get game category from URL params or session storage
   * @returns {string} - Game category
   */
  static getGameCategory() {
    try {
      // First try URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const categoryFromUrl = urlParams.get('category');
      
      if (categoryFromUrl && GAME_DATA[categoryFromUrl]) {
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.CATEGORY, categoryFromUrl);
        return categoryFromUrl;
      }

      // Then try session storage
      const categoryFromStorage = sessionStorage.getItem(CONFIG.STORAGE_KEYS.CATEGORY);
      if (categoryFromStorage && GAME_DATA[categoryFromStorage]) {
        return categoryFromStorage;
      }

      // Default fallback
      const defaultCategory = 'fruits';
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.CATEGORY, defaultCategory);
      return defaultCategory;
    } catch (error) {
      console.error('Error getting game category:', error);
      return 'fruits';
    }
  }

  /**
   * Create a delay/sleep function
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} - Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} - Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Safely parse JSON from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if parsing fails
   * @returns {*} - Parsed value or default
   */
  static getStorageItem(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error parsing storage item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Safely set JSON to storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} - Success status
   */
  static setStorageItem(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error setting storage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove spaces from string (for answer comparison)
   * @param {string} str - String to process
   * @returns {string} - String without spaces
   */
  static removeSpaces(str) {
    return typeof str === 'string' ? str.replace(/\s+/g, '') : '';
  }

  /**
   * Calculate percentage with precision
   * @param {number} value - Current value
   * @param {number} total - Total value
   * @param {number} precision - Decimal places
   * @returns {number} - Percentage
   */
  static calculatePercentage(value, total, precision = 1) {
    if (total === 0) return 0;
    return Number(((value / total) * 100).toFixed(precision));
  }

  /**
   * Get score message based on percentage
   * @param {number} percentage - Score percentage
   * @returns {string} - Appropriate message
   */
  static getScoreMessage(percentage) {
    if (percentage >= SCORE_THRESHOLDS.EXCELLENT) {
      return MESSAGES.SCORE.excellent;
    } else if (percentage >= SCORE_THRESHOLDS.GOOD) {
      return MESSAGES.SCORE.good;
    } else if (percentage >= SCORE_THRESHOLDS.AVERAGE) {
      return MESSAGES.SCORE.average;
    } else {
      return MESSAGES.SCORE.needsImprovement;
    }
  }

  /**
   * Animate number counting
   * @param {HTMLElement} element - Element to animate
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} duration - Animation duration
   * @param {Function} callback - Callback when complete
   */
  static animateNumber(element, start, end, duration, callback) {
    if (!element) return;

    const startTime = performance.now();
    const difference = end - start;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (difference * easeProgress));
      
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = end;
        if (callback) callback();
      }
    };

    requestAnimationFrame(step);
  }

  /**
   * Preload images for better performance
   * @param {Array} imagePaths - Array of image paths
   * @returns {Promise} - Promise that resolves when all images loaded
   */
  static preloadImages(imagePaths) {
    const promises = imagePaths.map(path => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${path}`));
        img.src = path;
      });
    });

    return Promise.allSettled(promises);
  }

  /**
   * Check if device is mobile
   * @returns {boolean} - True if mobile device
   */
  static isMobileDevice() {
    return window.innerWidth <= CONFIG.MOBILE_BREAKPOINT || 
           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if device supports touch
   * @returns {boolean} - True if touch supported
   */
  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Generate unique ID
   * @param {string} prefix - ID prefix
   * @returns {string} - Unique ID
   */
  static generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format time duration
   * @param {number} seconds - Duration in seconds
   * @returns {string} - Formatted time string
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clamp number between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Clamped value
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Add CSS class with animation support
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class to add
   * @param {number} delay - Delay before adding class
   */
  static addClassWithDelay(element, className, delay = 0) {
    if (!element) return;
    
    setTimeout(() => {
      element.classList.add(className);
    }, delay);
  }

  /**
   * Remove CSS class with animation support
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class to remove
   * @param {number} delay - Delay before removing class
   */
  static removeClassWithDelay(element, className, delay = 0) {
    if (!element) return;
    
    setTimeout(() => {
      element.classList.remove(className);
    }, delay);
  }

  /**
   * Show element with fade in animation
   * @param {HTMLElement} element - Element to show
   * @param {number} duration - Animation duration
   */
  static fadeIn(element, duration = 300) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.display = 'block';
    element.classList.remove('hidden');
    
    const start = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Hide element with fade out animation
   * @param {HTMLElement} element - Element to hide
   * @param {number} duration - Animation duration
   */
  static fadeOut(element, duration = 300) {
    if (!element) return;
    
    const start = performance.now();
    const initialOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = initialOpacity * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        element.classList.add('hidden');
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Create loading spinner element
   * @param {string} message - Loading message
   * @returns {HTMLElement} - Spinner element
   */
  static createSpinner(message = 'Loading...') {
    const spinner = document.createElement('div');
    spinner.className = 'loading-overlay';
    spinner.innerHTML = `
      <div class="spinner"></div>
      <p>${message}</p>
    `;
    return spinner;
  }

  /**
   * Show error message to user
   * @param {string} message - Error message
   * @param {number} duration - How long to show message
   */
  static showError(message, duration = 3000) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4757;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
    `;
    
    document.body.appendChild(errorDiv);
    
    // Fade in
    Utils.fadeIn(errorDiv, 200);
    
    // Auto remove
    setTimeout(() => {
      Utils.fadeOut(errorDiv, 200);
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 200);
    }, duration);
  }

  /**
   * Show success message to user
   * @param {string} message - Success message
   * @param {number} duration - How long to show message
   */
  static showSuccess(message, duration = 2000) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2ed573;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(46, 213, 115, 0.3);
    `;
    
    document.body.appendChild(successDiv);
    
    // Fade in
    Utils.fadeIn(successDiv, 200);
    
    // Auto remove
    setTimeout(() => {
      Utils.fadeOut(successDiv, 200);
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.parentNode.removeChild(successDiv);
        }
      }, 200);
    }, duration);
  }

  /**
   * Validate if string is a valid answer format
   * @param {string} answer - Answer to validate
   * @returns {boolean} - True if valid
   */
  static isValidAnswer(answer) {
    return typeof answer === 'string' && 
           answer.length > 0 && 
           /^[A-Z\s]+$/.test(answer);
  }

  /**
   * Get random items from array
   * @param {Array} array - Source array
   * @param {number} count - Number of items to get
   * @returns {Array} - Random items
   */
  static getRandomItems(array, count) {
    if (!Array.isArray(array) || count <= 0) return [];
    const shuffled = Utils.shuffleArray(array);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Check if element is in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} - True if in viewport
   */
  static isInViewport(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Smooth scroll to element
   * @param {HTMLElement} element - Target element
   * @param {number} offset - Offset from top
   */
  static scrollToElement(element, offset = 0) {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

// === DOM READY UTILITY ===
Utils.ready = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

// === EXPORT FOR MODULE SYSTEMS ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}