import { App } from 'electron'
import { Logger } from './lib/logging'
import { ConfigHelper } from './helpers/ConfigHelper'
import { AllWindowsManager } from './helpers/AllWindowsManager'
import { Config } from './lib/config'
import { APIHelper } from './helpers/APIHelper'
import { StatusCode, StatusObject } from './lib/api'

/** This is the main class for the application */
export class ChefManager {
	private configHelper: ConfigHelper
	private windowsHelper: AllWindowsManager
	private api: APIHelper

	private status: StatusObject = {
		statusCode: StatusCode.GOOD,
		message: '',
	}

	constructor(private logger: Logger, private app: App) {
		this.configHelper = ConfigHelper.GetConfigHelper(this.logger, this.app)
		this.windowsHelper = AllWindowsManager.GetAllWindowsManager(this.logger)

		this.windowsHelper.on('window-has-been-modified', () => {
			this.configHelper.onModifiedConfig(true)
		})
		this.windowsHelper.on('status', (windowsStatus) => {
			this.api.setStatus({
				app: this.status,
				windows: windowsStatus,
			})
		})

		this.windowsHelper.on('closed-window', (id) => {
			this.logger.warn(`Window "${id}" closed!`)
		})

		this.api = APIHelper.GetAPIHelper(this.logger, this.windowsHelper)
	}

	public onAppReady(): void {
		this.windowsHelper.initialize()

		this.configHelper.initialize()
		this.configHelper.on('updated-config', (config: Config) => {
			this.logger.debug('Updated config:\n' + JSON.stringify(config))
			this.windowsHelper.triggerUpdateWindows(config)

			this.api.init(config)
		})
	}
	public onActivate(): void {
		this.configHelper.addWindow()
	}
}
