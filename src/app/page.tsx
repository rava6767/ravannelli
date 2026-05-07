import { getResources } from '@/lib/cloudinary';
import Gallery from '@/components/Gallery';
import UploadButton from '@/components/UploadButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const resources = await getResources();

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-16 space-y-12">
      <header className="flex items-center justify-between border-b border-white/5 pb-6">
        <h1 className="text-2xl md:text-3xl font-serif tracking-widest lowercase opacity-80">
          dariuca
        </h1>
        
        <div className="flex items-center">
          <UploadButton />
        </div>
      </header>

      <section className="pt-4">
        <Gallery resources={resources} />
      </section>

      <footer className="pt-16 pb-8 text-center flex flex-col gap-2">
        <p className="text-accent/20 text-[10px] font-sans tracking-[0.3em] uppercase">
          &bull; memories &bull;
        </p>
        <p className="text-accent/5 text-[8px] uppercase tracking-widest">
          v2.1 updated just now
        </p>
      </footer>
    </main>
  );
}

