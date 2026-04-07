import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import config from '../obfuscator.config.json' with {type: 'json'}/*  assert { type: 'json' } */;

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const projectRoot = resolve(__dirname, '..');
const nextDir = join(projectRoot, '.next');

// Files and patterns to skip
const SKIP_PATTERNS = [
  'next.min.js',
  'webpack.js',
  'webpack-runtime.js',
  'next-server.js',
  'next-minimal-server.js',
  'edge-runtime-webpack.js',
  'polyfills.js',
  'react-refresh.js',
  'amp.js',
  'image.js',
  'link.js',
  'script.js',
  'head.js',
];

const SKIP_DIRS = ['cache', 'trace'];

function shouldSkipFile(filename) {
  return SKIP_PATTERNS.some(pattern => filename.includes(pattern));
}

function getJsFiles(dir, fileList = []) {
  if (!existsSync(dir)) return fileList;
  
  const files = readdirSync(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (SKIP_DIRS.some(skip => fullPath.includes(skip))) continue;
      getJsFiles(fullPath, fileList);
    } else if (file.endsWith('.js') && !shouldSkipFile(file)) {
      fileList.push(fullPath);
    }
  }
  
  return fileList;
}

async function obfuscateFile(filePath) {
  try {
    const code = readFileSync(filePath, 'utf-8');
    
    // Skip very small files (likely auto-generated or config)
    if (code.length < 200) {
      console.log(`  [skip] ${filePath} (too small)`);
      return false;
    }
    
    const obfuscated = JavaScriptObfuscator.obfuscate(code, config);
    writeFileSync(filePath, obfuscated.getObfuscatedCode(), 'utf-8');
    return true;
  } catch (error) {
    console.error(`  [error] ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Starting code obfuscation...\n');
  
  const startTime = Date.now();
  
  // Collect all JS files
  const serverFiles = getJsFiles(join(nextDir, 'server'));
  const staticFiles = getJsFiles(join(nextDir, 'static'));
  const allFiles = [...serverFiles, ...staticFiles];
  
  console.log(`Found ${allFiles.length} JavaScript files to process\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const relativePath = file.replace(projectRoot + '\\', '');
    process.stdout.write(`  [${i + 1}/${allFiles.length}] ${relativePath}... `);
    
    const result = await obfuscateFile(file);
    if (result === true) {
      successCount++;
      console.log('done');
    } else if (result === false) {
      errorCount++;
    } else {
      skipCount++;
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\nObfuscation complete in ${elapsed}s`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors: ${errorCount}`);
}

main().catch(console.error);
