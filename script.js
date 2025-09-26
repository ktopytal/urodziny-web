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
  const gameContainer = document.getElementById('loveGame');
  if (!gameContainer) return;

  const gameHearts = gameContainer.querySelector('.game-hearts');
  const gameScore = gameContainer.querySelector('#gameScore');
  const gameArea = gameContainer.querySelector('.game-area');
  
  let score = 0;
  let timer;
  let gameStarted = false;

  function createStartButton() {
    const startButton = document.createElement('button');
    startButton.textContent = 'Zacznij grę';
    startButton.className = 'btn primary';
    startButton.style.marginTop = '20px';
    gameArea.appendChild(startButton);

    startButton.addEventListener('click', startGame);
  }

  function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    score = 0;
    gameScore.textContent = score;
    gameArea.querySelector('button').remove();
    
    createGameHearts();

    timer = setTimeout(() => {
      endGame();
    }, 30000);
  }

  function endGame() {
    gameStarted = false;
    clearTimeout(timer);
    gameHearts.innerHTML = `<p>Koniec gry! Twój wynik to: ${score}</p>`;
    createStartButton();
  }

  function createGameHearts() {
    if (!gameStarted) return;
    gameHearts.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const isGolden = Math.random() < 0.2;
      const heart = document.createElement('div');
      heart.className = 'game-heart' + (isGolden ? ' golden' : '');
      heart.style.animationDelay = `${Math.random() * 2}s`;
      heart.style.animation = 'heart-float 3s ease-in-out infinite';
      
      heart.addEventListener('click', () => {
        if (!heart.classList.contains('clicked') && gameStarted) {
          heart.classList.add('clicked');
          const points = isGolden ? 50 : 10;
          score += points;
          gameScore.textContent = score;
          
          playBeep(isGolden ? 1200 : 800, 0.1, 'triangle');

          if (window.gsap) {
            const tl = gsap.timeline();
            tl.to(heart, {
              scale: 1.5,
              opacity: 0,
              duration: 0.3,
              ease: 'power2.out',
              onComplete: () => heart.remove()
            });
            tl.to(gameScore, {
              scale: 1.3,
              duration: 0.3,
              ease: 'back.out(2)',
              yoyo: true,
              repeat: 1
            }, "<0.1");
          } else {
            heart.remove();
          }

          if (gameHearts.children.length === 0) {
            setTimeout(createGameHearts, 500);
          }
        }
      });
      
      gameHearts.appendChild(heart);
    }
  }
  
  createStartButton();
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
  });
  
  clearParticlesBtn?.addEventListener('click', () => {
    particles.length = 0;
  });
  
  explosionBtn?.addEventListener('click', () => {
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle(
        canvas.width / 4,
        canvas.height / 4
      ));
    }
  });
  
  animate();
})();

