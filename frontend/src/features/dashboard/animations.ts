export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
