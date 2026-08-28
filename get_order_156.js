import fs from 'fs';

const filePath = 'c:/Users/Philippines Freight/MainSystems/POS/src/pages/POS.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('customizingProduct') || line.includes('setCustomizingProduct')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
