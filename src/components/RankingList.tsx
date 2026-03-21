import { useRef, useState } from 'react'
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import type { PollOption } from '../types'

interface RankingListProps {
  options: PollOption[]
  order: string[]
  onChange: (newOrder: string[]) => void
  disabled?: boolean
}

export default function RankingList({ options, order, onChange, disabled }: RankingListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dragNode = useRef<HTMLDivElement | null>(null)

  const getOption = (id: string) => options.find((o) => o.id === id)

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return
    const next = [...order]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index)
    dragNode.current = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    // Small delay so the ghost image shows the item before it becomes transparent
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = '0.4'
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIndex !== null && index !== dragIndex) {
      setDropIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      moveItem(dragIndex, index)
    }
    setDragIndex(null)
    setDropIndex(null)
  }

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = '1'
    dragNode.current = null
    setDragIndex(null)
    setDropIndex(null)
  }

  return (
    <div className="space-y-2">
      {order.map((optionId, index) => {
        const opt = getOption(optionId)
        if (!opt) return null

        const isDragging = dragIndex === index
        const isDropTarget = dropIndex === index && dragIndex !== index

        return (
          <div
            key={optionId}
            draggable={!disabled}
            onDragStart={!disabled ? (e) => handleDragStart(e, index) : undefined}
            onDragOver={!disabled ? (e) => handleDragOver(e, index) : undefined}
            onDrop={!disabled ? (e) => handleDrop(e, index) : undefined}
            onDragEnd={!disabled ? handleDragEnd : undefined}
            className={`flex items-center gap-3 rounded-2xl border bg-white dark:bg-gray-800 px-4 py-3 transition-all select-none ${
              isDragging
                ? 'border-primary-300 shadow-md opacity-40'
                : isDropTarget
                ? 'border-primary-400 ring-2 ring-primary-200 dark:ring-primary-800 shadow-sm'
                : 'border-gray-200 dark:border-gray-700'
            } ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {/* Rank badge */}
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
              index === 0
                ? 'bg-primary-500 text-white'
                : index === 1
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {index + 1}
            </div>

            {/* Drag handle */}
            {!disabled && (
              <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
            )}

            {/* Option text */}
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{opt.text}</span>

            {/* Arrow buttons */}
            {!disabled && (
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                  className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, index + 1)}
                  disabled={index === order.length - 1}
                  className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )
      })}

      {!disabled && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
          Drag items or use arrows to reorder &mdash; top = best
        </p>
      )}
    </div>
  )
}
