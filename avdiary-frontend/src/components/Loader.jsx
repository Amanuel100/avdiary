export default function Loader({ count = 3 }) {
  return (
    <div className="space-y-6 animate-fade-in p-1">
      {/* Header shimmer */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-av-border shimmer" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-av-border rounded shimmer" />
          <div className="h-3 w-20 bg-av-border rounded shimmer" />
        </div>
      </div>

      {/* Stat card shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-av-border shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-av-border rounded shimmer" />
              <div className="h-5 w-20 bg-av-border rounded shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + AI card shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 h-64 flex items-center justify-center">
          <div className="w-full h-48 bg-av-border rounded shimmer" />
        </div>
        <div className="glass-card p-6 space-y-3">
          <div className="h-5 w-24 bg-av-border rounded shimmer" />
          <div className="h-4 w-full bg-av-border rounded shimmer" />
          <div className="h-4 w-3/4 bg-av-border rounded shimmer" />
          <div className="h-4 w-5/6 bg-av-border rounded shimmer" />
        </div>
      </div>

      {/* Table shimmer */}
      <div className="glass-card p-6 space-y-4">
        <div className="h-5 w-28 bg-av-border rounded shimmer" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-16 bg-av-border rounded shimmer" />
            <div className="h-4 w-20 bg-av-border rounded shimmer" />
            <div className="h-4 w-14 bg-av-border rounded shimmer" />
            <div className="h-4 w-14 bg-av-border rounded shimmer" />
            <div className="h-4 w-24 bg-av-border rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}