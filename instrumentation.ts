export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { loadFingerCache } = await import("@/lib/server/finger-cache")
  await loadFingerCache()
}
