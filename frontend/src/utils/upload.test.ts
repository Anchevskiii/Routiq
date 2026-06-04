import { vi, describe, it, expect } from 'vitest'
import { uploadGroupImage } from './upload'
import { supabase } from '@/api/supabase'

vi.mock('@/api/supabase', () => {
  return {
    supabase: {
      storage: {
        from: vi.fn(),
      },
    },
  }
})

describe('uploadGroupImage', () => {
  it('should upload group image and return public url', async () => {
    const mockFile = new File(['image-data'], 'image.png', { type: 'image/png' })
    
    const mockUpload = vi.fn().mockResolvedValue({ data: {}, error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://supabase.co/storage/v1/object/public/group-images/groups/test.png' }
    })

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    } as unknown as ReturnType<typeof supabase.storage.from>)

    const url = await uploadGroupImage(mockFile)
    expect(url).toBe('https://supabase.co/storage/v1/object/public/group-images/groups/test.png')
    expect(supabase.storage.from).toHaveBeenCalledWith('group-images')
    expect(mockUpload).toHaveBeenCalled()
    expect(mockGetPublicUrl).toHaveBeenCalled()
  })

  it('should throw uploadError if upload fails', async () => {
    const mockFile = new File(['image-data'], 'image.png', { type: 'image/png' })
    const mockError = new Error('Upload error')
    
    const mockUpload = vi.fn().mockResolvedValue({ data: null, error: mockError })
    const mockGetPublicUrl = vi.fn()

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    } as unknown as ReturnType<typeof supabase.storage.from>)

    await expect(uploadGroupImage(mockFile)).rejects.toThrow('Upload error')
  })
})

