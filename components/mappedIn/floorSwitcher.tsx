import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type Props = {
  mapView: any;
  mapData: any;
};

const FloorStackSwitcher: React.FC<Props> = ({ mapView, mapData }) => {
  const [floorStacks, setFloorStacks] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapData) return;

    const stacks = mapData.getByType("floor-stack");
    const allFloors = mapData.getByType("floor");

    setFloorStacks(stacks);
    setFloors(allFloors);
  }, [mapData]);

  const handleFloorChange = (floorId: string) => {
    if (!mapView || !floorId) return;
    mapView.setFloor(floorId);
    setSelectedFloorId(floorId);
  };

  return (
    <div className="absolute top-6 right-6 sm:right-14 z-10 w-48 bg-white rounded-md">
      <Select onValueChange={handleFloorChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Floor" />
        </SelectTrigger>
        <SelectContent>
          {floorStacks.map((stack) => (
            <React.Fragment key={stack.id}>
              <div className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase">{stack.name}</div>
              {floors
                .filter((f) => f.floorStack.id === stack.id)
                .map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name}
                  </SelectItem>
                ))}
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FloorStackSwitcher;
