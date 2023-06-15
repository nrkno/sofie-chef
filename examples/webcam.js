const output = document.getElementById('output')
const params = new URLSearchParams(window.location.search)

async function setup() {
	const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput')

	if (params.get('input') !== null) {
		// Display video:

		var device = undefined
		if (!device) {
			// Match index:
			const deviceIndex = parseInt(params.get('input'))
			if (!Number.isNaN(deviceIndex)) {
				console.log('deviceIndex', deviceIndex)
				device = devices[deviceIndex]
			}
		}
		if (!device) {
			// Match id/label:
			const deviceId = params.get('input')
			if (deviceId !== undefined) {
				console.log('deviceId', deviceId)
				device = devices.find((d) => d.deviceId === deviceId || d.label === deviceId)
			}
		}

		if (device) {
			const elVideo = document.createElement('video')
			elVideo.autoplay = true
			output.appendChild(elVideo)


			const constraints = {}
			constraints.video = {
				deviceId: {
					ideal: device.deviceId,
				},
				height: {
					// min: 1080,
					exact: 1080,
				},
				// @ts-ignore
				// resizeMode: 'crop-and-scale'
			}
			if (params.get('fps') !== null) {
				constraints.video.frameRate = {
					exact: parseInt(params.get('fps')),
				}
			}
			if (params.get('height') !== null) {
				constraints.video.height = {
					height: parseInt(params.get('height')),
				}
			}

			// Open stream:
			const stream = await navigator.mediaDevices.getUserMedia(constraints)
			elVideo.srcObject = stream

		} else {
			console.error('device not found')
		}
	} else {
		// List available devices:
		output.innerHTML = '<ul>' + devices.map((d, i) => `<li><a href="?input=${i}">index: ${i}, id: "${d.label}", label: "${d.label}"</a></li>`).join('') + '</ul>'


	}


}

setup().catch(console.error)
