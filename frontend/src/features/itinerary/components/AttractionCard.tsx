import React from 'react';
import { MapPin, Clock, ExternalLink, Utensils, Camera } from 'lucide-react';
import { Activity, ActivityType } from '@/types/itinerary.types';

interface AttractionCardProps {
  activity: Activity;
  isFirst?: boolean;
}

export const AttractionCard: React.FC<AttractionCardProps> = ({ activity, isFirst }) => {
  const isMeal = activity.activityType === ActivityType.MEAL;
  
  return (
    <div className={`relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100 last:before:hidden ${isFirst ? 'mt-0' : 'mt-8'}`}>
      <div className={`absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full ring-4 ${
        isMeal ? 'bg-orange-500 ring-orange-500/10' : 'bg-primary ring-primary/10'
      }`} />
      
      <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow group">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-20 flex-shrink-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Time</span>
            <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
              {activity.startTime || '--:--'}
            </span>
          </div>
          
          <div className="flex-grow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isMeal ? (
                    <Utensils className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Camera className="w-4 h-4 text-primary" />
                  )}
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                    {activity.title}
                  </h4>
                </div>
                <p className="text-gray-500 text-sm flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {activity.location}
                </p>
              </div>
              
              {activity.placeId && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.title)}${activity.location ? encodeURIComponent(' ' + activity.location) : ''}&query_place_id=${activity.placeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}            </div>
            
            {activity.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                {activity.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center px-2.5 py-1 rounded-full bg-gray-50 text-[10px] font-bold text-gray-500 border border-gray-100">
                <Clock className="w-3 h-3 mr-1" />
                {activity.durationMinutes} MINS
              </div>
              
              {activity.tips && (
                <div className="flex items-center px-2.5 py-1 rounded-full bg-primary/5 text-[10px] font-bold text-primary border border-primary/10">
                  TIP: {activity.tips}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
