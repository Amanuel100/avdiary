export default function AnimatedCard({ children, className = '' }) {
  return (
    <div
      className={`glass-card p-6 animate-slide-up ${className}`}
    >
      {children}
    </div>
  );
}