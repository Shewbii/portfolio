"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AlbumOption = { id: string; title: string };

// Radix Select interdit une valeur vide sur un item : on utilise une sentinelle
// pour « Portfolio » qu'on retraduit en champ vide avant l'envoi.
const PORTFOLIO = "portfolio";

export default function Uploader({ albums }: { albums: AlbumOption[] }) {
  const [busy, setBusy] = useState(false);
  const [albumId, setAlbumId] = useState(PORTFOLIO);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    data.set("albumId", albumId === PORTFOLIO ? "" : albumId);
    setBusy(true);
    const toastId = toast.loading("Envoi en cours…");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      if (res.ok) {
        toast.success("Photo ajoutée.", { id: toastId });
        // on vide juste le fichier, on garde l'album sélectionné (upload en série)
        const fileInput = formEl.elements.namedItem(
          "files",
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
      } else {
        toast.error("Erreur lors de l’upload.", { id: toastId });
      }
    } catch {
      toast.error("Erreur réseau.", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Select value={albumId} onValueChange={setAlbumId}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PORTFOLIO}>Portfolio (page d’accueil)</SelectItem>
          {albums.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              Album : {a.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="file" name="files" accept="image/*" required multiple />
      <Button type="submit" disabled={busy}>
        Uploader
      </Button>
    </form>
  );
}
