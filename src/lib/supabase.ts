import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function uploadFile(
  bucket: string,
  key: string,
  file: File | Buffer,
  contentType?: string
) {
  const client = getServerSupabase()
  const { data, error } = await client.storage
    .from(bucket)
    .upload(key, file, { contentType, upsert: true })
  if (error) throw error
  const { data: url } = client.storage.from(bucket).getPublicUrl(key)
  return { key: data.path, uri: url.publicUrl }
}

export async function deleteFile(bucket: string, key: string) {
  const client = getServerSupabase()
  const { error } = await client.storage.from(bucket).remove([key])
  if (error) throw error
}
