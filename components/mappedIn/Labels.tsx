import { Label, useMap } from "@mappedin/react-sdk";

const SpaceLabels = () => {
    const { mapData, mapView } = useMap();

    return (
        <>
            {mapData.getByType("space").map((space) => (
                <Label
                    key={space.id}
                    target={space.center}
                    text={space.name}
                    options={{
                        interactive: true,
                        appearance: {
                            marker: {
                                backgroundColor: { active: "#fff", inactive: "#fff" },
                                foregroundColor: { active: "#0530AD", inactive: "#000" },
                                icon: "https://static.vecteezy.com/system/resources/thumbnails/006/398/494/small_2x/illustration-of-store-or-market-flat-design-vector.jpg",
                                iconFit: "fill",
                                iconOverflow: "hidden",
                                iconPadding: 5,
                                iconScale: 1.2,
                                iconSize: 28,
                                iconVisibleAtZoomLevel: 16,
                            }
                        }
                    }}
                />
            ))}
        </>
    )
}

export default SpaceLabels