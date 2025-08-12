/* ===== Helpers ===== */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

/* ===== GSAP Setup ===== */
window.gsap?.registerPlugin(window.ScrollTrigger, window.ScrollToPlugin);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== Modern Web Technologies Setup ===== */
// Check for modern browser features
const supportsWebGL = !!window.WebGLRenderingContext;
const supportsWebWorkers = !!window.Worker;
const supportsServiceWorker = 'serviceWorker' in navigator;
const supportsWebAudio = !!window.AudioContext || !!window.webkitAudioContext;
const supportsWebGL2 = !!window.WebGL2RenderingContext;

// Modern error handling and logging
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  debug: (msg) => console.debug(`[DEBUG] ${msg}`)
};

// Performance monitoring
const performanceMonitor = {
  start: (label) => performance.mark(`${label}-start`),
  end: (label) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measure = performance.getEntriesByName(label)[0];
    logger.debug(`${label}: ${measure.duration.toFixed(2)}ms`);
  }
};

/* ===== Enhanced Hearts Canvas Background ===== */
(function heartsBackground() {
  const canvas = document.getElementById('heartsCanvas');
  if (!canvas) return;
  
  // Use WebGL2 if available, fallback to 2D
  let gl, program, isWebGL = false;
  
  if (supportsWebGL2) {
    try {
      gl = canvas.getContext('webgl2', { 
        antialias: true, 
        alpha: true, 
        premultipliedAlpha: false 
      });
      if (gl) {
        isWebGL = true;
        setupWebGL();
      }
    } catch (e) {
      logger.warn('WebGL2 failed, falling back to 2D: ' + e.message);
    }
  }
  
  if (!isWebGL) {
    // Fallback to 2D canvas
    setup2DCanvas();
  }
  
  function setupWebGL() {
    // WebGL2 shader setup for hearts
    const vertexShader = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      uniform mat3 u_matrix;
      
      void main() {
        gl_Position = vec4((u_matrix * vec3(a_position, 1.0)).xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
    
    const fragmentShader = `#version 300 es
      precision mediump float;
      in vec2 v_texCoord;
      out vec4 outColor;
      uniform float u_time;
      
      void main() {
        vec2 uv = v_texCoord - 0.5;
        float dist = length(uv);
        float heart = smoothstep(0.5, 0.4, dist);
        vec3 color = mix(vec3(1.0, 0.2, 0.4), vec3(1.0, 0.6, 0.7), heart);
        outColor = vec4(color, heart * 0.8);
      }
    `;
    
    // Compile shaders and create program
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexShader);
    gl.compileShader(vs);
    
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);
    
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('WebGL program link failed');
    }
    
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
  
  function setup2DCanvas() {
    // Original 2D canvas implementation
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width, height, dpr;
    const hearts = [];
    const maxHearts = 100;
    const sparkles = [];
    
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth = window.innerWidth;
      height = canvas.clientHeight = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    
    function createHeart(x = Math.random() * width, y = height + 20) {
      const size = 6 + Math.random() * 10;
      const speedY = 0.4 + Math.random() * 1.1;
      const driftX = (Math.random() - 0.5) * 0.6;
      const rotate = Math.random() * Math.PI;
      const opacity = 0.5 + Math.random() * 0.5;
      const pulse = Math.random() * 0.1;
      return { x, y, size, speedY, driftX, rotate, opacity, pulse, originalSize: size };
    }
    
    function createSparkle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: 2 + Math.random() * 3,
        speed: 0.5 + Math.random() * 1,
        opacity: 0.3 + Math.random() * 0.7,
        life: 1
      };
    }
    
    function drawHeart(h) {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotate);
      ctx.globalAlpha = h.opacity;
      
      const pulseSize = h.size + Math.sin(Date.now() * 0.005 + h.pulse) * 2;
      
      const grad = ctx.createRadialGradient(-pulseSize * 0.1, -pulseSize * 0.1, 0, 0, 0, pulseSize);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#ff9eb1');
      grad.addColorStop(1, '#ff4d6d');
      ctx.fillStyle = grad;
      
      ctx.beginPath();
      ctx.moveTo(0, pulseSize / 3);
      ctx.bezierCurveTo(pulseSize, -pulseSize / 2, pulseSize * 1.3, pulseSize * 0.9, 0, pulseSize * 1.4);
      ctx.bezierCurveTo(-pulseSize * 1.3, pulseSize * 0.9, -pulseSize, -pulseSize / 2, 0, pulseSize / 3);
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowColor = '#ff4d6d';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.restore();
    }
    
    function drawSparkle(s) {
      ctx.save();
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = '#ffd166';
      
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - s.size);
      ctx.lineTo(s.x + s.size * 0.5, s.y);
      ctx.lineTo(s.x, s.y + s.size);
      ctx.lineTo(s.x - s.size * 0.5, s.y);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    
    function update() {
      if (prefersReducedMotion) return;
      
      if (hearts.length < maxHearts && Math.random() < 0.8) hearts.push(createHeart());
      for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        h.y -= h.speedY;
        h.x += h.driftX;
        h.rotate += 0.005;
        if (h.y < -20) hearts.splice(i, 1);
      }
      
      if (sparkles.length < 50 && Math.random() < 0.3) sparkles.push(createSparkle());
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.y -= s.speed;
        s.life -= 0.01;
        if (s.life <= 0 || s.y < -10) sparkles.splice(i, 1);
      }
    }
    
    function render() {
      ctx.clearRect(0, 0, width, height);
      
      for (const s of sparkles) drawSparkle(s);
      for (const h of hearts) drawHeart(h);
    }
    
    function loop() {
      update();
      render();
      requestAnimationFrame(loop);
    }
    
    resize();
    window.addEventListener('resize', resize);
    loop();
  }
})();

/* ===== Enhanced Parallax on hero text ===== */
(function parallaxHero() {
  const hero = document.getElementById('hero');
  if (!hero || prefersReducedMotion) return;
  const targets = $$('.title, .subtitle, .lead', hero);

  // Use Intersection Observer for better performance
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.willChange = 'transform';
      } else {
        entry.target.style.willChange = 'auto';
      }
    });
  }, { threshold: 0.1 });
  
  targets.forEach(target => observer.observe(target));

  hero.addEventListener('pointermove', (e) => {
    // Use requestAnimationFrame for smooth performance
    requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      
      targets.forEach((el) => {
        const depth = Number(el.dataset.depth || 4);
        const tx = (-cx / rect.width) * depth * 15;
        const ty = (-cy / rect.height) * depth * 15;
        const scale = 1 + Math.abs(cx + cy) / (rect.width + rect.height) * 0.02;
        
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
      });
    });
  });

  hero.addEventListener('pointerleave', () => {
    targets.forEach((el) => {
      el.style.transform = 'translate3d(0,0,0) scale(1)';
    });
  });
})();

/* ===== Advanced Scroll reveal animations ===== */
(function scrollReveal() {
  const revealEls = $$('.reveal, .card');
  if (!revealEls.length) return;

  // Use Intersection Observer for better performance
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        if (window.gsap && window.ScrollTrigger) {
          gsap.to(entry.target, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            delay: index * 0.1
          });
        } else {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0) scale(1)';
        }
        observer.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealEls.forEach((el) => observer.observe(el));
})();

/* ===== Enhanced Button interactions ===== */
(function interactions() {
  // Use event delegation for better performance
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.btn');
    if (!target) return;
    
    // Add ripple effect
    createRippleEffect(target, e);
    
    // Add haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  });

  const startBtn = document.getElementById('startButton');
  const confettiBtn = document.getElementById('confettiButton');
  const finaleBtn = document.getElementById('finaleButton');

  function shootConfetti(power = 1) {
    if (!window.confetti) return;
    
    // Use modern confetti with better performance
    const count = Math.floor(200 * power);
    const defaults = { 
      spread: 70, 
      startVelocity: 38, 
      ticks: 260, 
      zIndex: 1000,
      useWorker: true // Use Web Worker for better performance
    };

    function fire(particleRatio, opts) {
      confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio),
      }));
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ff4d6d', '#ffd166'] });
    fire(0.2, { spread: 60, colors: ['#ff6b9d', '#ff8fa3'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9, colors: ['#ff4d6d', '#ffd166', '#ff6b9d'] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, colors: ['#ffd166'] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ['#ff4d6d'] });
  }

  function pulseButtons() {
    if (!window.gsap) return;
    gsap.fromTo('.btn', 
      { y: 0, scale: 1 }, 
      { y: -3, scale: 1.05, repeat: 1, yoyo: true, duration: 0.2, ease: 'power1.out' }
    );
  }

  function createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  startBtn?.addEventListener('click', () => {
    pulseButtons();
    shootConfetti(1.2);
    if (window.gsap) {
      gsap.timeline()
        .to('#nameSpan', { 
          color: '#ffd166', 
          scale: 1.1, 
          duration: 0.6, 
          ease: 'back.out(2)',
          textShadow: '0 0 20px rgba(255, 209, 102, 0.5)'
        })
        .to('.title', { 
          textShadow: '0 15px 40px rgba(255,77,109,0.6)', 
          duration: 0.6 
        }, '<')
        .to('.hero::after', { 
          scale: 1.5, 
          opacity: 0.8, 
          duration: 0.8 
        }, '<');
    }
    
    $$('.title, .subtitle, .lead').forEach(el => {
      el.classList.add('floating');
    });
  });

  confettiBtn?.addEventListener('click', () => {
    pulseButtons();
    shootConfetti(1.6);
    
    if (window.gsap) {
      gsap.to('.card', { 
        scale: 1.05, 
        duration: 0.3, 
        ease: 'power2.out',
        stagger: 0.1,
        yoyo: true,
        repeat: 1
      });
    }
  });

  finaleBtn?.addEventListener('click', () => {
    pulseButtons();
    shootConfetti(2);
    
    if (window.gsap) {
      gsap.timeline()
        .to('.script', { 
          scale: 1.1, 
          duration: 0.4, 
          ease: 'back.out(2)' 
        })
        .to(window, { 
          duration: 0.8, 
          scrollTo: 0, 
          ease: 'power2.out' 
        }, '-=0.2');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();

/* ===== Enhanced floating animations ===== */
(function floatHero() {
  if (!window.gsap || prefersReducedMotion) return;
  
  const items = ['.title', '.subtitle', '.lead'];
  items.forEach((sel, i) => {
    gsap.to(sel, {
      y: 8 + i * 3,
      duration: 2.5 + i * 0.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  });
})();

/* ===== Interactive card effects ===== */
(function cardInteractions() {
  const cards = $$('.card');
  
  // Use Intersection Observer for better performance
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.willChange = 'transform';
      } else {
        entry.target.style.willChange = 'auto';
      }
    });
  }, { threshold: 0.1 });
  
  cards.forEach(card => observer.observe(card));
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (window.gsap) {
        gsap.to(card, { 
          scale: 1.02, 
          duration: 0.3, 
          ease: 'power2.out' 
        });
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (window.gsap) {
        gsap.to(card, { 
          scale: 1, 
          duration: 0.3, 
          ease: 'power2.out' 
        });
      }
    });
  });
})();

/* ===== Auto-scroll carousel ===== */
(function autoScrollCarousel() {
  const carousel = $('.carousel');
  if (!carousel || prefersReducedMotion) return;
  
  // Use requestAnimationFrame for smooth scrolling
  let scrollPosition = 0;
  const scrollSpeed = 0.5;
  let animationId;
  
  function autoScroll() {
    scrollPosition += scrollSpeed;
    if (scrollPosition >= carousel.scrollWidth - carousel.clientWidth) {
      scrollPosition = 0;
    }
    carousel.scrollLeft = scrollPosition;
    animationId = requestAnimationFrame(autoScroll);
  }
  
  const startAutoScroll = () => {
    if (!animationId) {
      animationId = requestAnimationFrame(autoScroll);
    }
  };
  
  const stopAutoScroll = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };
  
  carousel.addEventListener('mouseenter', stopAutoScroll);
  carousel.addEventListener('mouseleave', startAutoScroll);
  
  startAutoScroll();
})();

