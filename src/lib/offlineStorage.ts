import { openDB } from 'idb';

const DB_NAME = 'langlearn_offline';
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for quiz responses
      if (!db.objectStoreNames.contains('quizResponses')) {
        db.createObjectStore('quizResponses', { keyPath: 'id', autoIncrement: true });
      }
      // Store for lesson progress
      if (!db.objectStoreNames.contains('lessonProgress')) {
        db.createObjectStore('lessonProgress', { keyPath: 'id' });
      }
      // Store for cached content
      if (!db.objectStoreNames.contains('cachedContent')) {
        db.createObjectStore('cachedContent', { keyPath: 'id' });
      }
    }
  });
  return db;
};

export const saveQuizResponse = async (response: any) => {
  const db = await initDB();
  await db.add('quizResponses', {
    ...response,
    timestamp: new Date().toISOString(),
    synced: false
  });
};

export const syncQuizResponses = async () => {
  const db = await initDB();
  const tx = db.transaction('quizResponses', 'readwrite');
  const store = tx.objectStore('quizResponses');
  const unsyncedResponses = await store.getAll();

  for (const response of unsyncedResponses) {
    if (!response.synced) {
      try {
        // Attempt to sync with Supabase
        await syncResponseToSupabase(response);
        // Mark as synced if successful
        response.synced = true;
        await store.put(response);
      } catch (error) {
        console.error('Failed to sync response:', error);
      }
    }
  }
};

export const cacheLessonContent = async (lessonId: string, content: any) => {
  const db = await initDB();
  await db.put('cachedContent', {
    id: lessonId,
    content,
    timestamp: new Date().toISOString()
  });
};

export const getCachedLessonContent = async (lessonId: string) => {
  const db = await initDB();
  return await db.get('cachedContent', lessonId);
};

export const saveLessonProgress = async (progress: any) => {
  const db = await initDB();
  await db.put('lessonProgress', {
    ...progress,
    timestamp: new Date().toISOString(),
    synced: false
  });
};

const syncResponseToSupabase = async (response: any) => {
  // Implement Supabase sync logic here
  // This will be called when online connectivity is restored
};