import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Globe, Wand2, AlertCircle, Check } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  native_name: string;
}

interface TranslationManagerProps {
  contentId: string;
  contentType: 'lesson' | 'module' | 'content';
  originalContent: {
    title?: string;
    description?: string;
    content?: any;
  };
  onTranslationChange?: () => void;
}

export const TranslationManager: React.FC<TranslationManagerProps> = ({
  contentId,
  contentType,
  originalContent,
  onTranslationChange
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchLanguages();
    fetchTranslations();
  }, [contentId]);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('active', true)
        .neq('code', 'en')
        .order('name');

      if (error) throw error;
      setLanguages(data);
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast.error('Failed to load languages');
    }
  };

  const fetchTranslations = async () => {
    try {
      const table = `${contentType}_translations`;
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(`${contentType}_id`, contentId);

      if (error) throw error;

      const translationsMap = data.reduce((acc, translation) => {
        acc[translation.language_code] = translation;
        return acc;
      }, {});

      setTranslations(translationsMap);
    } catch (error) {
      console.error('Error fetching translations:', error);
      toast.error('Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationChange = (
    languageCode: string,
    field: string,
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        [field]: value
      }
    }));
  };

  const handleSaveTranslation = async (languageCode: string) => {
    setSaving(true);
    try {
      const table = `${contentType}_translations`;
      const translation = translations[languageCode] || {};
      const translationData = {
        [`${contentType}_id`]: contentId,
        language_code: languageCode,
        ...(contentType === 'content'
          ? { content: translation.content || {} }
          : {
              title: translation.title || '',
              description: translation.description || ''
            })
      };

      const { error } = await supabase
        .from(table)
        .upsert(translationData);

      if (error) throw error;

      toast.success('Translation saved successfully');
      onTranslationChange?.();
    } catch (error) {
      console.error('Error saving translation:', error);
      toast.error('Failed to save translation');
    } finally {
      setSaving(false);
    }
  };

  const generateTranslation = async (languageCode: string) => {
    setGenerating(true);
    try {
      // Call GPT-3.5 API through edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: originalContent,
          targetLanguage: languageCode,
          contentType
        })
      });

      if (!response.ok) throw new Error('Translation failed');

      const translatedContent = await response.json();

      setTranslations((prev) => ({
        ...prev,
        [languageCode]: translatedContent
      }));

      toast.success('Translation generated successfully');
    } catch (error) {
      console.error('Error generating translation:', error);
      toast.error('Failed to generate translation');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading translations...</div>;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Globe className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Translations</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {languages.map((language) => {
          const hasTranslation = Boolean(translations[language.code]);
          const isComplete = hasTranslation && Object.values(translations[language.code]).every(Boolean);

          return (
            <div
              key={language.code}
              className={`border rounded-lg p-4 ${
                isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {language.native_name} ({language.name})
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isComplete
                      ? 'Translation complete'
                      : hasTranslation
                      ? 'Translation incomplete'
                      : 'No translation'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => generateTranslation(language.code)}
                    disabled={generating}
                    className="flex items-center px-3 py-1 text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    onClick={() => handleSaveTranslation(language.code)}
                    disabled={saving}
                    className="flex items-center px-3 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {contentType !== 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      value={translations[language.code]?.title || ''}
                      onChange={(e) =>
                        handleTranslationChange(
                          language.code,
                          'title',
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={translations[language.code]?.description || ''}
                      onChange={(e) =>
                        handleTranslationChange(
                          language.code,
                          'description',
                          e.target.value
                        )
                      }
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {contentType === 'content' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Content
                  </label>
                  <textarea
                    value={
                      translations[language.code]?.content
                        ? JSON.stringify(
                            translations[language.code].content,
                            null,
                            2
                          )
                        : ''
                    }
                    onChange={(e) => {
                      try {
                        const content = JSON.parse(e.target.value);
                        handleTranslationChange(
                          language.code,
                          'content',
                          content
                        );
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={10}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};