const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
let lines = content.split('\n');
let startIndex = lines.findIndex(l => l.includes('</div>                                 <button'));
if (startIndex !== -1) {
  lines[startIndex] = '                    </div>'; 
  lines.splice(startIndex + 1, 4489 - 4315 + 1);
  fs.writeFileSync('src/components/Dashboard.tsx', lines.join('\n'));
  console.log("Fixed!");
} else {
  console.log("Could not find start index");
}
