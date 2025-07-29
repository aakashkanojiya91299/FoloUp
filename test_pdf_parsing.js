// Test script to read PDF from specific path
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function testPDFParsing() {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      'C:\\Users\\aakash.kanojiya\\Downloads\\resume_tarun_1_2.pdf', // Fallback test file
    ];
    
    let pdfPath = null;
    
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        pdfPath = path;
        break;
      }
    }
    
    if (!pdfPath) {
      console.log('❌ PDF file not found. Please copy your PDF to the project directory.');
      console.log('📋 Instructions:');
      console.log('1. Copy your PDF file to: /home/aakash/AI_Project/FoloUp/');
      console.log('2. Rename it to: resume_tarun_1_2.pdf');
      console.log('3. Run this script again');
      console.log('');
      console.log('🔄 Testing with sample PDF instead...');
      pdfPath = './node_modules/pdf-parse/test/data/01-valid.pdf';
    }
    
    console.log('🔍 Testing PDF parsing...');
    console.log('📄 PDF Path:', pdfPath);
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('✅ PDF buffer loaded, size:', pdfBuffer.length, 'bytes');
    
    // Parse the PDF using pdf-parse
    console.log('🔄 Starting PDF parsing with pdf-parse...');
    const data = await pdfParse(pdfBuffer);
    
    console.log('✅ PDF parsing completed successfully!');
    console.log('📝 Extracted text length:', data.text.length, 'characters');
    console.log('📄 PDF pages:', data.numpages);
    console.log('📄 PDF info:', JSON.stringify(data.info, null, 2));
    
    console.log('\n📋 Extracted text preview (first 1000 characters):');
    console.log('='.repeat(50));
    console.log(data.text.substring(0, 1000));
    console.log('='.repeat(50));
    
    if (data.text.length > 1000) {
      console.log('... (truncated)');
    }
    
    // Save extracted text to a file for inspection
    const outputPath = path.join(process.cwd(), 'extracted_resume_text.txt');
    fs.writeFileSync(outputPath, data.text);
    console.log('💾 Extracted text saved to:', outputPath);
    
  } catch (error) {
    console.error('❌ Error reading PDF file:', error);
  }
}

// Run the test
testPDFParsing(); 