/* ===== Wish Garden ===== */
(function wishGarden() {
  const gardenCanvas = document.getElementById('gardenCanvas');
  if (!gardenCanvas) return;

  const ctx = gardenCanvas.getContext('2d');
  const plantWishBtn = document.getElementById('plantWish');
  const waterGardenBtn = document.getElementById('waterGarden');
  const harvestWishesBtn = document.getElementById('harvestWishes');
  const wishesPlantedEl = document.getElementById('wishesPlanted');
  const wishesBloomedEl = document.getElementById('wishesBloomed');
  const gardenLevelEl = document.getElementById('gardenLevel');

  let wishes = [];
  let gardenLevel = 1;

  function draw() {
    ctx.clearRect(0, 0, gardenCanvas.width, gardenCanvas.height);
    wishes.forEach(wish => {
      ctx.save();
      ctx.translate(wish.x, wish.y);
      if (wish.state === 'seed') {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (wish.state === 'flower') {
        ctx.fillStyle = wish.color;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(Math.cos(i * 2 * Math.PI / 5) * 10, Math.sin(i * 2 * Math.PI / 5) * 10, 5, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  plantWishBtn.addEventListener('click', () => {
    if (wishes.length < 10) {
      const newWish = {
        x: Math.random() * gardenCanvas.width,
        y: gardenCanvas.height,
        state: 'seed',
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      };
      wishes.push(newWish);
      if(window.gsap) {
        gsap.from(newWish, { y: gardenCanvas.height + 20, duration: 1, ease: 'bounce.out' });
      }
      updateStats();
      draw();
    }
  });

  waterGardenBtn.addEventListener('click', () => {
    wishes.forEach(wish => {
      if (wish.state === 'seed') {
        wish.state = 'flower';
        if(window.gsap) {
          gsap.from(wish, { scale: 0, duration: 0.5, ease: 'back.out(1.7)' });
        }
      }
    });
    updateStats();
    draw();
  });

  harvestWishesBtn.addEventListener('click', () => {
    wishes.forEach(wish => {
      if (wish.state === 'flower') {
        if(window.gsap) {
          gsap.to(wish, { y: -20, opacity: 0, duration: 1, ease: 'power2.in', onComplete: () => {
            wishes = wishes.filter(w => w !== wish);
            updateStats();
            draw();
          }});
        }
      }
    });
    if(!window.gsap) {
      wishes = wishes.filter(wish => wish.state !== 'flower');
      updateStats();
      draw();
    }
  });

  function updateStats() {
    const planted = wishes.length;
    const bloomed = wishes.filter(w => w.state === 'flower').length;
    wishesPlantedEl.textContent = planted;
    wishesBloomedEl.textContent = bloomed;
    gardenLevelEl.textContent = Math.floor(planted / 5) + 1;
  }

  draw();
})();

/* ===== Love Quiz ===== */
(function loveQuiz() {
  const quizContainer = document.getElementById('love-quiz');
  if (!quizContainer) return;

  const startQuizBtn = document.getElementById('startQuiz');
  const nextQuestionBtn = document.getElementById('nextQuestion');
  const restartQuizBtn = document.getElementById('restartQuiz');
  const quizContent = document.getElementById('quizContent');
  const questionText = document.getElementById('questionText');
  const questionOptions = document.getElementById('questionOptions');
  const quizResults = document.getElementById('quizResults');
  const finalScore = document.getElementById('finalScore');
  const resultsMessage = document.getElementById('resultsMessage');
  const quizScoreEl = document.getElementById('quizScore');

  const questions = [
    {
      question: "Jaki jest mój ulubiony kolor?",
      options: ["Różowy", "Czarny", "Fioletowy", "Niebieski"],
      answer: "Fioletowy"
    },
    {
      question: "Gdzie byliśmy na pierwszej randce?",
      options: ["W kinie", "W restauracji", "Na spacerze", "W domu"],
      answer: "Na spacerze"
    },
    {
      question: "Jaka jest moja ulubiona pora roku?",
      options: ["Wiosna", "Lato", "Jesień", "Zima"],
      answer: "Jesień"
    }
  ];

  let currentQuestionIndex = 0;
  let score = 0;

  startQuizBtn.addEventListener('click', startQuiz);
  nextQuestionBtn.addEventListener('click', nextQuestion);
  restartQuizBtn.addEventListener('click', restartQuiz);

  function startQuiz() {
    startQuizBtn.style.display = 'none';
    quizContent.style.display = 'block';
    nextQuestionBtn.style.display = 'block';
    restartQuizBtn.style.display = 'none';
    quizResults.style.display = 'none';
    currentQuestionIndex = 0;
    score = 0;
    quizScoreEl.textContent = score;
    displayQuestion();
  }

  function displayQuestion() {
    const question = questions[currentQuestionIndex];
    questionText.textContent = question.question;
    questionOptions.innerHTML = '';
    question.options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option;
      button.className = 'btn ghost';
      button.addEventListener('click', () => checkAnswer(option, button));
      questionOptions.appendChild(button);
    });
    if(window.gsap) {
      gsap.from(questionOptions.children, { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 });
    }
  }

  function checkAnswer(selectedOption, button) {
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedOption === question.answer;
    if (isCorrect) {
      score++;
      quizScoreEl.textContent = score;
      button.style.background = '#4CAF50';
    } else {
      button.style.background = '#F44336';
    }
    questionOptions.querySelectorAll('button').forEach(btn => btn.disabled = true);
    if(window.gsap) {
      gsap.to(button, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });
    }
  }

  function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      displayQuestion();
    } else {
      showResults();
    }
  }

  function restartQuiz() {
    startQuiz();
  }

  function showResults() {
    quizContent.style.display = 'none';
    nextQuestionBtn.style.display = 'none';
    quizResults.style.display = 'block';
    restartQuizBtn.style.display = 'block';
    finalScore.textContent = score;
    if (score === questions.length) {
      resultsMessage.textContent = "Gratulacje! Znasz mnie doskonale!";
    } else {
      resultsMessage.textContent = "Musimy jeszcze trochę popracować nad naszą znajomością!";
    }
    if(window.gsap) {
      gsap.from(quizResults, { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
    }
  }
})();

/* ===== Love Map ===== */
(function loveMap() {
  const loveMapCanvas = document.getElementById('loveMapCanvas');
  if (!loveMapCanvas) return;

  const ctx = loveMapCanvas.getContext('2d');
  const addLocationBtn = document.getElementById('addLocation');
  const showAllLocationsBtn = document.getElementById('showAllLocations');
  const clearMapBtn = document.getElementById('clearMap');
  const exportMapBtn = document.getElementById('exportMap');
  const locationsList = document.getElementById('locationsList');

  let locations = [];

  function draw() {
    ctx.clearRect(0, 0, loveMapCanvas.width, loveMapCanvas.height);
    // Draw a simple world map background
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, loveMapCanvas.width, loveMapCanvas.height);
    ctx.strokeStyle = '#4a4a5a';
    ctx.strokeRect(0, 0, loveMapCanvas.width, loveMapCanvas.height);

    locations.forEach(loc => {
      ctx.save();
      ctx.translate(loc.x, loc.y);
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  addLocationBtn.addEventListener('click', () => {
    const x = Math.random() * loveMapCanvas.width;
    const y = Math.random() * loveMapCanvas.height;
    locations.push({ x, y });
    updateLocationsList();
    draw();
  });

  showAllLocationsBtn.addEventListener('click', () => {
    // This is a placeholder, a real implementation would require a mapping library
    draw();
  });

  clearMapBtn.addEventListener('click', () => {
    locations = [];
    updateLocationsList();
    draw();
  });

  exportMapBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'love-map.png';
    link.href = loveMapCanvas.toDataURL();
    link.click();
  });

  function updateLocationsList() {
    locationsList.innerHTML = '';
    locations.forEach((loc, index) => {
      const div = document.createElement('div');
      div.textContent = `Miejsce ${index + 1}`;
      locationsList.appendChild(div);
    });
  }

  draw();
})();

/* ===== Voice Message ===== */
(function voiceMessage() {
  const startRecordingBtn = document.getElementById('startRecording');
  const stopRecordingBtn = document.getElementById('stopRecording');
  const playRecordingBtn = document.getElementById('playRecording');
  const waveform = document.getElementById('waveform');
  const recordingTime = document.getElementById('recordingTime');

  let mediaRecorder;
  let audioChunks = [];
  let audioBlob;
  let timerInterval;

  startRecordingBtn.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      startRecordingBtn.disabled = true;
      stopRecordingBtn.disabled = false;

      let seconds = 0;
      recordingTime.textContent = '00:00';
      timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        recordingTime.textContent = `${minutes}:${secs}`;
      }, 1000);

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });
    } catch (error) {
      logger.error('Błąd podczas uzyskiwania dostępu do mikrofonu:', error);
      alert('Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.');
    }
  });

  stopRecordingBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      stopRecordingBtn.disabled = true;
      playRecordingBtn.disabled = false;
      clearInterval(timerInterval);

      mediaRecorder.addEventListener("stop", () => {
        audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioChunks = [];
      });
    }
  });

  playRecordingBtn.addEventListener('click', () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  });
})();
