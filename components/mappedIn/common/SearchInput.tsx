import { forwardRef } from "react";
import { Search } from "lucide-react";
import { SearchInputProps } from "../../../types/location";
import { cn } from "../../../lib/utils";

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  placeholder = "Search...",
  value,
  onChange,
  onFocus,
  onBlur,
  showIcon = true,
  className,
  autoFocus = false,
  ...props
}, ref) => {
  return (
    <div className={cn(
      "flex items-center bg-gray-100 rounded-lg px-4 py-2.5 text-gray-600 text-base",
      className
    )}>
      {showIcon && <Search className="w-5 h-5 mr-3 text-gray-500" />}
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
});

SearchInput.displayName = "SearchInput";

export default SearchInput;
