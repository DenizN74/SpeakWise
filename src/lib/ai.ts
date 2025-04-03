import { supabase } from './supabase';

export async function getPersonalizedRecommendations(userId: string) {
  const { data, error } = await supabase.functions.invoke('content-recommender', {
    body: { user_id: userId }
  });

  if (error) throw error;
  return data;
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