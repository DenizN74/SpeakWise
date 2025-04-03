import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { MessageSquare, ThumbsUp, Award } from 'lucide-react';

interface FeedbackSectionProps {
  postId: string;
  feedback: any[];
  onFeedbackUpdate: () => void;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  postId,
  feedback,
  onFeedbackUpdate
}) => {
  const { user } = useAuth();
  const [newFeedback, setNewFeedback] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('community_feedback').insert({
        post_id: postId,
        user_id: user!.id,
        content: newFeedback.trim()
      });

      if (error) throw error;

      setNewFeedback('');
      onFeedbackUpdate();
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (feedbackId: string, voteType: 'helpful' | 'best') => {
    try {
      const { error } = await supabase.from('feedback_votes').insert({
        feedback_id: feedbackId,
        user_id: user!.id,
        vote_type: voteType
      });

      if (error) throw error;
      onFeedbackUpdate();
      toast.success('Vote recorded!');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Feedback</h3>

      {/* Feedback list */}
      <div className="space-y-4">
        {feedback.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm p-4 border"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <MessageSquare size={16} className="text-indigo-600" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.user_profile.username}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVote(item.id, 'helpful')}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-indigo-600"
                >
                  <ThumbsUp size={14} />
                  <span>{item.helpful_count}</span>
                </button>
                <button
                  onClick={() => handleVote(item.id, 'best')}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-yellow-600"
                >
                  <Award size={14} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-gray-700">{item.content}</p>
          </div>
        ))}
      </div>

      {/* Submit feedback form */}
      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          placeholder="Add your feedback..."
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newFeedback.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};