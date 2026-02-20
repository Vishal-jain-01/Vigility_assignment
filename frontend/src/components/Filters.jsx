import React from 'react'

export default function Filters({ filters, onFilterChange, onReset }) {
  const handleStartDateChange = (value) => {
    onFilterChange('startDate', value)
  }

  const handleEndDateChange = (value) => {

    if (filters.startDate && value && value < filters.startDate) return
    onFilterChange('endDate', value)
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Filters
        </h2>
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
        >
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={e => handleStartDateChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>


        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={e => handleEndDateChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>


        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Age Group
          </label>
          <select
            value={filters.ageGroup}
            onChange={e => onFilterChange('ageGroup', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Ages</option>
            <option value="<18">Under 18</option>
            <option value="18-40">18 – 40</option>
            <option value=">40">Over 40</option>
          </select>
        </div>


        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Gender
          </label>
          <select
            value={filters.gender}
            onChange={e => onFilterChange('gender', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>


      {(filters.startDate || filters.endDate || filters.ageGroup !== 'All' || filters.gender !== 'All') && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700">
          {filters.startDate && (
            <span className="text-xs bg-blue-600/20 text-blue-300 border border-blue-600/30 px-2 py-1 rounded-full">
              From: {filters.startDate}
            </span>
          )}
          {filters.endDate && (
            <span className="text-xs bg-blue-600/20 text-blue-300 border border-blue-600/30 px-2 py-1 rounded-full">
              To: {filters.endDate}
            </span>
          )}
          {filters.ageGroup !== 'All' && (
            <span className="text-xs bg-purple-600/20 text-purple-300 border border-purple-600/30 px-2 py-1 rounded-full">
              Age: {filters.ageGroup}
            </span>
          )}
          {filters.gender !== 'All' && (
            <span className="text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 px-2 py-1 rounded-full">
              Gender: {filters.gender}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
