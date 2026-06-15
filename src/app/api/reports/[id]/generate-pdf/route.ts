import { NextRequest, NextResponse } from "next/server"
import { createElement as h } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { uploadFile } from "@/lib/supabase"
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  header: { fontSize: 20, marginBottom: 4, color: "#111827" },
  sub: { fontSize: 11, color: "#6b7280", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "48%", margin: "1%" },
  img: { width: "100%", height: 160, objectFit: "cover", borderRadius: 4 },
  cap: { fontSize: 9, color: "#6b7280", marginTop: 2 },
})

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const report = await db.report.findUnique({
    where: { id },
    include: { project: true, photoItems: { orderBy: { order: "asc" } } },
  })
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const photoIds = report.photoItems.map((p) => p.photoId)
  const photos = await db.photo.findMany({ where: { id: { in: photoIds } } })

  const addr = [report.project.street1, report.project.city, report.project.state, report.project.postalCode]
    .filter(Boolean)
    .join(", ")

  const doc = h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Text, { style: styles.header }, report.name),
      h(Text, { style: styles.sub }, `${report.project.name}${addr ? " — " + addr : ""}`),
      h(
        View,
        { style: styles.grid },
        ...photos.map((p) =>
          h(
            View,
            { key: p.id, style: styles.cell, wrap: false },
            h(Image, { src: p.uri, style: styles.img }),
            h(Text, { style: styles.cap }, new Date(p.capturedAt).toLocaleString())
          )
        )
      )
    )
  )

  const buffer = await renderToBuffer(doc as any)
  const key = `reports/${report.id}.pdf`
  const { uri } = await uploadFile("nsr-cam", key, buffer as unknown as Buffer, "application/pdf")

  await db.report.update({ where: { id }, data: { pdfKey: key, pdfUri: uri } })
  return NextResponse.json({ pdfUri: uri })
}
