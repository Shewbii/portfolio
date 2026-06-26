"use client";

import { useState } from "react";

type AlbumOption = { id: string; title: string };

export default function Uploader({ albums }: { albums: AlbumOption[] }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    setBusy(true);
    setStatus("Envoi en cours…");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      setStatus(res.ok ? "Photo ajoutée." : "Erreur lors de l’upload.");
      if (res.ok) {
        // on vide juste le fichier, on garde l'album sélectionné (upload en série)
        const fileInput = formEl.elements.namedItem(
          "file",
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
      }
    } catch {
      setStatus("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <select
        name="albumId"
        defaultValue=""
        className="block w-full rounded border border-neutral-300 px-3 py-2 text-sm"
      >
        <option value="">Portfolio (page d’accueil)</option>
        {albums.map((a) => (
          <option key={a.id} value={a.id}>
            Album : {a.title}
          </option>
        ))}
      </select>
      <input
        type="file"
        name="files"
        accept="image/*"
        required
        className="block w-full text-sm"
        multiple
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Uploader
      </button>
      <p className="text-sm text-neutral-500">{status}</p>
    </form>
  );
}
