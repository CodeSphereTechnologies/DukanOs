import React from 'react';

interface AvatarProps {
  name: string;
  className?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, className = '', size }) => {
  const seed = encodeURIComponent(name || 'User');
  const url = `https://api.dicebear.com/10.x/blobs/svg?seed=${seed}&size=${size || 64}`;

  return (
    <img 
      src={url} 
      alt={name} 
      className={`rounded-full bg-[#FAFAF8] ${className}`}
    />
  );
};
