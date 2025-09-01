import React, { useState } from "react";
import { Button } from "../ui/button";
import { PlusIcon, MinusIcon, Scan } from "lucide-react";

type ZoomControlsProps = {
  mapView: any;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  targetId?: string; // ID of the fullscreen container
};

const ZoomControls: React.FC<ZoomControlsProps> = ({
  mapView,
  minZoom = 17,
  maxZoom = 20,
  step = 1,
  targetId = "fullscreen-container",
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const clampZoom = (zoom: number) => Math.min(Math.max(zoom, minZoom), maxZoom);

  const handleZoom = (delta: number) => {
    if (!mapView?.Camera?.zoomLevel) return;
    const newZoom = clampZoom(mapView.Camera.zoomLevel + delta);
    mapView.Camera.animateTo(
      { zoomLevel: newZoom },
      { duration: 300, easing: "ease-in-out" }
    );
  };

  const toggleFullscreen = () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div className="absolute right-6 bottom-12 z-10 hidden sm:block">
      <div className="flex flex-col gap-4">
        <Button
          className="rounded-none-md shadow-none cursor-pointer focus-visible:z-10"
          variant="outline"
          size="icon"
          aria-label="Toggle Fullscreen"
          onClick={toggleFullscreen}
        >
          <Scan size={25} aria-hidden="true" />
        </Button>

        <div className="flex flex-col -space-y-px rounded-md shadow-xs rtl:space-x-reverse">
          <Button
            className="rounded-none shadow-none cursor-pointer first:rounded-t-md last:rounded-b-md focus-visible:z-10"
            variant="outline"
            size="icon"
            aria-label="Zoom In"
            onClick={() => handleZoom(step)}
          >
            <PlusIcon size={25} aria-hidden="true" />
          </Button>
          <Button
            className="rounded-none shadow-none cursor-pointer first:rounded-t-md last:rounded-b-md focus-visible:z-10"
            variant="outline"
            size="icon"
            aria-label="Zoom Out"
            onClick={() => handleZoom(-step)}
          >
            <MinusIcon size={25} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ZoomControls;
