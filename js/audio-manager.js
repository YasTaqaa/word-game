
class AudioManager {
  constructor() {
    this.bgm = null;
    this.sounds = new Map();
    this.isInitialized = false;
    this.isEnabled = true;
    this.bgmEnabled = true;
    this.sfxEnabled = true;
    this.currentBGM = null;
    this.fadingOut = false;
    
    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleUserInteraction = this.handleUserInteraction.bind(this);
  }

  /**
   * Initialize audio system
   * @returns {Promise<boolean>} 
   */
  async init() {
    try {
      await this.loadUserSettings();
      await this.initializeBGM();
      await this.initializeSFX();
      this.setupEventListeners();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      return false;
    }
  }

  /**
   * Load user audio settings
   */
  async loadUserSettings() {
    try {
      const settings = Utils.getStorageItem(CONFIG.STORAGE_KEYS.SETTINGS, {});
      this.isEnabled = settings.audioEnabled !== false;
      this.bgmEnabled = settings.bgmEnabled !== false;
      this.sfxEnabled = settings.sfxEnabled !== false;
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  /**
   * Save user audio settings
   */
  saveUserSettings() {
    const settings = {
      audioEnabled: this.isEnabled,
      bgmEnabled: this.bgmEnabled,
      sfxEnabled: this.sfxEnabled
    };
    Utils.setStorageItem(CONFIG.STORAGE_KEYS.SETTINGS, settings);
  }

  /**
   * Initialize background music
   */
  async initializeBGM() {
    this.bgm = document.getElementById('bgm');
    if (!this.bgm || !this.isEnabled || !this.bgmEnabled) return;

    try {
      this.bgm.volume = CONFIG.BGM_VOLUME;
      this.bgm.loop = true;
      this.bgm.preload = 'auto';

      await this.attemptAutoplay();
    } catch (error) {
      console.log('BGM autoplay blocked, waiting for user interaction');
      this.setupInteractionTriggers();
    }
  }

  /**
   * Attempt to autoplay BGM
   */
  async attemptAutoplay() {
    if (!this.bgm || !this.bgmEnabled) return;

    try {
      await this.bgm.play();
      console.log('BGM started successfully');
    } catch (error) {
      throw new Error('Autoplay blocked');
    }
  }

  /**
   * Setup interaction triggers for audio
   */
  setupInteractionTriggers() {
    const events = ['click', 'touchstart', 'keydown', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleUserInteraction, { 
        once: true, 
        passive: true 
      });
    });
  }

  /**
   * Handle user interaction to start audio
   */
  async handleUserInteraction() {
    if (!this.bgm || this.isInitialized) return;

    try {
      await this.bgm.play();
      console.log('BGM started after user interaction');
      this.isInitialized = true; 
    } catch (error) {
      console.warn('Failed to start BGM:', error);
    }
  }

