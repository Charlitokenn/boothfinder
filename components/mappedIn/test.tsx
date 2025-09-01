"use client"

import { useMap } from "@mappedin/react-sdk";
import { TDirectionInstruction } from "@mappedin/react-sdk/mappedin-js/src";
import { useEffect } from "react";

const TestingComponent = () => {
    const { mapData, mapView } = useMap()

    const firstSpace = mapData.getByType('space').find(s => s.name === '214');
    const secondSpace = mapData.getByType('space').find(s => s.name === '216');

    useEffect(() => {
        if (firstSpace && secondSpace) {
            const directions = mapData.getDirections(firstSpace, secondSpace);
            const instructions = directions?.instructions ?? [];
            const coordinates = directions?.coordinates ?? [];
            const distance = directions?.distance

            // Add a path from the first space to the second space.
            mapView.Paths.add(coordinates);
            if (directions) {
                mapView.Navigation.draw(directions);
            }
        }
    }, [mapData, mapView])
}

export default TestingComponent