/* ===== Typing effect for title ===== */
(function typingEffect() {
  const title = $('.title');
  if (!title || prefersReducedMotion) return;
  
  // Use modern text animation with better performance
  const text = title.textContent;
  title.textContent = '';
  
  let i = 0;
  const typeWriter = () => {
    if (i < text.length) {
      title.textContent += text.charAt(i);
      i++;
      setTimeout(typeWriter, 100);
    }
  };
  
  // Start typing after a short delay
  setTimeout(typeWriter, 500);
})();

/* ===== Add CSS for ripple effect ===== */
(function addRippleCSS() {
  if (document.getElementById('ripple-css')) return;
  
  const style = document.createElement('style');
  style.id = 'ripple-css';
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
})();

/* ===== Service Worker Registration ===== */
(function registerServiceWorker() {
  if (supportsServiceWorker) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        logger.info('Service Worker registered successfully');
      })
      .catch(error => {
        logger.error('Service Worker registration failed: ' + error);
      });
  }
})();

/* ===== Web Worker for Heavy Computations ===== */
(function setupWebWorker() {
  if (supportsWebWorkers) {
    const worker = new Worker(URL.createObjectURL(new Blob([`
      self.onmessage = function(e) {
        // Heavy computations can be done here
        const result = e.data * 2;
        self.postMessage(result);
      };
    `])));
    
    worker.onmessage = function(e) {
      logger.debug('Web Worker result: ' + e.data);
    };
    
    // Store worker reference globally
    window.backgroundWorker = worker;
  }
})();

/* ===== Initialize everything ===== */
document.addEventListener('DOMContentLoaded', () => {
  performanceMonitor.start('page-load');
  
  addRippleCSS();
  registerServiceWorker();
  setupWebWorker();
  
  // Add some initial animations
  if (window.gsap) {
    gsap.from('.hero-inner', { 
      opacity: 0, 
      y: 50, 
      duration: 1.2, 
      ease: 'power3.out' 
    });
  }
  
  performanceMonitor.end('page-load');
  
  // Log browser capabilities
  logger.info(`WebGL: ${supportsWebGL}, WebGL2: ${supportsWebGL2}`);
  logger.info(`Web Workers: ${supportsWebWorkers}, Service Workers: ${supportsServiceWorker}`);
  logger.info(`Web Audio: ${supportsWebAudio}`);
});

