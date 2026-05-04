import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryResource {
  public_id: string;
  format: string;
  version: number;
  resource_type: string;
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
}

export async function getResources() {
  try {
    // Using Search API for better performance and support for both images and videos
    const result = await cloudinary.search
      .expression('resource_type:image OR resource_type:video')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();
    
    return result.resources as CloudinaryResource[];
  } catch (error) {
    console.error('Error fetching resources from Cloudinary:', error);
    return [];
  }
}
