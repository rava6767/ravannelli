'use client';

import { motion, Reorder } from 'framer-motion';
import { CloudinaryResource } from '@/lib/cloudinary';
import { CldImage } from 'next-cloudinary';
import { Play, X, GripVertical } from 'lucide-react';
import { deleteMediaAction, updateOrderAction } from '@/app/actions';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GalleryProps {
  resources: CloudinaryResource[];
}

export default function Gallery({ resources: initialResources }: GalleryProps) {
  const [items, setItems] = useState(initialResources);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  // Update internal state when server resources change
  useEffect(() => {
    setItems(initialResources);
  }, [initialResources]);

  const handleDelete = async (publicId: string) => {
    if (confirm('Sigur vrei să ștergi această amintire?')) {
      const res = await deleteMediaAction(publicId);
      if (res.success) {
        setItems(items.filter(item => item.public_id !== publicId));
      }
    }
  };

  const handleReorder = async (newOrder: CloudinaryResource[]) => {
    setItems(newOrder);
    setIsUpdating(true);
    
    const orderData = newOrder.map((item, index) => ({
      public_id: item.public_id,
      order: index
    }));

    await updateOrderAction(orderData);
    setIsUpdating(false);
    router.refresh();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-accent font-serif text-xl italic">The gallery is currently empty.</p>
        <p className="text-accent/50 text-sm mt-2">Upload something beautiful to get started.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isUpdating && (
        <div className="fixed top-4 right-4 z-50 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-widest">
          se salvează ordinea...
        </div>
      )}
      
      <Reorder.Group 
        axis="y" 
        values={items} 
        onReorder={handleReorder}
        className="masonry-grid w-full"
      >
        {items.map((resource, index) => (
          <Reorder.Item
            key={resource.public_id}
            value={resource}
            className="masonry-item group relative overflow-hidden rounded-sm bg-neutral-900/50"
          >
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(resource.public_id);
                }}
                className="p-1.5 bg-black/60 hover:bg-red-900/80 rounded-full text-white/70 hover:text-white backdrop-blur-sm border border-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
              <div className="p-1.5 bg-black/60 rounded-full text-white/70 backdrop-blur-sm border border-white/10">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            </div>

            {resource.resource_type === 'image' ? (
              <CldImage
                width={resource.width}
                height={resource.height}
                src={resource.public_id}
                alt="Gallery Image"
                className="w-full h-auto object-cover transition-all duration-1000 grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                 <video 
                  src={resource.secure_url} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  muted
                  loop
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => e.currentTarget.pause()}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors duration-500">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>
              </div>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
