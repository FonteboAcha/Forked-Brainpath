const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a file directly from the browser to Cloudinary.
 * Returns the secure URL and duration (for video).
 * onProgress(percent) is called as the upload progresses.
 */
export async function uploadToCloudinary(file, onProgress) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary env vars missing — check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in client/.env"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("resource_type", "video");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          // Cloudinary returns duration in seconds for video
          duration: data.duration ? Math.round(data.duration) : null,
          format: data.format,
          bytes: data.bytes,
        });
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`
    );
    xhr.send(formData);
  });

}

const RESOURCE_PRESET = import.meta.env.VITE_CLOUDINARY_RESOURCE_PRESET;

/**
 * Uploads a PDF directly from the browser to Cloudinary.
 * Uses the 'raw' resource type — for PDFs, Word docs, etc.
 */
export async function uploadPdfToCloudinary(file, onProgress) {
  if (!CLOUD_NAME || !RESOURCE_PRESET) {
    throw new Error(
      "Cloudinary env vars missing — check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_RESOURCE_PRESET"
    );
  }

  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported");
  }
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("PDF must be under 50MB");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", RESOURCE_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          bytes: data.bytes,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`
    );
    xhr.send(formData);
  });
}

/** Returns a human-readable file size string */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns a formatted duration string from seconds */
export function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}