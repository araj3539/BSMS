import React from 'react';

export default function SkeletonBookCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col h-full shadow-sm">
      {/* Image Area */}
      <div className="w-full aspect-[2/3] bg-slate-200 animate-pulse" />

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category Tag */}
        <div className="h-3 w-16 bg-slate-200 rounded animate-pulse mb-2" />
        
        {/* Title */}
        <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
        
        {/* Author */}
        <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse mb-4" />
        
        {/* Footer (Price & Stars) */}
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-slate-50">
          <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" /> {/* Price */}
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /> {/* Stars */}
        </div>
      </div>
    </div>
  );
}