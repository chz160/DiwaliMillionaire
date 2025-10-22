const fs = require('fs');
const path = require('path');

// Generate version string in format: yyyy.MMdd.sssss
function generateVersion() {
  const now = new Date();
  
  // Get year (4 digits)
  const year = now.getFullYear();
  
  // Get month (2 digits, zero-padded)
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Get day (2 digits, zero-padded)
  const day = String(now.getDate()).padStart(2, '0');
  
  // Calculate seconds since midnight
  const secondsSinceMidnight = 
    now.getHours() * 3600 + 
    now.getMinutes() * 60 + 
    now.getSeconds();
  
  // Format: yyyy.MMdd.sssss (5 digits for seconds, zero-padded)
  const version = `${year}.${month}${day}.${String(secondsSinceMidnight).padStart(5, '0')}`;
  
  return version;
}

// Generate the version
const version = generateVersion();

// Create the environment file content
const envFileContent = `// This file is auto-generated during build. Do not edit manually.
export const environment = {
  version: '${version}'
};
`;

// Determine the output path
const envFilePath = path.join(__dirname, '../src/environments/environment.ts');

// Ensure the environments directory exists
const envDir = path.dirname(envFilePath);
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Write the environment file
fs.writeFileSync(envFilePath, envFileContent, 'utf8');

console.log(`Generated version: ${version}`);
console.log(`Written to: ${envFilePath}`);
