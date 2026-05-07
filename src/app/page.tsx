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

      <footer className="pt-24 pb-12 text-center flex flex-col gap-4">
        <p className="text-accent/10 text-[9px] font-sans tracking-[0.5em] uppercase">
          &bull; purtată mereu cu tine &bull;
        </p>
        <div className="flex justify-center opacity-5">
           <div className="w-8 h-[1px] bg-accent" />
        </div>
      </footer>
    </main>
  );
}

