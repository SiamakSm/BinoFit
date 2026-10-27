import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Fusionne des classes Tailwind en résolvant les conflits (utilisé par les composants shadcn-vue). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
