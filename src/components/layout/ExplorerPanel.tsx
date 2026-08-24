import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, Trash2, ChevronDown, ChevronRight, FilePlus } from 'lucide-react';

interface ExplorerPanelProps {
  files: { [filename: string]: string };
  activeFile: string;
  onSelectFile: (filename: string) => void;
  onCreateFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  savedFiles: { [filename: string]: string };
  themeMode: 'light' | 'dark';
}

export const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  savedFiles,
  themeMode
}) => {
  const [openFolders, setOpenFolders] = useState<{ [folder: string]: boolean }>({
    firmware: true,
    python: true
  });
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (folder: string) => {
    setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFileName.trim();
    if (trimmed) {
      onCreateFile(trimmed);
      setNewFileName('');
      setShowNewFileInput(false);
    }
  };

  // Group files by folder prefix (e.g. firmware/, python/, or root)
  const groupedFiles = React.useMemo(() => {
    const groups: { [folder: string]: string[] } = {
      firmware: [],
      python: [],
      root: []
    };

    Object.keys(files).forEach(filename => {
      if (filename.startsWith('firmware/')) {
        groups.firmware.push(filename);
      } else if (filename.startsWith('python/')) {
        groups.python.push(filename);
      } else {
        groups.root.push(filename);
      }
    });

    return groups;
  }, [files]);

  const isDark = themeMode === 'dark';

  return (
    <div className={`w-full h-full flex flex-col select-none rounded-2xl border p-3 ${
      isDark 
        ? 'bg-[#0b0c12]/90 border-white/10 text-slate-200' 
        : 'bg-white/90 border-slate-200 text-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold tracking-wider uppercase font-mono">Explorer</span>
        </div>
        <button
          onClick={() => setShowNewFileInput(!showNewFileInput)}
          className={`p-1 rounded-lg transition hover:bg-purple-500/20 text-purple-400`}
          title="File Baru"
        >
          <FilePlus className="w-4 h-4" />
        </button>
      </div>

      {/* New file input form */}
      {showNewFileInput && (
        <form onSubmit={handleCreateSubmit} className="mb-3 flex gap-1">
          <input
            type="text"
            placeholder="folder/file.ino"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none font-mono ${
              isDark ? 'bg-black/40 border-purple-500/40 text-white' : 'bg-slate-100 border-purple-400 text-slate-900'
            }`}
            autoFocus
          />
          <button
            type="submit"
            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg"
          >
            +
          </button>
        </form>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        
        {/* Firmware Folder */}
        <div>
          <button
            onClick={() => toggleFolder('firmware')}
            className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg transition text-left font-bold ${
              isDark ? 'hover:bg-white/5 text-purple-300' : 'hover:bg-slate-100 text-purple-700'
            }`}
          >
            {openFolders.firmware ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>firmware</span>
          </button>
          
          {openFolders.firmware && (
            <div className="pl-4 pt-1 space-y-0.5 border-l border-white/10 ml-3">
              {groupedFiles.firmware.length === 0 ? (
                <div className="text-[10px] text-slate-500 italic px-2 py-0.5">Kosong</div>
              ) : (
                groupedFiles.firmware.map(file => {
                  const isActive = activeFile === file;
                  const isModified = files[file] !== savedFiles[file];
                  const basename = file.replace(/^firmware\//, '');
                  return (
                    <div
                      key={file}
                      onClick={() => onSelectFile(file)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30'
                          : isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="truncate">{basename}</span>
                        {isModified && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Belum disimpan" />}
                      </div>
                      {file !== 'firmware/main.ino' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus file ${file}?`)) onDeleteFile(file);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Python Folder */}
        <div>
          <button
            onClick={() => toggleFolder('python')}
            className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg transition text-left font-bold ${
              isDark ? 'hover:bg-white/5 text-purple-300' : 'hover:bg-slate-100 text-purple-700'
            }`}
          >
            {openFolders.python ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Folder className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
            <span>python</span>
          </button>

          {openFolders.python && (
            <div className="pl-4 pt-1 space-y-0.5 border-l border-white/10 ml-3">
              {groupedFiles.python.length === 0 ? (
                <div className="text-[10px] text-slate-500 italic px-2 py-0.5">Kosong</div>
              ) : (
                groupedFiles.python.map(file => {
                  const isActive = activeFile === file;
                  const isModified = files[file] !== savedFiles[file];
                  const basename = file.replace(/^python\//, '');
                  return (
                    <div
                      key={file}
                      onClick={() => onSelectFile(file)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30'
                          : isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="truncate">{basename}</span>
                        {isModified && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Belum disimpan" />}
                      </div>
                      {file !== 'python/main.py' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus file ${file}?`)) onDeleteFile(file);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Root / Custom Files */}
        {groupedFiles.root.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">Root Files</div>
            <div className="pl-2 space-y-0.5">
              {groupedFiles.root.map(file => {
                const isActive = activeFile === file;
                const isModified = files[file] !== savedFiles[file];
                return (
                  <div
                    key={file}
                    onClick={() => onSelectFile(file)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30'
                        : isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate">{file}</span>
                      {isModified && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Belum disimpan" />}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus file ${file}?`)) onDeleteFile(file);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
