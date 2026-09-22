import cloudinary from "../utils/cloudinary.js";

// signed Cloudinary upload signature so the client can upload
// the file directly to Cloudinary bypassing our server entirely
export const getUploadSignature = async (req, res) => {
  try {
    const { type } = req.query;

    if (type !== "image" && type !== "video") {
      return res
        .status(400)
        .json({ message: "ayooo type must be image or video" });
    }

    const folder =
      type === "image" ? "social-media/posts" : "social-media/reels";
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      process.env.CLOUDINARY_API_SECRET,
    );

    return res.status(200).json({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      resourceType: type,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
