import { BrowserWindow, screen } from 'electron'
import { EventEmitter } from 'events'
import { ConfigWindow } from '../lib/config'
import _ = require('underscore')
import { Logger } from '../lib/logging'

export class WindowHelper extends EventEmitter {
	private window: BrowserWindow
	private title: string
	constructor(private logger: Logger, private _config: ConfigWindow, title: string) {
		super()

		this.title = title
		this.window = new BrowserWindow({
			height: this.config.height,
			width: this.config.width,
			x: this.config.width,
			y: this.config.width,

			frame: !this.config.frameless,
			webPreferences: {
				// preload: this.getPreloadScript(),
			},
			title: this.title,
		})

		this.window.removeMenu()

		this.window.on('resized', () => {
			this.updateSizeAndPosition()
		})
		this.window.on('moved', () => {
			this.updateSizeAndPosition()
		})
		this.window.on('maximize', () => {
			this.updateSizeAndPosition()
		})
		this.window.on('unmaximize', () => {
			this.updateSizeAndPosition()
		})
		this.window.on('close', () => {
			this.emit('closed')
		})

		this.updateWindow()
	}
	public get config(): ConfigWindow {
		return this._config
	}
	public async init(): Promise<void> {
		if (this._config.defaultURL) {
			this.window.webContents.once('did-finish-load', () => {
				this.window.setTitle(this.title)
				// this.window.webContents.openDevTools()
				this.window.webContents.executeJavaScript(this.getPreloadScript()).catch(this.logger.error)
			})

			// await mainWindow.loadFile(path.join(__dirname, '../static/index.html'))
			// await mainWindow.loadURL(`file://${app.getAppPath()}/dist/index.html`)
			await this.window.loadURL(this._config.defaultURL, {})
		}
	}
	public async close(): Promise<void> {
		this.window.close()
	}
	public updateConfig(config: ConfigWindow): void {
		const oldConfig = this._config
		this._config = config

		if (!_.isEqual(oldConfig, config)) {
			this.updateWindow()
		}
	}
	public updateWindow(): void {
		if (
			this.config.x !== undefined &&
			this.config.y !== undefined &&
			this.config.height !== undefined &&
			this.config.width !== undefined
		) {
			// Hack to make it work on Windows with multi-dpi screens
			// Ref: https://github.com/electron/electron/pull/10972
			const bestDisplay = screen.getDisplayMatching({
				height: this.config.height,
				width: this.config.width,
				x: this.config.x,
				y: this.config.y,
			})

			const windowBounds = {
				x: Math.max(this.config.x, bestDisplay.workArea.x),
				y: Math.max(this.config.y, bestDisplay.workArea.y),
				width: Math.min(this.config.width, bestDisplay.workArea.width),
				height: Math.min(this.config.height, bestDisplay.workArea.height),
			}

			this.window.setBounds(windowBounds)
		} else {
			this.window.setBounds({
				width: this.config.width,
				height: this.config.height,
			})
		}

		this.window.setFullScreen(this.config.fullScreen)

		if (this.config.fullScreen && this.config.onTop) {
			this.window.setAlwaysOnTop(true, 'screen-saver')
		} else {
			this.window.setAlwaysOnTop(false)
		}

		this.window.moveTop()
	}
	public hasFocus(): boolean {
		return this.window.isFocused()
	}
	public toggleFullScreen(): void {
		this.window.setFullScreen(!this.window.isFullScreen())
		this.updateSizeAndPosition()
	}
	private updateSizeAndPosition() {
		this.config.fullScreen = this.window.isFullScreen()

		// No need to update position and size if it's fullscreen anyway.
		// That way, we're able to "restore" the window when making it not fullscreen:
		if (!this.config.fullScreen) {
			const newBounds = this.window.getBounds()
			this.config.x = newBounds.x
			this.config.y = newBounds.y
			this.config.width = newBounds.width
			this.config.height = newBounds.height
		}

		this.emit('config-has-been-modified')
	}
	private getPreloadScript(): string {
		return `
document.body.style.cursor = 'none';
window.addEventListener('DOMContentLoaded', () => {
	document.body.style.cursor = 'none'
})
`
	}
}