  /**
   * Initialize sound effects
   */
  async initializeSFX() {
    if (!this.isEnabled || !this.sfxEnabled) return;

    const loadPromises = Object.entries(AUDIO_CONFIG.SFX_SOURCES).map(
      async ([key, src]) => {
        try {
          const audio = new Audio();
          audio.volume = CONFIG.SFX_VOLUME;
          audio.preload = 'auto';
          
          await new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            audio.addEventListener('error', (e) => {
                console.error(`Error loading audio source "${src}":`, e);
                reject(new Error(`Failed to load audio: ${src}`));
            }, { once: true });
            
            setTimeout(() => reject(new Error('Audio load timeout')), 5000);
            
            audio.src = src; 
            audio.load(); 
          });
          
          this.sounds.set(key, audio); 
          console.log(`Loaded SFX: ${key}`);
        } catch (error) {
          console.warn(`Failed to load SFX ${key}:`, error.message); 
        }
      }
    );

    await Promise.allSettled(loadPromises); 
    console.log(`Loaded ${this.sounds.size} sound effects`);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Setup retry mechanism for BGM
    this.setupBGMRetry();
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (!this.bgm || !this.bgmEnabled) return;

    if (document.hidden) {
      // Page is hidden, pause BGM
      if (!this.bgm.paused) {
        this.bgm.pause();
      }
    } else {
      // Page is visible, resume BGM
      if (this.bgm.paused && this.isInitialized) {
        this.bgm.play().catch(error => {
          console.warn('Failed to resume BGM:', error);
        });
      }
    }
  }

  /**
   * Setup BGM retry mechanism
   */
  setupBGMRetry() {
    let retryCount = 0;
    const maxRetries = CONFIG.RETRY_ATTEMPTS;
    
    // Clear any previous interval to prevent multiple retries
    if (this._bgmRetryInterval) {
        clearInterval(this._bgmRetryInterval);
    }

    this._bgmRetryInterval = setInterval(() => { 
      if (!this.bgm || !this.bgmEnabled || retryCount >= maxRetries) {
        clearInterval(this._bgmRetryInterval);
        this._bgmRetryInterval = null;
        return;
      }

      if (this.bgm.paused && this.isInitialized) { 
        this.bgm.play().catch(() => {
        });
        retryCount++;
      } else if (!this.bgm.paused) {
        clearInterval(this._bgmRetryInterval);
        this._bgmRetryInterval = null;
      }
    }, CONFIG.AUDIO_RETRY_INTERVAL);
  }

  /**
   * Play sound effect
   * @param {string} soundName 
   * @param {number} volume 
   */
  play(soundName, volume = null) {
    if (!this.isEnabled || !this.sfxEnabled) return;

    const sound = this.sounds.get(soundName);
    if (!sound) {
      console.warn(`Sound '${soundName}' not found or failed to load. Cannot play.`); 
      return;
    }

    try {
      // Ensure BGM continues playing
      this.ensureBGMPlaying();
      
      // Create a clone to allow overlapping sounds
      const soundClone = sound.cloneNode();
      soundClone.volume = volume !== null ? volume : sound.volume;
      
      // Play the sound
      const playPromise = soundClone.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Failed to play sound '${soundName}':`, error);
        });
      }
    } catch (error) {
      console.warn(`Error playing sound '${soundName}':`, error);
    }
  }

  /**
   * Ensure BGM continues playing
   */
  ensureBGMPlaying() {
    if (this.bgm && this.bgmEnabled && this.bgm.paused && this.isInitialized) {
      this.bgm.play().catch(() => {
        // Silent fail
      });
    }
  }

  /**
   * Change background music
   * @param {string} bgmType 
   */
  async changeBGM(bgmType) {
    if (!this.isEnabled || !this.bgmEnabled) return;

    const bgmSource = AUDIO_CONFIG.BGM_SOURCES[bgmType];
    if (!bgmSource) {
      console.warn(`BGM type '${bgmType}' not found in AUDIO_CONFIG.BGM_SOURCES`);
      return;
    }

    // Don't change if already playing the same BGM
    if (this.currentBGM === bgmType && !this.bgm.paused) return; 

    try {
      // Fade out current BGM
      if (this.bgm && !this.bgm.paused) {
        await this.fadeBGM(false);
      }

      // Change source and play new BGM
      this.bgm.src = bgmSource;
      this.bgm.load(); 
      
      await this.bgm.play();
      await this.fadeBGM(true);
      
      this.currentBGM = bgmType;
      console.log(`Changed BGM to: ${bgmType}`);
    } catch (error) {
      console.warn(`Failed to change BGM to ${bgmType}:`, error);
    }
  }

  /**
   * Fade BGM in or out
   * @param {boolean} fadeIn 
   * @param {number} duration 
   */
  async fadeBGM(fadeIn, duration = CONFIG.AUDIO_FADE_DURATION) {
    if (!this.bgm || this.fadingOut) return;

    this.fadingOut = true;
    const targetVolume = fadeIn ? CONFIG.BGM_VOLUME : 0;
    const startVolume = this.bgm.volume;
    const volumeChange = targetVolume - startVolume;
    
    const startTime = performance.now();

    return new Promise(resolve => {
      const fadeStep = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.bgm.volume = startVolume + (volumeChange * progress);
        
        if (progress < 1) {
          requestAnimationFrame(fadeStep);
        } else {
          if (!fadeIn) {
            this.bgm.pause();
            this.bgm.currentTime = 0; 
          }
          this.fadingOut = false; 
          resolve();
        }
      };
      
      requestAnimationFrame(fadeStep);
    });
  }

  /**
   * Toggle audio on/off
   * @param {boolean} enabled 
   */
  toggleAudio(enabled) {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.stopAllAudio();
    } else if (this.bgmEnabled) {
      this.resumeBGM();
    }
    
    this.saveUserSettings();
  }

  /**
   * Toggle BGM on/off
   * @param {boolean} enabled 
   */
  toggleBGM(enabled) {
    this.bgmEnabled = enabled;
    
    if (enabled && this.isEnabled) {
      this.resumeBGM();
    } else {
      this.stopBGM();
    }
    
    this.saveUserSettings();
  }

  /**
   * Toggle SFX on/off
   * @param {boolean} enabled 
   */
  toggleSFX(enabled) {
    this.sfxEnabled = enabled;
    this.saveUserSettings();
  }

  /**
   * Resume BGM playback
   */
  resumeBGM() {
    if (this.bgm && this.bgmEnabled && this.isEnabled) {
      this.bgm.play().catch(error => {
        console.warn('Failed to resume BGM:', error);
      });
    }
  }

  /**
   * Stop BGM playback
   */
  stopBGM() {
    if (this.bgm && !this.bgm.paused) {
      this.bgm.pause();
    }
  }

  /**
   * Stop all audio
   */
  stopAllAudio() {
    this.stopBGM();
  }

  /**
   * Get current audio status
   * @returns {Object} 
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      enabled: this.isEnabled,
      bgmEnabled: this.bgmEnabled,
      sfxEnabled: this.sfxEnabled,
      bgmPlaying: this.bgm && !this.bgm.paused,
      currentBGM: this.currentBGM,
      soundsLoaded: this.sounds.size
    };
  }

  /**
   * Cleanup audio resources
   */
  cleanup() {
    this.stopAllAudio();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Clear SFX retry interval if it exists
    if (this._bgmRetryInterval) {
        clearInterval(this._bgmRetryInterval);
        this._bgmRetryInterval = null;
    }

    // Clear sound cache
    this.sounds.clear();
    
    console.log('Audio manager cleaned up');
  }
}

// === EXPORT FOR MODULE SYSTEMS ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager;
}