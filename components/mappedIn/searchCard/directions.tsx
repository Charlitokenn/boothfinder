"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowLeft, ArrowRight, ArrowUp, Search, MapPin, ChevronsUpDown, Flame, Building2, Footprints, FootprintsIcon, PersonStanding } from "lucide-react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { Button } from "../../ui/button"
import { IconRenderer } from "../../iconRenderer/renderer"
import { SearchInput, LocationList } from "../common"
import { Location } from "../../../types/location"
import { Scroller } from "../../ui/scroller"

//TODO - Mobile view to be able to navigate like on google maps. Once you click view directions a floating button at the bottom can appear to be able to navigate back and forth on the path. 
// while the to get back to selecting departure and destination can be triggerd on the same buttons. Can have a three button thingy
// with the center as the back button

// Extend the Location type to include categories
interface DirectionsLocation extends Location {
  categories?: string[];
}

interface DirectionGroup {
  type: 'straight' | 'turn' | 'level-change';
  instructions: any[];
  totalDistance: number;
}

export interface DirectionsNavigationState {
  showMobileNavigation: boolean;
  isMobile: boolean;
  directions: any;
  currentStepIndex: number;
  departureValue: string;
  destinationValue: string;
  mapData: any;
  onBack: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
}

type DirectionsProps = {
  onBack?: () => void;
  initialDestination?: string;
  mapData?: any; // MappedIn SDK data
  mapView?: any; // MappedIn MapView instance
  onNavigationStateChange?: (state: DirectionsNavigationState | null) => void;
};

