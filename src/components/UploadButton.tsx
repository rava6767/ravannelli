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
            className="group flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-full transition-all hover:opacity-90 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span className="font-sans font-medium">Upload Media</span>
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
