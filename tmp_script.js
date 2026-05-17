const fs = require('fs');

const files = ['src/App.tsx', 'src/components/Dashboard.tsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<ArrowRight[^>]*\/>/g, '');
  fs.writeFileSync(file, content);
  console.log(`Replaced in ${file}`);
}
