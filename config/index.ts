import appleLogo from "../assets/apple.svg";
import zaraLogo from "../assets/zara.svg";
import hmLogo from "../assets/hm.svg";
import lululemonLogo from "../assets/lululemon.svg";

export const appConfig = {
  mappedIn: {
    key: process.env.NEXT_PUBLIC_MAPPEDIN_KEY!,
    secret: process.env.MAPPEDIN_SECRET!,
  },
  webApp: {
    supportEmail: "hello@boothfinder.app",
    appName: "BoothFinder",
    appDescription: "BoothFinder",
    tos: "/tos",
    privacy: "/privacy"
  }
};

export const logoMap: Record<string, string> = {
  "Apple": appleLogo,
  "H&M": hmLogo,
  "Lululemon": lululemonLogo,
  "Zara": zaraLogo,
};
