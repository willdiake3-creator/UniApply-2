import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, Trash2, CheckCircle2, Loader2, Sparkles, AlertCircle, 
  Calendar, HardDrive, Check, Info, Folder, Search, ArrowLeft, Cloud, CloudUpload
} from 'lucide-react';
import { DocumentRecord, DocumentType } from '../types';

interface DocumentVaultProps {
  documents: DocumentRecord[];
  onUpload: (file: File, docType: DocumentType) => Promise<void>;
  onDelete: (id: string) => void;
  onConfirmAutofill: () => void;
  onImportFromDrive: (fileId: string, docType: DocumentType) => Promise<boolean>;
  onExportToDrive: (documentId: string) => Promise<boolean>;
  googleConnected: boolean;
  onConnectGoogle: () => void;
}

export default function DocumentVault({
  documents,
  onUpload,
  onDelete,
  onConfirmAutofill,
  onImportFromDrive,
  onExportToDrive,
  googleConnected,
  onConnectGoogle
}: DocumentVaultProps) {
  const [docType, setDocType] = useState<DocumentType>('Transcript');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<DocumentRecord | null>(null);

  // Regional Tailoring states
  const [tailorRegion, setTailorRegion] = useState('Europe');
  const [tailorField, setTailorField] = useState('Computer Science');
  const [tailoring, setTailoring] = useState(false);
  const [tailoringError, setTailoringError] = useState('');
  const [activePaneTab, setActivePaneTab] = useState<'extract' | 'tailor'>('extract');

  // Google Drive states
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderHistory, setFolderHistory] = useState<string[]>(['root']);
  const [driveSearch, setDriveSearch] = useState('');
  const [importingFileId, setImportingFileId] = useState<string | null>(null);
  const [exportingDocId, setExportingDocId] = useState<string | null>(null);

  const fetchDriveFiles = async (folderId = 'root', search = '') => {
    setDriveLoading(true);
    try {
      const token = localStorage.getItem('google_access_token');
      const res = await fetch(`/api/drive/files?folderId=${folderId}&search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data);
      } else {
        console.error('Failed to fetch Drive files');
      }
    } catch (err) {
      console.error('Error fetching Drive files:', err);
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    if (showDriveModal && googleConnected) {
      fetchDriveFiles(currentFolderId, driveSearch);
    }
  }, [showDriveModal, currentFolderId, driveSearch, googleConnected]);

  const handleFileClick = async (file: any) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const newHistory = [...folderHistory, file.id];
      setFolderHistory(newHistory);
      setCurrentFolderId(file.id);
    } else {
      setImportingFileId(file.id);
      const success = await onImportFromDrive(file.id, docType);
      setImportingFileId(null);
      if (success) {
        setShowDriveModal(false);
      }
    }
  };

  const handleBackFolder = () => {
    if (folderHistory.length > 1) {
      const newHistory = folderHistory.slice(0, -1);
      setFolderHistory(newHistory);
      setCurrentFolderId(newHistory[newHistory.length - 1]);
    }
  };

  const handleExport = async (docId: string) => {
    setExportingDocId(docId);
    await onExportToDrive(docId);
    setExportingDocId(null);
  };

  const handleTailorDocument = async () => {
    if (!selectedDocForDetails) return;
    setTailoring(true);
    setTailoringError('');
    try {
      const res = await fetch(`/api/documents/${selectedDocForDetails.id}/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: tailorRegion, fieldOfStudy: tailorField })
      });
      const data = await res.json();
      if (res.ok) {
        selectedDocForDetails.tailoringSuggestions = data.suggestions;
        // force state update
        setSelectedDocForDetails({ ...selectedDocForDetails });
      } else {
        setTailoringError(data.error || 'Failed to analyze.');
      }
    } catch (err) {
      console.error(err);
      setTailoringError('Network error occurred.');
    } finally {
      setTailoring(false);
    }
  };

  function parseBoldText(text: string) {
    const parts = text.split('**');
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-slate-800">{part}</strong> : part);
  }

  function renderMarkdown(text: string) {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return (
          <h3 key={idx} className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider mt-5 mb-2.5 flex items-center gap-1 border-b border-indigo-50 pb-1">
            {trimmed.replace('###', '').trim()}
          </h3>
        );
      }
      if (trimmed.startsWith('####')) {
        return (
          <h4 key={idx} className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mt-3.5 mb-1.5 font-mono">
            {trimmed.replace('####', '').trim()}
          </h4>
        );
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const content = trimmed.substring(1).trim();
        return (
          <li key={idx} className="text-[11px] text-slate-600 leading-relaxed list-none pl-3 border-l-2 border-slate-200 py-0.5 my-1 hover:border-blue-400 transition-colors">
            {parseBoldText(content)}
          </li>
        );
      }
      if (trimmed.startsWith('❌')) {
        return (
          <div key={idx} className="text-[11px] text-red-800 leading-normal bg-red-50/50 p-2.5 rounded border border-red-100 my-2 font-sans flex gap-1.5 items-start">
            <span className="shrink-0">❌</span>
            <span>{parseBoldText(trimmed.replace('❌', '').trim())}</span>
          </div>
        );
      }
      if (trimmed) {
        return (
          <p key={idx} className="text-[11px] text-slate-500 leading-relaxed my-1.5">
            {parseBoldText(trimmed)}
          </p>
        );
      }
      return <div key={idx} className="h-1" />;
    });
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file, docType);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in relative z-10 text-slate-200">
      
      {/* Left side: Uploader & Active List */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Document Uploader Card */}
        <div className="glass-card-dark rounded-xl border border-white/5 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
                Upload New Academic & Travel Credentials
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Select your document type and drop the file. Gemini AI will automatically parse the file to fill your profile.
              </p>
            </div>
            
            <button
              onClick={() => {
                if (!googleConnected) {
                  onConnectGoogle();
                } else {
                  setShowDriveModal(true);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10 shrink-0 cursor-pointer"
            >
              <Cloud className="h-4 w-4" />
              Import from Google Drive
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Document Type:</span>
            <div className="flex flex-wrap gap-2">
              {(['Transcript', 'CV', 'Passport', 'Statement of Purpose', 'Diploma', 'Letter of Recommendation', 'Other'] as DocumentType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                    docType === type
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-white/15 hover:border-blue-500 bg-white/5 hover:bg-white/10'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />
            {uploading ? (
              <div className="space-y-3 py-4">
                <Loader2 className="h-10 w-10 text-blue-400 animate-spin mx-auto" />
                <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Dispatching file to Gemini AI Document Parser...</p>
                <p className="text-[10px] text-slate-400 font-mono">Processing text and credentials structure...</p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="h-12 w-12 rounded bg-white/5 border border-white/10 text-blue-400 flex items-center justify-center mx-auto shadow-md">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">
                    Drag & Drop your {docType} or <span className="text-blue-400 hover:underline">browse files</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Supports PDF, DOCX, PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="glass-card-dark rounded-xl border border-white/5 p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans flex items-center gap-1.5">
            Your Secure Document Vault ({documents.length})
          </h3>

          {documents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2 rounded-xl border border-white/5">
              <FileText className="h-8 w-8 mx-auto text-slate-400" />
              <p>Your secure document vault is currently empty.</p>
              <p>Upload a transcript or CV to kickstart AI auto-fill.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDocForDetails(doc)}
                  className={`flex items-center justify-between py-3.5 px-3 rounded-lg transition-colors cursor-pointer ${
                    selectedDocForDetails?.id === doc.id ? 'bg-white/10 border-l-2 border-blue-500' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-white/5 border border-white/10 text-slate-300">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[300px]">
                          {doc.name}
                        </span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-300 uppercase font-mono border border-white/5">
                          {doc.docType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wide font-mono">
                        <span className="flex items-center gap-0.5"><HardDrive className="h-3 w-3" /> {doc.fileSize}</span>
                        <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    {doc.status === 'processing' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Analyzing...
                      </span>
                    ) : doc.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        AI Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-300 border border-red-500/20">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        Failed
                      </span>
                    )}

                    {doc.status === 'completed' && (
                      <button
                        onClick={() => handleExport(doc.id)}
                        disabled={exportingDocId === doc.id}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent rounded transition-colors cursor-pointer disabled:opacity-50"
                        title="Backup to Google Drive"
                      >
                        {exportingDocId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        ) : (
                          <CloudUpload className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Interactive Gemini AI Metadata Extractor & Tailor Card */}
      <div className="glass-card-dark rounded-xl border border-white/5 p-5 shadow-xl space-y-4">
        {selectedDocForDetails && (selectedDocForDetails.docType === 'CV' || selectedDocForDetails.docType === 'Statement of Purpose') ? (
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActivePaneTab('extract')}
              className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 text-center cursor-pointer transition-colors ${
                activePaneTab === 'extract'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              AI Extraction
            </button>
            <button
              onClick={() => setActivePaneTab('tailor')}
              className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 text-center cursor-pointer transition-colors ${
                activePaneTab === 'tailor'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Regional Tailor
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Sparkles className="h-4 w-4 text-indigo-400 fill-indigo-500/10 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
              Gemini AI Extraction Insights
            </h2>
          </div>
        )}

        {selectedDocForDetails ? (
          <div className="space-y-4 animate-slide-up">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Active File</span>
              <p className="text-xs font-bold text-white truncate">{selectedDocForDetails.name}</p>
            </div>

            {selectedDocForDetails.status === 'processing' ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-3">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
                <p className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">AI is digesting your file structure...</p>
                <p className="text-slate-500 text-[10px] font-mono">Applying natural language comprehension algorithms.</p>
              </div>
            ) : activePaneTab === 'extract' || (selectedDocForDetails.docType !== 'CV' && selectedDocForDetails.docType !== 'Statement of Purpose') ? (
              selectedDocForDetails.extractedData ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300 flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="leading-normal text-[11px]">
                      Confirm autofilled details below. Accepting metadata automatically synchronizes your Profile.
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs border-y border-white/5 py-3 font-mono">
                    {selectedDocForDetails.extractedData.name && (
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-sans text-[10px] font-bold uppercase tracking-wider">Full Name:</span>
                        <span className="font-bold text-white">{selectedDocForDetails.extractedData.name}</span>
                      </div>
                    )}
                    {selectedDocForDetails.extractedData.gpa && (
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-sans text-[10px] font-bold uppercase tracking-wider">GPA:</span>
                        <span className="font-bold text-emerald-400">
                          {selectedDocForDetails.extractedData.gpa} / {selectedDocForDetails.extractedData.gpaScale || '4.0'}
                        </span>
                      </div>
                    )}
                    {selectedDocForDetails.extractedData.institution && (
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-sans text-[10px] font-bold uppercase tracking-wider">Institution:</span>
                        <span className="font-bold text-white truncate max-w-[150px]">
                          {selectedDocForDetails.extractedData.institution}
                        </span>
                      </div>
                    )}
                    {selectedDocForDetails.extractedData.nationality && (
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-sans text-[10px] font-bold uppercase tracking-wider">Nationality:</span>
                        <span className="font-bold text-white">{selectedDocForDetails.extractedData.nationality}</span>
                      </div>
                    )}
                    {selectedDocForDetails.extractedData.skills && selectedDocForDetails.extractedData.skills.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-slate-300 font-sans text-[10px] font-bold uppercase tracking-wider">Extracted Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedDocForDetails.extractedData.skills.map(s => (
                            <span key={s} className="bg-white/10 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border border-white/5">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onConfirmAutofill}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Check className="h-4 w-4" />
                    Accept & Sync Profile
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 border border-white/5 rounded-xl">
                  No structural insights available for this file.
                </div>
              )
            ) : (
              /* Tailor Pane */
              <div className="space-y-4">
                <div className="rounded-xl bg-white/5 border border-white/5 p-3.5 space-y-3 animate-fade-in">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Tailor Settings</p>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Target Region</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['Europe', 'North America', 'Asia'].map(r => (
                        <button
                          key={r}
                          onClick={() => setTailorRegion(r)}
                          className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
                            tailorRegion === r
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Field of Study</label>
                    <input
                      type="text"
                      value={tailorField}
                      onChange={(e) => setTailorField(e.target.value)}
                      placeholder="e.g. Computer Science, Business"
                      className="w-full px-2 py-1 border border-white/10 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/5 text-white placeholder-slate-400"
                    />
                  </div>

                  <button
                    onClick={handleTailorDocument}
                    disabled={tailoring}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-white/5 disabled:text-slate-500 disabled:cursor-not-allowed shadow-md"
                  >
                    {tailoring ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        AI Analysis Running...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Optimize with Gemini AI
                      </>
                    )}
                  </button>
                </div>

                {tailoringError && (
                  <p className="text-rose-400 font-mono text-[10px] bg-rose-500/10 p-2 rounded border border-rose-500/20">{tailoringError}</p>
                )}

                {selectedDocForDetails.tailoringSuggestions && (
                  <div className="border border-indigo-500/20 rounded-xl bg-indigo-500/5 backdrop-blur-md p-4 max-h-[300px] overflow-y-auto space-y-2 animate-slide-up">
                    <div className="flex items-center gap-1 border-b border-white/5 pb-2 mb-2">
                      <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest font-mono">Gemini Optimization Plan</span>
                    </div>
                    <div className="text-left font-sans text-xs">
                      {renderMarkdown(selectedDocForDetails.tailoringSuggestions)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2 border border-white/5 rounded-xl">
            <Sparkles className="h-6 w-6 mx-auto text-slate-400 animate-pulse" />
            <p>Click any processed file in your Vault to view Gemini AI's deep metadata insights.</p>
          </div>
        )}
      </div>

      {/* Google Drive Picker Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                    Import from Google Drive
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Importing file as: <span className="text-blue-400 font-bold uppercase">{docType}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDriveModal(false);
                  setCurrentFolderId('root');
                  setFolderHistory(['root']);
                  setDriveSearch('');
                }}
                className="text-slate-400 hover:text-white text-xs uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:bg-white/5 font-bold cursor-pointer transition-all"
              >
                Close
              </button>
            </div>

            {/* Path Navigation & Search Row */}
            <div className="p-4 bg-slate-950/40 border-b border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2 self-start">
                <button
                  disabled={folderHistory.length <= 1}
                  onClick={handleBackFolder}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Go Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-400 font-mono font-bold">
                  {folderHistory.length > 1 ? `Folder: ${folderHistory.length - 1} level(s) deep` : 'Drive: Root /'}
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={driveSearch}
                  onChange={e => setDriveSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* File List Content */}
            <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
              {driveLoading ? (
                <div className="py-24 text-center space-y-3">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Retrieving files from Drive...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-24 text-center text-slate-500 text-xs space-y-2">
                  <Folder className="h-8 w-8 mx-auto text-slate-600" />
                  <p>No files or folders found here.</p>
                  {driveSearch && <p className="text-[10px] text-slate-600 font-mono">Try clearing your search query.</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {driveFiles.map(file => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const isImporting = importingFileId === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => !isImporting && handleFileClick(file)}
                        className={`flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer transition-all ${
                          isImporting ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate mr-2">
                          <div className={`p-1.5 rounded shrink-0 ${isFolder ? 'text-amber-400 bg-amber-500/5' : 'text-blue-400 bg-blue-500/5'}`}>
                            {isFolder ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </div>
                          <span className="text-xs text-slate-200 truncate font-sans" title={file.name}>
                            {file.name}
                          </span>
                        </div>

                        {isImporting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400 shrink-0" />
                        ) : !isFolder ? (
                          <span className="text-[9px] font-mono font-bold text-slate-400 hover:text-white uppercase tracking-wider bg-white/5 hover:bg-blue-600 border border-white/5 hover:border-blue-500 rounded px-2 py-0.5 shrink-0 transition-all">
                            Import
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/20 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-slate-400" /> Click folders to browse, click file import label to load.
              </span>
              <span className="font-mono uppercase tracking-widest font-bold">
                Google Drive
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
