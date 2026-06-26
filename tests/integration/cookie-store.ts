// Faux magasin de cookies partagé entre le mock de `next/headers` et les tests.
const map = new Map<string, string>()

export const cookieStore = {
  get(name: string) {
    const value = map.get(name)
    return value === undefined ? undefined : { name, value }
  },
  set(name: string, value: string) {
    map.set(name, value)
  },
  delete(name: string) {
    map.delete(name)
  },
}

export function clearCookies() {
  map.clear()
}

export function setRawCookie(name: string, value: string) {
  map.set(name, value)
}
