import { useState, useEffect } from 'react';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  gradient: string;
}

const FloatingBubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  // Predefined vibrant color combinations
  const colorSets = [
    {
      color: 'rgba(255, 87, 51, 0.8)',
      gradient: 'from-red-500/80 to-orange-500/80'
    },
    {
      color: 'rgba(29, 233, 182, 0.8)',
      gradient: 'from-emerald-500/80 to-teal-500/80'
    },
    {
      color: 'rgba(255, 45, 85, 0.8)',
      gradient: 'from-pink-500/80 to-rose-500/80'
    },
    {
      color: 'rgba(88, 86, 214, 0.8)',
      gradient: 'from-indigo-500/80 to-purple-500/80'
    },
    {
      color: 'rgba(255, 204, 0, 0.8)',
      gradient: 'from-yellow-500/80 to-amber-500/80'
    },
    {
      color: 'rgba(0, 122, 255, 0.8)',
      gradient: 'from-blue-500/80 to-cyan-500/80'
    }
  ];

  useEffect(() => {
    // Create initial bubbles
    const initialBubbles: Bubble[] = Array.from({ length: 3 }, (_, i) => {
      const colorSet = colorSets[Math.floor(Math.random() * colorSets.length)];
      return {
        id: i,
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight - 100),
        size: Math.random() * 30 + 40, // Random size between 40 and 70
        speedX: (Math.random() - 0.5) * 1.5, // Reduced speed for smoother movement
        speedY: (Math.random() - 0.5) * 1.5,
        color: colorSet.color,
        gradient: colorSet.gradient
      };
    });

    setBubbles(initialBubbles);

    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      setBubbles(prevBubbles => 
        prevBubbles.map(bubble => {
          let newX = bubble.x + bubble.speedX * (deltaTime / 16); // Normalize by 60fps
          let newY = bubble.y + bubble.speedY * (deltaTime / 16);
          let newSpeedX = bubble.speedX;
          let newSpeedY = bubble.speedY;

          // Bounce off walls with smooth deceleration
          if (newX <= 0 || newX >= window.innerWidth - bubble.size) {
            newSpeedX = -newSpeedX * 0.95; // Add slight deceleration
            newX = Math.max(0, Math.min(newX, window.innerWidth - bubble.size));
          }
          if (newY <= 0 || newY >= window.innerHeight - bubble.size) {
            newSpeedY = -newSpeedY * 0.95; // Add slight deceleration
            newY = Math.max(0, Math.min(newY, window.innerHeight - bubble.size));
          }

          return {
            ...bubble,
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY
          };
        })
      );

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleBubbleClick = (id: number) => {
    setBubbles(prevBubbles => prevBubbles.filter(bubble => bubble.id !== id));
    
    // Create a new bubble after a short delay
    setTimeout(() => {
      const colorSet = colorSets[Math.floor(Math.random() * colorSets.length)];
      setBubbles(prevBubbles => [
        ...prevBubbles,
        {
          id: Date.now(),
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 100),
          size: Math.random() * 30 + 40,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: (Math.random() - 0.5) * 1.5,
          color: colorSet.color,
          gradient: colorSet.gradient
        }
      ]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className={`absolute rounded-full cursor-pointer pointer-events-auto transition-all duration-300 hover:scale-110 bg-gradient-to-br ${bubble.gradient}`}
          style={{
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            boxShadow: `
              0 8px 30px rgba(0,0,0,0.15),
              inset 0 0 30px rgba(255,255,255,0.3)
            `,
            transform: 'translate(-50%, -50%)',
            backdropFilter: 'blur(8px)',
            willChange: 'transform',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onClick={() => handleBubbleClick(bubble.id)}
        >
          <div
            className="absolute top-[18%] left-[22%] w-[40%] h-[35%] rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.1) 100%)',
              filter: 'blur(2px)'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingBubbles; 