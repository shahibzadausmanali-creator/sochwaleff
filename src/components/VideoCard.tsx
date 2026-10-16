import React from 'react';
import { Play } from 'lucide-react';
import { Video } from '../types.js';

interface VideoCardProps {
  video: Video;
  onWatch: (id: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onWatch }) => {
  return (
    <div className="group flex flex-col bg-white border border-[#E5E5E5] hover:border-[#111111] transition-colors duration-200 overflow-hidden h-full">
      {/* Video Thumbnail with Play Badge */}
      <div
        onClick={() => onWatch(video.id)}
        className="relative aspect-video bg-black cursor-pointer overflow-hidden"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 text-[#111111] flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          {/* Zero-Pill Unboxed Category */}
          <div className="text-xs text-[#666666] font-medium mb-2">
            {video.category}
          </div>

          <h3
            onClick={() => onWatch(video.id)}
            className="text-base font-bold text-[#111111] mb-2 cursor-pointer group-hover:text-neutral-700 transition-colors line-clamp-2"
          >
            {video.title}
          </h3>

          {video.description && (
            <p className="text-xs text-[#666666] line-clamp-2 mb-4 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* Watch Now Button */}
        <div className="pt-2 border-t border-[#F5F5F5] mt-auto">
          <button
            onClick={() => onWatch(video.id)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase tracking-wider font-semibold text-white bg-[#111111] hover:bg-neutral-800 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
