import { globalShortcut } from 'electron'
import { EventEmitter } from 'events'
import { Config } from '../lib/config'
import { rateLimitAndDoLater } from '../lib/lib'
import { Logger } from '../lib/logging'

import { WindowHelper } from './WindowHelper'

/** The AllWindowsManager is responsible for spawning the various windows */
export class AllWindowsManager extends EventEmitter {
	private windowsHandlers: { [id: string]: WindowHelper } = {}

	constructor(private logger: Logger) {
		super()
	}

	public initialize(): void {
		// Alt+CTRL+F makes a window fullscreen:
		globalShortcut.register('Alt+CommandOrControl+F', () => {
			this.findFocusWindow()?.toggleFullScreen()
		})
	}

	/**
	 * Trigger an update to the windows
	 * @param config
	 * @returns
	 */
	public triggerUpdateWindows = rateLimitAndDoLater(this._updateWindows.bind(this), 200, this.logger.error)
	/** Update all windows from config */
	private async _updateWindows(config: Config) {
		const removeWindowIds = new Set<string>()
		for (const id of Object.keys(this.windowsHandlers)) {
			removeWindowIds.add(id)
		}

		for (let i = 0; i < config.windows.length; i++) {
			const id = `window_${i}`

			removeWindowIds.delete(id)

			const configWindow = config.windows[i]
			const window = this.windowsHandlers[id]

			if (!window) {
				// Create a new window
				this.logger.info(`Create new window "${id}", ${JSON.stringify(configWindow)}`)
				const winHandler = new WindowHelper(this.logger, configWindow, `Chef window ${id}`)
				this.windowsHandlers[id] = winHandler

				winHandler.on('config-has-been-modified', () => {
					this.emit('config-has-been-modified')
				})
				winHandler.on('closed', () => {
					this.emit('closed-window', id)
				})
				await this.windowsHandlers[id].init()
			} else {
				// Update existing window
				// this.logger.info(`Update window "${id}", ${JSON.stringify(configWindow)}`)
				window.updateConfig(configWindow)
			}
		}

		for (const id of removeWindowIds.values()) {
			// Close the window
			this.logger.info(`Close window "${id}"`)
			await this.windowsHandlers[id].close()
			delete this.windowsHandlers[id]
		}
	}
	/** Look up and return a window which currently has focus */
	private findFocusWindow(): WindowHelper | undefined {
		for (const winHandler of Object.values(this.windowsHandlers)) {
			if (winHandler.hasFocus()) return winHandler
		}
		return undefined
	}
}
