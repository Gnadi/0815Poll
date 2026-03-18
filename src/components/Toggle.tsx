interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
}

export default function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between text-left"
    >
      <span>
        {label && <span className="block text-sm font-medium text-gray-800">{label}</span>}
        {description && <span className="block text-xs text-gray-500">{description}</span>}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-primary-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}
