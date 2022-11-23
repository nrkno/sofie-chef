import { BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { EventEmitter } from 'events'
import { IpcMethods, ReportStatusIpcPayload, StatusObject } from '../lib/api'
import { Config } from '../lib/config'
import { rateLimitAndDoLater } from '../lib/lib'
import { Logger } from '../lib/logging'

import { WindowHelper } from './WindowHelper'

/** The AllWindowsManager is responsible for spawning the various windows */
export class AllWindowsManager extends EventEmitter {
	private windowsHandlers: { [id: string]: WindowHelper } = {}
	private lastFocusedWindow: WindowHelper | undefined | undefined

	private static _singletonInstance: AllWindowsManager
	private constructor(private logger: Logger) {
		super()

		ipcMain.on(IpcMethods.ReportStatus, (event, payload: ReportStatusIpcPayload) => {
			const browserWindow = BrowserWindow.fromWebContents(event.sender)
			if (!browserWindow) return

			this.getAllWindows().forEach((w) => w.receiveExternalStatus(browserWindow, payload))
		})
	}
	static GetAllWindowsManager(logger: Logger): AllWindowsManager {
		// return singleton
		this._singletonInstance = this._singletonInstance ?? new AllWindowsManager(logger)
		return this._singletonInstance
	}

	public initialize(): void {
		// CTRL+Alt+SHIFT+F makes a window fullscreen:
		globalShortcut.register('CommandOrControl+Alt+Shift+F', () => {
			this.lastFocusedWindow?.toggleFullScreen()
		})
	}

	public getWindow(id: string): WindowHelper | undefined {
		return this.windowsHandlers[id]
	}
	public getAllWindows(): WindowHelper[] {
		return Object.values(this.windowsHandlers)
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

		for (const [id, configWindow] of Object.entries(config.windows)) {
			removeWindowIds.delete(id)

			const window = this.windowsHandlers[id]

			if (!window) {
				// Create a new window
				this.logger.info(`Create new window "${id}", ${JSON.stringify(configWindow)}`)
				const winHandler = new WindowHelper(this.logger, id, configWindow, `Chef window ${id}`)
				this.windowsHandlers[id] = winHandler

				winHandler.on('window-has-been-modified', () => {
					this.emit('window-has-been-modified')
				})
				winHandler.on('status', (status: StatusObject) => {
					this.logger.info(`Status for "${id}": ${status.statusCode} ${status.message}`)
					this.emit('status', this.getStatus())
				})
				winHandler.on('focus', () => {
					this.lastFocusedWindow = winHandler
				})
				winHandler.on('closed', () => {
					this.emit('closed-window', id)
				})
				this.lastFocusedWindow = winHandler
				await winHandler.init()
			} else {
				// Update existing window
				// this.logger.info(`Update window "${id}", ${JSON.stringify(configWindow)}`)
				await window.updateConfig(configWindow)
			}
		}

		for (const id of removeWindowIds.values()) {
			// Close the window
			this.logger.info(`Close window "${id}"`)
			await this.windowsHandlers[id].close()
			delete this.windowsHandlers[id]
		}
	}
}
