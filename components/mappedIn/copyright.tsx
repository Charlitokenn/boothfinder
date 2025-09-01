import { appConfig } from '../../config'
import { Badge } from '../ui/badge'

const CopyRight = () => {
  return (
    <div className="absolute bottom-0 right-0 z-10">
      <Badge variant="secondary" className="text-xs font-sm w-60 h-4.5 flex justify-between rounded-sm">
        © {appConfig.webApp.appName}
        <p
          className="text-xs cursor-pointer hover:text-blue-800 hover:underline"
          onClick={() => window.open(`mailto:${appConfig.webApp.supportEmail}`)}>
          Support: {appConfig.webApp.supportEmail}
        </p>
      </Badge>
    </div>
  )
}

export default CopyRight