'use client';

import { CloudinaryResource } from '@/lib/cloudinary';
import { CldImage } from 'next-cloudinary';
import { Play, X, Download, Maximize2, Move, Share2 } from 'lucide-react';
import { deleteMediaAction, updateOrderAction } from '@/app/actions';
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
    opacity: isDragging ? 0.3 : 1,
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'dariuca',
          url: resource.secure_url,
        });
      } catch (err) {}
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(resource.secure_url);
      alert('Link copiat!');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="masonry-item-card relative w-full group"
    >
      {showActions && (
        <div 
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/80 backdrop-blur-md rounded-xl"
          onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
        >
          <div className="flex gap-3">
            <button onClick={(e) => { e.stopPropagation(); onSelect(resource.secure_url); setShowActions(false); }} className="p-4 bg-white/10 rounded-full text-white border border-white/20 active:scale-95"><Maximize2 className="w-5 h-5" /></button>
            <button onClick={handleShare} className="p-4 bg-white/10 rounded-full text-white border border-white/20 active:scale-95"><Share2 className="w-5 h-5" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDownload(resource.secure_url, `${resource.public_id}.${resource.format}`); setShowActions(false); }} className="p-4 bg-white/10 rounded-full text-white border border-white/20 active:scale-95"><Download className="w-5 h-5" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(resource.public_id); setShowActions(false); }} className="p-4 bg-red-500/20 rounded-full text-white border border-red-500/20 active:scale-95"><X className="w-5 h-5" /></button>
          </div>
          <div {...attributes} {...listeners} className="px-8 py-3 bg-white/15 rounded-full text-[10px] uppercase tracking-[0.3em] text-white/80 border border-white/30 touch-none flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Move className="w-4 h-4" /> Move
          </div>
        </div>
      )}

      <div className="relative cursor-pointer w-full rounded-corners shadow-lg overflow-hidden" onClick={() => setShowActions(true)}>
        {resource.resource_type === 'image' ? (
          <CldImage width={resource.width} height={resource.height} src={resource.public_id} alt="Gallery" className="w-full h-auto block" sizes="(max-width: 640px) 50vw, 33vw" />
        ) : (
          <div className="relative w-full aspect-video bg-neutral-900 flex items-center justify-center">
            <video src={resource.secure_url} className="w-full h-full object-cover" muted loop playsInline />
            <Play className="absolute w-10 h-10 text-white/30 fill-current" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Gallery({ resources: initialResources }: GalleryProps) {
  const [items, setItems] = useState(initialResources);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setItems(initialResources);
  }, [initialResources]);

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
      router.refresh();
    }
  };

  const handleDelete = async (publicId: string) => {
    if (confirm('Ștergi amintirea?')) {
      const res = await deleteMediaAction(publicId);
      if (res.success) setItems(items.filter(item => item.public_id !== publicId));
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

  if (items.length === 0) return <div className="py-24 text-center opacity-40 italic">galeria este goală.</div>;

  return (
    <div className="relative w-full">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.public_id)} strategy={rectSortingStrategy}>
          <div className="aesthetic-masonry">
            {items.map((resource) => (
              <SortableItem key={resource.public_id} resource={resource} onDelete={handleDelete} onDownload={handleDownload} onSelect={(url) => window.open(url, '_blank')} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay adjustScale={true}>
          {activeId ? (
            <div className="opacity-80 scale-105 rounded-lg overflow-hidden border border-white/20 shadow-2xl">
              <CldImage width={400} height={400} src={activeId} alt="Dragging" className="w-full h-auto" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
