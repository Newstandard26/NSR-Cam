"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"

export function PhotoUploader({ projectId }: { projectId: string }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const router = useRouter()

  const onDrop = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      setUploading(true)
      setProgress({ done: 0, total: files.length })
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData()
        fd.append("photo", files[i])
        fd.append("project_id", projectId)
        await fetch("/api/photos", { method: "POST", body: fd })
        setProgress({ done: i + 1, total: files.length })
      }
      setUploading(false)
      router.refresh()
    },
    [projectId, router]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-brand-light bg-sky-50" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
      {uploading ? (
        <p className="text-sm text-gray-600">
          Uploading {progress.done}/{progress.total}...
        </p>
      ) : (
        <p className="text-sm text-gray-500">
          Drag photos here, or click to upload
        </p>
      )}
    </div>
  )
}
