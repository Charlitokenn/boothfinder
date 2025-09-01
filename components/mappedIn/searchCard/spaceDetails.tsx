import { Button } from "../../ui/button";
import { Scroller } from "../../ui/scroller";
import { useState } from "react";
import Directions, { DirectionsNavigationState } from "./directions";
import { LocationCard, StatusBadge, CategoryTags, ContactButtons } from "../common";
import { Location } from "../../../types/location";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertTitle } from "../../ui/alert";
import { InfoIcon, PopcornIcon } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { DropdownMenuContent } from "@radix-ui/react-dropdown-menu";
import { Badge } from "../../ui/badge";

type Props = {
  space: any;
  onBack: () => void;
  mapData?: any;
  mapView?: any;
  onDirectionsNavigationStateChange?: (state: DirectionsNavigationState | null) => void;
};

export default function SpaceDetails({ space, onBack, mapData, mapView, onDirectionsNavigationStateChange }: Props) {
  const [showDirections, setShowDirections] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const { isSignedIn } = useUser()

  // Floor name logic 
  let floorName = "Unknown Floor";
  if (mapData && space.center?.floorId) {
    const floors = mapData.getByType("floor");
    const floor = floors.find((f: any) => f.id === space.center.floorId);
    floorName = floor?.name ?? "Unknown Floor";
  }
  //TODO fix this logic to handle cases where space.floor is not defined or invalid

  // Transform space data to Location type
  const location: Location = {
    id: space.id || space.name,
    name: space.name,
    level: floorName,
    isOpen: space.isOpen ?? false,
    phone: space.phone || "000-000-0155",
    website: space.website || "#",
    facebook: space.facebook || "#",
    categories: space.categories || ["Men's Fashion", "Women's Fashion", "Sports & Fitness"],
    description: space.description || "Lululemon is the favourite yoga apparel retailer. Come to our in-store yoga se...",
    image: space.image || "/placeholder.svg",
    nextOpen: space.nextOpen || "Opens 9 a.m."
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="flex-none p-4 space-y-4">
        {/* Header Row */}
        <div className="flex justify-between items-start">
          <LocationCard
            location={location}
            showStatus={true}
            showLevel={true}
            size="md"
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>✕</Button>
          </div>
        </div>

        {/* Directions Button */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-base font-semibold cursor-pointer"
          onClick={
            isSignedIn ?
              () => setShowDirections(true) :
              () => setShowLogin(false)}
        >
          Directions
        </Button>

        <Link href="/sign-in" className="w-full -mt-4">
          <Badge variant="outline" className="w-full text-red-500" hidden={showLogin}>
            <InfoIcon />Please sign in/up to view directions.
          </Badge>
        </Link>
      </div>

      {/* Scrollable Content */}
      <Scroller className="flex-1 w-full flex-col gap-4 p-4 overflow-y-auto" hideScrollbar>
        {/* Hours */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-1">Hours</h3>
          <StatusBadge
            isOpen={location.isOpen}
            nextOpen={location.nextOpen}
            variant="detailed"
          />
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-1">Categories</h3>
          <CategoryTags
            categories={location.categories || []}
            maxVisible={3}
            showMore={true}
          />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {location.description} <a href="#" className="text-blue-600">more</a>
        </p>

        {/* Find Products Button */}
        <Button className="w-full bg-gray-100 text-gray-800 rounded-xl font-medium py-2" variant="ghost">
          Find Products
        </Button>

        {/* Contact Row */}
        <ContactButtons
          phone={location.phone}
          website={location.website}
          facebook={location.facebook}
          showLocation={true}
        />

        {/* Sample Image */}
        <div className="rounded-xl overflow-hidden mt-2">
          <img
            src="https://img-cdn.inc.com/image/upload/f_webp,q_auto,c_fit/images/panoramic/getty_522735456_249841.jpg"
            alt="space"
            className="w-full object-cover"
          />
        </div>
      </Scroller>

      {/* Directions Component */}
      {showDirections && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 z-10 rounded-3xl overflow-hidden">
          <Directions
            onBack={() => setShowDirections(false)}
            initialDestination={space.name}
            mapData={mapData}
            mapView={mapView}
            onNavigationStateChange={onDirectionsNavigationStateChange}
          />
        </div>
      )}
    </div>
  );
}
