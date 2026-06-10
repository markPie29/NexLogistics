'use client'

import React from 'react'
import { useState, useRef, FC, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) handler()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, handler])
}

interface DropdownItem {
  name: string
  value?: string
  link?: string
}

interface AnimatedDropdownProps {
  items?: DropdownItem[]
  text?: string
  className?: string
  onSelect?: (value: string) => void
}

const DEMO: DropdownItem[] = [
  { name: 'Documentation', value: 'documentation', link: '#' },
  { name: 'Components', value: 'components', link: '#' },
  { name: 'Examples', value: 'examples', link: '#' },
  { name: 'GitHub', value: 'github', link: '#' },
]

export default function AnimatedDropdown({
  items = DEMO,
  text = 'Select Option',
  className,
  onSelect,
}: AnimatedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <OnClickOutside onClickOutside={() => setIsOpen(false)}>
      <div data-state={isOpen ? 'open' : 'closed'} className={cn('group relative inline-block', className)}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            'h-10 px-4 py-2',
          )}
        >
          <span>{text}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}>
            <ChevronDown className='h-5 w-5 ml-2' />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              role='listbox'
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'absolute top-[calc(100%+0.5rem)] left-0 z-50 w-full',
                'overflow-hidden rounded-md',
                'bg-slate-100 dark:bg-zinc-900',
                'border-2 border-slate-200 dark:border-zinc-800',
                'shadow-lg'
              )}
            >
              <motion.div initial='hidden' animate='visible' variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
                {items.map((item, index) => {
                  const itemValue = item.value ?? item.link ?? item.name
                  const handleClick = () => {
                    if (onSelect) onSelect(itemValue)
                    setIsOpen(false)
                  }

                  return (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={handleClick}
                      variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                      className={cn(
                        'inline-flex w-full items-center px-3 py-2 text-sm text-left',
                        'border-b-2 border-slate-200 last:border-b-0 dark:border-zinc-800',
                        'bg-slate-50 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800',
                        'transition-colors duration-150 text-foreground'
                      )}
                    >
                      {item.name}
                    </motion.button>
                  )
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OnClickOutside>
  )
}

interface Props {
  children: ReactNode
  onClickOutside: () => void
  classes?: string
}

const OnClickOutside: FC<Props> = ({ children, onClickOutside, classes }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, onClickOutside)

  return (
    <div ref={wrapperRef} className={cn(classes)}>
      {children}
    </div>
  )
}
