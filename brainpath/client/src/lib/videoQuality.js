/**
 * Returns the appropriate Cloudinary video URL based on connection quality.
 * Inserts Cloudinary transformation parameters into the URL.
 */
export function getAdaptiveVideoUrl(originalUrl, effectiveType) {
  if (!originalUrl) return originalUrl;

  // Only Cloudinary URLs can be transformed this way
  if (!originalUrl.includes("cloudinary.com")) return originalUrl;

  const quality = getQualityParams(effectiveType);

  // Insert transformation after /upload/
  return originalUrl.replace(
    "/upload/",
    `/upload/${quality}/`
  );
}

function getQualityParams(effectiveType) {
  switch (effectiveType) {
    case "slow-2g":
      // Lowest quality — audio mostly, minimal video
      return "q_20,w_426,br_150k";
    case "2g":
      // Low quality — small frame, compressed
      return "q_30,w_640,br_300k";
    case "3g":
      // Medium quality — reasonable for learning
      return "q_60,w_854";
    case "4g":
    default:
      // Full quality
      return "q_auto";
  }
}

/**
 * Returns a human-readable label for the current quality level.
 */
export function getQualityLabel(effectiveType) {
  switch (effectiveType) {
    case "slow-2g": return { label: "Very low quality", color: "#ef4444" };
    case "2g":      return { label: "Low quality",      color: "#f59e0b" };
    case "3g":      return { label: "Medium quality",   color: "#3b82f6" };
    case "4g":
    default:        return { label: "Full quality",     color: "#10b981" };
  }
}

/**
 * Returns true if the connection is poor enough to suggest audio-only.
 */
export function shouldSuggestAudioOnly(effectiveType) {
  return effectiveType === "slow-2g" || effectiveType === "2g";
}