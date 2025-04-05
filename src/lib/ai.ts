import { supabase } from './supabase';

interface Recommendation {
  module_id: string;
  confidence: number;
  reason: {
    weak_areas: string[];
    performance: number;
    velocity: number;
  };
}

export async function getPersonalizedRecommendations(userId: string): Promise<Recommendation[]> {
  try {
    const { data, error } = await supabase.functions.invoke('content-recommender', {
      body: { user_id: userId }
    });
    
    if (error) {
      console.error('Content recommender error:', error);
      throw new Error('Failed to get personalized recommendations');
    }
    
    return data || [];
  } catch (err) {
    console.error('Content recommender error:', err);
    return [];
  }
}

export async function analyzeWriting(userId: string, text: string) {
  const { data, error } = await supabase.functions.invoke('writing-analyzer', {
    body: { user_id: userId, text }
  });

  if (error) throw error;
  return data;
}

export async function generateDynamicQuiz(userId: string) {
  const { data, error } = await supabase.functions.invoke('quiz-generator', {
    body: { user_id: userId }
  });

  if (error) throw error;
  return data;
}

export async function analyzePronunciation(
  userId: string,
  audioUrl: string,
  transcript: string
) {
  const { data, error } = await supabase.functions.invoke('pronunciation-analyzer', {
    body: { user_id: userId, audio_url: audioUrl, transcript }
  });

  if (error) throw error;
  return data;
}