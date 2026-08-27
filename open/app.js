/**
 * Raksha Bandhan Interactive Celebration Page Logic
 * Features:
 * - Dynamic customizable sharing via URL queries
 * - Full ambient audio synthesizer via Web Audio API replicating traditional bells/chimes
 * - Interactive Thali pooja rituals (Click/Drag on Desktop & Mobile)
 * - Canvas animations for starry backdrop and gift ribbon unwrapping confetti
 */

// Global State
const state = {
  // Ritual checklist
  diyaLit: false,
  tilakApplied: false,
  sweetFed: false,
  rakhiTied: false,

  // Selected item (click-to-perform support on mobile/touch)
  activeItem: null,

  // Photo data
  photoBase64: null,

  // Audio configuration
  audioContext: null,
  seqInterval: null,
  isAudioPlaying: false,
  synthVolume: null
};

// Colors for particles & aesthetics
const THEME_COLORS = ['#ffc107', '#ff5722', '#e91e63', '#ffeb3b', '#ffd54f', '#ff8f00'];

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  initBackgroundParticles();
  parseUrlParams();
  setupInteractivity();
  enableAutoplayOnFirstInteraction();
});

/* ==========================================================================
   1. Dynamic Customizing & URL Shared Parser
   ========================================================================== */

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);

  // Custom To / From
  const to = params.get('to') || 'DEVI PRASANNA';
  const from = params.get('from') || 'NOKESH';
  const wish = params.get('wish');
  const gift = params.get('gift');
  const photoUrl = params.get('photoUrl');

  // Set Recipient / Sender visuals
  document.getElementById('recipientGreeting').textContent = `To my dearest sister, ${to} 🌸`;
  document.getElementById('letterRecipient').textContent = to;
  document.getElementById('letterSender').textContent = from;

  // Set Letter content
  if (wish) {
    document.getElementById('letterContent').innerHTML = decodeURIComponent(wish).replace(/\n/g, '<br>');
  }

  // Set Gift text
  if (gift) {
    document.getElementById('giftMessage').innerHTML = `🎟️ This voucher entitles the bearer to <strong>${decodeURIComponent(gift)}</strong>`;
  }

  // Set Photo URL or check local photo cache
  const sisterPhoto = document.getElementById('sisterPhoto');
  const photoContainer = document.getElementById('photoContainer');

  if (photoUrl) {
    sisterPhoto.src = photoUrl;
    sisterPhoto.classList.remove('hide');
    const fallback = photoContainer.querySelector('.photo-fallback');
    if (fallback) fallback.classList.add('hide');
  } else {
    // Check local storage for pre-uploaded image base64
    const cachedPhoto = localStorage.getItem('rakhi_cached_photo');
    if (cachedPhoto) {
      sisterPhoto.src = cachedPhoto;
      sisterPhoto.classList.remove('hide');
      const fallback = photoContainer.querySelector('.photo-fallback');
      if (fallback) fallback.classList.add('hide');
    }
  }

  // Pre-populate input fields if they exist in DOM
  const inputTo = document.getElementById('inputTo');
  const inputFrom = document.getElementById('inputFrom');
  const inputWish = document.getElementById('inputWish');
  const inputGift = document.getElementById('inputGift');
  const inputPhotoUrl = document.getElementById('inputPhotoUrl');

  if (inputTo) inputTo.value = to !== 'My Dearest Sister' ? to : '';
  if (inputFrom) inputFrom.value = from !== 'Your Brother' ? from : '';
  if (wish && inputWish) inputWish.value = decodeURIComponent(wish);
  if (gift && inputGift) inputGift.value = decodeURIComponent(gift);
  if (photoUrl && inputPhotoUrl) inputPhotoUrl.value = photoUrl;
}

