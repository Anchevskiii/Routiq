import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Image as ImageIcon } from 'lucide-react'

export const THEME_COLORS = ['#3b82f6', '#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

const infoSchema = z.object({
  name:        z.string().min(2, 'Group name must be at least 2 characters').max(100, 'Max 100 characters'),
  description: z.string().max(500, 'Max 500 characters').optional(),
})

export type InfoValues = z.infer<typeof infoSchema>

export interface InfoStepResult {
  name: string
  description?: string
  themeColor: string
  file: File | null
}

interface Props {
  formId: string
  onNext: (result: InfoStepResult) => void
}

export const CreateGroupInfoStep: React.FC<Props> = ({ formId, onNext }) => {
  const [themeColor, setThemeColor]   = useState('#3b82f6')
  const [file, setFile]               = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  return (
    <form id={formId} onSubmit={handleSubmit(v => onNext({ ...v, themeColor, file }))} className="flex flex-col gap-[18px]">
      {/* Circular image upload */}
      <div className="flex justify-center">
        <label className="relative cursor-pointer">
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <div className={`w-[90px] h-[90px] rounded-full overflow-hidden grid place-items-center ${previewUrl ? 'border-[3px] border-blue-500/40' : 'bg-gray-100 dark:bg-white/[0.04] border-2 border-dashed border-gray-300 dark:border-white/[0.2]'}`}>
            {previewUrl
              ? <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              : <div className="text-center"><ImageIcon size={22} className="text-gray-400 mx-auto" /><span className="text-[10px] text-gray-400 mt-1 block">Upload</span></div>
            }
          </div>
        </label>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-400 dark:text-[#6e6c93] uppercase tracking-widest mb-2">Group Name *</label>
        <input
          {...register('name')}
          placeholder="e.g. Tokyo Crew"
          className="w-full bg-gray-100/60 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-[10px] px-3.5 py-2.5 text-gray-900 dark:text-[#f0eeff] text-[13px] outline-none placeholder:text-gray-400 focus:border-blue-500/40 transition-colors"
        />
        {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-400 dark:text-[#6e6c93] uppercase tracking-widest mb-2">Description</label>
        <textarea
          {...register('description')}
          placeholder="Where are you going? What's the plan?"
          rows={3}
          className="w-full bg-gray-100/60 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-[10px] px-3.5 py-2.5 text-gray-900 dark:text-[#f0eeff] text-[13px] outline-none resize-none placeholder:text-gray-400 focus:border-blue-500/40 transition-colors"
        />
        {errors.description && <p className="mt-1.5 text-xs text-red-400">{errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-400 dark:text-[#6e6c93] uppercase tracking-widest mb-2">Theme Color</label>
        <div className="flex gap-2.5">
          {THEME_COLORS.map(c => (
            <button
              key={c} type="button"
              onClick={() => setThemeColor(c)}
              className="w-8 h-8 rounded-full cursor-pointer outline-none transition-all"
              style={{ backgroundColor: c, border: themeColor === c ? '3px solid white' : '3px solid transparent' }}
            />
          ))}
        </div>
      </div>
    </form>
  )
}
