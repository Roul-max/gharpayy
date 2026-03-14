export const SkeletonCard = () => (
  <div className="card-surface p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
      <div className="w-16 h-6 bg-white/10 rounded-full"></div>
    </div>
    <div>
      <div className="w-24 h-4 bg-white/10 rounded mb-2"></div>
      <div className="w-32 h-8 bg-white/10 rounded"></div>
    </div>
  </div>
);

export const SkeletonChart = () => (
  <div className="w-full h-full bg-white/5 rounded-xl animate-pulse flex items-end justify-between p-4 gap-2">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="w-full bg-white/10 rounded-t-md" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
    ))}
  </div>
);

export const SkeletonTable = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-white/10 rounded-t-xl mb-2"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-white/5 mb-1 rounded-md"></div>
    ))}
  </div>
);
