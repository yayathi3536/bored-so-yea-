import React, { useState } from 'react';

interface FloatingHeartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  heartSymbol?: string;
}

export const FloatingHeartButton: React.FC<FloatingHeartButtonProps> = ({
  children,
  onClick,
  className = '',
  heartSymbol = '💖',
  ...props
}) => {
  const [hearts, setHearts] = useState<Array<{ id: number; key: string }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = Date.now();
    const key = Math.random().toString(36).substring(2, 8);
    setHearts((prev) => [...prev, { id, key }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1500);

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`relative ${className}`}
    >
      {children}
      {hearts.map((h) => (
        <span
          key={h.key}
          className="absolute -top-3 left-1/2 pointer-events-none text-base sm:text-lg animate-subtle-floating-heart select-none z-50 drop-shadow-[0_2px_6px_rgba(255,101,132,0.5)]"
          aria-hidden="true"
        >
          {heartSymbol}
        </span>
      ))}
    </button>
  );
};
