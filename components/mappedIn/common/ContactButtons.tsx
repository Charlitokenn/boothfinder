import { ContactButtonsProps } from "../../../types/location";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";

export default function ContactButtons({
  phone,
  website,
  facebook,
  showLocation = true,
  className
}: ContactButtonsProps) {
  const buttons = [];

  if (phone) {
    buttons.push(
      <Button
        key="phone"
        variant="outline"
        size="icon"
        className="rounded-xl bg-white"
      >
        <a href={`tel:${phone}`} className="flex items-center justify-center w-full h-full">
          📞
        </a>
      </Button>
    );
  }

  if (website) {
    buttons.push(
      <Button
        key="website"
        variant="outline"
        size="icon"
        className="rounded-xl bg-white"
      >
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full h-full"
        >
          🌐
        </a>
      </Button>
    );
  }

  if (facebook) {
    buttons.push(
      <Button
        key="facebook"
        variant="outline"
        size="icon"
        className="rounded-xl bg-white"
      >
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full h-full"
        >
          👍
        </a>
      </Button>
    );
  }

  if (showLocation) {
    buttons.push(
      <Button
        key="location"
        variant="outline"
        size="icon"
        className="rounded-xl bg-white"
      >
        📍
      </Button>
    );
  }

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex justify-between pt-2 gap-2", className)}>
      {buttons}
    </div>
  );
}
