# vimeo-sdk-test

Minimal repro for a Vimeo player regression on iOS WebKit.

Calling `player.play()` via the `@vimeo/player` SDK without a live user gesture
makes the Vimeo iframe player mute itself and start playing. Before Vimeo player
build 4.46.68 (first seen 6 July 2026) the call failed and the video stayed
paused and unmuted. Desktop Safari and Chromium are unaffected.

## Run

Open `index.html` over HTTP (GitHub Pages or any static server) on an iPhone.
The page logs the SDK version, user agent, and muted, volume and paused state
before and after `play()`, plus whether the promise resolved or rejected.

The Vimeo player build is not exposed by the SDK. Read it from the iframe's
network requests in Safari Web Inspector and record it alongside the log.
