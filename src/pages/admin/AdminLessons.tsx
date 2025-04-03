import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronRight, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Database } from '../../types/supabase';
import { TranslationManager } from '../../components/admin/TranslationManager';

type Lesson = Database['public']['Tables']['lessons']['Row'];

export const AdminLessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showTranslations, setShowTranslations] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const lessonData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      level: formData.get('level') as 'beginner' | 'intermediate' | 'advanced',
      order_index: editingLesson
        ? editingLesson.order_index
        : lessons.length
    };

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast.success('Lesson updated successfully');
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([lessonData]);

        if (error) throw error;
        toast.success('Lesson created successfully');
      }

      setShowForm(false);
      setEditingLesson(null);
      fetchLessons();
      form.reset();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson');
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lesson.id);

      if (error) throw error;
      toast.success('Lesson deleted successfully');
      fetchLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading lessons...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
        <button
          onClick={() => {
            setEditingLesson(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} className="mr-2" />
          Add Lesson
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                defaultValue={editingLesson?.title}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={editingLesson?.description}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Level
              </label>
              <select
                name="level"
                defaultValue={editingLesson?.level || 'beginner'}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingLesson(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingLesson ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {lesson.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {lesson.description}
                  </p>
                  <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {lesson.level}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowTranslations(lesson.id)}
                    className="text-gray-400 hover:text-indigo-500"
                    title="Manage translations"
                  >
                    <Globe size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingLesson(lesson);
                      setShowForm(true);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(lesson)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/lessons/${lesson.id}/modules`)}
                    className="text-gray-400 hover:text-indigo-500"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {showTranslations === lesson.id && (
                <TranslationManager
                  contentId={lesson.id}
                  contentType="lesson"
                  originalContent={{
                    title: lesson.title,
                    description: lesson.description
                  }}
                  onTranslationChange={() => {
                    setShowTranslations(null);
                    fetchLessons();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};