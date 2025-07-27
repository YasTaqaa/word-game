
// === GAME CONFIGURATION ===
const CONFIG = {
  // Game Settings
  QUESTIONS_PER_GAME: 5,
  MIN_QUESTIONS_REQUIRED: 3,
  
  // Audio Settings
  BGM_VOLUME: 0.3,
  SFX_VOLUME: 0.7,
  AUDIO_FADE_DURATION: 500,
  
  // Performance Settings
  RETRY_ATTEMPTS: 5,
  AUDIO_RETRY_INTERVAL: 2000,
  LOADING_DELAY: 300,
  TRANSITION_DELAY: 600,
  
  // Animation Settings
  SCORE_ANIMATION_SPEED: 40,
  PROGRESS_ANIMATION_DURATION: 800,
  
  // UI Settings
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  
  // Storage Keys
  STORAGE_KEYS: {
    CATEGORY: 'word_game_category',
    SCORE: 'word_game_score',
    TOTAL_QUESTIONS: 'word_game_total',
    HIGH_SCORES: 'word_game_high_scores',
    SETTINGS: 'word_game_settings'
  }
};

// === GAME DATA ===
const GAME_DATA = {
  fruits: {
    title: '🍎 Game Susun Kata - Fruits',
    background: 'fruits',
    icon: '🍎',
    questions: [
      { image: 'images/fruits/apple.jpg', answer: 'APPLE', translation: 'Apel', difficulty: 1 },
      { image: 'images/fruits/banana.jpg', answer: 'BANANA', translation: 'Pisang', difficulty: 1 },
      { image: 'images/fruits/grape.jpg', answer: 'GRAPE', translation: 'Anggur', difficulty: 1 },
      { image: 'images/fruits/melon.jpg', answer: 'MELON', translation: 'Melon', difficulty: 1 },
      { image: 'images/fruits/orange.jpg', answer: 'ORANGE', translation: 'Jeruk', difficulty: 2 },
      { image: 'images/fruits/coconut.jpg', answer: 'COCONUT', translation: 'Kelapa', difficulty: 2 },
      { image: 'images/fruits/pineapple.jpg', answer: 'PINEAPPLE', translation: 'Nanas', difficulty: 3 },
      { image: 'images/fruits/watermelon.jpg', answer: 'WATERMELON', translation: 'Semangka', difficulty: 3 },
      { image: 'images/fruits/guava.jpg', answer: 'GUAVA', translation: 'Jambu Biji', difficulty: 2 },
      { image: 'images/fruits/mango.jpg', answer: 'MANGO', translation: 'Mangga', difficulty: 1 }
    ]
  },
  
  animals: {
    title: '🐾 Game Susun Kata - Animals',
    background: 'animals',
    icon: '🐶',
    questions: [
      { image: 'images/animals/cat.jpg', answer: 'CAT', translation: 'Kucing', difficulty: 1 },
      { image: 'images/animals/dog.jpg', answer: 'DOG', translation: 'Anjing', difficulty: 1 },
      { image: 'images/animals/fish.jpg', answer: 'FISH', translation: 'Ikan', difficulty: 1 },
      { image: 'images/animals/bird.jpg', answer: 'BIRD', translation: 'Burung', difficulty: 1 },
      { image: 'images/animals/lion.jpg', answer: 'LION', translation: 'Singa', difficulty: 1 },
      { image: 'images/animals/tiger.jpg', answer: 'TIGER', translation: 'Harimau', difficulty: 2 },
      { image: 'images/animals/chicken.jpg', answer: 'CHICKEN', translation: 'Ayam', difficulty: 2 },
      { image: 'images/animals/duck.jpg', answer: 'DUCK', translation: 'Bebek', difficulty: 1 },
      { image: 'images/animals/elephant.jpg', answer: 'ELEPHANT', translation: 'Gajah', difficulty: 3 },
      { image: 'images/animals/rabbit.jpg', answer: 'RABBIT', translation: 'Kelinci', difficulty: 2 }
    ]
  },
  
  vegetables: {
    title: '🥦 Game Susun Kata - Vegetables',
    background: 'vegetables',
    icon: '🥕',
    questions: [
      { image: 'images/vegetables/carrot.jpg', answer: 'CARROT', translation: 'Wortel', difficulty: 2 },
      { image: 'images/vegetables/corn.jpg', answer: 'CORN', translation: 'Jagung', difficulty: 1 },
      { image: 'images/vegetables/cabbage.jpg', answer: 'CABBAGE', translation: 'Kubis', difficulty: 2 },
      { image: 'images/vegetables/onion.jpg', answer: 'ONION', translation: 'Bawang', difficulty: 2 },
      { image: 'images/vegetables/tomato.jpg', answer: 'TOMATO', translation: 'Tomat', difficulty: 2 },
      { image: 'images/vegetables/broccoli.jpg', answer: 'BROCCOLI', translation: 'Brokoli', difficulty: 3 },
      { image: 'images/vegetables/potato.jpg', answer: 'POTATO', translation: 'Kentang', difficulty: 2 },
      { image: 'images/vegetables/cucumber.jpg', answer: 'CUCUMBER', translation: 'Timun', difficulty: 3 },
      { image: 'images/vegetables/mushroom.jpg', answer: 'MUSHROOM', translation: 'Jamur', difficulty: 3 },
      { image: 'images/vegetables/spinach.jpg', answer: 'SPINACH', translation: 'Bayam', difficulty: 2 }
    ]
  },
  
  greetings: {
    title: '👋 Game Susun Kata - Greetings',
    background: 'greetings',
    icon: '👋',
    questions: [
      { image: 'images/greetings/good_morning.png', answer: 'GOOD MORNING', translation: 'Selamat pagi', difficulty: 2 },
      { image: 'images/greetings/good_afternoon.png', answer: 'GOOD AFTERNOON', translation: 'Selamat siang', difficulty: 3 },
      { image: 'images/greetings/good_evening.png', answer: 'GOOD EVENING', translation: 'Selamat sore', difficulty: 3 },
      { image: 'images/greetings/hello.png', answer: 'HELLO', translation: 'Halo', difficulty: 1 },
      { image: 'images/greetings/how_are_you.png', answer: 'HOW ARE YOU', translation: 'Apa kabar', difficulty: 3 }
    ] 
  },
  
  days: {
    title: '📅 Game Susun Kata - Days',
    background: 'days',
    icon: '📅',
    questions: [
      { image: 'images/days/monday.jpg', answer: 'MONDAY', translation: 'Senin', difficulty: 2 },
      { image: 'images/days/tuesday.jpg', answer: 'TUESDAY', translation: 'Selasa', difficulty: 2 },
      { image: 'images/days/wednesday.jpg', answer: 'WEDNESDAY', translation: 'Rabu', difficulty: 3 },
      { image: 'images/days/thursday.jpg', answer: 'THURSDAY', translation: 'Kamis', difficulty: 3 },
      { image: 'images/days/friday.jpg', answer: 'FRIDAY', translation: 'Jumat', difficulty: 2 },
      { image: 'images/days/saturday.jpg', answer: 'SATURDAY', translation: 'Sabtu', difficulty: 3 },
      { image: 'images/days/sunday.jpg', answer: 'SUNDAY', translation: 'Minggu', difficulty: 2 }
    ] 
  }
};

