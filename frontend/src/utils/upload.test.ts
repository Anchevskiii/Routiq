import { vi, describe, it, expect } from 'vitest'
import { uploadGroupImage } from './upload'
import { supabase } from '@/api/supabase'

vi.mock('@/api/supabase', () => {
  return {
    supabase: {
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      },
    },
  }
})

describe('uploadGroupImage', () => {
  it('should upload group image and return public url', async () => {
    const mockFile = new File(['image-data'], 'image.png', { type: 'image/png' })
    
    vi.mocked(supabase.storage.upload).mockResolvedValue({ data: {}, error: null })
    vi.mocked(supabase.storage.getPublicUrl).mockReturnValue({
      data: { publicUrl: 'https://supabase.co/storage/v1/object/public/group-images/groups/test.png' }
    } as any)

    const url = await uploadGroupImage(mockFile)
    expect(url).toBe('https://supabase.co/storage/v1/object/public/group-images/groups/test.png')
    expect(supabase.storage.from).toHaveBeenCalledWith('group-images')
    expect(supabase.storage.upload).toHaveBeenCalled()
    expect(supabase.storage.getPublicUrl).toHaveBeenCalled()
  })

  it('should throw uploadError if upload fails', async () => {
    const mockFile = new File(['image-data'], 'image.png', { type: 'image/png' })
    const mockError = new Error('Upload error')
    vi.mocked(supabase.storage.upload).mockResolvedValue({ data: null, error: mockError as any })

    await expect(uploadGroupImage(mockFile)).rejects.toThrow('Upload error')
  })
})
