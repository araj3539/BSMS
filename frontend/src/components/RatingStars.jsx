// src/components/RatingStars.jsx
import React from 'react';

export default function RatingStars({ rating, max = 5 }) {
  const safeRating = Number(rating) || 0;
  const fullStars = Math.floor(safeRating);
  const decimal = safeRating - fullStars;
  const emptyStars = max - Math.ceil(safeRating);

  return (
    <div className="flex gap-0.5 items-center">
      {/* 1. Full Stars */}
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`full-${i}`} percent={100} />
      ))}

      {/* 2. Partial Star (e.g. 3.7) */}
      {decimal > 0 && (
        <StarIcon key="partial" percent={decimal * 100} />
      )}

      {/* 3. Empty Stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`empty-${i}`} percent={0} />
      ))}
    </div>
  );
}

function StarIcon({ percent }) {
  return (
    <div style={{ position: 'relative', width: '20px', height: '20px' }}>
      {/* Background Gray Star (Always fully visible) */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="#D1D5DB" 
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
      </svg>

      {/* Foreground Yellow Star (Clipped based on percent) */}
      <div 
        style={{ 
          width: `${percent}%`, 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          height: '100%', 
          overflow: 'hidden' 
        }}
      >
        {/* IMPORTANT: minWidth: '20px' forces the SVG to stay full size, preventing it from shrinking when cropped */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="#EAB308"
          style={{ width: '20px', height: '20px', minWidth: '20px' }} 
        >
           <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}