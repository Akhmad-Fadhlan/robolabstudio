import { pythonToBlocklyXml } from './src/utils/pythonToBlocks.js'; 
console.log(pythonToBlocklyXml('robot.send("FORWARD")\nwhile True:\n    robot.send("BACKWARD")\n'));
