import { Button } from "../../ui/button";

type Props = {
  results: any[];
  onSelect: (space: any) => void;
};

export default function SearchResults({ results, onSelect }: Props) {
  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No Exhibitors found.</p>;
  }

  return (
    <div className="space-y-1">
      {results.map((space) => (
        <Button
          key={space.id}
          variant={"secondary"}
          className="w-full justify-start mx-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => onSelect(space)}
        >
          {space.name}
        </Button>
      ))}
    </div>
  );
}
