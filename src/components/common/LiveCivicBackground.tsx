import React, { useEffect, useRef } from 'react';
import { useIncidents } from '../../context/IncidentContext';

interface LiveCivicBackgroundProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  pulsePhase: number;
  color: string;
}

export const LiveCivicBackground: React.FC<LiveCivicBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { activePushAlert } = useIncidents();
  const isEmergency = Boolean(activePushAlert && activePushAlert.severity === 'emergency');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Responsive particle count based on screen width
    const particleCount = Math.min(Math.max(Math.floor((width * height) / 18000), 25), 65);
    const particles: Particle[] = [];

    const colors = isEmergency
      ? ['#ef4444', '#f87171', '#fca5a5', '#dc2626']
      : ['#3b82f6', '#0ea5e9', '#6366f1', '#10b981', '#64748b'];

    for (let i = 0; i < particleCount; i++) {
      const r = Math.random() * 2 + 1.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: r,
        baseRadius: r,
        alpha: Math.random() * 0.4 + 0.15,
        pulsePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Mouse interaction coordinates
    const mouse = { x: -1000, y: -1000, radius: 140 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let radarAngle = 0;
    let time = 0;

    const render = () => {
      time += 0.015;
      radarAngle = (radarAngle + 0.008) % (Math.PI * 2);

      ctx.clearRect(0, 0, width, height);

      // 1. Subtle ambient gradient backdrop
      const bgGradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );

      if (isEmergency) {
        bgGradient.addColorStop(0, 'rgba(254, 242, 242, 0.7)');
        bgGradient.addColorStop(0.5, 'rgba(254, 226, 226, 0.4)');
        bgGradient.addColorStop(1, 'rgba(241, 245, 249, 0.8)');
      } else {
        bgGradient.addColorStop(0, 'rgba(248, 250, 252, 0.85)');
        bgGradient.addColorStop(0.5, 'rgba(241, 245, 249, 0.6)');
        bgGradient.addColorStop(1, 'rgba(226, 232, 240, 0.5)');
      }

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle coordinate radar grid rings
      const centerX = width * 0.5;
      const centerY = height * 0.45;
      const maxRing = Math.min(width, height) * 0.55;

      ctx.save();
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = isEmergency ? 'rgba(239, 68, 68, 0.07)' : 'rgba(59, 130, 246, 0.06)';

      for (let r = 80; r < maxRing; r += 110) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating subtle radar line
      const radarX = centerX + Math.cos(radarAngle) * maxRing;
      const radarY = centerY + Math.sin(radarAngle) * maxRing;
      const radarGrad = ctx.createLinearGradient(centerX, centerY, radarX, radarY);
      radarGrad.addColorStop(0, isEmergency ? 'rgba(239, 68, 68, 0.14)' : 'rgba(14, 165, 233, 0.12)');
      radarGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.strokeStyle = radarGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(radarX, radarY);
      ctx.stroke();
      ctx.restore();

      // 3. Update & Draw Particles (City Node Mesh)
      const connectDist = Math.min(width * 0.14, 120);

      // Connect near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDist) {
            const lineAlpha = (1 - dist / connectDist) * (isEmergency ? 0.18 : 0.11);
            ctx.strokeStyle = isEmergency
              ? `rgba(239, 68, 68, ${lineAlpha})`
              : `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes & react to mouse
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundary with padding
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse proximity interaction
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist < mouse.radius && mdist > 0) {
          const force = (1 - mdist / mouse.radius) * 1.5;
          p.x += (mdx / mdist) * force;
          p.y += (mdy / mdist) * force;
        }

        // Pulse size
        const currentRadius = p.baseRadius + Math.sin(time * 2 + p.pulsePhase) * 0.6;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(currentRadius, 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Subtle glow aura on larger nodes
        if (p.baseRadius > 2.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.2;
          ctx.fill();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isEmergency]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
