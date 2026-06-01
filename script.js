/* ===================================================
   CARTA DIGITAL — script.js
   Partículas, reveal no scroll, transição, música
   =================================================== */

(function () {
  'use strict';

  // ─── PARTÍCULAS ──────────────────────────────────────────────
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');

  let particles  = [];
  let animFrameId;
  const PARTICLE_COUNT_DESKTOP = 80;
  const PARTICLE_COUNT_MOBILE  = 40;

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function randomBetween(a, b) {
    return Math.random() * (b - a) + a;
  }

  // Paleta de partículas: preto/vinho/rosa
  const particleColors = [
    'rgba(122, 45, 58,',    // wine
    'rgba(200, 160, 168,',  // rose
    'rgba(240, 232, 224,',  // white soft
    'rgba(163, 71, 90,',    // wine-light
    'rgba(200, 160, 168,',  // rose (duplicate weight)
  ];

  function createParticle() {
    const color = particleColors[Math.floor(Math.random() * particleColors.length)];
    return {
      x:       randomBetween(0, canvas.width),
      y:       randomBetween(0, canvas.height),
      radius:  randomBetween(0.3, 1.8),
      speedX:  randomBetween(-0.15, 0.15),
      speedY:  randomBetween(-0.4, -0.1),    // sempre sobe levemente
      opacity: randomBetween(0.05, 0.45),
      color:   color,
      flicker: randomBetween(0.003, 0.012),  // velocidade de piscar
      flickerDir: Math.random() < 0.5 ? 1 : -1,
      maxOpacity: randomBetween(0.2, 0.5),
    };
  }

  function initParticles() {
    const count = isMobile() ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
    particles   = [];
    for (let i = 0; i < count; i++) {
      const p = createParticle();
      p.y = randomBetween(0, canvas.height); // distribuídas por toda a tela no início
      particles.push(p);
    }
  }

  function updateParticles() {
    for (const p of particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      // Flickering (opacidade pulsa levemente)
      p.opacity += p.flicker * p.flickerDir;
      if (p.opacity >= p.maxOpacity || p.opacity <= 0.02) {
        p.flickerDir *= -1;
      }

      // Rebota horizontalmente
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;

      // Reinicia ao sair pelo topo
      if (p.y < -10) {
        p.y = canvas.height + 5;
        p.x = randomBetween(0, canvas.width);
        p.opacity = 0.02;
      }
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.opacity})`;
      ctx.fill();
    }
  }

  function animateParticles() {
    updateParticles();
    drawParticles();
    animFrameId = requestAnimationFrame(animateParticles);
  }

  function startParticles() {
    resizeCanvas();
    initParticles();
    animateParticles();
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  }, { passive: true });


  // ─── TRANSIÇÃO: INTRO → MAIN ──────────────────────────────────
  const introScreen = document.getElementById('intro-screen');
  const mainScreen  = document.getElementById('main-screen');
  const enterBtn    = document.getElementById('enter-btn');

  function enterExperience() {
    // Bloqueia clique duplo
    enterBtn.disabled = true;

    // Fade-out da intro
    introScreen.classList.add('fade-out');

    // Após a transição, mostra a main
    setTimeout(() => {
      introScreen.style.display = 'none';
      mainScreen.classList.remove('hidden');
      mainScreen.classList.add('visible');

      // Scroll ao topo (garante posição inicial)
      window.scrollTo(0, 0);

      // Dispara primeira rodada de reveals
      checkReveal();

      // Tenta iniciar música com autoplay (pode ser bloqueado pelo browser)
      tryAutoplay();
    }, 1900);
  }

  enterBtn.addEventListener('click', enterExperience);

  // Também aceita tecla Enter/Space no botão
  enterBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      enterExperience();
    }
  });


  // ─── REVEAL AO SCROLL ─────────────────────────────────────────
  const revealEls = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target); // reveal uma única vez
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px',
  });

  function checkReveal() {
    revealEls.forEach(el => revealObserver.observe(el));
  }


  // ─── PARALLAX SUAVE ──────────────────────────────────────────
  let lastScrollY = 0;
  const floatingEls = document.querySelectorAll('.float-elem');

  function onScroll() {
    const sy = window.scrollY;
    const delta = sy - lastScrollY;
    lastScrollY = sy;

    // Leve deslocamento parallax nos elementos flutuantes
    floatingEls.forEach((el, i) => {
      const factor = 0.04 + (i % 4) * 0.015;
      const currentTop = parseFloat(el.dataset.parallaxY || 0);
      const newTop = currentTop + delta * factor;
      el.dataset.parallaxY = newTop;
      el.style.transform = `translateY(${newTop}px)`;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });


  // ─── MÚSICA ───────────────────────────────────────────────────
  const audio     = document.getElementById('bg-music');
  const musicBtn  = document.getElementById('music-btn');
  const musicIcon = document.getElementById('music-icon');

  let isPlaying = false;

  function tryAutoplay() {
    if (!audio.src && !audio.querySelector('source')) return; // sem arquivo configurado
    audio.volume = 0.25;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          musicIcon.textContent = '■';
        })
        .catch(() => {
          // Autoplay bloqueado pelo browser — ok, usuário clica no botão
          isPlaying = false;
        });
    }
  }

  musicBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
      musicIcon.textContent = '▶';
      isPlaying = false;
    } else {
      audio.volume = 0.25;
      audio.play()
        .then(() => {
          isPlaying = true;
          musicIcon.textContent = '■';
        })
        .catch(err => {
          console.warn('Áudio não pôde ser tocado:', err);
        });
    }
  });

  // Volume fade-in suave ao iniciar
  audio.addEventListener('play', () => {
    audio.volume = 0;
    let vol = 0;
    const fadeIn = setInterval(() => {
      vol = Math.min(vol + 0.01, 0.25);
      audio.volume = vol;
      if (vol >= 0.25) clearInterval(fadeIn);
    }, 100);
  });


  // ─── EFEITO DE LUZ NO CURSOR (desktop) ──────────────────────
  if (!isMobile()) {
    const glowEl = document.createElement('div');
    glowEl.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(ellipse, rgba(122,45,58,0.04) 0%, transparent 70%);
      pointer-events: none;
      z-index: 3;
      transform: translate(-50%, -50%);
      transition: left 0.4s ease, top 0.4s ease;
      mix-blend-mode: screen;
    `;
    document.body.appendChild(glowEl);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateGlow() {
      glowX += (mouseX - glowX) * 0.06;
      glowY += (mouseY - glowY) * 0.06;
      glowEl.style.left = glowX + 'px';
      glowEl.style.top  = glowY + 'px';
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }


  // ─── ANIMAÇÃO TYPEWRITER OPCIONAL ─────────────────────────────
  // Ativado quando necessário — atualmente usando CSS reveal
  // Para ativar: chame typewriterEffect(element, text, speed)
  function typewriterEffect(el, text, speed = 60) {
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
  }


  // ─── EFEITO DE CHUVA LEVE ────────────────────────────────────
  // Partículas verticais sutis (gotas)
  const rainCanvas  = document.createElement('canvas');
  rainCanvas.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 1;
    opacity: 0.12;
  `;
  document.body.appendChild(rainCanvas);
  const rainCtx = rainCanvas.getContext('2d');

  let drops = [];
  const DROP_COUNT = isMobile() ? 25 : 50;

  function resizeRain() {
    rainCanvas.width  = window.innerWidth;
    rainCanvas.height = window.innerHeight;
  }

  function initRain() {
    drops = [];
    for (let i = 0; i < DROP_COUNT; i++) {
      drops.push({
        x:      Math.random() * rainCanvas.width,
        y:      Math.random() * rainCanvas.height,
        length: randomBetween(8, 20),
        speed:  randomBetween(0.5, 1.5),
        opacity: randomBetween(0.1, 0.4),
      });
    }
  }

  function animateRain() {
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    rainCtx.strokeStyle = 'rgba(200, 160, 168, 1)';
    rainCtx.lineWidth = 0.4;

    for (const d of drops) {
      rainCtx.globalAlpha = d.opacity;
      rainCtx.beginPath();
      rainCtx.moveTo(d.x, d.y);
      rainCtx.lineTo(d.x - 1, d.y + d.length);
      rainCtx.stroke();

      d.y += d.speed;
      if (d.y > rainCanvas.height + 20) {
        d.y = -d.length;
        d.x = Math.random() * rainCanvas.width;
      }
    }

    rainCtx.globalAlpha = 1;
    requestAnimationFrame(animateRain);
  }

  window.addEventListener('resize', () => {
    resizeRain();
    initRain();
  }, { passive: true });


  // ─── INICIALIZAÇÃO ────────────────────────────────────────────
  startParticles();
  resizeRain();
  initRain();
  animateRain();


  // ─── DICA DE MÚSICA (se não há arquivo) ──────────────────────
  // Mostra texto alternativo no botão quando não há src
  window.addEventListener('load', () => {
    const sources = audio.querySelectorAll('source');
    const hasSrc  = audio.src || sources.length > 0;
    if (!hasSrc) {
      const label = musicBtn.querySelector('.music-label');
      if (label) label.textContent = 'adicionar música';
    }
  });

  // ─── ACCESSIBILITY: Respeitar prefers-reduced-motion ─────────
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionQuery.matches) {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    rainCanvas.style.display = 'none';
  }

})();
