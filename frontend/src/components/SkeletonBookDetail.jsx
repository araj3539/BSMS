import React from "react";

export default function SkeletonBookDetail() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-pulse">
      
      {/* Breadcrumb Skeleton */}
      <div className="container mx-auto px-6 py-6">
        <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
      </div>

      {/* Main Content Skeleton */}
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            
            {/* LEFT: Image Area */}
            <div className="w-full md:w-5/12 lg:w-1/3 bg-slate-50 p-8 flex items-center justify-center">
              <div className="w-[280px] aspect-[2/3] bg-slate-200 rounded-xl shadow-inner"></div>
            </div>

            {/* RIGHT: Details Area */}
            <div className="flex-1 p-8 lg:p-12">
              <div className="flex flex-col h-full justify-center space-y-6">
                
                {/* Category Badge */}
                <div className="h-7 w-24 bg-slate-200 rounded-full"></div>

                {/* Title & Author */}
                <div className="space-y-3">
                  <div className="h-10 w-3/4 bg-slate-200 rounded-lg"></div>
                  <div className="h-10 w-1/2 bg-slate-200 rounded-lg"></div>
                  <div className="h-6 w-1/3 bg-slate-200 rounded-lg mt-2"></div>
                </div>

                {/* Rating Row */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-8 mt-4">
                   <div className="h-10 w-28 bg-slate-200 rounded-lg"></div>
                   <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                </div>

                {/* Description Block */}
                <div className="space-y-3 max-w-2xl py-4">
                   <div className="h-4 w-full bg-slate-200 rounded-md"></div>
                   <div className="h-4 w-full bg-slate-200 rounded-md"></div>
                   <div className="h-4 w-5/6 bg-slate-200 rounded-md"></div>
                   <div className="h-4 w-4/6 bg-slate-200 rounded-md"></div>
                </div>

                {/* Price & Actions (Sticky bottom feel) */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mt-auto pt-4">
                   <div className="space-y-2">
                      <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
                      <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
                   </div>

                   <div className="flex items-center gap-3 w-full sm:w-auto flex-1 justify-end">
                      <div className="h-12 w-32 bg-slate-200 rounded-xl"></div> {/* Qty */}
                      <div className="h-12 w-40 bg-slate-200 rounded-xl"></div> {/* Button */}
                   </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Reviews & Recs Skeleton Grid */}
        <div className="mt-16 grid lg:grid-cols-12 gap-12">
           {/* Reviews Column */}
           <div className="lg:col-span-8 space-y-8">
              <div className="h-8 w-48 bg-slate-200 rounded-lg mb-6"></div>
              {/* Fake Review Cards */}
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
                   <div className="flex justify-between">
                      <div className="h-5 w-32 bg-slate-200 rounded"></div>
                      <div className="h-5 w-24 bg-slate-200 rounded"></div>
                   </div>
                   <div className="h-4 w-full bg-slate-200 rounded"></div>
                   <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                </div>
              ))}
           </div>

           {/* Recommendations Column */}
           <div className="lg:col-span-4">
              <div className="h-8 w-40 bg-slate-200 rounded-lg mb-6"></div>
              <div className="grid grid-cols-2 gap-4">
                 {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-[2/3] bg-slate-200 rounded-xl"></div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}