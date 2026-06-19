import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, Loader } from 'lucide-react';
import Github from './GithubIcon';
import { fetchGitHubFile } from '../utils/github';

export default function DocumentModal({ isOpen, onClose, categories, onSave, addToast, projectId }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'github' | 'manual'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'process');
  const [type, setType] = useState('markdown'); // 'markdown' | 'html' | 'excel'
  
  // File upload state
  const [fileContent, setFileContent] = useState('');
  const [selectedFileLabel, setSelectedFileLabel] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // GitHub state
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubPath, setGithubPath] = useState('README.md');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);

  // Manual state
  const [manualText, setManualText] = useState('# New Document\n\nWrite your markdown content here...');

  const resetForm = () => {
    setTitle('');
    setCategory(categories[0]?.id || 'process');
    setType('markdown');
    setFileContent('');
    setSelectedFileLabel('');
    setGithubUrl('');
    setGithubBranch('main');
    setGithubPath('README.md');
    setManualText('# New Document\n\nWrite your markdown content here...');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelectClick = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    const name = file.name;
    const extension = name.split('.').pop().toLowerCase();
    
    // Default title to file name without extension
    setTitle(name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();

    if (extension === 'md') {
      setType('markdown');
      reader.onload = (event) => {
        setFileContent(event.target.result);
        setSelectedFileLabel(file.name);
      };
      reader.readAsText(file);
    } else if (extension === 'html' || extension === 'htm') {
      setType('html');
      reader.onload = (event) => {
        setFileContent(event.target.result);
        setSelectedFileLabel(file.name);
      };
      reader.readAsText(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      setType('excel');
      reader.onload = (event) => {
        setFileContent(event.target.result); // Base64 Data URL
        setSelectedFileLabel(file.name);
      };
      reader.readAsDataURL(file);
    } else {
      addToast('Unsupported file type. Please upload .md, .html, or .xlsx/.xls files.', 'error');
    }
  };

  // Fetch GitHub file
  const handleGithubFetch = async () => {
    if (!githubUrl) {
      addToast('Please enter a GitHub repository or file URL.', 'warning');
      return;
    }

    setIsFetchingGithub(true);
    try {
      let finalUrl = githubUrl;
      // If they just gave a repo, construct a path
      if (!githubUrl.includes('blob/') && githubPath) {
        // Strip trailing slash if present
        const cleanRepo = githubUrl.replace(/\/$/, '');
        finalUrl = `${cleanRepo}/blob/${githubBranch}/${githubPath}`;
      }

      const result = await fetchGitHubFile(finalUrl);
      
      setTitle(result.fileName.replace(/\.[^/.]+$/, ""));
      setFileContent(result.content);
      setType(result.fileName.endsWith('.html') ? 'html' : 'markdown');
      setSelectedFileLabel(`Synced: ${result.fileName}`);
      addToast('Document fetched from GitHub successfully!', 'success');
      
      // Auto switch tabs to uploaded/loaded to review it, or let user save
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast('Please enter a document title.', 'warning');
      return;
    }

    let finalContent = '';
    let finalSource = '';
    let finalGithubUrl = '';

    if (activeTab === 'upload') {
      if (!fileContent) {
        addToast('Please upload a file or fetch content first.', 'warning');
        return;
      }
      finalContent = fileContent;
      finalSource = 'upload';
    } else if (activeTab === 'github') {
      if (!fileContent) {
        addToast('Please fetch the file from GitHub before saving.', 'warning');
        return;
      }
      finalContent = fileContent;
      finalSource = 'github';
      finalGithubUrl = githubUrl;
    } else {
      // Manual tab
      finalContent = manualText;
      finalSource = 'manual';
      // Manual markdown document
      setType('markdown');
    }

    const documentData = {
      title,
      category,
      type,
      content: finalContent,
      source: finalSource,
      githubUrl: finalGithubUrl,
      projectId,
      fileName: selectedFileLabel || `${title}.${type === 'markdown' ? 'md' : type === 'html' ? 'html' : 'xlsx'}`
    };

    onSave(documentData);
    handleClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Add Documentation Asset</h3>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            type="button" 
            className={`modal-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            File Upload
          </button>
          <button 
            type="button" 
            className={`modal-tab-btn ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            <Github size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            GitHub Sync
          </button>
          <button 
            type="button" 
            className={`modal-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('manual');
              setType('markdown'); // manual is always markdown
            }}
          >
            <FileText size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Create Manual
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. API Client Onboarding" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Category</label>
                <select 
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TAB 1: FILE UPLOAD */}
            {activeTab === 'upload' && (
              <div className="form-group">
                <label className="form-label">Upload Document File</label>
                <div 
                  className={`dropzone ${dragOver ? 'pulse-active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleFileSelectClick}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                    accept=".md,.html,.htm,.xlsx,.xls"
                  />
                  <Upload className="dropzone-icon" />
                  <p className="dropzone-title">
                    {selectedFileLabel ? 'Change selected file' : 'Drag & drop file here or click to browse'}
                  </p>
                  <p className="dropzone-subtitle">
                    Supports Markdown (.md), HTML (.html) or Excel (.xlsx, .xls)
                  </p>
                </div>
                {selectedFileLabel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: 'var(--status-success)', fontSize: '13px', fontWeight: '500' }}>
                    <CheckCircle size={16} />
                    <span>Loaded: {selectedFileLabel} ({type.toUpperCase()} Format)</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GITHUB SYNC */}
            {activeTab === 'github' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">GitHub Repository URL</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="https://github.com/username/project" 
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">File Path</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={githubPath}
                      placeholder="README.md or docs/setup.md"
                      onChange={(e) => setGithubPath(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleGithubFetch}
                  disabled={isFetchingGithub}
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  {isFetchingGithub ? (
                    <>
                      <Loader size={16} className="pulse-active" style={{ marginRight: '8px' }} />
                      Fetching Repository Content...
                    </>
                  ) : (
                    <>
                      <Github size={16} style={{ marginRight: '8px' }} />
                      Fetch Content from GitHub
                    </>
                  )}
                </button>

                {selectedFileLabel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: 'var(--status-success)', fontSize: '13px', fontWeight: '500' }}>
                    <CheckCircle size={16} />
                    <span>File Fetched: {selectedFileLabel}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MANUAL EDIT */}
            {activeTab === 'manual' && (
              <div className="form-group">
                <label className="form-label">Markdown Source Code</label>
                <textarea 
                  className="form-control"
                  rows={8}
                  style={{ fontFamily: 'Consolas, monospace', fontSize: '13px', resize: 'vertical' }}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                />
              </div>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Documentation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
