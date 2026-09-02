# vimeo-sdk-test

Minimal repro for a Vimeo player regression, most visible on iOS WebKit.

Posting `{ method: "play" }` to a bare Vimeo iframe without a live user
gesture makes the player mute itself and start playing. Before Vimeo player
build 4.46.68 (first seen 6 July 2026) the call failed and the video stayed
paused and unmuted.

No SDK is loaded. The page talks to the iframe with the same `postMessage`
protocol `@vimeo/player` uses internally, so the SDK is ruled out as a cause.
(The SDK's own `play()` is a one-line `postMessage({ method: "play" })`, and
its latest release, 2.30.4 on 29 April 2026, predates the regression.) The
only moving part is the player build inside the iframe, which Vimeo picks
server-side.

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
The page logs the user agent, and muted, volume and paused state before and
after `play`, plus whether the player answered or returned an error.

The Vimeo player build is not exposed by the player API. Read it from the
iframe's network requests in Safari Web Inspector and record it alongside the
log.
