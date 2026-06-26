import Image from "next/image";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { photos } from "@/lib/schema";

// La vitrine lit la base à chaque requête (pas de génération statique au build).
export const dynamic = "force-dynamic";

export default async function Home() {
  const portfolio = await db
    .select()
    .from(photos)
    .where(eq(photos.isPortfolio, true))
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-light tracking-tight">Alexis JEANNE</h1>
        <p className="text-neutral-500">Portfolio</p>
      </header>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {portfolio.map((p) => (
          <Image
            key={p.id}
            src={`/images/${p.storageKey}/web.webp`}
            alt=""
            width={p.width}
            height={p.height}
            placeholder="blur"
            blurDataURL={p.blurDataUrl}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full rounded-lg"
          />
        ))}
      </div>
    </main>
  );
}
