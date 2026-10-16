import React from 'react';
import { ArrowLeft, Share2, Play } from 'lucide-react';
import { Video } from '../types.js';

interface VideoDetailProps {
  video: Video;
  relatedVideos: Video[];
  onBack: () => void;
  onSelectVideo: (id: string) => void;
}

export const VideoDetail: React.FC<VideoDetailProps> = ({
  video,
  relatedVideos,
  onBack,
  onSelectVideo
}) => {
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top Bar */}
      <div className="border-b border-[#E5E5E5] bg-[#F5F5F5]/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#111111] hover:text-neutral-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Video Library</span>
          </button>
          <span className="text-xs text-[#666666] font-medium">{video.category}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* Responsive Embedded YouTube Player */}
        <div className="relative aspect-video bg-black shadow-xl overflow-hidden mb-8 border border-neutral-800">
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Video Info */}
        <div className="border-b border-[#E5E5E5] pb-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
                {video.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-editorial text-[#111111] mt-2 mb-4">
                {video.title}
              </h1>
              {video.description && (
                <p className="text-sm sm:text-base text-[#666666] leading-relaxed whitespace-pre-line">
                  {video.description}
                </p>
              )}
            </div>

            {/* YouTube external button */}
            <div className="shrink-0 flex flex-col gap-2">
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider font-semibold transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch on YouTube</span>
              </a>
            </div>
          </div>
        </div>

        {/* Related Videos */}
        {relatedVideos && relatedVideos.length > 0 && (
          <div>
            <h3 className="text-xl font-bold font-editorial text-[#111111] mb-6">
              More Educational Videos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedVideos.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => onSelectVideo(rel.id)}
                  className="group cursor-pointer border border-[#E5E5E5] hover:border-[#111111] transition-colors p-4 bg-white"
                >
                  <div className="aspect-video bg-neutral-900 overflow-hidden mb-3 relative">
                    <img
                      src={rel.thumbnailUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/80 text-black flex items-center justify-center shadow">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-[#111111] line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
