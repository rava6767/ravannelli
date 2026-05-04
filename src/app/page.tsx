import { getResources } from '@/lib/cloudinary';
import Gallery from '@/components/Gallery';
import UploadButton from '@/components/UploadButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const resources = await getResources();

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-24 space-y-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-serif tracking-tight">
            Memories <span className="text-accent italic">&</span> Moments
          </h1>
          <p className="text-accent/60 font-sans max-w-md">
            A quiet space to preserve and share visual artifacts. 
            No accounts, just memories.
          </p>
        </div>
        
        <div className="flex items-center">
          <UploadButton />
        </div>
      </header>

      <section className="pt-8">
        <Gallery resources={resources} />
      </section>

      <footer className="pt-24 pb-12 text-center">
        <p className="text-accent/30 text-xs font-sans tracking-widest uppercase">
          Curated with elegance &bull; Private by link
        </p>
      </footer>
    </main>
  );
}

