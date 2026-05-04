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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: resource.public_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative overflow-hidden rounded-sm bg-neutral-900/30 border border-white/[0.03] hover:border-white/10 transition-colors duration-500 group touch-none ${
        resource.width > resource.height ? 'sm:col-span-2' : ''
      }`}
    >
      {/* Action Bar - Acum apare DOAR la hover pe desktop, pe mobil e ascuns implicit */}
      <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-start justify-end p-2.5">
        <div className="flex gap-2">
          <button 
            onPointerDown={(e) => e.stopPropagation()} // Prevenim drag-ul când apăsăm pe butoane
            onClick={(e) => {
              e.stopPropagation();
              onDownload(resource.secure_url, `${resource.public_id}.${resource.format}`);
            }}
            className="p-1.5 bg-black/40 hover:bg-black/80 rounded-full text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(resource.public_id);
            }}
            className="p-1.5 bg-black/40 hover:bg-red-900/60 rounded-full text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div 
        className="relative cursor-pointer aspect-[3/4] sm:aspect-auto"
        onClick={(e) => {
          // Dacă este un click scurt (nu un drag), deschidem imaginea
          if (resource.resource_type === 'image') onSelect(resource.secure_url);
        }}
      >
        {resource.resource_type === 'image' ? (
          <CldImage
            width={resource.width}
            height={resource.height}
            src={resource.public_id}
            alt="Gallery"
            className="w-full h-full object-cover transition-all duration-1000 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="relative w-full h-full bg-black/40 flex items-center justify-center overflow-hidden">
             <video 
              src={resource.secure_url} 
              className="w-full h-full object-cover"
              muted
              loop
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => e.currentTarget.pause()}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="w-4 h-4 text-white fill-current" />
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
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250, // Trebuie să ții apăsat 250ms pentru a începe mutarea pe mobil
        tolerance: 5, // Toleranță mică pentru mișcare înainte de activare
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
    if (confirm('Sigur vrei să ștergi această amintire?')) {
      const res = await deleteMediaAction(publicId);
      if (res.success) {
        setItems(items.filter(item => item.public_id !== publicId));
      }
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
      
      const orderData = newItems.map((item, index) => ({
        public_id: item.public_id,
        order: index
      }));

      await updateOrderAction(orderData);
      setIsUpdating(false);
      router.refresh();
    }
  };

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
      window.open(url, '_blank');
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-accent font-serif text-xl italic">Galeria este goală.</p>
        <p className="text-accent/50 text-sm mt-2">Încarcă ceva frumos pentru a începe.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl" alt="Full" />
        </div>
      )}

      {isUpdating && (
        <div className="fixed top-4 right-4 z-50 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] uppercase tracking-widest">
          se salvează...
        </div>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items.map(i => i.public_id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {items.map((resource) => (
              <SortableItem 
                key={resource.public_id} 
                resource={resource} 
                onDelete={handleDelete}
                onDownload={handleDownload}
                onSelect={setSelectedImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
