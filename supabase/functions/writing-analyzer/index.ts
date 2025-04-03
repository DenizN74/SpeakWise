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
    const { user_id, text } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Analyze text for grammar and spelling
    const analysis = await analyzeText(text);

    // Store the corrections
    await supabase.from('writing_corrections').insert({
      user_id,
      original_text: text,
      corrected_text: analysis.corrected,
      suggestions: analysis.suggestions
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

async function analyzeText(text: string) {
  // Initialize analysis results
  const corrections = [];
  let correctedText = text;

  // Common grammar patterns to check
  const patterns = [
    {
      type: 'grammar',
      pattern: /\b(is|are|was|were)\s+(\w+ing)\b/g,
      suggestion: 'Consider using simple present/past tense instead of continuous',
    },
    {
      type: 'grammar',
      pattern: /\b(i|I)\s+am\s+(\w+ing)\b/g,
      suggestion: 'Consider using simple present tense',
    },
    {
      type: 'spelling',
      pattern: /\b(teh|thier|recieve|seperate|alot)\b/g,
      corrections: {
        'teh': 'the',
        'thier': 'their',
        'recieve': 'receive',
        'seperate': 'separate',
        'alot': 'a lot'
      }
    }
  ];

  // Apply patterns and collect corrections
  patterns.forEach(pattern => {
    if (pattern.type === 'spelling') {
      Object.entries(pattern.corrections).forEach(([incorrect, correct]) => {
        const regex = new RegExp(`\\b${incorrect}\\b`, 'g');
        if (regex.test(text)) {
          corrections.push({
            type: 'spelling',
            original: incorrect,
            suggestion: correct,
            explanation: `"${incorrect}" should be spelled as "${correct}"`
          });
          correctedText = correctedText.replace(regex, correct);
        }
      });
    } else {
      const matches = text.match(pattern.pattern);
      if (matches) {
        matches.forEach(match => {
          corrections.push({
            type: pattern.type,
            original: match,
            suggestion: pattern.suggestion
          });
        });
      }
    }
  });

  return {
    corrected: correctedText,
    suggestions: corrections
  };
}