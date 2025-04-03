import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronRight, GripVertical, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Database } from '../../types/supabase';
import { TranslationManager } from '../../components/admin/TranslationManager';

type LessonModule = Database['public']['Tables']['lesson_modules']['Row'];

export const AdminModules: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<LessonModule | null>(null);
  const [showTranslations, setShowTranslations] = useState<string | null>(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchModules();
  }, [lessonId]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_modules')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const moduleData = {
      lesson_id: lessonId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      order_index: editingModule
        ? editingModule.order_index
        : modules.length
    };

    try {
      if (editingModule) {
        const { error } = await supabase
          .from('lesson_modules')
          .update(moduleData)
          .eq('id', editingModule.id);

        if (error) throw error;
        toast.success('Module updated successfully');
      } else {
        const { error } = await supabase
          .from('lesson_modules')
          .insert([moduleData]);

        if (error) throw error;
        toast.success('Module created successfully');
      }

      setShowForm(false);
      setEditingModule(null);
      fetchModules();
      form.reset();
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    }
  };

  const handleDelete = async (module: LessonModule) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      const { error } = await supabase
        .from('lesson_modules')
        .delete()
        .eq('id', module.id);

      if (error) throw error;
      toast.success('Module deleted successfully');
      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order_index in database
        newItems.forEach(async (item, index) => {
          try {
            await supabase
              .from('lesson_modules')
              .update({ order_index: index })
              .eq('id', item.id);
          } catch (error) {
            console.error('Error updating module order:', error);
          }
        });

        return newItems;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading modules...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
        <button
          onClick={() => {
            setEditingModule(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} className="mr-2" />
          Add Module
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingModule ? 'Edit Module' : 'Create New Module'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                defaultValue={editingModule?.title}
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
                defaultValue={editingModule?.description}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingModule(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingModule ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="divide-y divide-gray-200">
              {modules.map((module) => (
                <div key={module.id}>
                  <SortableModuleItem
                    module={module}
                    onEdit={() => {
                      setEditingModule(module);
                      setShowForm(true);
                    }}
                    onDelete={() => handleDelete(module)}
                    onNavigate={() =>
                      navigate(`/admin/modules/${module.id}/content`)
                    }
                    onTranslate={() => setShowTranslations(module.id)}
                  />
                  {showTranslations === module.id && (
                    <div className="px-6 pb-6">
                      <TranslationManager
                        contentId={module.id}
                        contentType="module"
                        originalContent={{
                          title: module.title,
                          description: module.description
                        }}
                        onTranslationChange={() => {
                          setShowTranslations(null);
                          fetchModules();
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

interface SortableModuleItemProps {
  module: LessonModule;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
  onTranslate: () => void;
}

const SortableModuleItem: React.FC<SortableModuleItemProps> = ({
  module,
  onEdit,
  onDelete,
  onNavigate,
  onTranslate
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="p-6 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <button
            className="cursor-move text-gray-400 hover:text-gray-600 mr-4"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={20} />
          </button>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {module.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {module.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onTranslate}
            className="text-gray-400 hover:text-indigo-500"
            title="Manage translations"
          >
            <Globe size={20} />
          </button>
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-gray-500"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={onNavigate}
            className="text-gray-400 hover:text-indigo-500"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </li>
  );
};