function updatePreview() {
  const toName = document.getElementById('inputTo').value.trim() || 'My Dearest Sister';
  const fromName = document.getElementById('inputFrom').value.trim() || 'Your Brother';
  const wish = document.getElementById('inputWish').value.trim();
  const gift = document.getElementById('inputGift').value.trim();
  const photoUrl = document.getElementById('inputPhotoUrl').value.trim();

  // Instantly reflect changes in preview
  document.getElementById('recipientGreeting').textContent = `To my dearest sister, ${toName} 🌸`;
  document.getElementById('letterRecipient').textContent = toName;
  document.getElementById('letterSender').textContent = fromName;

  if (wish) {
    document.getElementById('letterContent').innerHTML = wish.replace(/\n/g, '<br>');
  } else {
    document.getElementById('letterContent').innerHTML = `Thank you for being the most supportive, wonderful, and caring sister in the entire world. Through all the fights, laughs, and secret-sharing, you've always been my constant anchor. Today, as I promise to always stand protectively by your side, I want to say how incredibly lucky I am to have you as my sibling.`;
  }

  if (gift) {
    document.getElementById('giftMessage').innerHTML = `🎟️ This voucher entitles the bearer to <strong>${gift}</strong>`;
  } else {
    document.getElementById('giftMessage').innerHTML = `🎟️ This voucher entitles the bearer to <strong>One shopping trip paid entirely by your beloved brother!</strong>`;
  }

  // Live photo url preview
  const sisterPhoto = document.getElementById('sisterPhoto');
  const photoContainer = document.getElementById('photoContainer');
  const fallback = photoContainer.querySelector('.photo-fallback');

  if (photoUrl) {
    sisterPhoto.src = photoUrl;
    sisterPhoto.classList.remove('hide');
    if (fallback) fallback.classList.add('hide');
  } else {
    // If empty input, revert to cache or default state
    const cachedPhoto = localStorage.getItem('rakhi_cached_photo');
    if (cachedPhoto) {
      sisterPhoto.src = cachedPhoto;
      sisterPhoto.classList.remove('hide');
      if (fallback) fallback.classList.add('hide');
    } else {
      sisterPhoto.classList.add('hide');
      if (fallback) fallback.classList.remove('hide');
    }
  }
}

function handlePhotoUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64Data = e.target.result;

      // Show image
      const sisterPhoto = document.getElementById('sisterPhoto');
      sisterPhoto.src = base64Data;
      sisterPhoto.classList.remove('hide');

      const photoContainer = document.getElementById('photoContainer');
      const fallback = photoContainer.querySelector('.photo-fallback');
      if (fallback) fallback.classList.add('hide');

      // Downscale resize and compress to prevent storage quota crash on mobile
      compressAndCachePhoto(base64Data);

      triggerCelebrationStatus("📸 Shared Photo Loaded successfully!");
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function compressAndCachePhoto(base64Data) {
  const img = new Image();
  img.src = base64Data;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxLen = 400;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxLen) {
        height *= maxLen / width;
        width = maxLen;
      }
    } else {
      if (height > maxLen) {
        width *= maxLen / height;
        height = maxLen;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    try {
      const compressed = canvas.toDataURL('image/jpeg', 0.6); // 60% quality jpeg
      localStorage.setItem('rakhi_cached_photo', compressed);
    } catch (err) {
      console.warn("Could not save to localStorage cache due to quota constraints.", err);
    }
  };
}

function generateShareLink() {
  const toVal = document.getElementById('inputTo').value.trim();
  const fromVal = document.getElementById('inputFrom').value.trim();
  const wishVal = document.getElementById('inputWish').value.trim();
  const giftVal = document.getElementById('inputGift').value.trim();
  const photoUrlVal = document.getElementById('inputPhotoUrl').value.trim();

  const baseUrl = window.location.origin + window.location.pathname;
  const queries = [];

  if (toVal) queries.push(`to=${encodeURIComponent(toVal)}`);
  if (fromVal) queries.push(`from=${encodeURIComponent(fromVal)}`);
  if (wishVal) queries.push(`wish=${encodeURIComponent(wishVal)}`);
  if (giftVal) queries.push(`gift=${encodeURIComponent(giftVal)}`);
  if (photoUrlVal) queries.push(`photoUrl=${encodeURIComponent(photoUrlVal)}`);

  const finalUrl = baseUrl + (queries.length > 0 ? '?' + queries.join('&') : '');

  // Copy to clipboard with secure context safety fallbacks
  copyTextToClipboard(finalUrl);
}

function toggleCustomizer() {
  const drawer = document.getElementById('customizerDrawer');
  const chevron = document.getElementById('customizerChevron');

  if (drawer.classList.contains('collapsed-drawer')) {
    drawer.classList.remove('collapsed-drawer');
    chevron.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
  } else {
    drawer.classList.add('collapsed-drawer');
    chevron.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
  }
}

function setupCustomizerPreviews() {
  // Setup toggle header click
  const chevron = document.getElementById('customizerChevron');
  // Just in case toggleCustomizer is bound in HTML, we ensure state
}

