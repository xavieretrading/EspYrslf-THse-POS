import fs from 'fs';
import path from 'path';

const file = path.join('c:', 'Users', 'Philippines Freight', 'MainSystems', 'POS', 'src', 'pages', 'POS.tsx');

function main() {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  console.log('Searching for product grid render loop in POS.tsx...');
  lines.forEach((line, i) => {
    if (line.includes('.map(product') || line.includes('filteredProducts')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  });
}

main();
