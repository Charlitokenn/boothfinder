import Image from "next/image";
import { Flame } from "lucide-react";
import { LocationListProps } from "../../../types/location";
import { logoMap } from "../../../config";
import { Scroller } from "../../ui/scroller";
import { cn } from "../../../lib/utils";

export default function LocationList({ 
  locations, 
  onLocationSelect, 
  showLevel = true, 
  variant = 'search-results',
  className 
}: LocationListProps) {
  if (locations.length === 0) {
    return (
      <div className="px-4 py-3 text-center text-gray-500">
        No matching locations found.
      </div>
    );
  }

  const showTitle = variant === 'popular';

  return (
    <div className={cn("space-y-2", className)}>
      {showTitle && (
        <div className="flex items-center justify-between px-2 pt-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Most Popular
          </h3>
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
      )}
      
      <Scroller className="flex h-65 w-full flex-col gap-0 p-2" hideScrollbar>
        {locations.map((location, index) => {
          const logo = (logoMap && logoMap[location.name]) || location.logo || "/placeholder.svg";
          
          return (
            <div
              key={location.id || index}
              className="px-4 py-3 flex items-center border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onLocationSelect(location)}
            >
              <Image
                src={logo}
                alt={location.name}
                width={24}
                height={24}
                className="mr-3 rounded-lg object-contain"
              />
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-gray-800 truncate">
                  {location.name}
                </p>
                {showLevel && location.level && (
                  <p className="text-sm text-gray-500 truncate">
                    {location.level}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </Scroller>
    </div>
  );
}
