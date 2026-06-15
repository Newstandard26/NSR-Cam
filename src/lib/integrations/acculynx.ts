import { db } from "@/lib/db"

// AccuLynx REST API. Base URL and key are configurable via IntegrationSettings
// (Resources > Integrations). Defaults target AccuLynx's documented v2 API.
const DEFAULT_BASE_URL = "https://api.acculynx.com/api/v2"

export type AccuLynxJob = {
  id: string
  jobNumber?: string
  name?: string
  status?: string
  milestone?: string
  address?: {
    street1?: string
    street2?: string
    city?: string
    state?: string
    zip?: string
    latitude?: number
    longitude?: number
  }
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
}

// AccuLynx milestone/status -> NSR Cam project label name.
// Always also applies the "AccuLynx" integration badge.
const STATUS_LABEL_MAP: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospect",
  approved: "Approved",
  "job in production": "Approved",
  completed: "Completed",
  closed: "Completed",
  invoiced: "Completed",
}

const LABEL_COLORS: Record<string, string> = {
  Lead: "#F97316",
  Prospect: "#3B82F6",
  Approved: "#22C55E",
  Completed: "#6B7280",
  AccuLynx: "#8B5CF6",
}

export async function getAccuLynxSettings() {
  return db.integrationSettings.findUnique({ where: { provider: "acculynx" } })
}

export async function isAccuLynxEnabled() {
  const s = await getAccuLynxSettings()
  return Boolean(s?.enabled && s.apiKey)
}

export async function acculynxRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const settings = await getAccuLynxSettings()
  if (!settings?.apiKey) throw new Error("AccuLynx is not configured")

  const base = settings.baseUrl || DEFAULT_BASE_URL
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`AccuLynx ${method} ${path} failed: ${res.status} ${text}`)
  }
  return (await res.json()) as T
}

async function ensureLabel(name: string) {
  return db.label.upsert({
    where: { name },
    update: {},
    create: { name, color: LABEL_COLORS[name] ?? "#6B7280" },
  })
}

async function applyLabels(projectId: string, names: string[]) {
  for (const name of names) {
    const label = await ensureLabel(name)
    await db.projectLabel.upsert({
      where: { projectId_labelId: { projectId, labelId: label.id } },
      update: {},
      create: { projectId, labelId: label.id },
    })
  }
}

// Map an AccuLynx job into an NSR Cam project (create or update) and record the sync.
export async function syncJobToProject(job: AccuLynxJob) {
  const existing = await db.accuLynxSync.findUnique({
    where: { acculynxJobId: job.id },
    include: { project: true },
  })

  const data = {
    name: job.name || job.customer?.name || job.jobNumber || `AccuLynx ${job.id}`,
    street1: job.address?.street1 ?? null,
    street2: job.address?.street2 ?? null,
    city: job.address?.city ?? null,
    state: job.address?.state ?? null,
    postalCode: job.address?.zip ?? null,
    lat: job.address?.latitude ?? null,
    lng: job.address?.longitude ?? null,
  }

  let projectId: string

  if (existing) {
    await db.project.update({ where: { id: existing.projectId }, data })
    projectId = existing.projectId
    await db.accuLynxSync.update({
      where: { id: existing.id },
      data: { lastSyncedAt: new Date(), status: "synced", lastError: null },
    })
  } else {
    // Link or create a customer from job data
    let customerId: string | undefined
    if (job.customer?.name) {
      const customer = await db.customer.create({
        data: {
          name: job.customer.name,
          email: job.customer.email ?? null,
          phone: job.customer.phone ?? null,
        },
      })
      customerId = customer.id
    }

    const project = await db.project.create({ data: { ...data, customerId } })
    projectId = project.id
    await db.accuLynxSync.create({
      data: {
        acculynxJobId: job.id,
        projectId,
        syncDirection: "inbound",
        status: "synced",
        lastSyncedAt: new Date(),
      },
    })
  }

  // Status label + AccuLynx integration badge
  const statusKey = (job.milestone || job.status || "").toLowerCase().trim()
  const labels = ["AccuLynx"]
  if (STATUS_LABEL_MAP[statusKey]) labels.push(STATUS_LABEL_MAP[statusKey])
  await applyLabels(projectId, labels)

  return projectId
}

// Push a photo's public URL back to its linked AccuLynx job.
export async function pushPhotoToAccuLynx(photoId: string) {
  const photo = await db.photo.findUnique({
    where: { id: photoId },
    include: { project: { include: { acculynxSync: true } } },
  })
  if (!photo?.project.acculynxSync) return { skipped: true as const }

  const jobId = photo.project.acculynxSync.acculynxJobId
  await acculynxRequest("POST", `/jobs/${jobId}/photos`, {
    url: photo.uri,
    description: photo.description ?? undefined,
    capturedAt: photo.capturedAt.toISOString(),
  })
  return { skipped: false as const, jobId }
}
