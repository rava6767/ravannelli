'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadButton() {
  const router = useRouter();

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      onSuccess={() => {
        // Refresh the page to show the new upload
        router.refresh();
      }}
      options={{
        sources: ['local', 'camera'],
        multiple: true,
        tags: ['dariuca'], // Adăugăm automat tag-ul pentru a le filtra
        styles: {
          palette: {
            window: '#050505',
            sourceBg: '#050505',
            windowBorder: '#262626',
            tabIcon: '#FFFFFF',
            inactiveTabIcon: '#A3A3A3',
            menuIcons: '#FFFFFF',
            link: '#A3A3A3',
            action: '#FFFFFF',
            inProgress: '#404040',
            complete: '#525252',
            error: '#991B1B',
            textDark: '#000000',
            textLight: '#FFFFFF'
          },
          fonts: {
            default: null,
            "'Inter', sans-serif": {
              url: 'https://fonts.googleapis.com/css?family=Inter',
              active: true
            }
          }
        }
      }}
    >
      {({ open }) => {
        return (
          <button
            onClick={() => open()}
            className="group flex items-center gap-2 px-5 py-2 bg-transparent text-accent/40 border border-accent/10 rounded-full transition-all hover:text-foreground hover:border-foreground/20 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="font-sans text-[11px] font-light tracking-[0.1em] uppercase">pozica</span>
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
