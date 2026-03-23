import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, QrCode } from 'lucide-react'

interface PollQRCodeProps {
  pollId: string
  size?: number
}

export default function PollQRCode({ pollId, size = 160 }: PollQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pollUrl = `${window.location.origin}/poll/${pollId}`

  const download = () => {
    // Find the canvas rendered by QRCodeCanvas
    const canvas = document.querySelector<HTMLCanvasElement>(`#qr-${pollId}`)
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `poll-${pollId}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 self-start">
        <QrCode className="h-4 w-4 text-primary-500" />
        <span className="text-sm font-bold text-gray-800">QR Code</span>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col items-center gap-3">
        <QRCodeCanvas
          id={`qr-${pollId}`}
          value={pollUrl}
          size={size}
          marginSize={1}
          level="M"
          ref={canvasRef}
        />
        <p className="text-xs text-gray-400 text-center">Scan to open poll</p>
        <button
          type="button"
          onClick={download}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download PNG
        </button>
      </div>
    </div>
  )
}