/* ===== Countdown Timer ===== */
(function countdownTimer() {
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  
  if (!hoursEl || !minutesEl || !secondsEl) return;
  
  function updateCountdown() {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const diff = endOfDay - now;
    
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      hoursEl.textContent = hours.toString().padStart(2, '0');
      minutesEl.textContent = minutes.toString().padStart(2, '0');
      secondsEl.textContent = seconds.toString().padStart(2, '0');
      
      // Add pulse effect to seconds
      if (window.gsap) {
        gsap.to(secondsEl, { 
          scale: 1.1, 
          duration: 0.3, 
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      }
    }
  }
  
  updateCountdown();
  setInterval(updateCountdown, 1000);
})();

/* ===== Enhanced Memory Cards ===== */
(function memoryCards() {
  const memoryCards = $$('.memory-card');
  
  memoryCards.forEach((card, index) => {
    card.addEventListener('mouseenter', () => {
      if (window.gsap) {
        gsap.to(card, { 
          scale: 1.05, 
          duration: 0.4, 
          ease: 'power2.out' 
        });
        
        // Stagger animation for icon
        gsap.to(card.querySelector('.memory-icon'), {
          rotation: 360,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (window.gsap) {
        gsap.to(card, { 
          scale: 1, 
          duration: 0.4, 
          ease: 'power2.out' 
        });
      }
    });
  });
})();

/* ===== Particle Burst on Special Moments ===== */
function createParticleBurst(x, y, color = '#ff4d6d') {
  const particleCount = 15;
  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 6px;
      height: 6px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
    `;
    
    document.body.appendChild(particle);
    
    const angle = (i / particleCount) * Math.PI * 2;
    const velocity = 100 + Math.random() * 100;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    particles.push({ element: particle, vx, vy, life: 1 });
  }
  
  function animateParticles() {
    particles.forEach((p, index) => {
      p.element.style.left = parseFloat(p.element.style.left) + p.vx * 0.016 + 'px';
      p.element.style.top = parseFloat(p.element.style.top) + p.vy * 0.016 + 'px';
      p.vy += 50; // gravity
      p.life -= 0.02;
      p.element.style.opacity = p.life;
      
      if (p.life <= 0) {
        p.element.remove();
        particles.splice(index, 1);
      }
    });
    
    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  }
  
  animateParticles();
}

// Add particle burst to memory cards
document.addEventListener('DOMContentLoaded', () => {
  $$('.memory-card').forEach(card => {
    card.addEventListener('click', (e) => {
      createParticleBurst(e.clientX, e.clientY, '#ffd166');
    });
  });
});

/* ===== Music Player Functionality ===== */
(function musicPlayer() {
  const audio = document.getElementById('audioPlayer');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const progressBar = document.querySelector('.progress-bar');
  const progressFill = document.querySelector('.progress-fill');
  const progressHandle = document.querySelector('.progress-handle');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const vinylDisc = document.querySelector('.vinyl-disc');
  
  if (!audio) return;
  
  let isPlaying = false;
  let isDragging = false;
  
  // Format time function
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Update progress bar
  function updateProgress() {
    if (audio.duration && !isDragging) {
      const progress = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = `${progress}%`;
      progressHandle.style.left = `${progress}%`;
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  }
  
  // Update total time when metadata is loaded
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });
  
  // Update progress every 100ms
  audio.addEventListener('timeupdate', updateProgress);
  
  // Play/Pause functionality
  playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      playPauseBtn.classList.remove('playing');
      vinylDisc.classList.remove('playing');
      vinylDisc.classList.add('paused');
    } else {
      audio.play();
      isPlaying = true;
      playPauseBtn.classList.add('playing');
      vinylDisc.classList.add('playing');
      vinylDisc.classList.remove('paused');
      
      // Add confetti when music starts
      if (window.confetti) {
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.6 }
        });
      }
    }
  });
  
  // Stop functionality
  stopBtn.addEventListener('click', () => {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playPauseBtn.classList.remove('playing');
    vinylDisc.classList.remove('playing', 'paused');
    updateProgress();
  });
  
  // Volume control
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audio.volume = volume;
    
    // Update volume button icon
    if (volume === 0) {
      volumeBtn.textContent = '🔇';
    } else if (volume < 0.5) {
      volumeBtn.textContent = '🔉';
    } else {
      volumeBtn.textContent = '🔊';
    }
    
    // Add visual feedback
    if (window.gsap) {
      gsap.to(volumeSlider, {
        scale: 1.05,
        duration: 0.2,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }
  });
  
  // Mute/Unmute on volume button click
  volumeBtn.addEventListener('click', () => {
    if (audio.volume > 0) {
      audio.dataset.lastVolume = audio.volume;
      audio.volume = 0;
      volumeSlider.value = 0;
      volumeBtn.textContent = '🔇';
    } else {
      const lastVolume = audio.dataset.lastVolume || 0.8;
      audio.volume = lastVolume;
      volumeSlider.value = lastVolume * 100;
      volumeBtn.textContent = '🔊';
    }
  });
  
  // Progress bar click to seek
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / rect.width;
    audio.currentTime = progress * audio.duration;
  });
  
  // Progress bar drag functionality
  progressBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    handleDrag(e);
  });
  
  function handleDrag(e) {
    if (!isDragging) return;
    const rect = progressBar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const progress = clickX / rect.width;
    progressFill.style.width = `${progress * 100}%`;
    progressHandle.style.left = `${progress * 100}%`;
    currentTimeEl.textContent = formatTime(progress * audio.duration);
  }
  
  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      const progress = parseFloat(progressFill.style.width) / 100;
      audio.currentTime = progress * audio.duration;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
    }
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return; // Don't interfere with form inputs
    
    switch(e.code) {
      case 'Space':
        e.preventDefault();
        playPauseBtn.click();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        audio.currentTime = Math.max(0, audio.currentTime - 10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const newVolumeUp = Math.min(1, audio.volume + 0.1);
        audio.volume = newVolumeUp;
        volumeSlider.value = newVolumeUp * 100;
        break;
      case 'ArrowDown':
        e.preventDefault();
        const newVolumeDown = Math.max(0, audio.volume - 0.1);
        audio.volume = newVolumeDown;
        volumeSlider.value = newVolumeDown * 100;
        break;
    }
  });
  
  // Audio ended event
  audio.addEventListener('ended', () => {
    isPlaying = false;
    playPauseBtn.classList.remove('playing');
    vinylDisc.classList.remove('playing');
    updateProgress();
    
    // Add celebration effect when song ends
    if (window.confetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  });
  
  // Add visual feedback for controls
  [playPauseBtn, stopBtn, volumeBtn].forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.gsap) {
        gsap.to(btn, {
          scale: 0.9,
          duration: 0.1,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      }
    });
  });
  
  // Initialize volume
  audio.volume = 0.8;
  volumeSlider.value = 80;
})();

/* ===== Floating Hearts Background ===== */
(function floatingHearts() {
  const canvas = document.getElementById('heartsCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width, height;
  const hearts = [];
  const maxHearts = 120;
  const sparkles = [];
  const maxSparkles = 40;
  
  function resize() {
    width = canvas.clientWidth = window.innerWidth;
    height = canvas.clientHeight = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }
  
  function createHeart() {
    return {
      x: Math.random() * width,
      y: height + 20,
      size: 8 + Math.random() * 12,
      speedY: 0.3 + Math.random() * 0.8,
      driftX: (Math.random() - 0.5) * 0.4,
      rotate: Math.random() * Math.PI * 2,
      opacity: 0.4 + Math.random() * 0.6,
      pulse: Math.random() * 0.1,
      color: Math.random() > 0.7 ? '#ffd166' : '#ff4d6d',
      type: Math.random() > 0.8 ? 'filled' : 'gradient'
    };
  }
  
  function createSparkle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: 2 + Math.random() * 4,
      speed: 0.5 + Math.random() * 1,
      opacity: 0.3 + Math.random() * 0.7,
      life: 1,
      color: '#ffd166'
    };
  }
  
  function drawHeart(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rotate);
    ctx.globalAlpha = h.opacity;
    
    // Pulsing effect
    const pulseSize = h.size + Math.sin(Date.now() * 0.005 + h.pulse) * 3;
    
    // Different heart styles
    if (h.type === 'filled') {
      ctx.fillStyle = h.color;
    } else {
      // Create gradient
      const grad = ctx.createRadialGradient(-pulseSize * 0.1, -pulseSize * 0.1, 0, 0, 0, pulseSize);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#ff9eb1');
      grad.addColorStop(1, h.color);
      ctx.fillStyle = grad;
    }
    
    // Draw heart shape
    ctx.beginPath();
    ctx.moveTo(0, pulseSize / 3);
    ctx.bezierCurveTo(pulseSize, -pulseSize / 2, pulseSize * 1.3, pulseSize * 0.9, 0, pulseSize * 1.4);
    ctx.bezierCurveTo(-pulseSize * 1.3, pulseSize * 0.9, -pulseSize, -pulseSize / 2, 0, pulseSize / 3);
    ctx.closePath();
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = h.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();
  }
  
  function drawSparkle(s) {
    ctx.save();
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = s.color;
    
    // Draw star shape
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * s.size;
      const y = Math.sin(angle) * s.size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
  
  function update() {
    if (prefersReducedMotion) return;
    
    // Add new hearts
    if (hearts.length < maxHearts && Math.random() < 0.8) {
      hearts.push(createHeart());
    }
    
    // Add new sparkles
    if (sparkles.length < maxSparkles && Math.random() < 0.4) {
      sparkles.push(createSparkle());
    }
    
    // Update existing hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.y -= h.speedY;
      h.x += h.driftX;
      h.rotate += 0.008;
      
      // Remove hearts that are off screen
      if (h.y < -30 || h.x < -30 || h.x > width + 30) {
        hearts.splice(i, 1);
      }
    }
    
    // Update sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.y -= s.speed;
      s.life -= 0.01;
      if (s.life <= 0 || s.y < -10) {
        sparkles.splice(i, 1);
      }
    }
  }
  
  function render() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw sparkles first (background)
    for (const s of sparkles) {
      drawSparkle(s);
    }
    
    // Draw all hearts
    for (const h of hearts) {
      drawHeart(h);
    }
  }
  
  function animate() {
    update();
    render();
    requestAnimationFrame(animate);
  }
  
  // Initialize
  resize();
  window.addEventListener('resize', resize);
  
  // Start animation
  animate();
  
  // Add some initial hearts
  for (let i = 0; i < 30; i++) {
    hearts.push(createHeart());
  }
  
  // Add some initial sparkles
  for (let i = 0; i < 15; i++) {
    sparkles.push(createSparkle());
  }
})();

/* ===== Advanced Audio Visualizer ===== */
(function audioVisualizer() {
  const canvas = document.getElementById('visualizerCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaElementSource(audio);
  
  // Connect audio nodes
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  
  // Configure analyser
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  // Canvas setup
  const resizeCanvas = () => {
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
  };
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Create audio filters for equalizer
  const bassFilter = audioContext.createBiquadFilter();
  const trebleFilter = audioContext.createBiquadFilter();
  
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 200;
  
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 3000;
  
  // Connect filters
  source.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(analyser);
  
  // Equalizer controls
  const bassSlider = document.getElementById('bassSlider');
  const trebleSlider = document.getElementById('trebleSlider');
  
  if (bassSlider) {
    bassSlider.addEventListener('input', (e) => {
      bassFilter.gain.value = parseInt(e.target.value);
      // Visual feedback
      if (window.gsap) {
        gsap.to(bassSlider, {
          scale: 1.1,
          duration: 0.2,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      }
    });
  }
  
  if (trebleSlider) {
    trebleSlider.addEventListener('input', (e) => {
      trebleFilter.gain.value = parseInt(e.target.value);
      // Visual feedback
      if (window.gsap) {
        gsap.to(trebleSlider, {
          scale: 1.1,
          duration: 0.2,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      }
    });
  }
  
  // Visualization function
  function drawVisualizer() {
    if (!audio.paused) {
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / 2) / bufferLength;
      let barHeight;
      let x = 0;
      
      // Draw frequency bars
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * (canvas.height / 2);
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height / 2 - barHeight, 0, canvas.height / 2);
        gradient.addColorStop(0, '#ff4d6d');
        gradient.addColorStop(0.5, '#ffd166');
        gradient.addColorStop(1, '#ff6b9d');
        
        ctx.fillStyle = gradient;
        
        // Draw main bar
        ctx.fillRect(x, canvas.height / 2 - barHeight, barWidth - 1, barHeight);
        
        // Draw mirror bar
        ctx.fillRect(x, canvas.height / 2, barWidth - 1, barHeight);
        
        // Add glow effect
        ctx.shadowColor = '#ff4d6d';
        ctx.shadowBlur = 5;
        ctx.fillRect(x, canvas.height / 2 - barHeight, barWidth - 1, barHeight);
        ctx.fillRect(x, canvas.height / 2, barWidth - 1, barHeight);
        ctx.shadowBlur = 0;
        
        x += barWidth;
      }
      
      // Draw center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 4);
      ctx.lineTo(canvas.width / 2, canvas.height / 4);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 3 / 4);
      ctx.lineTo(canvas.width / 2, canvas.height * 3 / 4);
      ctx.stroke();
    }
    
    requestAnimationFrame(drawVisualizer);
  }
  
  // Start visualization
  drawVisualizer();
  
  // Enhanced playback controls
  const loopBtn = document.getElementById('loopBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const backwardBtn = document.getElementById('backwardBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  
  if (loopBtn) {
    loopBtn.addEventListener('click', () => {
      audio.loop = !audio.loop;
      loopBtn.classList.toggle('active');
      
      // Visual feedback
      if (window.gsap) {
        gsap.to(loopBtn, {
          rotation: 360,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
      
      // Add confetti for loop activation
      if (audio.loop && window.confetti) {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.6 }
        });
      }
    });
  }
  
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      shuffleBtn.classList.toggle('active');
      
      // Visual feedback
      if (window.gsap) {
        gsap.to(shuffleBtn, {
          scale: 1.2,
          duration: 0.3,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      }
    });
  }
  
  if (backwardBtn) {
    backwardBtn.addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
      
      // Visual feedback
      if (window.gsap) {
        gsap.to(backwardBtn, {
          x: -5,
          duration: 0.2,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      }
    });
  }
  
  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
      
      // Visual feedback
      if (window.gsap) {
        gsap.to(forwardBtn, {
          x: 5,
          duration: 0.2,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      }
    });
  }
  
  // Audio effects and enhancements
  audio.addEventListener('play', () => {
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Add visual enhancement to vinyl
    if (window.gsap) {
      gsap.to('.vinyl-disc', {
        scale: 1.05,
        duration: 0.5,
        ease: 'back.out(2)'
      });
    }
  });
  
  audio.addEventListener('pause', () => {
    // Add pause effect
    if (window.gsap) {
      gsap.to('.vinyl-disc', {
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  });
  
  // Add keyboard shortcuts for new controls
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.code) {
      case 'KeyL':
        e.preventDefault();
        loopBtn?.click();
        break;
      case 'KeyS':
        e.preventDefault();
        shuffleBtn?.click();
        break;
      case 'Comma':
        e.preventDefault();
        backwardBtn?.click();
        break;
      case 'Period':
        e.preventDefault();
        forwardBtn?.click();
        break;
    }
  });
})();

/* ===== Sound Effects and Audio Feedback ===== */
(function soundEffects() {
  // Create audio context for sound effects
  const sfxContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Sound effect functions
  function playBeep(frequency = 800, duration = 0.1, type = 'sine') {
    const oscillator = sfxContext.createOscillator();
    const gainNode = sfxContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(sfxContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, sfxContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, sfxContext.currentTime + duration);
    
    oscillator.start(sfxContext.currentTime);
    oscillator.stop(sfxContext.currentTime + duration);
  }
  
  function playSwoosh() {
    const oscillator = sfxContext.createOscillator();
    const gainNode = sfxContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(sfxContext.destination);
    
    oscillator.frequency.setValueAtTime(200, sfxContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, sfxContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.05, sfxContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, sfxContext.currentTime + 0.3);
    
    oscillator.start(sfxContext.currentTime);
    oscillator.stop(sfxContext.currentTime + 0.3);
  }
  
  // Add sound effects to controls
  const allButtons = $$('.control-btn');
  allButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id === 'playPauseBtn') {
        playBeep(600, 0.15, 'square');
      } else if (btn.id === 'stopBtn') {
        playBeep(400, 0.2, 'sawtooth');
      } else if (btn.id === 'loopBtn') {
        playSwoosh();
      } else if (btn.id === 'shuffleBtn') {
        playBeep(1000, 0.1, 'triangle');
      } else {
        playBeep(700, 0.1, 'sine');
      }
    });
  });
  
  // Add sound effects to sliders
  const allSliders = $$('input[type="range"]');
  allSliders.forEach(slider => {
    slider.addEventListener('input', () => {
      // Play different tones based on slider value
      const normalizedValue = (slider.value - slider.min) / (slider.max - slider.min);
      const frequency = 200 + normalizedValue * 600;
      playBeep(frequency, 0.05, 'sine');
    });
  });
  
  // Audio level indicator
  function createAudioLevelIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'audio-level-indicator';
    indicator.innerHTML = `
      <div class="level-bar"></div>
      <div class="level-text">Audio Level</div>
    `;
    
    document.querySelector('.music-controls').appendChild(indicator);
    
    // Animate level bar based on audio volume
    setInterval(() => {
      const levelBar = indicator.querySelector('.level-bar');
      const currentVolume = audio.volume;
      const level = currentVolume * 100;
      
      levelBar.style.width = `${level}%`;
      levelBar.style.background = `linear-gradient(90deg, #ff4d6d ${level}%, rgba(255, 77, 109, 0.2) ${level}%)`;
      
      // Add pulse effect when volume is high
      if (currentVolume > 0.8) {
        levelBar.style.animation = 'level-pulse 0.5s ease-in-out';
      } else {
        levelBar.style.animation = 'none';
      }
    }, 100);
  }
  
  // Initialize audio level indicator
  setTimeout(createAudioLevelIndicator, 1000);
  
  // Add CSS for audio level indicator
  const style = document.createElement('style');
  style.textContent = `
    .audio-level-indicator {
      margin-top: 15px;
      text-align: center;
    }
    
    .level-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 77, 109, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }
    
    .level-text {
      color: var(--muted);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    @keyframes level-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);
  
  // Enhanced vinyl effects
  audio.addEventListener('timeupdate', () => {
    if (audio.paused) return;
    
    // Add vinyl scratch effect randomly
    if (Math.random() < 0.001) { // Very rare
      const scratch = sfxContext.createOscillator();
      const scratchGain = sfxContext.createGain();
      
      scratch.connect(scratchGain);
      scratchGain.connect(sfxContext.destination);
      
      scratch.frequency.setValueAtTime(100, sfxContext.currentTime);
      scratch.frequency.exponentialRampToValueAtTime(50, sfxContext.currentTime + 0.1);
      
      scratchGain.gain.setValueAtTime(0.02, sfxContext.currentTime);
      scratchGain.gain.exponentialRampToValueAtTime(0.01, sfxContext.currentTime + 0.1);
      
      scratch.start(sfxContext.currentTime);
      scratch.stop(sfxContext.currentTime + 0.1);
    }
  });
})(); 

/* ===== Interactive Love Game ===== */
(function loveGame() {
  const gameHearts = document.querySelector('.game-hearts');
  const gameScore = document.getElementById('gameScore');
  let score = 0;
  
  function createGameHearts() {
    gameHearts.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const heart = document.createElement('div');
      heart.className = 'game-heart';
      heart.style.animationDelay = `${Math.random() * 2}s`;
      heart.style.animation = 'heart-float 3s ease-in-out infinite';
      
      heart.addEventListener('click', () => {
        if (!heart.classList.contains('clicked')) {
          heart.classList.add('clicked');
          score += 10;
          gameScore.textContent = score;
          
          // Add confetti
          if (window.confetti) {
            confetti({
              particleCount: 20,
              spread: 45,
              origin: { y: 0.6 }
            });
          }
          
          // Add score animation
          if (window.gsap) {
            gsap.to(gameScore, {
              scale: 1.3,
              duration: 0.3,
              ease: 'back.out(2)',
              yoyo: true,
              repeat: 1
            });
          }
          
          // Remove heart after animation
          setTimeout(() => {
            heart.remove();
            if (gameHearts.children.length === 0) {
              setTimeout(createGameHearts, 1000);
            }
          }, 600);
        }
      });
      
      gameHearts.appendChild(heart);
    }
  }
  
  // Add floating animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes heart-float {
      0%, 100% { transform: rotate(45deg) translateY(0px); }
      50% { transform: rotate(45deg) translateY(-10px); }
    }
  `;
  document.head.appendChild(style);
  
  createGameHearts();
})();

/* ===== Mood Tracker ===== */
(function moodTracker() {
  const moodBtns = $$('.mood-btn');
  
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove previous selection
      moodBtns.forEach(b => b.classList.remove('selected'));
      
      // Select current mood
      btn.classList.add('selected');
      
      // Add celebration effect
      if (window.confetti) {
        const mood = btn.dataset.mood;
        let colors = ['#ff4d6d', '#ffd166'];
        
        if (mood === 'love') colors = ['#ff6b9d', '#ff8fa3'];
        if (mood === 'excited') colors = ['#ffd166', '#ffb347'];
        if (mood === 'peaceful') colors = ['#87ceeb', '#98fb98'];
        
        confetti({
          particleCount: 50,
          spread: 70,
          colors: colors,
          origin: { y: 0.6 }
        });
      }
      
      // Add mood-specific animation
      if (window.gsap) {
        gsap.to(btn, {
          rotation: 360,
          duration: 0.8,
          ease: 'power2.out'
        });
      }
    });
  });
})();

