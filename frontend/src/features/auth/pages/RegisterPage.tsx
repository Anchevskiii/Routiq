import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { ROUTES } from '@/constants/routes'

export const RegisterPage: React.FC = () => (
  <main className="relative min-h-screen overflow-hidden bg-[#f0f9ff] dark:bg-[#0c0b1a]">
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to={ROUTES.HOME} className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-aurora shadow-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7 2 4 5.5 4 10c0 6 8 12 8 12s8-6 8-12c0-4.5-3-8-8-8z" fill="white"/>
            <circle cx="12" cy="10" r="3" fill="#6366f1"/>
          </svg>
        </div>
        <span className="text-xl font-semibold tracking-tight text-ink">Routiq</span>
      </Link>
      <Link
        to={ROUTES.HOME}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-dim hover:text-ink transition-colors"
        title="Back to Home"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to Home</span>
      </Link>
    </header>

    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-20">
      <div className="relative w-full overflow-visible sm:overflow-hidden rounded-[1rem] sm:rounded-[2rem] border border-gray-200 dark:border-transparent shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)] dark:shadow-none min-h-[420px] sm:aspect-[16/10]">
        {/* Background map decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-indigo-50/40 to-violet-50/30">
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="rg-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#6366f1" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="1600" height="900" fill="url(#rg-grid)"/>
          </svg>
          <svg className="absolute inset-0 w-full h-full opacity-[0.18]" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <path d="M 105 180 C 200 162 320 168 405 192 L 430 200 C 478 210 480 230 475 245 C 445 250 430 245 425 252 C 442 268 440 305 395 332 L 380 348 C 362 378 330 410 305 452 C 288 472 290 488 296 502 L 305 505 C 320 502 332 510 332 522 C 318 538 295 530 282 525 C 252 525 210 488 158 408 C 112 305 100 230 105 180 Z" fill="#c7e0f4"/>
            <path d="M 625 295 L 790 295 C 825 295 832 308 838 322 C 855 332 895 320 912 338 L 910 352 C 870 380 868 398 862 412 C 830 422 790 400 770 420 C 738 430 720 408 700 415 C 700 432 678 442 685 455 L 700 462 C 712 470 708 492 695 492 C 668 480 632 458 600 405 C 598 370 605 322 625 295 Z" fill="#d8d4f7"/>
            <path d="M 815 200 C 940 182 1090 192 1240 215 C 1370 245 1465 290 1505 350 C 1500 410 1425 462 1370 460 C 1285 470 1248 515 1248 530 L 1265 580 C 1238 638 1210 565 1198 515 C 1135 482 1042 502 1022 540 C 1000 578 985 628 920 650 C 802 522 770 320 815 200 Z" fill="#fde2d3"/>
            <path d="M 668 470 C 775 465 855 510 880 568 L 905 605 C 868 640 868 675 845 700 L 812 752 L 775 772 C 728 740 678 705 662 515 Z" fill="#d8d4f7"/>
            <path d="M 310 540 C 378 538 422 612 412 690 C 392 728 350 765 322 775 C 310 718 288 622 310 540 Z" fill="#fde2d3"/>
            <path d="M 1335 660 C 1465 665 1500 710 1448 740 C 1365 735 1322 705 1322 690 Z" fill="#c7e0f4"/>
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative sm:absolute sm:inset-0 grid place-items-center"
        >
          <RegisterForm />
        </motion.div>
      </div>

      <div className="mt-6 text-center px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          Your next trip starts
          <br className="sm:hidden" />
          <em className="font-serif italic font-normal gradient-aurora-text"> right here.</em>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-dim text-sm sm:text-base">
          Create an account to build itineraries, drop pins, and explore the world.
        </p>
      </div>
    </section>
  </main>
)
