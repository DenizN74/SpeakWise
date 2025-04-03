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
    const { user_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's current difficulty level and focus areas
    const { data: config } = await supabase
      .from('dynamic_quiz_configs')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // Generate quiz based on user's level
    const quiz = await generateQuiz(config, supabase);

    return new Response(JSON.stringify(quiz), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateQuiz(config: any, supabase: any) {
  const difficulty = config?.difficulty_level ?? 0.5;
  const focusAreas = config?.focus_areas ?? [];

  // Fetch question templates based on difficulty and focus areas
  const { data: templates } = await supabase
    .from('module_contents')
    .select('*')
    .eq('type', 'quiz')
    .order('created_at', { ascending: false });

  // Filter and adapt questions based on user's level
  const questions = templates
    .filter(template => {
      const templateDifficulty = template.content.difficulty ?? 0.5;
      return Math.abs(templateDifficulty - difficulty) < 0.2;
    })
    .map(template => adaptQuestion(template.content, difficulty))
    .slice(0, 5);

  return {
    questions,
    metadata: {
      difficulty,
      focus_areas: focusAreas
    }
  };
}

function adaptQuestion(template: any, targetDifficulty: number) {
  // Adapt question based on difficulty
  const question = { ...template };

  if (targetDifficulty < 0.3) {
    // Make easier: Add hints, reduce options
    question.options = question.options.slice(0, 3);
    question.hint = generateHint(question);
  } else if (targetDifficulty > 0.7) {
    // Make harder: Add distractors, remove hints
    question.options = addDistractors(question.options);
    delete question.hint;
  }

  return question;
}

function generateHint(question: any) {
  // Generate contextual hints based on question type
  if (question.type === 'grammar') {
    return `Think about the ${question.grammarPoint} rule`;
  } else if (question.type === 'vocabulary') {
    return `This word is commonly used in ${question.context}`;
  }
  return 'Consider the context carefully';
}

function addDistractors(options: string[]) {
  // Add plausible but incorrect options
  const distractors = [
    'All of the above',
    'None of the above',
    options[0] + ' and ' + options[1],
    'It depends on the context'
  ];

  return [...options, distractors[Math.floor(Math.random() * distractors.length)]];
}