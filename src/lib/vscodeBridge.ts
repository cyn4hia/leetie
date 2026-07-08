/**
 * "Connect VS Code" bridge, no extension required: link a local file via the
 * File System Access API, open that same file in VS Code, and every save on
 * disk syncs into leetie (which can then run/submit it). Chromium-only.
 */

declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      types?: Array<{ description: string; accept: Record<string, string[]> }>
    }) => Promise<FileSystemFileHandle[]>
  }
}

export const bridgeSupported =
  typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function'

export async function pickFile(): Promise<FileSystemFileHandle | null> {
  if (!bridgeSupported) return null
  try {
    const [handle] = await window.showOpenFilePicker!({
      types: [
        {
          description: 'code',
          accept: { 'text/plain': ['.js', '.mjs', '.ts', '.py', '.txt'] },
        },
      ],
    })
    return handle ?? null
  } catch {
    return null // user cancelled the picker
  }
}

/**
 * Poll the linked file; fires immediately with current contents, then on
 * every change of lastModified. Returns a stop function.
 */
export function watchFile(
  handle: FileSystemFileHandle,
  onChange: (text: string) => void,
  onLost?: () => void,
): () => void {
  let lastModified = -1
  let stopped = false

  const tick = async () => {
    if (stopped) return
    try {
      const file = await handle.getFile()
      if (file.lastModified !== lastModified) {
        lastModified = file.lastModified
        onChange(await file.text())
      }
    } catch {
      stopped = true
      onLost?.()
      return
    }
    setTimeout(tick, 900)
  }
  void tick()

  return () => {
    stopped = true
  }
}

export async function writeToFile(
  handle: FileSystemFileHandle,
  contents: string,
): Promise<boolean> {
  try {
    const writable = await handle.createWritable()
    await writable.write(contents)
    await writable.close()
    return true
  } catch {
    return false
  }
}