/* ===== Message Box ===== */
(function messageBox() {
  const sendBtn = document.getElementById('sendMessage');
  const messageInput = document.getElementById('loveMessage');
  
  sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
      // Add sending animation
      if (window.gsap) {
        gsap.to(sendBtn, {
          scale: 0.9,
          duration: 0.2,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1
        });
      }
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'success-message';
      successMsg.textContent = '💕 Wiadomość wysłana z miłością!';
      successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff4d6d, #ffd166);
        color: white;
        padding: 15px 20px;
        border-radius: 25px;
        box-shadow: 0 10px 30px rgba(255, 77, 109, 0.4);
        z-index: 10000;
        animation: slideIn 0.5s ease-out;
      `;
      
      document.body.appendChild(successMsg);
      
      // Add confetti
      if (window.confetti) {
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.1 }
        });
      }
      
      // Remove message after 3 seconds
      setTimeout(() => {
        successMsg.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => successMsg.remove(), 500);
      }, 3000);
      
      // Clear input
      messageInput.value = '';
    }
  });
  
  // Add slide animations CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();

/* ===== 3D Cube Gallery ===== */
(function cubeGallery() {
  const cube = document.querySelector('.cube');
  const rotateXBtn = document.getElementById('rotateX');
  const rotateYBtn = document.getElementById('rotateY');
  const rotateZBtn = document.getElementById('rotateZ');
  const autoRotateBtn = document.getElementById('autoRotate');
  
  let autoRotate = false;
  let rotationX = 0;
  let rotationY = 0;
  let rotationZ = 0;
  
  function updateCubeRotation() {
    cube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg)`;
  }
  
  rotateXBtn?.addEventListener('click', () => {
    rotationX += 90;
    updateCubeRotation();
    
    // Add button animation
    if (window.gsap) {
      gsap.to(rotateXBtn, {
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }
  });
  
  rotateYBtn?.addEventListener('click', () => {
    rotationY += 90;
    updateCubeRotation();
    
    if (window.gsap) {
      gsap.to(rotateYBtn, {
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }
  });
  
  rotateZBtn?.addEventListener('click', () => {
    rotationZ += 90;
    updateCubeRotation();
    
    if (window.gsap) {
      gsap.to(rotateZBtn, {
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }
  });
  
  autoRotateBtn?.addEventListener('click', () => {
    autoRotate = !autoRotate;
    autoRotateBtn.classList.toggle('active');
    
    if (autoRotate) {
      autoRotateBtn.textContent = '⏸️ Stop';
      autoRotateBtn.style.background = 'linear-gradient(135deg, #ff6b9d, #ff8fa3)';
    } else {
      autoRotateBtn.textContent = 'Auto-rotacja';
      autoRotateBtn.style.background = '';
    }
  });
  
  // Auto-rotation loop
  function autoRotateLoop() {
    if (autoRotate) {
      rotationY += 1;
      updateCubeRotation();
    }
    requestAnimationFrame(autoRotateLoop);
  }
  autoRotateLoop();
  
  // Add cube face click effects
  const faces = $$('.face');
  faces.forEach(face => {
    face.addEventListener('click', () => {
      if (window.gsap) {
        gsap.to(face, {
          scale: 1.2,
          duration: 0.3,
          ease: 'back.out(2)',
          yoyo: true,
          repeat: 1
        });
      }
      
      // Add particle burst
      createParticleBurst(
        face.offsetLeft + face.offsetWidth / 2,
        face.offsetTop + face.offsetHeight / 2,
        '#ffd166'
      );
    });
  });
})();

/* ===== Particle World ===== */
(function particleWorld() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  let animationId;
  
  // Resize canvas
  function resizeCanvas() {
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = (Math.random() - 0.5) * 4;
      this.size = Math.random() * 8 + 4;
      this.color = `hsl(${Math.random() * 60 + 330}, 70%, 60%)`;
      this.life = 1;
      this.decay = Math.random() * 0.02 + 0.01;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1; // gravity
      this.life -= this.decay;
      
      // Bounce off walls
      if (this.x < 0 || this.x > canvas.width / 2) this.vx *= -0.8;
      if (this.y > canvas.height / 2) this.vy *= -0.8;
    }
    
    draw() {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update();
      particle.draw();
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Control buttons
  const addParticlesBtn = document.getElementById('addParticles');
  const clearParticlesBtn = document.getElementById('clearParticles');
  const explosionBtn = document.getElementById('explosion');
  
  addParticlesBtn?.addEventListener('click', () => {
    for (let i = 0; i < 20; i++) {
      particles.push(new Particle(
        Math.random() * (canvas.width / 2),
        Math.random() * (canvas.height / 2)
      ));
    }
    
    if (!animationId) animate();
  });
  
  clearParticlesBtn?.addEventListener('click', () => {
    particles.length = 0;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
  
  explosionBtn?.addEventListener('click', () => {
    const centerX = canvas.width / 4;
    const centerY = canvas.height / 4;
    
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      const particle = new Particle(centerX, centerY);
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particles.push(particle);
    }
    
    if (!animationId) animate();
    
    // Add confetti explosion
    if (window.confetti) {
      confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.6 }
      });
    }
  });
  
  // Start animation
  animate();
})();

/* ===== Voice Recorder ===== */
(function voiceRecorder() {
  const startRecordingBtn = $('#startRecording');
  const stopRecordingBtn = $('#stopRecording');
  const playRecordingBtn = $('#playRecording');
  const waveform = $('#waveform');
  const recordingTime = $('#recordingTime');
  
  let mediaRecorder;
  let audioChunks = [];
  let recordingStartTime;
  let recordingInterval;
  let recordedAudio;
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    logger.warn('Media recording not supported');
    return;
  }
  
  startRecordingBtn?.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        recordedAudio = URL.createObjectURL(audioBlob);
        playRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        startRecordingBtn.disabled = false;
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        clearInterval(recordingInterval);
        waveform.style.animationPlayState = 'paused';
      };
      
      mediaRecorder.start();
      recordingStartTime = Date.now();
      startRecordingBtn.disabled = true;
      stopRecordingBtn.disabled = false;
      playRecordingBtn.disabled = true;
      
      // Start timer
      recordingInterval = setInterval(() => {
        const elapsed = Date.now() - recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        recordingTime.textContent = `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
      }, 1000);
      
      waveform.style.animationPlayState = 'running';
      
    } catch (error) {
      logger.error('Error starting recording:', error);
      alert('Nie można rozpocząć nagrywania. Sprawdź uprawnienia mikrofonu.');
    }
  });
  
  stopRecordingBtn?.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });
  
  playRecordingBtn?.addEventListener('click', () => {
    if (recordedAudio) {
      const audio = new Audio(recordedAudio);
      audio.play();
    }
  });
})();

/* ===== Wish Garden ===== */
(function wishGarden() {
  const canvas = $('#gardenCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const plantWishBtn = $('#plantWish');
  const waterGardenBtn = $('#waterGarden');
  const harvestWishesBtn = $('#harvestWishes');
  
  const wishesPlantedEl = $('#wishesPlanted');
  const wishesBloomedEl = $('#wishesBloomed');
  const gardenLevelEl = $('#gardenLevel');
  
  let gardenData = {
    wishes: [],
    waterLevel: 100,
    level: 1,
    planted: 0,
    bloomed: 0
  };
  
  // Load garden data from localStorage
  try {
    const saved = localStorage.getItem('wishGarden');
    if (saved) {
      gardenData = { ...gardenData, ...JSON.parse(saved) };
      updateGardenStats();
    }
  } catch (e) {
    logger.warn('Could not load garden data:', e);
  }
  
  function saveGardenData() {
    try {
      localStorage.setItem('wishGarden', JSON.stringify(gardenData));
    } catch (e) {
      logger.warn('Could not save garden data:', e);
    }
  }
  
  function updateGardenStats() {
    if (wishesPlantedEl) wishesPlantedEl.textContent = gardenData.planted;
    if (wishesBloomedEl) wishesBloomedEl.textContent = gardenData.bloomed;
    if (gardenLevelEl) gardenLevelEl.textContent = gardenData.level;
  }
  
  class Wish {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.growth = 0;
      this.maxGrowth = 100;
      this.water = 50;
      this.type = Math.floor(Math.random() * 3); // 0: flower, 1: tree, 2: special
      this.colors = [
        ['#ff6b9d', '#ff4d6d', '#ffd166'], // Pink flower
        ['#4ecdc4', '#44a08d', '#096b72'], // Blue tree
        ['#ffd93d', '#ff6b6b', '#6bcf7f']  // Special rainbow
      ];
    }
    
    update() {
      if (this.growth < this.maxGrowth) {
        this.growth += 0.5;
        this.water -= 0.2;
      }
      
      if (this.water <= 0) {
        this.growth = Math.max(0, this.growth - 1);
      }
      
      if (this.growth >= this.maxGrowth && !this.bloomed) {
        this.bloomed = true;
        gardenData.bloomed++;
        updateGardenStats();
        saveGardenData();
      }
    }
    
    draw() {
      const alpha = this.growth / this.maxGrowth;
      const size = 10 + (this.growth / 10);
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (this.type === 0) { // Flower
        this.drawFlower(size);
      } else if (this.type === 1) { // Tree
        this.drawTree(size);
      } else { // Special
        this.drawSpecial(size);
      }
      
      ctx.restore();
    }
    
    drawFlower(size) {
      const colors = this.colors[0];
      
      // Stem
      ctx.strokeStyle = '#4a7c59';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y - size * 2);
      ctx.stroke();
      
      // Petals
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = this.x + Math.cos(angle) * size;
        const y = this.y - size * 2 + Math.sin(angle) * size;
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Center
      ctx.fillStyle = colors[1];
      ctx.beginPath();
      ctx.arc(this.x, this.y - size * 2, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    drawTree(size) {
      const colors = this.colors[1];
      
      // Trunk
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(this.x - size * 0.3, this.y - size * 0.5, size * 0.6, size);
      
      // Leaves
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc(this.x, this.y - size * 1.5, size * 1.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Fruits
      ctx.fillStyle = colors[2];
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = this.x + Math.cos(angle) * size * 0.8;
        const y = this.y - size * 1.5 + Math.sin(angle) * size * 0.8;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    drawSpecial(size) {
      const colors = this.colors[2];
      
      // Rainbow effect
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = this.x + Math.cos(angle) * size;
        const y = this.y - size * 1.5 + Math.sin(angle) * size;
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Sparkles
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const x = this.x + (Math.random() - 0.5) * size * 2;
        const y = this.y - size * 1.5 + (Math.random() - 0.5) * size * 2;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  function drawGarden() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2d5a27');
    gradient.addColorStop(1, '#1a3d1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grass
    ctx.fillStyle = '#4a7c59';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = canvas.height - Math.random() * 20;
      ctx.fillRect(x, y, 2, 20);
    }
    
    // Draw wishes
    gardenData.wishes.forEach(wish => {
      wish.update();
      wish.draw();
    });
    
    // Draw water level indicator
    ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
    ctx.fillRect(10, 10, 20, (canvas.height - 20) * (gardenData.waterLevel / 100));
    
    // Draw water level text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`💧 ${Math.round(gardenData.waterLevel)}%`, 35, 25);
  }
  
  function animate() {
    drawGarden();
    requestAnimationFrame(animate);
  }
  
  // Event listeners
  plantWishBtn?.addEventListener('click', () => {
    if (gardenData.wishes.length < 20) {
      const x = Math.random() * (canvas.width - 100) + 50;
      const y = canvas.height - 20;
      
      const wish = new Wish(x, y);
      gardenData.wishes.push(wish);
      gardenData.planted++;
      
      updateGardenStats();
      saveGardenData();
      
      // Add some water when planting
      gardenData.waterLevel = Math.min(100, gardenData.waterLevel + 10);
      
      // Confetti effect
      createParticleBurst(x, y, '#ff6b9d');
    }
  });
  
  waterGardenBtn?.addEventListener('click', () => {
    gardenData.waterLevel = Math.min(100, gardenData.waterLevel + 30);
    gardenData.wishes.forEach(wish => {
      wish.water = Math.min(100, wish.water + 20);
    });
    
    // Rain effect
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const x = Math.random() * canvas.width;
        const y = 0;
        createParticleBurst(x, y, '#00aaff');
      }, i * 100);
    }
  });
  
  harvestWishesBtn?.addEventListener('click', () => {
    const harvested = gardenData.wishes.filter(wish => wish.bloomed).length;
    if (harvested > 0) {
      gardenData.wishes = gardenData.wishes.filter(wish => !wish.bloomed);
      gardenData.bloomed = 0;
      
      // Level up
      gardenData.level += Math.floor(harvested / 5);
      
      updateGardenStats();
      saveGardenData();
      
      // Celebration effect
      for (let i = 0; i < harvested; i++) {
        setTimeout(() => {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          createParticleBurst(x, y, '#ffd166');
        }, i * 200);
      }
    }
  });
  
  // Canvas click to plant wishes
  canvas.addEventListener('click', (e) => {
    if (gardenData.wishes.length < 20) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const wish = new Wish(x, y);
      gardenData.wishes.push(wish);
      gardenData.planted++;
      
      updateGardenStats();
      saveGardenData();
      
      createParticleBurst(x, y, '#ff6b9d');
    }
  });
  
  // Start animation
  animate();
})();

/* ===== Love Weather ===== */
(function loveWeather() {
  const weatherIcon = $('#weatherIcon');
  const loveTemp = $('#loveTemp');
  const loveCondition = $('#loveCondition');
  const changeWeatherBtn = $('#changeWeather');
  const loveStormBtn = $('#loveStorm');
  const rainbowModeBtn = $('#rainbowMode');
  
  const weatherStates = [
    { icon: '☀️', temp: '25°C', condition: 'Słonecznie z miłością', color: '#ffd166' },
    { icon: '🌤️', temp: '22°C', condition: 'Lekko pochmurno, ale serce świeci', color: '#ffb3ba' },
    { icon: '⛅', temp: '20°C', condition: 'Półsłonecznie z nutką romansu', color: '#ff9a9e' },
    { icon: '🌧️', temp: '18°C', condition: 'Deszcz miłości pada z nieba', color: '#a8e6cf' },
    { icon: '🌈', temp: '30°C', condition: 'Tęczowo i magicznie', color: '#ff6b9d' },
    { icon: '❄️', temp: '15°C', condition: 'Zimno, ale serce gorące', color: '#b8e6ff' },
    { icon: '🌙', temp: '23°C', condition: 'Księżycowe światło miłości', color: '#c8a2c8' },
    { icon: '⭐', temp: '27°C', condition: 'Gwieździsta noc pełna marzeń', color: '#ffd700' }
  ];
  
  let currentWeather = 0;
  let isRainbowMode = false;
  let rainbowInterval;
  
  function updateWeather(index) {
    const weather = weatherStates[index];
    if (weatherIcon) weatherIcon.textContent = weather.icon;
    if (loveTemp) loveTemp.textContent = weather.temp;
    if (loveCondition) loveCondition.textContent = weather.condition;
    
    // Update temperature color
    if (loveTemp) loveTemp.style.color = weather.color;
    
    // Add weather effects
    document.body.style.setProperty('--weather-glow', weather.color);
  }
  
  function startRainbowMode() {
    if (isRainbowMode) return;
    
    isRainbowMode = true;
    rainbowModeBtn.style.background = 'var(--primary)';
    rainbowModeBtn.style.color = 'white';
    
    let hue = 0;
    rainbowInterval = setInterval(() => {
      hue = (hue + 1) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;
      
      if (loveTemp) loveTemp.style.color = color;
      if (loveCondition) loveCondition.style.color = color;
      
      // Add rainbow particles
      if (Math.random() < 0.3) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        createParticleBurst(x, y, color);
      }
    }, 100);
  }
  
  function stopRainbowMode() {
    if (!isRainbowMode) return;
    
    isRainbowMode = false;
    rainbowModeBtn.style.background = 'var(--glass)';
    rainbowModeBtn.style.color = 'var(--text)';
    
    clearInterval(rainbowInterval);
    
    // Reset colors
    updateWeather(currentWeather);
  }
  
  // Event listeners
  changeWeatherBtn?.addEventListener('click', () => {
    currentWeather = (currentWeather + 1) % weatherStates.length;
    updateWeather(currentWeather);
    
    // Weather change effect
    createParticleBurst(
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight,
      weatherStates[currentWeather].color
    );
  });
  
  loveStormBtn?.addEventListener('click', () => {
    // Create storm effect
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        createParticleBurst(x, y, '#00aaff');
      }, i * 100);
    }
    
    // Change to storm weather
    currentWeather = 3; // Rain
    updateWeather(currentWeather);
    
    // Add lightning effect
    document.body.style.filter = 'brightness(1.5)';
    setTimeout(() => {
      document.body.style.filter = 'brightness(1)';
    }, 200);
  });
  
  rainbowModeBtn?.addEventListener('click', () => {
    if (isRainbowMode) {
      stopRainbowMode();
    } else {
      startRainbowMode();
    }
  });
  
  // Initialize weather
  updateWeather(currentWeather);
  
  // Auto weather change every 30 seconds
  setInterval(() => {
    if (!isRainbowMode) {
      currentWeather = (currentWeather + 1) % weatherStates.length;
      updateWeather(currentWeather);
    }
  }, 30000);
})(); 

/* ===== Memory Gallery 3D ===== */
(function memoryGallery() {
  const prevMemoryBtn = $('#prevMemory');
  const nextMemoryBtn = $('#nextMemory');
  const autoPlayBtn = $('#autoPlay');
  const fullscreenBtn = $('#fullscreen');
  const memoryFrame = $('#memoryFrame');
  const memoryTitle = $('.memory-title');
  const memoryDescription = $('.memory-description');
  const memoryDate = $('.memory-date');
  const thumbnails = $$('.thumbnail');
  const totalMemoriesEl = $('#totalMemories');
  const memoryLikesEl = $('#memoryLikes');
  const memoryRatingEl = $('#memoryRating');
  
  const memories = [
    {
      icon: '💕',
      title: 'Nasze pierwsze spotkanie',
      description: 'Tego dnia wszystko się zmieniło. Twoje oczy rozświetliły mój świat i od tamtej chwili wiem, że życie bez Ciebie nie ma sensu.',
      date: '14 lutego 2024',
      likes: 0,
      rating: 5.0
    },
    {
      icon: '🌅',
      title: 'Wspólny poranek',
      description: 'Budzę się z myślą o Tobie. Każdy poranek jest piękniejszy, gdy wiem, że mogę Cię zobaczyć i usłyszeć Twój głos.',
      date: '15 lutego 2024',
      likes: 0,
      rating: 5.0
    },
    {
      icon: '🎭',
      title: 'Nasze przygody',
      description: 'Każdy dzień z Tobą to nowa przygoda. Wspólnie odkrywamy świat i tworzymy wspomnienia, które będą trwać wiecznie.',
      date: '16 lutego 2024',
      likes: 0,
      rating: 5.0
    },
    {
      icon: '🌸',
      title: 'Wiosenne spacery',
      description: 'Wiosna przyszła wcześnie w tym roku. Spacerujemy razem, trzymając się za ręce, a świat wokół nas kwitnie jak nasza miłość.',
      date: '17 lutego 2024',
      likes: 0,
      rating: 5.0
    },
    {
      icon: '🌙',
      title: 'Wieczorne rozmowy',
      description: 'Pod gwiazdami rozmawiamy o wszystkim i o niczym. Twoje słowa są muzyką dla moich uszu, a Twój śmiech rozświetla noc.',
      date: '18 lutego 2024',
      likes: 0,
      rating: 5.0
    }
  ];
  
  let currentMemoryIndex = 0;
  let isAutoPlaying = false;
  let autoPlayInterval;
  let isFullscreen = false;
  
  // Load saved data
  try {
    const savedMemories = localStorage.getItem('memoryGallery');
    if (savedMemories) {
      const parsed = JSON.parse(savedMemories);
      memories.forEach((memory, index) => {
        if (parsed[index]) {
          memory.likes = parsed[index].likes || 0;
          memory.rating = parsed[index].rating || 5.0;
        }
      });
    }
  } catch (e) {
    logger.warn('Could not load memory gallery data:', e);
  }
  
  function saveMemoryData() {
    try {
      const dataToSave = memories.map(memory => ({
        likes: memory.likes,
        rating: memory.rating
      }));
      localStorage.setItem('memoryGallery', JSON.stringify(dataToSave));
    } catch (e) {
      logger.warn('Could not save memory gallery data:', e);
    }
  }
  
  function updateMemoryDisplay() {
    const memory = memories[currentMemoryIndex];
    
    // Update main display
    if (memoryTitle) memoryTitle.textContent = memory.title;
    if (memoryDescription) memoryDescription.textContent = memory.description;
    if (memoryDate) memoryDate.textContent = memory.date;
    
    // Update placeholder image
    const placeholderImage = $('.placeholder-image');
    if (placeholderImage) placeholderImage.textContent = memory.icon;
    
    // Update thumbnails
    thumbnails.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === currentMemoryIndex);
    });
    
    // Update stats
    if (totalMemoriesEl) totalMemoriesEl.textContent = memories.length;
    if (memoryLikesEl) memoryLikesEl.textContent = memory.likes;
    if (memoryRatingEl) memoryRatingEl.textContent = memory.rating.toFixed(1);
    
    // Add transition effect
    if (memoryFrame) {
      memoryFrame.classList.add('transitioning');
      setTimeout(() => {
        memoryFrame.classList.remove('transitioning');
      }, 600);
    }
  }
  
  function nextMemory() {
    currentMemoryIndex = (currentMemoryIndex + 1) % memories.length;
    updateMemoryDisplay();
  }
  
  function prevMemory() {
    currentMemoryIndex = currentMemoryIndex === 0 ? memories.length - 1 : currentMemoryIndex - 1;
    updateMemoryDisplay();
  }
  
  function toggleAutoPlay() {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }
  
  function startAutoPlay() {
    isAutoPlaying = true;
    if (autoPlayBtn) {
      autoPlayBtn.textContent = '⏸️ Zatrzymaj';
      autoPlayBtn.style.background = 'var(--accent)';
    }
    
    autoPlayInterval = setInterval(() => {
      nextMemory();
    }, 3000);
  }
  
  function stopAutoPlay() {
    isAutoPlaying = false;
    if (autoPlayBtn) {
      autoPlayBtn.textContent = '▶️ Auto-odtwarzanie';
      autoPlayBtn.style.background = 'var(--primary)';
    }
    
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }
  }
  
  function toggleFullscreen() {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  }
  
  function enterFullscreen() {
    if (memoryFrame) {
      memoryFrame.classList.add('fullscreen');
      isFullscreen = true;
      if (fullscreenBtn) fullscreenBtn.textContent = '🔍 Wyjdź z pełnego ekranu';
    }
  }
  
  function exitFullscreen() {
    if (memoryFrame) {
      memoryFrame.classList.remove('fullscreen');
      isFullscreen = false;
      if (fullscreenBtn) fullscreenBtn.textContent = '🔍 Pełny ekran';
    }
  }
  
  function likeMemory() {
    memories[currentMemoryIndex].likes++;
    updateMemoryDisplay();
    saveMemoryData();
    
    // Add like effect
    createParticleBurst(
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight,
      '#ff4d6d'
    );
  }
  
  // Event listeners
  prevMemoryBtn?.addEventListener('click', () => {
    prevMemory();
    if (isAutoPlaying) stopAutoPlay();
  });
  
  nextMemoryBtn?.addEventListener('click', () => {
    nextMemory();
    if (isAutoPlaying) stopAutoPlay();
  });
  
  autoPlayBtn?.addEventListener('click', toggleAutoPlay);
  
  fullscreenBtn?.addEventListener('click', toggleFullscreen);
  
  // Thumbnail clicks
  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
      currentMemoryIndex = index;
      updateMemoryDisplay();
      if (isAutoPlaying) stopAutoPlay();
    });
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (isFullscreen) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevMemory();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextMemory();
          break;
        case 'Escape':
          e.preventDefault();
          exitFullscreen();
          break;
        case ' ':
          e.preventDefault();
          toggleAutoPlay();
          break;
      }
    }
  });
  
  // Memory frame click to like
  memoryFrame?.addEventListener('click', (e) => {
    // Don't trigger like if clicking on controls
    if (e.target.closest('.gallery-controls') || e.target.closest('.memory-thumbnails')) {
      return;
    }
    likeMemory();
  });
  
  // Double click to enter fullscreen
  memoryFrame?.addEventListener('dblclick', () => {
    if (!isFullscreen) {
      enterFullscreen();
    }
  });
  
  // Initialize
  updateMemoryDisplay();
  
  // Auto-advance on hover (subtle effect)
  let hoverTimeout;
  memoryFrame?.addEventListener('mouseenter', () => {
    if (!isAutoPlaying) {
      hoverTimeout = setTimeout(() => {
        nextMemory();
      }, 5000);
    }
  });
  
  memoryFrame?.addEventListener('mouseleave', () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  });
})();

/* ===== Love Calendar ===== */
(function loveCalendar() {
  const prevMonthBtn = $('#prevMonth');
  const nextMonthBtn = $('#nextMonth');
  const currentMonthEl = $('#currentMonth');
  const calendarDaysEl = $('#calendarDays');
  const eventsListEl = $('#eventsList');
  const addEventBtn = $('#addEvent');
  const daysTogetherEl = $('#daysTogether');
  const specialDaysEl = $('#specialDays');
  const totalEventsEl = $('#totalEvents');
  
  let currentDate = new Date();
  let selectedDate = new Date();
  let events = [];
  
  // Load events from localStorage
  try {
    const savedEvents = localStorage.getItem('loveCalendarEvents');
    if (savedEvents) {
      events = JSON.parse(savedEvents);
    }
  } catch (e) {
    logger.warn('Could not load calendar events:', e);
  }
  
  // Save events to localStorage
  function saveEvents() {
    try {
      localStorage.setItem('loveCalendarEvents', JSON.stringify(events));
    } catch (e) {
      logger.warn('Could not save calendar events:', e);
    }
  }
  
  // Calculate days together (since Valentine's Day 2024)
  function calculateDaysTogether() {
    const startDate = new Date('2024-02-14');
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  // Update calendar stats
  function updateStats() {
    const daysTogether = calculateDaysTogether();
    const specialDays = events.filter(event => event.type === 'special').length;
    const totalEvents = events.length;
    
    if (daysTogetherEl) daysTogetherEl.textContent = daysTogether;
    if (specialDaysEl) specialDaysEl.textContent = specialDays;
    if (totalEventsEl) totalEventsEl.textContent = totalEvents;
  }
  
  // Generate calendar for current month
  function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    
    if (currentMonthEl) currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + (firstDay.getDay() === 0 ? -6 : 1));
    
    // Clear previous calendar
    if (calendarDaysEl) calendarDaysEl.innerHTML = '';
    
    // Generate calendar days
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.textContent = date.getDate();
      
      // Check if it's today
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        dayEl.classList.add('today');
      }
      
      // Check if it's current month
      if (date.getMonth() !== month) {
        dayEl.classList.add('other-month');
      }
      
      // Check if it has events
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      if (dayEvents.length > 0) {
        dayEl.classList.add('has-event');
        
        // Add event indicator
        const indicator = document.createElement('div');
        indicator.className = 'event-indicator';
        dayEl.appendChild(indicator);
        
        // Check if it's a special day
        if (dayEvents.some(event => event.type === 'special')) {
          dayEl.classList.add('special');
        }
      }
      
      // Add click event
      dayEl.addEventListener('click', () => {
        selectedDate = date;
        showEventsForDate(date);
      });
      
      if (calendarDaysEl) calendarDaysEl.appendChild(dayEl);
    }
  }
  
  // Show events for selected date
  function showEventsForDate(date) {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    
    if (eventsListEl) {
      eventsListEl.innerHTML = '';
      
      if (dayEvents.length === 0) {
        const noEvents = document.createElement('div');
        noEvents.textContent = 'Brak wydarzeń w tym dniu';
        noEvents.style.textAlign = 'center';
        noEvents.style.color = 'var(--muted)';
        noEvents.style.padding = '1rem';
        eventsListEl.appendChild(noEvents);
      } else {
        dayEvents.forEach(event => {
          const eventEl = createEventElement(event);
          eventsListEl.appendChild(eventEl);
        });
      }
    }
  }
  
  // Create event element
  function createEventElement(event) {
    const eventEl = document.createElement('div');
    eventEl.className = 'event-item';
    
    const icon = document.createElement('div');
    icon.className = 'event-icon';
    icon.textContent = getEventIcon(event.type);
    
    const details = document.createElement('div');
    details.className = 'event-details';
    
    const title = document.createElement('div');
    title.className = 'event-title';
    title.textContent = event.title;
    
    const date = document.createElement('div');
    date.className = 'event-date';
    date.textContent = new Date(event.date).toLocaleDateString('pl-PL');
    
    details.appendChild(title);
    details.appendChild(date);
    
    const actions = document.createElement('div');
    actions.className = 'event-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'event-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edytuj';
    editBtn.addEventListener('click', () => editEvent(event));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'event-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Usuń';
    deleteBtn.addEventListener('click', () => deleteEvent(event));
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    eventEl.appendChild(icon);
    eventEl.appendChild(details);
    eventEl.appendChild(actions);
    
    return eventEl;
  }
  
  // Get event icon based on type
  function getEventIcon(type) {
    const icons = {
      'date': '💕',
      'anniversary': '🎉',
      'special': '⭐',
      'reminder': '📝',
      'gift': '🎁',
      'travel': '✈️',
      'dinner': '🍽️',
      'movie': '🎬',
      'other': '📅'
    };
    return icons[type] || icons.other;
  }
  
  // Add new event
  function addEvent() {
    showEventModal();
  }
  
  // Edit event
  function editEvent(event) {
    showEventModal(event);
  }
  
  // Delete event
  function deleteEvent(event) {
    if (confirm('Czy na pewno chcesz usunąć to wydarzenie?')) {
      const index = events.findIndex(e => e.id === event.id);
      if (index > -1) {
        events.splice(index, 1);
        saveEvents();
        generateCalendar();
        showEventsForDate(selectedDate);
        updateStats();
      }
    }
  }
  
  // Show event modal
  function showEventModal(event = null) {
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    modal.innerHTML = `
      <div class="event-modal-content">
        <h3>${event ? 'Edytuj wydarzenie' : 'Dodaj nowe wydarzenie'}</h3>
        <form class="event-form" id="eventForm">
          <div class="form-group">
            <label for="eventTitle">Tytuł</label>
            <input type="text" id="eventTitle" required value="${event ? event.title : ''}">
          </div>
          <div class="form-group">
            <label for="eventDate">Data</label>
            <input type="date" id="eventDate" required value="${event ? event.date : ''}">
          </div>
          <div class="form-group">
            <label for="eventType">Typ</label>
            <select id="eventType">
              <option value="date" ${event && event.type === 'date' ? 'selected' : ''}>Randka</option>
              <option value="anniversary" ${event && event.type === 'anniversary' ? 'selected' : ''}>Rocznica</option>
              <option value="special" ${event && event.type === 'special' ? 'selected' : ''}>Specjalne</option>
              <option value="reminder" ${event && event.type === 'reminder' ? 'selected' : ''}>Przypomnienie</option>
              <option value="gift" ${event && event.type === 'gift' ? 'selected' : ''}>Prezent</option>
              <option value="travel" ${event && event.type === 'travel' ? 'selected' : ''}>Podróż</option>
              <option value="dinner" ${event && event.type === 'dinner' ? 'selected' : ''}>Kolacja</option>
              <option value="movie" ${event && event.type === 'movie' ? 'selected' : ''}>Film</option>
              <option value="other" ${event && event.type === 'other' ? 'selected' : ''}>Inne</option>
            </select>
          </div>
          <div class="form-group">
            <label for="eventDescription">Opis (opcjonalnie)</label>
            <textarea id="eventDescription" rows="3">${event ? event.description || '' : ''}</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn ghost" onclick="this.closest('.event-modal').remove()">Anuluj</button>
            <button type="submit" class="btn primary">${event ? 'Zapisz' : 'Dodaj'}</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Handle form submission
    const form = modal.querySelector('#eventForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const eventData = {
        id: event ? event.id : Date.now().toString(),
        title: formData.get('eventTitle') || form.querySelector('#eventTitle').value,
        date: formData.get('eventDate') || form.querySelector('#eventDate').value,
        type: formData.get('eventType') || form.querySelector('#eventType').value,
        description: formData.get('eventDescription') || form.querySelector('#eventDescription').value
      };
      
      if (event) {
        // Edit existing event
        const index = events.findIndex(e => e.id === event.id);
        if (index > -1) {
          events[index] = eventData;
        }
      } else {
        // Add new event
        events.push(eventData);
      }
      
      saveEvents();
      generateCalendar();
      showEventsForDate(selectedDate);
      updateStats();
      
      // Close modal
      modal.remove();
      
      // Confetti effect
      createParticleBurst(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        '#ff4d6d'
      );
    });
  }
  
  // Navigate to previous month
  function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
    showEventsForDate(selectedDate);
  }
  
  // Navigate to next month
  function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
    showEventsForDate(selectedDate);
  }
  
  // Event listeners
  prevMonthBtn?.addEventListener('click', prevMonth);
  nextMonthBtn?.addEventListener('click', nextMonth);
  addEventBtn?.addEventListener('click', addEvent);
  
  // Initialize calendar
  generateCalendar();
  updateStats();
  
  // Show events for today
  showEventsForDate(new Date());
})();