export default function Directions({ onBack, initialDestination, mapData, mapView, onNavigationStateChange }: DirectionsProps) {
  const { user } = useUser()
  const [departureValue, setDepartureValue] = useState("Choose Departure")
  const [destinationValue, setDestinationValue] = useState(initialDestination || "Choose Destination")
  const [activeInput, setActiveInput] = useState<"departure" | "destination" | null>("departure") // Set initial focus to departure
  const [searchTerm, setSearchTerm] = useState("")
  const [locations, setLocations] = useState<DirectionsLocation[]>([])
  const [directions, setDirections] = useState<any>(null)
  const [departureLoc, setDepartureLoc] = useState<any>(null)
  const [destinationLoc, setDestinationLoc] = useState<any>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<number>(1)
  const [isPathFound, setIsPathFound] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)
  const [originalCameraState, setOriginalCameraState] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [showMobileNavigation, setShowMobileNavigation] = useState(false)
  const [currentPositionMarker, setCurrentPositionMarker] = useState<any>(null)

  // Calculate estimated time based on distance and floor changes
  const calculateEstimatedTime = (directions: any) => {
    console.log('calculateEstimatedTime input:', {
      directions: directions,
      totalDistance: directions?.totalDistance,
      rawTotalDistance: directions?.rawDirections?.totalDistance,
      hasInstructions: !!directions?.instructions,
      instructionsLength: directions?.instructions?.length
    });

    const totalDistance = directions?.totalDistance || directions?.rawDirections?.totalDistance || 0;

    // If no totalDistance, calculate from individual steps
    let calculatedDistance = totalDistance;
    if (!calculatedDistance && directions?.instructions) {
      calculatedDistance = directions.instructions.reduce((sum: number, step: any) => {
        return sum + (step.distance || 0);
      }, 0);
      console.log('Calculated distance from steps:', calculatedDistance);
    }

    // If still no distance, try to calculate from raw directions
    if (!calculatedDistance && directions?.rawDirections?.directions) {
      calculatedDistance = directions.rawDirections.directions.reduce((sum: number, dir: any) => {
        return sum + (dir.properties?.distance || 0);
      }, 0);
      console.log('Calculated distance from raw directions:', calculatedDistance);
    }

    if (!calculatedDistance) {
      console.log('No distance found anywhere, returning default 1');
      return 1;
    }
    if (calculatedDistance <= 0) {
      console.log('calculatedDistance <= 0, returning default 1');
      return 1;
    }

    // Average walking speed is about 1.4 meters per second (5 km/h)
    const walkingSpeedMPS = 1.4;

    // Base time calculation from distance
    let timeInSeconds = calculatedDistance / walkingSpeedMPS;

    // Add time for each turn (approximately 2 seconds per turn)
    timeInSeconds += (directions.instructions?.filter((step: any) =>
      step.type === 'path' && step.direction !== 'straight'
    ).length || 0) * 2;

    // Add time for floor changes
    const floorChanges = directions.instructions?.filter((step: any) =>
      ['elevator', 'escalator', 'stairs'].includes(step.type)
    ).length || 0;

    // Add 30 seconds for each elevator, 20 for escalator, 45 for stairs
    directions.instructions?.forEach((step: any) => {
      if (step.type === 'elevator') timeInSeconds += 30;
      else if (step.type === 'escalator') timeInSeconds += 20;
      else if (step.type === 'stairs') timeInSeconds += 45;
    });

    // Add general buffer for crowded areas, doors, etc.
    const bufferMultiplier = 1.1;
    timeInSeconds *= bufferMultiplier;

    // Convert to minutes and round up, ensure minimum of 1 minute
    const finalTime = Math.max(1, Math.ceil(timeInSeconds / 60));
    console.log('Final calculated time:', {
      timeInSeconds,
      finalTimeMinutes: finalTime,
      distance: calculatedDistance
    });
    return finalTime;
  };

  // Helper function to format nearby spaces text
  const formatNearbySpaces = (spaces: string[], limit: number = 2): string => {
    if (!spaces.length) return '';

    const limitedSpaces = spaces.slice(0, limit);
    if (spaces.length > limit) {
      return ` (near ${limitedSpaces.join(', ')} and others)`;
    }
    return ` (near ${limitedSpaces.join(', ')})`;
  };

  // Get direction text from angle
  const getDirectionFromAngle = (angle: number) => {
    // Convert radians to degrees
    let degrees = ((angle * 180 / Math.PI) + 360) % 360;
    if (degrees > 180) degrees -= 360;

    // More sensitive angle detection - tighter thresholds for "straight"
    if (degrees >= -15 && degrees <= 15) return "straight";
    if (degrees > 15 && degrees <= 45) return "slightly right";
    if (degrees > 45 && degrees <= 90) return "right";
    if (degrees > 90 && degrees <= 135) return "sharp right";
    if (degrees > 135 || degrees < -135) return "around";
    if (degrees < -15 && degrees >= -45) return "slightly left";
    if (degrees < -45 && degrees >= -90) return "left";
    if (degrees < -90 && degrees >= -135) return "sharp left";
    return "straight";
  };

  // Merge consecutive straight instructions to reduce redundant steps
  const mergeConsecutiveStraightSteps = (instructions: any[]) => {
    return instructions.reduce((acc: any[], curr: any, idx: number) => {
      if (idx === 0) return [curr];

      const prev = acc[acc.length - 1];
      if (prev.instruction === 'Continue straight' && curr.instruction === 'Continue straight') {
        // Merge distances
        prev.distance += curr.distance;
        return acc;
      }

      return [...acc, curr];
    }, []);
  };

  // Function to log user data when reaching destination
  const logUserDataOnDestinationReached = () => {
    //TODO - Update to send this detail to the databse and always check if user already exist with respective exhibitor
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

  // Function to restore original camera view
  const restoreOriginalView = useCallback(async () => {
    if (mapView?.Camera && originalCameraState) {
      try {
        await mapView.Camera.animateTo({
          center: originalCameraState.center,
          zoomLevel: originalCameraState.zoomLevel,
          bearing: originalCameraState.bearing,
          pitch: originalCameraState.pitch,
        }, {
          duration: 2000, // 2 second smooth animation back to original view
          easing: 'ease-out'
        });
      } catch (error) {
        console.error('Error restoring original view:', error);
      }
    }
  }, [mapView, originalCameraState]);

  // Function to update position marker on the path
  const updatePositionMarker = useCallback((stepIndex: number) => {
    if (!mapView || !directions?.instructions?.[stepIndex]) return;

    const step = directions.instructions[stepIndex];
    if (!step.coordinate) return;

    try {
      // Remove existing position marker
      if (currentPositionMarker) {
        mapView.Markers.remove(currentPositionMarker);
        setCurrentPositionMarker(null);
      }

      // Create new position marker (blue dot) with pulsing animation like Google Maps
      const markerHTML = `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Pulsing outer ring -->
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: rgba(37, 99, 235, 0.3);
            border-radius: 50%;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          "></div>
          <!-- Inner blue dot -->
          <div style="
            position: relative;
            width: 12px;
            height: 12px;
            background-color: #2563eb;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
            z-index: 1;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.7;
            }
            50% {
              transform: scale(1.5);
              opacity: 0.3;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        </style>
      `;

      const marker = mapView.Markers.add(
        step.coordinate,
        markerHTML,
        {
          rank: 'always-visible',
          placement: 'center'
        }
      );

      setCurrentPositionMarker(marker);
      console.log('Position marker added successfully for step:', stepIndex);
    } catch (error) {
      console.error('Error updating position marker:', error);
    }
  }, [mapView, directions?.instructions, currentPositionMarker]);

  // Function to clear position marker
  const clearPositionMarker = useCallback(() => {
    if (currentPositionMarker && mapView) {
      try {
        mapView.Markers.remove(currentPositionMarker);
        setCurrentPositionMarker(null);
      } catch (error) {
        console.error('Error clearing position marker:', error);
      }
    }
  }, [currentPositionMarker, mapView]);

  // Function to clear navigation and restore view
  const clearNavigationAndRestore = useCallback(async () => {
    try {
      // Restore original camera view first
      await restoreOriginalView();

      // Clear position marker
      clearPositionMarker();

      // Clear navigation path
      if (mapView?.Navigation) {
        mapView.Navigation.clear();
      }

      // Reset state
      setDirections(null);
      setDepartureValue("Choose Departure");
      setDestinationValue(initialDestination || "Choose Destination");
      setDepartureLoc(null);
      setDestinationLoc(null);
      setShowSteps(false);
      setActiveStepIndex(null);
      setActiveInput("departure");
      setSearchTerm("");
      setShowMobileNavigation(false);
      setCurrentStepIndex(0);

      // Clear the stored original camera state since we're done with navigation
      setOriginalCameraState(null);
    } catch (error) {
      console.error('Error clearing navigation:', error);
    }
  }, [mapView, initialDestination]);

  // Effect to get directions when both locations are selected
  useEffect(() => {
    async function getDirections() {
      if (mapData && departureLoc?.center && destinationLoc?.center) {
        try {
          // Store original camera state before starting navigation
          if (mapView?.Camera && !originalCameraState) {
            const currentState = {
              center: mapView.Camera.center,
              zoomLevel: mapView.Camera.zoomLevel,
              bearing: mapView.Camera.bearing,
              pitch: mapView.Camera.pitch
            };
            setOriginalCameraState(currentState);
          }

          const instructions = await mapData.getDirections(departureLoc, destinationLoc,
            {
              accessible: false,
              stairs: true,
              elevators: true,
              escalators: true
            }
          );
          console.log("Raw Directions received:", instructions)
          console.log("Instructions array:", instructions.instructions)
          console.log("Total distance:", instructions.totalDistance)

          // Focus on the first portion of the journey with top-down view
          await mapView.Camera.focusOn(instructions.coordinates.slice(0, 20), {
            bearing: 0, // North facing up
            pitch: 0, // Top-down view
            screenOffsets: { bottom: 50, left: 50, top: 50, right: 50 },
          });

          if (!instructions || !instructions.instructions) {
            console.error('No path found between locations');
            setIsPathFound(false)
            return;
          }

          // Draw the path on the map
          try {
            mapView.Navigation.draw(instructions, {
              pathOptions: {
                smoothing: true,
                resolution: 10,
                nearRadius: 0.4,
                farRadius: 0.8,
                displayArrowsOnPath: true,
                animateArrowsOnPath: true,
                pathfinderOptions: {
                  distanceFromWall: 0.5,
                  smoothingIterations: 3
                }
              }
            });
          } catch (drawError) {
            console.error('Error drawing navigation path:', drawError);
          }

          // Process the directions
          const processedDirections: any = {
            rawDirections: instructions,
            totalDistance: instructions.totalDistance,
            instructions: instructions.instructions.map((step: any, index: number) => {
              let instruction = '';

              // Process based on action type from MappedIn API
              if (step.action.type === 'Departure') {
                instruction = `Leave ${departureValue || 'starting location'}`;
              } else if (step.action.type === 'Arrival') {
                instruction = `Arrive at ${destinationValue || 'destination'}`;
              } else if (step.action.type === 'Turn') {
                const bearing = step.action.bearing;
                const referencePosition = step.action.referencePosition;

                if (bearing === 'Left') {
                  instruction = 'Turn left';
                } else if (bearing === 'Right') {
                  instruction = 'Turn right';
                } else {
                  instruction = 'Continue straight';
                }

                // Add contextual information for turns
                if (bearing !== 'Straight' && step.distance > 0) {
                  if (step.distance < 10) {
                    instruction = `${instruction} and continue`;
                  } else if (step.distance < 50) {
                    instruction = `${instruction} and walk ${Math.round(step.distance)} meters`;
                  } else {
                    instruction = `${instruction} and continue for ${Math.round(step.distance)} meters`;
                  }
                } else if (step.distance > 0) {
                  if (step.distance < 10) {
                    instruction = 'Continue straight';
                  } else {
                    instruction = `Head straight for ${Math.round(step.distance)} meters`;
                  }
                }
              } else {
                // Fallback for any other action types
                instruction = step.distance > 0
                  ? `Continue for ${Math.round(step.distance)} meters`
                  : 'Continue straight';
              }

              return {
                ...step,
                instruction,
                distance: step.distance || 0
              };
            }).filter((step: any) => step !== null) // Remove any null entries
          };          // Simplify instructions for very close locations
          if (processedDirections.totalDistance < 5) {
            processedDirections.instructions = [{
              instruction: 'Walk straight to your destination',
              distance: processedDirections.totalDistance,
              type: 'path'
            }];
          } else {
            // Merge consecutive straight instructions
            processedDirections.instructions = mergeConsecutiveStraightSteps(processedDirections.instructions);
          }

          // Calculate the actual distance from steps since API totalDistance might be 0
          const calculatedDistance = processedDirections.totalDistance ||
            processedDirections.instructions?.reduce((sum: number, step: any) => {
              return sum + (step.distance || 0);
            }, 0) || 0;

          // Add calculated distance to directions object
          processedDirections.calculatedDistance = calculatedDistance;

          setDirections(processedDirections);
          console.log('Processed directions:', {
            totalDistance: processedDirections.totalDistance,
            calculatedDistance: calculatedDistance,
            instructionsCount: processedDirections.instructions?.length,
            rawTotalDistance: instructions.totalDistance
          });

          const calculatedTime = calculateEstimatedTime(processedDirections);
          console.log('Calculated estimated time:', calculatedTime);
          setEstimatedTime(calculatedTime);
        } catch (error) {
          console.error('Error getting directions:', error);
        }
      }
    }

    getDirections();
  }, [mapData, departureLoc, destinationLoc]);

  // Find the initial destination location when spaces are loaded
  useEffect(() => {
    if (initialDestination && locations.length > 0 && mapData) {
      const initialLoc = locations.find(loc => loc.name === initialDestination);
      if (initialLoc) {
        setDestinationValue(initialLoc.name);
        // Find and set the actual space object for directions
        const space = mapData.getByType("space").find((s: any) => s.id === initialLoc.id);
        if (space) {
          setDestinationLoc(space);
        }
      }
    }
  }, [initialDestination, locations, mapData]);

  const departureInputRef = useRef<HTMLInputElement>(null)
  const destinationInputRef = useRef<HTMLInputElement>(null)

  // Cleanup effect to clear navigation path when component unmounts
  useEffect(() => {
    return () => {
      if (mapView?.Navigation) {
        mapView.Navigation.clear();
      }
      // Clear position marker
      clearPositionMarker();
      // Restore original view when component unmounts
      if (originalCameraState) {
        restoreOriginalView();
      }
    };
  }, [mapView, originalCameraState]);

  // Effect to load spaces from mapData and set up map click handlers
  useEffect(() => {
    if (mapData && mapView) {
      const spaces = mapData.getByType("space") || [];
      const floorMap = new Map();

      // Create a map of floor IDs to floor names
      mapData.getByType("floor").forEach((floor: any) => {
        floorMap.set(floor.id, floor.name);
      });

      // Transform spaces into Location type
      const locationsList = spaces.map((space: any) => ({
        id: space.id,
        name: space.name,
        level: space.center?.floorId ? floorMap.get(space.center.floorId) : "Unknown Level",
        logo: space.logo || "/placeholder.svg?height=24&width=24",
        categories: space.categories || []
      }));

      // Sort locations by name
      locationsList.sort((a: Location, b: Location) => a.name.localeCompare(b.name));
      setLocations(locationsList);

      // Set up map click handlers
      const clickHandler = (event: any) => {
        if (!event?.object?.node) return;

        const node = event.object.node;

        let targetSpace;

        if (node.type === 'space') {
          targetSpace = mapData.getByType("space").find((s: any) => s.id === node.id);
        } else if (node.type === 'label') {
          const locationId = node.location?.id;
          if (locationId) {
            targetSpace = mapData.getByType("space").find((s: any) => s.id === locationId);
          }
        }

        if (targetSpace) {
          // Set as destination by default
          setDestinationValue(targetSpace.name);
          setDestinationLoc(targetSpace);
          setActiveInput(null);  // Close any active input
          setSearchTerm("");     // Clear search term

          // Focus camera on the selected space
          if (mapView.Camera) {
            mapView.Camera.focusOn({
              target: targetSpace,
              zoom: 0.3,
              duration: 500,
              tilt: 0.3  // Add slight tilt for better visibility
            });
          }

          // If we don't have a departure set yet, set this as departure instead
          if (departureValue === "Choose Departure") {
            setDepartureValue(targetSpace.name);
            setDepartureLoc(targetSpace);
          }
        }
      };

      // Set up click handlers for the map
      const setupMapHandlers = () => {
        mapView.on('click', clickHandler);
        mapView.on('label_click', clickHandler);
      };

      // If map is ready, set up handlers immediately
      if (mapView.loaded) {
        setupMapHandlers();
      } else {
        // Wait for map to be ready
        mapView.on('load', setupMapHandlers);
      }

      // Cleanup
      return () => {
        mapView.off('click', clickHandler);
        mapView.off('label_click', clickHandler);
        mapView.off('load', setupMapHandlers);
      };
    }
  }, [mapData, mapView]);

  // Effect to focus and select the text in the input when it becomes active
  useEffect(() => {
    if (activeInput === "departure" && departureInputRef.current) {
      departureInputRef.current.focus()
      departureInputRef.current.select() // Select all text
    } else if (activeInput === "destination" && destinationInputRef.current) {
      destinationInputRef.current.focus()
      destinationInputRef.current.select() // Select all text
    }
  }, [activeInput])

  const handleSwap = () => {
    // Swap display values
    const tempValue = departureValue
    setDepartureValue(destinationValue)
    setDestinationValue(tempValue)

    // Swap actual location objects
    const tempLoc = departureLoc
    setDepartureLoc(destinationLoc)
    setDestinationLoc(tempLoc)

    // Clear active input and search term after swap
    setActiveInput(null)
    setSearchTerm("")

    // The useEffect for directions will automatically trigger with the new locations
    // Note: We don't clear originalCameraState here since we're still in navigation mode
  }

  // Mobile detection
  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  // Mobile navigation handlers
  const handleNextStep = useCallback(() => {
    if (directions?.instructions && currentStepIndex < directions.instructions.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setActiveStepIndex(nextIndex);

      // Focus camera on the step and update position marker
      const step = directions.instructions[nextIndex];
      if (step?.coordinate && mapView) {
        updatePositionMarker(nextIndex);

        // Focus camera on the step
        try {
          mapView.Camera.animateTo({
            center: step.coordinate,
            zoomLevel: 20,
            pitch: 60,
            bearing: 0,
          }, {
            duration: 1000,
          });
        } catch (error) {
          console.error('Error focusing camera on step:', error);
        }
      }
    }
  }, [directions?.instructions, currentStepIndex, mapView, updatePositionMarker]);

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setActiveStepIndex(prevIndex);

      // Focus camera on the step and update position marker
      const step = directions?.instructions?.[prevIndex];
      if (step?.coordinate && mapView) {
        updatePositionMarker(prevIndex);

        // Focus camera on the step
        try {
          mapView.Camera.animateTo({
            center: step.coordinate,
            zoomLevel: 20,
            pitch: 60,
            bearing: 0,
          }, {
            duration: 1000,
          });
        } catch (error) {
          console.error('Error focusing camera on step:', error);
        }
      }
    }
  }, [currentStepIndex, directions?.instructions, mapView, updatePositionMarker]);

  // Memoize the onBack handler to prevent recreation on every render
  const handleBack = useCallback(() => {
    setShowMobileNavigation(false);
    setActiveStepIndex(null);
    setCurrentStepIndex(0);
    // Remove position marker
    if (currentPositionMarker && mapView) {
      mapView.Markers.remove(currentPositionMarker);
      setCurrentPositionMarker(null);
    }
  }, [currentPositionMarker, mapView]);

  // Notify parent component of navigation state changes
  useEffect(() => {
    if (showMobileNavigation && isMobile && directions?.instructions && onNavigationStateChange) {
      const navigationState: DirectionsNavigationState = {
        showMobileNavigation,
        isMobile,
        directions,
        currentStepIndex,
        departureValue,
        destinationValue,
        mapData,
        onBack: handleBack,
        onPreviousStep: handlePreviousStep,
        onNextStep: handleNextStep,
      };
      onNavigationStateChange(navigationState);
    } else if (onNavigationStateChange) {
      onNavigationStateChange(null);
    }
  }, [showMobileNavigation, isMobile, directions, currentStepIndex, departureValue, destinationValue, mapData, handleBack, handlePreviousStep, handleNextStep, onNavigationStateChange]);

  // Main back handler for different contexts
  const handleBackAction = useCallback(() => {
    if (showMobileNavigation) {
      handleBack(); // Use the memoized mobile navigation back handler
    } else if (showSteps) {
      setShowSteps(false);
    } else if (onBack) {
      // Clear navigation and restore original view before going back
      clearNavigationAndRestore().then(() => {
        onBack();
      });
    }
  }, [showMobileNavigation, showSteps, onBack, handleBack, clearNavigationAndRestore]);

  const handleInputClick = (inputName: "departure" | "destination") => {
    setActiveInput(inputName)
    // Set search term to current value of the clicked input
    setSearchTerm(inputName === "departure" ? departureValue : destinationValue)
  }

  const handleInputChange = (value: string, inputName: "departure" | "destination") => {
    setSearchTerm(value)
    if (inputName === "departure") {
      setDepartureValue(value)
    } else {
      setDestinationValue(value)
    }
  }

  const handleInputBlur = () => {
    // Keep the active input state but clear the search term if no value was selected
    setTimeout(() => {
      if (!departureValue && activeInput === "departure") {
        setSearchTerm("")
      } else if (!destinationValue && activeInput === "destination") {
        setSearchTerm("")
      }
    }, 100)
  }

  // Group similar directions together
  const groupSimilarDirections = (instructions: any[]): DirectionGroup[] => {
    if (!instructions?.length) return [];

    const groups: DirectionGroup[] = [];
    let currentGroup: DirectionGroup | null = null;

    instructions.forEach((step) => {
      // Determine the type of the current instruction
      let stepType: 'straight' | 'turn' | 'level-change';

      if (['elevator', 'escalator', 'stairs'].includes(step.type)) {
        stepType = 'level-change';
      } else if (step.type === 'path') {
        // Check if it's a significant turn
        const isSignificantTurn = step.angle && Math.abs(step.angle) > 20;
        stepType = isSignificantTurn ? 'turn' : 'straight';
      } else {
        stepType = 'straight'; // Default case
      }

      // Start a new group if needed
      if (!currentGroup || currentGroup.type !== stepType) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          type: stepType,
          instructions: [],
          totalDistance: 0
        };
      }

      // Add to current group
      currentGroup.instructions.push(step);
      currentGroup.totalDistance += step.distance || 0;
    });

    // Add the last group
    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const handleLocationSelect = (location: Location) => {
    if (!mapData) return;

    if (activeInput === "departure") {
      setDepartureValue(location.name)
      setSearchTerm(location.name)
      // Find and set the actual space object for directions
      const space = mapData.getByType("space").find((s: any) => s.id === location.id);
      if (space?.center) {
        setDepartureLoc(space);
      }
    } else if (activeInput === "destination") {
      setDestinationValue(location.name)
      setSearchTerm(location.name)
      // Find and set the actual space object for directions
      const space = mapData.getByType("space").find((s: any) => s.id === location.id);
      if (space?.center) {
        setDestinationLoc(space);
      }
    }
    // Don't immediately clear the active input to allow the value to be visible
    setTimeout(() => {
      setActiveInput(null)
      setSearchTerm("")
    }, 100)
  }

  const filteredLocations = searchTerm
    ? locations.filter(
      (location: Location) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.level && location.level.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (location.categories && location.categories.some(cat =>
          cat.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    )
    : locations

  const content = (
    <div className="w-full rounded-3xl shadow-none border-none p-4 pb-0 space-y-2 bg-white backdrop-blur-md dark:bg-gray-900/80">
      {/* Header */}
      <div className="flex items-center px-4 -mb-1.5 mt-2">
        <button
          onClick={handleBackAction}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          {(showSteps || showMobileNavigation) ? <span className="font-medium text-base">Back</span> : <span className="font-bold text-xl">Directions</span>}
        </button>
      </div>

      {/* Search and Destination Inputs - Hidden when showing navigation instructions */}
      {!showSteps && !showMobileNavigation && (
        <>
          <div className="flex flex-row items-center gap-2 mx-3 py-4">
            {/* Path Indicator */}
            <div className="flex flex-col justify-center items-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <div className="w-px h-10 bg-gray-300 border-l border-dotted border-gray-200" />
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>

            {/* Input Fields */}
            <div className="flex-1 space-y-3">
              {/* Departure Input */}
              {activeInput === "departure" ? (
                <SearchInput
                  ref={departureInputRef}
                  value={searchTerm}
                  onChange={(value) => {
                    setSearchTerm(value)
                    setDepartureValue(value)
                  }}
                  onBlur={handleInputBlur}
                  placeholder="Choose Departure"
                  autoFocus={true}
                />
              ) : (
                <div
                  className="flex items-center bg-gray-100 rounded-lg px-4 py-2.5 text-gray-600 text-base cursor-pointer"
                  onClick={() => handleInputClick("departure")}
                >
                  <Search className="w-5 h-5 mr-3 text-gray-500" />
                  <span>{departureValue}</span>
                </div>
              )}
              {/* Destination Input */}
              {activeInput === "destination" ? (
                <SearchInput
                  ref={destinationInputRef}
                  value={searchTerm}
                  onChange={(value) => {
                    setSearchTerm(value)
                    setDestinationValue(value)
                  }}
                  onBlur={handleInputBlur}
                  placeholder="Enter Destination"
                  autoFocus={true}
                />
              ) : (
                <div
                  className="flex items-center bg-gray-100 rounded-lg px-4 py-2.5 text-gray-800 text-base font-medium cursor-pointer"
                  onClick={() => handleInputClick("destination")}
                >
                  {destinationValue === "Choose Destination" ? (
                    <Search className="w-5 h-5 mr-3 text-gray-500" />
                  ) : (
                    <MapPin className="w-5 h-5 mr-3 text-red-500" />
                  )}
                  <span>{destinationValue}</span>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex items-center self-stretch">
              <Button variant="ghost" size="icon" onClick={handleSwap} className="rotate-90 w-6 h-6 cursor-pointer hover:bg-none">
                <IconRenderer name="swap" className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
          </div>

          <hr className="-mt-2.5 mx-4 border-gray-100 border-1" />
          {isPathFound && <div className="flex justify-center py-2"><span className="text-gray-500 text-xs">No path found between locations!</span></div>}
        </>
      )}

      {/* Time to destination header - Outside scrollable area */}
      {showSteps && departureValue !== "Choose Departure" && destinationValue !== "Choose Destination" && (
        <div className="px-4 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">{destinationValue}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">{estimatedTime}</span>
              <span className="text-base ml-1 text-gray-600 font-medium">min</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{Math.round(directions?.calculatedDistance || directions?.totalDistance || 0)} m</span>
              <div className="flex items-center gap-1">
                <Footprints className="w-4 h-4" />
                <span>Walking</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`overflow-y-auto overflow-x-hidden scrollbar-hide ${showSteps ? 'max-h-[75vh]' : 'max-h-[70vh]'} pb-4 ${showSteps ? '' : '-mt-3'} mx-2.5`}>
        {activeInput ? (
          // Show location selection when an input is active
          <LocationList
            locations={filteredLocations}
            onLocationSelect={handleLocationSelect}
            showLevel={true}
            variant="popular"
          />
        ) : departureValue !== "Choose Departure" && destinationValue !== "Choose Destination" ? (
          showSteps ? (
            // Navigation steps view
            <div className="flex flex-col px-2 -mt-2">
              {/* Instruction hint */}
              <div className="px-2 py-2 mb-2">
                <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span>Tap any step to navigate on the map</span>
                </div>
              </div>

              <div
                className="space-y-1 max-h-[45vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {directions?.instructions?.map((step: any, index: number) => {
                  // Determine the appropriate icon based on action type and bearing
                  const getStepIcon = () => {
                    if (step.action?.type === 'Departure') {
                      return <div className="w-3 h-3 bg-blue-500 rounded-full" />;
                    } else if (step.action?.type === 'Arrival') {
                      return <MapPin className="w-5 h-5 text-red-500" />;
                    } else if (step.action?.type === 'Turn') {
                      if (step.action.bearing === 'Left') {
                        return <ArrowLeft className="w-5 h-5 text-gray-700" />;
                      } else if (step.action.bearing === 'Right') {
                        return <ArrowRight className="w-5 h-5 text-gray-700" />;
                      }
                    }

                    // Check for floor change indicators
                    if (step.type === 'elevator') {
                      return <ChevronsUpDown className="w-5 h-5 text-blue-600" />;
                    } else if (step.type === 'escalator') {
                      return <ChevronsUpDown className="w-5 h-5 text-orange-600" />;
                    } else if (step.type === 'stairs') {
                      return <ChevronsUpDown className="w-5 h-5 text-green-600" />;
                    }

                    // Check if step involves floor change based on coordinate
                    const stepFloorId = step.coordinate?.floorId;
                    const prevStep = directions?.instructions?.[index - 1];
                    const prevFloorId = prevStep?.coordinate?.floorId;

                    if (stepFloorId && prevFloorId && stepFloorId !== prevFloorId) {
                      return <ChevronsUpDown className="w-5 h-5 text-purple-600" />;
                    }

                    // Default straight arrow
                    return <ArrowUp className="w-5 h-5 text-gray-700" />;
                  };

                  // Enhanced instruction text
                  const getInstructionText = () => {
                    // Helper function to find nearby spaces
                    const findNearbySpaces = (coordinate: any, radiusMeters: number = 15) => {
                      if (!coordinate || !mapData) return [];

                      const spaces = mapData.getByType("space") || [];
                      const nearbySpaces = [];

                      for (const space of spaces) {
                        if (space.center && space.center.floorId === coordinate.floorId) {
                          // Calculate distance using simple coordinate distance
                          const dx = Math.abs(space.center.latitude - coordinate.latitude);
                          const dy = Math.abs(space.center.longitude - coordinate.longitude);
                          const distance = Math.sqrt(dx * dx + dy * dy);

                          // Convert to approximate meters (rough estimation)
                          const distanceInMeters = distance * 111000; // Rough lat/lng to meters conversion

                          if (distanceInMeters <= radiusMeters && space.name) {
                            nearbySpaces.push({
                              name: space.name,
                              distance: distanceInMeters
                            });
                          }
                        }
                      }

                      // Sort by distance and return closest ones
                      return nearbySpaces
                        .sort((a, b) => a.distance - b.distance)
                        .slice(0, 2) // Return up to 2 closest spaces
                        .map(space => space.name);
                    };

                    // Check for floor change information
                    const stepFloorId = step.coordinate?.floorId;
                    const prevStep = directions?.instructions?.[index - 1];
                    const prevFloorId = prevStep?.coordinate?.floorId;
                    const floorMap = new Map();

                    // Create floor map for floor names
                    mapData?.getByType("floor").forEach((floor: any) => {
                      floorMap.set(floor.id, floor.name);
                    });

                    const currentFloorName = stepFloorId ? floorMap.get(stepFloorId) : null;
                    const prevFloorName = prevFloorId ? floorMap.get(prevFloorId) : null;

                    // Handle different step types
                    if (step.action?.type === 'Departure') {
                      const departureFloor = currentFloorName ? ` on ${currentFloorName}` : '';
                      return `Leave ${departureValue}${departureFloor}`;
                    } else if (step.action?.type === 'Arrival') {
                      const arrivalFloor = currentFloorName ? ` on ${currentFloorName}` : '';
                      return `Arrive at ${destinationValue}${arrivalFloor}`;
                    } else if (step.action?.type === 'Turn') {
                      // Find nearby spaces for turn instructions
                      const nearbySpaces = findNearbySpaces(step.coordinate, 20);
                      let nearbyContext = '';

                      if (nearbySpaces.length > 0) {
                        if (nearbySpaces.length === 1) {
                          nearbyContext = ` near ${nearbySpaces[0]}`;
                        } else {
                          nearbyContext = ` near ${nearbySpaces[0]} and ${nearbySpaces[1]}`;
                        }
                      }

                      let instruction = '';

                      if (step.action.bearing === 'Left') {
                        instruction = `Turn left${nearbyContext}`;
                      } else if (step.action.bearing === 'Right') {
                        instruction = `Turn right${nearbyContext}`;
                      } else {
                        instruction = `Continue straight${nearbyContext}`;
                      }

                      // Add floor information if there's a floor change
                      if (stepFloorId && prevFloorId && stepFloorId !== prevFloorId && currentFloorName) {
                        instruction += ` to ${currentFloorName}`;
                      }

                      return instruction;
                    }

                    // Handle explicit floor change steps
                    if (step.type === 'elevator' && currentFloorName && prevFloorName && currentFloorName !== prevFloorName) {
                      return `Take elevator to ${currentFloorName}`;
                    } else if (step.type === 'escalator' && currentFloorName && prevFloorName && currentFloorName !== prevFloorName) {
                      return `Take escalator to ${currentFloorName}`;
                    } else if (step.type === 'stairs' && currentFloorName && prevFloorName && currentFloorName !== prevFloorName) {
                      return `Take stairs to ${currentFloorName}`;
                    }

                    // Check for general floor changes
                    if (stepFloorId && prevFloorId && stepFloorId !== prevFloorId && currentFloorName && prevFloorName) {
                      return `Go to ${currentFloorName}`;
                    }

                    return step.instruction || 'Continue straight';
                  };

                  // Handle step click to focus camera on that coordinate
                  const handleStepClick = (stepIndex: number) => {
                    if (!mapView || !step.coordinate) return;

                    try {
                      // Set this step as active
                      setActiveStepIndex(stepIndex);

                      // Check if this is the arrival/destination step and log user data
                      if (step.action?.type === 'Arrival') {
                        logUserDataOnDestinationReached();
                      }

                      // Update position marker to show current location
                      updatePositionMarker(stepIndex);

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
                        const nextStep = directions?.instructions?.[index + 1];
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
                          // If no next step, use generic left turn orientation
                          targetBearing = 270; // West
                        } else if (step.action.bearing === 'Right') {
                          // If no next step, use generic right turn orientation
                          targetBearing = 90; // East
                        }
                      } else if (stepIndex > 0) {
                        // For other steps, calculate bearing from previous step
                        const prevStep = directions?.instructions?.[index - 1];
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
                          zoomLevel: 19, // Good zoom level for navigation details
                          bearing: targetBearing, // Orient map in direction of travel
                          pitch: 15, // Slight angle for better navigation context (instead of pure top-down)
                        }, {
                          duration: 1500, // Smooth 1.5 second animation
                          easing: 'ease-in-out' // Smooth animation curve
                        });
                      }, animationDelay);

                    } catch (error) {
                      console.error('Error focusing on step coordinate:', error);
                    }
                  };

                  const isActiveStep = activeStepIndex === index;

                  return (
                    <div
                      key={index}
                      className={`group flex items-start gap-4 py-3 px-2 rounded-lg transition-all duration-200 cursor-pointer border ${isActiveStep
                        ? 'bg-blue-100 border-blue-300 shadow-sm'
                        : 'border-transparent hover:bg-blue-50 hover:border-blue-200'
                        }`}
                      onClick={() => handleStepClick(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStepClick(index);
                        }
                      }}
                    >
                      {/* Step Icon */}
                      <div className="flex items-center justify-center w-8 h-8 mt-1 flex-shrink-0">
                        {getStepIcon()}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        {step.distance > 0 && (
                          <div className={`text-sm font-normal flex items-center gap-1 ${isActiveStep
                            ? 'text-blue-600'
                            : 'text-gray-600'
                            }`}>
                            <span className="font-medium">Walk</span>
                            {step.distance < 1000
                              ? `${Math.round(step.distance)} meters`
                              : `${(step.distance / 1000).toFixed(1)} km`
                            } then,
                          </div>
                        )}
                        <div className={`text-base font-medium leading-tight mb-1 transition-colors ${isActiveStep
                          ? 'text-blue-800'
                          : 'text-gray-700 group-hover:text-blue-700'
                          }`}>
                          {getInstructionText()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Summary view
            <div className="flex flex-col p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-gray-900">{destinationValue}</span>
                    <span className="text-sm text-gray-600">{Math.round(directions?.calculatedDistance || directions?.totalDistance || 0)} meters away</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{estimatedTime}</div>
                  <div className="text-sm text-gray-600">min walk</div>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (isMobile) {
                    setShowMobileNavigation(true);
                    setCurrentStepIndex(0);
                    setActiveStepIndex(0);
                    // Focus on first step
                    if (directions?.instructions?.[0]?.coordinate && mapView) {
                      updatePositionMarker(0);
                    }
                  } else {
                    setShowSteps(true);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2"
              >
                <Footprints className="w-4 h-4" />
                <span>View Step-by-Step Directions</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )
        ) : (
          // Show all locations when no input is active
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">All Locations</h3>
            <LocationList
              locations={locations}
              onLocationSelect={handleLocationSelect}
              showLevel={true}
              variant="popular"
            />
          </div>
        )}
      </div>
    </div>
  )

  // Always return the regular content - mobile navigation is handled separately
  return content;
}
