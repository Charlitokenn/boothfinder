import { iconRegistry, IconKey } from "./index";

type Props = {
  name: IconKey;
  size?: number | string; // Accepts 20, "1.25rem", etc.
  color?: string;         // Accepts Tailwind text class or any CSS color
  className?: string;     // Optional extra utility classes
};

export const IconRenderer = ({ name, size = 20, color = "currentColor", className = "" }: Props) => {
  const IconComponent = iconRegistry[name];

  if (!IconComponent) {
    return <div className="text-red-500">Oops! Icon {name} not found.</div>;
  }

  const style = {
    width: typeof size === "number" ? `${size}px` : size,
    height: typeof size === "number" ? `${size}px` : size,
    color,
  };

  return <IconComponent className={className} style={style} />;
};
