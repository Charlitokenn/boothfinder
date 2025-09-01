import { cakeIcon, loginIcon, mapPinIcon, swapIcon } from "../../assets/icons";

export const iconRegistry = {
    mapPin: mapPinIcon,
    swap: swapIcon,
    loginIcon: loginIcon,
    cake: cakeIcon,
} as const;

export type IconKey = keyof typeof iconRegistry;
