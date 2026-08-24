const fs = require('fs');

let codeEditor = fs.readFileSync('src/components/CodeEditor.tsx', 'utf-8');
codeEditor = codeEditor.replace(/Code2,\s*/, '');
fs.writeFileSync('src/components/CodeEditor.tsx', codeEditor);

let sim = fs.readFileSync('src/components/Simulator.tsx', 'utf-8');
sim = sim.replace(/CheckCircle2,\s*/, '');
sim = sim.replace(/AlertCircle,\s*/, '');
sim = sim.replace(/Activity,\s*/, '');
sim = sim.replace(/const containerRef = useRef<HTMLDivElement>\(null\);/, '// const containerRef = useRef<HTMLDivElement>(null);');
fs.writeFileSync('src/components/Simulator.tsx', sim);

let term = fs.readFileSync('src/components/layout/TerminalPanel.tsx', 'utf-8');
term = term.replace(/RotateCcw,\s*/, '');
term = term.replace(/Terminal,\s*/, '');
term = term.replace(/setInteractiveTerminalLogs,/, '');
fs.writeFileSync('src/components/layout/TerminalPanel.tsx', term);

console.log('Fixed unused variables');