// Copy clipboard utility supporting non-secure HTTP on mobile
function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopySuccess();
    }).catch(err => {
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showCopySuccess();
    } else {
      promptCopy(text);
    }
  } catch (err) {
    promptCopy(text);
  }

  document.body.removeChild(textArea);
}

function showCopySuccess() {
  const popup = document.getElementById('shareStatus');
  if (popup) {
    popup.style.display = 'flex';
    setTimeout(() => {
      popup.style.display = 'none';
    }, 4000);
  }
}

function promptCopy(text) {
  alert("Please copy this personalized URL manually:\n\n" + text);
}

// Auto-play music as soon as user taps or clicks anywhere on the document
function enableAutoplayOnFirstInteraction() {
  const startAudio = () => {
    initAudio();
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }
    if (!state.isAudioPlaying) {
      state.isAudioPlaying = true;
      const btn = document.getElementById('soundToggle');
      if (btn) btn.classList.add('playing');
      startMelodyLoop();
      playTempleBellChime();
    }
    window.removeEventListener('click', startAudio);
    window.removeEventListener('touchstart', startAudio);
  };
  window.addEventListener('click', startAudio);
  window.addEventListener('touchstart', startAudio);
}

/* ==========================================================================
   2. Web Audio API Festive sound Synth
   ========================================================================== */

function initAudio() {
  if (state.audioContext) return;

  // Custom audio context initialization
  state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  state.synthVolume = state.audioContext.createGain();
  state.synthVolume.gain.setValueAtTime(0.08, state.audioContext.currentTime); // keep volume gentle
  state.synthVolume.connect(state.audioContext.destination);
}

// Play note helper
function playSynthesizedNote(freq, type = 'sine', duration = 0.5, delay = 0, gainValue = 0.5) {
  if (!state.audioContext || state.audioContext.state === 'suspended') return;

  const osc = state.audioContext.createOscillator();
  const noteGain = state.audioContext.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, state.audioContext.currentTime + delay);

  // Classic envelope: fast attack, warm decay
  noteGain.gain.setValueAtTime(0, state.audioContext.currentTime + delay);
  noteGain.gain.linearRampToValueAtTime(gainValue, state.audioContext.currentTime + delay + 0.05);
  noteGain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + delay + duration);

  osc.connect(noteGain);
  noteGain.connect(state.synthVolume);

  osc.start(state.audioContext.currentTime + delay);
  osc.stop(state.audioContext.currentTime + delay + duration);
}

// Indian Carnatic/Sitar style chime synth sequence
function playRitualSuccessChime() {
  initAudio();
  if (!state.audioContext) return;

  // Arpeggio chime
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    playSynthesizedNote(freq, 'triangle', 0.8, idx * 0.12, 0.4);
  });
}

function playTempleBellChime() {
  initAudio();
  if (!state.audioContext) return;

  // Thick bell tone: combination of multiple frequencies (FM/Harmonics vibe)
  const baseFreq = 440; // A4
  const harmonics = [1, 2, 3, 4.2, 5.4];
  harmonics.forEach((mult, index) => {
    playSynthesizedNote(baseFreq * mult, 'sine', 2.0, 0, (0.5 / (index + 1)));
  });
}

function startMelodyLoop() {
  initAudio();
  if (!state.audioContext) return;

  // Indian classical theme pentatonic scale: C, D, E, G, A (Raag Bhupali vibe)
  const raagMelody = [
    329.63, 392.00, 440.00, 392.00, // E4, G4, A4, G4
    440.00, 523.25, 440.00, 392.00, // A4, C5, A4, G4
    523.25, 587.33, 659.25, 587.33, // C5, D5, E5, D5
    659.25, 783.99, 659.25, 523.25  // E5, G5, E5, C5
  ];

  let step = 0;
  state.seqInterval = setInterval(() => {
    if (!state.isAudioPlaying) return;

    // Play main note (warm pluck)
    const currentFreq = raagMelody[step % raagMelody.length];
    playSynthesizedNote(currentFreq, 'triangle', 0.9, 0, 0.35);

    // Occasional decoration ornament note
    if (step % 4 === 0) {
      playSynthesizedNote(currentFreq * 2, 'sine', 0.4, 0.15, 0.12);
    }

    step++;
  }, 500);
}

