const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/type: 'stdout'/g, "type: 'output'");
fs.writeFileSync('src/App.tsx', app);

let codeEd = fs.readFileSync('src/components/CodeEditor.tsx', 'utf-8');
codeEd = codeEd.replace(/import \{([^}]+)\} from 'lucide-react'/, 'import { $1, FileCode2, Link } from \'lucide-react\'');
fs.writeFileSync('src/components/CodeEditor.tsx', codeEd);

let term = fs.readFileSync('src/components/layout/TerminalPanel.tsx', 'utf-8');
term = term.replace(/import \{([^}]+)\} from 'lucide-react'/, 'import { $1, Terminal } from \'lucide-react\'');
fs.writeFileSync('src/components/layout/TerminalPanel.tsx', term);
