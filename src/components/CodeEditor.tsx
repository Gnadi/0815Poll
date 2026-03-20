import { useRef, useCallback } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lines = value.split('\n')
  const lineCount = Math.max(lines.length, 20)

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newValue = value.substring(0, start) + '    ' + value.substring(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4
      })
    }
  }, [value, onChange])

  const handleScroll = useCallback(() => {
    const ta = textareaRef.current
    const lineNumbers = ta?.parentElement?.querySelector('.line-numbers') as HTMLElement | null
    if (ta && lineNumbers) {
      lineNumbers.scrollTop = ta.scrollTop
    }
  }, [])

  return (
    <div className="flex h-full font-mono text-sm leading-[1.7]">
      {/* Line numbers */}
      <div
        className="line-numbers shrink-0 select-none overflow-hidden text-right pr-4 pl-4 py-4 text-gray-500 bg-[#1a1a2e]"
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="h-[1.7em]">{i + 1}</div>
        ))}
      </div>

      {/* Editor textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className="flex-1 bg-transparent text-[#e2e8f0] caret-white resize-none outline-none py-4 pr-4 overflow-auto whitespace-pre tab-[4]"
        style={{ tabSize: 4 }}
      />
    </div>
  )
}
