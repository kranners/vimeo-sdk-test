# vimeo-sdk-test

Minimal repro for a Vimeo player regression, hosted on GitHub Pages.

## The bug

On iOS WebKit (all versions tested: 16, 18, 26.6.1), posting `{ method: "play" }` to the Vimeo iframe without a live user gesture makes the Vimeo iframe player mute itself and start playing. Before Vimeo player build 4.46.68 (first seen 6 July 2026) the call simply failed and the video stayed paused and unmuted.

Not iOS-specific. The player mutes whenever the browser rejects audible `play()` without a gesture. iOS always rejects. Desktop Safari and Chromium reject only when the page has no sticky user activation and the site has no autoplay allowance (Chromium Media Engagement Index, Safari per-site setting), so desktop results vary between runs. The iframe carries `allow="autoplay"`, so it inherits the parent page's permission.

## Constraints

- Static site only. No build step, no bundler, no framework. One `index.html` plus a script.
- No `@vimeo/player` SDK. A bare `<iframe src="https://player.vimeo.com/video/...">` driven with raw `postMessage`, using the same protocol the SDK uses internally. This rules the SDK out as a cause; its `play()` is a bare `postMessage({ method: "play" })` and its latest release (2.30.4, 29 April 2026) predates the regression.
- Post `play` from a `setTimeout` after the player's `ready` message, so there is no user gesture.
- Log to the page, not only the console: user agent, and `getMuted`, `getVolume` and `getPaused` before and after `play`, plus whether `play` was answered or returned an error. The Vimeo player build is not exposed by the player API, so record it by hand from the iframe's network requests.
- Keep everything visible on an iPhone screen.
- Australian English in copy.

## Do not

- Add `@vimeo/player`, React, react-player, vimeo-video-element or any wrapper. The repro must show the bare iframe alone is enough.
- Use the `autoplay` embed parameter. The bug is in API-triggered play, not autoplay.
- Try to pin the Vimeo player build. It is chosen server-side and cannot be overridden.
