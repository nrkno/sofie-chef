import * as Winston from 'winston'
import { stringifyError } from './lib'

export type Logger = Winston.Logger

export function setupLogger(): { logger: Logger } {
	// custom json stringifier
	const { splat, combine, printf } = Winston.format
	const myFormat = printf((obj) => {
		obj.localTimestamp = Date.now()
		// obj.randomId = Math.round(Math.random() * 10000)
		return JSON.stringify(obj) // make single line
	})

	// Log json to console
	const transportConsole = new Winston.transports.Console({
		level: 'silly',
		handleExceptions: true,
		handleRejections: true,
		format: combine(splat(), myFormat),
	})

	const logger = Winston.createLogger({
		transports: [transportConsole],
	})
	logger.info('Logging to Console')

	const orgLoggerError = logger.error
	// @ts-expect-error hack
	logger.error = (...args) => {
		if (args.length === 1 && args[0] instanceof Error) {
			return orgLoggerError(stringifyError(args[0]))
		} else return orgLoggerError(...args)
	}

	// Hijack console.log:
	// console.log = function (...args: any[]) {
	// 	// orgConsoleLog('a')
	// 	if (args.length >= 1) {
	// 		// @ts-expect-error one or more arguments
	// 		logger.debug(...args)
	// 	}
	// }

	return { logger }
}
