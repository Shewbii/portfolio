import type { Metadata } from 'next'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { getSession } from '@/lib/auth'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Portfolio photographe',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className="bg-background text-foreground antialiased">
        <nav className="border-b border-neutral-100">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 text-sm">
            <Link href="/" className="hover:underline">
              Portfolio
            </Link>
            <Link href="/albums" className="hover:underline">
              Albums
            </Link>

            {session ? (
              <>
                <Link href="/mes-albums" className="ml-auto hover:underline">
                  Mes albums
                </Link>
                <form action={logout}>
                  <Button
                    type="submit"
                    variant="link"
                    className="h-auto p-0 text-muted-foreground"
                  >
                    Déconnexion
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/login" className="ml-auto hover:underline">
                Connexion
              </Link>
            )}
            <Link
              href="/admin"
              className="text-neutral-400 hover:underline"
            >
              Admin
            </Link>
          </div>
        </nav>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
