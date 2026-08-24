const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/type: 'output'/g, "type: 'stdout'");
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed terminalLogs type error');
