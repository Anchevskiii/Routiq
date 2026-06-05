import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useOnClickOutside } from './useOnClickOutside'

describe('useOnClickOutside', () => {
  let container: HTMLDivElement
  let insideElement: HTMLButtonElement
  let outsideElement: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    insideElement = document.createElement('button')
    outsideElement = document.createElement('div')
    
    container.appendChild(insideElement)
    document.body.appendChild(container)
    document.body.appendChild(outsideElement)
  })

  it('should call handler when clicked outside', () => {
    const handler = vi.fn()
    const ref = { current: container }

    renderHook(() => useOnClickOutside(ref, handler))

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when clicked inside', () => {
    const handler = vi.fn()
    const ref = { current: container }

    renderHook(() => useOnClickOutside(ref, handler))

    const event = new MouseEvent('mousedown', { bubbles: true })
    insideElement.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should call handler when touched outside', () => {
    const handler = vi.fn()
    const ref = { current: container }

    renderHook(() => useOnClickOutside(ref, handler))

    const event = new TouchEvent('touchstart', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should handle null ref current gracefully', () => {
    const handler = vi.fn()
    const ref = { current: null }

    renderHook(() => useOnClickOutside(ref, handler))

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })
})
