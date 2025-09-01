import Image from "next/image";
import { LocationCardProps } from "../../../types/location";
import { logoMap } from "../../../config";
import StatusBadge from "./StatusBadge";
import { cn } from "../../../lib/utils";

const sizeClasses = {
  sm: {
    container: "space-x-2",
    logo: "w-8 h-8",
    logoContainer: "w-10 h-10",
    title: "text-sm font-medium",
    subtitle: "text-xs"
  },
  md: {
    container: "space-x-3",
    logo: "w-10 h-10",
    logoContainer: "w-12 h-12",
    title: "text-lg font-semibold",
    subtitle: "text-sm"
  },
  lg: {
    container: "space-x-4",
    logo: "w-12 h-12",
    logoContainer: "w-14 h-14",
    title: "text-xl font-bold",
    subtitle: "text-base"
  }
};

export default function LocationCard({ 
  location, 
  showStatus = true, 
  showLevel = true, 
  size = 'md',
  onClick 
}: LocationCardProps) {
  const logo = (logoMap && logoMap[location.name]) || "/placeholder.svg";
  const classes = sizeClasses[size];

  return (
    <div 
      className={cn(
        "flex items-center",
        classes.container,
        onClick && "cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "bg-white rounded-xl shadow p-1 flex items-center justify-center",
        classes.logoContainer
      )}>
        <Image 
          src={logo} 
          className={cn("object-contain", classes.logo)} 
          alt={`${location.name} logo`} 
          width={48} 
          height={48} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className={cn("leading-tight truncate", classes.title)}>
          {location.name}
        </h2>
        {(showLevel || showStatus) && (
          <div className={cn(
            "flex items-center gap-2 text-muted-foreground",
            classes.subtitle
          )}>
            {showLevel && location.level && (
              <>
                <span className="truncate">{location.level}</span>
                {showStatus && <span className="text-gray-300">|</span>}
              </>
            )}
            {showStatus && (
              <StatusBadge 
                isOpen={location.isOpen} 
                nextOpen={location.nextOpen}
                variant="compact"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
