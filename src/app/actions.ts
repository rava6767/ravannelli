'use server';

import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function deleteMediaAction(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete' };
  }
}

export async function updateOrderAction(orders: { public_id: string, order: number }[]) {
  try {
    const promises = orders.map(item => 
      cloudinary.uploader.add_context(`order=${item.order}`, [item.public_id])
    );
    await Promise.all(promises);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update order' };
  }
}
