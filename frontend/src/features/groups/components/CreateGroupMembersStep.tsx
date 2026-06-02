import React, { useState } from 'react'
import { z } from 'zod'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import type { GroupRole } from '@/types/group.types'

export interface PendingMember { email: string; role: GroupRole }

const ROLE_OPTIONS: { value: GroupRole; label: string }[] = [
  { value: 'ADMIN',     label: 'Admin' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'MEMBER',    label: 'Member' },
]

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email')

interface Props {
  members: PendingMember[]
  onChange: (members: PendingMember[]) => void
}

export const CreateGroupMembersStep: React.FC<Props> = ({ members, onChange }) => {
  const [emailInput, setEmailInput] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const add = () => {
    const email = emailInput.trim()
    const result = emailSchema.safeParse(email)
    if (!result.success) {
      setEmailError(result.error.errors[0]?.message ?? 'Enter a valid email')
      return
    }
    if (members.find(m => m.email === email)) {
      setEmailError('Email already added')
      return
    }
    setEmailError(null)
    onChange([...members, { email, role: 'MEMBER' }])
    setEmailInput('')
  }

  const remove = (email: string) => onChange(members.filter(m => m.email !== email))

  const updateRole = (email: string, role: GroupRole) =>
    onChange(members.map(m => m.email === email ? { ...m, role } : m))

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[13px] text-gray-500 dark:text-[#a3a1c8]">
        Invite members by email. They'll receive an invitation to accept or decline.
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          value={emailInput}
          onChange={e => {
            setEmailInput(e.target.value)
            if (emailError) setEmailError(null)
          }}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="member@email.com"
          className="flex-1 bg-gray-100/60 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-[10px] px-3.5 py-2.5 text-gray-900 dark:text-[#f0eeff] text-[13px] outline-none placeholder:text-gray-400"
        />
        <button
          onClick={add}
          disabled={!emailInput.trim()}
          className="grp-aurora inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border-none text-white text-[13px] font-semibold cursor-pointer disabled:opacity-50"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {emailError && (
        <p className="text-xs text-red-400 mt-1">
          {emailError}
        </p>
      )}

      {members.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-gray-400 dark:text-[#6e6c93]">No members added yet. You can skip this step.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map(m => (
            <div key={m.email} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-100/50 dark:bg-white/[0.03] rounded-[10px] border border-gray-200 dark:border-white/[0.07]">
              <span className="flex-1 text-[13px] text-gray-700 dark:text-[#d8d4ff] truncate">{m.email}</span>
              <div className="relative">
                <select
                  value={m.role}
                  onChange={e => updateRole(m.email, e.target.value as GroupRole)}
                  className="appearance-none bg-gray-200/50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] rounded-[7px] pl-2.5 pr-7 py-[5px] text-gray-500 dark:text-[#a3a1c8] text-xs cursor-pointer outline-none"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value} className="bg-white dark:bg-[#0f1120]">{r.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-[#6e6c93]" />
              </div>
              <button
                onClick={() => remove(m.email)}
                className="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent cursor-pointer grid place-items-center text-gray-400 hover:text-red-400 hover:bg-red-500/[0.1] transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
