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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useScroll, useSpring } from 'framer-motion';

interface GalleryProps {
  resources: CloudinaryResource[];
}

function SortableItem({ 
  resource, 
  index,
  onDelete, 
  onDownload, 
  onSelect 
}: { 
  resource: CloudinaryResource, 
  index: number,
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
  };

  // Autoplay video on scroll using Intersection Observer
  useEffect(() => {
    if (resource.resource_type !== 'video' || !videoRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) videoRef.current?.play();
        else videoRef.current?.pause();
      },
      { threshold: 0.6 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [resource.resource_type]);

  // Design mozaic inteligent: una din 6 poze este mai mare
  const isFeatured = index % 6 === 0;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative overflow-hidden group transition-all duration-700 ${isFeatured ? 'w-[66%] sm:w-[49%]' : 'w-[32%] sm:w-[24%]'}`}
      style={{ ...style, aspectRatio: isFeatured ? '16/10' : '1/1' }}
    >
      {/* Menu Overlay */}
      <div 
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-md transition-all duration-500 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
      >
        <div className="flex gap-4 scale-90 sm:scale-100">
          <button onClick={(e) => { e.stopPropagation(); onSelect(resource.secure_url); setShowActions(false); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white border border-white/10"><Maximize2 className="w-5 h-5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDownload(resource.secure_url, `${resource.public_id}.${resource.format}`); setShowActions(false); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white border border-white/10"><Download className="w-5 h-5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(resource.public_id); setShowActions(false); }} className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-full text-red-400 border border-red-500/10"><X className="w-5 h-5" /></button>
        </div>
        <div {...attributes} {...listeners} className="mt-2 px-6 py-2 bg-white/5 rounded-full text-[9px] uppercase tracking-[0.3em] text-white/50 border border-white/5 cursor-grab active:cursor-grabbing touch-none flex items-center gap-2">
          <Move className="w-3 h-3" /> Reordonează
        </div>
      </div>

      <div className="w-full h-full cursor-pointer" onClick={() => setShowActions(true)}>
        {resource.resource_type === 'image' ? (
          <CldImage
            width={resource.width}
            height={resource.height}
            src={resource.public_id}
            alt="Memorie"
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-neutral-900">
            <video ref={videoRef} src={resource.secure_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted loop playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Play className="w-8 h-8 text-white/20 fill-current group-hover:text-white/40 transition-colors" />
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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
      
      // Update local state instantly
      setItems(newItems);
      
      // Save to server in the background without refreshing
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
    } catch { window.open(url, '_blank'); }
  };

  if (items.length === 0) return <div className="py-24 text-center opacity-30 italic font-serif">spațiu în așteptarea amintirilor...</div>;

  return (
    <div className="relative">
      <motion.div className="scroll-progress" style={{ scaleX }} />
      
      {activeId && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] uppercase tracking-[0.3em] text-white/40">
          repoziționare în curs...
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.public_id)} strategy={rectSortingStrategy}>
          <div className="masonry-grid">
            {items.map((resource, index) => (
              <SortableItem key={resource.public_id} resource={resource} index={index} onDelete={handleDelete} onDownload={handleDownload} onSelect={(url) => window.open(url, '_blank')} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
