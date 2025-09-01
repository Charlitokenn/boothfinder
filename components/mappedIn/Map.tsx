import { useMapData, MapView } from "@mappedin/react-sdk";
import { useEffect, useState } from "react";
import CopyRight from "./copyright";
import LogoBadge from "./logoBadge";
import SpaceMarkers from "./Markers";
import SpaceLabels from "./Labels";
import PanelControls from "./Controls";
import SpaceDetails from "./searchCard/spaceDetails";
import { appConfig } from "../../config";
import UserButtonComponent from "../userButton";

export default function Map({ className = "" }: { className?: string }) {
  const { isLoading, error, mapData } = useMapData({
    key: appConfig.mappedIn.key,
    secret: "mis_2g9ST8ZcSFb5R9fPnsvYhrX3RyRwPtDGbMGweCYKEq385431022",
    mapId: "672a6f4f3a45ba000b893e1c",
  });

  const [mapView, setMapView] = useState<any>(null);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);

  // Effect to handle map initialization and click events
  useEffect(() => {
    if (!mapView || !mapData) return;

    const handleClick = (e: any) => {
      // Handle space clicks
      if (e.spaces?.length > 0) {
        const space = mapData.getByType('space').find((s: any) => s.id === e.spaces[0]);
        if (space) {
          setSelectedSpace(space);

          // Focus the camera on the space
          mapView.Camera.focusOn({
            target: space,
            duration: 500,
            padding: { top: 100, left: 50, right: 50, bottom: 100 }
          });
        }
      }

      // Handle label clicks
      if (e.labels?.length > 0) {
        const label = e.labels[0];
        if (label && e.floors?.length > 0) {
          const floor = e.floors[0];
          const floorSpaces = floor.spaces || [];

          // Find space near the label
          const space = mapData.getByType('space').find((s: any) => {
            return floorSpaces.includes(s.id) && s.labels?.some((l: any) => l.id === label.id);
          });

          if (space) {
            setSelectedSpace(space);

            // Focus the camera on the space
            mapView.Camera.focusOn({
              target: space,
              duration: 500,
              padding: { top: 100, left: 50, right: 50, bottom: 100 }
            });
          }
        }
      }
    };

    // Set up the click handler
    mapView.on('click', handleClick);

    return () => {
      mapView.off('click', handleClick);
    };
  }, [mapView, mapData]); const handleMapLoad = (mapView: any) => {
    setMapView(mapView);
  };

  if (isLoading) {
    return (<div className="flex flex-col items-center justify-center h-screen">
      <div className="border-primary flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-t-transparent"></div>
    </div>)
  }

  if (error) {
    return (<div className="flex flex-col items-center justify-center min-h-screen">
      Error loading map: {error.message}
    </div>)
  }

  return mapData ? (
    <div className={`${className} relative`}>
      <MapView
        mapData={mapData}
        onLoad={handleMapLoad}
      >
        <SpaceLabels />
        <PanelControls />
      </MapView>
      <UserButtonComponent />
      <LogoBadge />
      <CopyRight />

      {/* SpaceDetails overlay */}
      {selectedSpace && (
        <div className="fixed right-4 top-4 w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden z-[9999] border border-gray-200 dark:border-gray-800">
          <SpaceDetails
            space={selectedSpace}
            mapData={mapData}
            mapView={mapView}
            onBack={() => {
              setSelectedSpace(null);
            }}
          />
        </div>
      )}
    </div>
  ) : null;
}