const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');
if (lines[5459].includes('<>')) {
  lines[5459] = lines[5459].replace('<>', '<div className="flex items-center gap-3">');
  console.log('Replaced line 5460');
}
if (lines[5619].includes('</>}')) {
  lines[5619] = lines[5619].replace('</>}', '}');
  console.log('Replaced line 5620');
}
fs.writeFileSync('src/App.tsx', lines.join('\n'));
