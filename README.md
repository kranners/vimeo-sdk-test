# vimeo-sdk-test

Minimal repro for a Vimeo player regression, most visible on iOS WebKit.

Calling `player.play()` via the `@vimeo/player` SDK without a live user gesture
makes the Vimeo iframe player mute itself and start playing. Before Vimeo player
build 4.46.68 (first seen 6 July 2026) the call failed and the video stayed
paused and unmuted.

The regression is not iOS-specific. It fires whenever the browser rejects an
audible `play()` without a gesture. iOS always rejects, so it reproduces every
time. Desktop Safari and Chromium reject only when the page has no sticky user
activation and no autoplay allowance for the site (Chromium's Media Engagement
Index, Safari's per-site auto-play setting), so results there vary from run to
run. The page logs both, plus a probe `Audio` element in the parent document
that shows whether the browser blocked audible autoplay on that run.

## Run

Open `index.html` over HTTP (GitHub Pages or any static server). Use a fresh
private window and do not click or tap the page before the verdict appears.
Any gesture grants the Vimeo iframe autoplay permission via `allow="autoplay"`
and the test becomes inconclusive.
The page logs the SDK version, user agent, and muted, volume and paused state
before and after `play()`, plus whether the promise resolved or rejected.

The Vimeo player build is not exposed by the SDK. Read it from the iframe's
network requests in Safari Web Inspector and record it alongside the log.
