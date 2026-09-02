(function () {
  var ORIGIN = "https://player.vimeo.com";
  var DELAY_MS = 2000;

  var iframe = document.getElementById("player");
  var logEl = document.getElementById("log");
  function log(msg, cls) {
    var line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = msg;
    logEl.appendChild(line);
    console.log(msg);
  }

  log("No SDK. Raw postMessage to " + ORIGIN);
  log("UA " + navigator.userAgent, "dim");
  log("Player build: record by hand from iframe requests", "dim");
  log("Do not click or tap this page until the verdict appears.", "dim");

  // Minimal client for the Vimeo player postMessage protocol, mirroring what
  // @vimeo/player does internally:
  //   parent -> iframe  { method: "play" }
  //   iframe -> parent  { method: "getMuted", value: true }
  //   iframe -> parent  { event: "error", data: { method, name, message } }
  //   iframe -> parent  { event: "ready" }
  var pending = {};
  var readyResolve;
  var ready = new Promise(function (resolve) {
    readyResolve = resolve;
  });

  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN || e.source !== iframe.contentWindow) return;
    var data = e.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err) {
        return;
      }
    }
    if (!data) return;
    if (data.event === "ready" || data.method === "ping") {
      readyResolve();
      return;
    }
    if (data.event === "error" && data.data && pending[data.data.method]) {
      var err = new Error(data.data.message);
      err.name = data.data.name;
      pending[data.data.method].shift().reject(err);
      return;
    }
    if (data.method && pending[data.method] && pending[data.method].length) {
      pending[data.method].shift().resolve(data.value);
    }
  });

  function call(method) {
    return ready.then(function () {
      return new Promise(function (resolve, reject) {
        (pending[method] = pending[method] || []).push({
          resolve: resolve,
          reject: reject,
        });
        iframe.contentWindow.postMessage({ method: method }, ORIGIN);
      });
    });
  }

  // In case the player finished loading before our listener attached.
  iframe.contentWindow.postMessage({ method: "ping" }, ORIGIN);

  function snapshot(label) {
    return Promise.all([
      call("getMuted"),
      call("getVolume"),
      call("getPaused"),
    ]).then(function (r) {
      log(label + " muted=" + r[0] + " volume=" + r[1] + " paused=" + r[2]);
      return r;
    });
  }

  // Whether the page has ever had a user gesture. Sticky activation is what
  // lets desktop browsers allow audible autoplay. The Vimeo iframe has
  // allow="autoplay", so it inherits this page's permission.
  function activation() {
    var ua = navigator.userActivation;
    if (!ua) return "userActivation n/a";
    return "hasBeenActive=" + ua.hasBeenActive + " isActive=" + ua.isActive;
  }

  // Half a second of silent 8 kHz mono PCM with a real audio track, so the
  // browser treats it as audible for autoplay purposes.
  function silentWav() {
    var samples = 4000;
    var buf = new ArrayBuffer(44 + samples);
    var v = new DataView(buf);
    function str(o, s) {
      for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
    }
    str(0, "RIFF");
    v.setUint32(4, 36 + samples, true);
    str(8, "WAVEfmt ");
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); // PCM
    v.setUint16(22, 1, true); // mono
    v.setUint32(24, 8000, true); // sample rate
    v.setUint32(28, 8000, true); // byte rate
    v.setUint16(32, 1, true); // block align
    v.setUint16(34, 8, true); // bits per sample
    str(36, "data");
    v.setUint32(40, samples, true);
    for (var i = 0; i < samples; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }

  // Does this browser, right now, block audible play() without a gesture?
  // Resolves true if blocked (NotAllowedError), false if it played.
  function probeAutoplayBlocked() {
    var a = new Audio(silentWav());
    a.volume = 1;
    return a.play().then(
      function () {
        a.pause();
        return false;
      },
      function (err) {
        return err && err.name === "NotAllowedError" ? true : "error " + err;
      },
    );
  }

  ready
    .then(function () {
      log("ready");
      return snapshot("before");
    })
    .then(function () {
      setTimeout(function () {
        var blocked;
        log("page " + activation(), "dim");
        probeAutoplayBlocked()
          .then(function (b) {
            blocked = b;
            log("browser blocks audible autoplay on this page: " + b, "dim");
            log('posting { method: "play" } from setTimeout, no gesture');
            return call("play");
          })
          .then(
            function () {
              log("play resolved", "ok");
            },
            function (err) {
              log(
                "play rejected: " +
                  (err && err.name) +
                  " " +
                  (err && err.message),
                "bad",
              );
            },
          )
          .then(function () {
            return snapshot("after");
          })
          .then(function (r) {
            var muted = r[0];
            var paused = r[2];
            if (muted) log("BUG: player muted itself instead of failing", "bad");
            else if (paused)
              log("expected: play failed, still unmuted and paused", "ok");
            else if (blocked === false)
              log(
                "inconclusive: browser allowed audible autoplay here, so the player had no reason to mute. Retry in a fresh private window without clicking.",
                "dim",
              );
            else log("played unmuted without a gesture", "ok");
          });
      }, DELAY_MS);
    });
})();
