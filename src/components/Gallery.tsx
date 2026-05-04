'use client';

import { motion, Reorder } from 'framer-motion';
import { CloudinaryResource } from '@/lib/cloudinary';
import { CldImage } from 'next-cloudinary';
import { Play, X, GripVertical, Download, Maximize2 } from 'lucide-react';
import { deleteMediaAction, updateOrderAction } from '@/app/actions';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GalleryProps {
  resources: CloudinaryResource[];
}

export default function Gallery({ resources: initialResources }: GalleryProps) {
  const [items, setItems] = useState(initialResources);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  // ... (păstrăm restul logicii neschimbate până la return)

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
    }
  };

  if (items.length === 0) {
    // ... (logică empty state)
  }

  return (
    <div className="relative">
      {/* Lightbox / Fullscreen View */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedImage} 
            className="max-w-full max-h-full object-contain rounded-sm shadow-2xl" 
            alt="Full view" 
          />
        </div>
      )}

      {isUpdating && (
        <div className="fixed top-4 right-4 z-50 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/80">
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
            className="masonry-item group relative overflow-hidden rounded-sm bg-neutral-900/30 border border-white/[0.03] hover:border-white/10 transition-colors duration-500"
          >
            {/* Action Bar (Top) */}
            <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-start justify-between p-2.5">
              <div className="flex gap-2">
                <div className="p-1.5 bg-black/40 rounded-full text-white/50 backdrop-blur-md border border-white/10 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-3 h-3" />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownload(resource.secure_url, `${resource.public_id}.${resource.format}`)}
                  className="p-1.5 bg-black/40 hover:bg-black/80 rounded-full text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all"
                  title="Descarcă"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDelete(resource.public_id)}
                  className="p-1.5 bg-black/40 hover:bg-red-900/60 rounded-full text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all"
                  title="Șterge"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div 
              className="relative cursor-pointer"
              onClick={() => resource.resource_type === 'image' && setSelectedImage(resource.secure_url)}
            >
              {resource.resource_type === 'image' ? (
                <CldImage
                  width={resource.width}
                  height={resource.height}
                  src={resource.public_id}
                  alt="Gallery Image"
                  className="w-full h-auto object-cover transition-all duration-1000 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="relative aspect-video bg-black/40 flex items-center justify-center overflow-hidden">
                   <video 
                    src={resource.secure_url} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    muted
                    loop
                    onMouseOver={(e) => e.currentTarget.play()}
                    onMouseOut={(e) => e.currentTarget.pause()}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors duration-500">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Overlay (Bottom) */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3 h-3 text-white/40" />
                  <span className="text-[9px] text-white/40 font-sans tracking-[0.2em] uppercase">
                    vezi detalii
                  </span>
                </div>
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
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
