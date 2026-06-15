import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export { getSupabaseClient as supabase, getServerSupabase }

async function ensureBucket(client: ReturnType<typeof getServerSupabase>, bucket: string) {
  const { data } = await client.storage.getBucket(bucket)
  if (!data) {
    await client.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: "50MB",
    })
  }
}

export async function uploadFile(
  bucket: string,
  key: string,
  file: File | Buffer,
  contentType?: string
) {
  const client = getServerSupabase()
  let { data, error } = await client.storage
    .from(bucket)
    .upload(key, file, { contentType, upsert: true })

  // Auto-create the bucket on first use, then retry once.
  if (error && /bucket not found/i.test(error.message)) {
    await ensureBucket(client, bucket)
    ;({ data, error } = await client.storage
      .from(bucket)
      .upload(key, file, { contentType, upsert: true }))
  }

  if (error) throw error
  const { data: url } = client.storage.from(bucket).getPublicUrl(key!)
  return { key: data!.path, uri: url.publicUrl }
}

export async function deleteFile(bucket: string, key: string) {
  const client = getServerSupabase()
  const { error } = await client.storage.from(bucket).remove([key])
  if (error) throw error
}
