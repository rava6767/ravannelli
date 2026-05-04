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
  TouchSensor,
  MouseSensor,
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
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? 1.02 : 1,
  };

  // Detectăm formatul pentru a decide mărimea celulei
  const isWide = resource.width > resource.height * 1.3;
  const isTall = resource.height > resource.width * 1.3;
  
  const gridClasses = `
    relative overflow-hidden rounded-sm bg-neutral-900/10 border border-white/[0.03] 
    hover:border-white/10 transition-all duration-500 group
    ${isWide ? 'sm:col-span-2' : ''}
    ${isTall ? 'sm:row-span-2' : ''}
  `;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={gridClasses}
    >
      {/* Drag Handle - Activează mutarea la apăsare lungă */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute inset-0 z-10 touch-none"
      />

      {/* Action Buttons - Apar la click (pe mobil/desktop) sau hover (desktop) */}
      <div className={`absolute inset-0 z-20 flex items-center justify-center gap-4 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${showActions || isDragging ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100 pointer-events-none sm:pointer-events-auto'}`}>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onSelect(resource.secure_url);
            setShowActions(false);
          }}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md border border-white/20 transition-transform active:scale-90"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onDownload(resource.secure_url, `${resource.public_id}.${resource.format}`);
            setShowActions(false);
          }}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md border border-white/20 transition-transform active:scale-90"
        >
          <Download className="w-5 h-5" />
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onDelete(resource.public_id);
            setShowActions(false);
          }}
          className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full text-white backdrop-blur-md border border-red-500/20 transition-transform active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Buton pentru a închide meniul pe mobil */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
          className="absolute top-2 right-2 p-1 text-white/50 sm:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div 
        className="relative w-full h-full"
        onClick={() => setShowActions(!showActions)}
      >
        {resource.resource_type === 'image' ? (
          <CldImage
            width={resource.width}
            height={resource.height}
            src={resource.public_id}
            alt="Gallery"
            className="w-full h-full object-contain bg-neutral-900/50 transition-all duration-700"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="relative w-full h-full bg-black/40 flex items-center justify-center overflow-hidden">
             <video src={resource.secure_url} className="w-full h-full object-contain" muted loop onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => e.currentTarget.pause()} />
             <Play className="absolute w-6 h-6 text-white/50 fill-current" />
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
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300, // Timp mediu, echilibrat
        tolerance: 8,
      },
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
        <SortableContext items={items.map(i => i.public_id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 auto-rows-[160px] sm:auto-rows-[220px] grid-flow-dense">
            {items.map((resource, index) => (
              <SortableItem key={resource.public_id} resource={resource} index={index} onDelete={handleDelete} onDownload={handleDownload} onSelect={setSelectedImage} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
