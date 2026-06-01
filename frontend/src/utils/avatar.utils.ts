export const AVATAR_GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-amber-400 to-red-500',
  'from-purple-500 to-pink-500',
  'from-cyan-400 to-emerald-500',
  'from-pink-500 to-purple-500',
  'from-yellow-400 to-orange-500',
]

export function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export function avatarGrad(name: string): string {
  return AVATAR_GRADIENTS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_GRADIENTS.length]
}
