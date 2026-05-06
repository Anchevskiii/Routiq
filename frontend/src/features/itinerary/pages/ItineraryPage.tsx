import React from 'react'

export const ItineraryPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Itinerary Details</h1>
        <p className="text-gray-600 mt-2">
          View and manage your travel itinerary.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-gray-500 text-center py-12">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Itinerary Loading
          </h3>
          <p className="text-gray-500">
            This itinerary page will display detailed travel plans, activities, and more.
          </p>
        </div>
      </div>
    </div>
  )
}
