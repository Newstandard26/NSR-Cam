import { CameraCapture } from "@/components/camera/camera-capture"

export const dynamic = "force-dynamic"

export default function CameraPage() {
  return (
    <div className="h-full flex flex-col">
      <CameraCapture />
    </div>
  )
}
