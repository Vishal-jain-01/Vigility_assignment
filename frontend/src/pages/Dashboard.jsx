import React, { useState, useEffect, useCallback, useRef } from 'react'
import Cookies from 'js-cookie'
import { useAuth } from '../context/AuthContext'
import { getAnalytics, track } from '../utils/api'
import Navbar from '../components/Navbar'
import Filters from '../components/Filters'
import FeatureBarChart from '../components/FeatureBarChart'
import TimeLineChart from '../components/TimeLineChart'

const DEFAULT_FILTERS = {
  startDate: '',
  endDate: '',
  ageGroup: 'All',
  gender: 'All'
}

export default function Dashboard() {
  const { user } = useAuth()


  const FILTER_COOKIE_KEY = `vigility_filters_${user?.id || 'guest'}`


  const [filters, setFilters] = useState(() => {
    try {
      const saved = Cookies.get(`vigility_filters_${user?.id || 'guest'}`)
      return saved ? JSON.parse(saved) : DEFAULT_FILTERS
    } catch {
      return DEFAULT_FILTERS
    }
  })

  const [selectedFeature, setSelectedFeature] = useState(null)
  const [barChartData, setBarChartData] = useState([])
  const [lineChartData, setLineChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const lineHoverTracked = useRef(false)


  useEffect(() => {
    lineHoverTracked.current = false
  }, [selectedFeature])


  const fetchAnalytics = useCallback(async (currentFilters, feature) => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (currentFilters.startDate) params.startDate = currentFilters.startDate
      if (currentFilters.endDate) params.endDate = currentFilters.endDate
      if (currentFilters.ageGroup !== 'All') params.ageGroup = currentFilters.ageGroup
      if (currentFilters.gender !== 'All') params.gender = currentFilters.gender
      if (feature) params.feature = feature

      const res = await getAnalytics(params)
      setBarChartData(res.data.barChartData || [])
      setLineChartData(res.data.lineChartData || [])
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Failed to fetch analytics. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    fetchAnalytics(filters, selectedFeature)
  }, [filters, selectedFeature, fetchAnalytics])


  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value }

      Cookies.set(FILTER_COOKIE_KEY, JSON.stringify(newFilters), { expires: 7 })
      return newFilters
    })


    const trackMap = {
      startDate: 'date_filter',
      endDate: 'date_filter',
      ageGroup: 'age_filter',
      gender: 'gender_filter'
    }
    if (trackMap[field]) {
      track(trackMap[field]).catch(() => {})
    }
  }, [])

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    Cookies.set(FILTER_COOKIE_KEY, JSON.stringify(DEFAULT_FILTERS), { expires: 7 })
  }, [FILTER_COOKIE_KEY])


  const handleBarClick = useCallback((featureName) => {
    setSelectedFeature(featureName)
    track('bar_chart_zoom').catch(() => {})
  }, [])


  const handleLineChartHover = useCallback(() => {
    if (!lineHoverTracked.current) {
      lineHoverTracked.current = true
      track('line_chart_hover').catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back,{' '}
            <span className="text-blue-400 font-medium">{user?.username}</span>.{' '}
            This dashboard visualizes its own usage in real-time.
          </p>
        </div>


        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Feature Usage</h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  Total clicks per feature • Click a bar to see its time trend
                </p>
              </div>
              <FeatureBarChart
                data={barChartData}
                selectedFeature={selectedFeature}
                onBarClick={handleBarClick}
              />
            </div>

            <div
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
              onMouseEnter={handleLineChartHover}
            >
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Time Trend
                  {selectedFeature && (
                    <span className="ml-2 text-blue-400 text-sm font-normal">
                      — {selectedFeature}
                    </span>
                  )}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  {selectedFeature
                    ? `Daily click count for "${selectedFeature}"`
                    : 'Select a bar from Feature Usage to see its trend'}
                </p>
              </div>
              <TimeLineChart data={lineChartData} />
            </div>
          </div>
        )}

        {!loading && !error && barChartData.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-lg font-medium">No data found</p>
            <p className="text-sm mt-2">Try adjusting your filters or run the seed script.</p>
            <code className="text-xs bg-gray-800 px-3 py-1.5 rounded-lg mt-3 inline-block text-gray-400">
              cd backend && npm run seed
            </code>
          </div>
        )}
      </main>
    </div>
  )
}