function setupAudioToggle() {
  const btn = document.getElementById('soundToggle');

  btn.addEventListener('click', () => {
    initAudio();

    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    if (state.isAudioPlaying) {
      // Pause
      state.isAudioPlaying = false;
      btn.classList.remove('playing');
      clearInterval(state.seqInterval);
    } else {
      // Play
      state.isAudioPlaying = true;
      btn.classList.add('playing');
      startMelodyLoop();
      // Ring bells initially
      playTempleBellChime();
    }
  });
}

/* ==========================================================================
   3. Interactive Thali Pooja Rituals logic
   ========================================================================== */

function setupInteractivity() {
  // Audio FAB
  setupAudioToggle();

  // Desktop Drag & Drop handlers
  const draggables = document.querySelectorAll('.draggable');
  const wrist = document.getElementById('wristDropzone');
  const mouth = document.getElementById('mouthDropzone');

  draggables.forEach(drv => {
    drv.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', e.target.id);
      e.target.classList.add('dragging');
    });

    drv.addEventListener('dragend', (e) => {
      e.target.classList.remove('dragging');
    });

    // Mobile click sequence backing
    drv.addEventListener('click', () => {
      // Remove others selection
      draggables.forEach(d => d.style.boxShadow = '');

      // Toggle select
      if (state.activeItem === drv.id) {
        state.activeItem = null;
        drv.style.boxShadow = '';
        triggerCelebrationStatus("Selection cleared.");
      } else {
        state.activeItem = drv.id;
        drv.style.boxShadow = '0 0 15px #ffd54f';
        if (drv.id === 'thaliSweet') {
          triggerCelebrationStatus("Ladoo selected! Now click the Mouth target area to feed.");
        } else if (drv.id === 'thaliRakhi') {
          triggerCelebrationStatus("Rakhi selected! Now click the Wrist target area to tie it.");
        }
      }
    });
  });

  // Wrist Drop handlers
  wrist.addEventListener('dragover', (e) => e.preventDefault());
  wrist.addEventListener('dragenter', () => wrist.classList.add('hovered'));
  wrist.addEventListener('dragleave', () => wrist.classList.remove('hovered'));
  wrist.addEventListener('drop', (e) => {
    e.preventDefault();
    wrist.classList.remove('hovered');
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId === 'thaliRakhi') {
      tieRakhiCeremony();
    } else {
      triggerCelebrationStatus("⚠️ Place the Rakhi thread on the wrist, not other items!");
    }
  });

  // Wrist Click mobile fallback handler
  wrist.addEventListener('click', () => {
    if (state.activeItem === 'thaliRakhi') {
      tieRakhiCeremony();
      document.getElementById('thaliRakhi').style.boxShadow = '';
      state.activeItem = null;
    }
  });

  // Mouth Drop handlers
  mouth.addEventListener('dragover', (e) => e.preventDefault());
  mouth.addEventListener('dragenter', () => mouth.classList.add('hovered'));
  mouth.addEventListener('dragleave', () => mouth.classList.remove('hovered'));
  mouth.addEventListener('drop', (e) => {
    e.preventDefault();
    mouth.classList.remove('hovered');
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId === 'thaliSweet') {
      feedSweetCeremony();
    } else {
      triggerCelebrationStatus("⚠️ Feed the sweet sweet Ladoo here!");
    }
  });

  // Mouth Click mobile fallback handler
  mouth.addEventListener('click', () => {
    if (state.activeItem === 'thaliSweet') {
      feedSweetCeremony();
      document.getElementById('thaliSweet').style.boxShadow = '';
      state.activeItem = null;
    }
  });
}

function igniteDiya() {
  const diya = document.getElementById('thaliDiya');

  if (!state.diyaLit) {
    state.diyaLit = true;
    diya.classList.add('lit-diya');
    playSynthesizedNote(880, 'sine', 0.6, 0, 0.4); // soft chime
    triggerCelebrationStatus("🔥 Diya lit successfully! The auspicious glow is present.");
    checkRitualsCompletion();
  }
}

function pickTilak() {
  state.activeItem = 'tilak';
  // Highlight Tilak
  document.getElementById('thaliTilak').style.transform = 'scale(1.15) translateY(-5px)';

  // Highlight forehead target area
  const headNode = document.querySelector('.avatar-head');
  headNode.style.boxShadow = '0 0 20px #e91e63';

  triggerCelebrationStatus("🔴 Tilak picked! Tap the forehead region on the character card to apply.");

  // Apply tilak handler on click
  headNode.onclick = () => {
    if (state.activeItem === 'tilak') {
      applyTilakCeremony();
    }
  };
}

