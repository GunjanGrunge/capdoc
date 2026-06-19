import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Plus, 
  Search, 
  Download, 
  ArrowLeft, 
  Edit3, 
  Eye, 
  Save, 
  Trash2, 
  BookOpen, 
  Cpu, 
  Layers, 
  Check, 
  Info, 
  AlertTriangle,
  ExternalLink,
  Code,
  FileSpreadsheet,
  ChevronDown,
  Briefcase,
  Edit2,
  X,
  MessageSquare,
  Sparkles,
  Send
} from 'lucide-react';
import { 
  initDB, 
  getCategories, 
  addCategory as dbAddCategory, 
  deleteCategory as dbDeleteCategory, 
  getDocuments, 
  saveDocument as dbSaveDocument, 
  deleteDocument as dbDeleteDocument,
  getProjects,
  saveProject as dbSaveProject,
  deleteProject as dbDeleteProject
} from './utils/db';
import { 
  exportToPDF, 
  exportToWord, 
  exportDocumentationIndexToExcel, 
  downloadBinaryFile 
} from './utils/exporter';
import DocumentModal from './components/DocumentModal';
import Github from './components/GithubIcon';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [categories, setCategories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Projects Context
  const [currentProjectId, setCurrentProjectId] = useState('default');
  const [isProjDropdownOpen, setIsProjDropdownOpen] = useState(false);
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  
  // Project CRUD Form State
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');

  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'markdown' | 'html' | 'excel'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Sub-panels
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Active View Document (Split screen mode)
  const [activeDoc, setActiveDoc] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [viewerMode, setViewerMode] = useState('split'); // 'split' | 'edit' | 'preview'
  
  // Excel Sheet Rendering State
  const [excelSheets, setExcelSheets] = useState([]); // [{ name, html }]
  const [activeExcelSheetIndex, setActiveExcelSheetIndex] = useState(0);

  // Chatbot Panel State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am CapDoc AI, your documentation assistant. I can help search and find documents in your workspace, or answer questions about files.',
      timestamp: Date.now()
    },
    {
      id: 2,
      sender: 'bot',
      text: '🤖 Feature Coming Soon: Semantic searches and automated documentation editing via LLM integration. Let me know what you would like me to assist with!',
      timestamp: Date.now() + 10
    }
  ]);

  // Export Template Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDoc, setExportDoc] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'word'
  const [exportCompany, setExportCompany] = useState('ABC Company');
  const [exportProject, setExportProject] = useState('ABC Project');
  const [exportTitle, setExportTitle] = useState('ABC');
  const [exportSubtitle, setExportSubtitle] = useState('API Documentation');

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Intro Splash & Progress Bar States
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [isIntroFade, setIsIntroFade] = useState(false);
  const [progressState, setProgressState] = useState({ active: false, percent: 0, title: '', desc: '' });

  // Handle intro splash timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroFade(true);
      const removeTimer = setTimeout(() => {
        setIsIntroActive(false);
      }, 800);
      return () => clearTimeout(removeTimer);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Run simulated crawling ant progress bar
  const runSimulatedProgress = (title, desc, onComplete) => {
    setProgressState({ active: true, percent: 0, title, desc });
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 12) + 6; // random increment between 6% and 18%
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setProgressState(prev => ({ ...prev, percent: 100 }));
        setTimeout(() => {
          setProgressState({ active: false, percent: 0, title: '', desc: '' });
          onComplete();
        }, 500);
      } else {
        setProgressState(prev => ({ ...prev, percent: current }));
      }
    }, 120);
  };

  // Load Initial Data
  useEffect(() => {
    const startup = async () => {
      const ready = await initDB();
      if (ready) {
        setDbReady(true);
        loadData();
      } else {
        addToast('IndexedDB failed to initialize. Storage will be transient.', 'error');
      }
    };
    startup();
  }, []);

  const loadData = async () => {
    try {
      const cats = await getCategories();
      const docs = await getDocuments();
      const projs = await getProjects();
      
      setCategories(cats);
      setDocuments(docs);
      setProjects(projs);
      
      // Auto-fallback if the project is deleted or not found
      if (projs.length > 0 && !projs.find(p => p.id === currentProjectId)) {
        setCurrentProjectId(projs[0].id);
      }
    } catch (error) {
      console.error('Error loading database tables:', error);
    }
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Project Actions
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      const saved = await dbSaveProject({
        name: newProjName.trim(),
        description: newProjDesc.trim()
      });
      addToast(`Project "${saved.name}" created!`, 'success');
      setNewProjName('');
      setNewProjDesc('');
      setCurrentProjectId(saved.id); // switch context to new project
      loadData();
    } catch (error) {
      addToast('Failed to create project.', 'error');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject || !editProjName.trim()) return;

    try {
      const updated = await dbSaveProject({
        ...editingProject,
        name: editProjName.trim(),
        description: editProjDesc.trim()
      });
      addToast(`Project "${updated.name}" updated!`, 'success');
      setEditingProject(null);
      setEditProjName('');
      setEditProjDesc('');
      loadData();
    } catch (error) {
      addToast('Failed to update project.', 'error');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (projectId === 'default') {
      addToast('Cannot delete default system project.', 'warning');
      return;
    }

    if (window.confirm('WARNING: Deleting this project will permanently delete all its associated documents. This action cannot be undone. Proceed?')) {
      try {
        await dbDeleteProject(projectId);
        addToast('Project and associated documents deleted.', 'success');
        
        if (currentProjectId === projectId) {
          setCurrentProjectId('default');
        }
        loadData();
      } catch (error) {
        addToast('Failed to delete project: ' + error, 'error');
      }
    }
  };

  // Category Actions
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await dbAddCategory(newCatName.trim(), newCatDesc.trim());
      addToast(`Category "${newCatName}" added!`, 'success');
      setNewCatName('');
      setNewCatDesc('');
      setIsAddCategoryOpen(false);
      loadData();
    } catch (error) {
      addToast(error, 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (['process', 'product', 'code'].includes(id)) {
      addToast('Cannot delete default system categories.', 'warning');
      return;
    }

    if (window.confirm('Are you sure you want to delete this category? Linked documents will not be deleted but will become uncategorized.')) {
      try {
        await dbDeleteCategory(id);
        
        // Update any documents belonging to this category to 'uncategorized'
        const affectedDocs = documents.filter(doc => doc.category === id);
        for (const doc of affectedDocs) {
          await dbSaveDocument({
            ...doc,
            category: 'uncategorized'
          });
        }

        if (selectedCategory === id) {
          setSelectedCategory('all');
        }
        addToast('Category deleted successfully.', 'success');
        loadData();
      } catch (error) {
        addToast('Failed to delete category.', 'error');
      }
    }
  };

  // Document Actions
  const handleSaveDocument = async (docData) => {
    runSimulatedProgress('Importing Documentation', `Uploading and processing "${docData.title}"...`, async () => {
      try {
        const saved = await dbSaveDocument(docData);
        addToast(`Document "${saved.title}" saved successfully!`, 'success');
        loadData();
      } catch (error) {
        addToast('Failed to save document: ' + error, 'error');
      }
    });
  };

  const handleUpdateActiveDocument = async () => {
    if (!activeDoc) return;
    runSimulatedProgress('Saving Modifications', `Writing content changes for "${editedTitle}"...`, async () => {
      try {
        const updated = {
          ...activeDoc,
          title: editedTitle,
          content: editedContent
        };
        await dbSaveDocument(updated);
        setActiveDoc(updated);
        addToast('Document saved successfully.', 'success');
        loadData();
      } catch (error) {
        addToast('Failed to update document: ' + error, 'error');
      }
    });
  };

  const handleDeleteDocument = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await dbDeleteDocument(id);
        addToast(`Deleted document "${title}".`, 'success');
        if (activeDoc?.id === id) {
          setActiveDoc(null);
        }
        loadData();
      } catch (error) {
        addToast('Failed to delete document.', 'error');
      }
    }
  };

  // Trigger file download
  const handleDownload = (doc) => {
    runSimulatedProgress('Downloading Asset Source', `Retrieving original file data for "${doc.title}"...`, () => {
      if (doc.type === 'excel') {
        downloadBinaryFile(doc.content, doc.fileName || `${doc.title}.xlsx`, 'excel');
        addToast(`Excel spreadsheet "${doc.fileName || doc.title}" downloaded.`, 'success');
      } else if (doc.type === 'html') {
        downloadBinaryFile(doc.content, doc.fileName || `${doc.title}.html`, 'html');
        addToast(`HTML document "${doc.fileName || doc.title}" downloaded.`, 'success');
      } else {
        downloadBinaryFile(doc.content, doc.fileName || `${doc.title}.md`, 'markdown');
        addToast(`Markdown source "${doc.fileName || doc.title}" downloaded.`, 'success');
      }
    });
  };

  // Trigger Export Options Dialog
  const triggerExportFlow = (doc, format) => {
    const proj = projects.find(p => p.id === doc.projectId) || { name: 'ABC Project' };
    let defaultSub = 'API Documentation';
    if (doc.category === 'process') defaultSub = 'Process SOP Guide';
    if (doc.category === 'product') defaultSub = 'Product Specifications';

    setExportDoc(doc);
    setExportFormat(format);
    setExportCompany('ABC Company');
    setExportProject(proj.name || 'ABC Project');
    setExportTitle(doc.title || 'ABC');
    setExportSubtitle(defaultSub);
    setIsExportModalOpen(true);
  };

  // Export Confirmation Handler with Dynamic Placeholders
  const handleConfirmExport = async () => {
    if (!exportDoc) return;
    setIsExportModalOpen(false);

    runSimulatedProgress(
      `Compiling ${exportFormat.toUpperCase()} Document`,
      `Applying branded templates and converting layout for "${exportTitle}"...`,
      async () => {
        if (exportFormat === 'pdf') {
          addToast('Generating PDF file...', 'info');
          
          const printEl = document.createElement('div');
          printEl.id = 'temp-pdf-export-container';
          printEl.style.padding = '40px';
          printEl.style.backgroundColor = '#FFFFFF';
          
          let htmlContent = '';
          if (exportDoc.type === 'markdown') {
            htmlContent = window.marked ? window.marked.parse(exportDoc.content) : `<p>${exportDoc.content}</p>`;
          } else if (exportDoc.type === 'html') {
            let contentHtml = exportDoc.content;
            const bodyMatch = exportDoc.content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
              contentHtml = bodyMatch[1];
            }
            htmlContent = contentHtml;
          }

          printEl.innerHTML = `
            <div style="font-family: 'Inter', sans-serif; color: #1E293B; line-height: 1.6;">
              <!-- Header Template -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0070AD; padding-bottom: 12px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="background: linear-gradient(135deg, #0070AD 0%, #17ABDA 100%); color: white; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                    <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; color: white;" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5" />
                      <path d="M11 4C10 3 8 3 7.5 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                      <path d="M13 4C14 3 16 3 16.5 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                      <ellipse cx="12" cy="10" rx="2" ry="2.5" />
                      <ellipse cx="12" cy="16.5" rx="3" ry="4" />
                      <path d="M10 9C7.5 8.5 6 7 5 5.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                      <path d="M10 10C7.5 10.5 6.5 11.5 5.5 13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                      <path d="M10.5 13C8.5 14.5 7.5 16.5 7 19.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                      <path d="M14 9C16.5 8.5 18 7 19 5.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                      <path d="M14 10C16.5 10.5 17.5 11.5 18.5 13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                      <path d="M13.5 13C15.5 14.5 16.5 16.5 17 19.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    </svg>
                  </div>
                  <span style="font-family: 'Outfit'; font-size: 16px; font-weight: 700; color: #002C52;">${exportCompany}</span>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; font-weight: 600;">Project Workspace</span>
                  <div style="font-family: 'Outfit'; font-size: 14px; font-weight: 700; color: #0070AD;">${exportProject}</div>
                </div>
              </div>

              <!-- Document Info Banner -->
              <div style="background-color: #F8FAFC; border-left: 4px solid #17ABDA; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #17ABDA; letter-spacing: 1px; margin-bottom: 4px;">
                  ${exportSubtitle}
                </div>
                <h1 style="font-family: 'Outfit'; font-size: 24px; font-weight: 800; color: #002C52; margin: 0 0 6px 0; line-height: 1.2;">
                  ${exportTitle}
                </h1>
                <div style="font-size: 11px; color: #64748B;">
                  Last Updated: ${new Date(exportDoc.updatedAt).toLocaleDateString()} | Format: PDF Documentation
                </div>
              </div>

              <!-- Document Content -->
              <div class="markdown-preview" style="font-size: 14px;">
                ${htmlContent}
              </div>

              <!-- Footer Template -->
              <div style="margin-top: 48px; border-top: 1px solid #E2E8F0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94A3B8; font-weight: 500;">
                <span>© ${new Date().getFullYear()} ${exportCompany}. All rights reserved. Confidential.</span>
                <span>Workspace Ref: ${exportDoc.projectId}-${exportDoc.id}</span>
              </div>
            </div>
          `;

          document.body.appendChild(printEl);

          try {
            await exportToPDF('temp-pdf-export-container', `${exportTitle}.pdf`);
            addToast('PDF template generated & downloaded successfully!', 'success');
          } catch (err) {
            addToast(`PDF Export Failed: ${err.message || err}`, 'error');
          } finally {
            document.body.removeChild(printEl);
          }
        } else {
          // Word format template
          try {
            let htmlContent = '';
            if (exportDoc.type === 'markdown') {
              htmlContent = window.marked ? window.marked.parse(exportDoc.content) : `<p>${exportDoc.content}</p>`;
            } else {
              htmlContent = exportDoc.content;
            }

            const templateHtml = `
              <div style="border-bottom: 2px solid #0070AD; padding-bottom: 10px; margin-bottom: 20px;">
                <table style="width: 100%; border: none; margin-bottom: 0;">
                  <tr>
                    <td style="border: none; padding: 0;">
                      <span style="font-size: 14pt; font-weight: bold; color: #002C52;">${exportCompany}</span>
                    </td>
                    <td style="border: none; padding: 0; text-align: right;">
                      <span style="font-size: 10pt; color: #64748B;">Project: </span>
                      <span style="font-size: 11pt; font-weight: bold; color: #0070AD;">${exportProject}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #F8FAFC; border-left: 4px solid #17ABDA; padding: 12px; margin-bottom: 20px;">
                <div style="font-size: 9pt; font-weight: bold; color: #17ABDA; text-transform: uppercase;">${exportSubtitle}</div>
                <h1 style="font-size: 18pt; color: #002C52; margin: 4px 0 0 0;">${exportTitle}</h1>
                <p style="font-size: 8pt; color: #64748B; margin-top: 4px;">Last Updated: ${new Date(exportDoc.updatedAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                ${htmlContent}
              </div>
            `;

            exportToWord(templateHtml, `${exportTitle}.doc`);
            addToast('MS Word document template exported successfully!', 'success');
          } catch (error) {
            addToast('MS Word Export Failed.', 'error');
          }
        }
      }
    );
  };

  const handleExportInventory = () => {
    const activeProjectDocs = documents.filter(doc => doc.projectId === currentProjectId);
    if (activeProjectDocs.length === 0) {
      addToast('No documents in active project inventory to export.', 'warning');
      return;
    }
    exportDocumentationIndexToExcel(activeProjectDocs);
    addToast('Document inventory exported to CSV Spreadsheet.', 'success');
  };

  // Open Document in Split Viewer with Excel SheetJS Parsing
  const handleOpenViewer = (doc) => {
    setActiveDoc(doc);
    setEditedTitle(doc.title);
    setEditedContent(doc.content);
    
    if (doc.type === 'excel') {
      setViewerMode('preview'); // Binary Excel has no direct text editing
      
      try {
        if (!window.XLSX) {
          setExcelSheets([{ name: 'Error', html: '<p style="padding: 20px; color: var(--status-error)">Excel parsing engine CDN not loaded. Please connect to the internet.</p>' }]);
          setActiveExcelSheetIndex(0);
          return;
        }

        // Parse Excel binary encoded as base64 data URL
        const base64Data = doc.content.split(';base64,')[1] || doc.content;
        const workbook = window.XLSX.read(base64Data, { type: 'base64' });
        
        const sheets = workbook.SheetNames.map(name => {
          const worksheet = workbook.Sheets[name];
          // Convert sheet to HTML table
          const html = window.XLSX.utils.sheet_to_html(worksheet, { id: `sjs-sheet-${name}` });
          return { name, html };
        });

        setExcelSheets(sheets);
        setActiveExcelSheetIndex(0);
      } catch (error) {
        console.error('Error parsing Excel sheet:', error);
        setExcelSheets([{ name: 'Error', html: `<p style="padding: 20px; color: var(--status-error)">Error parsing spreadsheet: ${error.message}</p>` }]);
        setActiveExcelSheetIndex(0);
      }
    } else {
      setViewerMode('split');
    }
  };

  // Markdown parsing helper
  const getParsedHtml = (content) => {
    if (!window.marked) return '<p>Loading Markdown parser...</p>';
    try {
      return window.marked.parse(content);
    } catch (e) {
      return `<p>Parsing Error: ${e.message}</p>`;
    }
  };

  // Filter & Search computation (Filtered by currentProjectId)
  const filteredDocuments = documents.filter(doc => {
    // Project Isolation
    if (doc.projectId !== currentProjectId) return false;

    // Search matching
    const matchesSearch = searchQuery.trim() === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (doc.type !== 'excel' && doc.content.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category matching
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;

    // Type matching
    const matchesType = selectedType === 'all' || doc.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const activeProject = projects.find(p => p.id === currentProjectId) || { id: 'default', name: 'Alpha Synergy', description: 'Primary corporate client workspace' };

  // Calculate statistics for active project
  const projectDocsCount = documents.filter(d => d.projectId === currentProjectId).length;
  const processDocsCount = documents.filter(d => d.projectId === currentProjectId && d.category === 'process').length;
  const productDocsCount = documents.filter(d => d.projectId === currentProjectId && d.category === 'product').length;
  const codeDocsCount = documents.filter(d => d.projectId === currentProjectId && d.category === 'code').length;

  // Chat message submission handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: chatInput.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    // Simulate bot response after typing delay
    setTimeout(() => {
      setIsChatLoading(false);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `I received your query: "${userMsg.text}". In our upcoming release, I will connect to the LLM agent to semantically search the ${activeProject.name} repository and help retrieve or make edits to files. (Semantic Vector Search coming soon!)`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR PANEL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', color: 'var(--cap-blue)' }} fill="currentColor">
              {/* Head */}
              <circle cx="12" cy="5" r="1.5" />
              {/* Antennae */}
              <path d="M11 4C10 3 8 3 7.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M13 4C14 3 16 3 16.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              {/* Thorax */}
              <ellipse cx="12" cy="10" rx="2" ry="2.5" />
              {/* Abdomen */}
              <ellipse cx="12" cy="16.5" rx="3" ry="4" />
              {/* Left Legs */}
              <path d="M10 9C7.5 8.5 6 7 5 5.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M10 10C7.5 10.5 6.5 11.5 5.5 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M10.5 13C8.5 14.5 7.5 16.5 7 19.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              {/* Right Legs */}
              <path d="M14 9C16.5 8.5 18 7 19 5.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M14 10C16.5 10.5 17.5 11.5 18.5 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M13.5 13C15.5 14.5 16.5 16.5 17 19.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-text">CapDoc</div>
        </div>

        {/* Project Switcher section */}
        <div className="project-section">
          <div className="client-tag">Active Project</div>
          <div className="project-dropdown">
            <button 
              className="project-select-btn"
              onClick={() => setIsProjDropdownOpen(!isProjDropdownOpen)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Briefcase size={16} style={{ flexShrink: 0 }} />
                {activeProject.name}
              </span>
              <ChevronDown size={14} style={{ flexShrink: 0 }} />
            </button>

            {isProjDropdownOpen && (
              <div className="project-dropdown-menu">
                {projects.map(proj => (
                  <button
                    key={proj.id}
                    className={`project-dropdown-item ${proj.id === currentProjectId ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentProjectId(proj.id);
                      setIsProjDropdownOpen(false);
                    }}
                  >
                    <span>{proj.name}</span>
                    {proj.id === currentProjectId && <Check size={14} />}
                  </button>
                ))}
                <button
                  className="project-manage-btn"
                  onClick={() => {
                    setIsProjModalOpen(true);
                    setIsProjDropdownOpen(false);
                  }}
                >
                  Manage Projects
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-content">
          <h4 className="sidebar-title">Categories</h4>
          <ul className="category-list">
            <li>
              <button 
                className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <span>All Categories</span>
                <span className="category-count">{projectDocsCount}</span>
              </button>
            </li>
            
            {categories.map(cat => {
              const count = documents.filter(d => d.projectId === currentProjectId && d.category === cat.id).length;
              return (
                <li key={cat.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <button 
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{ flexGrow: 1 }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {cat.id === 'process' && <BookOpen size={16} />}
                      {cat.id === 'product' && <Layers size={16} />}
                      {cat.id === 'code' && <Cpu size={16} />}
                      {!['process', 'product', 'code'].includes(cat.id) && <Folder size={16} />}
                      {cat.name}
                    </span>
                    <span className="category-count">{count}</span>
                  </button>
                  
                  {!['process', 'product', 'code'].includes(cat.id) && (
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '0 8px', cursor: 'pointer', opacity: 0.7 }}
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {isAddCategoryOpen ? (
            <form onSubmit={handleAddCategory} style={{ marginTop: '16px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
              <input 
                type="text" 
                className="form-control"
                placeholder="Category Name"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)', marginBottom: '8px', fontSize: '13px' }}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                autoFocus
              />
              <input 
                type="text" 
                className="form-control"
                placeholder="Description (Optional)"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)', marginBottom: '8px', fontSize: '12px' }}
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}>Add</button>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }} onClick={() => setIsAddCategoryOpen(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="add-category-btn" onClick={() => setIsAddCategoryOpen(true)}>
              <Plus size={14} />
              Add Custom Category
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="client-tag">Workspace Client</div>
          <div className="client-name">Capgemini Client Portal</div>
          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '6px', textAlign: 'center' }}>
            Build By Gunjan Sakar with ❤️
          </div>
        </div>
      </aside>

      {/* MAIN SCREEN PANEL */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-bar">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search active project documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="action-group">
            <button className="btn btn-secondary" onClick={handleExportInventory}>
              <FileSpreadsheet size={16} />
              Export Inventory
            </button>
            <button className="btn btn-primary" onClick={() => setIsDocModalOpen(true)}>
              <Plus size={16} />
              Add Document
            </button>
          </div>
        </header>

        {/* Dashboard Panels */}
        <div className="dashboard-panel">
          <div className="dashboard-header">
            <div>
              <h2 className="panel-title">{activeProject.name} Inventory</h2>
              <p className="panel-desc">{activeProject.description || 'Manage and package client documents for this workspace.'}</p>
            </div>
          </div>

          {/* Stats Summary Cards */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <FileText size={20} />
              </div>
              <div>
                <div className="stat-value">{projectDocsCount}</div>
                <div className="stat-label">Project Documents</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper vibrant">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="stat-value">{processDocsCount}</div>
                <div className="stat-label">Process Docs</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <Layers size={20} />
              </div>
              <div>
                <div className="stat-value">{productDocsCount}</div>
                <div className="stat-label">Product Specs</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper orange">
                <Cpu size={20} />
              </div>
              <div>
                <div className="stat-value">{codeDocsCount}</div>
                <div className="stat-label">Developer References</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${selectedType === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedType('all')}
              >
                All Formats
              </button>
              <button 
                className={`filter-tab ${selectedType === 'markdown' ? 'active' : ''}`}
                onClick={() => setSelectedType('markdown')}
              >
                Markdown (.md)
              </button>
              <button 
                className={`filter-tab ${selectedType === 'html' ? 'active' : ''}`}
                onClick={() => setSelectedType('html')}
              >
                HTML Files
              </button>
              <button 
                className={`filter-tab ${selectedType === 'excel' ? 'active' : ''}`}
                onClick={() => setSelectedType('excel')}
              >
                Excel Sheets
              </button>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing {filteredDocuments.length} of {projectDocsCount} entries
            </div>
          </div>

          {/* Data Table */}
          <div className="table-container">
            {filteredDocuments.length === 0 ? (
              <div className="empty-state">
                <FileText className="empty-icon" />
                <h3>No Documentation Assets Found</h3>
                <p style={{ marginTop: '8px', maxWidth: '380px' }}>
                  No documents found for this project in the selected categories. Click "Add Document" to upload your first asset.
                </p>
              </div>
            ) : (
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Format</th>
                    <th>Source</th>
                    <th>Last Updated</th>
                    <th>Download / Export</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div className="doc-title-cell">
                          <div className={`doc-type-icon type-${doc.type}`}>
                            {doc.type === 'markdown' && <FileText size={16} />}
                            {doc.type === 'html' && <Code size={16} />}
                            {doc.type === 'excel' && <FileSpreadsheet size={16} />}
                          </div>
                          <div>
                            <span className="doc-title-text" onClick={() => handleOpenViewer(doc)}>
                              {doc.title}
                            </span>
                            {doc.source === 'github' && (
                              <a href={doc.githubUrl} target="_blank" rel="noreferrer" style={{ marginLeft: '8px', opacity: 0.6 }} title="View on GitHub">
                                <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${['process', 'product', 'code'].includes(doc.category) ? doc.category : 'custom'}`}>
                          {categories.find(c => c.id === doc.category)?.name || doc.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: '500' }}>
                          {doc.type === 'markdown' ? 'MD Text' : doc.type === 'html' ? 'HTML Code' : 'Excel Sheet'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {doc.source === 'github' ? 'GitHub Sync' : doc.source === 'upload' ? 'Local Upload' : 'Manual Entry'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleDownload(doc)}
                            title="Download original file"
                          >
                            <Download size={12} />
                            Source
                          </button>
                          
                          {doc.type !== 'excel' && (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'rgba(0, 112, 173, 0.3)', color: 'var(--cap-blue)' }}
                                onClick={() => triggerExportFlow(doc, 'pdf')}
                                title="Download PDF format"
                              >
                                PDF
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#6366F1' }}
                                onClick={() => triggerExportFlow(doc, 'word')}
                                title="Download Word format"
                              >
                                Word
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-cell">
                          <button 
                            className="action-icon-btn delete-btn" 
                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                            title="Delete document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* DOCUMENT CREATOR MODAL */}
      <DocumentModal 
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        categories={categories}
        onSave={handleSaveDocument}
        addToast={addToast}
        projectId={currentProjectId}
      />

      {/* PROJECT MANAGER MODAL */}
      {isProjModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Project Manager Settings</h3>
              <button className="modal-close" onClick={() => { setIsProjModalOpen(false); setEditingProject(null); }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <label className="form-label">Available Projects</label>
              <div className="project-manager-list">
                {projects.map(proj => (
                  <div key={proj.id} className="project-manager-item">
                    <div className="project-manager-info">
                      <span className="project-manager-name">{proj.name}</span>
                      <span className="project-manager-desc">{proj.description || 'No description provided'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="action-icon-btn" 
                        onClick={() => {
                          setEditingProject(proj);
                          setEditProjName(proj.name);
                          setEditProjDesc(proj.description || '');
                        }}
                        title="Edit Project Details"
                      >
                        <Edit2 size={13} />
                      </button>
                      {proj.id !== 'default' && (
                        <button 
                          className="action-icon-btn delete-btn"
                          onClick={() => handleDeleteProject(proj.id)}
                          title="Delete Project (and all its documents)"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit Project Form */}
              {editingProject ? (
                <form onSubmit={handleUpdateProject} style={{ padding: '14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13.5px', marginBottom: '10px', color: 'var(--cap-dark)' }}>Modify Project Details</h4>
                  <div className="form-group">
                    <label className="form-label">Project Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editProjName}
                      onChange={(e) => setEditProjName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Description</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editProjDesc}
                      onChange={(e) => setEditProjDesc(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setEditingProject(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Update Details</button>
                  </div>
                </form>
              ) : (
                /* Create Project Form */
                <form onSubmit={handleCreateProject} style={{ padding: '14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13.5px', marginBottom: '10px', color: 'var(--cap-dark)' }}>Create New Project</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Project Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Beta Dynamics"
                        value={newProjName}
                        onChange={(e) => setNewProjName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Client platform setup"
                        value={newProjDesc}
                        onChange={(e) => setNewProjDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px 0', fontSize: '13px' }}>
                    Create Project Workspace
                  </button>
                </form>
              )}
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setIsProjModalOpen(false); setEditingProject(null); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT CONFIGURATION MODAL */}
      {isExportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Configure Export Template</h3>
              <button className="modal-close" onClick={() => setIsExportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleConfirmExport(); }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Customize the branded template placeholders for your compiled **{exportFormat.toUpperCase()}** download.
                </p>
                <div className="form-group">
                  <label className="form-label">Company / Client Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={exportCompany}
                    onChange={(e) => setExportCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project Workspace Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={exportProject}
                    onChange={(e) => setExportProject(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Document Title</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={exportTitle}
                      onChange={(e) => setExportTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subtitle / Description</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={exportSubtitle}
                      onChange={(e) => setExportSubtitle(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsExportModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Download Branded {exportFormat.toUpperCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE FULL-SCREEN SPLIT PREVIEWER/EDITOR */}
      {activeDoc && (
        <div className="split-viewer-layout">
          <div className="viewer-header">
            <div className="viewer-title-area">
              <button 
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setActiveDoc(null)}
              >
                <ArrowLeft size={22} style={{ color: 'white' }} />
              </button>
              <input 
                type="text"
                className="viewer-title"
                style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(255,255,255,0.4)', color: 'white', outline: 'none', padding: '2px 4px', width: '280px' }}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                disabled={activeDoc.type === 'excel'}
              />
              <span className="viewer-category-tag">
                {categories.find(c => c.id === activeDoc.category)?.name || activeDoc.category}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {activeDoc.type !== 'excel' && (
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px' }}>
                  <button 
                    className={`filter-tab ${viewerMode === 'edit' ? 'active' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px', background: viewerMode === 'edit' ? 'white' : 'transparent', color: viewerMode === 'edit' ? 'var(--cap-dark)' : 'white' }}
                    onClick={() => setViewerMode('edit')}
                  >
                    <Edit3 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Editor
                  </button>
                  <button 
                    className={`filter-tab ${viewerMode === 'split' ? 'active' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px', background: viewerMode === 'split' ? 'white' : 'transparent', color: viewerMode === 'split' ? 'var(--cap-dark)' : 'white' }}
                    onClick={() => setViewerMode('split')}
                  >
                    Split
                  </button>
                  <button 
                    className={`filter-tab ${viewerMode === 'preview' ? 'active' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px', background: viewerMode === 'preview' ? 'white' : 'transparent', color: viewerMode === 'preview' ? 'var(--cap-dark)' : 'white' }}
                    onClick={() => setViewerMode('preview')}
                  >
                    <Eye size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Preview
                  </button>
                </div>
              )}

              {activeDoc.type !== 'excel' && (
                <>
                  <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => triggerExportFlow(activeDoc, 'pdf')}>
                    Download PDF
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => triggerExportFlow(activeDoc, 'word')}>
                    Download Word
                  </button>
                  <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={handleUpdateActiveDocument}>
                    <Save size={14} />
                    Save Changes
                  </button>
                </>
              )}
              {activeDoc.type === 'excel' && (
                <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => handleDownload(activeDoc)}>
                  <Download size={14} />
                  Download Excel File
                </button>
              )}
              <button className="btn btn-danger" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => setActiveDoc(null)}>
                Close Viewer
              </button>
            </div>
          </div>

          <div className="viewer-body">
            {/* Left Edit Pane (only visible in edit or split modes) */}
            {activeDoc.type !== 'excel' && (viewerMode === 'edit' || viewerMode === 'split') && (
              <div className="editor-pane" style={{ width: viewerMode === 'edit' ? '100%' : '50%' }}>
                <div className="pane-header">
                  <span>Source Text Editor ({activeDoc.type.toUpperCase()})</span>
                  <span>Character Count: {editedContent.length}</span>
                </div>
                <div className="pane-content">
                  <textarea 
                    className="code-textarea"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Enter document raw code / text source code here..."
                  />
                </div>
              </div>
            )}

            {/* Right Preview Pane (only visible in preview or split modes) */}
            {(viewerMode === 'preview' || viewerMode === 'split') && (
              <div className="preview-pane" style={{ width: viewerMode === 'preview' ? '100%' : '50%' }}>
                <div className="pane-header">
                  <span>Document Visual Layout Preview</span>
                  {activeDoc.type === 'excel' ? (
                    <span>Workbook Sheets: {excelSheets.length}</span>
                  ) : (
                    <span>Rendered Output</span>
                  )}
                </div>
                
                <div className="preview-pane-scrollable" id="active-document-preview-target" style={{ padding: activeDoc.type === 'excel' ? '0' : '32px' }}>
                  {activeDoc.type === 'markdown' && (
                    <div 
                      className="markdown-preview" 
                      dangerouslySetInnerHTML={{ __html: getParsedHtml(editedContent) }}
                    />
                  )}
                  
                  {activeDoc.type === 'html' && (
                    <iframe 
                      srcDoc={editedContent}
                      title="HTML Preview Frame"
                      sandbox="allow-same-origin"
                      style={{ border: 'none', width: '100%', height: '100%', minHeight: '600px', backgroundColor: '#FFFFFF' }}
                    />
                  )}

                  {activeDoc.type === 'excel' && (
                    <div className="excel-preview-container">
                      {/* Excel sheet tabs navigation */}
                      <div className="excel-sheet-tabs">
                        {excelSheets.map((sheet, index) => (
                          <button
                            key={sheet.name}
                            className={`excel-sheet-tab ${index === activeExcelSheetIndex ? 'active' : ''}`}
                            onClick={() => setActiveExcelSheetIndex(index)}
                          >
                            {sheet.name}
                          </button>
                        ))}
                      </div>
                      
                      {/* Excel active sheet HTML table */}
                      <div className="excel-table-container">
                        {excelSheets[activeExcelSheetIndex] ? (
                          <div 
                            dangerouslySetInnerHTML={{ __html: excelSheets[activeExcelSheetIndex].html }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            No sheets available or error parsing workbook.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING ACTION CHAT TRIGGER */}
      <button 
        className="chatbot-trigger" 
        onClick={() => setIsChatOpen(!isChatOpen)}
        title="Open CapDoc AI Assistant"
      >
        <MessageSquare size={24} />
      </button>

      {/* CHATBOT DIALOG PANEL */}
      {isChatOpen && (
        <div className="chatbot-panel">
          <div className="chat-header">
            <div className="chat-header-title">
              <Sparkles size={16} style={{ color: 'var(--cap-vibrant)', animation: 'pulse-blue 2s infinite' }} />
              <span>CapDoc AI Assistant</span>
              <span className="chat-status-badge">Design Preview</span>
            </div>
            <button 
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => setIsChatOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="chat-messages">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isChatLoading && (
              <div className="chat-bubble loading">
                CapDoc AI is compiling response...
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input 
              type="text" 
              className="chat-input"
              placeholder="Ask me to search or edit documentation..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatLoading}
            />
            <button type="submit" className="chat-send-btn" disabled={isChatLoading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* TOAST SYSTEM POPUPS */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className={`toast-icon ${t.type}`}>
              {t.type === 'success' && <Check size={16} />}
              {t.type === 'info' && <Info size={16} />}
              {t.type === 'warning' && <AlertTriangle size={16} />}
              {t.type === 'error' && <X size={16} />}
            </span>
            <div>{t.message}</div>
          </div>
        ))}
      </div>

      {/* INTRO SPLASH SCREEN */}
      {isIntroActive && (
        <div className={`intro-splash ${isIntroFade ? 'fade-out' : ''}`}>
          <div className="intro-logo-wrapper">
            <div className="intro-logo-glow"></div>
            <svg className="intro-ant-svg" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <path d="M11 4C10 3 8 3 7.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M13 4C14 3 16 3 16.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <ellipse cx="12" cy="10" rx="2" ry="2.5" />
              <ellipse cx="12" cy="16.5" rx="3" ry="4" />
              <path d="M10 9C7.5 8.5 6 7 5 5.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M10 10C7.5 10.5 6.5 11.5 5.5 13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M10.5 13C8.5 14.5 7.5 16.5 7 19.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M14 9C16.5 8.5 18 7 19 5.5" fill="none" stroke="currentColor" stroke-width="1.2" strokeLinecap="round" />
              <path d="M14 10C16.5 10.5 17.5 11.5 18.5 13" fill="none" stroke="currentColor" stroke-width="1.2" strokeLinecap="round" />
              <path d="M13.5 13C15.5 14.5 16.5 16.5 17 19.5" fill="none" stroke="currentColor" stroke-width="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="intro-text-wrapper">
            <h1 className="intro-title">
              CapDoc Portal
            </h1>
            <p className="intro-subtitle">Documentation Hub</p>
          </div>
        </div>
      )}

      {/* CRAWLING ANT PROGRESS BAR OVERLAY */}
      {progressState.active && (
        <div className="progress-overlay">
          <div className="progress-card">
            <div className="progress-header">
              <h3 className="progress-title">{progressState.title}</h3>
              <p className="progress-desc">{progressState.desc}</p>
            </div>
            
            <div className="progress-track-wrapper">
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressState.percent}%` }}
                ></div>
                
                <div 
                  className={`crawling-ant ${progressState.percent < 100 ? 'crawling' : ''}`}
                  style={{ left: `${progressState.percent}%` }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" />
                    <path d="M11 4C10 3 8 3 7.5 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    <path d="M13 4C14 3 16 3 16.5 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    <ellipse cx="12" cy="10" rx="2" ry="2.5" />
                    <ellipse cx="12" cy="16.5" rx="3" ry="4" />
                    <path d="M10 9C7.5 8.5 6 7 5 5.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    <path d="M10 10C7.5 10.5 6.5 11.5 5.5 13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    <path d="M10.5 13C8.5 14.5 7.5 16.5 7 19.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    <path d="M14 9C16.5 8.5 18 7 19 5.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    <path d="M14 10C16.5 10.5 17.5 11.5 18.5 13" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    <path d="M13.5 13C15.5 14.5 16.5 16.5 17 19.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                  </svg>
                </div>
                
                <div className="progress-finish-line"></div>
              </div>
            </div>
            
            <div className="progress-percent-label">
              {progressState.percent}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
