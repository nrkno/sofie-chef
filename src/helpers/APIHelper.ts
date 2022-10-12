import * as Koa from 'koa'
import * as Router from 'koa-router'
import { AllWindowsManager } from './AllWindowsManager'
import { Logger } from '../lib/logging'
import { WebSocketServer, WebSocket, RawData } from 'ws'
import {
	APIResponse,
	ReceiveWSMessageAny,
	ReceiveWSMessageType,
	SendWSMessageAny,
	SendWSMessageType,
	StatusCode,
	SendWSMessageStatus,
} from '../lib/api'
import { rateLimitAndDoLater } from '../lib/lib'

// How long to wait for status changes to settle before broadcasting
const STATUS_SETTLE_TIME = 3000

export class APIHelper {
	private httpServer: Koa | undefined
	private wsServer: WebSocketServer | undefined

	private connectedClients: WebSocket[] = []

	private status: SendWSMessageStatus['status'] = {
		app: {
			statusCode: StatusCode.GOOD,
			message: '',
		},
		windows: {},
	}

	constructor(private logger: Logger, private windowsHelper: AllWindowsManager) {
		// Nothing
	}
	public init(httpPort: number): void {
		this.setupHTTPServer(httpPort)
		this.setupWSServer(httpPort + 1)
	}
	public setStatus(status: SendWSMessageStatus['status']): void {
		this.status = status

		this.broadcastStatusToClients()
	}

	private setupHTTPServer(httpPort: number): void {
		if (this.httpServer) return

		this.httpServer = new Koa()
		const router = new Router()

		this.httpServer.on('error', (err) => {
			const errString = `${err}`

			// We get a lot of these errors, ignore them:
			if (errString.match(/ECONNRESET|ECONNABORTED|ECANCELED/)) {
				// ignore these
			} else {
				this.logger.error(`PackageProxyServer Error: ${errString}`)
			}
		})

		router.get('/api/status', async (ctx) => {
			ctx.response.status = 200
			ctx.body = JSON.stringify(this.status, undefined, 2)
		})
		router.post('/api/playURL/:windowIndex/:url', async (ctx) => {
			const r = await this.apiPlayURL(ctx.params.windowIndex, ctx.params.url)
			ctx.response.status = r.code
			ctx.body = r.body
		})
		router.post('/api/restart/:windowIndex', async (ctx) => {
			const r = await this.apiRestart(ctx.params.windowIndex)
			ctx.response.status = r.code
			ctx.body = r.body
		})
		router.post('/api/stop/:windowIndex', async (ctx) => {
			const r = await this.apiStop(ctx.params.windowIndex)
			ctx.response.status = r.code
			ctx.body = r.body
		})
		router.post('/api/execute/:windowIndex/:jsCode', async (ctx) => {
			const r = await this.apiExecute(ctx.params.windowIndex, ctx.params.jsCode)
			ctx.response.status = r.code
			ctx.body = r.body
		})
		const routes = router.stack.map((i) => ({ path: i.path, methods: i.methods }))

		router.get('/api', async (ctx) => {
			ctx.response.status = 200
			ctx.body = routes.map((r) => `<a href="${r.path}">${r.methods.join(', ')} ${r.path}</a>`).join('<br>')
		})

		this.httpServer.use(router.routes()).use(router.allowedMethods())

		this.httpServer.use((ctx) => {
			ctx.body = 'Page not found'
			ctx.response.status = 404
		})

		this.httpServer.listen(httpPort, () => {
			this.logger.info(`HTTP server listening on port ${httpPort}`)
		})
	}
	private setupWSServer(wsPort: number): void {
		if (this.wsServer) return

		this.wsServer = new WebSocketServer({
			port: wsPort,
		})

		this.wsServer.on('connection', (ws) => {
			// A client has connected!
			this.connectedClients.push(ws)

			const onMessage = (raw: RawData) => {
				let message: ReceiveWSMessageAny | undefined = undefined
				try {
					message = JSON.parse(raw.toString())
				} catch (err) {
					this.logger.warn('Error parsing Websocket data: ' + err)
				}
				if (message) {
					const msgId = message.msgId
					this.handleWebSocketMessage(message)
						.then((response) => {
							if (response.code === 200) {
								this.sendMessage(ws, {
									type: SendWSMessageType.REPLY,
									replyTo: msgId,
									error: undefined,
									result: undefined,
								})
							} else {
								this.sendMessage(ws, {
									type: SendWSMessageType.REPLY,
									replyTo: msgId,
									error: `[${response.code}] ${response.body}`,
									result: undefined,
								})
							}
						})
						.catch((err) => {
							this.logger.warn(err)

							this.sendMessage(ws, {
								type: SendWSMessageType.REPLY,
								replyTo: msgId,
								error: `${err}`,
								result: undefined,
							})
						})
				}
			}

			ws.once('close', () => {
				const index = this.connectedClients.indexOf(ws)
				if (index !== -1) this.connectedClients.splice(index, 1)

				// Remove listeners:
				ws.off('message', onMessage)
			})
			// Add listeners:
			ws.on('message', onMessage)

			// Send initial status:
			this.sendMessage(ws, {
				type: SendWSMessageType.STATUS,
				status: this.status,
			})
		})
		this.logger.info(`Websocket server listening on port ${wsPort}`)
	}

