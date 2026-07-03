/**
 * Reads the browser's Network Information API where available.
 * Returns null on Safari/iOS (and any browser that doesn't support it) —
 * callers must treat that as "no hint", not "bad connection".
 * Use this to make instant UI decisions (autoplay, audio-only default, etc.),
 * not as your only signal — Cloudinary's player handles adaptive bitrate
 * regardless of whether this API is available.
 */
export function getConnectionHint() {
  const conn =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!conn) return null;

  return {
    effectiveType: conn.effectiveType, // 'slow-2g' | '2g' | '3g' | '4g'
    saveData: conn.saveData,
    downlinkMbps: conn.downlink,
  };
}