// Clean Scroll Animation Logic & Intersection Observers for Reveal Animations

const TOTAL_FRAMES = 240;
const images = [];
let loadedCount = 0;

// DOM elements
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const scrollWrapper = document.getElementById('scroll-wrapper');

// Animation state
let targetFrame = 0;
let currentFrame = 0;

// 1. Preload frame images
function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/Frame/ezgif-frame-${frameNum}.jpg`;
      
      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.innerText = `${percent}% Loaded`;
        
        if (loadedCount === TOTAL_FRAMES) {
          onLoadingComplete();
          resolve();
        }
      };
      
      img.onerror = () => {
        console.error(`Error loading frame: ${frameNum}`);
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          onLoadingComplete();
          resolve();
        }
      };
      
      images.push(img);
    }
  });
}

function onLoadingComplete() {
  loader.classList.add('loaded');
  
  // Set initial canvas size & draw first frame
  resizeCanvas();
  drawFrame(0);
  
  // Initialize scroll position check
  handleScroll();
  
  // Start the tick rendering loop
  requestAnimationFrame(tick);
  
  // Initialize Intersection Observer for reveal sections
  initRevealObserver();
}

// 2. Responsive Canvas drawing (Cover aspect ratio)
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.scale(dpr, dpr);
  
  // Redraw current frame
  drawFrame(Math.floor(currentFrame));
}

function drawFrame(index) {
  const img = images[index];
  if (!img || !img.complete) return;
  
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
  const canvasRatio = window.innerWidth / window.innerHeight;
  const imageRatio = img.width / img.height;
  
  let drawWidth, drawHeight, x, y;
  
  // Fit viewport and crop extra width/height (cover behavior)
  if (canvasRatio > imageRatio) {
    drawWidth = window.innerWidth;
    drawHeight = window.innerWidth / imageRatio;
    x = 0;
    y = (window.innerHeight - drawHeight) / 2;
  } else {
    drawWidth = window.innerHeight * imageRatio;
    drawHeight = window.innerHeight;
    x = (window.innerWidth - drawWidth) / 2;
    y = 0;
  }
  
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

// 3. Tick Rendering loop (RequestAnimationFrame with Smooth Lerp)
function tick() {
  const diff = targetFrame - currentFrame;
  
  if (Math.abs(diff) > 0.01) {
    currentFrame += diff * 0.07; // Smooth catchup speed
    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(currentFrame)));
    drawFrame(frameIndex);
  }
  
  requestAnimationFrame(tick);
}

// 4. Scroll Tracking Logic
function handleScroll() {
  if (!scrollWrapper) return;
  
  const rect = scrollWrapper.getBoundingClientRect();
  const scrollWrapperTop = window.scrollY + rect.top; // normally 0
  const scrollRange = scrollWrapper.scrollHeight - window.innerHeight;
  
  if (scrollRange <= 0) return;
  
  // Calculate relative progress inside Section 1 (scroll-wrapper)
  const relativeScroll = window.scrollY - scrollWrapperTop;
  let scrollFraction = relativeScroll / scrollRange;
  
  // Clamp progress from 0.0 to 1.0
  scrollFraction = Math.max(0, Math.min(1, scrollFraction));
  
  // Map progress to target frame index
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);

  revealVisibleSections();
}

// 5. Intersection Observer for Smooth Reveal Animations
function initRevealObserver() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -5% 0px',
    threshold: 0.01
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.reveal-section').forEach(section => {
    observer.observe(section);
  });

  revealVisibleSections();
}

function revealVisibleSections() {
  document.querySelectorAll('.reveal-section:not(.reveal-active)').forEach(section => {
    const rect = section.getBoundingClientRect();
    const triggerLine = window.innerHeight * 0.9;

    if (rect.top < triggerLine) {
      section.classList.add('reveal-active');
    }
  });
}

// 6. Event Listeners
if (window.location.pathname === '/') {
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', resizeCanvas);
  preloadImages();
}


