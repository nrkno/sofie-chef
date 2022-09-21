import { app } from 'electron'
import { ChefManager } from './ChefManager'
import { setupLogger } from './lib/logging'

const { logger } = setupLogger()

// The ChefManager is the one that handles all actual functionality
const chefManager = new ChefManager(logger, app)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	chefManager.onAppReady()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		chefManager.onActivate()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
