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
  context?: {
    order?: string;
  };
}

export async function getResources() {
  try {
    const result = await cloudinary.search
      .expression('resource_type:image OR resource_type:video')
      // Sortăm după contextul 'order' dacă există, altfel după data creării
      .with_field('context')
      .max_results(100)
      .execute();
    
    // Sortare manuală bazată pe metadata 'order'
    const resources = (result.resources as CloudinaryResource[]).sort((a, b) => {
      const orderA = parseInt(a.context?.order || '9999');
      const orderB = parseInt(b.context?.order || '9999');
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return resources;
  } catch (error) {
    console.error('Error fetching resources from Cloudinary:', error);
    return [];
  }
}

export async function deleteResource(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false };
  }
}

export async function updateResourcesOrder(orders: { public_id: string, order: number }[]) {
  try {
    // Actualizăm contextul pentru fiecare resursă
    const promises = orders.map(item => 
      cloudinary.uploader.add_context(`order=${item.order}`, [item.public_id])
    );
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    console.error('Update order error:', error);
    return { success: false };
  }
}
