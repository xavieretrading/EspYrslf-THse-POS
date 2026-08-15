import fs from 'fs';
import path from 'path';

const file = path.join('c:', 'Users', 'Philippines Freight', 'MainSystems', 'POS', 'src', 'pages', 'POS.tsx');

function main() {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  console.log('Searching in POS.tsx for stock locks, addons, or detergents...');
  lines.forEach((line, i) => {
    const lineLower = line.toLowerCase();
    if (lineLower.includes('add-on') || lineLower.includes('addon') || lineLower.includes('detergent') || lineLower.includes('strict_item_locked') || lineLower.includes('strict_item') || lineLower.includes('stock')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  });
}

main();