/* ===== Love Quiz ===== */
(function loveQuiz() {
  const startQuizBtn = $('#startQuiz');
  const nextQuestionBtn = $('#nextQuestion');
  const restartQuizBtn = $('#restartQuiz');
  const quizProgressEl = $('#quizProgress');
  const quizProgressTextEl = $('#quizProgressText');
  const quizScoreEl = $('#quizScore');
  const quizContentEl = $('#quizContent');
  const questionTextEl = $('#questionText');
  const questionOptionsEl = $('#questionOptions');
  const quizResultsEl = $('#quizResults');
  const finalScoreEl = $('#finalScore');
  const resultsMessageEl = $('#resultsMessage');
  const resultsBreakdownEl = $('#resultsBreakdown');
  const quizAttemptsEl = $('#quizAttempts');
  const bestScoreEl = $('#bestScore');
  const averageScoreEl = $('#averageScore');
  
  const questions = [
    {
      question: "Co jest najważniejsze w związku?",
      options: [
        "Wspólne zainteresowania",
        "Zaufanie i komunikacja",
        "Podobny styl życia",
        "Wspólne plany na przyszłość"
      ],
      correct: 1,
      explanation: "Zaufanie i komunikacja to fundamenty każdego udanego związku."
    },
    {
      question: "Jak najlepiej rozwiązywać konflikty?",
      options: [
        "Unikać ich za wszelką cenę",
        "Rozmawiać otwarcie i szukać kompromisu",
        "Czekać aż same się rozwiążą",
        "Zawsze ustępować partnerowi"
      ],
      correct: 1,
      explanation: "Otwarta komunikacja i kompromis to klucz do rozwiązywania konfliktów."
    },
    {
      question: "Co oznacza prawdziwa miłość?",
      options: [
        "Zawsze być razem",
        "Akceptować partnera takim jakim jest",
        "Mieć te same poglądy",
        "Spędzać każdą wolną chwilę razem"
      ],
      correct: 1,
      explanation: "Prawdziwa miłość to akceptacja i wsparcie partnera."
    },
    {
      question: "Jak dbać o związek na co dzień?",
      options: [
        "Tylko w święta i rocznice",
        "Małymi gestami każdego dnia",
        "Dużymi prezentami",
        "Tylko gdy partner o to poprosi"
      ],
      correct: 1,
      explanation: "Małe, codzienne gesty są najważniejsze w utrzymaniu związku."
    },
    {
      question: "Co robić gdy partner ma gorszy dzień?",
      options: [
        "Zostawić go w spokoju",
        "Być przy nim i wspierać",
        "Opowiadać o swoich problemach",
        "Krytykować jego zachowanie"
      ],
      correct: 1,
      explanation: "Wsparcie i obecność to najlepsze co możemy dać partnerowi."
    },
    {
      question: "Jak ważne jest spędzanie czasu razem?",
      options: [
        "Wcale nie ważne",
        "Bardzo ważne, ale nie najważniejsze",
        "Kluczowe dla związku",
        "Tylko w weekendy"
      ],
      correct: 2,
      explanation: "Jakościowy czas razem to podstawa udanego związku."
    },
    {
      question: "Co zrobić gdy brakuje nam słów?",
      options: [
        "Nic nie mówić",
        "Użyć gestów i dotyku",
        "Zmienić temat",
        "Udać że wszystko jest w porządku"
      ],
      correct: 1,
      explanation: "Czasem gesty mówią więcej niż słowa."
    },
    {
      question: "Jak ważne jest dbanie o siebie w związku?",
      options: [
        "Wcale nie ważne",
        "Ważne, ale nie priorytet",
        "Bardzo ważne dla obu stron",
        "Tylko na początku związku"
      ],
      correct: 2,
      explanation: "Dbanie o siebie pozwala być lepszym partnerem."
    },
    {
      question: "Co robić gdy partner ma inne zdanie?",
      options: [
        "Przekonywać go do swoich racji",
        "Słuchać i szanować jego punkt widzenia",
        "Ignorować różnice",
        "Kłócić się do skutku"
      ],
      correct: 1,
      explanation: "Różnice w poglądach mogą wzbogacać związek."
    },
    {
      question: "Jakie jest najpiękniejsze w miłości?",
      options: [
        "Prezenty i podróże",
        "Wspólne marzenia i plany",
        "Codzienna obecność i wsparcie",
        "Wszystkie powyższe"
      ],
      correct: 3,
      explanation: "Miłość to połączenie wszystkich tych elementów!"
    }
  ];
  
  let currentQuestion = 0;
  let score = 0;
  let selectedAnswer = null;
  let quizStarted = false;
  let quizStats = {
    attempts: 0,
    bestScore: 0,
    totalScore: 0,
    averageScore: 0
  };
  
  // Load quiz stats from localStorage
  try {
    const savedStats = localStorage.getItem('loveQuizStats');
    if (savedStats) {
      quizStats = { ...quizStats, ...JSON.parse(savedStats) };
      updateQuizStats();
    }
  } catch (e) {
    logger.warn('Could not load quiz stats:', e);
  }
  
  // Save quiz stats to localStorage
  function saveQuizStats() {
    try {
      localStorage.setItem('loveQuizStats', JSON.stringify(quizStats));
    } catch (e) {
      logger.warn('Could not save quiz stats:', e);
    }
  }
  
  // Update quiz stats display
  function updateQuizStats() {
    if (quizAttemptsEl) quizAttemptsEl.textContent = quizStats.attempts;
    if (bestScoreEl) bestScoreEl.textContent = quizStats.bestScore;
    if (averageScoreEl) averageScoreEl.textContent = quizStats.averageScore.toFixed(1);
  }
  
  // Start quiz
  function startQuiz() {
    quizStarted = true;
    currentQuestion = 0;
    score = 0;
    selectedAnswer = null;
    
    if (startQuizBtn) startQuizBtn.style.display = 'none';
    if (nextQuestionBtn) nextQuestionBtn.style.display = 'none';
    if (restartQuizBtn) restartQuizBtn.style.display = 'none';
    if (quizResultsEl) quizResultsEl.style.display = 'none';
    
    showQuestion();
  }
  
  // Show current question
  function showQuestion() {
    const question = questions[currentQuestion];
    
    if (questionTextEl) questionTextEl.textContent = question.question;
    
    // Update progress
    if (quizProgressEl) {
      const progress = ((currentQuestion + 1) / questions.length) * 100;
      quizProgressEl.style.width = `${progress}%`;
    }
    
    if (quizProgressTextEl) {
      quizProgressTextEl.textContent = `Pytanie ${currentQuestion + 1} z ${questions.length}`;
    }
    
    // Generate options
    if (questionOptionsEl) {
      questionOptionsEl.innerHTML = '';
      
      question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'quiz-option';
        optionEl.textContent = option;
        
        optionEl.addEventListener('click', () => selectAnswer(index));
        
        questionOptionsEl.appendChild(optionEl);
      });
    }
    
    // Add fade-in animation
    if (quizContentEl) {
      quizContentEl.classList.add('fade-in');
      setTimeout(() => {
        quizContentEl.classList.remove('fade-in');
      }, 500);
    }
  }
  
  // Select answer
  function selectAnswer(answerIndex) {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    
    selectedAnswer = answerIndex;
    const question = questions[currentQuestion];
    const options = questionOptionsEl.querySelectorAll('.quiz-option');
    
    // Mark selected answer
    options[answerIndex].classList.add('selected');
    
    // Check if correct
    if (answerIndex === question.correct) {
      options[answerIndex].classList.add('correct');
      score++;
      
      // Confetti effect for correct answer
      createParticleBurst(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        '#4caf50'
      );
    } else {
      options[answerIndex].classList.add('incorrect');
      options[question.correct].classList.add('correct');
    }
    
    // Update score display
    if (quizScoreEl) quizScoreEl.textContent = score;
    
    // Show next question button
    if (nextQuestionBtn) {
      nextQuestionBtn.style.display = 'inline-block';
      nextQuestionBtn.textContent = currentQuestion === questions.length - 1 ? '🏁 Zakończ quiz' : '⏭️ Następne pytanie';
    }
  }
  
  // Next question or finish quiz
  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      selectedAnswer = null;
      showQuestion();
      
      if (nextQuestionBtn) nextQuestionBtn.style.display = 'none';
    } else {
      finishQuiz();
    }
  }
  
  // Finish quiz and show results
  function finishQuiz() {
    quizStarted = false;
    
    // Update stats
    quizStats.attempts++;
    quizStats.totalScore += score;
    quizStats.averageScore = quizStats.totalScore / quizStats.attempts;
    
    if (score > quizStats.bestScore) {
      quizStats.bestScore = score;
    }
    
    saveQuizStats();
    updateQuizStats();
    
    // Hide quiz content
    if (quizContentEl) quizContentEl.style.display = 'none';
    if (nextQuestionBtn) nextQuestionBtn.style.display = 'none';
    
    // Show results
    if (quizResultsEl) {
      quizResultsEl.style.display = 'block';
      
      if (finalScoreEl) finalScoreEl.textContent = score;
      
      // Generate result message
      let message = '';
      if (score === questions.length) {
        message = '🎉 Doskonały wynik! Jesteś ekspertem w dziedzinie miłości! 💕';
      } else if (score >= questions.length * 0.8) {
        message = '🌟 Świetny wynik! Masz dużą wiedzę o miłości i związkach! 💖';
      } else if (score >= questions.length * 0.6) {
        message = '✨ Dobry wynik! Wiesz sporo o miłości, ale zawsze można się więcej nauczyć! 💝';
      } else if (score >= questions.length * 0.4) {
        message = '💫 Nieźle! Masz podstawową wiedzę o miłości, ale warto ją poszerzyć! 💕';
      } else {
        message = '💝 Każdy wynik jest dobry! Miłość to nauka przez całe życie! 🌱';
      }
      
      if (resultsMessageEl) resultsMessageEl.textContent = message;
      
      // Generate breakdown
      if (resultsBreakdownEl) {
        resultsBreakdownEl.innerHTML = '';
        
        const breakdownData = [
          { label: 'Poprawne odpowiedzi', value: score },
          { label: 'Błędne odpowiedzi', value: questions.length - score },
          { label: 'Procent poprawnych', value: `${Math.round((score / questions.length) * 100)}%` },
          { label: 'Poziom wiedzy', value: getKnowledgeLevel(score) }
        ];
        
        breakdownData.forEach(item => {
          const breakdownEl = document.createElement('div');
          breakdownEl.className = 'breakdown-item';
          
          breakdownEl.innerHTML = `
            <div class="breakdown-label">${item.label}</div>
            <div class="breakdown-value">${item.value}</div>
          `;
          
          resultsBreakdownEl.appendChild(breakdownEl);
        });
      }
    }
    
    // Show restart button
    if (restartQuizBtn) restartQuizBtn.style.display = 'inline-block';
    
    // Celebration effect
    createParticleBurst(
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight,
      '#ff4d6d'
    );
  }
  
  // Get knowledge level based on score
  function getKnowledgeLevel(score) {
    const percentage = (score / questions.length) * 100;
    
    if (percentage >= 90) return 'Ekspert 💎';
    if (percentage >= 80) return 'Zaawansowany 🌟';
    if (percentage >= 70) return 'Średniozaawansowany ✨';
    if (percentage >= 60) return 'Początkujący 🌱';
    if (percentage >= 40) return 'Nowicjusz 💫';
    return 'Uczeń 💝';
  }
  
  // Restart quiz
  function restartQuiz() {
    if (quizContentEl) quizContentEl.style.display = 'block';
    if (quizResultsEl) quizResultsEl.style.display = 'none';
    if (restartQuizBtn) restartQuizBtn.style.display = 'none';
    
    startQuiz();
  }
  
  // Event listeners
  startQuizBtn?.addEventListener('click', startQuiz);
  nextQuestionBtn?.addEventListener('click', nextQuestion);
  restartQuizBtn?.addEventListener('click', restartQuiz);
  
  // Initialize
  updateQuizStats();
})();

