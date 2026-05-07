'use client';

import { CloudinaryResource } from '@/lib/cloudinary';
import { CldImage } from 'next-cloudinary';
import { Play, X, Download, Maximize2, Move } from 'lucide-react';
import { deleteMediaAction, updateOrderAction } from '@/app/actions';
import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useScroll, useSpring } from 'framer-motion';

interface GalleryProps {
  resources: CloudinaryResource[];
}

function SortableItem({ 
  resource, 
  onDelete, 
  onDownload, 
  onSelect 
}: { 
  resource: CloudinaryResource, 
  onDelete: (id: string) => void,
  onDownload: (url: string, filename: string) => void,
  onSelect: (url: string) => void
}) {
  const [showActions, setShowActions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: resource.public_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  useEffect(() => {
    if (resource.resource_type !== 'video' || !videoRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) videoRef.current?.play().catch(() => {});
        else videoRef.current?.pause();
      },
      { threshold: 0.5 }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [resource.resource_type]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="masonry-item relative group mb-3 sm:mb-6"
    >
      {/* Menu Overlay */}
      <div 
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm transition-all duration-300 rounded-sm ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
      >
        <div className="flex gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onSelect(resource.secure_url); setShowActions(false); }}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white border border-white/20"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDownload(resource.secure_url, `${resource.public_id}.${resource.format}`); setShowActions(false); }}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white border border-white/20"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(resource.public_id); setShowActions(false); }}
            className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full text-white border border-red-500/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div 
          {...attributes} 
          {...listeners}
          className="mt-2 px-6 py-2 bg-white/10 rounded-full text-[10px] uppercase tracking-[0.2em] text-white/70 border border-white/10 cursor-grab active:cursor-grabbing touch-none flex items-center gap-2"
        >
          <Move className="w-3 h-3" /> Mută
        </div>
      </div>

      <div 
        className="relative cursor-pointer overflow-hidden rounded-sm"
        onClick={() => setShowActions(true)}
      >
        {resource.resource_type === 'image' ? (
          <CldImage
            width={resource.width}
            height={resource.height}
            src={resource.public_id}
            alt="Gallery"
            className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="relative w-full aspect-video bg-neutral-900 flex items-center justify-center">
             <video 
              ref={videoRef}
              src={resource.secure_url} 
              className="w-full h-full object-cover" 
              muted 
              loop 
              playsInline
            />
             <div className="absolute inset-0 flex items-center justify-center bg-black/10">
               <Play className="w-8 h-8 text-white/40 fill-current" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Gallery({ resources: initialResources }: GalleryProps) {
  const [items, setItems] = useState(initialResources);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(initialResources);
  }, [initialResources]);

  const handleDelete = async (publicId: string) => {
    if (confirm('Ștergi această amintire?')) {
      const res = await deleteMediaAction(publicId);
      if (res.success) setItems(items.filter(item => item.public_id !== publicId));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.public_id === active.id);
      const newIndex = items.findIndex((item) => item.public_id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      await updateOrderAction(newItems.map((item, index) => ({ public_id: item.public_id, order: index })));
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch {
      window.open(url, '_blank');
    }
  };

  if (items.length === 0) return <div className="py-24 text-center opacity-40 italic">Galeria este goală.</div>;

  return (
    <div className="relative">
      <motion.div className="scroll-progress" style={{ scaleX }} />
      
      {activeId && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] uppercase tracking-[0.3em] text-white/40">
          se salvează ordinea...
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.public_id)} strategy={verticalListSortingStrategy}>
          <div className="masonry-grid">
            {items.map((resource) => (
              <SortableItem key={resource.public_id} resource={resource} onDelete={handleDelete} onDownload={handleDownload} onSelect={(url) => window.open(url, '_blank')} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
