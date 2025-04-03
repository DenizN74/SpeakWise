import React from 'react';
import {
  Award,
  Star,
  MessageSquare,
  ThumbsUp,
  Trophy,
  Zap
} from 'lucide-react';

interface UserBadgesProps {
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
  }[];
  rank: string;
  contributionScore: number;
}

export const UserBadges: React.FC<UserBadgesProps> = ({
  badges,
  rank,
  contributionScore
}) => {
  const getBadgeIcon = (icon: string) => {
    switch (icon) {
      case 'award':
        return <Award className="w-5 h-5" />;
      case 'star':
        return <Star className="w-5 h-5" />;
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      case 'thumbs-up':
        return <ThumbsUp className="w-5 h-5" />;
      case 'trophy':
        return <Trophy className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'novice':
        return 'bg-gray-100 text-gray-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      case 'master':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Achievements
          </h3>
          <p className="text-sm text-gray-500">
            Contribution Score: {contributionScore}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getRankColor(
            rank
          )}`}
        >
          {rank}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-shrink-0 text-indigo-600">
              {getBadgeIcon(badge.icon)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{badge.name}</p>
              <p className="text-xs text-gray-500">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};