/* ===== Love Map ===== */
(function loveMap() {
  const addLocationBtn = $('#addLocation');
  const showAllLocationsBtn = $('#showAllLocations');
  const clearMapBtn = $('#clearMap');
  const exportMapBtn = $('#exportMap');
  const canvas = $('#loveMapCanvas');
  const mapInfo = $('#mapInfo');
  const locationsList = $('#locationsList');
  const totalLocationsEl = $('#totalLocations');
  const favoriteLocationEl = $('#favoriteLocation');
  const mapRatingEl = $('#mapRating');
  
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let locations = [];
  let selectedLocation = null;
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  
  // Load locations from localStorage
  try {
    const savedLocations = localStorage.getItem('loveMapLocations');
    if (savedLocations) {
      locations = JSON.parse(savedLocations);
    }
  } catch (e) {
    logger.warn('Could not load map locations:', e);
  }
  
  // Save locations to localStorage
  function saveLocations() {
    try {
      localStorage.setItem('loveMapLocations', JSON.stringify(locations));
    } catch (e) {
      logger.warn('Could not save map locations:', e);
    }
  }
  
  // Update map stats
  function updateMapStats() {
    if (totalLocationsEl) totalLocationsEl.textContent = locations.length;
    
    const favorite = locations.find(loc => loc.favorite);
    if (favoriteLocationEl) {
      favoriteLocationEl.textContent = favorite ? favorite.name : '-';
    }
    
    if (mapRatingEl && locations.length > 0) {
      const avgRating = locations.reduce((sum, loc) => sum + (loc.rating || 5), 0) / locations.length;
      mapRatingEl.textContent = avgRating.toFixed(1);
    }
  }
  
  // Draw map background
  function drawMapBackground() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw some decorative elements
    drawStars();
  }
  
  // Draw decorative stars
  function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 1;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Draw location pin
  function drawLocationPin(location, isSelected = false) {
    const x = location.x;
    const y = location.y;
    
    ctx.save();
    
    // Draw pin shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pin
    const pinGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
    if (location.favorite) {
      pinGradient.addColorStop(0, '#ffd166');
      pinGradient.addColorStop(1, '#ffb347');
    } else {
      pinGradient.addColorStop(0, '#ff4d6d');
      pinGradient.addColorStop(1, '#ff6b9d');
    }
    
    ctx.fillStyle = pinGradient;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pin border
    ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw pin icon
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(location.icon || '📍', x, y);
    
    // Draw location name if selected
    if (isSelected) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(location.name, x, y + 25);
    }
    
    ctx.restore();
  }
  
  // Draw all locations
  function drawLocations() {
    locations.forEach(location => {
      const isSelected = selectedLocation && selectedLocation.id === location.id;
      drawLocationPin(location, isSelected);
    });
  }
  
  // Redraw map
  function redrawMap() {
    drawMapBackground();
    drawLocations();
  }
  
  // Check if point is inside location pin
  function isPointInLocation(x, y, location) {
    const dx = x - location.x;
    const dy = y - location.y;
    return Math.sqrt(dx * dx + dy * dy) <= 15;
  }
  
  // Get location at point
  function getLocationAtPoint(x, y) {
    return locations.find(location => isPointInLocation(x, y, location));
  }
  
  // Show location details
  function showLocationDetails(location) {
    if (mapInfo) {
      mapInfo.innerHTML = `
        <h4>${location.name}</h4>
        <p>${location.description}</p>
        <p><small>${new Date(location.date).toLocaleDateString('pl-PL')}</small></p>
        <p><small>Ocena: ${location.rating || 5}/5 ⭐</small></p>
      `;
    }
  }
  
  // Clear location details
  function clearLocationDetails() {
    if (mapInfo) {
      mapInfo.innerHTML = `
        <h4>Kliknij na miejsce aby zobaczyć szczegóły</h4>
        <p>Lub dodaj nowe miejsce miłości</p>
      `;
    }
  }
  
  // Update locations list
  function updateLocationsList() {
    if (!locationsList) return;
    
    locationsList.innerHTML = '';
    
    if (locations.length === 0) {
      const noLocations = document.createElement('div');
      noLocations.textContent = 'Brak dodanych miejsc';
      noLocations.style.textAlign = 'center';
      noLocations.style.color = 'var(--muted)';
      noLocations.style.padding = '1rem';
      locationsList.appendChild(noLocations);
      return;
    }
    
    locations.forEach(location => {
      const locationEl = createLocationElement(location);
      locationsList.appendChild(locationEl);
    });
  }
  
  // Create location element
  function createLocationElement(location) {
    const locationEl = document.createElement('div');
    locationEl.className = `location-item ${location.favorite ? 'favorite' : ''}`;
    
    const icon = document.createElement('div');
    icon.className = 'location-icon';
    icon.textContent = location.icon || '📍';
    
    const details = document.createElement('div');
    details.className = 'location-details';
    
    const name = document.createElement('div');
    name.className = 'location-name';
    name.textContent = location.name;
    
    const description = document.createElement('div');
    description.className = 'location-description';
    description.textContent = location.description;
    
    const date = document.createElement('div');
    date.className = 'location-date';
    date.textContent = new Date(location.date).toLocaleDateString('pl-PL');
    
    details.appendChild(name);
    details.appendChild(description);
    details.appendChild(date);
    
    const actions = document.createElement('div');
    actions.className = 'location-actions';
    
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `location-btn ${location.favorite ? 'favorite' : ''}`;
    favoriteBtn.innerHTML = location.favorite ? '⭐' : '☆';
    favoriteBtn.title = location.favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych';
    favoriteBtn.addEventListener('click', () => toggleFavorite(location));
    
    const editBtn = document.createElement('button');
    editBtn.className = 'location-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edytuj';
    editBtn.addEventListener('click', () => editLocation(location));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'location-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Usuń';
    deleteBtn.addEventListener('click', () => deleteLocation(location));
    
    actions.appendChild(favoriteBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    locationEl.appendChild(icon);
    locationEl.appendChild(details);
    locationEl.appendChild(actions);
    
    // Click to select on map
    locationEl.addEventListener('click', () => {
      selectedLocation = location;
      redrawMap();
      showLocationDetails(location);
      
      // Scroll map to location
      canvas.scrollIntoView({ behavior: 'smooth' });
    });
    
    return locationEl;
  }
  
  // Toggle favorite status
  function toggleFavorite(location) {
    location.favorite = !location.favorite;
    saveLocations();
    updateLocationsList();
    updateMapStats();
    redrawMap();
  }
  
  // Edit location
  function editLocation(location) {
    showLocationModal(location);
  }
  
  // Delete location
  function deleteLocation(location) {
    if (confirm('Czy na pewno chcesz usunąć to miejsce?')) {
      const index = locations.findIndex(loc => loc.id === location.id);
      if (index > -1) {
        locations.splice(index, 1);
        saveLocations();
        updateLocationsList();
        updateMapStats();
        redrawMap();
        
        if (selectedLocation && selectedLocation.id === location.id) {
          selectedLocation = null;
          clearLocationDetails();
        }
      }
    }
  }
  
  // Add new location
  function addLocation() {
    showLocationModal();
  }
  
  // Show location modal
  function showLocationModal(location = null) {
    const modal = document.createElement('div');
    modal.className = 'location-modal';
    modal.innerHTML = `
      <div class="location-modal-content">
        <h3>${location ? 'Edytuj miejsce' : 'Dodaj nowe miejsce miłości'}</h3>
        <form class="location-form" id="locationForm">
          <div class="form-row">
            <div class="form-group">
              <label for="locationName">Nazwa miejsca</label>
              <input type="text" id="locationName" required value="${location ? location.name : ''}">
            </div>
            <div class="form-group">
              <label for="locationIcon">Ikona</label>
              <select id="locationIcon">
                <option value="📍" ${location && location.icon === '📍' ? 'selected' : ''}>📍 Pin</option>
                <option value="💕" ${location && location.icon === '💕' ? 'selected' : ''}>💕 Serce</option>
                <option value="🌹" ${location && location.icon === '🌹' ? 'selected' : ''}>🌹 Róża</option>
                <option value="⭐" ${location && location.icon === '⭐' ? 'selected' : ''}>⭐ Gwiazda</option>
                <option value="🎭" ${location && location.icon === '🎭' ? 'selected' : ''}>🎭 Teatr</option>
                <option value="🍽️" ${location && location.icon === '🍽️' ? 'selected' : ''}>🍽️ Restauracja</option>
                <option value="🏖️" ${location && location.icon === '🏖️' ? 'selected' : ''}>🏖️ Plaża</option>
                <option value="🏔️" ${location && location.icon === '🏔️' ? 'selected' : ''}>🏔️ Góry</option>
              </select>
            </div>
          </div>
          <div class="form-row full-width">
            <div class="form-group">
              <label for="locationDescription">Opis</label>
              <textarea id="locationDescription" rows="3" required>${location ? location.description : ''}</textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="locationDate">Data</label>
              <input type="date" id="locationDate" required value="${location ? location.date : ''}">
            </div>
            <div class="form-group">
              <label for="locationRating">Ocena (1-5)</label>
              <input type="number" id="locationRating" min="1" max="5" value="${location ? location.rating || 5 : 5}">
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn ghost" onclick="this.closest('.location-modal').remove()">Anuluj</button>
            <button type="submit" class="btn primary">${location ? 'Zapisz' : 'Dodaj'}</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Handle form submission
    const form = modal.querySelector('#locationForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const locationData = {
        id: location ? location.id : Date.now().toString(),
        name: formData.get('locationName') || form.querySelector('#locationName').value,
        icon: formData.get('locationIcon') || form.querySelector('#locationIcon').value,
        description: formData.get('locationDescription') || form.querySelector('#locationDescription').value,
        date: formData.get('locationDate') || form.querySelector('#locationDate').value,
        rating: parseInt(formData.get('locationRating') || form.querySelector('#locationRating').value),
        favorite: location ? location.favorite : false
      };
      
      if (location) {
        // Edit existing location
        const index = locations.findIndex(loc => loc.id === location.id);
        if (index > -1) {
          locations[index] = locationData;
        }
      } else {
        // Add new location - will be positioned on click
        locationData.x = canvas.width / 2;
        locationData.y = canvas.height / 2;
        locations.push(locationData);
      }
      
      saveLocations();
      updateLocationsList();
      updateMapStats();
      redrawMap();
      
      // Close modal
      modal.remove();
      
      // Confetti effect
      createParticleBurst(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        '#ff4d6d'
      );
    });
  }
  
  // Show all locations
  function showAllLocations() {
    if (locations.length === 0) {
      alert('Brak dodanych miejsc na mapie!');
      return;
    }
    
    // Highlight all locations briefly
    locations.forEach((location, index) => {
      setTimeout(() => {
        selectedLocation = location;
        redrawMap();
        showLocationDetails(location);
      }, index * 500);
    });
    
    // Clear selection after showing all
    setTimeout(() => {
      selectedLocation = null;
      redrawMap();
      clearLocationDetails();
    }, locations.length * 500 + 1000);
  }
  
  // Clear map
  function clearMap() {
    if (confirm('Czy na pewno chcesz wyczyścić całą mapę? Ta operacja nie może być cofnięta.')) {
      locations = [];
      selectedLocation = null;
      saveLocations();
      updateLocationsList();
      updateMapStats();
      redrawMap();
      clearLocationDetails();
    }
  }
  
  // Export map data
  function exportMap() {
    if (locations.length === 0) {
      alert('Brak miejsc do eksportu!');
      return;
    }
    
    const dataStr = JSON.stringify(locations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'love-map-data.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  // Canvas event listeners
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedLocation = getLocationAtPoint(x, y);
    
    if (clickedLocation) {
      selectedLocation = clickedLocation;
      redrawMap();
      showLocationDetails(clickedLocation);
    } else {
      // Add new location at click position
      if (confirm('Czy chcesz dodać nowe miejsce w tym miejscu?')) {
        const newLocation = {
          id: Date.now().toString(),
          name: 'Nowe miejsce',
          icon: '📍',
          description: 'Opis miejsca',
          date: new Date().toISOString().split('T')[0],
          rating: 5,
          favorite: false,
          x: x,
          y: y
        };
        
        locations.push(newLocation);
        saveLocations();
        updateLocationsList();
        updateMapStats();
        redrawMap();
        
        // Edit the new location
        setTimeout(() => {
          showLocationModal(newLocation);
        }, 100);
      }
    }
  });
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hoveredLocation = getLocationAtPoint(x, y);
    
    if (hoveredLocation) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  });
  
  // Event listeners
  addLocationBtn?.addEventListener('click', addLocation);
  showAllLocationsBtn?.addEventListener('click', showAllLocations);
  clearMapBtn?.addEventListener('click', clearMap);
  exportMapBtn?.addEventListener('click', exportMap);
  
  // Initialize map
  redrawMap();
  updateLocationsList();
  updateMapStats();
})();