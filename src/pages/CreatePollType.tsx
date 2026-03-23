import { useNavigate } from 'react-router-dom'
import { BarChart2, Calendar, MapPin, Sliders, GripVertical, ChevronRight, Target, Image } from 'lucide-react'
import Layout from '../components/Layout'

const pollTypes = [
  {
    type: 'standard',
    icon: BarChart2,
    title: 'Standard Poll',
    description: 'Classic multiple choice options. Best for quick feedback and simple opinions.',
    color: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    route: '/create/standard',
  },
  {
    type: 'ranking',
    icon: GripVertical,
    title: 'Ranking Poll',
    description: 'Participants rank options by preference via drag & drop. Aggregated with Borda Count.',
    color: 'bg-rose-50 dark:bg-rose-900/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    route: '/create/ranking',
  },
  {
    type: 'schedule',
    icon: Calendar,
    title: 'Schedule Meeting',
    description: 'Find the best date and time that works for everyone in your group.',
    color: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    route: '/create/schedule',
  },
  {
    type: 'location',
    icon: MapPin,
    title: 'Pick a Location',
    description: 'Suggest venues or integration with maps to decide where to meet up.',
    color: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    route: '/create/location',
  },
  {
    type: 'custom',
    icon: Sliders,
    title: 'Custom Poll',
    description: 'Build your own poll format with a rich text sandbox editor.',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    route: '/create/custom',
  },
  {
    type: 'priority',
    icon: Target,
    title: 'Priority Vote',
    description: 'Distribute points across options to rank by importance. Perfect for feature roadmaps and team decisions.',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    route: '/create/priority',
  },
  {
    type: 'image',
    icon: Image,
    title: 'Image Vote',
    description: 'Upload photos as options and let your audience vote for their favorite.',
    color: 'bg-pink-50 dark:bg-pink-900/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
    route: '/create/image',
  },
]

export default function CreatePollType() {
  const navigate = useNavigate()

  return (
    <Layout title="Create New Poll" showBack>
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white lg:text-2xl">Select your poll type</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 lg:text-base">Select the best format for your audience. From simple questions to finding the perfect meeting spot.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {pollTypes.map((pt) => {
          const Icon = pt.icon
          return (
            <button
              key={pt.type}
              type="button"
              onClick={() => navigate(pt.route)}
              className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all group lg:p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`rounded-xl p-3 ${pt.color}`}>
                  <Icon className={`h-6 w-6 ${pt.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white lg:text-lg">{pt.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{pt.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                <span>Select</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          )
        })}
      </div>
    </Layout>
  )
}
