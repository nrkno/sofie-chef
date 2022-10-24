// preload with contextIsolation enabled
import { contextBridge, ipcRenderer } from 'electron'

// Note: these need to be manually synced to lib/api.ts because we don't have webpack
export enum IpcMethods {
	ReportStatus = 'ReportStatus',
}
export enum StatusCode {
	GOOD = 'good',
	WARNING = 'warning',
	ERROR = 'error',
}

contextBridge.exposeInMainWorld('reportChefStatus', (status: 'good' | 'warning' | 'error', message?: string) => {
	ipcRenderer.send(IpcMethods.ReportStatus, { status, message })
})
