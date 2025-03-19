// cli-converter.js
const fs = require('fs');
const path = require('path');
const { convertOPTtoWebTemplate } = require('./opt-to-webtemplate');

async function convertFile() {
  // Check if a file path is provided
  if (process.argv.length < 3) {
    console.error('Please provide an OPT file path.');
    console.error('Usage: node cli-converter.js <path-to-opt-file> [output-path]');
    process.exit(1);
  }

  // Get file paths
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || generateOutputPath(inputPath);

  try {
    // Read the input file
    const xmlContent = fs.readFileSync(inputPath, 'utf8');
    
    // Convert to Web Template
    console.log(`Converting ${inputPath}...`);
    const webTemplate = await convertOPTtoWebTemplate(xmlContent);
    
    // Write to output file
    const jsonContent = JSON.stringify(webTemplate, null, 2);
    fs.writeFileSync(outputPath, jsonContent);
    
    console.log(`Conversion successful!`);
    console.log(`Output saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error during conversion:', error.message);
    process.exit(1);
  }
}

function generateOutputPath(inputPath) {
  const dir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  return path.join(dir, `${baseName}.json`);
}

// Run the converter
convertFile();