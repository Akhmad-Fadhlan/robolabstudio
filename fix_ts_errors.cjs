const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/setTerminalLogs\(([^)]+)type:\s*'output'/g, "setTerminalLogs($1type: 'stdout'");
fs.writeFileSync('src/App.tsx', app);

let codeEd = fs.readFileSync('src/components/CodeEditor.tsx', 'utf-8');
codeEd = codeEd.replace(/FileLink/g, 'Link');
if (!codeEd.includes('FileCode2')) {
  codeEd = codeEd.replace(/import \{([^}]+)\} from 'lucide-react'/, "import { $1, FileCode2, Link } from 'lucide-react'");
}
fs.writeFileSync('src/components/CodeEditor.tsx', codeEd);

let term = fs.readFileSync('src/components/layout/TerminalPanel.tsx', 'utf-8');
if (!term.includes('Terminal as TerminalIcon')) {
  term = term.replace(/import \{([^}]+TerminalIcon[^}]+)\} from 'lucide-react'/, "import { $1, Terminal } from 'lucide-react'");
  term = term.replace(/import \{([^}]+Terminal[^}]+)\} from 'lucide-react'/, "import { $1, Terminal } from 'lucide-react'");
  term = term.replace(/<TerminalIcon/g, '<Terminal');
}
fs.writeFileSync('src/components/layout/TerminalPanel.tsx', term);

console.log('Fixed TS errors step 2');
