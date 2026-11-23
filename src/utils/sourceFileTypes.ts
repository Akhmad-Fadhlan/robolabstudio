const cppExtensions = ['ino', 'h', 'hpp', 'c', 'cpp', 'cc', 'cxx', 'c++'];
export const openableFileExtensions = [...cppExtensions, 'py', 'hex', 'json', 'md', 'txt'];
export const fileExtension = (filename: string) => /\.([^./]+)$/.exec(filename)?.[1].toLowerCase() ?? '';
export const isCppSourceFile = (filename: string) => cppExtensions.includes(fileExtension(filename));
export const isPythonSourceFile = (filename: string) => fileExtension(filename) === 'py';
export const isBlockSourceFile = (filename: string) => isCppSourceFile(filename) || isPythonSourceFile(filename);
