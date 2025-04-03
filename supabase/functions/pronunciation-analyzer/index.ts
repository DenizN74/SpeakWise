import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, audio_url, transcript } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Analyze pronunciation
    const analysis = await analyzePronunciation(audio_url, transcript);

    // Store assessment results
    await supabase.from('pronunciation_assessments').insert({
      user_id,
      audio_url,
      transcript,
      score: analysis.score,
      feedback: analysis.feedback
    });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzePronunciation(audioUrl: string, transcript: string) {
  // Initialize analysis results
  const analysis = {
    score: 0,
    feedback: {
      overall: '',
      specific: []
    }
  };

  // Analyze common pronunciation patterns
  const patterns = [
    {
      pattern: /th/g,
      description: 'TH sound pronunciation',
      suggestion: 'Place your tongue between your teeth for "th" sounds'
    },
    {
      pattern: /r/g,
      description: 'R sound pronunciation',
      suggestion: 'Curl your tongue back slightly for the "r" sound'
    },
    {
      pattern: /ing\b/g,
      description: 'ING ending pronunciation',
      suggestion: 'Make sure to pronounce the "g" in "ing" endings'
    }
  ];

  // Calculate base score
  let baseScore = 0.7; // Starting score

  // Analyze patterns in transcript
  patterns.forEach(pattern => {
    const matches = transcript.match(pattern.pattern);
    if (matches) {
      analysis.feedback.specific.push({
        focus: pattern.description,
        suggestion: pattern.suggestion,
        occurrences: matches.length
      });
      
      // Adjust score based on pattern frequency
      baseScore -= (matches.length * 0.05);
    }
  });

  // Ensure score stays within bounds
  analysis.score = Math.max(0, Math.min(1, baseScore));

  // Generate overall feedback
  analysis.feedback.overall = generateOverallFeedback(analysis.score);

  return analysis;
}

function generateOverallFeedback(score: number) {
  if (score > 0.8) {
    return 'Excellent pronunciation! Keep practicing to maintain this level.';
  } else if (score > 0.6) {
    return 'Good pronunciation with some areas for improvement. Focus on the specific suggestions provided.';
  } else {
    return 'Your pronunciation needs more practice. Pay special attention to the suggested improvements and practice regularly.';
  }
}