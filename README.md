# Sofie Chef

This is a small Electron application which is used to display a number of web pages in fullscreen.

# Usage

When the application first starts, a `config.json`-file is created in the same folder as the executable.

When the `config.json`-file is edited, the application applies the changes instantly.

Most properties of the `config.json`-file are also automatically updated when moving or resizing the windows.

## Keyboard shortcuts

- `CTRL+Alt+SHIFT+F` Toggles fullscreen for the current (or last) selected window
- `CTRL+Alt+SHIFT+I` Toggles DevTools (console) for the current (or last) selected window
- `CTRL+Alt+SHIFT+C` Opens the config file in the system default editor
- `CTRL+Alt+SHIFT+N` Creates a new window
- `CTRL+Alt+SHIFT+W` Closes and removes the window

## Configuration

See [config.ts](src/lib/config.ts)

## Tips for running in fullscreen

Here are some tips for when you want to display something in fullscreen and want to avoid
ANY overlays on top of the content (like popups).

### In general

- In the config file, set:
  ```json
  {
  	"fullScreen": true, // Display in fullscreen
  	"onTop": true // Display on top of other windows (and popups when in fullscreen mode)
  }
  ```

### When using Windows

- Put the fullscreen window on a non-main display.
  If the content is on the primary display, an accidental click on the Windows-key will open the start-menu which will display on top of the output.

# API

## Websocket API

See types here for messages over websocket: [src/lib/api.ts](src/lib/api.ts)

## Rest API

The API is exposed by default on http://localhost:5270

_Note: If `apiKey` is set in config.json, all requests must include `?apiKey=API_KEY`_

| URL                          | Parameters                                                                                                                             | Description                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| GET `/api/status`            |                                                                                                                                        | Current status                   |
| PUT `/api/playURL/:windowId` | <code>Body parameters:<br>/** The URL to load \*/<br>url: string<br>/** Execute javascript in web player \*/<br>jsCode?: string</code> | Display web page                 |
| PUT `/api/restart/:windowId` |                                                                                                                                        | Reload the web player            |
| PUT `/api/stop/:windowId`    |                                                                                                                                        | Stop and clear the web player    |
| PUT `/api/execute/:windowId` | <code>Body parameters:<br>/\*_ Javascript to execute in web player _/<br>jsCode: string</code>                                         | Execute javascript in web player |
| GET `/api/list`              |                                                                                                                                        | List windows                     |
| GET `/api`                   |                                                                                                                                        | List API calls                   |

# For Developers

## Getting started

```bash

yarn dev # or npm run dev

```

## Build binary

```bash

yarn build:binary

```

## For web pages rendered in Sofie Chef

If needed, the web page rendered inside Sofie Chef can be made aware that they are running inside by looking at the userAgent.

```javascript
if (window.navigator.userAgent.match('sofie-chef')) console.log("I'm running inside Sofie Chef!")
```

The web page can also report various statuses to the renderer:

```javascript
if (window.reportChefStatus) {
	window.reportChefStatus('good')
	window.reportChefStatus('good', 'Nothing to see here')
	window.reportChefStatus('warning', "Unable to load the correct font, but I'll manage...")
	window.reportChefStatus('error', 'Unable to load the video XYZ')
}
```

## API

When enabled via the `apiPort`-property in the `config.json` file, Sofie Chef exposes a HTTP REST and a Websockets API.

The HTTP REST API is exposed on the port `apiPort`. A list of methods can be found at [localhost:apiPort/api](http://localhost:5270/api).

The Websockets API is exposed on the port `apiPort+1`. A description of the data-interchange can be found here: [api.ts](/blob/main/src/lib/api.ts)

# For Maintainers

## Make a new release

1. `yarn release`
2. Push the branch (and tag!) to GitHub
3. Wait for the [Github Action](https://github.com/nrkno/sofie-chef/actions/workflows/create-release.yaml) to finish building the binaries.
4. Go to [Releases](https://github.com/nrkno/sofie-chef/releases) and publish the release draft.
