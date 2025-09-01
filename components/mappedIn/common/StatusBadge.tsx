import { StatusBadgeProps } from "../../../types/location";
import { cn } from "../../../lib/utils";

export default function StatusBadge({ 
  isOpen, 
  nextOpen, 
  variant = 'compact',
  className 
}: StatusBadgeProps) {
  const statusText = isOpen ? "Open" : "Closed";
  const statusColor = isOpen ? "text-green-600" : "text-red-600";

  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", statusColor)}>
            {statusText}
          </span>
          {nextOpen && !isOpen && (
            <span className="text-xs text-gray-400">• {nextOpen}</span>
          )}
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <span className={cn("font-medium", statusColor, className)}>
      {statusText}
    </span>
  );
}
