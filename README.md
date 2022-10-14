# Sofie Chef

This is a small Electron application which is used to display a number of web pages in fullscreen.

# Usage

When the application first starts, a `config.json`-file is created in the same folder as the executable.

When the `config.json`-file is edited, the application applies the changes instantly.

Most properties of the `config.json`-file are also automatically updated when moving or resizing the windows.

## Keyboard shortcuts

- `CTRL+Alt+SHIFT+F` toggles fullscreen for the current (or last) selected window

## Configuration

See [config.ts](/blob/main/src/lib/config.ts)

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
