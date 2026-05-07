'use client';

import { CloudinaryResource } from '@/lib/cloudinary';
import { CldImage } from 'next-cloudinary';
import { Play, X, GripVertical, Download, Maximize2 } from 'lucide-react';
import { deleteMediaAction, updateOrderAction } from '@/app/actions';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: resource.public_id,
    disabled: !showActions
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="masonry-item relative group"
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
          className="mt-2 px-6 py-2 bg-white/10 rounded-full text-[10px] uppercase tracking-[0.2em] text-white/70 border border-white/10 cursor-grab active:cursor-grabbing touch-none"
        >
          Trage pentru a muta
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
              src={resource.secure_url} 
              className="w-full h-full object-cover" 
              muted 
              loop 
              onMouseOver={(e) => e.currentTarget.play()} 
              onMouseOut={(e) => e.currentTarget.pause()} 
            />
             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
               <Play className="w-8 h-8 text-white/60 fill-current" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Gallery({ resources: initialResources }: GalleryProps) {
  const [items, setItems] = useState(initialResources);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.public_id === active.id);
      const newIndex = items.findIndex((item) => item.public_id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      setIsUpdating(true);
      await updateOrderAction(newItems.map((item, index) => ({ public_id: item.public_id, order: index })));
      setIsUpdating(false);
      router.refresh();
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
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-full object-contain" alt="Full" />
        </div>
      )}

      {isUpdating && <div className="fixed top-4 right-4 z-50 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-widest opacity-60">salvare...</div>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.public_id)} strategy={verticalListSortingStrategy}>
          <div className="masonry-grid">
            {items.map((resource) => (
              <SortableItem key={resource.public_id} resource={resource} onDelete={handleDelete} onDownload={handleDownload} onSelect={setSelectedImage} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
