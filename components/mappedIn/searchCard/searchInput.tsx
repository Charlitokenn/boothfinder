import { Input } from "../../ui/input";
import { Search, ListFilter } from "lucide-react";

type Props = {
  query: string;
  setQuery: (value: string) => void;
};

export default function SearchInput({ query, setQuery }: Props) {
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
        <Input
          type="text"
          placeholder="Search the mall..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-5 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <ListFilter className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
      </div>
    </div>
  );
}
