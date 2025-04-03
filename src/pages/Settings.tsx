import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Globe, Check } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  native_name: string;
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserSettings();
    fetchLanguages();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('preferred_language')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data?.preferred_language) {
        setSelectedLanguage(data.preferred_language);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setLanguages(data);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ preferred_language: languageCode })
        .eq('id', user?.id);

      if (error) throw error;

      setSelectedLanguage(languageCode);
      toast.success('Language preference updated successfully');

      // Trigger a page reload to refresh content in the new language
      window.location.reload();
    } catch (error) {
      console.error('Error updating language preference:', error);
      toast.error('Failed to update language preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <SettingsIcon className="h-8 w-8 text-gray-900 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Globe className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Language Preferences
            </h2>
          </div>
          <p className="text-gray-600">
            Choose your preferred language for lesson content. The interface will remain in English.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              disabled={saving}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                selectedLanguage === language.code
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{language.native_name}</p>
                <p className="text-sm text-gray-500">{language.name}</p>
              </div>
              {selectedLanguage === language.code && (
                <Check className="h-5 w-5 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};