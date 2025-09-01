import { useState } from "react";
import { useMap } from "@mappedin/react-sdk";
import SearchCard from "./searchCard/searchCard";
import ZoomControls from "./zoomContols";
import FloorStackSwitcher from "./floorSwitcher";
import MobileNavigation from "./MobileNavigation";
import { DirectionsNavigationState } from "./searchCard/directions";

const PanelControls = () => {
    const { mapData, mapView } = useMap();
    const [navigationState, setNavigationState] = useState<DirectionsNavigationState | null>(null);

    return (
        <>
            <ZoomControls mapView={mapView} />
            <FloorStackSwitcher mapView={mapView} mapData={mapData} />
            <SearchCard
                mapView={mapView}
                mapData={mapData}
                onDirectionsNavigationStateChange={setNavigationState}
            />
            {navigationState && (
                <MobileNavigation
                    showMobileNavigation={navigationState.showMobileNavigation}
                    isMobile={navigationState.isMobile}
                    directions={navigationState.directions}
                    currentStepIndex={navigationState.currentStepIndex}
                    departureValue={navigationState.departureValue}
                    destinationValue={navigationState.destinationValue}
                    mapData={navigationState.mapData}
                    mapView={mapView}
                    onBack={navigationState.onBack}
                    onPreviousStep={navigationState.onPreviousStep}
                    onNextStep={navigationState.onNextStep}
                />
            )}
        </>
    )
}

export default PanelControls