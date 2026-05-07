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
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-full group overflow-hidden"
    >
      {/* Menu Overlay - Triggered by Click */}
      {showActions && (
        <div 
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-md"
          onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
        >
          <div className="flex gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); onSelect(resource.secure_url); setShowActions(false); }}
              className="p-4 bg-white/10 rounded-full text-white border border-white/20 active:scale-90"
            >
              <Maximize2 className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDownload(resource.secure_url, `${resource.public_id}.${resource.format}`); setShowActions(false); }}
              className="p-4 bg-white/10 rounded-full text-white border border-white/20 active:scale-90"
            >
              <Download className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(resource.public_id); setShowActions(false); }}
              className="p-4 bg-red-500/20 rounded-full text-white border border-red-500/20 active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Drag Handle - The only way to move */}
          <div 
            {...attributes} 
            {...listeners}
            className="px-8 py-3 bg-white/20 rounded-full text-[11px] uppercase tracking-[0.3em] text-white border border-white/30 cursor-grab active:cursor-grabbing touch-none flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Move className="w-4 h-4" /> Move
          </div>

          <button 
            className="absolute top-4 right-4 text-white/50"
            onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <div 
        className="relative cursor-pointer w-full"
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
            priority={false}
          />
        ) : (
          <div className="relative w-full aspect-video bg-neutral-900 flex items-center justify-center">
            <video 
              src={resource.secure_url} 
              className="w-full h-full object-contain" 
              muted 
              loop 
              playsInline
            />
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    }
  };

  const handleDelete = async (publicId: string) => {
    if (confirm('Delete this memory?')) {
      const res = await deleteMediaAction(publicId);
      if (res.success) {
        setItems(items.filter(item => item.public_id !== publicId));
      }
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

  if (items.length === 0) return <div className="py-24 text-center opacity-40">Gallery is empty.</div>;

  return (
    <div className="relative w-full">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(i => i.public_id)} strategy={rectSortingStrategy}>
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-0 space-y-0">
            {items.map((resource) => (
              <SortableItem 
                key={resource.public_id} 
                resource={resource} 
                onDelete={handleDelete} 
                onDownload={handleDownload} 
                onSelect={(url) => window.open(url, '_blank')} 
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay adjustScale={true}>
          {activeId ? (
            <div className="opacity-80 scale-105 rounded-sm overflow-hidden border border-white/20">
              <CldImage
                width={400}
                height={400}
                src={activeId}
                alt="Dragging"
                className="w-full h-auto"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
