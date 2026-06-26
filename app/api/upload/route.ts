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
  const files = form.getAll("files") as File[];

  const result: { id: string }[] = [];

  files.forEach(async (file) => {
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    // Destination : un album précis, ou le portfolio si vide.
    const albumIdRaw = form.get("albumId");
    const albumId =
      typeof albumIdRaw === "string" && albumIdRaw.length > 0
        ? albumIdRaw
        : null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = randomUUID();

    // Étape 1/2 : tout l'upload se fait dans la requête (machine persistante, OK).
    // Quand les volumes grossiront, on déportera ça dans un worker dédié.
    const processed = await processUpload(buffer, storageKey);

    // Nouvelle photo placée en fin de liste de son contexte (album ou portfolio).
    const scope = albumId
      ? eq(photos.albumId, albumId)
      : eq(photos.isPortfolio, true);
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${photos.sortOrder}), -1)` })
      .from(photos)
      .where(scope);
    const sortOrder = Number(max) + 1;

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
        sortOrder,
      })
      .returning();
    result.push({ id: row.id });
  });

  return NextResponse.json(result);
}
