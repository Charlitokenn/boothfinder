import { CategoryTagsProps } from "../../../types/location";
import { cn } from "../../../lib/utils";

export default function CategoryTags({ 
  categories, 
  maxVisible = 3, 
  showMore = true,
  className 
}: CategoryTagsProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const visibleCategories = categories.slice(0, maxVisible);
  const hasMore = categories.length > maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {visibleCategories.map((category) => (
        <span 
          key={category} 
          className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded whitespace-nowrap"
        >
          {category}
        </span>
      ))}
      {hasMore && showMore && (
        <span className="text-gray-400 ml-1 text-sm">›</span>
      )}
    </div>
  );
}