function applyTilakCeremony() {
  state.tilakApplied = true;
  document.getElementById('foreheadTilak').classList.add('active');

  // Clean highlights
  const headNode = document.querySelector('.avatar-head');
  headNode.style.boxShadow = '';
  document.getElementById('thaliTilak').style.transform = '';
  state.activeItem = null;

  // Sound chime
  playSynthesizedNote(659.25, 'sine', 0.7, 0, 0.35); // warm pitch E5
  triggerCelebrationStatus("🔴 Tilak applied beautifully to the forehead!");
  checkRitualsCompletion();
}

function feedSweetCeremony() {
  if (state.sweetFed) return;

  state.sweetFed = true;

  // Animate sweet slide scale out
  const sweet = document.getElementById('thaliSweet');
  sweet.style.transition = 'all 0.5s ease';
  sweet.style.transform = 'scale(0)';

  setTimeout(() => {
    sweet.classList.add('hide');
  }, 500);

  // Sound
  playSynthesizedNote(523.25, 'triangle', 0.5, 0, 0.4); // cute bite sound
  triggerCelebrationStatus("🍬 Sweet ladoo fed! A sweet token of affection.");
  checkRitualsCompletion();
}

function tieRakhiCeremony() {
  if (state.rakhiTied) return;

  state.rakhiTied = true;

  // Hide the floating Thali rakhi
  const thaliRakhi = document.getElementById('thaliRakhi');
  thaliRakhi.style.transition = 'all 0.5s ease';
  thaliRakhi.style.transform = 'scale(0)';

  setTimeout(() => {
    thaliRakhi.classList.add('hide');
  }, 500);

  // Show wrist Rakhi
  const wrist = document.getElementById('wristDropzone');
  wrist.classList.add('tied');

  // Ring grand bells
  playTempleBellChime();
  triggerCelebrationStatus("💮 Sacred Rakhi thread Tied successfully! Beautiful protection bond active.");

  // Explode particles locally around wrist
  const rect = wrist.getBoundingClientRect();
  createLocalExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);

  checkRitualsCompletion();
}

function triggerCelebrationStatus(msg, isSuccess = false) {
  const box = document.getElementById('ritualStatus');
  box.textContent = msg;
  if (isSuccess) {
    box.classList.add('success');
  } else {
    box.classList.remove('success');
  }
}

function checkRitualsCompletion() {
  if (state.diyaLit && state.tilakApplied && state.sweetFed && state.rakhiTied) {
    setTimeout(() => {
      triggerCelebrationStatus("🌸 Divine Pooja rituals completed! Your bond is cemented with trust. Tap below to read your letter.", true);
      playRitualSuccessChime();

      // Explode general center confetti
      createLocalExplosion(window.innerWidth / 2, window.innerHeight / 2, 70);
    }, 800);
  }
}

function resetRituals() {
  state.diyaLit = false;
  state.tilakApplied = false;
  state.sweetFed = false;
  state.rakhiTied = false;
  state.activeItem = null;

  // Reset visual classes
  document.getElementById('thaliDiya').classList.remove('lit-diya');
  document.getElementById('foreheadTilak').classList.remove('active');

  const sweet = document.getElementById('thaliSweet');
  sweet.classList.remove('hide');
  sweet.style.transform = '';

  const thaliRakhi = document.getElementById('thaliRakhi');
  thaliRakhi.classList.remove('hide');
  thaliRakhi.style.transform = '';

  const wrist = document.getElementById('wristDropzone');
  wrist.classList.remove('tied');

  document.querySelector('.avatar-head').style.boxShadow = '';
  document.getElementById('thaliTilak').style.transform = '';

  triggerCelebrationStatus("⚡ Pooja restarted. Light the Diya and select Tilak to begin!");
}

/* ==========================================================================
   4. Canvas Particles & Background Chills
   ========================================================================== */

let particleCtx = null;
let bgParticles = [];

function initBackgroundParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  particleCtx = canvas.getContext('2d');

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Create ambient gold floating stars
  bgParticles = [];
  const particleCount = Math.min(60, Math.floor(window.innerWidth / 20));
  for (let i = 0; i < particleCount; i++) {
    bgParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.4 - 0.1,
      color: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
      alpha: Math.random() * 0.6 + 0.2
    });
  }

  function animate() {
    particleCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Prune dead temporary particles to resolve performance lag
    bgParticles = bgParticles.filter(p => {
      if (p.decay) {
        p.alpha -= p.decay;
        return p.alpha > 0;
      }
      return true;
    });

    bgParticles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;

      // Recirculate only persistent background elements
      if (!p.decay) {
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.speedX = -p.speedX;
        }
      }

      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      particleCtx.fillStyle = p.color;
      particleCtx.globalAlpha = p.alpha;
      particleCtx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// Local dynamic explosion effects (Canvas overlays or global particles)
