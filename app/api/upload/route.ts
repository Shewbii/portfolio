import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/lib/schema";
import { processUpload } from "@/lib/images";

// sharp + accès disque => runtime Node, pas Edge.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  // Destination : un album précis, ou le portfolio si vide.
  const albumIdRaw = form.get("albumId");
  const albumId =
    typeof albumIdRaw === "string" && albumIdRaw.length > 0 ? albumIdRaw : null;

  // sort_order de départ, calculé une seule fois puis incrémenté par photo.
  const scope = albumId
    ? eq(photos.albumId, albumId)
    : eq(photos.isPortfolio, true);
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${photos.sortOrder}), -1)` })
    .from(photos)
    .where(scope);
  let sortOrder = Number(max) + 1;

  // Séquentiel (for...of + await) : réponse renvoyée une fois TOUT traité,
  // pas de course sur sort_order, mémoire bornée (photos lourdes).
  const result: { id: string }[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = randomUUID();

    // Étape 1/2 : tout l'upload se fait dans la requête (machine persistante, OK).
    // Quand les volumes grossiront, on déportera ça dans un worker dédié.
    const processed = await processUpload(buffer, storageKey);

    const [row] = await db
      .insert(photos)
      .values({
        albumId,
        storageKey: processed.storageKey,
        width: processed.width,
        height: processed.height,
        blurDataUrl: processed.blurDataURL,
        originalFormat: processed.format,
        // une photo dans un album n'est pas dans le portfolio par défaut
        isPortfolio: albumId === null,
        sortOrder: sortOrder++,
      })
      .returning();
    result.push({ id: row.id });
  }

  return NextResponse.json(result);
}
