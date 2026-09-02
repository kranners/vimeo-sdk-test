# vimeo-sdk-test

Minimal repro for a Vimeo player regression, hosted on GitHub Pages.

## The bug

On iOS WebKit (all versions tested: 16, 18, 26.6.1), calling `player.play()` via the `@vimeo/player` SDK without a live user gesture makes the Vimeo iframe player mute itself and start playing. Before Vimeo player build 4.46.68 (first seen 6 July 2026) the call simply failed and the video stayed paused and unmuted. Desktop Safari and Chromium are unaffected.

## Constraints

- Static site only. No build step, no bundler, no framework. One `index.html` plus a script.
- Load `@vimeo/player` from a CDN, pinned to an exact version.
- Trigger `play()` from a `setTimeout` after the SDK `ready` event, so there is no user gesture.
- Log to the page, not only the console: SDK version, user agent, and `getMuted()`, `getVolume()` and `getPaused()` before and after `play()`, plus whether the `play()` promise resolved or rejected. The Vimeo player build is not exposed by the SDK, so record it by hand from the iframe's network requests.
- Keep everything visible on an iPhone screen.
- Australian English in copy.

## Do not

- Add React, react-player, vimeo-video-element or any wrapper. The repro must show the SDK alone is enough.
- Use the `autoplay` embed parameter. The bug is in API-triggered play, not autoplay.
- Try to pin the Vimeo player build. It is chosen server-side and cannot be overridden.
