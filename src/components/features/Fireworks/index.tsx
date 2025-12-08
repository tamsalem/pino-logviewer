import { useEffect, useRef } from 'react';

interface FireworksProps {
  duration?: number;
}

export default function Fireworks({ duration = 4000 }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    let animationId: number;
    const startTime = Date.now();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      gravity: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.color = color;
        this.gravity = 0.15;
      }

      update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.01;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function createFirework() {
      if (!canvas || !ctx) return;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5 + canvas.height * 0.1;
      const colors = [
        '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
        '#ff00ff', '#00ffff', '#ff8800', '#ff0088'
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle(x, y, color));
      }
    }

    function animate() {
      if (!canvas || !ctx) return;
      
      const elapsed = Date.now() - startTime;
      
      // Stop creating new fireworks after 3/4 of duration
      const shouldCreateNew = elapsed < duration * 0.75;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create new fireworks periodically (only during first 3/4 of duration)
      if (shouldCreateNew && Math.random() < 0.05) {
        createFirework();
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        particle.draw(ctx);

        if (particle.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // Continue animation if there are still particles or we're still creating new ones
      if (particles.length > 0 || shouldCreateNew) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Final cleanup - clear canvas one last time
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationId);
      }
    }

    // Start with a few fireworks
    for (let i = 0; i < 3; i++) {
      setTimeout(() => createFirework(), i * 200);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ backgroundColor: 'transparent' }}
    />
  );
}