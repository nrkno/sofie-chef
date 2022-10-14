import { globalShortcut } from 'electron'
import { EventEmitter } from 'events'
import { StatusCode, StatusObject } from '../lib/api'
import { Config } from '../lib/config'
import { rateLimitAndDoLater } from '../lib/lib'
import { Logger } from '../lib/logging'

import { WindowHelper } from './WindowHelper'

/** The AllWindowsManager is responsible for spawning the various windows */
export class AllWindowsManager extends EventEmitter {
	private windowsHandlers: { [id: string]: WindowHelper } = {}
	private lastFocusedWindow: WindowHelper | undefined | undefined

	constructor(private logger: Logger) {
		super()
	}

	public initialize(): void {
		// CTRL+Alt+SHIFT+F makes a window fullscreen:
		globalShortcut.register('CommandOrControl+Alt+Shift+F', () => {
			this.lastFocusedWindow?.toggleFullScreen()
		})
	}

	public getWindow(windowIndex: number): WindowHelper | undefined {
		const id = this.windowId(windowIndex)
		return this.windowsHandlers[id]
	}
	public getStatus(): { [index: string]: StatusObject } {
		const status: { [index: string]: StatusObject } = {}

		for (const [id, window] of Object.entries(this.windowsHandlers)) {
			status[id] = window.status
		}
		return status
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
			const id = this.windowId(i)

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
				winHandler.on('status', (status: StatusObject) => {
					this.logger.info(`Status for ${id}: ${StatusCode[status.statusCode]} ${status.message}`)
					this.emit('status', this.getStatus())
				})
				winHandler.on('focus', () => {
					this.lastFocusedWindow = winHandler
				})
				winHandler.on('closed', () => {
					this.emit('closed-window', id)
				})
				this.lastFocusedWindow = winHandler
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
	private windowId(index: number): string {
		return `window_${index}`
	}
}
