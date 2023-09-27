# Changelog

All notable changes to this project will be documented in this file. See [Convential Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) for commit guidelines.

## [0.3.0](https://github.com/nrkno/sofie-chef/compare/v0.2.0...v0.3.0) (Wed Sep 27 2023)


### Features

* update electron and electron-builder [078c91b](https://github.com/nrkno/sofie-chef/commit/078c91b88bca64c4794642d011e60c1c1e7d0eaf)

## [0.2.0](https://github.com/nrkno/sofie-chef/compare/v0.0.5...v0.2.0) (Thu Sep 07 2023)


### Features

* Add option for zoomFactor [0787b01](https://github.com/nrkno/sofie-chef/commit/0787b019938619d5dc237a353998494df401f4ca)
* add option to hide scrollbar. Also changes how injected CSS is done, to better guard against the web content clearing our CSS [9f7ce5e](https://github.com/nrkno/sofie-chef/commit/9f7ce5ecffd3ec5d5059a253e6d39ae49acc4c37)
* add `baseURL` config field SOFIE-2545 (#5) [7f19c18](https://github.com/nrkno/sofie-chef/commit/7f19c18f3a81b98936466e4327c2a19bbe3949db)
* add global shortcut for toggling devTools [1934318](https://github.com/nrkno/sofie-chef/commit/1934318a9b30c9ba159ef0c2e4ecdc8eb6580a0a)

### Fixes

* stricter types in api [4f066da](https://github.com/nrkno/sofie-chef/commit/4f066dabf92d7c6b68d132047f8c7fd836f0ad60)
* add LIST ws command [3723297](https://github.com/nrkno/sofie-chef/commit/3723297695bc513eecc3be68649dcd8ceebbae30)
* don't throw on bad unknown ws-command [c875a93](https://github.com/nrkno/sofie-chef/commit/c875a93baef775e6232f51bdbd95622045b28f27)
* make debug info readable on a light background [4b6add8](https://github.com/nrkno/sofie-chef/commit/4b6add83da172032c71459b802a92763bc4afc82)
* add config.defaultColor, and apply while loading pages, to avoid white flashes [1881bb1](https://github.com/nrkno/sofie-chef/commit/1881bb102c4f1d7d921f7d0789c9d23d94d01c36)
* add api endpoint for list all windows [157b6fa](https://github.com/nrkno/sofie-chef/commit/157b6fa094ed8234882fc4b6ba10eef95fed83fa)
* allow windows to be onTop even when not in fullscreen [3714166](https://github.com/nrkno/sofie-chef/commit/37141661b8dbd489bb15fc5a7593a3deed4e52b9)
* add global schortcut to open config file on default OS editor [6ddc25b](https://github.com/nrkno/sofie-chef/commit/6ddc25b6cef272b275e8cca75723cee6204368b1)

## [0.1.1](https://github.com/nrkno/sofie-chef/compare/v0.1.0...v0.1.1) (Fri Aug 25 2023)


### Fixes

* stricter types in api [4f066da](https://github.com/nrkno/sofie-chef/commit/4f066dabf92d7c6b68d132047f8c7fd836f0ad60)
* add LIST ws command [3723297](https://github.com/nrkno/sofie-chef/commit/3723297695bc513eecc3be68649dcd8ceebbae30)
* don't throw on bad unknown ws-command [c875a93](https://github.com/nrkno/sofie-chef/commit/c875a93baef775e6232f51bdbd95622045b28f27)

## [0.1.0](https://github.com/nrkno/sofie-chef/compare/v0.0.6...v0.1.0) (Fri Aug 18 2023)


### Features

* add `baseURL` config field SOFIE-2545 (#5) [7f19c18](https://github.com/nrkno/sofie-chef/commit/7f19c18f3a81b98936466e4327c2a19bbe3949db)

### Fixes

* make debug info readable on a light background [4b6add8](https://github.com/nrkno/sofie-chef/commit/4b6add83da172032c71459b802a92763bc4afc82)
* add config.defaultColor, and apply while loading pages, to avoid white flashes [1881bb1](https://github.com/nrkno/sofie-chef/commit/1881bb102c4f1d7d921f7d0789c9d23d94d01c36)
* add api endpoint for list all windows [157b6fa](https://github.com/nrkno/sofie-chef/commit/157b6fa094ed8234882fc4b6ba10eef95fed83fa)

### [0.0.6](https://github.com/nrkno/sofie-chef/compare/v0.0.5...v0.0.6) (2023-03-28)


### Features

* add global shortcut for toggling devTools ([1934318](https://github.com/nrkno/sofie-chef/commit/1934318a9b30c9ba159ef0c2e4ecdc8eb6580a0a))


### Bug Fixes

* add global schortcut to open config file on default OS editor ([6ddc25b](https://github.com/nrkno/sofie-chef/commit/6ddc25b6cef272b275e8cca75723cee6204368b1))
* allow windows to be onTop even when not in fullscreen ([3714166](https://github.com/nrkno/sofie-chef/commit/37141661b8dbd489bb15fc5a7593a3deed4e52b9))

### [0.0.5](https://github.com/nrkno/sofie-chef/compare/v0.0.4...v0.0.5) (2022-11-23)


### Bug Fixes

* use folder "sofie-chef" for storing config file ([27235c7](https://github.com/nrkno/sofie-chef/commit/27235c7166880a86d41f33827a11e5a4784d76e2))

### [0.0.4](https://github.com/nrkno/sofie-chef/compare/v0.0.3...v0.0.4) (2022-11-23)


### Bug Fixes

* report window status over IPC ([8a840da](https://github.com/nrkno/sofie-chef/commit/8a840da092b2495926740ab1b0750d2ac843be04))
* use userData / appData folder for config file ([f0ec3d7](https://github.com/nrkno/sofie-chef/commit/f0ec3d7ee710140fc38909345d1d1912566c2b07))

### [0.0.3](https://github.com/nrkno/sofie-chef/compare/v0.0.2...v0.0.3) (2022-10-21)

### 0.0.2 (2022-10-21)


### Features

* add displayDebug config option, to display an overlay with an FPS counter ([fcac6c2](https://github.com/nrkno/sofie-chef/commit/fcac6c2d94a159292d74399a2efb337df95896a5))
* add HTTP REST api and Websockets api for controlling the application and emitting statuses ([d0c86d6](https://github.com/nrkno/sofie-chef/commit/d0c86d60ed831f97505b3518220fff7394700381))
* initial working version of Shef ([8c5fd3e](https://github.com/nrkno/sofie-chef/commit/8c5fd3eb2e99e7d15ed9400c16b13dd3d2e7642d))


### Bug Fixes

* add logContent config option ([be3fb2d](https://github.com/nrkno/sofie-chef/commit/be3fb2d2f9e90119d79931f79530548367ed1184))
* add special token "$all" to restart all windows ([99f9726](https://github.com/nrkno/sofie-chef/commit/99f97268a3488c1fec82fe92a7bc9a79df59175f))
* change how fullscreen shortcut works. ([4daac8e](https://github.com/nrkno/sofie-chef/commit/4daac8ef6f2d7abf063925f1a3d06326d0456f76))
* change type of some of the HTTP-REST API enpoints ([f98d28a](https://github.com/nrkno/sofie-chef/commit/f98d28a4912c89c8c83d31fc01af86acf3cd7952))
* issue with changing defaultURL in config.json didn't update the window ([f13720c](https://github.com/nrkno/sofie-chef/commit/f13720c25e7628c3f13e9a8b3eb41bb6d9afea54))
* Various changes: ([2bfc61e](https://github.com/nrkno/sofie-chef/commit/2bfc61edd376e9989805d16f954356326605904b))