	private async apiPlayURL(windowIndex0: unknown | number, url: unknown | string): Promise<APIResponse> {
		const windowIndex = typeof windowIndex0 === 'number' ? windowIndex0 : parseInt(windowIndex0 + '')
		if (Number.isNaN(windowIndex)) return { code: 400, body: 'windowIndex must be a number' }
		else if (typeof url !== 'string') return { code: 400, body: 'url must be a string' }
		else {
			const window = this.windowsHelper.getWindow(windowIndex)
			if (!window) return { code: 404, body: `windowIndex ${windowIndex} not found` }

			await window.playURL(url)
			return { code: 200, body: 'ok' }
		}
	}
	private async apiRestart(windowIndex0: unknown | number): Promise<APIResponse> {
		const windowIndex = typeof windowIndex0 === 'number' ? windowIndex0 : parseInt(windowIndex0 + '')
		if (Number.isNaN(windowIndex)) return { code: 400, body: 'windowIndex must be a number' }
		else {
			const window = this.windowsHelper.getWindow(windowIndex)
			if (!window) return { code: 404, body: `windowIndex ${windowIndex} not found` }

			await window.restart()
			return { code: 200, body: 'ok' }
		}
	}
	private async apiStop(windowIndex0: unknown | number): Promise<APIResponse> {
		const windowIndex = typeof windowIndex0 === 'number' ? windowIndex0 : parseInt(windowIndex0 + '')
		if (Number.isNaN(windowIndex)) return { code: 400, body: 'windowIndex must be a number' }
		else {
			const window = this.windowsHelper.getWindow(windowIndex)
			if (!window) return { code: 404, body: `windowIndex ${windowIndex} not found` }

			await window.stop()
			return { code: 200, body: 'ok' }
		}
	}
	private async apiExecute(windowIndex0: unknown | number, jsCode: unknown | string): Promise<APIResponse> {
		const windowIndex = typeof windowIndex0 === 'number' ? windowIndex0 : parseInt(windowIndex0 + '')
		if (Number.isNaN(windowIndex)) return { code: 400, body: 'windowIndex must be a number' }
		else if (typeof jsCode !== 'string') return { code: 400, body: 'jsCode must be a string' }
		else {
			const window = this.windowsHelper.getWindow(windowIndex)
			if (!window) return { code: 404, body: `windowIndex ${windowIndex} not found` }

			await window.executeJavascript(jsCode)
			return { code: 200, body: 'ok' }
		}
	}

	private async handleWebSocketMessage(message: ReceiveWSMessageAny): Promise<APIResponse> {
		if (message.type === ReceiveWSMessageType.PLAYURL) {
			return this.apiPlayURL(message.windowIndex, message.url)
		} else if (message.type === ReceiveWSMessageType.RESTART) {
			return this.apiRestart(message.windowIndex)
		} else if (message.type === ReceiveWSMessageType.STOP) {
			return this.apiStop(message.windowIndex)
		} else if (message.type === ReceiveWSMessageType.EXECUTE) {
			return this.apiExecute(message.windowIndex, message.jsCode)
		} else {
			// @ts-expect-error never
			throw new Error(`WS Error: Unknown command received: "${message.type}"`)
		}
	}
	private sendMessage(ws: WebSocket, msg: SendWSMessageAny) {
		ws.send(JSON.stringify(msg))
	}
	private broadcastStatusToClients = rateLimitAndDoLater(
		() => {
			// Broadcast status to all clients
			for (const ws of this.connectedClients) {
				this.sendMessage(ws, {
					type: SendWSMessageType.STATUS,
					status: this.status,
				})
			}
		},
		STATUS_SETTLE_TIME,
		(err) => {
			this.logger.error(err)
		}
	)
}
