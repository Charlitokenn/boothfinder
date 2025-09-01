import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "../../ui/sheet";
import { Card } from "../../ui/card";
import SearchInput from "./searchInput";
import SearchResults from "./searchResults";
import SpaceDetails from "./spaceDetails";
import { Scroller } from "../../ui/scroller";

export default function SearchCard({ mapData, mapView }: { mapData: any; mapView: any }) {
  const [isMobile, setIsMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [matchedSpaces, setMatchedSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!mapData || !mapView) return;
    const allSpaces = mapData.getByType("space").filter((s: any) => s.name);
    const filtered = query.trim()
      ? allSpaces.filter((s: any) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      )
      : [];
    setMatchedSpaces(filtered);
    mapView.Labels.removeAll();
  }, [query, mapData, mapView]);

  const handleSelectSpace = (space: any) => {
    if (!mapView || !space?.center || !space?.id) {
      console.warn("Missing space center or floorId", space);
      return;
    }

    setSelectedSpace(space);
    setQuery("");
    setMatchedSpaces([]);

    // Switch to correct floor
    mapView.Floor.set(space.id);

    // Animate to the center of the space
    mapView.Camera.animateTo({
      target: space.center,
      zoomLevel: 20,
    }, { duration: 600 });

    // Clear previous markers and labels
    mapView.Labels.removeAll();
    if (marker) {
      mapView.Markers.remove(marker);
    }

    // Add label
    mapView.Labels.add({
      text: space.name,
      target: space.center,
      options: {
        color: "blue",
        fontSize: 12,
        interactive: true,
      },
    });

    // ✅ Add marker with emoji (or you can use iconUrl)
    const newMarker = mapView.Markers.add({
      position: space.center,
      icon: "📍", // You can also try iconUrl instead
    });

    setMarker(newMarker);
  };


  const handleBack = () => {
    setSelectedSpace(null);
    mapView.Labels.removeAll();
    if (marker) mapView.Markers.remove(marker);
  };

  const content = (
    <Card className="w-full rounded-3xl shadow-none border-none p-0 bg-white backdrop-blur-md dark:bg-gray-900/80 max-h-[85vh]">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900/80 p-4 border-b border-gray-200 dark:border-gray-800">
        <SearchInput query={query} setQuery={setQuery} />
      </div>
      {/* <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-4 space-y-4"> */}
      <div>
        {selectedSpace ? (
          <SpaceDetails space={selectedSpace} onBack={handleBack} />
        ) : (
          <Scroller className="flex h-80 w-full flex-col gap-2.5 p-4" hideScrollbar>
            {Array.from({ length: 20 }).map((_, index) => (
              <div
                key={index}
                className="flex h-40 flex-col rounded-md bg-accent p-4"
              >
                <SearchResults results={matchedSpaces} onSelect={handleSelectSpace} />
              </div>
            ))}
          </Scroller>
        )}
      </div>
    </Card>
  );

  return isMobile ? (
    <Sheet open>
      <SheetContent
        side="bottom"
        className="p-0 max-h-[85vh] overflow-hidden rounded-t-2xl"
      >
        {content}
      </SheetContent>
    </Sheet>
  ) : (
    <div className="absolute top-6 left-6 z-10 w-[360px] max-h-[85vh] overflow-hidden">
      {content}
    </div>
  );
}