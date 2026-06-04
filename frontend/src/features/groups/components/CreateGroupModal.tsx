import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { CreateGroupInfoStep, type InfoStepResult } from './CreateGroupInfoStep'
import { CreateGroupMembersStep, type PendingMember } from './CreateGroupMembersStep'
import { CreateGroupItinerariesStep } from './CreateGroupItinerariesStep'

type Step = 'info' | 'members' | 'itineraries'
const STEP_LABELS: Record<Step, string> = { info: 'Info', members: 'Members', itineraries: 'Itineraries' }
const STEPS: Step[] = ['info', 'members', 'itineraries']

interface Props { onClose: () => void }

export const CreateGroupModal: React.FC<Props> = ({ onClose }) => {
  const queryClient = useQueryClient()
  const [step, setStep]               = useState<Step>('info')
  const [info, setInfo]               = useState<InfoStepResult | null>(null)
  const [members, setMembers]         = useState<PendingMember[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const createMutation = useMutation({
    mutationFn: async () => {
  if (!info) return

  const formData = new FormData()
  formData.append('name', info.name)
  if (info.description) formData.append('description', info.description)
  if (info.themeColor) formData.append('themeColor', info.themeColor)
  if (info.file) formData.append('image', info.file)  // file sent with creation

  const group = await groupsApi.createGroup(formData)  // send as FormData

  await Promise.allSettled([
    ...members.map(m => groupsApi.inviteMember(group.id, m.email)),
    ...[...selectedIds].map(id => groupsApi.addItineraryToGroup(group.id, id)),
  ])
},
    onSuccess: () => {
      toast.success('Group created!')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups })
      onClose()
    },
    onError: () => toast.error('Failed to create group'),
  })

  const toggle = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0f1120] border border-gray-200 dark:border-white/[0.1] rounded-3xl w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)]">

        <div className="px-6 pt-5 pb-4 flex items-start gap-3 border-b border-gray-200 dark:border-white/[0.07]">
          <div className="flex-1">
            <h2 className="m-0 text-[18px] font-semibold text-gray-900 dark:text-[#f0eeff]">Create Group</h2>
            <div className="flex gap-2 mt-2 items-center">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && <div className="w-5 h-px bg-gray-200 dark:bg-white/[0.15]" />}
                  <span className={`text-[11px] font-mono ${step === s ? 'text-blue-600 font-semibold' : 'text-gray-400 dark:text-[#6e6c93]'}`}>
                    {i + 1}. {STEP_LABELS[s]}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[10px] border-none bg-gray-100 dark:bg-white/[0.05] text-gray-400 cursor-pointer grid place-items-center hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'info'        && <CreateGroupInfoStep formId="grp-info" onNext={v => { setInfo(v); setStep('members') }} />}
          {step === 'members'     && <CreateGroupMembersStep members={members} onChange={setMembers} />}
          {step === 'itineraries' && <CreateGroupItinerariesStep selectedIds={selectedIds} onToggle={toggle} />}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.07] flex items-center justify-between gap-2.5">
          <span className="text-xs text-gray-400 dark:text-[#6e6c93]">
            {step === 'members'     && `${members.length} member${members.length !== 1 ? 's' : ''} added`}
            {step === 'itineraries' && `${selectedIds.size} itinerar${selectedIds.size !== 1 ? 'ies' : 'y'} selected`}
          </span>
          <div className="flex gap-2">
            {stepIdx > 0 && (
              <button onClick={() => setStep(STEPS[stepIdx - 1])} className="px-4 py-[9px] rounded-[10px] border border-gray-200 dark:border-white/[0.1] bg-gray-100/50 dark:bg-white/[0.03] text-gray-500 dark:text-[#a3a1c8] text-[13px] font-medium cursor-pointer hover:bg-gray-200/50 dark:hover:bg-white/[0.06] transition-colors">
                Back
              </button>
            )}
            {step === 'info' && (
              <button type="submit" form="grp-info" className="grp-aurora px-5 py-[9px] rounded-[10px] border-none text-white text-[13px] font-semibold cursor-pointer">
                Next →
              </button>
            )}
            {step === 'members' && (
              <button onClick={() => setStep('itineraries')} className="grp-aurora px-5 py-[9px] rounded-[10px] border-none text-white text-[13px] font-semibold cursor-pointer">
                Next →
              </button>
            )}
            {step === 'itineraries' && (
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="grp-aurora px-5 py-[9px] rounded-[10px] border-none text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60">
                {createMutation.isPending ? 'Creating…' : 'Create Group'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
