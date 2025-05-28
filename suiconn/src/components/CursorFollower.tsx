import { useEffect, useState } from 'react';
import fishSvg from '../assets/fish-svgrepo-com.svg';

const CursorFollower = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide the default cursor
    document.body.style.cursor = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      // Direct position update without animation for better responsiveness
      setPosition({
        x: e.clientX - 25, // Adjusted offset for larger size
        y: e.clientY - 25  // Adjusted offset for larger size
      });
    };

    // Show the fish immediately
    setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      // Restore default cursor
      document.body.style.cursor = 'auto';
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        willChange: 'transform' 
      }}
    >
      <img
        src={fishSvg}
        alt="Cursor follower"
        className="w-28 h-28 object-contain" 
        style={{
          filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))'
        }}
      />
    </div>
  );
};

export default CursorFollower; 