export interface Config {
	/** If true, won't update the config file automatically. */
	freeze: boolean
	/** A list of the windows to be created */
	windows: ConfigWindow[]
}
export interface ConfigWindow {
	/** X-position of the window */
	x: number | undefined
	/** Y-position of the window */
	y: number | undefined
	/** Width of the window */
	width: number
	/** Height of the window */
	height: number

	/** Set to true to make the window fullscreen */
	fullScreen: boolean
	/** Set to true make the window always-on-top */
	onTop?: boolean

	/**
	 * Set to true to make the window "frameless" (borderless).
	 * This could be useful in a situation where you don't want a fullscreen window
	 */
	frameless?: boolean

	/** The default URL to load on startup */
	defaultURL: string
}
export const DEFAULT_CONFIG: Config = {
	freeze: false,
	windows: [
		{
			x: undefined,
			y: undefined,
			width: 1280,
			height: 720,
			fullScreen: false,
			onTop: false,
			frameless: false,
			defaultURL: 'https://bouncingdvdlogo.com/',
		},
	],
}
