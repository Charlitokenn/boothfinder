import React, { useState, useEffect } from "react";
import Mappedin, { Marker, useEvent, useMap } from "@mappedin/react-sdk";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { IconRenderer } from "../iconRenderer/renderer";
// import "./styles.css";

// https://docs.mappedin.com/react/v6/latest/functions/Marker.html
export default function Markers() {
    const { mapData, mapView } = useMap();
    const [markers, setMarkers] = useState<
        {
            id: string;
            coordinate: Mappedin.Coordinate;
            anchor: Mappedin.TMarkerAnchor;
            text: string;
            rank: string;
        }[]
    >([]);

    // map spaces with custom hover colors
    const colorMapping: Record<string, string> = {
        withName: "#f26336",
        withoutName: "#293136",
    };

    useEffect(() => {
        // set spaces to be interactive with hover colors
        // mapData.getByType("space").forEach((space) => {
        //     mapView.updateState(space, {
        //         interactive: true,
        //         hoverColor: space.name
        //             ? colorMapping.withName
        //             : colorMapping.withoutName,
        //     });
        // });

        // add the default marker to the state
        // if (markers.length === 0) {
        //     const defaultMarker = {
        //         id: "default-marker",
        //         coordinate: mapData.mapCenter,
        //         anchor: "top" as Mappedin.TMarkerAnchor,
        //         text: "Click a space to add a marker",
        //         rank: "always-visible",
        //     };

        //     setMarkers([defaultMarker]);
        // }
    }, [mapData]);

    // handle map click events
    useEvent("click", (event) => {
        if (event.markers.length > 0) {
            // if a marker is clicked, remove it
            const clickedMarker = event.markers[0];
            setMarkers((prev) =>
                prev.filter((marker) => marker.coordinate !== clickedMarker.target)
            );
        } else if (event.spaces.length > 0) {
            // if a space is clicked, add a new marker
            const space = event.spaces[0];
            const text = space.name || "Unnamed Space";

            // randomize anchor positions
            const anchors: Mappedin.TMarkerAnchor[] = [
                "top",
                // "right",
                // "bottom",
                // "left",
                // "top-left",
                // "top-right",
                // "bottom-left",
                // "bottom-right",
            ];
            anchors.sort(() => 0.5 - Math.random());

            const newMarker = {
                id: event.coordinate.id,
                coordinate: event.coordinate,
                anchor: anchors[0],
                text,
                rank: "high", // example rank value
            };

            // console.log("✏️ New marker:", newMarker);
            setMarkers((prev) => [...prev, newMarker]);
        }
    });

    // render markers using the Marker component
    return (
        <>
            {markers.map((marker) => (
                // note: <Marker> component generates a .mappedin-marker class
                // this class can be used to apply custom styles based on anchor positions
                <Marker
                    key={marker.id}
                    target={marker.coordinate}
                    onLoad={(marker) => console.log("🟢 Marker loaded:", marker)}
                    options={{
                        interactive: true,
                        anchor: marker.anchor,
                    }}
                >
                    <div className="">
                        <IconRenderer name="mapPin" />
                        {marker.text}
                    </div>
                </Marker>
            ))}
        </>
    );
}
