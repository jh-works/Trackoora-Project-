const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove BD from Trackoora
content = content.replace(/Trackoora BD/g, "Trackoora");

// 2. Change Get Started to Get 30 days Free in pricing
content = content.replace(/\? 'শুরু করুন →' : 'Get Started →'/g, "? 'শুরু করুন →' : 'Get 30 days Free →'");

// 3. Change Login/Signup to Get 30 days free in banner
content = content.replace(/\? 'লগইন \/ সাইনআপ' : 'Login \/ Signup'/g, "? '৩০ দিন ফ্রি ট্রায়াল নিন' : 'Get 30 days free'");

// 4. Update state variables and routing hooks
content = content.replace("const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'onboarding'>('landing');",
`const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'onboarding' | 'privacy' | 'terms'>('landing');
  
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/privacy-policy') {
        setView('privacy');
      } else if (path === '/terms-of-service') {
        setView('terms');
      } else if (path === '/') {
        setView('landing');
      }
    };
    
    // Initial check on load
    const path = window.location.pathname;
    if (path === '/privacy-policy') {
      setView('privacy');
    } else if (path === '/terms-of-service') {
      setView('terms');
    }
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path, newView) => {
    window.history.pushState({}, '', path);
    setView(newView);
    setActiveModal(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };`);

// 5. Replace buttons calling setActiveModal('privacy') or terms to anchors using navigateTo 
content = content.replace(/<button type="button" onClick=\{\(e\) => \{ e\.stopPropagation\(\); setActiveModal\('terms'\); \}\} className="text-orange font-bold hover:underline">/g, 
  '<a href="/terms-of-service" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateTo("/terms-of-service", "terms"); }} className="text-orange font-bold hover:underline">');

content = content.replace(/<button type="button" onClick=\{\(e\) => \{ e\.stopPropagation\(\); setActiveModal\('privacy'\); \}\} className="text-orange font-bold hover:underline">/g, 
  '<a href="/privacy-policy" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateTo("/privacy-policy", "privacy"); }} className="text-orange font-bold hover:underline">');

content = content.replace(/<\/button> এবং/g, "</a> এবং");
content = content.replace(/<\/button> মেনে/g, "</a> মেনে");
content = content.replace(/<\/button> of/g, "</a> of");

content = content.replace(/<button onClick=\{\(\) => setActiveModal\('privacy'\)\} className="(.*)">Privacy Policy<\/button>/g, 
  '<a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigateTo("/privacy-policy", "privacy"); }} className="$1">Privacy Policy</a>');
content = content.replace(/<button onClick=\{\(\) => setActiveModal\('terms'\)\} className="(.*)">Terms of Service<\/button>/g, 
  '<a href="/terms-of-service" onClick={(e) => { e.preventDefault(); navigateTo("/terms-of-service", "terms"); }} className="$1">Terms of Service</a>');

const privacyMatch = content.match(/\{activeModal === 'privacy' && \([\s\S]*?(?=\{activeModal === 'terms' && \()/);
const termsMatch = content.match(/\{activeModal === 'terms' && \([\s\S]*?(?=\{activeModal === 'forgot-password' && \()/);

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
              <button onClick={() => navigateTo('/', 'landing')} className="bg-bg3 text-text w-full py-3.5 rounded-xl font-bold border border-border hover:border-orange transition-all mt-4">{i18n.language === 'bn' ? 'ফিরে যান' : 'Go Back'}</button>
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
              <button onClick={() => navigateTo('/', 'landing')} className="bg-bg3 text-text w-full py-3.5 rounded-xl font-bold border border-border hover:border-orange transition-all mt-4">{i18n.language === 'bn' ? 'ফিরে যান' : 'Go Back'}</button>
            </div>
          </div>
        </div>
      )}
      {view === 'landing' && (`.replace(/\$\{privacyContent\}/g, privacyContent).replace(/\$\{termsContent\}/g, termsContent));
}

fs.writeFileSync('src/App.tsx', content);
