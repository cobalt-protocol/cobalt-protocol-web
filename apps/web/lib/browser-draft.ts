"use client"
import { useCallback, useMemo, useSyncExternalStore } from "react"

const draftEvent = "cobalt:draft-change"
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback)
  window.addEventListener(draftEvent, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(draftEvent, callback)
  }
}
function readSnapshot(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
const serverSnapshot = (): null => null
const clientReady = (): boolean => true
const serverReady = (): boolean => false
export function useBrowserDraft<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T
) {
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady)
  const snapshot = useSyncExternalStore(
    subscribe,
    useCallback(() => readSnapshot(key), [key]),
    serverSnapshot
  )
  const value = useMemo(() => {
    if (snapshot === null) return fallback
    try {
      const parsed: unknown = JSON.parse(snapshot)
      return isValid(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }, [snapshot, fallback, isValid])
  const save = useCallback(
    (next: T): boolean => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
        window.dispatchEvent(new Event(draftEvent))
        return true
      } catch {
        return false
      }
    },
    [key]
  )
  return { value, save, ready }
}
