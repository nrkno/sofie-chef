import * as fs from 'fs'

export async function fsExists(path: string): Promise<boolean> {
	try {
		await fs.promises.access(path, fs.constants.F_OK)
		return true
	} catch {
		return false
	}
}

/** Make a string out of an error (or other equivalents), including any additional data such as stack trace if available */
export function stringifyError(error: unknown, noStack = false): string {
	let str: string | undefined = undefined

	if (error && typeof error === 'object') {
		if ((error as Error).message) {
			// Is an Error
			str = `${(error as Error).message}`
		} else if ((error as any).reason) {
			// Is a Meteor.Error
			str = `${(error as any).reason}`
		} else if ((error as any).details) {
			str = `${(error as any).details}`
		} else {
			try {
				// Try to stringify the object:
				str = JSON.stringify(error)
			} catch (e) {
				str = `${error} (stringifyError: ${e})`
			}
		}
	} else {
		str = `${error}`
	}

	if (!noStack) {
		if (error && typeof error === 'object' && (error as any).stack) {
			str += ', ' + (error as any).stack
		}
	}

	return str
}

/**
 * Wraps a function to rate-limit it.
 * The returned function will delay the execution of the original function.
 * Subsequent calls will be ignored,
 * EXCEPT the last of those calls, which instead be delayed and executed later.
 *
 */
export function rateLimitAndDoLater<T extends (...args: ARGS) => any, ARGS extends any[]>(
	fcn: T,
	delay: number,
	onError: (error: unknown) => void
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null
	let isRunning = false
	let runAgainLaterWithArgs: ARGS | null = null

	if (!fcn) throw new Error(`Error when setting up rateLimitAndDoLater: fcn is falsy`)

	const afterExecution = () => {
		isRunning = false

		if (runAgainLaterWithArgs) {
			const args = runAgainLaterWithArgs
			runAgainLaterWithArgs = null
			wrappedFunction(...args)
		}
	}

	const wrappedFunction = (...args: ARGS): void => {
		if (isRunning) {
			runAgainLaterWithArgs = args
			return
		}

		if (!timeout) {
			timeout = setTimeout(() => {
				timeout = null

				isRunning = true
				try {
					Promise.resolve(fcn(...args))
						.catch((err) => {
							onError(err)
						})
						.finally(() => {
							afterExecution()
						})
				} catch (err) {
					onError(err)
					afterExecution()
				}
			}, delay)
		}
	}

	return wrappedFunction
}
