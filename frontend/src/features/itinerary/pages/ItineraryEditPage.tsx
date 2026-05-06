import React from 'react'

export const ItineraryEditPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Itinerary</h1>
        <p className="text-gray-600 mt-2">
          Customize your travel itinerary.
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Edit Your Itinerary
          </h3>
          <p className="text-gray-500">
            This page will allow you to edit and customize your travel plans.
          </p>
        </div>
      </div>
    </div>
  )
}
