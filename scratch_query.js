import fs from 'fs';
import path from 'path';

const file = path.join('c:', 'Users', 'Philippines Freight', 'MainSystems', 'POS', 'src', 'pages', 'Orders.tsx');

function main() {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  console.log('Searching for branches in Orders.tsx...');
  lines.forEach((line, i) => {
    if (line.includes('branches') || line.includes('branch')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  });
}

main();






