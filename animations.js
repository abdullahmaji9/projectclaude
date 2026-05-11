/* animations.js — Shared particle & animation engine */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], floaters = [];

  /* ---- Detect current page ---- */
  const page = document.body.dataset.page || '1';

  /* ---- Resize ---- */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', () => { resize(); init(); });
  resize();

  /* ---- Color palettes per page ---- */
  const palettes = {
    '1': ['#ff9ee0', '#e060b0', '#b87fff', '#7c3aed', '#ffd6f0'],
    '2': ['#ff9ee0', '#ffb3e8', '#e8d5ff', '#c084fc', '#ffd6f0'],
    '3': ['#b87fff', '#9b59d6', '#c084fc', '#e8d5ff', '#d8b4fe'],
    '4': ['#ff9ee0', '#b87fff', '#ffd6f0', '#e8d5ff', '#c084fc'],
  };
  const pal = palettes[page] || palettes['1'];

  /* ---- Particle class ---- */
  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : H + 10;
      this.r = Math.random() * 2 + 0.4;
      this.color = pal[Math.floor(Math.random() * pal.length)];
      this.alpha = Math.random() * 0.6 + 0.1;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.6 + 0.15);
      this.life = 0;
      this.maxLife = Math.random() * 300 + 150;
      // heart or star shape for page 1
      this.shape = page === '1'
        ? (Math.random() < 0.08 ? 'heart' : 'circle')
        : (Math.random() < 0.06 ? 'star' : 'circle');
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      const fade = this.life < 30 ? this.life / 30 : this.life > this.maxLife - 40 ? (this.maxLife - this.life) / 40 : 1;
      this.currentAlpha = this.alpha * fade;
      if (this.life >= this.maxLife || this.y < -20) this.reset();
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.currentAlpha;
      ctx.fillStyle = this.color;
      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.shape === 'heart') {
        drawHeart(ctx, this.x, this.y, this.r * 2.5);
      } else if (this.shape === 'star') {
        drawStar(ctx, this.x, this.y, this.r * 2, 4);
      }
      ctx.restore();
    }
  }

  /* ---- Big drifting orbs ---- */
  class Orb {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : H * 1.2;
      this.r = Math.random() * 160 + 80;
      this.color = pal[Math.floor(Math.random() * pal.length)];
      this.alpha = Math.random() * 0.055 + 0.015;
      this.vx = (Math.random() - 0.5) * 0.12;
      this.vy = -(Math.random() * 0.06 + 0.02);
      this.life = 0;
      this.maxLife = Math.random() * 600 + 400;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.life++;
      const fade = this.life < 80 ? this.life / 80 : this.life > this.maxLife - 80 ? (this.maxLife - this.life) / 80 : 1;
      this.currentAlpha = this.alpha * fade;
      if (this.life >= this.maxLife || this.y < -this.r) this.reset();
    }
    draw() {
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      g.addColorStop(0, hexToRgba(this.color, this.currentAlpha));
      g.addColorStop(1, hexToRgba(this.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---- Helpers ---- */
  function drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 10, size / 10);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.bezierCurveTo(0, -6, -5, -6, -5, -2);
    ctx.bezierCurveTo(-5, 1, 0, 5, 0, 5);
    ctx.bezierCurveTo(0, 5, 5, 1, 5, -2);
    ctx.bezierCurveTo(5, -6, 0, -6, 0, -3);
    ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, x, y, r, spikes) {
    let step = Math.PI / spikes, angle = -Math.PI / 2;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      ctx.lineTo(x + Math.cos(angle) * rad, y + Math.sin(angle) * rad);
      angle += step;
    }
    ctx.closePath(); ctx.fill();
  }

  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ---- Init ---- */
  function init() {
    const pCount = Math.min(Math.floor((W * H) / 9000), 140);
    const oCount = 5;
    particles = Array.from({ length: pCount }, () => new Particle());
    floaters  = Array.from({ length: oCount  }, () => new Orb());
  }

  /* ---- Animation loop ---- */
  function loop() {
    ctx.clearRect(0, 0, W, H);
    floaters.forEach(o => { o.update(); o.draw(); });
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  init();
  loop();

  /* ---- Staggered text animation ---- */
  document.addEventListener('DOMContentLoaded', () => {
    const els = document.querySelectorAll('[data-anim]');
    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = `opacity 0.7s ease ${i * 0.14}s, transform 0.7s ease ${i * 0.14}s`;
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 100 + i * 140);
    });
  });

})();
