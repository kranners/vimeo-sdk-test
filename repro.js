(function () {
  var SDK_VERSION = '2.30.4'; // matches the pinned CDN script in index.html
  var VIDEO_ID = 76979871;    // public video from Vimeo's own docs
  var DELAY_MS = 2000;

  var logEl = document.getElementById('log');
  function log(msg, cls) {
    var line = document.createElement('div');
    if (cls) line.className = cls;
    line.textContent = msg;
    logEl.appendChild(line);
    console.log(msg);
  }

  log('SDK @vimeo/player ' + SDK_VERSION);
  log('UA ' + navigator.userAgent, 'dim');
  log('Player build: record by hand from iframe requests', 'dim');

  var player = new Vimeo.Player('player', { id: VIDEO_ID });

  function snapshot(label) {
    return Promise.all([player.getMuted(), player.getVolume(), player.getPaused()])
      .then(function (r) {
        log(label + ' muted=' + r[0] + ' volume=' + r[1] + ' paused=' + r[2]);
        return r;
      });
  }

  player.ready().then(function () {
    log('ready');
    return snapshot('before');
  }).then(function () {
    setTimeout(function () {
      log('calling play() from setTimeout, no gesture');
      player.play().then(function () {
        log('play() resolved', 'ok');
      }, function (err) {
        log('play() rejected: ' + (err && err.name) + ' ' + (err && err.message), 'bad');
      }).then(function () {
        return snapshot('after');
      }).then(function (r) {
        if (r[0]) log('BUG: player muted itself', 'bad');
        else if (r[2]) log('expected: play failed, still unmuted and paused', 'ok');
        else log('played unmuted without a gesture', 'ok');
      });
    }, DELAY_MS);
  }).catch(function (err) {
    log('ready failed: ' + err, 'bad');
  });
})();
