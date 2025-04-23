const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Starting Render build script');

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

// Find package.json
function findPackageJson(dir) {
  console.log(`Searching for package.json in ${dir}`);
  
  try {
    const files = fs.readdirSync(dir);
    
    // Check if package.json exists in this directory
    if (files.includes('package.json')) {
      console.log(`Found package.json in ${dir}`);
      return path.join(dir, 'package.json');
    }
    
    // Recursively check subdirectories
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      // Skip node_modules and hidden directories
      if (file === 'node_modules' || file.startsWith('.')) {
        continue;
      }
      
      try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          const result = findPackageJson(filePath);
          if (result) return result;
        }
      } catch (err) {
        console.error(`Error checking ${filePath}:`, err);
      }
    }
  } catch (err) {
    console.error(`Error searching directory ${dir}:`, err);
  }
  
  return null;
}

// Main function
async function main() {
  console.log('Render build script started');
  
  // First, try to find package.json
  const packageJsonPath = findPackageJson(process.cwd()) || path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`package.json not found at: ${packageJsonPath}`);
    console.log('Creating minimal package.json');
    
    // Create a minimal package.json
    const packageJson = {
      "name": "employee-attendance-tracker",
      "version": "1.0.0",
      "type": "module",
      "scripts": {
        "start": "node server/index.js",
        "build": "npm install && vite build && node --experimental-modules --es-module-specifier-resolution=node -e \"console.log('Build complete')\""
      }
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('Created package.json');
  } else {
    console.log(`Using package.json at: ${packageJsonPath}`);
    
    // If found somewhere else, copy it to current directory
    if (packageJsonPath !== path.join(process.cwd(), 'package.json')) {
      fs.copyFileSync(packageJsonPath, path.join(process.cwd(), 'package.json'));
      console.log('Copied package.json to current directory');
    }
  }
  
  // Install dependencies
  console.log('Installing dependencies...');
  await executeCommand('npm install');
  
  // Build the project
  console.log('Building the project...');
  await executeCommand('npm run build');
  
  console.log('Build completed successfully');
}

// Helper function to execute commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    
    const childProcess = exec(command, { maxBuffer: 10 * 1024 * 1024 });
    
    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    childProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Command completed successfully: ${command}`);
        resolve();
      } else {
        console.error(`Command failed with code ${code}: ${command}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

main().catch((err) => {
  console.error('Build script failed:', err);
  process.exit(1);
});