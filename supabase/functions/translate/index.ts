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
    const { content, targetLanguage, contentType } = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get language details
    const { data: languageData } = await supabase
      .from('supported_languages')
      .select('name, native_name')
      .eq('code', targetLanguage)
      .single();

    if (!languageData) {
      throw new Error('Language not supported');
    }

    // Simulate GPT-3.5 translation
    // In production, this would call the actual GPT-3.5 API
    const translatedContent = await simulateTranslation(
      content,
      targetLanguage,
      contentType
    );

    return new Response(JSON.stringify(translatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function simulateTranslation(
  content: any,
  targetLanguage: string,
  contentType: string
) {
  // This is a placeholder for GPT-3.5 translation
  // In production, you would call the OpenAI API here
  
  if (contentType === 'content') {
    return {
      content: {
        ...content,
        text: `[Translated to ${targetLanguage}] ${content.text || ''}`
      }
    };
  }

  return {
    title: `[Translated to ${targetLanguage}] ${content.title || ''}`,
    description: `[Translated to ${targetLanguage}] ${content.description || ''}`
  };
}