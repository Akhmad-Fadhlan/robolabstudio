import * as fs from "fs";
import { pythonToBlocklyXml } from "./src/utils/pythonToBlocks";
const code = fs.readFileSync("test_code.py", "utf8");
console.log(pythonToBlocklyXml(code));
