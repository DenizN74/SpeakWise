import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  FileText,
  Image,
  Video,
  Music,
  HelpCircle,
  Wand2
} from 'lucide-react';
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

type ModuleContent = Database['public']['Tables']['module_contents']['Row'];

export const AdminContent: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<ModuleContent | null>(null);
  const [contentType, setContentType] = useState<
    'text' | 'image' | 'video' | 'audio' | 'quiz'
  >('text');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchContents();
  }, [moduleId]);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('module_contents')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast.error('Failed to load contents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    let content: any = {};

    switch (contentType) {
      case 'text':
        content = {
          text: formData.get('text')
        };
        break;
      case 'image':
        content = {
          url: formData.get('url'),
          caption: formData.get('caption')
        };
        break;
      case 'video':
      case 'audio':
        content = {
          url: formData.get('url'),
          title: formData.get('title')
        };
        break;
      case 'quiz':
        const questions = [];
        const questionCount = parseInt(formData.get('questionCount') as string);
        
        for (let i = 0; i < questionCount; i++) {
          const options = [];
          const optionCount = parseInt(formData.get(`optionCount_${i}`) as string);
          
          for (let j = 0; j < optionCount; j++) {
            options.push(formData.get(`option_${i}_${j}`));
          }

          questions.push({
            question: formData.get(`question_${i}`),
            options,
            correctAnswer: parseInt(formData.get(`correctAnswer_${i}`) as string)
          });
        }
        content = { questions };
        break;
    }

    const contentData = {
      module_id: moduleId,
      type: contentType,
      content,
      order_index: editingContent
        ? editingContent.order_index
        : contents.length
    };

    try {
      if (editingContent) {
        const { error } = await supabase
          .from('module_contents')
          .update(contentData)
          .eq('id', editingContent.id);

        if (error) throw error;
        toast.success('Content updated successfully');
      } else {
        const { error } = await supabase
          .from('module_contents')
          .insert([contentData]);

        if (error) throw error;
        toast.success('Content created successfully');
      }

      setShowForm(false);
      setEditingContent(null);
      fetchContents();
      form.reset();
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    }
  };

  const handleDelete = async (content: ModuleContent) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('module_contents')
        .delete()
        .eq('id', content.id);

      if (error) throw error;
      toast.success('Content deleted successfully');
      fetchContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setContents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order_index in database
        newItems.forEach(async (item, index) => {
          try {
            await supabase
              .from('module_contents')
              .update({ order_index: index })
              .eq('id', item.id);
          } catch (error) {
            console.error('Error updating content order:', error);
          }
        });

        return newItems;
      });
    }
  };

  const handleAIGenerate = async () => {
    // This would integrate with your AI service
    toast.info('AI content generation coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading contents...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Module Contents</h1>
        <button
          onClick={() => {
            setEditingContent(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} className="mr-2" />
          Add Content
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingContent ? 'Edit Content' : 'Create New Content'}
            </h2>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setContentType('text')}
                className={`flex items-center px-3 py-2 rounded ${
                  contentType === 'text'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <FileText size={16} className="mr-2" />
                Text
              </button>
              <button
                onClick={() => setContentType('image')}
                className={`flex items-center px-3 py-2 rounded ${
                  contentType === 'image'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Image size={16} className="mr-2" />
                Image
              </button>
              <button
                onClick={() => setContentType('video')}
                className={`flex items-center px-3 py-2 rounded ${
                  contentType === 'video'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Video size={16} className="mr-2" />
                Video
              </button>
              <button
                onClick={() => setContentType('audio')}
                className={`flex items-center px-3 py-2 rounded ${
                  contentType === 'audio'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Music size={16} className="mr-2" />
                Audio
              </button>
              <button
                onClick={() => setContentType('quiz')}
                className={`flex items-center px-3 py-2 rounded ${
                  contentType === 'quiz'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <HelpCircle size={16} className="mr-2" />
                Quiz
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {contentType === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Text Content
                </label>
                <div className="mt-1 flex items-center">
                  <textarea
                    name="text"
                    required
                    rows={6}
                    defaultValue={
                      editingContent?.content?.text as string
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    className="ml-2 p-2 text-gray-400 hover:text-indigo-600"
                    title="Generate with AI"
                  >
                    <Wand2 size={20} />
                  </button>
                </div>
              </div>
            )}

            {contentType === 'image' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    required
                    defaultValue={
                      (editingContent?.content as any)?.url
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Caption
                  </label>
                  <input
                    type="text"
                    name="caption"
                    defaultValue={
                      (editingContent?.content as any)?.caption
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {(contentType === 'video' || contentType === 'audio') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {contentType === 'video' ? 'Video' : 'Audio'} URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    required
                    defaultValue={
                      (editingContent?.content as any)?.url
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={
                      (editingContent?.content as any)?.title
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {contentType === 'quiz' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    name="questionCount"
                    min="1"
                    max="10"
                    defaultValue="1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Dynamic question fields will be added here */}
                {Array.from({ length: 1 }).map((_, i) => (
                  <div key={i} className="space-y-4 p-4 border rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Question {i + 1}
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          type="text"
                          name={`question_${i}`}
                          required
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleAIGenerate}
                          className="ml-2 p-2 text-gray-400 hover:text-indigo-600"
                          title="Generate with AI"
                        >
                          <Wand2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Number of Options
                      </label>
                      <input
                        type="number"
                        name={`optionCount_${i}`}
                        min="2"
                        max="6"
                        defaultValue="4"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j}>
                        <label className="block text-sm font-medium text-gray-700">
                          Option {j + 1}
                        </label>
                        <input
                          type="text"
                          name={`option_${i}_${j}`}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Correct Answer
                      </label>
                      <select
                        name={`correctAnswer_${i}`}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {Array.from({ length: 4 }).map((_, j) => (
                          <option key={j} value={j}>
                            Option {j + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingContent(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingContent ? 'Update' : 'Create'}
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
            items={contents.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="divide-y divide-gray-200">
              {contents.map((content) => (
                <SortableContentItem
                  key={content.id}
                  content={content}
                  onEdit={() => {
                    setEditingContent(content);
                    setContentType(content.type);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDelete(content)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

interface SortableContentItemProps {
  content: ModuleContent;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableContentItem: React.FC<SortableContentItemProps> = ({
  content,
  onEdit,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const getContentTypeIcon = () => {
    switch (content.type) {
      case 'text':
        return <FileText size={20} />;
      case 'image':
        return <Image size={20} />;
      case 'video':
        return <Video size={20} />;
      case 'audio':
        return <Music size={20} />;
      case 'quiz':
        return <HelpCircle size={20} />;
      default:
        return null;
    }
  };

  const getContentPreview = () => {
    switch (content.type) {
      case 'text':
        return (
          <p className="text-sm text-gray-500">
            {(content.content as { text: string }).text.substring(0, 100)}...
          </p>
        );
      case 'image':
        return (
          <p className="text-sm text-gray-500">
            {(content.content as { caption: string }).caption || 'No caption'}
          </p>
        );
      case 'video':
      case 'audio':
        return (
          <p className="text-sm text-gray-500">
            {(content.content as { title: string }).title}
          </p>
        );
      case 'quiz':
        const questions = (content.content as { questions: any[] }).questions;
        return (
          <p className="text-sm text-gray-500">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </p>
        );
      default:
        return null;
    }
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
          <div className="flex items-center">
            <div className="text-gray-400 mr-4">{getContentTypeIcon()}</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 capitalize">
                {content.type} Content
              </h3>
              {getContentPreview()}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </li>
  );
};