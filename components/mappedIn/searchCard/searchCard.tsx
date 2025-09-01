import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Search, ListFilter } from "lucide-react";
import Mappedin, { Label, Marker } from "@mappedin/react-sdk";
import { ArrowLeft, Flame, Building2 } from "lucide-react";
import appleLogo from "../../../assets/apple.svg";
import zaraLogo from "../../../assets//zara.svg";
import hmLogo from "../../../assets//hm.svg";
import lululemonLogo from "../../../assets//lululemon.svg";
import SpaceDetails from "./spaceDetails";
import { Scroller } from "../../ui/scroller";
import { IconRenderer } from "../../iconRenderer/renderer";
import Image from "next/image";
import { DirectionsNavigationState } from "./directions";

type Props = {
  mapData: any;
  mapView: any;
  onDirectionsNavigationStateChange?: (state: DirectionsNavigationState | null) => void;
};

function getRandomSpaces(spaces: any[], count: number) {
  const shuffled = [...spaces].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const logoMap: Record<string, string> = {
  "Apple": appleLogo,
  "H&M": hmLogo,
  "Lululemon": lululemonLogo,
  "Zara": zaraLogo,
  // Add more as needed
};

const placeholderIcon = Building2; // Lucide icon for placeholder

const placeholderTopLocations = [
  { name: "Apple", logo: appleLogo },
  { name: "H&M", logo: hmLogo },
  { name: "Lululemon", logo: lululemonLogo },
  { name: "Zara", logo: zaraLogo },
];

function getTopLocations(spaces: any[]) {
  const brands = ["Apple", "H&M", "Lululemon", "Zara"];
  const found = brands
    .map(name => spaces.find((s: any) => s.name === name))
    .filter(Boolean);
  return found.length === brands.length ? found : null;
}

export default function SearchCard({ mapData, mapView, onDirectionsNavigationStateChange }: Props) {
  const [query, setQuery] = useState("");
  const [matchedSpaces, setMatchedSpaces] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [isNavigationActive, setIsNavigationActive] = useState(false);
  const [marker, setMarker] = useState<
    {
      id: string;
      coordinate: Mappedin.Coordinate;
      anchor: Mappedin.TMarkerAnchor;
      text: string;
      rank: string;
    } | null
  >(null);

  // Track navigation state to hide UI when mobile navigation is active
  const handleDirectionsNavigationStateChange = useCallback((state: DirectionsNavigationState | null) => {
    setIsNavigationActive(!!state?.showMobileNavigation);
    if (onDirectionsNavigationStateChange) {
      onDirectionsNavigationStateChange(state);
    }
  }, [onDirectionsNavigationStateChange]);

  // Filter spaces based on query or show all on focus
  useEffect(() => {
    if (!mapData || !mapView) return;
    const allSpaces = mapData.getByType("space").filter((s: any) => s.name);
    let filtered: any[] = [];
    if (showResults) {
      filtered = query.trim()
        ? allSpaces.filter((s: any) =>
          s.name.toLowerCase().includes(query.toLowerCase())
        )
        : allSpaces;
    }
    setMatchedSpaces(filtered);
    //TODO Fix filtering to show all results first for the most popular
    // mapView.Labels.removeAll();
    // if (filtered.length === 1 && filtered[0].center && filtered[0].floorId) {
    //   mapView.Labels.add({
    //     text: filtered[0].name,
    //     target: filtered[0].center,
    //     options: { color: "blue", fontSize: 12, interactive: true },
    //   });
    // }
  }, [query, mapData, mapView, showResults]);

  // Zoom to and highlight a space
  const handleSelectSpace = (space: any) => {
    if (!mapView || !space?.center || !space?.id) return;
    mapView.setFloor(space.center.floorId);
    mapView.Camera.animateTo(
      {
        center: space.center,
        zoomLevel: 20,
      },
      { duration: 600 }
    );

    setSelectedSpace(space);
    setShowResults(false);
  };

  // Handler for back arrow click
  const handleBack = () => {
    setShowResults(false);
    setQuery("");
    inputRef.current?.blur();
  };

  // set markers and other after selecting a place via search menu results
  useEffect(() => {
    if (selectedSpace) {
      // console.log("[DEBUG] Rendering Marker for selectedSpace:", selectedSpace);
      // mapView.Markers.add(selectedSpace.center, '<div>This is a Marker!</div>');

      const newMarker = {
        id: selectedSpace.id,
        coordinate: selectedSpace.center,
        anchor: "top" as Mappedin.TMarkerAnchor,
        text: selectedSpace.name,
        rank: "high",
      };

      // console.log("✏️ New marker:", newMarker);
      setMarker(newMarker);
      if (!selectedSpace.center) {
        console.warn("[DEBUG] selectedSpace.center is undefined", selectedSpace);
      }
    }
  }, [selectedSpace]);

  const content = (
    <Card className="w-full rounded-3xl shadow-none border-none p-4 space-y-6 bg-white backdrop-blur-md dark:bg-gray-900/80">
      {/* Hide CardHeader when showing SpaceDetails */}
      {!selectedSpace && (
        <CardHeader className="-mb-7 px-0" >
          {/* Search Bar */}
          <div className="relative w-full lg:w-[310px] border rounded-3xl">
            {showResults ? (
              <button
                type="button"
                onClick={handleBack}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400 focus:outline-none cursor-pointer"
                tabIndex={0}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search Spaces..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              className="w-full pl-10 pr-10 py-5 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <ListFilter className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0 space-y-4 rounded-3xl">
        {/* Show SpaceDetails if a space is selected */}
        {selectedSpace ? (
          <SpaceDetails
            space={selectedSpace}
            onBack={() => setSelectedSpace(null)}
            mapData={mapData}
            mapView={mapView}
            onDirectionsNavigationStateChange={handleDirectionsNavigationStateChange}
          />
        ) : (
          <>
            {/* Search Results */}
            {showResults && (
              <div className="overflow-y-auto overflow-x-hidden max-h-[70vh] pb-4 rounded-3xl space-y-2">
                {/* Most Popular Title with Fire Icon */}
                <div className="flex items-center justify-between px-2 pt-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Most Popular</h3>
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <Scroller className="flex h-90 w-full flex-col gap-0 p-2" hideScrollbar>
                  {matchedSpaces.length > 0 ? (
                    matchedSpaces.map((space) => {
                      // Try to get logo, else use placeholder
                      const logo = logoMap[space.name];
                      // Get floor name (e.g., 'Lower Level', 'Upper Level')
                      let floorName = '';
                      if (space.center && space.center.floorId && mapData) {
                        const floor = mapData.getByType('floor').find((f: any) => f.id === space.center.floorId);
                        floorName = floor?.name || '';
                      }
                      return (
                        <div key={space.id}>
                          <Button
                            variant="ghost"
                            className="w-full flex h-14 cursor-pointer items-center gap-3 justify-start hover:bg-gray-100 shadow-none rounded-lg dark:hover:bg-gray-800 text-left"
                            onClick={() => handleSelectSpace(space)}
                          >
                            {logo ? (
                              <Image
                                src={logo}
                                alt={`${space.name} logo`}
                                width={28}
                                height={28}
                                className="object-contain flex-shrink-0"
                              />
                            ) : (
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-500">
                                <Building2 className="h-5 w-5" />
                              </span>
                            )}
                            <span className="flex flex-col items-start">
                              <span className="font-medium text-gray-900 dark:text-gray-50 text-[16px]">{space.name}</span>
                              {floorName && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">{floorName}</span>
                              )}
                            </span>
                          </Button>
                          <hr className="mx-2.5" />
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No matches found.</p>
                  )}
                </Scroller>
              </div>
            )}
            {/* Top Locations */}
            {!query && !showResults && (
              (() => {
                let topSpaces = null;
                if (mapData) {
                  const allSpaces = mapData.getByType("space").filter((s: any) => s.name);
                  topSpaces = getTopLocations(allSpaces);
                }
                if (topSpaces) {
                  return (
                    <div className="items-start space-y-1 hidden sm:block">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50 text-left">
                        Top Locations
                      </h2>
                      <div className="flex space-x-6 justify-between">
                        {topSpaces.map((space: any) => (
                          <Button
                            variant="ghost"
                            key={space.id}
                            className="flex flex-col items-center justify-center w-16 h-16 shrink-0 hover:bg-gray-200 hover:rounded-lg"
                          >
                            <img
                              src={logoMap[space.name] || ""}
                              alt={`${space.name} logo`}
                              width={60}
                              height={60}
                              className="object-contain"
                            />
                            <span className="sr-only">{space.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="items-start space-y-1 hidden sm:block">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50 text-left">
                      Top Locations
                    </h2>
                    <div className="flex space-x-6 justify-between">
                      {placeholderTopLocations.map((loc: any) => (
                        <Button
                          variant="ghost"
                          key={loc.name}
                          className="flex flex-col items-center justify-center w-16 h-16 shrink-0 hover:bg-gray-200 hover:rounded-lg"
                        >
                          <Image
                            src={loc.logo}
                            alt={`${loc.name} logo`}
                            width={60}
                            height={60}
                            className="object-contain"
                          />
                          <span className="sr-only">{loc.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              }
              )()
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {selectedSpace && mapData && (() => {
        const allSpaces = mapData.getByType('space');
        const realSpace = allSpaces.find((space: any) => space.id === selectedSpace.id);

        if (!realSpace) return null;
        return (
          <Label
            target={realSpace}
            text={realSpace.name}
            options={{
              enabled: true,
              appearance: {
                marker: {
                  backgroundColor: { active: "#fff", inactive: "#fff" },
                  foregroundColor: { active: "#0530AD", inactive: "#000" },
                  icon: "https://icon-library.com/images/location-icon-transparent-background/location-icon-transparent-background-9.jpg",
                  iconFit: "fill",
                  iconOverflow: "hidden",
                  iconPadding: 5,
                  iconScale: 1,
                  iconSize: 24,
                  iconVisibleAtZoomLevel: 16,
                }
              }
            }}
          />
        );
      })()}
      <div className={`absolute top-20 sm:top-6 left-6 right-6 sm:right-auto z-10 w-auto sm:w-[360px] max-w-none sm:max-w-[360px] max-h-[80vh] overflow-hidden px-0 ${isNavigationActive ? 'hidden' : ''}`}>
        {content}
      </div>
    </>
  );
}