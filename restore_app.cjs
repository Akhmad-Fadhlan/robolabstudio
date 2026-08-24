const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const replacement = `      <TopMenuBar 
        themeMode={themeMode}
        board={board}
        setBoard={setBoard}
        port={port}
        setPort={setPort}
        availablePorts={availablePorts}
        setShowSettingsModal={setShowSettingsModal}
        setShowHelpModal={setShowHelpModal}
        setShowNewFileModal={setShowNewFileModal}
        handleNativeOpenFile={handleNativeOpenFile}
        handleSaveFile={handleSaveFile}
        files={files}
        activeFile={activeFile}
        savedFiles={savedFiles}
        handleArduinoHardwareAction={handleArduinoHardwareAction}
        handleRunPython={handleRunPython}
        rightToolbar={
          <>`;
code = code.replace('<TopMenuBar themeMode={themeMode} >', replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Restored TopMenuBar props');
