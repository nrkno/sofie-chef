/**
 * Super simple queue, that allows you to bind a method to a queue and it will run them in order.
 */
export class Queue {
	private queue: {
		isRunning: boolean
		fcn: () => Promise<void>
		resolve: () => void
		reject: (err: Error) => void
	}[] = []

	public bindMethod<T extends (...args: any) => Promise<void>>(
		fcn: T,
		clearWaiting?: {
			reason: string
		}
	): T {
		return (async (...args: any[]) => {
			await new Promise<void>((resolve, reject) => {
				if (clearWaiting) {
					this.clearWaiting(clearWaiting.reason)
				}

				this.queue.push({
					isRunning: false,
					fcn: async () => {
						return fcn(...args)
					},
					resolve,
					reject,
				})

				this.checkQueue()
			})
		}) as T
	}

	/**
	 * Clear the queue from any not-yet-running functions and rejected them with the given reason.
	 * Any functions that are already running will not be affected.
	 */
	public clearWaiting(reason: string): void {
		for (const q of this.queue) {
			if (q.isRunning) continue

			q.reject(new Error(`Aborted, due to reason: "${reason}"`))
		}
		// Clear the queue, but leave any isRunning functions in place:
		this.queue = this.queue.filter((q) => q.isRunning)
	}

	private checkQueue() {
		const nextInQueue = this.queue[0]
		if (!nextInQueue) return
		if (nextInQueue.isRunning) return

		nextInQueue.isRunning = true

		nextInQueue
			.fcn()
			.then(() => {
				nextInQueue.resolve()
			})
			.catch((err) => {
				nextInQueue.reject(err)
			})
			.finally(() => {
				this.queue.shift()
				this.checkQueue()
			})
	}
}
