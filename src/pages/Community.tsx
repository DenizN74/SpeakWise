import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { MessageSquare, Users, BookOpen, Send } from 'lucide-react';
import { WritingSubmission } from '../components/community/WritingSubmission';
import { FeedbackSection } from '../components/community/FeedbackSection';
import { NotificationBell } from '../components/community/NotificationBell';
import { UserBadges } from '../components/community/UserBadges';

type CommunityPost = Database['public']['Tables']['community_posts']['Row'];
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export const Community: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<(CommunityPost & { user_profile: UserProfile })[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'question' | 'practice' | 'discussion'>('discussion');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userBadges, setUserBadges] = useState([]);
  const [contributionScore, setContributionScore] = useState(0);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserBadges();
      fetchContributionScore();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          user_profile:user_profiles(username, level, rank),
          feedback:community_feedback(
            id,
            content,
            user_id,
            helpful_count,
            created_at,
            user_profile:user_profiles(username, rank)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data as any);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:community_badges(*)
        `)
        .eq('user_id', user!.id);

      if (error) throw error;
      setUserBadges(data.map((ub: any) => ub.badge));
    } catch (err) {
      console.error('Error fetching badges:', err);
    }
  };

  const fetchContributionScore = async () => {
    try {
      const { data, error } = await supabase
        .from('contribution_scores')
        .select('total_score')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setContributionScore(data?.total_score || 0);
    } catch (err) {
      console.error('Error fetching contribution score:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading community posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="mt-2 text-gray-600">
            Connect with other learners, share your progress, and help others
          </p>
        </div>
        <NotificationBell />
      </div>

      {user && (
        <UserBadges
          badges={userBadges}
          rank={user.user_metadata.rank || 'novice'}
          contributionScore={contributionScore}
        />
      )}

      <div className="mt-8">
        <WritingSubmission />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {post.user_profile.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()} •{' '}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        post.type === 'question'
                          ? 'bg-blue-100 text-blue-800'
                          : post.type === 'practice'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {post.type === 'question' && <MessageSquare className="w-3 h-3 mr-1" />}
                      {post.type === 'practice' && <BookOpen className="w-3 h-3 mr-1" />}
                      {post.type === 'discussion' && <Users className="w-3 h-3 mr-1" />}
                      {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  post.user_profile.rank === 'novice'
                    ? 'bg-gray-100 text-gray-800'
                    : post.user_profile.rank === 'intermediate'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {post.user_profile.rank}
              </span>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>

            {post.ai_suggestions && (
              <div className="mt-4 bg-indigo-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-indigo-900 mb-2">
                  AI Writing Suggestions
                </h4>
                <ul className="space-y-1">
                  {post.ai_suggestions.suggestions.map((suggestion: any, index: number) => (
                    <li key={index} className="text-sm text-indigo-700">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <FeedbackSection
              postId={post.id}
              feedback={post.feedback}
              onFeedbackUpdate={fetchPosts}
            />
          </div>
        ))}
      </div>
    </div>
  );
};