import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Page not found
          </h2>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div className="space-y-4">
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
          <div>
            <Link
              to={ROUTES.HOME}
              className="text-primary hover:underline"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
