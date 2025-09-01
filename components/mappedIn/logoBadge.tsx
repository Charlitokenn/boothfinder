import { appConfig } from "../../config";
import { Badge } from "../ui/badge";

const LogoBadge = () => {
  return (
    <div className="absolute bottom-4 left-3 z-10">
      <Badge variant="secondary" className="text-sm font-medium py-2 text-gray-500">Powered: {appConfig.webApp.appName} Platform</Badge>
    </div>
  );
};

export default LogoBadge;
