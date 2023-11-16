import { App, globalShortcut, dialog } from 'electron'
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
		this.logger.info('Initializing...')

		this.windowsHelper.initialize()

		this.configHelper.initialize()
		this.configHelper.on('error', (e) => {
			this.logger.error(e)
		})
		this.configHelper.on('updated-config', (config: Config) => {
			this.logger.debug('Updated config:\n' + JSON.stringify(config))
			this.windowsHelper.triggerUpdateWindows(config)

			this.api.init(config)
		})

		this.setupGlobalShortcuts()
	}
	public onActivate(): void {
		this.configHelper.addWindow()
	}

	private setupGlobalShortcuts() {
		// CTRL+Alt+SHIFT+F makes a window fullscreen:
		globalShortcut.register('CommandOrControl+Alt+Shift+F', () => {
			this.windowsHelper.getLastFocusedWindow()?.toggleFullScreen()
		})
		// CTRL+Alt+SHIFT+I toggles the dev tools:
		globalShortcut.register('CommandOrControl+Alt+Shift+I', () => {
			this.windowsHelper.getLastFocusedWindow()?.toggleDevTools()
		})

		// CTRL+Alt+SHIFT+C opens the config file:
		globalShortcut.register('CommandOrControl+Alt+Shift+C', () => {
			this.configHelper.openFileInDefaultEditor()
		})
		// CTRL+Alt+SHIFT+N creates a new window:
		globalShortcut.register('CommandOrControl+Alt+Shift+N', () => {
			this.configHelper.addWindow()
		})
		// CTRL+Alt+SHIFT+W closes and removes the window:
		globalShortcut.register('CommandOrControl+Alt+Shift+W', () => {
			const window = this.windowsHelper.getLastFocusedWindow()

			if (window) {
				dialog
					.showMessageBox({
						message: 'Are you sure? This will remove the window from the Chef config file.',
						buttons: ['Yes, remove it', 'cancel'],
						type: 'question',
						title: 'Remove window',
					})
					.then((result) => {
						if (result.response === 0) {
							this.configHelper.removeWindow(window.id)
						}
					})
					.catch((e) => this.logger.error(e))
			}
		})
	}
}
