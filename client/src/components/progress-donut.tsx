interface ProgressDonutProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressDonut({ 
  percentage, 
  size = 96, 
  strokeWidth = 3, 
  color = "#3b82f6" 
}: ProgressDonutProps) {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${percentage}, 100`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox="0 0 36 36"
      >
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-slate-800">{percentage}%</span>
      </div>
    </div>
  );
}
