import { App } from 'electron'
import { Logger } from './lib/logging'
import { ConfigHelper } from './helpers/ConfigHelper'
import { AllWindowsManager } from './helpers/AllWindowsManager'
import { Config } from './lib/config'

/** This is the main class for the application */
export class ChefManager {
	private configHelper: ConfigHelper
	private windowsHelper: AllWindowsManager

	constructor(private logger: Logger, private app: App) {
		this.configHelper = new ConfigHelper(this.logger, this.app)
		this.windowsHelper = new AllWindowsManager(this.logger)

		this.windowsHelper.on('config-has-been-modified', () => {
			this.configHelper.onModifiedConfig(true)
		})
		this.windowsHelper.on('closed-window', (id) => {
			this.logger.warn(`Window "${id}" closed!`)
		})
	}

	public onAppReady(): void {
		this.windowsHelper.initialize()

		this.configHelper.initialize()
		this.configHelper.on('updated-config', (config: Config) => {
			this.logger.info('Updated config:\n' + JSON.stringify(config))
			this.windowsHelper.triggerUpdateWindows(config)
		})
	}
	public onActivate(): void {
		this.configHelper.addWindow()
	}
}
