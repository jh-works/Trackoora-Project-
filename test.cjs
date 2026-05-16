const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
const privacyMatch = content.match(/\{activeModal === 'privacy' && \([\s\S]*?(?=\{activeModal === 'terms' && \()/);
const termsMatch = content.match(/\{activeModal === 'terms' && \([\s\S]*?(?=\{activeModal === 'forgot-password' && \()/);

console.log('Privacy:', !!privacyMatch);
console.log('Terms:', !!termsMatch);
