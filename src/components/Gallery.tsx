'use client';

import { motion } from 'framer-motion';
import { CloudinaryResource } from '@/lib/cloudinary';
import { CldImage } from 'next-cloudinary';
import { Play } from 'lucide-react';

interface GalleryProps {
  resources: CloudinaryResource[];
}

export default function Gallery({ resources }: GalleryProps) {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-accent font-serif text-xl italic">The gallery is currently empty.</p>
        <p className="text-accent/50 text-sm mt-2">Upload something beautiful to get started.</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid w-full">
      {resources.map((resource, index) => (
        <motion.div
          key={resource.public_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: index * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="masonry-item group relative overflow-hidden rounded-lg bg-neutral-900 border border-neutral-800"
        >
          {resource.resource_type === 'image' ? (
            <CldImage
              width={resource.width}
              height={resource.height}
              src={resource.public_id}
              alt="Gallery Image"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white">
                  <Play className="w-5 h-5 fill-current" />
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
            <span className="text-xs text-white/50 font-sans tracking-widest uppercase">
              {new Date(resource.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
