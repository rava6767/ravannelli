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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    disabled: !showActions // Mutarea merge DOAR când meniul e deschis
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.4 : 1,
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
      className="masonry-item"
    >
      {/* Menu Overlay - Apare la click */}
      <div 
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-md transition-all duration-300 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
      >
        <div className="flex gap-6">
          <button 
            onClick={(e) => { e.stopPropagation(); onSelect(resource.secure_url); setShowActions(false); }}
            className="p-4 bg-white/10 rounded-full text-white border border-white/20 active:scale-90 transition-transform"
          >
            <Maximize2 className="w-6 h-6" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDownload(resource.secure_url, `${resource.public_id}.${resource.format}`); setShowActions(false); }}
            className="p-4 bg-white/10 rounded-full text-white border border-white/20 active:scale-90 transition-transform"
          >
            <Download className="w-6 h-6" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(resource.public_id); setShowActions(false); }}
            className="p-4 bg-red-500/20 rounded-full text-white border border-red-500/20 active:scale-90 transition-transform"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Handlerul de mutare - singura zonă de unde poți trage */}
        <div 
          {...attributes} 
          {...listeners}
          className="px-8 py-3 bg-white/20 rounded-full text-[11px] uppercase tracking-[0.3em] text-white border border-white/30 cursor-grab active:cursor-grabbing touch-none flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Move className="w-4 h-4" /> Trage pentru a muta
        </div>
      </div>

      <div 
        className="relative cursor-pointer w-full h-full"
        onClick={() => setShowActions(true)}
      >
        {resource.resource_type === 'image' ? (
          <CldImage
            width={resource.width}
            height={resource.height}
            src={resource.public_id}
            alt="Gallery"
            className="w-full h-auto block"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="relative w-full bg-neutral-900 flex items-center justify-center overflow-hidden">
             <video 
              ref={videoRef}
              src={resource.secure_url} 
              className="w-full h-auto block" 
              muted 
              loop 
              playsInline
            />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <Play className="w-10 h-10 text-white/40 fill-current" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Gallery({ resources: initialResources }: GalleryProps) {
  const [items, setItems] = useState(initialResources);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
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
    } catch { window.open(url, '_blank'); }
  };

  if (items.length === 0) return <div className="py-24 text-center opacity-40 italic font-serif lowercase">spațiu gol</div>;

  return (
    <div className="relative">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
