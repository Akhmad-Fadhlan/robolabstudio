const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/setTerminalLogs\(([^;]+)\)/g, (match) => {
  return match.replace(/'output'/g, "'stdout'");
});
fs.writeFileSync('src/App.tsx', app);

let codeEd = fs.readFileSync('src/components/CodeEditor.tsx', 'utf-8');
const codeEdLines = codeEd.split('\n');
codeEdLines[1] = "import { Play, Square, Save, FolderOpen, Settings, Info, Search, RefreshCw, Layers, Check, Copy, AlertTriangle, Code, Lightbulb, Zap, Smartphone, ArrowRight, ChevronRight, Activity, Terminal, Link, FileCode2 } from 'lucide-react';";
codeEd = codeEdLines.join('\n');
fs.writeFileSync('src/components/CodeEditor.tsx', codeEd);

let term = fs.readFileSync('src/components/layout/TerminalPanel.tsx', 'utf-8');
const termLines = term.split('\n');
termLines[1] = "import { Play, Square, Settings, Maximize2, Minimize2, Trash2, Search, X, Cpu, RefreshCw, Send, Sparkles, ChevronRight, ChevronDown, CheckCircle, AlertCircle, FileText, Code, Database, ChevronsDown, Activity, LineChart, Terminal } from 'lucide-react';";
term = termLines.join('\n');
term = term.replace(/<TerminalIcon/g, '<Terminal');
fs.writeFileSync('src/components/layout/TerminalPanel.tsx', term);

console.log('Fixed ALL TS errors step 3');
