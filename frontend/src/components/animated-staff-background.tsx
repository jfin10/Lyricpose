"use client";

import { useEffect, useRef, useState } from "react";

interface Note {
  x: number;
  y: number;
  opacity: number;
  speed: number;
  size: number;
  type: "quarter" | "eighth" | "half" | "whole";
  rotation: number;
}

export function AnimatedStaffBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const notesRef = useRef<Note[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Initialize floating notes
    if (notesRef.current.length === 0) {
      for (let i = 0; i < 25; i++) {
        notesRef.current.push({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          opacity: Math.random() * 0.15 + 0.05,
          speed: Math.random() * 0.3 + 0.1,
          size: Math.random() * 16 + 10,
          type: (["quarter", "eighth", "half", "whole"] as const)[
            Math.floor(Math.random() * 4)
          ],
          rotation: Math.random() * 0.4 - 0.2,
        });
      }
    }

    const staffLineCount = 8;
    const staffSpacing = dimensions.height / (staffLineCount + 1);

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw staff lines
      for (let i = 1; i <= staffLineCount; i++) {
        const y = i * staffSpacing;
        const isStaffGroup = i % 5 !== 0;

        ctx.beginPath();
        ctx.moveTo(0, y);

        // Wavy staff lines
        for (let x = 0; x < dimensions.width; x += 4) {
          const wave =
            Math.sin(x * 0.003 + Date.now() * 0.0005 + i * 0.5) * 2;
          ctx.lineTo(x, y + wave);
        }

        ctx.strokeStyle = isStaffGroup
          ? "rgba(139, 92, 246, 0.08)"
          : "rgba(139, 92, 246, 0.04)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw shimmer at mouse position
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      if (mx > 0 && my > 0) {
        // Outer glow
        const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
        gradient.addColorStop(0, "rgba(139, 92, 246, 0.15)");
        gradient.addColorStop(0.3, "rgba(168, 85, 247, 0.08)");
        gradient.addColorStop(0.6, "rgba(236, 72, 153, 0.04)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);

        // Inner bright point
        const innerGradient = ctx.createRadialGradient(mx, my, 0, mx, my, 30);
        innerGradient.addColorStop(0, "rgba(255, 255, 255, 0.25)");
        innerGradient.addColorStop(0.5, "rgba(168, 85, 247, 0.15)");
        innerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(mx, my, 30, 0, Math.PI * 2);
        ctx.fill();

        // Shimmer particles near cursor
        for (let i = 0; i < 6; i++) {
          const angle = (Date.now() * 0.002 + i * (Math.PI / 3)) % (Math.PI * 2);
          const dist = 20 + Math.sin(Date.now() * 0.003 + i) * 15;
          const px = mx + Math.cos(angle) * dist;
          const py = my + Math.sin(angle) * dist;
          const sparkleSize = 2 + Math.sin(Date.now() * 0.005 + i * 2) * 1;

          ctx.beginPath();
          ctx.arc(px, py, sparkleSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() * 0.004 + i) * 0.2})`;
          ctx.fill();
        }

        // Light up nearby staff lines
        for (let i = 1; i <= staffLineCount; i++) {
          const y = i * staffSpacing;
          const dist = Math.abs(my - y);
          if (dist < 60) {
            const intensity = 1 - dist / 60;
            ctx.beginPath();
            const startX = Math.max(0, mx - 200);
            const endX = Math.min(dimensions.width, mx + 200);
            ctx.moveTo(startX, y);
            for (let x = startX; x < endX; x += 4) {
              const wave =
                Math.sin(x * 0.003 + Date.now() * 0.0005 + i * 0.5) * 2;
              ctx.lineTo(x, y + wave);
            }
            ctx.strokeStyle = `rgba(168, 85, 247, ${intensity * 0.4})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      // Floating music notes
      notesRef.current.forEach((note) => {
        note.y -= note.speed;
        note.x += Math.sin(Date.now() * 0.001 + note.y * 0.01) * 0.3;

        if (note.y < -30) {
          note.y = dimensions.height + 30;
          note.x = Math.random() * dimensions.width;
        }

        // Glow near cursor
        const dx = mx - note.x;
        const dy = my - note.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cursorBoost = dist < 150 ? (1 - dist / 150) * 0.3 : 0;

        ctx.save();
        ctx.translate(note.x, note.y);
        ctx.rotate(note.rotation);
        ctx.font = `${note.size}px serif`;
        ctx.fillStyle = `rgba(168, 85, 247, ${note.opacity + cursorBoost})`;

        const symbols: Record<string, string> = {
          quarter: "\u2669",
          eighth: "\u266A",
          half: "\u266B",
          whole: "\u266C",
        };
        ctx.fillText(symbols[note.type], 0, 0);
        ctx.restore();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
