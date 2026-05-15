import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Cloud, Sun, CloudRain, Wind } from 'lucide-react';
import { Day, Activity } from '@/types/itinerary.types';
import { AttractionCard } from './AttractionCard';

interface DayCardProps {
  day: Day;
  isInitiallyExpanded?: boolean;
  isActive?: boolean;
  onSelect?: (dayId: string) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ day, isInitiallyExpanded = false, isActive = false, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'rain':
      case 'showers': return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'windy': return <Wind className="w-5 h-5 text-gray-500" />;
      default: return <Cloud className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden mb-6 transition-all ${isActive ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'}`}>
      {/* Header */}
      <button 
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (!isExpanded && onSelect) onSelect(day.id);
        }}
        className="w-full px-8 py-6 flex items-center justify-between bg-gray-50/30 hover:bg-gray-50/60 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Day</span>
            <span className="text-xl font-black text-primary leading-none">{day.dayNumber}</span>
          </div>
          
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {day.theme || `Day ${day.dayNumber}: Exploration`}
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              {format(new Date(day.date), 'EEEE, MMMM do')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {day.weather && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-100 shadow-xs">
              {getWeatherIcon(day.weather.condition)}
              <span className="text-xs font-bold text-gray-700">
                {day.weather.tempMax !== null && day.weather.tempMax !== undefined 
                  ? `${day.weather.tempMax}°C` 
                  : '--°C'}
              </span>
            </div>
          )}
          <div className="p-2 rounded-full bg-gray-100/50 text-gray-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Activities List */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-8 space-y-2">
          {day.activities && day.activities.length > 0 ? (
            day.activities.map((activity: Activity, index: number) => (
              <AttractionCard 
                key={`${activity.id || index}-${index}`} 
                activity={activity} 
                isFirst={index === 0} 
              />
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm font-medium">No activities planned for this day.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
