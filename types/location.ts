export interface Location {
  id: string;
  name: string;
  level?: string;
  logo?: string;
  isOpen?: boolean;
  phone?: string;
  website?: string;
  facebook?: string;
  categories?: string[];
  description?: string;
  image?: string;
  floor?: string;
  floorId?: string;
  center?: any;
  nextOpen?: string;
}

export interface LocationCardProps {
  location: Location;
  showStatus?: boolean;
  showLevel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export interface StatusBadgeProps {
  isOpen?: boolean;
  nextOpen?: string;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showIcon?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export interface LocationListProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  showLevel?: boolean;
  variant?: 'popular' | 'search-results';
  className?: string;
}

export interface CategoryTagsProps {
  categories: string[];
  maxVisible?: number;
  showMore?: boolean;
  className?: string;
}

export interface ContactButtonsProps {
  phone?: string;
  website?: string;
  facebook?: string;
  showLocation?: boolean;
  className?: string;
}
