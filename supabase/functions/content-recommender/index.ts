import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

interface PerformanceAnalysis {
  averageScore: number;
  weakAreas: string[];
  progressVelocity: number;
}

interface Recommendation {
  module_id: string;
  confidence: number;
  reason: {
    weak_areas: string[];
    performance: number;
    velocity: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    // Fetch user's quiz responses and progress
    const { data: quizResponses } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user_id);

    // Analyze performance patterns
    const performanceAnalysis = analyzePerformance(quizResponses, progress);

    // Generate recommendations
    const recommendations = await generateRecommendations(
      performanceAnalysis,
      supabase
    );

    // Store recommendations
    await supabase.from('content_recommendations').insert(
      recommendations.map(rec => ({
        user_id,
        module_id: rec.module_id,
        confidence_score: rec.confidence,
        reason: rec.reason
      }))
    );

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzePerformance(quizResponses: any[], progress: any[]): PerformanceAnalysis {
  // Analyze recent performance trends
  const recentScores = quizResponses.map(r => r.score);
  const averageScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  
  // Identify weak areas based on quiz responses
  const weakAreas = identifyWeakAreas(quizResponses);
  
  // Calculate progress velocity
  const progressVelocity = calculateProgressVelocity(progress);

  return {
    averageScore,
    weakAreas,
    progressVelocity,
  };
}

function identifyWeakAreas(quizResponses: any[]) {
  // Group responses by topic/skill and analyze success rates
  const topicScores = {};
  
  quizResponses.forEach(response => {
    const content = response.content as any;
    if (content.topic) {
      if (!topicScores[content.topic]) {
        topicScores[content.topic] = { total: 0, correct: 0 };
      }
      topicScores[content.topic].total++;
      topicScores[content.topic].correct += response.score;
    }
  });

  // Identify topics with below-average performance
  return Object.entries(topicScores)
    .filter(([_, scores]: [string, any]) => 
      scores.correct / scores.total < 0.7
    )
    .map(([topic]) => topic);
}

function calculateProgressVelocity(progress: any[]) {
  if (progress.length < 2) return 0;
  
  const sortedProgress = [...progress].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const timeSpan = new Date(sortedProgress[sortedProgress.length - 1].created_at).getTime() -
    new Date(sortedProgress[0].created_at).getTime();
  
  const completedLessons = sortedProgress.filter(p => p.completed).length;
  
  return (completedLessons / (timeSpan / (1000 * 60 * 60 * 24))); // Lessons per day
}

async function generateRecommendations(analysis: PerformanceAnalysis, supabase: any): Promise<Recommendation[]> {
  const { data: modules } = await supabase
    .from('lesson_modules')
    .select('*')
    .order('order_index', { ascending: true });

  return modules
    .filter(module => {
      // Filter modules based on analysis
      const isRelevant = analysis.weakAreas.some(area => 
        module.title.toLowerCase().includes(area.toLowerCase())
      );
      
      const matchesDifficulty = analysis.averageScore < 0.7 
        ? module.difficulty <= 0.5 
        : module.difficulty <= 0.8;

      return isRelevant && matchesDifficulty;
    })
    .map(module => ({
      module_id: module.id,
      confidence: calculateConfidenceScore(module, analysis),
      reason: {
        weak_areas: analysis.weakAreas,
        performance: analysis.averageScore,
        velocity: analysis.progressVelocity
      }
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function calculateConfidenceScore(module: any, analysis: any) {
  // Calculate how well the module matches the user's needs
  const relevanceScore = analysis.weakAreas.reduce((score: number, area: string) => 
    score + (module.title.toLowerCase().includes(area.toLowerCase()) ? 0.3 : 0), 0
  );
  
  const difficultyMatch = Math.max(0, 1 - Math.abs(module.difficulty - analysis.averageScore));
  
  return Math.min(1, (relevanceScore + difficultyMatch) / 2);
}