// === AUDIO CONFIGURATION ===
const AUDIO_CONFIG = {
  BGM_SOURCES: {
    menu: 'sounds/bgm/bgm_category.mp3',
    game: 'sounds/bgm/bgm_question.mp3',
    score: 'sounds/bgm/bgm_score.mp3'
  },
  
  SFX_SOURCES: {
    click: 'sounds/sfx/click.wav',
    undo: 'sounds/sfx/undo.wav',
    next: 'sounds/sfx/next.wav',
    correct: 'sounds/sfx/correct_answer.wav',
    wrong: 'sounds/sfx/wrong_answer.wav',
    start: 'sounds/sfx/start.wav',
    back: 'sounds/sfx/back.wav',
    restart: 'sounds/sfx/restart.wav',
    score: 'sounds/sfx/score.wav',
  }
};

// === UI MESSAGES ===
const MESSAGES = {
  LOADING: {
    game: 'Memuat permainan...',
    score: 'Menghitung skor...',
    audio: 'Memuat audio...'
  },
  
  FEEDBACK: {
    correct: '✅ Jawaban Benar!',
    wrong: '❌ Jawaban Salah!',
    incomplete: '⚠️ Jawaban belum lengkap',
    saved: 'Jawaban tersimpan'
  },
  
  SCORE: {
    excellent: '🎉 Luar biasa! Kamu sangat pintar!',
    good: '👍 Bagus sekali! Terus belajar!',
    average: '😊 Tidak buruk, coba lagi untuk hasil yang lebih baik!',
    needsImprovement: '💪 Jangan menyerah! Latihan membuat sempurna!'
  },
  
  ERRORS: {
    loadFailed: 'Gagal memuat data permainan',
    audioFailed: 'Audio tidak dapat diputar',
    networkError: 'Periksa koneksi internet Anda'
  }
};

// === SCORE THRESHOLDS ===
const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  AVERAGE: 50,
  NEEDS_IMPROVEMENT: 0
};

// === GAME STATES ===
const GAME_STATES = {
  LOADING: 'loading',
  READY: 'ready',
  PLAYING: 'playing',
  CHECKING: 'checking',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// === EXPORT FOR MODULE SYSTEMS (if needed) ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    GAME_DATA,
    AUDIO_CONFIG,
    MESSAGES,
    SCORE_THRESHOLDS,
    GAME_STATES
  };
}