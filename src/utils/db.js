const DB_NAME = 'CapDocDB';
const DB_VERSION = 2; // Upgraded to v2 for Project Isolation

// Helper to open the database connection
const getDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('Database error: ' + event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
        // Seed default categories
        categoryStore.add({ id: 'process', name: 'Process Documentation', description: 'SOPs, onboarding guides, and workflows', createdAt: Date.now() });
        categoryStore.add({ id: 'product', name: 'Product Documentation', description: 'Feature specs, product user guides, and release notes', createdAt: Date.now() });
        categoryStore.add({ id: 'code', name: 'Code Documentation', description: 'API references, codebase setup, and architecture details', createdAt: Date.now() });
      }

      if (!db.objectStoreNames.contains('documents')) {
        const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
        documentStore.createIndex('category', 'category', { unique: false });
        documentStore.createIndex('projectId', 'projectId', { unique: false });
      } else {
        // Upgrade existing store to add projectId index if it doesn't exist
        const documentStore = request.transaction.objectStore('documents');
        if (!documentStore.indexNames.contains('projectId')) {
          documentStore.createIndex('projectId', 'projectId', { unique: false });
        }
      }

      // Add projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        // Seed default project
        projectStore.add({ 
          id: 'default', 
          name: 'Alpha Synergy', 
          description: 'Primary corporate client workspace', 
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    };
  });
};

export const initDB = async () => {
  try {
    await getDB();
    return true;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    return false;
  }
};

// --- PROJECTS ---

export const getProjects = async () => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.getAll();

    request.onsuccess = () => {
      const projects = request.result.sort((a, b) => a.createdAt - b.createdAt);
      resolve(projects);
    };

    request.onerror = () => {
      reject('Error fetching projects');
    };
  });
};

export const saveProject = async (project) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    
    const projToSave = {
      ...project,
      updatedAt: Date.now()
    };
    
    if (!projToSave.id) {
      projToSave.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      projToSave.createdAt = Date.now();
    }

    const request = store.put(projToSave);

    request.onsuccess = () => {
      resolve(projToSave);
    };

    request.onerror = (e) => {
      reject('Error saving project: ' + e.target.error);
    };
  });
};

export const deleteProject = async (projectId) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    // Open a readwrite transaction for projects and documents
    const transaction = db.transaction(['projects', 'documents'], 'readwrite');
    const projectStore = transaction.objectStore('projects');
    const documentStore = transaction.objectStore('documents');

    // Delete the project entry
    projectStore.delete(projectId);

    // Scan documents index to delete associated documents
    const index = documentStore.index('projectId');
    const request = index.openCursor(IDBKeyRange.only(projectId));

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve(true);
      }
    };

    request.onerror = () => {
      reject('Error performing project cascade deletion');
    };
  });
};

// --- CATEGORIES ---

export const getCategories = async () => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.getAll();

    request.onsuccess = () => {
      const categories = request.result.sort((a, b) => a.createdAt - b.createdAt);
      resolve(categories);
    };

    request.onerror = () => {
      reject('Error fetching categories');
    };
  });
};

export const addCategory = async (name, description = '') => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readwrite');
    const store = transaction.objectStore('categories');
    
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = { id, name, description, createdAt: Date.now() };
    
    const request = store.add(category);

    request.onsuccess = () => {
      resolve(category);
    };

    request.onerror = () => {
      reject('Category with this name already exists or database error.');
    };
  });
};

export const deleteCategory = async (id) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject('Error deleting category');
    };
  });
};

// --- DOCUMENTS ---

export const getDocuments = async () => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('documents', 'readonly');
    const store = transaction.objectStore('documents');
    const request = store.getAll();

    request.onsuccess = () => {
      // Map legacy documents without projectId to default project
      const docs = request.result.map(doc => ({
        ...doc,
        projectId: doc.projectId || 'default'
      })).sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(docs);
    };

    request.onerror = () => {
      reject('Error fetching documents');
    };
  });
};

export const getDocument = async (id) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('documents', 'readonly');
    const store = transaction.objectStore('documents');
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        request.result.projectId = request.result.projectId || 'default';
      }
      resolve(request.result);
    };

    request.onerror = () => {
      reject('Error fetching document ' + id);
    };
  });
};

export const saveDocument = async (doc) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('documents', 'readwrite');
    const store = transaction.objectStore('documents');
    
    const docToSave = {
      ...doc,
      projectId: doc.projectId || 'default', // Default if not specified
      updatedAt: Date.now()
    };
    
    if (!docToSave.id) {
      docToSave.id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      docToSave.createdAt = Date.now();
    }

    const request = store.put(docToSave);

    request.onsuccess = () => {
      resolve(docToSave);
    };

    request.onerror = (e) => {
      reject('Error saving document: ' + e.target.error);
    };
  });
};

export const deleteDocument = async (id) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('documents', 'readwrite');
    const store = transaction.objectStore('documents');
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject('Error deleting document');
    };
  });
};
