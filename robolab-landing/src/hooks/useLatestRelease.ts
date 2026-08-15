import { useState, useEffect } from 'react'

export interface ReleaseInfo {
  version: string
  downloadUrl: string
  releaseUrl: string
  fileSize: string
  releaseDate: string
  fileName: string
  loading: boolean
}

const DEFAULT_RELEASE: ReleaseInfo = {
  version: 'v0.0.2',
  downloadUrl: 'https://github.com/Akhmad-Fadhlan/robolab/releases/download/v0.0.2/RoboLab.Studio.Setup.0.0.2.exe',
  releaseUrl: 'https://github.com/Akhmad-Fadhlan/robolab/releases/latest',
  fileSize: '124 MB',
  releaseDate: '15 Agustus 2026',
  fileName: 'RoboLab.Studio.Setup.0.0.2.exe',
  loading: false,
}

export function useLatestRelease(): ReleaseInfo & { triggerDownload: () => void } {
  const [release, setRelease] = useState<ReleaseInfo>({ ...DEFAULT_RELEASE, loading: true })

  useEffect(() => {
    let isMounted = true

    async function fetchRelease() {
      try {
        const res = await fetch('https://api.github.com/repos/Akhmad-Fadhlan/robolab/releases/latest')
        if (!res.ok) throw new Error('Failed to fetch release')
        const data = await res.json()

        const exeAsset = data.assets?.find((a: { name: string; browser_download_url: string }) =>
          a.name.toLowerCase().endsWith('.exe')
        ) || data.assets?.[0]

        const rawSize = exeAsset?.size || 130240500
        const sizeMb = (rawSize / (1024 * 1024)).toFixed(0) + ' MB'

        const dateObj = new Date(data.published_at || data.created_at || Date.now())
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })

        if (isMounted) {
          setRelease({
            version: data.tag_name || 'v0.0.2',
            downloadUrl: exeAsset?.browser_download_url || DEFAULT_RELEASE.downloadUrl,
            releaseUrl: data.html_url || DEFAULT_RELEASE.releaseUrl,
            fileSize: sizeMb,
            releaseDate: formattedDate,
            fileName: exeAsset?.name || DEFAULT_RELEASE.fileName,
            loading: false,
          })
        }
      } catch (err) {
        console.warn('Could not fetch latest release info, using default fallback.', err)
        if (isMounted) {
          setRelease({ ...DEFAULT_RELEASE, loading: false })
        }
      }
    }

    fetchRelease()
    return () => {
      isMounted = false
    }
  }, [])

  const triggerDownload = () => {
    if (release.downloadUrl) {
      window.location.href = release.downloadUrl
    }
  }

  return { ...release, triggerDownload }
}
