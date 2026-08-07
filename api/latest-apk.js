/*
 * /api/latest-apk -> 302 to the newest installable APK.
 *
 * A stable link to hand out that never has to be updated when a release goes out. The page's own
 * script does the same lookup in the browser to label the button, but this is what makes the link
 * work for anyone who just wants a URL - and it works with JavaScript off.
 *
 * On any failure it redirects to the releases page rather than erroring: the visitor came here to
 * download something, and the page listing every version is a worse answer than the file but a far
 * better one than a stack trace.
 */

const RELEASES_API = "https://api.github.com/repos/hojin-v/Shit/releases?per_page=20";
const RELEASES_PAGE = "https://github.com/hojin-v/Shit/releases";

/** The app's own rule for a version tag, so this never offers a release the app would not. */
const VERSION_TAG = /^v?(\d+)\.(\d+)(?:\.(\d+))?$/;

function parts(tag) {
  const match = VERSION_TAG.exec(String(tag || "").trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3] || 0)];
}

function compare(left, right) {
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

function apkOf(release) {
  return (release.assets || []).find((asset) => {
    const name = String(asset.name || "");
    const url = String(asset.browser_download_url || "");
    return /\.apk$/i.test(name) && url.startsWith("https://");
  });
}

/**
 * Newest release a user could install: published, plainly versioned, with an APK attached. Tags are
 * pushed before CI uploads the file, so a release can exist with nothing on it.
 */
function latestStable(releases) {
  let best = null;
  let bestParts = null;

  (Array.isArray(releases) ? releases : []).forEach((release) => {
    if (release.draft || release.prerelease) return;
    const candidate = parts(release.tag_name);
    if (!candidate || !apkOf(release)) return;
    if (!bestParts || compare(candidate, bestParts) > 0) {
      best = release;
      bestParts = candidate;
    }
  });

  return best;
}

function redirect(response, location) {
  response.statusCode = 302;
  response.setHeader("Location", location);
  // Cached at the edge for a few minutes so a release going out is picked up quickly without
  // asking GitHub on every single download.
  response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  response.end(`Redirecting to ${location}`);
}

module.exports = async function latestApk(request, response) {
  const method = request.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.statusCode = 405;
    response.setHeader("Allow", "GET, HEAD");
    response.end("Method Not Allowed");
    return;
  }

  try {
    const githubResponse = await fetch(RELEASES_API, {
      headers: {
        Accept: "application/vnd.github+json",
        // GitHub answers 403 without one.
        "User-Agent": "Shit-CameraMute-download-page",
      },
    });
    if (!githubResponse.ok) throw new Error(`GitHub Releases API ${githubResponse.status}`);

    const release = latestStable(await githubResponse.json());
    const apk = release && apkOf(release);
    if (!apk) throw new Error("no installable APK found");

    redirect(response, apk.browser_download_url);
  } catch (error) {
    redirect(response, RELEASES_PAGE);
  }
};
