export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          created_at: string
          username: string
          level: 'beginner' | 'intermediate' | 'advanced'
          xp_points: number
          streak_days: number
          last_login: string
        }
        Insert: {
          id: string
          created_at?: string
          username: string
          level?: 'beginner' | 'intermediate' | 'advanced'
          xp_points?: number
          streak_days?: number
          last_login?: string
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          level?: 'beginner' | 'intermediate' | 'advanced'
          xp_points?: number
          streak_days?: number
          last_login?: string
        }
      }
      lessons: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          level: 'beginner' | 'intermediate' | 'advanced'
          content: Json
          order_index: number
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          level: 'beginner' | 'intermediate' | 'advanced'
          content: Json
          order_index: number
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          level?: 'beginner' | 'intermediate' | 'advanced'
          content?: Json
          order_index?: number
        }
      }
      lesson_modules: {
        Row: {
          id: string
          lesson_id: string
          title: string
          description: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          title: string
          description: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          title?: string
          description?: string
          order_index?: number
          created_at?: string
        }
      }
      module_contents: {
        Row: {
          id: string
          module_id: string
          type: 'text' | 'image' | 'video' | 'audio' | 'quiz'
          content: Json
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          type: 'text' | 'image' | 'video' | 'audio' | 'quiz'
          content: Json
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          type?: 'text' | 'image' | 'video' | 'audio' | 'quiz'
          content?: Json
          order_index?: number
          created_at?: string
        }
      }
      quiz_responses: {
        Row: {
          id: string
          user_id: string
          content_id: string
          answers: Json
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          answers: Json
          score: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          answers?: Json
          score?: number
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed: boolean
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed?: boolean
          score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed?: boolean
          score?: number
          created_at?: string
          updated_at?: string
        }
      }
      community_posts: {
        Row: {
          id: string
          user_id: string
          content: string
          type: 'question' | 'practice' | 'discussion'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          type: 'question' | 'practice' | 'discussion'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          type?: 'question' | 'practice' | 'discussion'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}