function createLocalExplosion(originX, originY, count = 30) {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 3;

    bgParticles.push({
      x: originX,
      y: originY,
      radius: Math.random() * 3 + 2,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed - 1, // upward bias
      color: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
      alpha: 1.0,
      decay: Math.random() * 0.02 + 0.015
    });
  }
}

/* ==========================================================================
   5. Gift Unwrap confettis & triggers
   ========================================================================== */

let giftConfettiCtx = null;
let giftConfettiInterval = null;
let giftConfettiArray = [];

function unwrapGift() {
  const container = document.getElementById('giftBoxContainer');
  const voucher = document.getElementById('giftVoucher');
  const closeBtn = document.getElementById('closeGiftBtn');

  if (container.classList.contains('gift-opened')) return;

  // Add CSS opened animation trigger
  container.classList.add('gift-opened');

  // Trigger Sound
  playSynthesizedNote(294, 'triangle', 0.2, 0, 0.4);
  playSynthesizedNote(440, 'triangle', 0.2, 0.1, 0.4);
  playSynthesizedNote(587, 'sine', 0.5, 0.2, 0.5); // Major chime progression D4-A4-D5

  // Reveal voucher with delay
  setTimeout(() => {
    voucher.classList.remove('hide-voucher');
    closeBtn.style.display = 'inline-block';

    // Start running active confetti explosion
    startGiftConfettiLoop();
  }, 600);
}

function startGiftConfettiLoop() {
  const canvas = document.getElementById('giftConfetti');
  if (!canvas) return;

  giftConfettiCtx = canvas.getContext('2d');

  const resizeConfetti = () => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  };
  resizeConfetti();

  // Create initial burst
  for (let i = 0; i < 110; i++) {
    giftConfettiArray.push({
      x: canvas.width / 2,
      y: canvas.height / 3 + 50,
      size: Math.random() * 8 + 4,
      color: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
      speedX: (Math.random() - 0.5) * 12,
      speedY: (Math.random() - 0.7) * 16,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10
    });
  }

  function runConfetti() {
    if (giftConfettiArray.length === 0) {
      giftConfettiCtx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    giftConfettiCtx.clearRect(0, 0, canvas.width, canvas.height);

    giftConfettiArray.forEach((c, idx) => {
      c.x += c.speedX;
      c.y += c.speedY;
      c.speedY += 0.35; // gravity
      c.speedX *= 0.98; // drag
      c.rotation += c.rotSpeed;

      // Draw flake
      giftConfettiCtx.save();
      giftConfettiCtx.translate(c.x, c.y);
      giftConfettiCtx.rotate((c.rotation * Math.PI) / 180);
      giftConfettiCtx.fillStyle = c.color;
      giftConfettiCtx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
      giftConfettiCtx.restore();

      // Remove offscreen or slow items
      if (c.y > canvas.height || c.size <= 0) {
        giftConfettiArray.splice(idx, 1);
      }
    });

    giftConfettiInterval = requestAnimationFrame(runConfetti);
  }

  runConfetti();
}

function resetGiftBox() {
  const container = document.getElementById('giftBoxContainer');
  const voucher = document.getElementById('giftVoucher');
  const closeBtn = document.getElementById('closeGiftBtn');

  // Cancel animation
  if (giftConfettiInterval) {
    cancelAnimationFrame(giftConfettiInterval);
    giftConfettiInterval = null;
  }
  giftConfettiArray = [];

  if (giftConfettiCtx) {
    const canvas = document.getElementById('giftConfetti');
    giftConfettiCtx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Restore states
  container.classList.remove('gift-opened');
  voucher.classList.add('hide-voucher');
  closeBtn.style.display = 'none';
}

function copyPromo() {
  const promo = document.getElementById('promoCodeText').textContent;
  navigator.clipboard.writeText(promo).then(() => {
    triggerCelebrationStatus("🎟️ Coupon code copied! Send it right away.");
  });
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    const offset = 40;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = el.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}
