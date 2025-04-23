const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('Starting Render startup script');

// Debug: Print current directory and contents
console.log(`Current working directory: ${process.cwd()}`);
console.log('Directory contents:');
try {
  const files = fs.readdirSync('.');
  files.forEach(file => {
    const stats = fs.statSync(file);
    console.log(`- ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
  });
} catch (err) {
  console.error('Error listing directory:', err);
}

// Find the dist directory and package.json
function findFiles() {
  console.log('Searching for dist directory and package.json');
  
  let distDir = null;
  let packageJsonPath = null;
  
  function searchDir(dir) {
    console.log(`Searching in directory: ${dir}`);
    
    try {
      const files = fs.readdirSync(dir);
      
      // Check if dist and package.json exist in this directory
      if (files.includes('dist') && fs.statSync(path.join(dir, 'dist')).isDirectory()) {
        distDir = path.join(dir, 'dist');
        console.log(`Found dist directory at: ${distDir}`);
      }
      
      if (files.includes('package.json')) {
        packageJsonPath = path.join(dir, 'package.json');
        console.log(`Found package.json at: ${packageJsonPath}`);
      }
      
      // If we haven't found both, search subdirectories
      if (!distDir || !packageJsonPath) {
        for (const file of files) {
          const filePath = path.join(dir, file);
          
          // Skip node_modules and hidden directories
          if (file === 'node_modules' || file.startsWith('.')) {
            continue;
          }
          
          try {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              searchDir(filePath);
              
              // If we found both after recursion, exit the loop
              if (distDir && packageJsonPath) {
                break;
              }
            }
          } catch (err) {
            console.error(`Error checking ${filePath}:`, err);
          }
        }
      }
    } catch (err) {
      console.error(`Error searching directory ${dir}:`, err);
    }
  }
  
  // Start the search from the current directory
  searchDir(process.cwd());
  
  return { distDir, packageJsonPath };
}

// Main function
async function main() {
  const { packageJsonPath } = findFiles();
  let command = 'npm';
  let args = ['start'];
  
  // If we found package.json, use it to determine the start command
  if (packageJsonPath) {
    console.log(`Using package.json at: ${packageJsonPath}`);
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts.start) {
        console.log(`Found start script: ${packageJson.scripts.start}`);
        
        // Parse the start script
        const startScript = packageJson.scripts.start;
        
        // If it's a node command, extract the entry point
        if (startScript.startsWith('node ')) {
          const entryPoint = startScript.substring(5).trim();
          console.log(`Found entry point: ${entryPoint}`);
          
          command = 'node';
          args = [entryPoint];
        }
      } else {
        console.log('No start script found in package.json, using default');
      }
    } catch (err) {
      console.error('Error parsing package.json:', err);
    }
  } else {
    console.log('package.json not found, using default start command');
    
    // Try to find a server.js or index.js file
    if (fs.existsSync('server.js')) {
      command = 'node';
      args = ['server.js'];
    } else if (fs.existsSync('index.js')) {
      command = 'node';
      args = ['index.js'];
    } else if (fs.existsSync('server/index.js')) {
      command = 'node';
      args = ['server/index.js'];
    } else if (fs.existsSync('dist/index.js')) {
      command = 'node';
      args = ['dist/index.js'];
    } else {
      console.log('No entry point found, using npm start');
    }
  }
  
  // Start the application
  console.log(`Starting application with command: ${command} ${args.join(' ')}`);
  
  const proc = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  proc.on('exit', (code) => {
    console.log(`Process exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle signals
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down');
    proc.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down');
    proc.kill('SIGTERM');
  });
}

main().catch((err) => {
  console.error('Startup script failed:', err);
  process.exit(1);
});