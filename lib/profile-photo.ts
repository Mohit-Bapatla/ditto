import sharp from "sharp";
import { PublicError } from "./errors";

/** Decode and re-encode raster uploads: strip location/EXIF and reject SVG or arbitrary URLs. */
export async function normalizeProfilePhoto(value: string | null | undefined, size = 256) {
  if (!value) return value;
  if (
    value.length > 180000 ||
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)
  )
    throw new PublicError(
      "Choose a JPG, PNG or WebP picture under 120 KB after resizing.",
    );
  try {
    const buffer = Buffer.from(value.split(",")[1], "base64");
    const image = sharp(buffer, {
      limitInputPixels: 4_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || ""))
      throw new Error("Unsupported image");
    const output = await image
      .rotate()
      .resize(size, size, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${output.toString("base64")}`;
  } catch {
    throw new PublicError(
      "That picture couldn’t be read. Try another JPG, PNG or WebP image.",
    );
  }
}
