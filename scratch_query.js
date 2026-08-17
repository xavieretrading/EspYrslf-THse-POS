import fs from 'fs';
import path from 'path';

const file = path.join('c:', 'Users', 'Philippines Freight', 'MainSystems', 'POS', 'server.ts');

function main() {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  console.log('Searching for product_recipes or recipes in server.ts...');
  lines.forEach((line, i) => {
    if (line.includes('product_recipes') || line.includes('recipes') || line.includes('recipe')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  });
}

main();
