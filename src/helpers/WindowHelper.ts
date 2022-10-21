import { BrowserWindow, screen } from 'electron'
import { EventEmitter } from 'events'
import { ConfigWindow } from '../lib/config'
import _ = require('underscore')
import { Logger } from '../lib/logging'
import { StatusCode, StatusObject } from '../lib/api'

export class WindowHelper extends EventEmitter {
	private window: BrowserWindow

	private userAgent = 'sofie-chef' // (placeholder, is set properly later)

	/** empty string means a blank page, null means defaultURL */
	private url: string | null = null

	private _status: StatusObject = {
		statusCode: StatusCode.ERROR,
		message: 'N/A',
	}
	private _contentStatus?: StatusObject

	constructor(private logger: Logger, private id: string, private _config: ConfigWindow, private title: string) {
		super()

		this.window = new BrowserWindow({
			height: this.config.height,
			width: this.config.width,
			x: this.config.x,
			y: this.config.y,

			frame: !this.config.frameless,
			webPreferences: {},
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
		this.window.on('focus', () => {
			this.emit('focus')
		})
		this.window.on('close', () => {
			this.emit('closed')
		})

		this.logger.debug('Creating new window')
	}
	public get config(): ConfigWindow {
		return this._config
	}
	public async init(): Promise<void> {
		// Set the user-agent:
		this.userAgent = this.window.webContents.getUserAgent() + ' sofie-chef'

		await this.updateWindow()

		// Trigger loading default page:
		// await this.restart()
		// await mainWindow.loadFile(path.join(__dirname, '../static/index.html'))
		// await mainWindow.loadURL(`file://${app.getAppPath()}/dist/index.html`)
	}
	public async close(): Promise<void> {
		this.window.close()
	}
	public async updateConfig(config: ConfigWindow): Promise<void> {
		const oldConfig = this._config
		this._config = config

		if (!_.isEqual(oldConfig, config)) {
			await this.updateWindow(oldConfig)
		}
	}
	public async updateWindow(oldConfig?: ConfigWindow): Promise<void> {
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

		if (!this.url && this.config.defaultURL !== oldConfig?.defaultURL) {
			await this.restart()
		}
		if (this.config.displayDebug !== oldConfig?.displayDebug) {
			await this.restart()
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
	/** Play the specified URL in the window */
	async playURL(url: string | null): Promise<void> {
		if (this.url !== url) {
			this.url = url

			await this.restart()
		}
	}
	/** Restarts (reloads) the window */
	async restart(): Promise<void> {
		delete this._contentStatus

		try {
			const url = this.getURL()
			if (url) {
				await this.window.loadURL(url, {
					userAgent: this.userAgent,
				})
			} else {
				await this.window.loadURL('about:blank', {
					userAgent: this.userAgent,
				})
				// Make the background black:
				await this.window.webContents.insertCSS('html, body { background-color: #000; }')
			}
			// Hide the cursor:
			await this.window.webContents.insertCSS('html, body, * { cursor: none !important; }')

			this.window.setTitle(this.title)
			this.window.webContents.on('render-process-gone', (event, details) => {
				if (details.reason !== 'clean-exit') {
					this.status = {
						statusCode: StatusCode.ERROR,
						message: `Renderer process gone "${this.url}": ${details.reason}, ${details.exitCode}, "${event}"`,
					}
				}
			})

			await this.listenToContentStatuses()

			if (this.config.displayDebug) {
				await this.displayDebugOverlay()
			}
		} catch (err) {
			this.status = {
				statusCode: StatusCode.ERROR,
				message: `Error when loading "${this.url}": ${err}`,
			}
			throw err
		}

		this.status = {
			statusCode: StatusCode.GOOD,
			message: ``,
		}
	}
	/** Stops playing the content in window */
	async stop(): Promise<void> {
		await this.playURL(null)
	}
	/** Executes a javascript inside the web player */
	async executeJavascript(script: string): Promise<void> {
		await this.window.webContents.executeJavaScript(script)
	}

	public get status(): StatusObject {
		let status = this._status
		if (this._contentStatus && this._contentStatus.statusCode > status.statusCode) {
			status = this._contentStatus
		}
		return status
	}
	private set status(status: StatusObject) {
		if (this._status.statusCode !== status.statusCode || this._status.message !== status.message) {
			this._status = status
			this.emitStatus()
		}
	}
	private emitStatus() {
		this.emit('status', this.status)
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

		this.emit('window-has-been-modified')
	}
	private getURL(): string {
		if (this.url === null) return this._config.defaultURL
		return this.url
	}

	private async listenToContentStatuses() {
		// Okay, real talk: This is honestly kind of a hack..
		// But in my initial snooping around the ElectronJS docs I didn't find a good API
		// that I could use to send messages from any arbitrary web page and to the main
		// Electron process.
		// So yeah.. this is definitely a hack, but it should work for now..

		// Intercept certain console.log messages and interpret them as status-messages:
		this.window.webContents.on('console-message', (_event, _level, message, _line, _sourceID) => {
			const m = `${message}`.match(/^reportChefStatus: (.*)$/)
			if (m) {
				try {
					const innerStatus = JSON.parse(m[1]) as {
						status: 'good' | 'warning' | 'error'
						message: string
					}

					this._contentStatus = {
						statusCode:
							innerStatus.status === 'good'
								? StatusCode.GOOD
								: innerStatus.status === 'warning'
								? StatusCode.WARNING
								: StatusCode.ERROR,
						message: innerStatus.message,
					}
					this.emitStatus()
				} catch (_error) {
					// ignore
				}
			}
		})
		// Inject convenience function into the web page.
		// It can be accessed from the child web page like so:
		// window.reportChefStatus('error', 'This is baaad')
		await this.window.webContents.executeJavaScript(`
/**
* @param status "good" | "warning" | "error"
* @param message string
*/
function reportChefStatus(status, message) {
  console.log('reportChefStatus: ' + JSON.stringify({status, message: message || ''}))
}
`)
	}
	private async displayDebugOverlay() {
		await this.window.webContents.executeJavaScript(`
function setupMonitor() {
	var overlay = document.createElement('div');
	overlay.style.cssText = 'display: block;position:fixed;top:0;right: 0;z-index:99999;color: #0f0;font-family: monospace;';
	document.body.appendChild(overlay);

	var lastFrameTime = performance.now();
	var avgFps = 0;

	function updateFrame () {
		var now = performance.now();
		var frameDuration = now - lastFrameTime;
		lastFrameTime = now;

		var fps = 1000 / frameDuration;

		if (!avgFps) avgFps = fps;

		avgFps += (fps - avgFps) * 0.02 // Gliding average;

		overlay.innerHTML = (
			'<b>${this.id}</b>'+
			'<br>${this.getURL() || 'blank'}'+
			'<br>FPS: ' + Math.round(fps) +
			'<br>AVG FPS: ' + Math.round(avgFps)
		);
		requestAnimationFrame(updateFrame);
	}
	requestAnimationFrame(() => {
		lastFrameTime = performance.now();
		requestAnimationFrame(updateFrame);
	})
}
setupMonitor();`)
	}
}
