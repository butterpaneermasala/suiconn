import { useEffect, useRef } from 'react';

const CoralReef = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = 200; // Height of the coral reef
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Coral reef colors
    const colors = [
      '#FF6B6B', // Coral Red
      '#4ECDC4', // Turquoise
      '#45B7D1', // Ocean Blue
      '#96CEB4', // Seafoam
      '#FFEEAD', // Sand
    ];

    // Create coral shapes
    const corals = Array.from({ length: 15 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height - Math.random() * 100,
      width: 20 + Math.random() * 60,
      height: 40 + Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.5 + Math.random() * 0.5,
    }));

    // Animation loop
    let animationFrame: number;
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw corals
      corals.forEach(coral => {
        const sway = Math.sin(time * 0.001 * coral.swaySpeed + coral.swayOffset) * 5;
        
        ctx.beginPath();
        ctx.moveTo(coral.x, coral.y);
        ctx.quadraticCurveTo(
          coral.x + coral.width / 2 + sway,
          coral.y - coral.height / 2,
          coral.x + coral.width,
          coral.y
        );
        ctx.lineTo(coral.x + coral.width, canvas.height);
        ctx.lineTo(coral.x, canvas.height);
        ctx.closePath();

        // Add gradient to coral
        const coralGradient = ctx.createLinearGradient(
          coral.x, coral.y,
          coral.x + coral.width, coral.y
        );
        coralGradient.addColorStop(0, coral.color);
        coralGradient.addColorStop(1, `${coral.color}80`);
        
        ctx.fillStyle = coralGradient;
        ctx.fill();

        // Add highlight
        ctx.beginPath();
        ctx.moveTo(coral.x + 5, coral.y);
        ctx.quadraticCurveTo(
          coral.x + coral.width / 2 + sway,
          coral.y - coral.height / 2,
          coral.x + coral.width - 5,
          coral.y
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed bottom-0 left-0 w-full pointer-events-none z-0"
      style={{ height: '200px' }}
    />
  );
};

export default CoralReef; 