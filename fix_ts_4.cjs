const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(/type:\s*'output'/g, (match, offset, str) => {
  const before = str.substring(Math.max(0, offset - 150), offset);
  if (before.includes('setTerminalLogs')) {
    return "type: 'stdout'";
  }
  return match;
});

// Also manually fix line 3218, 4592, 4696 in case they are not caught
const lines = app.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setTerminalLogs') && lines[i].includes("'output'")) {
    lines[i] = lines[i].replace(/'output'/g, "'stdout'");
  }
}
app = lines.join('\n');
fs.writeFileSync('src/App.tsx', app);


// Fix CodeEditor.tsx
let codeEd = fs.readFileSync('src/components/CodeEditor.tsx', 'utf-8');
const usedCodeEd = ['Play', 'Square', 'FolderOpen', 'Settings', 'Info', 'Search', 'RefreshCw', 'Layers', 'Check', 'Copy', 'AlertTriangle', 'Code', 'Lightbulb', 'Zap', 'Smartphone', 'ArrowRight', 'ChevronRight', 'Activity', 'Terminal', 'Link', 'FileCode2', 'Unplug'].filter(icon => codeEd.indexOf(`<${icon}`) !== -1 || icon === 'Unplug' || icon === 'Link' || icon === 'FileCode2');
codeEd = codeEd.replace(/import\s+\{[^}]+\}\s+from\s+'lucide-react';?/, `import { ${usedCodeEd.join(', ')} } from 'lucide-react';`);
fs.writeFileSync('src/components/CodeEditor.tsx', codeEd);


// Fix TerminalPanel.tsx
let term = fs.readFileSync('src/components/layout/TerminalPanel.tsx', 'utf-8');
const usedTerm = ['Play', 'Square', 'Settings', 'Maximize2, Minimize2', 'Trash2', 'Search', 'X', 'Cpu', 'RefreshCw', 'Send', 'Sparkles', 'ChevronRight', 'ChevronDown', 'CheckCircle', 'AlertCircle', 'FileText', 'Code', 'Database', 'ChevronsDown', 'Activity', 'LineChart', 'Terminal', 'ShieldAlert'].filter(icon => term.indexOf(`<${icon}`) !== -1 || icon === 'ShieldAlert' || icon === 'Terminal');
term = term.replace(/import\s+\{[^}]+\}\s+from\s+'lucide-react';?/, `import { ${usedTerm.join(', ')} } from 'lucide-react';`);
fs.writeFileSync('src/components/layout/TerminalPanel.tsx', term);

console.log('Fixed TS errors step 4');
