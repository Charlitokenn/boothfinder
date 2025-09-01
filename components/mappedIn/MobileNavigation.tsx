import React from 'react';
import { useUser } from "@clerk/nextjs";
import { Button } from "../ui/button";
import {
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    MapPin,
    ChevronsUpDown,
    PersonStanding
} from "lucide-react";

interface MobileNavigationProps {
    showMobileNavigation: boolean;
    isMobile: boolean;
    directions: any;
    currentStepIndex: number;
    departureValue: string;
    destinationValue: string;
    mapData: any;
    mapView: any;
    onBack: () => void;
    onPreviousStep: () => void;
    onNextStep: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
    showMobileNavigation,
    isMobile,
    directions,
    currentStepIndex,
    departureValue,
    destinationValue,
    mapData,
    mapView,
    onBack,
    onPreviousStep,
    onNextStep,
}) => {
    const { user } = useUser();

    if (!showMobileNavigation || !isMobile || !directions?.instructions) {
        return null;
    }

    const currentStep = directions.instructions[currentStepIndex];

    // Function to log user data when reaching destination
    const logUserDataOnDestinationReached = () => {
        //TODO - Update to send this detail to the database and always check if user already exist with respective exhibitor
        if (user) {
            console.log('🎯 User has reached their destination! Logging user data:', {
                fullName: user.fullName,
                email: user.primaryEmailAddress?.emailAddress,
                mobileNumber: user.publicMetadata?.mobileNumber,
                dateOfBirth: user.publicMetadata?.dateOfBirth,
                destination: destinationValue,
                timestamp: new Date().toISOString()
            })
        } else {
            console.log('⚠️ No user data available - user may not be signed in')
        }
    };

    // Enhanced step navigation with camera control (similar to desktop version)
    const handleAdvancedStepNavigation = async (stepIndex: number) => {
        if (!mapView || !directions?.instructions?.[stepIndex]) return;

        const step = directions.instructions[stepIndex];
        if (!step.coordinate) return;

        try {
            // Check if this is the arrival/destination step and log user data
            if (step.action?.type === 'Arrival') {
                logUserDataOnDestinationReached();
            }

            // Check if we need to change floors
            const stepFloorId = step.coordinate.floorId;
            const currentFloorId = mapView.currentFloor?.id;

            if (stepFloorId && stepFloorId !== currentFloorId) {
                // Find the floor object and switch to it
                const targetFloor = mapData?.getByType("floor")?.find((floor: any) => floor.id === stepFloorId);
                if (targetFloor) {
                    mapView.setFloor(targetFloor);
                }
            }

            // Calculate bearing based on step direction
            let targetBearing = 0; // Default north-facing

            if (step.action?.type === 'Turn') {
                // For turns, calculate bearing based on turn direction and next step
                const nextStep = directions?.instructions?.[stepIndex + 1];
                if (nextStep && nextStep.coordinate) {
                    // Calculate bearing from current step to next step
                    const lat1 = step.coordinate.latitude * Math.PI / 180;
                    const lon1 = step.coordinate.longitude * Math.PI / 180;
                    const lat2 = nextStep.coordinate.latitude * Math.PI / 180;
                    const lon2 = nextStep.coordinate.longitude * Math.PI / 180;

                    const dLon = lon2 - lon1;
                    const y = Math.sin(dLon) * Math.cos(lat2);
                    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

                    targetBearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
                } else if (step.action.bearing === 'Left') {
                    targetBearing = 270; // West
                } else if (step.action.bearing === 'Right') {
                    targetBearing = 90; // East
                }
            } else if (stepIndex > 0) {
                // For other steps, calculate bearing from previous step
                const prevStep = directions?.instructions?.[stepIndex - 1];
                if (prevStep && prevStep.coordinate) {
                    const lat1 = prevStep.coordinate.latitude * Math.PI / 180;
                    const lon1 = prevStep.coordinate.longitude * Math.PI / 180;
                    const lat2 = step.coordinate.latitude * Math.PI / 180;
                    const lon2 = step.coordinate.longitude * Math.PI / 180;

                    const dLon = lon2 - lon1;
                    const y = Math.sin(dLon) * Math.cos(lat2);
                    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

                    targetBearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
                }
            }

            // Add a small delay to allow floor switching to complete before camera animation
            const animationDelay = stepFloorId && stepFloorId !== currentFloorId ? 800 : 0;

            setTimeout(() => {
                // Animate camera to the specific coordinate with directional view
                mapView.Camera.animateTo({
                    center: step.coordinate,
                    zoomLevel: 20, // Good zoom level for navigation details
                    bearing: targetBearing, // Orient map in direction of travel
                    pitch: 60, // Angle for better navigation context
                }, {
                    duration: 1000, // Smooth 1 second animation
                    easing: 'ease-in-out' // Smooth animation curve
                });
            }, animationDelay);

        } catch (error) {
            console.error('Error in advanced step navigation:', error);
        }
    };

    // Enhanced next step handler
    const handleEnhancedNextStep = () => {
        if (currentStepIndex < directions.instructions.length - 1) {
            const nextIndex = currentStepIndex + 1;
            handleAdvancedStepNavigation(nextIndex);
        }
        onNextStep(); // Call the original handler
    };

    // Enhanced previous step handler
    const handleEnhancedPreviousStep = () => {
        if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1;
            handleAdvancedStepNavigation(prevIndex);
        }
        onPreviousStep(); // Call the original handler
    };

    // Function to get step icon
    const getStepIcon = (step: any, index: number) => {
        if (step.action?.type === 'Departure') {
            return <ArrowUp className="w-6 h-6 text-green-600" />;
        } else if (step.action?.type === 'Arrival') {
            return <MapPin className="w-6 h-6 text-red-600" />;
        }

        if (step.action?.type === 'Turn') {
            if (step.action.bearing === 'Left') {
                return <ArrowLeft className="w-6 h-6 text-blue-600" />;
            } else if (step.action.bearing === 'Right') {
                return <ArrowRight className="w-6 h-6 text-blue-600" />;
            }
        }

        // Check for floor change indicators
        if (step.type === 'elevator') {
            return <ChevronsUpDown className="w-6 h-6 text-blue-600" />;
        } else if (step.type === 'escalator') {
            return <ChevronsUpDown className="w-6 h-6 text-orange-600" />;
        } else if (step.type === 'stairs') {
            return <ChevronsUpDown className="w-6 h-6 text-green-600" />;
        }

        // Check if step involves floor change based on coordinate
        const stepFloorId = step.coordinate?.floorId;
        const prevStep = directions?.instructions?.[index - 1];
        const prevFloorId = prevStep?.coordinate?.floorId;

        if (stepFloorId && prevFloorId && stepFloorId !== prevFloorId) {
            return <ChevronsUpDown className="w-6 h-6 text-purple-600" />;
        }

        // Default straight arrow
        return <ArrowUp className="w-6 h-6 text-gray-700" />;
    };

    // Function to get instruction text
    const getInstructionText = (step: any, index: number) => {
        const findNearbySpaces = (coordinate: any, radiusMeters: number = 15) => {
            if (!coordinate || !mapData) return [];

            const spaces = mapData.getByType("space") || [];
            const nearbySpaces = [];

            for (const space of spaces) {
                if (space.center && space.center.floorId === coordinate.floorId) {
                    const dx = Math.abs(space.center.latitude - coordinate.latitude);
                    const dy = Math.abs(space.center.longitude - coordinate.longitude);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const distanceInMeters = distance * 111000;

                    if (distanceInMeters <= radiusMeters && space.name) {
                        nearbySpaces.push({
                            name: space.name,
                            distance: distanceInMeters
                        });
                    }
                }
            }

            return nearbySpaces
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 2)
                .map(space => space.name);
        };

        const stepFloorId = step.coordinate?.floorId;
        const prevStep = directions?.instructions?.[index - 1];
        const prevFloorId = prevStep?.coordinate?.floorId;
        const floorMap = new Map();

        mapData?.getByType("floor").forEach((floor: any) => {
            floorMap.set(floor.id, floor.name);
        });

        const currentFloorName = stepFloorId ? floorMap.get(stepFloorId) : null;
        const prevFloorName = prevFloorId ? floorMap.get(prevFloorId) : null;

        if (step.action?.type === 'Departure') {
            const departureFloor = currentFloorName ? ` on ${currentFloorName}` : '';
            return `Leave ${departureValue}${departureFloor}`;
        } else if (step.action?.type === 'Arrival') {
            const arrivalFloor = currentFloorName ? ` on ${currentFloorName}` : '';
            return `Arrive at ${destinationValue}${arrivalFloor}`;
        }

        // Get nearby spaces for context
        const nearbySpaces = findNearbySpaces(step.coordinate);
        const nearbyContext = nearbySpaces.length > 0 ? ` near ${nearbySpaces[0]}` : '';

        if (step.action?.type === 'Turn') {
            let direction = step.action.bearing?.toLowerCase() || 'ahead';
            return `Turn ${direction}${nearbyContext}`;
        } else {
            let instruction = `Continue straight${nearbyContext}`;

            if (stepFloorId && prevFloorId && stepFloorId !== prevFloorId && currentFloorName) {
                instruction += ` to ${currentFloorName}`;
            }

            return instruction;
        }
    };

    return (
        <>
            {/* Top card with current step details */}
            <div className="absolute top-6 left-6 right-6 z-50 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="text-gray-600 hover:bg-gray-100 p-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="ml-1 text-sm">Back</span>
                    </Button>
                    <span className="text-sm text-gray-500 font-medium">
                        Step {currentStepIndex + 1} of {directions.instructions.length}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        {getStepIcon(currentStep, currentStepIndex)}
                    </div>
                    <div className="flex-1">
                        {currentStep?.distance && (
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                <span className="font-medium">Walk</span>
                                {Math.round(currentStep.distance)} meters then,
                            </p>
                        )}
                        <p className="text-base font-medium text-gray-900">
                            {getInstructionText(currentStep, currentStepIndex)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom navigation buttons */}
            <div className="absolute bottom-6 left-6 right-6 z-50 flex gap-3">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handleEnhancedPreviousStep}
                    disabled={currentStepIndex === 0}
                    className="flex-1 bg-white/90 backdrop-blur-sm border-gray-300 text-gray-700 hover:bg-gray-50/90 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-medium"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Previous
                </Button>

                <Button
                    variant="default"
                    size="lg"
                    onClick={handleEnhancedNextStep}
                    disabled={currentStepIndex === directions.instructions.length - 1}
                    className="flex-1 bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700/90 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-medium"
                >
                    Next
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </>
    );
};

export default MobileNavigation;
