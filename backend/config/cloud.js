import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const getResourceType = (file) => {
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  return imageTypes.includes(file.mimetype) ? "image" : "raw";
};

const getFileFormat = (file) => {
  const extension = file.originalname.split(".").pop()?.toLowerCase();

  const formatMap = {
    txt: "txt",
    pdf: "pdf",
    doc: "doc",
    docx: "docx",
    xls: "xls",
    xlsx: "xlsx",
    ppt: "ppt",
    pptx: "pptx",
    zip: "zip",
    jpg: "jpg",
    jpeg: "jpg",
    png: "png",
    gif: "gif",
    webp: "webp",
    svg: "svg",
    mp3: "mp3",
    mp4: "mp4",
  };

  return formatMap[extension] || extension;
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const resourceType = getResourceType(file);
    const isImage = resourceType === "image";
    const format = getFileFormat(file);

    return {
      folder: "ChatRift_Development",
      resource_type: resourceType,
      format: format,
      public_id: `${isImage ? "img" : "file"}-${Date.now()}-${
        file.originalname.split(".")[0]
      }`,
    };
  },
});

export { cloudinary, storage };
