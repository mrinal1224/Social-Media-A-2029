import axios from "axios";
import axiosInstance from "./axios";

export const uploadFileToCloudinary = async (file, type, onProgress) => {
  const { data: signatureData } = await axiosInstance.get("/upload/signature", {
    params: { type },
  });

  const { signature, timestamp, folder, apiKey, cloudName, resourceType } =
    signatureData;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const { data } = await axios.post(cloudinaryUrl, formData, {
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

  return data.secure_url;
};
