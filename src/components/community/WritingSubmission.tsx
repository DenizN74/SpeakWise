import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { analyzeWriting } from '../../lib/ai';
import { toast } from 'sonner';
import { Send, Wand2 } from 'lucide-react';

export const WritingSubmission: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeWriting(user!.id, content);
      setSuggestions(analysis);
      
      if (analysis.suggestions.length > 0) {
        toast.info('AI suggestions available! Review them before posting.');
      } else {
        toast.success('Your writing looks good!');
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
      toast.error('Failed to analyze text');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('community_posts').insert({
        user_id: user!.id,
        content,
        type: 'practice',
        ai_suggestions: suggestions
      });

      if (error) throw error;

      toast.success('Post submitted successfully!');
      setContent('');
      setSuggestions(null);
    } catch (error) {
      console.error('Error submitting post:', error);
      toast.error('Failed to submit post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Share Your Writing
      </h2>
      <div className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your English text here..."
          className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        
        {suggestions && (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-medium text-indigo-900 mb-2">AI Suggestions</h3>
            <ul className="space-y-2">
              {suggestions.suggestions.map((suggestion: any, index: number) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-indigo-600">•</span>
                  <span>{suggestion.suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content.trim()}
            className="flex items-center px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
          >
            <Wand2 size={18} className="mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send size={18} className="mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};