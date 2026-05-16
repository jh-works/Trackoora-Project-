const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const privacyMatch = content.match(/\{activeModal === 'privacy' && \([\s\S]*?(?=\{activeModal === 'terms' && \()/);
const termsMatch = content.match(/\{activeModal === 'terms' && \([\s\S]*?(?=\{activeModal === 'contact' && \()/);

if (privacyMatch && termsMatch) {
  let privacyContent = privacyMatch[0]
                         .replace("{activeModal === 'privacy' && (", "")
                         .replace(/\}$/, "")
                         .trim();
  if(privacyContent.endsWith(')')) privacyContent = privacyContent.slice(0, -1).trim();
  
  let termsContent = termsMatch[0]
                         .replace("{activeModal === 'terms' && (", "")
                         .replace(/\}$/, "")
                         .trim();
  if(termsContent.endsWith(')')) termsContent = termsContent.slice(0, -1).trim();

  content = content.replace(/\{view === 'landing' && \(/g, 
  `{view === 'privacy' && (
        <div className="pt-24 pb-20 mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-text">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
            <h2 className="text-3xl font-black mb-8 font-syne tracking-tight">{i18n.language === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</h2>
            \${privacyContent}
            <div className="mt-8 pt-8 border-t border-border flex justify-end">
              <button 
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  setView('landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="bg-bg3 text-text w-full py-3.5 rounded-xl font-bold border border-border hover:border-orange transition-all mt-4"
              >
                {i18n.language === 'bn' ? 'ফিরে যান' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      )}
      {view === 'terms' && (
        <div className="pt-24 pb-20 mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-text">
           <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
            <h2 className="text-3xl font-black mb-8 font-syne tracking-tight">{i18n.language === 'bn' ? 'শর্তাবলী' : 'Terms of Service'}</h2>
            \${termsContent}
            <div className="mt-8 pt-8 border-t border-border flex justify-end">
              <button 
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  setView('landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="bg-bg3 text-text w-full py-3.5 rounded-xl font-bold border border-border hover:border-orange transition-all mt-4"
              >
                {i18n.language === 'bn' ? 'ফিরে যান' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      )}
      {view === 'landing' && (`.replace(/\$\{privacyContent\}/g, privacyContent).replace(/\$\{termsContent\}/g, termsContent));

  fs.writeFileSync('src/App.tsx', content);
} else {
  console.log("No match found for privacy or terms!");
}
