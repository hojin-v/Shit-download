/*
 * Fills the download button in with the release it will actually hand over.
 *
 * The button works with JavaScript off - its href is the releases page, and on a deployed copy
 * /api/latest-apk redirects straight to the newest APK. This only replaces the label and the link
 * with something more specific once GitHub has answered.
 */
(function () {
  "use strict";

  var RELEASES_API = "https://api.github.com/repos/hojin-v/Shit/releases?per_page=20";
  var RELEASES_PAGE = "https://github.com/hojin-v/Shit/releases";

  /** Matches the app's own rule for a version tag, so the page never offers what it would not. */
  var VERSION_TAG = /^v?(\d+)\.(\d+)(?:\.(\d+))?$/;

  var button = document.getElementById("download");
  var sub = document.getElementById("download-sub");
  if (!button || !sub) return;

  function parts(tag) {
    var m = VERSION_TAG.exec(String(tag || "").trim());
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
  }

  function newer(a, b) {
    for (var i = 0; i < 3; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
  }

  function apkOf(release) {
    var assets = release.assets || [];
    for (var i = 0; i < assets.length; i++) {
      var name = String(assets[i].name || "");
      var url = String(assets[i].browser_download_url || "");
      if (/\.apk$/i.test(name) && url.indexOf("https://") === 0) return assets[i];
    }
    return null;
  }

  /**
   * The newest release that a user could actually install: published, not a draft or prerelease,
   * plainly versioned, and with an APK attached. A tag is pushed before CI uploads the file, so a
   * release can exist with nothing to download.
   */
  function latestStable(releases) {
    var best = null;
    var bestParts = null;

    (Array.isArray(releases) ? releases : []).forEach(function (release) {
      if (release.draft || release.prerelease) return;
      var p = parts(release.tag_name);
      if (!p || !apkOf(release)) return;
      if (!bestParts || newer(p, bestParts) > 0) {
        best = release;
        bestParts = p;
      }
    });

    return best;
  }

  function readableSize(bytes) {
    if (!bytes || bytes < 0) return null;
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } })
    .then(function (response) {
      if (!response.ok) throw new Error("GitHub " + response.status);
      return response.json();
    })
    .then(function (releases) {
      var release = latestStable(releases);
      var apk = release && apkOf(release);
      if (!apk) throw new Error("no installable release");

      button.href = apk.browser_download_url;
      button.setAttribute("download", apk.name);

      var size = readableSize(apk.size);
      sub.textContent = release.tag_name + (size ? " · " + size : "");
    })
    .catch(function (error) {
      // Offline, rate limited, or nothing published yet. The releases page still works, so the
      // button keeps pointing there and says so instead of showing a stale version.
      button.href = RELEASES_PAGE;
      sub.textContent = "GitHub에서 받기";
      if (window.console) console.warn("latest release lookup failed:", error.message);
    });
})();
