function selectArduinoSketch(files, sketchPath) {
  const entries = Object.entries(files ?? {}).filter(([name, source]) =>
    /\.ino$/i.test(name) && typeof source === 'string'
  );
  if (typeof sketchPath === 'string') {
    return entries.find(([name]) => name === sketchPath);
  }
  return entries.find(([name]) => name === 'firmware/main.ino')
    ?? entries.find(([, source]) => /\bvoid\s+setup\s*\(/.test(source))
    ?? entries[0];
}

function needsNativeEspCompiler(source, extraFiles) {
  const code = source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ' ');
  return extraFiles.length > 0
    || /\b(?:return|analogReadResolution|analogSetPinAttenuation|analogSetAttenuation|analogReadMilliVolts)\b/.test(code)
    || /\b\w+\s*\[[^\n\]]*\]/.test(code)
    || /\bSerial\.print(?:ln)?\s*\([^;\n]*,/.test(code);
}

function nativeEspCompilerRequired(filename) {
  const error = 'Sketch ESP memerlukan Arduino CLI dengan core board yang sesuai. Gunakan RoboLab Desktop atau nyalakan compiler lokal dengan npm run compile-server, lalu ulangi Verify atau Upload.';
  return {
    success: false,
    code: 'NATIVE_COMPILER_REQUIRED',
    error,
    logs: [{ text: filename + ': ' + error, type: 'error' }],
  };
}

module.exports = { selectArduinoSketch, needsNativeEspCompiler, nativeEspCompilerRequired };
