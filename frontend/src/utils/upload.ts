import { supabase } from '@/api/supabase'

export const uploadGroupImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `groups/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('group-images')
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage
    .from('group-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}