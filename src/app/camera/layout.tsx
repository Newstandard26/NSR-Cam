export default function CameraLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 bg-black overflow-hidden z-50">{children}</div>
}
