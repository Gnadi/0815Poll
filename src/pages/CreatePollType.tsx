import { useNavigate } from 'react-router-dom'
import { BarChart2, Calendar, MapPin, Sliders, ChevronRight } from 'lucide-react'
import Layout from '../components/Layout'

const pollTypes = [
  {
    type: 'standard',
    icon: BarChart2,
    title: 'Standard Poll',
    description: 'Gather opinions on any topic with simple multiple choice options.',
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    btnText: 'Select Standard',
    btnClass: 'bg-primary-500 text-white',
    route: '/create/standard',
  },
  {
    type: 'schedule',
    icon: Calendar,
    title: 'Schedule Poll',
    description: 'Find the best time for your group to meet or hold an event.',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    btnText: 'Select Schedule',
    btnClass: 'bg-white border border-gray-200 text-gray-700',
    route: '/create/schedule',
  },
  {
    type: 'location',
    icon: MapPin,
    title: 'Location Poll',
    description: 'Let participants vote on the best venue or meeting spot.',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    btnText: 'Select Location',
    btnClass: 'bg-white border border-gray-200 text-gray-700',
    route: '/create/location',
  },
  {
    type: 'custom',
    icon: Sliders,
    title: 'Custom Poll',
    description: 'Build your own poll format with a rich text sandbox editor.',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
    btnText: 'Select Custom',
    btnClass: 'bg-white border border-gray-200 text-gray-700',
    route: '/create/custom',
  },
]

export default function CreatePollType() {
  const navigate = useNavigate()

  return (
    <Layout title="Create New Poll" showBack>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Choose a poll format</h2>
        <p className="mt-1 text-sm text-gray-500">Pick the type of poll that best fits your needs.</p>
      </div>

      <div className="space-y-4">
        {pollTypes.map((pt) => {
          const Icon = pt.icon
          return (
            <div key={pt.type} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className={`rounded-xl p-3 ${pt.color}`}>
                  <Icon className={`h-6 w-6 ${pt.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{pt.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{pt.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(pt.route)}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${pt.btnClass} hover:opacity-90`}
              >
                {pt.btnText}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
