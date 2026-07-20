import { useEffect, useRef } from 'react';

export default function ParticlesBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = Math.min(50, Math.floor((width * height) / 30000));
    const connectionDistance = 130;
    const mouse = { x: null, y: null, radius: 160 };

    // Hexagons definitions
    const hexagons = [
      { x: width * 0.8, y: height * 0.15, radius: 180, rot: 0.2, stroke: 'rgba(0, 180, 255, 0.4)' },
      { x: width * 0.15, y: height * 0.35, radius: 240, rot: -0.1, stroke: 'rgba(0, 140, 255, 0.35)' },
      { x: width * 0.85, y: height * 0.75, radius: 210, rot: 0.4, stroke: 'rgba(255, 94, 19, 0.35)' },
      { x: width * 0.3, y: height * 0.85, radius: 160, rot: 0.15, stroke: 'rgba(0, 200, 255, 0.3)' }
    ];

    function drawHexagon(x, y, radius, angle, strokeStyle) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(x, y);
      ctx.rotate(angle);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const hx = radius * Math.cos(a);
        const hy = radius * Math.sin(a);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 18;
      ctx.shadowColor = strokeStyle;
      ctx.stroke();
      ctx.restore();
    }

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2.5 + 1;
        this.color = Math.random() > 0.4 ? 'rgba(0, 210, 255, 0.8)' : 'rgba(255, 94, 19, 0.85)';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const drawBackground = () => {
      // Deep Royal Blue Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#001433');
      grad.addColorStop(0.5, '#002B5B');
      grad.addColorStop(1, '#00437A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw glowing background hexagons
      hexagons.forEach(hex => {
        drawHexagon(hex.x, hex.y, hex.radius, hex.rot, hex.stroke);
      });
    };

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 190, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        if (mouse.x !== null && mouse.y !== null) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const alpha = (1 - dist / mouse.radius) * 0.4;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(255, 94, 19, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      drawBackground();
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      drawLines();
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    init();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
