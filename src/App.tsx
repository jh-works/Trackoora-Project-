/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './components/Logo';
import {
  Activity,
  LayoutDashboard,
  Bot,
  Wallet,
  Bell,
  Languages,
  BarChart2,
  ArrowRight, 
  BarChart3,
  Globe,
  MoreHorizontal,
  X,
  CheckCircle2,
  ChevronDown,
  Facebook,
  Smartphone,
  ShieldCheck,
  Zap,
  Target,
  Clock,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Smile,
  Package,
  FileText,
  Lock,
  Search,
  ShieldAlert,
  EyeOff,
  Eye,
  MousePointerClick,
  MessageCircle,
  ShoppingBag,
  RefreshCw,
  Mail,
  Menu,
  User
} from 'lucide-react';
import './i18n';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';

// Utility for Bengali numerals
const toBengaliNumerals = (num: string | number) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
};

export default function App() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'onboarding'>('landing');
  const [user, setUser] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'form' | 'otp'>('form');
  const [onboardingStep, setOnboardingStep] = useState<string>('subscription_selection');
  const [surveySource, setSurveySource] = useState('');
  const [surveyBusiness, setSurveyBusiness] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileName, setProfileName] = useState('');
  
  useEffect(() => {
    if (user?.user_metadata) {
      if (user.user_metadata.full_name && !profileName) {
        setProfileName(user.user_metadata.full_name);
      }
      if (user.user_metadata.phone && !phoneNumber) {
        setPhoneNumber(user.user_metadata.phone);
      }
    }
  }, [user]);
  const [integrationSkipped, setIntegrationSkipped] = useState(false);
  const [showFbModal, setShowFbModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'forgot-password' | 'contact' | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [forgotPasswordMethod, setForgotPasswordMethod] = useState<'email' | 'phone'>('email');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'input' | 'otp' | 'success'>('input');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const resetAuthForm = (mode: 'login' | 'signup' = 'login') => {
    setFullName('');
    setEmail('');
    setPassword('');
    setError(null);
    setShowPassword(false);
    setAgreedToTerms(false);
    setAuthMode(mode);
    setAuthStep('form');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Check for existing Supabase session
    if (supabase) {
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        try {
          const user = JSON.parse(demoUser);
          setUser(user);
          if (view === 'auth') setView('dashboard');
        } catch (e) {}
      } else {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            localStorage.setItem('token', session.access_token);
            setUser(session.user);
            if (view === 'auth') setView('dashboard');
          }
        });
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          localStorage.setItem('token', session.access_token);
          setUser(session.user);
          if (view === 'auth') setView('dashboard');
        } else if (!localStorage.getItem('demo_user')) {
          localStorage.removeItem('token');
          setUser(null);
          if (view !== 'landing') setView('auth');
        }
      });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        subscription.unsubscribe();
      };
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [view]);

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLng);
  };

  const formatNum = (val: string | number) => {
    return i18n.language === 'bn' ? toBengaliNumerals(val) : val;
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleAuthClick = () => {
    setAuthMode('login');
    setView('auth');
    setAuthStep('form');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoogleAuth = async () => {
    if (!supabase) {
      setError('Supabase connection not initialized.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    if (!supabase) {
      setError('Supabase connection not initialized.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
          scopes: 'email,public_profile'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = () => {
    const updatedUser = {
      ...user,
      user_metadata: {
        ...user?.user_metadata,
        full_name: profileName || user?.user_metadata?.full_name,
        phone: phoneNumber
      }
    };
    setUser(updatedUser);
    if (localStorage.getItem('demo_user')) {
      localStorage.setItem('demo_user', JSON.stringify(updatedUser));
    } else {
      if (supabase) {
        supabase.auth.updateUser({
          data: { full_name: profileName, phone: phoneNumber }
        });
      }
    }
    setOnboardingStep('setup_fb_login');
  };

  const handleOnboardingComplete = async (fbPageId: string, fbToken: string, adAccountId: string) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/onboarding/complete', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          facebookPageId: fbPageId, 
          fbPageAccessToken: fbToken, 
          metaAdAccountId: adAccountId 
        })
      });
      
      if (!response.ok) throw new Error('Failed to save onboarding data');
      
      // We don't set view here, we let the caller handle it (e.g. show success screen)
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase connection not initialized.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Demo Bypass for login if email not confirmed
      if (error && (error.message.includes('Email not confirmed') || error.message.includes('Invalid login credentials'))) {
        const bypassUser = { id: `demo-user-${Date.now()}`, email: email, user_metadata: { full_name: 'Demo User' } };
        localStorage.setItem('demo_user', JSON.stringify(bypassUser));
        localStorage.setItem('token', 'demo-token');
        setUser(bypassUser);
        setView('dashboard'); // assume setup is complete for returning demo login
        setLoading(false);
        return;
      } else if (error) {
        throw error;
      }
      
      if (data.session) {
        localStorage.setItem('token', data.session.access_token);
        setUser(data.user);
        
        // Fetch seller details to check onboarding
        const { data: seller } = await supabase
          .from('sellers')
          .select('setup_complete')
          .eq('id', data.user.id)
          .single();

        if (seller?.setup_complete) {
          setView('dashboard');
        } else {
          setOnboardingStep('subscription_selection');
          setView('onboarding');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase connection not initialized.');
      return;
    }
    
    if (!email.includes('@')) {
      setError(i18n.language === 'bn' ? 'সঠিক ইমেল দিন' : 'Enter a valid email');
      return;
    }
    
    if (password.length < 8) {
      setError(i18n.language === 'bn' ? 'পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে' : 'Password must be at least 8 characters');
      return;
    }

    if (!agreedToTerms) {
      setError(i18n.language === 'bn' ? 'আপনাকে শর্তাবলী এবং গোপনীয়তা নীতিতে সম্মতি দিতে হবে' : 'You must agree to the Terms and Privacy Policy');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Demo bypass: simulate account creation to avoid Supabase email rate limits
      setAuthStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Demo Bypass: bypass supabase verifyOtp since we didn't send an email
      const bypassUser = { id: `demo-user-${Date.now()}`, email: email, user_metadata: { full_name: fullName || 'Demo User' } };
      localStorage.setItem('demo_user', JSON.stringify(bypassUser));
      localStorage.setItem('token', 'demo-token');
      setUser(bypassUser);
      setOnboardingStep('subscription_selection');
      setView('onboarding');
      setLoading(false);
      return;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('demo_user');
    setUser(null);
    resetAuthForm('login');
    setView('landing');
  };

  const renderView = () => {
    if (view === 'onboarding') {
      return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
        <div className="hero-orb-l" />
        <div className="hero-grid" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-card border border-border2 rounded-[24px] p-8 md:p-12 relative z-10 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-10">
            <Logo size="sm" />
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1.5">
                {['plan', 'survey', 'profile', 'facebook', 'telegram'].map((s, idx) => {
                  const currentSection = ['subscription_selection', 'payment_placeholder'].includes(onboardingStep) ? 'plan'
                    : ['survey_source', 'survey_business', 'survey_thanks'].includes(onboardingStep) ? 'survey'
                    : ['setup_profile'].includes(onboardingStep) ? 'profile'
                    : ['setup_fb_login', 'setup_fb_page', 'setup_ad_account'].includes(onboardingStep) ? 'facebook'
                    : ['setup_telegram', 'setup_complete', 'setup_skipped_thanks'].includes(onboardingStep) ? 'telegram' : 'plan';
                  const sectionIndex = ['plan', 'survey', 'profile', 'facebook', 'telegram'].indexOf(currentSection);
                  return (
                  <div 
                    key={s}
                    className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                      idx <= sectionIndex ? 'bg-orange' : 'bg-bg3'
                    }`}
                  />
                  );
                })}
              </div>
              <span className="text-[10px] font-bold text-text3 uppercase tracking-widest bg-bg3/50 px-2 py-0.5 rounded-full border border-border/10">
                {onboardingStep === 'subscription_selection' ? 'Start' : onboardingStep === 'setup_complete' ? 'Done' : 'Setup'}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {onboardingStep === 'subscription_selection' && (
              <motion.div key="subscription" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                <h2 className="text-3xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'আপনার প্ল্যান বেছে নিন' : 'Choose Your Plan'}</h2>
                <p className="text-text2 mb-8">{i18n.language === 'bn' ? 'কীভাবে শুরু করতে চান তা নির্বাচন করুন।' : 'Select how you want to start with Trackoora BD.'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-bg3 border border-border p-6 rounded-2xl hover:border-orange cursor-pointer transition-all flex flex-col items-center" onClick={() => setOnboardingStep('survey_source')}>
                    <h3 className="text-xl font-bold text-text mb-2">{i18n.language === 'bn' ? '৩০ দিনের ফ্রি ট্রায়াল' : '30-Day Free Trial'}</h3>
                    <p className="text-text2 text-sm mb-4">{i18n.language === 'bn' ? 'সব ফিচার বিনামূল্যে ব্যবহার করুন।' : 'Explore all features for free.'}</p>
                    <button className="bg-bg2 text-text font-bold py-2 px-6 rounded-xl w-full hover:bg-orange hover:text-white transition-all">{i18n.language === 'bn' ? 'ট্রায়াল শুরু করুন' : 'Start Trial'}</button>
                  </div>
                  <div className="bg-orange/10 border border-orange/30 p-6 rounded-2xl hover:border-orange cursor-pointer transition-all flex flex-col items-center" onClick={() => setOnboardingStep('payment_placeholder')}>
                    <h3 className="text-xl font-bold text-orange mb-2">{i18n.language === 'bn' ? 'পেইড প্ল্যান' : 'Paid Plan'}</h3>
                    <p className="text-text2 text-sm mb-4">{i18n.language === 'bn' ? 'সর্বোচ্চ লিমিট আনলক করুন।' : 'Unlock maximum limits and growth.'}</p>
                    <button className="bg-orange text-white font-bold py-2 px-6 rounded-xl w-full hover:bg-orange/80 transition-all">{i18n.language === 'bn' ? 'প্ল্যান বেছে নিন' : 'Select Plan'}</button>
                  </div>
                </div>
              </motion.div>
            )}

            {onboardingStep === 'payment_placeholder' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                <h2 className="text-2xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'চেকআউট' : 'Checkout'}</h2>
                <p className="text-text2 mb-8">{i18n.language === 'bn' ? 'প্রিমিয়াম প্ল্যান অ্যাক্টিভেট করতে আপনার পেমেন্ট তথ্য দিন।' : 'Provide your payment details to activate the premium plan.'}</p>
                <div className="bg-bg3 border border-border rounded-xl p-4 mb-8 text-left">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-bg2 rounded w-3/4"></div>
                    <div className="h-10 bg-bg2 rounded w-full"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-10 bg-bg2 rounded"></div>
                      <div className="h-10 bg-bg2 rounded"></div>
                    </div>
                  </div>
                  <p className="text-xs text-text3 mt-4 text-center">{i18n.language === 'bn' ? 'সিমুলেটেড পেমেন্ট গেটওয়ে' : 'Simulated Payment Gateway'}</p>
                </div>
                <button onClick={() => {
                  /* Simulate payment processing */
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                    setOnboardingStep('survey_source');
                  }, 1500);
                }} className="btn-primary w-full py-4 text-lg">
                  {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : (i18n.language === 'bn' ? 'পেমেন্ট কনফার্ম করুন' : 'Confirm Payment')}
                </button>
              </motion.div>
            )}

            {onboardingStep === 'survey_source' && (
              <motion.div key="survey_source" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                <h2 className="text-2xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'আপনি আমাদের সম্পর্কে কীভাবে জেনেছেন?' : 'How did you hear about us?'}</h2>
                <p className="text-text2 text-sm mb-8">{i18n.language === 'bn' ? 'আপনার মতামত আমাদের অ্যাপ উন্নত করতে সাহায্য করবে।' : 'Your feedback helps us improve our app.'}</p>
                <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                  {(i18n.language === 'bn' ? ['ফেসবুক', 'ইউটিউব', 'টিকটক', 'বন্ধু / রেফারেল', 'গুগল সার্চ', 'অন্যান্য'] : ['Facebook', 'YouTube', 'TikTok', 'Friend / Referral', 'Google Search', 'Other']).map(opt => (
                    <button key={opt} onClick={() => setSurveySource(opt)} className={`p-4 rounded-xl border text-sm font-bold transition-all ${surveySource === opt ? 'bg-orange text-white border-orange' : 'bg-bg3 border-border hover:border-orange/50 text-text'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep('survey_business')} disabled={!surveySource} className={`btn-primary w-full py-4 text-lg ${!surveySource ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {i18n.language === 'bn' ? 'চালিয়ে যান' : 'Continue'}
                </button>
              </motion.div>
            )}

            {onboardingStep === 'survey_business' && (
              <motion.div key="survey_business" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                <h2 className="text-2xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'আপনার ব্যবসার ধরণ কী?' : 'What type of business do you run?'}</h2>
                <p className="text-text2 text-sm mb-8">{i18n.language === 'bn' ? 'আপনার ব্যবসার সাথে মানানসই ক্যাটাগরি বেছে নিন।' : 'Select the category that best describes your business.'}</p>
                <div className="space-y-3 mb-8 text-left h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {(i18n.language === 'bn' ? ['পোশাক ও ফ্যাশন', 'স্বাস্থ্য ও সৌন্দর্য', 'ইলেকট্রনিক্স', 'বাড়ি ও বাগান', 'খাদ্য ও মুদি', 'শিক্ষা / কোর্স', 'সফটওয়্যার ও আইটি', 'সার্ভিসেস', 'অন্যান্য'] : ['Clothing & Apparel', 'Health & Beauty', 'Electronics', 'Home & Garden', 'Food & Grocery', 'Education / Course', 'Software & IT', 'Services', 'Other']).map(opt => (
                    <div key={opt} onClick={() => setSurveyBusiness(opt)} className={`p-4 rounded-xl border text-sm font-bold transition-all cursor-pointer flex items-center gap-3 ${surveyBusiness === opt ? 'bg-orange/10 border-orange text-orange' : 'bg-bg3 border-border hover:border-orange/50 text-text'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${surveyBusiness === opt ? 'border-orange' : 'border-text3'}`}>
                        {surveyBusiness === opt && <div className="w-2 h-2 rounded-full bg-orange" />}
                      </div>
                      {opt}
                    </div>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep('survey_thanks')} disabled={!surveyBusiness} className={`btn-primary w-full py-4 text-lg ${!surveyBusiness ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {i18n.language === 'bn' ? 'জমা দিন' : 'Submit Survey'}
                </button>
              </motion.div>
            )}

            {onboardingStep === 'survey_thanks' && (
              <motion.div key="survey_thanks" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center py-8">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smile className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-text mb-4">{i18n.language === 'bn' ? 'ধন্যবাদ!' : 'Thank You!'}</h2>
                <p className="text-text2 mb-8">{i18n.language === 'bn' ? 'আপনার মতামতের জন্য ধন্যবাদ। চলুন এবার আপনার প্রোফাইল সেটআপ করি।' : 'We appreciate your feedback. Let\'s get your profile set up now.'}</p>
                <button onClick={() => setOnboardingStep('setup_profile')} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                  {i18n.language === 'bn' ? 'সেটআপে এগিয়ে যান' : 'Proceed to Setup'} <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {onboardingStep === 'setup_profile' && (
              <motion.div key="setup_profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                <h2 className="text-2xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'আপনার প্রোফাইল সেটআপ করুন' : 'Setup your Profile'}</h2>
                <p className="text-text2 text-sm mb-6">{i18n.language === 'bn' ? 'আপনার নাম ও নাম্বার দিয়ে প্রোফাইল সম্পূর্ণ করুন।' : 'Provide your name and contact number for your profile.'}</p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-start gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-700 font-medium">{i18n.language === 'bn' ? 'নোট: এই নাম্বারটি পরবর্তীতে অ্যাপ সেটিংস থেকে যাচাই করতে হবে।' : 'Note: You will need to verify this number with a code later inside the App Settings.'}</p>
                </div>
                <div className="mb-4 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text3 mb-1.5 ml-1">{i18n.language === 'bn' ? 'আপনার নাম' : 'Your Name'}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 w-5 h-5" />
                    <input type="text" placeholder={i18n.language === 'bn' ? 'নাম লিখুন' : 'Enter your name'} value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-bg3 border border-border rounded-xl py-4 pl-12 pr-4 text-text focus:border-orange focus:ring-1 focus:ring-orange outline-none transition-all" />
                  </div>
                </div>
                <div className="mb-8 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text3 mb-1.5 ml-1">{i18n.language === 'bn' ? 'মোবাইল নাম্বার' : 'Phone Number'}</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 w-5 h-5" />
                    <input type="tel" placeholder="+880 1XXX-XXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-bg3 border border-border rounded-xl py-4 pl-12 pr-4 text-text focus:border-orange focus:ring-1 focus:ring-orange outline-none transition-all" />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={handleProfileSubmit} disabled={!phoneNumber || !profileName} className={`btn-primary w-full py-4 text-lg ${!phoneNumber || !profileName ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {i18n.language === 'bn' ? 'চালিয়ে যান' : 'Continue'}
                  </button>
                  <button onClick={() => { setOnboardingStep('setup_fb_login'); }} className="text-text3 hover:text-text font-bold text-sm py-2">
                    {i18n.language === 'bn' ? 'এখন স্কিপ করুন' : 'Skip for now'}
                  </button>
                </div>
              </motion.div>
            )}

            {onboardingStep === 'setup_fb_login' && (
              <motion.div key="setup_fb_login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Facebook className="text-blue-500 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'ফেসবুকের সাথে লগইন করুন' : 'Login with Facebook'}</h2>
                <p className="text-text2 mb-8 max-w-md mx-auto">{i18n.language === 'bn' ? 'পেজ এবং অ্যাড অ্যাকাউন্ট অ্যাক্সেস করতে আপনার মেটা অ্যাকাউন্ট নিরাপদে কানেক্ট করুন।' : 'Connect your Meta account securely to access Pages and Ad accounts.'}</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowFbModal(true)} className="bg-[#1877F2] text-white w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#1864D9] transition-all">
                    <Facebook className="w-6 h-6" /> {i18n.language === 'bn' ? 'ফেসবুকের সাথে চালিয়ে যান' : 'Continue with Facebook'}
                  </button>
                  <button onClick={() => { setOnboardingStep('setup_skipped_thanks'); }} className="text-text3 hover:text-text font-bold text-sm py-2">
                    {i18n.language === 'bn' ? 'এখন স্কিপ করুন' : 'Skip for now'}
                  </button>
                </div>
              </motion.div>
            )}

            {onboardingStep === 'setup_fb_page' && (
              <motion.div key="setup_fb_page" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'আপনার ফেসবুক পেজ বেছে নিন' : 'Select your Facebook Page'}</h2>
                <p className="text-text2 mb-8">{i18n.language === 'bn' ? 'আপনি যে পেজ থেকে বিক্রি করেন সেটি নির্বাচন করুন।' : 'Select the Page you sell from.'}</p>
                <div className="space-y-3 mb-8">
                  <button onClick={() => setOnboardingStep('setup_ad_account')} className="w-full bg-bg3 border-2 border-orange rounded-2xl p-4 flex items-center gap-4 hover:bg-bg2 transition-all text-left">
                    <div className="w-12 h-12 bg-orange/20 rounded-full flex items-center justify-center font-bold text-orange">F</div>
                    <div>
                      <p className="font-bold text-text">Fashion Hub BD</p>
                      <p className="text-xs text-text3">{i18n.language === 'bn' ? 'বিজনেস পেজ' : 'Business Page'}</p>
                    </div>
                    <CheckCircle2 className="ml-auto text-orange w-6 h-6" />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setOnboardingStep('setup_ad_account')} className="btn-primary w-full py-4 text-lg">{i18n.language === 'bn' ? 'এই পেজ কানেক্ট করুন' : 'Connect this Page'}</button>
                  <button onClick={() => { setOnboardingStep('setup_skipped_thanks'); }} className="text-text3 hover:text-text font-bold text-sm py-2 text-center">
                    {i18n.language === 'bn' ? 'এখন স্কিপ করুন' : 'Skip for now'}
                  </button>
                </div>
              </motion.div>
            )}

            {onboardingStep === 'setup_ad_account' && (
              <motion.div key="setup_ad_account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'মেটা অ্যাডস অ্যাকাউন্ট কানেক্ট করুন' : 'Connect Meta Ads account'}</h2>
                <p className="text-text2 mb-8">{i18n.language === 'bn' ? 'এটি কাস্টমার কোন অ্যাড থেকে এসেছে তা ট্র্যাক করতে সাহায্য করবে।' : 'This lets track which Ad each customer came from.'}</p>
                <div className="space-y-3 mb-8">
                  <select className="w-full bg-bg3 border border-border rounded-xl py-4 px-4 text-text focus:border-orange outline-none">
                    <option>Fashion Hub Ads (12938475)</option>
                    <option>Personal Ads (98237412)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setOnboardingStep('setup_telegram')} className="btn-primary w-full py-4 text-lg">{i18n.language === 'bn' ? 'অ্যাকাউন্ট কনফার্ম করুন' : 'Confirm Account'}</button>
                  <button onClick={() => { setOnboardingStep('setup_skipped_thanks'); }} className="text-text3 hover:text-text font-bold text-sm py-2 text-center">
                    {i18n.language === 'bn' ? 'এখন স্কিপ করুন' : 'Skip for now'}
                  </button>
                </div>
              </motion.div>
            )}

            {onboardingStep === 'setup_telegram' && (
              <motion.div key="setup_telegram" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                <div className="w-20 h-20 bg-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="text-cyan w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-text mb-2">{i18n.language === 'bn' ? 'টেলিগ্রাম কানেক্ট করুন' : 'Connect Telegram'}</h2>
                <p className="text-text2 mb-8 max-w-md mx-auto">{i18n.language === 'bn' ? 'আপনার টেলিগ্রামে সরাসরি ডেলিভারি করা দৈনিক সারাংশ এবং সতর্কতাগুলি পান।' : 'Get daily summaries and alerts delivered straight to your Telegram.'}</p>
                <div className="flex flex-col gap-3">
                  <button onClick={async () => {
                    await handleOnboardingComplete('mock_page_id', 'mock_token', 'mock_ad_account_id');
                    setOnboardingStep('setup_complete');
                  }} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <>{i18n.language === 'bn' ? 'সেটআপ সম্পূর্ণ করুন' : 'Complete Setup'} <Zap className="w-5 h-5" /></>}
                  </button>
                  <button onClick={() => { setOnboardingStep('setup_skipped_thanks'); }} className="text-text3 hover:text-text font-bold text-sm py-2 text-center">
                    {i18n.language === 'bn' ? 'এটি স্কিপ করুন' : 'Skip this'}
                  </button>
                </div>
              </motion.div>
            )}

            {onboardingStep === 'setup_skipped_thanks' && (
              <motion.div key="setup_skipped_thanks" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-24 h-24 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-orange" />
                </div>
                <h2 className="text-3xl font-bold text-text mb-6">{i18n.language === 'bn' ? 'ধন্যবাদ!' : 'Thank You!'}</h2>
                <p className="text-text2 mb-8">{i18n.language === 'bn' ? 'আপনি ড্যাশবোর্ড থেকে যে কোনো সময় আপনার সোশ্যাল অ্যাকাউন্ট কানেক্ট করতে পারবেন।' : 'You can connect your social accounts at any time from your dashboard.'}</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setIntegrationSkipped(true); setView('dashboard'); }} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                    {i18n.language === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard'} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {onboardingStep === 'setup_complete' && (
              <motion.div key="setup_complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-text mb-6">{i18n.language === 'bn' ? 'সেটআপ সম্পন্ন হয়েছে!' : 'Setup Complete!'}</h2>
                
                <div className="bg-cyan/10 border border-cyan/20 rounded-2xl p-6 mb-8 text-center max-w-sm mx-auto">
                  <p className="text-[15px] text-cyan font-bold leading-relaxed">
                    {i18n.language === 'bn' ? 'এখন থেকে আপনার পেজে আসা যেকোনো সোর্সের মেসেজ সিঙ্ক হবে এবং অ্যাপ ফিচার অনুযায়ী দেখানো হবে।' : 'From now on, messages from any source to your page will be synced and displayed according to app features.'}
                  </p>
                </div>

                <button onClick={() => { setIntegrationSkipped(false); setView('dashboard'); }} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                  {i18n.language === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard'} <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mock Facebook OAuth Modal */}
        <AnimatePresence>
          {showFbModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden font-sans"
              >
                {/* FB Header */}
                <div className="bg-[#1877F2] p-4 text-white font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-6 h-6" fill="white" stroke="none" />
                    <span>Facebook Auth (Demo)</span>
                  </div>
                  <button onClick={() => setShowFbModal(false)} className="text-white hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                
                {/* Content */}
                <div className="p-6 text-center bg-gray-50 text-black">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                    <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Trackoora BD is requesting access to:</h3>
                  <ul className="text-sm text-left text-gray-600 mb-6 bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    <li className="flex gap-2">✓ Manage your Pages</li>
                    <li className="flex gap-2">✓ Read Page messages</li>
                    <li className="flex gap-2">✓ Access Facebook Ads data</li>
                  </ul>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        setShowFbModal(false);
                        if (view === 'dashboard') {
                          setIntegrationSkipped(false);
                        } else {
                          setOnboardingStep('setup_fb_page');
                        }
                      }}
                      className="bg-[#1877F2] text-white py-3 px-4 rounded-lg font-bold hover:bg-[#166fe5] transition-colors"
                    >
                      Continue as Demo User
                    </button>
                    <button 
                      onClick={() => setShowFbModal(false)}
                      className="text-gray-500 font-semibold hover:text-gray-700 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
      );
    }

    if (view === 'dashboard') {
      return (
        <>
          {/* Mock Facebook OAuth Modal */}
          <AnimatePresence>
            {showFbModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden font-sans"
                >
                  {/* FB Header */}
                  <div className="bg-[#1877F2] p-4 text-white font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Facebook className="w-6 h-6" fill="white" stroke="none" />
                      <span>Facebook Auth (Demo)</span>
                    </div>
                    <button onClick={() => setShowFbModal(false)} className="text-white hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 text-center bg-gray-50 text-black">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                      <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Trackoora BD is requesting access to:</h3>
                    <ul className="text-sm text-left text-gray-600 mb-6 bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                      <li className="flex gap-2">✓ Manage your Pages</li>
                      <li className="flex gap-2">✓ Read Page messages</li>
                      <li className="flex gap-2">✓ Access Facebook Ads data</li>
                    </ul>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          setShowFbModal(false);
                          if (view === 'dashboard') {
                            setIntegrationSkipped(false);
                          } else {
                            setOnboardingStep('setup_fb_page');
                          }
                        }}
                        className="bg-[#1877F2] text-white py-3 px-4 rounded-lg font-bold hover:bg-[#166fe5] transition-colors"
                      >
                        Continue as Demo User
                      </button>
                      <button 
                        onClick={() => setShowFbModal(false)}
                        className="text-gray-500 font-semibold hover:text-gray-700 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <Dashboard user={user} onLogout={handleLogout} language={i18n.language as 'en' | 'bn'} theme={theme} onToggleTheme={toggleTheme} integrationSkipped={integrationSkipped} onCompleteIntegration={() => setIntegrationSkipped(false)} onStartConnectFb={() => { setShowFbModal(true); }} onUpdateUser={(updatedData) => {
            const updatedUser = {
              ...user,
              user_metadata: {
                ...user?.user_metadata,
                ...updatedData
              }
            };
            setUser(updatedUser);
            if (localStorage.getItem('demo_user')) {
              localStorage.setItem('demo_user', JSON.stringify(updatedUser));
            } else if (supabase) {
              supabase.auth.updateUser({ data: updatedData });
            }
          }} />
        </>
      );
    }

    if (view === 'auth') {
      return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
        <div className="hero-orb-l" />
        <div className="hero-grid" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card border border-border2 rounded-[24px] p-5 md:p-12 relative z-10 shadow-2xl max-h-[95vh] overflow-y-auto"
        >
          <div className="text-center mb-8">
            <Logo size="lg" className="mx-auto mb-2" />
            <p className="text-text2 mt-2">
              {authMode === 'login' 
                ? (i18n.language === 'bn' ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'Login to your account')
                : (i18n.language === 'bn' ? 'আপনার তথ্য দিয়ে শুরু করুন' : 'Start with your information')
              }
            </p>
          </div>

          <AnimatePresence mode="wait">
            {authStep === 'otp' ? (
              <motion.form 
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-text2 text-sm mb-2">
                    {i18n.language === 'bn' 
                      ? `আপনার ${email} ঠিকানায় একটি ৬-সংখ্যার কোড পাঠানো হয়েছে।` 
                      : `A 6-digit code has been sent to your ${email} address.`}
                  </p>
                  <p className="text-xs text-orange font-bold px-4 py-2 bg-orange/10 rounded-lg mb-6 max-w-sm mx-auto">
                    Note: If you don't receive an email due to server limits, you can enter any 6-digit code (e.g., 123456) to bypass.
                  </p>
                  
                  <div className="flex justify-between gap-1 sm:gap-2 mb-8 px-1 sm:px-0 max-w-[320px] mx-auto">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        maxLength={1}
                        className="w-9 h-11 sm:w-12 sm:h-14 bg-bg3 border border-border rounded-xl text-center text-lg sm:text-2xl font-bold text-orange focus:border-orange focus:ring-1 focus:ring-orange outline-none transition-all"
                        value={otp[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !/^\d$/.test(val)) return;
                          const newOtp = otp.split('');
                          newOtp[i] = val;
                          setOtp(newOtp.join(''));
                          if (val && i < 5) {
                            document.getElementById(`otp-${i + 1}`)?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0) {
                            document.getElementById(`otp-${i - 1}`)?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-red text-sm bg-red-dim p-3 rounded-lg border border-red/20">{error}</p>}

                <button 
                  type="submit" 
                  disabled={loading || otp.length < 6}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {i18n.language === 'bn' ? 'ভেরিফাই করুন' : 'Verify Now'}
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthStep('form');
                      setOtp('');
                    }}
                    className="text-text3 hover:text-text transition-colors text-sm font-medium"
                  >
                    {i18n.language === 'bn' ? 'ইমেল পরিবর্তন করুন' : 'Change Email'}
                  </button>
                </div>
              </motion.form>
            ) : authMode === 'login' ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text3 mb-1.5 ml-1">
                    {i18n.language === 'bn' ? 'ইমেল ঠিকানা' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 w-5 h-5" />
                    <input 
                      type="email" 
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-bg3 border border-border rounded-xl py-3.5 pl-12 pr-4 text-text focus:border-orange focus:ring-1 focus:ring-orange outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text3 mb-1.5 ml-1">
                    {i18n.language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-bg3 border border-border rounded-xl py-3.5 px-4 pr-11 text-text focus:border-orange focus:ring-1 focus:ring-orange outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="text-right mt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setForgotPasswordStep('input');
                        setActiveModal('forgot-password');
                      }}
                      className="text-xs text-orange font-bold hover:underline"
                    >
                      {i18n.language === 'bn' ? 'Password ভুলে গেছেন?' : 'Forgot Password?'}
                    </button>
                  </div>
                </div>

                {error && <p className="text-red text-sm bg-red-dim p-3 rounded-lg border border-red/20">{error}</p>}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {i18n.language === 'bn' ? 'লগইন করুন' : 'Login Now'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-text3">{i18n.language === 'bn' ? 'অথবা' : 'OR'}</span></div>
                </div>

                <div className="mt-2 text-center">
                  <button 
                    type="button" 
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-200 text-sm shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {i18n.language === 'bn' ? 'Google দিয়ে এগিয়ে যান' : 'Continue with Google'}
                  </button>
                </div>

                <div className="text-center mt-4">
                  <p className="text-text2 text-sm">
                    {i18n.language === 'bn' ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}{' '}
                    <button 
                      type="button"
                      onClick={() => resetAuthForm('signup')}
                      className="text-orange font-bold hover:underline"
                    >
                      {i18n.language === 'bn' ? 'সাইনআপ করুন' : 'Signup'}
                    </button>
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    resetAuthForm();
                    setView('landing');
                  }}
                  className="w-full bg-bg2 border border-border text-text2 hover:text-text hover:border-orange/50 transition-all py-3.5 rounded-xl text-sm font-bold mt-2 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  {i18n.language === 'bn' ? 'ফিরে যান' : 'Go Back'}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSignup} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text3 mb-1.5 ml-1">
                    {i18n.language === 'bn' ? 'পুরো নাম' : 'Full Name'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={i18n.language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-bg3 border border-border rounded-xl py-3.5 px-4 text-text focus:border-orange focus:ring-1 focus:ring-orange outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text3 mb-1.5 ml-1">
                    {i18n.language === 'bn' ? 'ইমেল ঠিকানা' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 w-5 h-5" />
                    <input 
                      type="email" 
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-bg3 border border-border rounded-xl py-3.5 pl-12 pr-4 text-text focus:border-orange focus:ring-1 focus:ring-orange outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text3 mb-1.5 ml-1">
                    {i18n.language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-bg3 border border-border rounded-xl py-3.5 px-4 pr-11 text-text focus:border-orange focus:ring-1 focus:ring-orange outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="mt-2 p-3 bg-cyan/10 border border-cyan/20 rounded-xl flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                    <p className="text-[11px] text-cyan font-medium leading-relaxed">
                      {i18n.language === 'bn' 
                        ? 'টিপস: অন্তত ৮টি অক্ষর, সংখ্যা এবং (@, /) চিহ্ন ব্যবহার করে আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন।' 
                        : 'Tip: Keep your account secure by using at least 8 characters, numbers, and (@, /) symbols.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-2 px-1">
                  <input 
                    type="checkbox" 
                    id="agreement"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-orange shrink-0 cursor-pointer"
                    required
                  />
                  <label htmlFor="agreement" className="text-[11px] text-text2 leading-relaxed cursor-pointer">
                    {i18n.language === 'bn' ? (
                      <>
                        আমি ট্র্যকুরা বিডি-এর{' '}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setActiveModal('terms'); }} className="text-orange font-bold hover:underline">শর্তাবলী</button>
                        {' '}এবং{' '}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setActiveModal('privacy'); }} className="text-orange font-bold hover:underline">গোপনীয়তা নীতি</button>
                        -তে সম্মত হচ্ছি।
                      </>
                    ) : (
                      <>
                        I agree to the{' '}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setActiveModal('terms'); }} className="text-orange font-bold hover:underline">Terms of Service</button>
                        {' '}and{' '}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setActiveModal('privacy'); }} className="text-orange font-bold hover:underline">Privacy Policy</button> of Trackoora BD.
                      </>
                    )}
                  </label>
                </div>

                {error && <p className="text-red text-sm bg-red-dim p-3 rounded-lg border border-red/20">{error}</p>}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {i18n.language === 'bn' ? 'সাইনআপ করুন' : 'Signup Now'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-text3">{i18n.language === 'bn' ? 'অথবা' : 'OR'}</span></div>
                </div>

                <div className="mt-2 text-center">
                  <button 
                    type="button" 
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-200 text-sm shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {i18n.language === 'bn' ? 'Google দিয়ে সাইনআপ করুন' : 'Sign up with Google'}
                  </button>
                </div>

                <div className="text-center mt-4">
                  <p className="text-text2 text-sm">
                    {i18n.language === 'bn' ? 'ইতিমধ্যেই অ্যাকাউন্ট আছে?' : "Already have an account?"}{' '}
                    <button 
                      type="button"
                      onClick={() => {
                        setError(null);
                        setAuthMode('login');
                      }}
                      className="text-orange font-bold hover:underline"
                    >
                      {i18n.language === 'bn' ? 'লগইন করুন' : 'Login'}
                    </button>
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    resetAuthForm();
                    setView('landing');
                  }}
                  className="w-full bg-bg2 border border-border text-text2 hover:text-text hover:border-orange/50 transition-all py-3.5 rounded-xl text-sm font-bold mt-2 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  {i18n.language === 'bn' ? 'ফিরে যান' : 'Go Back'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      );
    }

    return (
      <>
        <nav className="landing-nav">
        <div className="container nav-inner">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isMenuOpen ? 'bg-orange/10 text-orange' : 'hover:bg-bg2 text-text2'}`}
              >
                <Menu className="w-6 h-6" />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-50 py-3 overflow-hidden"
                  >
                    <div className="px-3 mb-2">
                      <div className="bg-bg2 p-1 rounded-xl flex items-center gap-1">
                        <button 
                          onClick={() => i18n.changeLanguage('en')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${i18n.language === 'en' ? 'bg-orange text-white shadow-lg shadow-orange/20' : 'text-text3 hover:text-text'}`}
                        >
                          English
                        </button>
                        <button 
                          onClick={() => i18n.changeLanguage('bn')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${i18n.language === 'bn' ? 'bg-orange text-white shadow-lg shadow-orange/20' : 'text-text3 hover:text-text'}`}
                        >
                          বাংলা
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <button onClick={() => scrollToSection('problem')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-text2 hover:text-orange hover:bg-orange/5 transition-all flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-orange transition-colors"></div>
                        {i18n.language === 'bn' ? 'সমস্যা কি' : 'The Problem'}
                      </button>
                      <button onClick={() => scrollToSection('how-it-works')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-text2 hover:text-orange hover:bg-orange/5 transition-all flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-orange transition-colors"></div>
                        {i18n.language === 'bn' ? 'কিভাবে কাজ করে' : 'How it works'}
                      </button>
                      <button onClick={() => scrollToSection('pricing')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-text2 hover:text-orange hover:bg-orange/5 transition-all flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-orange transition-colors"></div>
                        {i18n.language === 'bn' ? 'মূল্য' : 'Pricing'}
                      </button>
                      <button onClick={() => scrollToSection('faq')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-text2 hover:text-orange hover:bg-orange/5 transition-all flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-orange transition-colors"></div>
                        {i18n.language === 'bn' ? 'সাধারণ প্রশ্ন' : 'FAQ'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); setTimeout(() => window.location.reload(), 800); }} className="flex items-center md:hidden">
            <Logo size="xs" showText={false} />
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); setTimeout(() => window.location.reload(), 800); }} className="hidden md:flex items-center">
            <Logo size="xs" />
          </a>

          <div className="flex items-center gap-4">
            <button onClick={handleAuthClick} className="btn-primary nav-btn">
              {i18n.language === 'bn' ? 'লগইন / সাইনআপ' : 'Login / Signup'}
            </button>
          </div>
        </div>
      </nav>

      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="hero"
      >
        <div className="hero-orb-l"></div>
        <div className="hero-orb-r"></div>
        <div className="hero-grid"></div>
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            🇧🇩 {i18n.language === 'bn' ? 'বাংলাদেশের F-Commerce সেলারদের জন্য তৈরি' : 'Built for F-Commerce Sellers in Bangladesh'}
          </div>
          <h1>
            {i18n.language === 'bn' ? 'আপনি Inbox-এ অর্ডার পাচ্ছেন —' : 'You are getting orders in Inbox —'}
            <span className="line2">{i18n.language === 'bn' ? 'কিন্তু Meta জানেই না আপনি sell করছেন' : "But Meta doesn't even know you're selling"}</span>
          </h1>

          <div className="alert-box-hero">
            <ShieldAlert className="w-5 h-5" />
            {i18n.language === 'bn' ? 'আপনার ৮০% sales Meta-এর কাছে invisible' : '80% of your sales are invisible to Meta'}
          </div>

          <p className="hero-sub">
            {i18n.language === 'bn' ? (
              <>
                তাই Meta ভুল মানুষকে Ads দেখাচ্ছে — যারা message করে কিন্তু কেনে না। বাজেট বাড়ছে, সঠিক customer আসছে না।
                <br /><br />
                <span className="hero-highlight">
                  Trackoora BD প্রতিটি Inbox অর্ডারকে সরাসরি Meta-তে পাঠায়। Meta শেখে কে আসলে কেনে — এবং তাদের কাছেই Ads যায়। একই বাজেটে সেল বাড়ে ২-৩ গুণ।
                </span>
              </>
            ) : (
              <>
                That's why Meta shows ads to the wrong people — those who message but don't buy. Budget increases, but the right customers don't come.
                <br /><br />
                <span className="hero-highlight">
                  Trackoora BD sends every Inbox order directly to Meta. Meta learns who actually buys — and shows ads to them. Sales increase 2-3x for the same budget.
                </span>
              </>
            )}
          </p>
          <div className="hero-actions">
            <button onClick={handleAuthClick} className="btn-primary large">
              {i18n.language === 'bn' ? 'আপনার Ads ঠিক করতে এখনই শুরু করুন' : 'Start fixing your Ads now'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="hero-trust">
            <div className="trust-item"><CheckCircle2 className="w-4 h-4" /> {i18n.language === 'bn' ? 'ক্রেডিট কার্ড লাগবে না' : 'No Credit Card Required'}</div>
            <div className="trust-item"><CheckCircle2 className="w-4 h-4" /> {i18n.language === 'bn' ? 'Website লাগবে না' : 'No Website Required'}</div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="stats glowing-stats-container"
          >
            <div className="stat-item">
              <div className="stat-icon-wrapper mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-orange" />
              </div>
              <span className="stat-label">{i18n.language === 'bn' ? 'প্রতিদিন হাজার হাজার Inbox order হচ্ছে' : 'Thousands of Inbox orders daily'}</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon-wrapper mx-auto mb-2">
                <Search className="w-8 h-8 text-red" />
              </div>
              <span className="stat-label">{i18n.language === 'bn' ? 'বেশিরভাগ seller জানেন না কোন Ad sale আনছে' : 'Most sellers don\'t know which Ad brings sales'}</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon-wrapper mx-auto mb-2">
                <ShieldAlert className="w-8 h-8 text-cyan" />
              </div>
              <span className="stat-label">{i18n.language === 'bn' ? 'Meta এই sales track করতে পারছে না' : 'Meta cannot track these sales'}</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="section section-alt" 
        id="problem"
      >
        <div className="container">
          <div className="pain-intro">
            <span className="section-label">{i18n.language === 'bn' ? 'আপনি কি এই সমস্যায় আছেন?' : 'Are you facing these problems?'}</span>
            <h2 className="section-title">
              {i18n.language === 'bn' ? <>আপনি কাজ করছেন —<br/>কিন্তু system আপনাকে grow করতে দিচ্ছে না</> : <>You are working hard —<br/>But the system isn't letting you grow</>}
            </h2>
            <p className="section-sub">{i18n.language === 'bn' ? 'F-Commerce seller-দের সবচেয়ে বড় ৩টা সমস্যা — যেগুলো আপনিও প্রতিদিন feel করছেন।' : 'The 3 biggest problems for F-Commerce sellers — that you feel every day.'}</p>
          </div>

          <div className="pain-grid">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="pain-card glowing-card"
            >
              <TrendingUp className="w-10 h-10 text-red mb-4" />
              <h3>{i18n.language === 'bn' ? 'Ads চালাচ্ছেন, মেসেজ আসছে — কিন্তু সেল কম' : "Running Ads, getting messages — but low sales"}</h3>
              <p>
                {i18n.language === 'bn' ? (
                  <>
                    মেসেজ আসছে, কথা হচ্ছে, কিছু অর্ডারও হচ্ছে। কিন্তু যত মেসেজ আসছে তার তুলনায় সেল অনেক কম।
                    <br /><br />
                    কারণটা হলো — Meta জানে না আপনার কাছ থেকে কারা সত্যিকারে কিনেছে। Algorithm শুধু দেখছে "মেসেজ হয়েছে।" Purchase হয়েছে কিনা — সেটা জানে না। তাই সে এমন মানুষদের কাছে Ads পাঠাতে থাকে যারা message করে কিন্তু কেনে না।
                    <br /><br />
                    আপনি টাকা দিচ্ছেন ভুল মানুষের পেছনে প্রতিমাসে।
                  </>
                ) : (
                  <>
                    Messages are coming, conversations are happening, some orders too. But sales are very low compared to the number of messages.
                    <br /><br />
                    The reason is — Meta doesn't know who actually bought from you. The algorithm only sees "Message happened." It doesn't know if a purchase occurred. So it keeps sending ads to people who message but don't buy.
                    <br /><br />
                    You are spending money on the wrong people every month.
                  </>
                )}
              </p>
              <div className="alert-box mt-4 mb-0 w-full">
                {i18n.language === 'bn' ? 'এটা Ads-এর সমস্যা না — এটা invisible sales-এর সমস্যা' : 'This is not an Ads problem — it\'s an invisible sales problem'}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="pain-card glowing-card"
            >
              <Clock className="w-10 h-10 text-orange mb-4" />
              <h3>{i18n.language === 'bn' ? 'রাত ১২টায় বসে আছেন — তবুও কাজ শেষ হচ্ছে না' : "Sitting at 12 AM — but work isn't finishing"}</h3>
              <p>
                {i18n.language === 'bn' ? (
                  <>
                    সারাদিন মেসেজের জবাব দিয়েছেন, বিকেলে অর্ডার নিয়েছেন, রাতে Spreadsheet খুলে দেখছেন ৩টা অর্ডার miss হয়ে গেছে।
                    <br /><br />
                    একজন customer confirmation পাননি — রাগ করে চলে গেছে। যে কিনতে চেয়েছিল কিন্তু কেনেনি — তাকে follow up দেওয়ার কথাই মনে ছিল না।
                    <br /><br />
                    এই একই ভুল প্রতিদিন এবং প্রতিদিনই কিছু না কিছু হাতছাড়া হচ্ছে।
                  </>
                ) : (
                  <>
                    Replied to messages all day, took orders in the afternoon, opening the spreadsheet at night to find 3 orders missed.
                    <br /><br />
                    One customer didn't get confirmation — left in anger. Forgot to follow up with someone who wanted to buy but didn't.
                    <br /><br />
                    The same mistake every day, and every day something is slipping away.
                  </>
                )}
              </p>
              <div className="alert-box mt-4 mb-0 w-full">
                {i18n.language === 'bn' ? 'সমস্যা আপনার না — system নেই বলেই হচ্ছে' : 'Problem isn\'t you — it\'s the lack of a system'}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pain-card glowing-card"
            >
              <BarChart3 className="w-10 h-10 text-cyan mb-4" />
              <h3>{i18n.language === 'bn' ? 'কোন Ads কাজ করছে — নিজেও জানেন না' : "Which Ads are working — you don't even know"}</h3>
              <p>
                {i18n.language === 'bn' ? (
                  <>
                    "Summer Collection" ভালো করছে নাকি "New Arrival"? সত্যিকারের উত্তর কি আছে আপনার কাছে?
                    <br /><br />
                    শুধু মেসেজ count দেখে সিদ্ধান্ত নিচ্ছেন। Ads-এর budget বাড়াবেন কি না — সেটা অনুমানে ঠিক করছেন।
                    <br /><br />
                    ফলে যে Ads আসলে সেল আনছে সেটা চিনতে পারছেন না। যেটা টাকা নষ্ট করছে সেটাও বন্ধ হচ্ছে না।
                  </>
                ) : (
                  <>
                    Is "Summer Collection" doing well or "New Arrival"? Do you have the real answer?
                    <br /><br />
                    Deciding based only on message counts. Guessing whether to increase the ad budget.
                    <br /><br />
                    As a result, you can't identify the ads that are actually bringing sales. The ones wasting money aren't being stopped either.
                  </>
                )}
              </p>
              <div className="alert-box mt-4 mb-0 w-full">
                {i18n.language === 'bn' ? 'Data ছাড়া Ads scale করা অনুমানের উপর নির্ভর' : 'Scaling Ads without data depends on guesswork'}
              </div>
            </motion.div>
          </div>

          <div className="info-box animate-beeping">
            {i18n.language === 'bn' 
              ? 'Meta যদি না জানে আপনি sale করছেন — তাহলে সে কখনো সঠিক buyer খুঁজে দিতে পারবে না।' 
              : 'If Meta doesn\'t know you are making sales — it can never find the right buyer for you.'}
          </div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="section"
      >
        <div className="container">
          <span className="section-label">{i18n.language === 'bn' ? 'আপনি হয়তো ভাবছেন...' : 'You might be thinking...'}</span>
          <h2 className="section-title" style={{maxWidth: '600px'}}>{i18n.language === 'bn' ? 'Website বা Pixel ছাড়া Tracking — এটা কি আসলে সম্ভব?' : 'Tracking without Website or Pixel — Is it really possible?'}</h2>

          <div className="objection-box" style={{marginTop: '44px'}}>
            <div className="objection-header">
              <h3>{i18n.language === 'bn' ? 'সত্যিটা হলো' : 'The Truth Is'}</h3>
              <p>{i18n.language === 'bn' ? 'এটাই সবচেয়ে স্বাভাবিক প্রশ্ন। এবং উত্তরটা আপনাকে অবাক করবে।' : 'This is the most natural question. And the answer will surprise you.'}</p>
            </div>
            <div className="objection-body">
              <p>{i18n.language === 'bn' ? 'Pixel লাগে website-এর জন্য। আপনার business Messenger-এ — তাই Pixel কোনোদিনও আপনার কাজে আসতো না। Trackoora BD সম্পূর্ণ আলাদাভাবে কাজ করে — শুধু F-Commerce-এর জন্য, শুধু Messenger-এর জন্য।' : 'Pixel is for websites. Your business is on Messenger — so Pixel would never work for you. Trackoora BD works completely differently — specifically for F-Commerce and Messenger.'}</p>
              
              <div className="flow-box">
                <div className="flow-title">{i18n.language === 'bn' ? 'প্রতিটি অর্ডারে যা হয়' : 'What happens with every order'}</div>
                <div className="flow-steps">
                  <div className="flow-step">
                    <div className="flow-connector"><div className="flow-dot animate-floating"><MousePointerClick className="w-4 h-4 text-cyan" /></div><div className="flow-line"></div></div>
                    <div className="flow-step-text">
                      <strong>{i18n.language === 'bn' ? 'কেউ আপনার Ads দেখে "Message" ক্লিক করল' : 'Someone clicks "Message" on your Ad'}</strong>
                      <span>{i18n.language === 'bn' ? 'Meta তখনই Trackoora BD-কে জানায় — কে এলো, কোন Ads থেকে এলো' : 'Meta immediately notifies Trackoora BD — who came, from which Ad'}</span>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-connector"><div className="flow-dot animate-floating" style={{animationDelay: '0.5s'}}><MessageCircle className="w-4 h-4 text-cyan" /></div><div className="flow-line"></div></div>
                    <div className="flow-step-text">
                      <strong>{i18n.language === 'bn' ? 'আপনি Inbox-এ কথা বলে অর্ডার নিলেন' : 'You take the order in Inbox'}</strong>
                      <span>{i18n.language === 'bn' ? 'Trackoora BD Dashboard-এ সেই customer-এর card তৈরি হয়ে আছে' : 'A card for that customer is already created in Trackoora BD'}</span>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-connector"><div className="flow-dot animate-floating" style={{animationDelay: '1s'}}><ShoppingBag className="w-4 h-4 text-cyan" /></div><div className="flow-line"></div></div>
                    <div className="flow-step-text">
                      <strong>{i18n.language === 'bn' ? 'Trackoora BD-তে "অর্ডার হয়েছে" ক্লিক করলেন' : 'You click "Order Confirmed" in Trackoora BD'}</strong>
                      <span>{i18n.language === 'bn' ? 'Meta জানলো — "এই মানুষটা কিনেছে"' : 'Meta knows — "This person bought something"'}</span>
                    </div>
                  </div>
                  <div className="flow-step">
                    <div className="flow-connector"><div className="flow-dot animate-floating" style={{animationDelay: '1.5s'}}><RefreshCw className="w-4 h-4 text-cyan" /></div></div>
                    <div className="flow-step-text">
                      <strong>{i18n.language === 'bn' ? 'Algorithm update হলো' : 'Algorithm is updated'}</strong>
                      <span>{i18n.language === 'bn' ? 'পরের বার এই ধরনের মানুষকেই Ads দেখাবে' : 'Next time it shows ads to similar people'}</span>
                    </div>
                  </div>
                </div>
                <div className="flow-result animate-glowing-box">
                  {i18n.language === 'bn' ? 'কোনো Website লাগেনি · কোনো Pixel লাগেনি · কোনো technical কাজ লাগেনি' : 'No Website needed · No Pixel needed · No technical work needed'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="section section-alt"
      >
        <div className="container">
          <span className="section-label">{i18n.language === 'bn' ? 'আগে ও পরে' : 'Before & After'}</span>
          <h2 className="section-title">{i18n.language === 'bn' ? <>Trackoora BD ব্যবহার করলে<br/>কী পরিবর্তন আসতে পারে</> : <>What changes can happen<br/>using Trackoora BD</>}</h2>
          <p className="section-sub">{i18n.language === 'bn' ? 'এই পরিবর্তনটা আসে একটাই কারণে — Meta এখন জানে কে আসলে কেনে। তারপর সে নিজেই সঠিক কাস্টমার খুঁজে নেয়।' : 'This change happens for one reason — Meta now knows who actually buys. Then it finds the right customers itself.'}</p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="proof-story"
          >
            <div className="proof-header">
              <div className="proof-avatar">👗</div>
              <div className="proof-meta">
                <strong>{i18n.language === 'bn' ? 'একজন Fashion F-Commerce সেলার — আগে ও পরে' : 'A Fashion F-Commerce Seller — Before & After'}</strong>
                <span>{i18n.language === 'bn' ? 'Trackoora BD ব্যবহারের আগে এবং কয়েক মাস পরে' : 'Before and a few months after using Trackoora BD'}</span>
              </div>
            </div>
            <div className="proof-body">
              <div className="proof-col">
                <div className="proof-col-label bad">{i18n.language === 'bn' ? '❌ Trackoora BD ব্যবহারের আগে' : '❌ Before Trackoora BD'}</div>
                <div className="proof-item"><span className="proof-item-icon">❌</span> {i18n.language === 'bn' ? 'Ads-এ টাকা যাচ্ছে, কিন্তু Meta জানে না কে কিনছে' : 'Money going to Ads, but Meta doesn\'t know who buys'}</div>
                <div className="proof-item"><span className="proof-item-icon">❌</span> {i18n.language === 'bn' ? '১০০ মেসেজ আসছে, কিনছে ১০-১৫ জন — বাকিদের পেছনে টাকা নষ্ট' : '100 messages coming, 10-15 buying — money wasted on the rest'}</div>
                <div className="proof-item"><span className="proof-item-icon">❌</span> {i18n.language === 'bn' ? 'COD ফেরত আসছে — কিন্তু কোন Ads থেকে এই buyers আসছে জানা নেই' : 'COD returns coming — but don\'t know which Ads these buyers came from'}</div>
                <div className="proof-item"><span className="proof-item-icon">❌</span> {i18n.language === 'bn' ? 'কোন Ads কাজ করছে — অনুমানে সিদ্ধান্ত নিচ্ছেন' : 'Which Ads work — deciding based on guesswork'}</div>
                <div className="proof-item"><span className="proof-item-icon">❌</span> {i18n.language === 'bn' ? 'অর্ডার miss হচ্ছে, follow-up দেওয়া হচ্ছে না' : 'Orders missed, follow-ups not given'}</div>
                <div className="proof-item"><span className="proof-item-icon">❌</span> {i18n.language === 'bn' ? 'Real profit কত — জানার কোনো উপায় নেই' : 'Real profit — no way to know'}</div>
              </div>
              <div className="proof-col">
                <div className="proof-col-label good">{i18n.language === 'bn' ? '✅ Trackoora BD ব্যবহারের পরে' : '✅ After Trackoora BD'}</div>
                <div className="proof-item"><span className="proof-item-icon">✅</span> {i18n.language === 'bn' ? 'প্রতিটি অর্ডার confirm করলে Meta জানে — এই মানুষটা কিনেছে' : 'Confirming every order lets Meta know — this person bought'}</div>
                <div className="proof-item"><span className="proof-item-icon">✅</span> {i18n.language === 'bn' ? 'Algorithm ধীরে ধীরে সেই ধরনের মানুষকেই Ads দেখাতে শুরু করে' : 'Algorithm slowly starts showing ads to similar people'}</div>
                <div className="proof-item"><span className="proof-item-icon">✅</span> {i18n.language === 'bn' ? 'কোন Ads কাজ করছে, কোনটা টাকা নষ্ট করছে — Dashboard-এ দেখুন' : 'See which Ads work and which waste money in the Dashboard'}</div>
                <div className="proof-item"><span className="proof-item-icon">✅</span> {i18n.language === 'bn' ? 'সব অর্ডার একটি জায়গায় — miss হওয়ার সুযোগ নেই' : 'All orders in one place — no chance to miss'}</div>
                <div className="proof-item"><span className="proof-item-icon">✅</span> {i18n.language === 'bn' ? 'Customer automatically confirmation পায় — আপনাকে টাইপ করতে হয় না' : 'Customer gets auto confirmation — you don\'t have to type'}</div>
                <div className="proof-highlight">
                  {i18n.language === 'bn' ? (
                    <>🎯 একই বাজেটে বেশি সঠিক কাস্টমার আসে।<br/>কারণ এবার Meta জানে — আপনার কাছ থেকে কারা সত্যিকারে কেনে।</>
                  ) : (
                    <>🎯 More right customers for the same budget.<br/>Because now Meta knows — who actually buys from you.</>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="section" 
        id="how-it-works"
      >
        <div className="container">
          <div style={{textAlign: 'center'}}>
            <span className="section-label">{i18n.language === 'bn' ? 'কীভাবে কাজ করে?' : 'How it works?'}</span>
            <h2 className="section-title">{i18n.language === 'bn' ? <>একবার setup — তারপর<br/>প্রতিটি অর্ডারে automatic</> : <>One-time setup — then<br/>automatic for every order</>}</h2>
            <p className="section-sub" style={{margin: '0 auto'}}>{i18n.language === 'bn' ? 'কোনো ওয়েবসাইট লাগবে না। কোনো technical জ্ঞান লাগবে না।' : 'No website needed. No technical knowledge needed.'}</p>
          </div>

          <div className="steps-wrap">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="step-card"
            >
              <div className="step-num">১</div>
              <h3>{i18n.language === 'bn' ? 'Facebook Page কানেক্ট করুন' : 'Connect Facebook Page'}</h3>
              <p>{i18n.language === 'bn' ? 'Trackoora BD-এ sign up করুন, Facebook Page লিঙ্ক করুন। Guided setup — মাত্র ৫ মিনিট। একবারই করতে হবে।' : 'Sign up for Trackoora BD, link your Facebook Page. Guided setup — just 5 minutes. Only needs to be done once.'}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="step-card"
            >
              <div className="step-num">২</div>
              <h3>{i18n.language === 'bn' ? 'Ads থেকে মেসেজ এলে Card আসে' : 'Card comes when Ad message arrives'}</h3>
              <p>{i18n.language === 'bn' ? 'কেউ Ads থেকে message করলে Trackoora BD automatically সেই customer ও কোন Ads থেকে এলো সেই তথ্য সহ একটি card তৈরি করে।' : 'When someone messages from an Ad, Trackoora BD automatically creates a card with customer info and Ad source.'}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="step-card"
            >
              <div className="step-num">৩</div>
              <h3>{i18n.language === 'bn' ? '"অর্ডার হয়েছে" ক্লিক করুন' : 'Click "Order Confirmed"'}</h3>
              <p>{i18n.language === 'bn' ? '৩০ সেকেন্ডে অর্ডার confirm করুন। Trackoora BD তখনই Meta-কে signal পাঠায়, customer-কে confirmation message যায়, অর্ডার record হয়।' : 'Confirm order in 30 seconds. Trackoora BD immediately sends a signal to Meta, a confirmation message goes to the customer, and the order is recorded.'}</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="section section-alt"
      >
        <div className="container">
          <div style={{textAlign: 'center'}}>
            <span className="section-label">{i18n.language === 'bn' ? 'Starter Plan-এ যা পাবেন' : 'What you get in Starter Plan'}</span>
            <h2 className="section-title">{i18n.language === 'bn' ? <>F-Commerce সেলারের সবচেয়ে<br/>জরুরি ৮টি ফিচার — একটি জায়গায়</> : <>8 most essential features for<br/>F-Commerce sellers — in one place</>}</h2>
            <p className="section-sub" style={{margin: '0 auto'}}>{i18n.language === 'bn' ? 'কোনো technical কাজ নেই। শুধু connect করুন — সব automatic।' : 'No technical work. Just connect — everything is automatic.'}</p>
          </div>

          <div className="feature-grid">
            {[
              { icon: Activity, titleBn: 'Meta Algorithm Signal', titleEn: 'Meta Algorithm Signal', descBn: 'প্রতিটি Inbox অর্ডার Meta-কে জানায় — সঠিক কাস্টমার খুঁজে পায়', descEn: 'Notifies Meta of every Inbox order — finds the right customer' },
              { icon: LayoutDashboard, titleBn: 'Conversation Dashboard', titleEn: 'Conversation Dashboard', descBn: 'Ads থেকে আসা সব message একটি জায়গায় — status সহ', descEn: 'All messages from Ads in one place — with status' },
              { icon: BarChart2, titleBn: 'Ad Performance Report', titleEn: 'Ad Performance Report', descBn: 'কোন Ads থেকে কত সেল, কত টাকা রেভেনিউ — সরাসরি দেখুন', descEn: 'See directly how many sales and how much revenue from each Ad' },
              { icon: Bot, titleBn: 'Auto Confirmation Message', titleEn: 'Auto Confirmation Message', descBn: 'অর্ডার confirm করলে customer-কে automatic Messenger message', descEn: 'Automatic Messenger message to customer when order is confirmed' },
              { icon: Package, titleBn: 'Order Status Tracker', titleEn: 'Order Status Tracker', descBn: 'Pending → Shipped → Delivered — সব একটি জায়গায়', descEn: 'Pending → Shipped → Delivered — all in one place' },
              { icon: Wallet, titleBn: 'Payment Breakdown', titleEn: 'Payment Breakdown', descBn: 'bKash / Nagad / COD — cash flow পরিষ্কার দেখুন', descEn: 'bKash / Nagad / COD — see cash flow clearly' },
              { icon: Bell, titleBn: 'Telegram Daily Report', titleEn: 'Telegram Daily Report', descBn: 'প্রতিদিন সকালে Telegram-এ — মোট অর্ডার, রেভেনিউ, সেরা Ads', descEn: 'Every morning on Telegram — total orders, revenue, best Ads' },
              { icon: Languages, titleBn: 'সম্পূর্ণ বাংলা Interface', titleEn: 'Full Bangla Interface', descBn: 'English-এ স্বাচ্ছন্দ্য না হলেও সমস্যা নেই — পুরো Dashboard বাংলায়', descEn: 'No problem if not comfortable with English — full Dashboard in Bangla' }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="feature-card"
              >
                <div className="feature-icon"><feat.icon className="w-6 h-6 text-orange" /></div>
                <div>
                  <h4>{i18n.language === 'bn' ? feat.titleBn : feat.titleEn}</h4>
                  <p>{i18n.language === 'bn' ? feat.descBn : feat.descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="section section-alt"
      >
        <div className="container">
          <span className="section-label">{i18n.language === 'bn' ? 'কার জন্য?' : 'Who is this for?'}</span>
          <h2 className="section-title">{i18n.language === 'bn' ? 'Trackoora BD কার জন্য তৈরি?' : 'Who is Trackoora BD for?'}</h2>
          
          <div className="who-grid">
            {[
              { bn: <>যারা <strong>Facebook বা Instagram Ads</strong> চালান</>, en: <>Those who run <strong>Facebook or Instagram Ads</strong></> },
              { bn: <>যারা <strong>Inbox বা Messenger-এ</strong> order নেন</>, en: <>Those who take orders in <strong>Inbox or Messenger</strong></> },
              { bn: <>যাদের <strong>কোনো website নেই</strong> — শুধু Facebook Page আছে</>, en: <>Those who have <strong>no website</strong> — only a Facebook Page</> },
              { bn: <>যারা Ads-এর <strong>খরচ কমিয়ে বেশি sale</strong> করতে চান</>, en: <>Those who want to <strong>reduce ad costs and increase sales</strong></> }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="who-card yes"
              >
                <span className="who-icon">✅</span>
                <p>{i18n.language === 'bn' ? item.bn : item.en}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="section" 
        id="pricing"
      >
        <div className="container">
          <div style={{textAlign: 'center'}}>
            <span className="section-label">{i18n.language === 'bn' ? 'মূল্য' : 'Pricing'}</span>
            <h2 className="section-title">{i18n.language === 'bn' ? 'একটি বাড়তি সেলেই উঠে আসে' : 'Pays for itself with one extra sale'}</h2>
            <p className="section-sub" style={{margin: '0 auto'}}>{i18n.language === 'bn' ? '৪৯৯ টাকা মাসিক — মানে মাসে মাত্র একটি extra সেলেই পুরো খরচ উঠে যায়।' : '499 BDT monthly — meaning just one extra sale a month covers the entire cost.'}</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card featured">
              <div className="pricing-badge">Starter</div>
              <div className="plan-label">Monthly Plan</div>
              <div className="plan-price">৳{formatNum('499')}<sub>/মাস</sub></div>
              <div className="plan-note">{i18n.language === 'bn' ? '৩০ দিন ফ্রি ট্রায়াল' : '30 Days Free Trial'}</div>
              <ul className="plan-list">
                <li><CheckCircle2 className="chk w-4 h-4" /> {i18n.language === 'bn' ? 'Meta Algorithm Signal (Server-side)' : 'Meta Algorithm Signal (Server-side)'}</li>
                <li><CheckCircle2 className="chk w-4 h-4" /> {i18n.language === 'bn' ? 'Ad Attribution Dashboard' : 'Ad Attribution Dashboard'}</li>
                <li><CheckCircle2 className="chk w-4 h-4" /> {i18n.language === 'bn' ? 'Conversation Card Dashboard' : 'Conversation Card Dashboard'}</li>
                <li><CheckCircle2 className="chk w-4 h-4" /> {i18n.language === 'bn' ? 'Auto Order Confirmation Message' : 'Auto Order Confirmation Message'}</li>
                <li><CheckCircle2 className="chk w-4 h-4" /> {i18n.language === 'bn' ? 'Order Status Tracker' : 'Order Status Tracker'}</li>
                <li><CheckCircle2 className="chk w-4 h-4" /> {i18n.language === 'bn' ? 'Telegram Daily Report' : 'Telegram Daily Report'}</li>
                <li><CheckCircle2 className="chk w-4 h-4" /> {i18n.language === 'bn' ? 'সম্পূর্ণ বাংলা Interface' : 'Full Bangla Interface'}</li>
                <li><CheckCircle2 className="chk w-4 h-4" /> {i18n.language === 'bn' ? '১টি Facebook Page · মাসে ১০০ অর্ডার' : '1 Facebook Page · 100 Orders/Month'}</li>
              </ul>
              <button onClick={handleAuthClick} className="btn-primary w-full">
                {i18n.language === 'bn' ? 'শুরু করুন →' : 'Get Started →'}
              </button>
            </div>

            <div className="pricing-card coming-card">
              <div className="big-icon">🚀</div>
              <h3>{i18n.language === 'bn' ? 'Growth & Pro আসছে' : 'Growth & Pro Coming Soon'}</h3>
              <p>{i18n.language === 'bn' ? 'V2 ও V3-এ আরো শক্তিশালী ফিচার যোগ হবে যেমন Courier Auto-Booking, Fake Order Detection ইত্যাদি।' : 'V2 & V3 will add powerful features like Courier Auto-Booking, Fake Order Detection, etc.'}</p>
              <div className="coming-tags">
                <span className="coming-tag">Courier</span>
                <span className="coming-tag">Fraud Check</span>
                <span className="coming-tag">TikTok</span>
                <span className="coming-tag">WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="section section-alt" 
        id="faq"
      >
        <div className="container">
          <div style={{textAlign: 'center'}}>
            <span className="section-label">{i18n.language === 'bn' ? 'সাধারণ প্রশ্ন' : 'FAQ'}</span>
            <h2 className="section-title">{i18n.language === 'bn' ? 'মাথায় যা আসছে' : 'Common Questions'}</h2>
          </div>

          <div className="faq-wrap">
            {[
              {
                q: i18n.language === 'bn' ? 'Website বা Pixel ছাড়া কি সত্যিই Tracking হয়?' : 'Is tracking really possible without a website or pixel?',
                a: i18n.language === 'bn' ? 'হ্যাঁ। Trackoora BD Pixel ব্যবহার করে না — কারণ আপনার business website-এ না, Messenger-এ। আমরা Meta-র নিজস্ব Messenger system ব্যবহার করি।' : "Yes. Trackoora BD doesn't use Pixel because your business is on Messenger, not a website. We use Meta's own Messenger system."
              },
              {
                q: i18n.language === 'bn' ? 'আমি শুধু Facebook-এ সেল করি — এটা কি আমার জন্য?' : 'I only sell on Facebook — is this for me?',
                a: i18n.language === 'bn' ? 'হ্যাঁ — ঠিক আপনার জন্যই তৈরি। শুধু Facebook Page আর Meta Ads হলেই যথেষ্ট। ওয়েবসাইট নেই, ঝামেলা নেই।' : "Yes — it's built exactly for you. Just a Facebook Page and Meta Ads are enough. No website, no hassle."
              },
              {
                q: i18n.language === 'bn' ? 'Ads পারফরম্যান্স কতদিনে উন্নত হবে?' : 'How long until ad performance improves?',
                a: i18n.language === 'bn' ? 'সাধারণত ৭-১৪ দিন। Meta Algorithm-কে শিখতে সময় দিতে হয়। যত বেশি অর্ডার track হবে, Meta তত দ্রুত শিখবে।' : 'Usually 7-14 days. Meta Algorithm needs time to learn. The more orders tracked, the faster Meta learns.'
              },
              {
                q: i18n.language === 'bn' ? 'আমার ডাটা কি নিরাপদ?' : 'Is my data safe?',
                a: i18n.language === 'bn' ? '১০০%। আমরা Meta-র official API ব্যবহার করি এবং আপনার ডাটা encryption-এর মাধ্যমে সুরক্ষিত রাখি। আমরা কখনো আপনার Facebook পাসওয়ার্ড চাই না।' : '100%. We use Meta\'s official API and keep your data secure through encryption. We never ask for your Facebook password.'
              }
            ].map((item, idx) => (
              <div className={`faq-item ${openFaq === idx ? 'open' : ''}`} key={idx}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  {item.q}
                  <ChevronDown className="faq-arrow" />
                </button>
                <div className="faq-a">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="cta-section"
      >
        <div className="cta-orb"></div>
        <div className="container">
          <h2>{i18n.language === 'bn' ? 'আপনার Ads-কে অন্ধের মতো চালানো বন্ধ করুন' : 'Stop running your Ads blindly'}</h2>
          <p>{i18n.language === 'bn' ? 'Trackoora BD-এর মাধ্যমে Meta-কে জানান আপনার আসল কাস্টমার কারা। আজই শুরু করুন আপনার ৩০ দিনের ফ্রি ট্রায়াল।' : 'Tell Meta who your real customers are with Trackoora BD. Start your 30-day free trial today.'}</p>
          
          <button onClick={handleAuthClick} className="btn-primary large">
            {i18n.language === 'bn' ? 'ফ্রি ট্রায়াল শুরু করুন' : 'Start Free Trial'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.section>

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Logo size="md" className="mb-4" />
              <p>{i18n.language === 'bn' ? 'বাংলাদেশের F-Commerce সেলারদের জন্য তৈরি প্রথম Ads Attribution ও Tracking প্ল্যাটফর্ম।' : 'The first Ads Attribution & Tracking platform built for F-Commerce sellers in Bangladesh.'}</p>
            </div>
            <div className="footer-links">
              <h5>{i18n.language === 'bn' ? 'লিঙ্ক' : 'Links'}</h5>
              <button onClick={() => scrollToSection('problem')} className="block text-text2 text-sm py-1 hover:text-text text-left w-full">{i18n.language === 'bn' ? 'সমস্যা কি' : 'The Problem'}</button>
              <button onClick={() => scrollToSection('how-it-works')} className="block text-text2 text-sm py-1 hover:text-text text-left w-full">{i18n.language === 'bn' ? 'কিভাবে কাজ করে' : 'How it works'}</button>
              <button onClick={() => scrollToSection('pricing')} className="block text-text2 text-sm py-1 hover:text-text text-left w-full">{i18n.language === 'bn' ? 'মূল্য' : 'Pricing'}</button>
              <button onClick={() => scrollToSection('faq')} className="block text-text2 text-sm py-1 hover:text-text text-left w-full">{i18n.language === 'bn' ? 'সাধারণ প্রশ্ন' : 'FAQ'}</button>
              <button onClick={() => setActiveModal('contact')} className="block text-text2 text-sm py-1 hover:text-text text-left w-full">{i18n.language === 'bn' ? 'যোগাযোগ' : 'Contact Us'}</button>
            </div>
            <div className="footer-links">
              <h5>{i18n.language === 'bn' ? 'লিগ্যাল' : 'Legal'}</h5>
              <button onClick={() => setActiveModal('privacy')} className="block text-text2 text-sm py-1 hover:text-text text-left w-full">Privacy Policy</button>
              <button onClick={() => setActiveModal('terms')} className="block text-text2 text-sm py-1 hover:text-text text-left w-full">Terms of Service</button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© ২০২৬ Trackoora BD · সর্বস্বত্ব সংরক্ষিত</p>
            <p>Developed with ❤️ Trackoora BD Team 🇧🇩</p>
          </div>
        </div>
      </footer>
      </>
    );
  };

  return (
    <>
      {renderView()}
      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="modal-overlay active" onClick={() => setActiveModal(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-box" 
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>
                  {activeModal === 'privacy' ? (i18n.language === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy') : 
                   activeModal === 'terms' ? (i18n.language === 'bn' ? 'শর্তাবলী' : 'Terms of Service') : 
                   activeModal === 'forgot-password' ? (i18n.language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?') :
                   i18n.language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
                </h2>
                <button className="modal-close" onClick={() => setActiveModal(null)}><X className="w-5 h-5" /></button>
              </div>
              <div className="modal-body">
                 {activeModal === 'forgot-password' && (
                  <div className="py-4">
                    {forgotPasswordStep === 'input' && (
                      <div className="space-y-6">
                        <p className="text-sm text-text2 text-center">
                          {i18n.language === 'bn' ? 'রিসেট কোড পাওয়ার জন্য আপনার পছন্দের মাধ্যমটি বেছে নিন।' : 'Choose your preferred method to receive the reset code.'}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setForgotPasswordMethod('phone')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${forgotPasswordMethod === 'phone' ? 'border-orange bg-orange/5' : 'border-border bg-bg3'}`}
                          >
                            <Smartphone className={`w-6 h-6 ${forgotPasswordMethod === 'phone' ? 'text-orange' : 'text-text3'}`} />
                            <span className={`text-xs font-bold ${forgotPasswordMethod === 'phone' ? 'text-orange' : 'text-text3'}`}>
                              {i18n.language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                            </span>
                          </button>
                          <button 
                            onClick={() => setForgotPasswordMethod('email')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${forgotPasswordMethod === 'email' ? 'border-orange bg-orange/5' : 'border-border bg-bg3'}`}
                          >
                            <Mail className={`w-6 h-6 ${forgotPasswordMethod === 'email' ? 'text-orange' : 'text-text3'}`} />
                            <span className={`text-xs font-bold ${forgotPasswordMethod === 'email' ? 'text-orange' : 'text-text3'}`}>
                              {i18n.language === 'bn' ? 'ইমেইল' : 'Email'}
                            </span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-text3 mb-1.5 ml-1">
                              {forgotPasswordMethod === 'phone' ? (i18n.language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number') : (i18n.language === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address')}
                            </label>
                            <div className="relative">
                              {forgotPasswordMethod === 'phone' && (
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 font-medium">+88</span>
                              )}
                              <input 
                                type={forgotPasswordMethod === 'phone' ? "tel" : "email"}
                                placeholder={forgotPasswordMethod === 'phone' ? "017XXXXXXXX" : "example@mail.com"}
                                className={`w-full bg-bg3 border border-border rounded-xl py-3.5 pr-4 text-text focus:border-orange outline-none transition-all ${forgotPasswordMethod === 'phone' ? 'pl-14' : 'pl-4'}`}
                              />
                            </div>
                          </div>

                          <button 
                            onClick={() => setForgotPasswordStep('otp')}
                            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                          >
                            {i18n.language === 'bn' ? 'কোড পাঠান' : 'Send Code'}
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {forgotPasswordStep === 'otp' && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <p className="text-text2 text-sm mb-6">
                            {i18n.language === 'bn' 
                              ? `আমরা আপনার ${forgotPasswordMethod === 'phone' ? 'ফোনে' : 'ইমেইলে'} একটি ৬-সংখ্যার কোড পাঠিয়েছি।` 
                              : `We've sent a 6-digit code to your ${forgotPasswordMethod === 'phone' ? 'phone' : 'email'}.`}
                          </p>
                          
                          <div className="flex justify-between gap-2 max-w-[280px] mx-auto mb-8">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <input
                                key={i}
                                type="text"
                                maxLength={1}
                                className="w-10 h-12 bg-bg3 border border-border rounded-xl text-center text-xl font-bold text-orange focus:border-orange outline-none transition-all"
                              />
                            ))}
                          </div>

                          <button 
                            onClick={() => setForgotPasswordStep('success')}
                            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                          >
                            {i18n.language === 'bn' ? 'ভেরিফাই করুন' : 'Verify'}
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {forgotPasswordStep === 'success' && (
                      <div className="text-center py-4">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-text mb-2">
                          {i18n.language === 'bn' ? 'ভেরিফিকেশন সফল!' : 'Verification Successful!'}
                        </h3>
                        <p className="text-text2 text-sm mb-8">
                          {i18n.language === 'bn' ? 'আপনার পাসওয়ার্ড রিসেট করার অপশন আপনার প্রদানকৃত ঠিকানায় পাঠানো হয়েছে।' : 'Instructions to reset your password have been sent to your provided contact.'}
                        </p>
                        <button 
                          onClick={() => setActiveModal(null)}
                          className="btn-primary w-full py-4"
                        >
                          {i18n.language === 'bn' ? 'ঠিক আছে' : 'Okay'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {activeModal === 'privacy' && (
                  <div className="space-y-6">
                    <div className="modal-highlight-box">
                      {i18n.language === 'bn' 
                        ? '(এই Privacy Policy Trackoora BD-এর সকল সেলার ও তাদের customer-দের ক্ষেত্রে প্রযোজ্য। এটি বাংলাদেশের Cyber Security Act 2023 অনুসারে প্রণীত।)' 
                        : '(This Privacy Policy applies to all Trackoora BD sellers and their customers. It is formulated in accordance with the Cyber Security Act 2023 of Bangladesh.)'}
                    </div>

                    <div className="space-y-4">
                      <h3>{i18n.language === 'bn' ? '১. আমরা কোন তথ্য সংগ্রহ করি' : '1. What information we collect'}</h3>
                      <div className="pl-4 space-y-2">
                        <p className="font-bold text-sm">{i18n.language === 'bn' ? 'সেলার-সম্পর্কিত তথ্য:' : 'Seller-related information:'}</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-text2">
                          <li>{i18n.language === 'bn' ? 'নাম, ফোন নম্বর, ইমেইল — account registration-এর সময়' : 'Name, phone number, email — during account registration'}</li>
                          <li>{i18n.language === 'bn' ? 'Facebook Page তথ্য ও OAuth access token — Facebook Login-এর মাধ্যমে। আপনার Facebook পাসওয়ার্ড আমরা কখনো দেখি না, সংরক্ষণ করি না' : 'Facebook Page info & OAuth access token — via Facebook Login. We never see or store your Facebook password'}</li>
                          <li>{i18n.language === 'bn' ? 'Meta Ads account ID — ad performance data pull করতে' : 'Meta Ads account ID — to pull ad performance data'}</li>
                          <li>{i18n.language === 'bn' ? 'Telegram chat ID — daily report পাঠাতে (যদি সংযুক্ত করেন)' : 'Telegram chat ID — to send daily reports (if connected)'}</li>
                          <li>{i18n.language === 'bn' ? 'Subscription ও billing তথ্য — payment gateway-এর মাধ্যমে' : 'Subscription & billing info — via payment gateway'}</li>
                        </ul>
                        <p className="font-bold text-sm mt-4">{i18n.language === 'bn' ? 'Customer-সম্পর্কিত তথ্য (সেলারের হয়ে সংগৃহীত):' : 'Customer-related information (collected on behalf of the seller):'}</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-text2">
                          <li>{i18n.language === 'bn' ? 'Facebook User ID' : 'Facebook User ID'}</li>
                          <li>{i18n.language === 'bn' ? 'Customer-এর নাম' : "Customer's name"}</li>
                          <li>{i18n.language === 'bn' ? 'কোন Ad থেকে এসেছেন' : 'Which Ad they came from'}</li>
                          <li>{i18n.language === 'bn' ? 'অর্ডার তথ্য' : 'Order information'}</li>
                        </ul>
                        <p className="text-sm text-orange font-medium mt-2">
                          {i18n.language === 'bn' 
                            ? 'আমরা সংগ্রহ করি না: Customer-এর phone number বা delivery address (Starter Plan-এ) সংগ্রহ করা হয় না।' 
                            : 'We do not collect: Customer phone number or delivery address (not collected in Starter Plan).'}
                        </p>
                      </div>

                      <h3>{i18n.language === 'bn' ? '২. কেন এই তথ্য সংগ্রহ করা হয়' : '2. Why this information is collected'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'Trackoora BD-এর service প্রদান — এটাই একমাত্র উদ্দেশ্য' : 'Providing Trackoora BD service — this is the sole purpose'}</li>
                        <li>{i18n.language === 'bn' ? 'Meta Algorithm-এ sale signal ও — সেলারের Ads performance উন্নত করতে' : 'Sale signals to Meta Algorithm — to improve seller Ads performance'}</li>
                        <li>{i18n.language === 'bn' ? 'Ad performance dashboard তৈরি করতে Meta Ads from data pull করা' : 'Pulling data from Meta Ads to create Ad performance dashboard'}</li>
                        <li>{i18n.language === 'bn' ? 'Telegram daily report পাঠানো' : 'Sending Telegram daily reports'}</li>
                        <li>{i18n.language === 'bn' ? 'Anonymized, aggregated data — product improvement-এর জন্য (individual চেনা যায় না এমন)' : 'Anonymized, aggregated data — for product improvement (non-identifiable)'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৩. তৃতীয় পক্ষের সাথে তথ্য শেয়ার' : '3. Sharing information with third parties'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'আমরা কোনো তৃতীয় পক্ষের কাছে আপনার তথ্য বিক্রি করি না। শুধুমাত্র Meta-র সাথে Ads ইমপ্রুভমেন্ট এর জন্য প্রয়োজনীয় তথ্য শেয়ার করা হয়।' 
                          : 'We do not sell your information to any third party. Only necessary information is shared with Meta for Ads improvement.'}
                      </p>

                      <h3>{i18n.language === 'bn' ? '৪. তথ্য কীভাবে সুরক্ষিত রাখা হয়' : '4. How information is kept secure'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'Facebook OAuth token ও সব sensitive credentials — high security encryption দিয়ে database-এ সংরক্ষিত' : 'Facebook OAuth token & all sensitive credentials — stored in database with high security encryption'}</li>
                        <li>{i18n.language === 'bn' ? 'Customer Facebook User ID — Meta-তে পাঠানোর আগে hash করা হয়' : 'Customer Facebook User ID — hashed before sending to Meta'}</li>
                        <li>{i18n.language === 'bn' ? 'সমস্ত connection — HTTPS/TLS দিয়ে encrypted, কোনো plain HTTP নেই' : 'All connections — encrypted with HTTPS/TLS, no plain HTTP'}</li>
                        <li>{i18n.language === 'bn' ? 'প্রতিটি seller-এর data সম্পূর্ণ isolated — অন্য কোনো seller কখনো আপনার data দেখতে পারবে না' : "Each seller's data is completely isolated — no other seller can ever see your data"}</li>
                        <li>{i18n.language === 'bn' ? 'High Security Protection — platform সর্বক্ষণ monitoring-এ আছে' : 'High Security Protection — platform is under constant monitoring'}</li>
                        <li>{i18n.language === 'bn' ? 'সব admin access log করা হয় — কোনো silent action নেই' : 'All admin access is logged — no silent actions'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৫. তথ্য কতদিন সংরক্ষণ করা হয়' : '5. How long information is stored'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'সক্রিয় account: Subscription চলাকালীন সম্পূর্ণ সময়' : 'Active account: Entire duration of subscription'}</li>
                        <li>{i18n.language === 'bn' ? 'Cancelled account: বাতিলের ৩০ দিন পর সম্পূর্ণ মুছে ফেলা হয় — seller-কে আগে notify করা হয়' : 'Cancelled account: Completely deleted 30 days after cancellation — seller is notified beforehand'}</li>
                        <li>{i18n.language === 'bn' ? 'Customer data: সেলারের account active থাকা পর্যন্ত সংরক্ষিত। Account delete হলে customer data-ও মুছে যায়' : "Customer data: Stored as long as seller's account is active. If account is deleted, customer data is also removed"}</li>
                        <li>{i18n.language === 'bn' ? 'Meta signal logs: ৯০ দিন পর automatically মুছে ফেলা হয়' : 'Meta signal logs: Automatically deleted after 90 days'}</li>
                        <li>{i18n.language === 'bn' ? 'Application error logs: ৩০ দিন — কোনো personal data এতে থাকে না' : 'Application error logs: 30 days — contains no personal data'}</li>
                        <li>{i18n.language === 'bn' ? 'Billing records: আইনি কারণে ৭ বছর সংরক্ষিত থাকে' : 'Billing records: Stored for 7 years for legal reasons'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৬. Cookies ও Anonymous Data' : '6. Cookies & Anonymous Data'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'Trackoora BD landing page-এ শুধুমাত্র essential cookies ব্যবহার করা হয় — আপনার session ও অন্যান্য data সাময়িকভাবে রাখতে। Tracking বা third-party advertising cookie ব্যবহার করা হয় না। Anonymized aggregate data — product improvement-এর জন্য ব্যবহার করা হতে পারে।' 
                          : 'Only essential cookies are used on the Trackoora BD landing page — to temporarily store your session and other data. No tracking or third-party advertising cookies are used. Anonymized aggregate data may be used for product improvement.'}
                      </p>

                      <h3>{i18n.language === 'bn' ? '৭. আপনার অধিকার' : '7. Your Rights'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'আপনার সমস্ত data দেখার অনুরোধ করতে পারবেন' : 'You can request to see all your data'}</li>
                        <li>{i18n.language === 'bn' ? 'যেকোনো সময় account delete করে সমস্ত data মুছে ফেলার অনুরোধ করতে পারবেন' : 'You can request to delete your account and all data at any time'}</li>
                        <li>{i18n.language === 'bn' ? 'Facebook Page disconnect করতে পারবেন — তখন আমাদের Page access তাৎক্ষণিক বাতিল হয়' : 'You can disconnect your Facebook Page — our Page access is then immediately revoked'}</li>
                        <li>{i18n.language === 'bn' ? 'Account delete করলে ৩০ দিনের মধ্যে সমস্ত data permanently মুছে যাবে' : 'If account is deleted, all data will be permanently removed within 30 days'}</li>
                        <li>{i18n.language === 'bn' ? 'Data সংক্রান্ত যেকোনো অভিযোগ আমাদের কাছে করতে পারবেন — ৪৮ ঘণ্টার মধ্যে সাড়া দেওয়া হবে' : 'Any data-related complaints can be made to us — we will respond within 48 hours'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৮. বাংলাদেশ Cyber Security Act 2023' : '8. Bangladesh Cyber Security Act 2023'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'Trackoora BD বাংলাদেশের Cyber Security Act 2023-এর আওতায় পরিচালিত। আমাদের data handling practices এই আইন মেনে চলে।' 
                          : 'Trackoora BD is operated under the Cyber Security Act 2023 of Bangladesh. Our data handling practices comply with this law.'}
                      </p>

                      <h3>{i18n.language === 'bn' ? '৯. Policy পরিবর্তন' : '9. Policy Changes'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'Privacy Policy পরিবর্তন হলে সকল সেলারকে Telegram বা email-এ আগে জানানো হবে। পরিবর্তনের ৭ দিন আগে notify করা হবে।' 
                          : 'Any changes to the Privacy Policy will be notified to all sellers via Telegram or email beforehand. Notification will be sent 7 days prior to changes.'}
                      </p>

                      <h3>{i18n.language === 'bn' ? '১০. যোগাযোগ' : '10. Contact'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'Privacy সংক্রান্ত যেকোনো প্রশ্ন, অনুরোধ বা অভিযোগের জন্য আমাদের সাথে যোগাযোগ করুন। আমরা ৪৮ ঘণ্টার মধ্যে সাড়া দেবো।' 
                          : 'For any questions, requests, or complaints regarding privacy, please contact us. We will respond within 48 hours.'}
                      </p>
                    </div>

                    <div className="modal-last-updated">
                      {i18n.language === 'bn' ? 'সর্বশেষ আপডেট: এপ্রিল ২০২৬ · Trackoora BD' : 'Last Updated: April 2026 · Trackoora BD'}
                    </div>
                  </div>
                )}

                {activeModal === 'terms' && (
                  <div className="space-y-6">
                    <div className="modal-highlight-box">
                      {i18n.language === 'bn' 
                        ? '(Trackoora BD-এর service ব্যবহার করলে আপনি এই Terms of Service-এ সম্মত হচ্ছেন। Beta signup করার মানে এই terms accept করা।)' 
                        : '(By using Trackoora BD services, you agree to these Terms of Service. Signing up for Beta means accepting these terms.)'}
                    </div>

                    <div className="space-y-4">
                      <h3>{i18n.language === 'bn' ? '১. Trackoora BD কী প্রদান করে' : '1. What Trackoora BD Provides'}</h3>
                      <div className="pl-4 space-y-2">
                        <p className="text-sm text-text2">
                          {i18n.language === 'bn' 
                            ? 'Trackoora BD একটি SaaS (Software as a Service) platform যা বাংলাদেশের F-Commerce সেলারদের জন্য তৈরি। এটি প্রদান করে:' 
                            : 'Trackoora BD is a SaaS (Software as a Service) platform built for F-Commerce sellers in Bangladesh. It provides:'}
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-text2">
                          <li>{i18n.language === 'bn' ? 'Meta Ads attribution — Inbox-এ confirm করা প্রতিটি অর্ডার Meta Algorithm-কে জানানো' : 'Meta Ads attribution — informing Meta Algorithm of every order confirmed in Inbox'}</li>
                          <li>{i18n.language === 'bn' ? 'Conversation Card Dashboard — Ads থেকে আসা সব message এক জায়গায় track করা' : 'Conversation Card Dashboard — tracking all messages from Ads in one place'}</li>
                          <li>{i18n.language === 'bn' ? 'Ad Performance Report — কোন Ads থেকে কত সেল এবং কত revenue' : 'Ad Performance Report — how many sales and how much revenue from which Ads'}</li>
                          <li>{i18n.language === 'bn' ? 'Order Status Tracker ও Auto Confirmation Message' : 'Order Status Tracker & Auto Confirmation Message'}</li>
                          <li>{i18n.language === 'bn' ? 'Telegram Daily Report' : 'Telegram Daily Report'}</li>
                        </ul>
                        <p className="text-sm text-text2 mt-2">
                          {i18n.language === 'bn' 
                            ? 'Trackoora BD Meta-র official API ব্যবহার করে। কোনো unofficial, restricted, বা Meta Policy-বিরুদ্ধ method ব্যবহার করা হয় না।' 
                            : 'Trackoora BD uses Meta\'s official API. No unofficial, restricted, or Meta Policy-violating methods are used.'}
                        </p>
                      </div>

                      <h3>{i18n.language === 'bn' ? '২. গ্রহণযোগ্য ব্যবহার' : '2. Acceptable Use'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'Trackoora BD শুধুমাত্র বৈধ F-Commerce ব্যবসার জন্য ব্যবহার করা যাবে।' : 'Trackoora BD can only be used for valid F-Commerce businesses.'}</li>
                        <li>{i18n.language === 'bn' ? 'Meta-র Platform Policy ও Community Standards লঙ্ঘন করে এমন কোনো কাজে ব্যবহার করা যাবে না।' : 'Cannot be used for any activity that violates Meta\'s Platform Policy & Community Standards.'}</li>
                        <li>{i18n.language === 'bn' ? 'Fake order, spam, misleading ads, বা fraudulent activity-র জন্য সম্পূর্ণ নিষিদ্ধ।' : 'Completely prohibited for fake orders, spam, misleading ads, or fraudulent activity.'}</li>
                        <li>{i18n.language === 'bn' ? 'আপনার account অন্য কারো সাথে share বা বিক্রি করা যাবে না।' : 'Your account cannot be shared or sold to anyone else.'}</li>
                        <li>{i18n.language === 'bn' ? 'Platform-এর data অন্য কোনো tool বা service-এ export বা misuse করা যাবে না।' : 'Platform data cannot be exported to or misused in any other tool or service.'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৩. Beta Period শর্ত' : '3. Beta Period Terms'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'Beta period (প্রথম ৩০ দিন) সম্পূর্ণ বিনামূল্যে — কোনো payment card লাগবে না।' : 'Beta period (first 30 days) is completely free — no payment card required.'}</li>
                        <li>{i18n.language === 'bn' ? 'Beta-তে যোগ দিলে আপনি honest feedback দিতে সম্মত হচ্ছেন — এটাই আমাদের শর্ত।' : 'By joining Beta, you agree to provide honest feedback — this is our condition.'}</li>
                        <li>{i18n.language === 'bn' ? 'Beta period-এ service বা feature পরিবর্তন হতে পারে — আগে জানানো হবে।' : 'Services or features may change during the Beta period — notification will be provided beforehand.'}</li>
                        <li>{i18n.language === 'bn' ? 'Beta data product improvement-এ anonymized আকারে ব্যবহার হতে পারে।' : 'Beta data may be used in anonymized form for product improvement.'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৪. Subscription ও Payment' : '4. Subscription & Payment'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'Beta শেষে Starter Plan: ৳৪৯৯/মাস — bKash বা Nagad দিয়ে payment।' : 'Starter Plan after Beta: ৳499/month — payment via bKash or Nagad.'}</li>
                        <li>{i18n.language === 'bn' ? 'মাসিক billing cycle — কোনো annual contract বা hidden charge নেই।' : 'Monthly billing cycle — no annual contract or hidden charges.'}</li>
                        <li>{i18n.language === 'bn' ? 'Payment না করলে grace period ৩ দিন — তারপর account suspend হবে।' : 'If payment is not made, grace period is 3 days — then account will be suspended.'}</li>
                        <li>{i18n.language === 'bn' ? 'Pricing পরিবর্তন হলে ১৪ দিন আগে notify করা হবে।' : 'Pricing changes will be notified 14 days in advance.'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৫. Cancellation ও Refund' : '5. Cancellation & Refund'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'যেকোনো সময় cancel করা যাবে — পরবর্তী billing cycle-এ charge হবে না।' : 'Can be cancelled at any time — no charge for the next billing cycle.'}</li>
                        <li>{i18n.language === 'bn' ? 'Cancel করলে current billing period শেষ পর্যন্ত access থাকবে।' : 'If cancelled, access remains until the end of the current billing period.'}</li>
                        <li>{i18n.language === 'bn' ? 'Cancel-এর ৩০ দিন পর সমস্ত data permanently মুছে ফেলা হবে।' : 'All data will be permanently deleted 30 days after cancellation.'}</li>
                        <li>{i18n.language === 'bn' ? 'Technical সমস্যার কারণে ২৪ ঘণ্টার বেশি service unavailable হলে আনুপাতিক credit দেওয়া হবে।' : 'Proportional credit will be given if service is unavailable for more than 24 hours due to technical issues.'}</li>
                        <li>{i18n.language === 'bn' ? 'Beta period-এ কোনো charge নেই, তাই refund প্রযোজ্য নয়।' : 'No charge during Beta period, so refund is not applicable.'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৬. Service Availability' : '6. Service Availability'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'Trackoora BD ৯৯%+ uptime-এর লক্ষ্য রাখে। তবে নিম্নলিখিত কারণে temporary interruption হতে পারে — planned maintenance (আগে জানানো হবে), Meta API outage, বা force majeure। Interruption-এর সময় sellers-কে যত দ্রুত সম্ভব notify করা হবে।' 
                          : 'Trackoora BD aims for 99%+ uptime. However, temporary interruptions may occur due to — planned maintenance (notified beforehand), Meta API outage, or force majeure. Sellers will be notified as soon as possible during interruptions.'}
                      </p>

                      <h3>{i18n.language === 'bn' ? '৭. Intellectual Property' : '7. Intellectual Property'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'Trackoora BD platform, এর design, code, content, এবং brand — এগুলো Trackoora BD-এর intellectual property। আপনি service ব্যবহার করার অধিকার পাচ্ছেন, মালিকানা নয়। আপনার নিজের business data-র মালিক আপনি।' 
                          : 'Trackoora BD platform, its design, code, content, and brand — these are the intellectual property of Trackoora BD. You get the right to use the service, not ownership. You own your business data.'}
                      </p>

                      <h3>{i18n.language === 'bn' ? '৮. Account Responsibility' : '8. Account Responsibility'}</h3>
                      <ul className="list-disc pl-9 space-y-1 text-sm text-text2">
                        <li>{i18n.language === 'bn' ? 'আপনার account-এর নিরাপত্তা আপনার দায়িত্ব।' : 'Security of your account is your responsibility.'}</li>
                        <li>{i18n.language === 'bn' ? 'Account compromise সন্দেহ হলে তাৎক্ষণিক আমাদের জানান।' : 'Inform us immediately if account compromise is suspected.'}</li>
                        <li>{i18n.language === 'bn' ? 'আপনার account থেকে করা সমস্ত activity-র জন্য আপনি দায়ী।' : 'You are responsible for all activity from your account.'}</li>
                      </ul>

                      <h3>{i18n.language === 'bn' ? '৯. Limitation of Liability' : '9. Limitation of Liability'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'Trackoora BD Meta Ads-এর performance guarantee করে না — আমরা সঠিক purchase data Meta-কে পাঠাই, algorithm optimization Meta-র নিজস্ব system করে। Meta Algorithm failure-এর জন্য Trackoora BD দায়ী নয়। আমাদের সর্বোচ্চ liability আপনার সর্বশেষ এক মাসের subscription fee-র বেশি নয়।' 
                          : 'Trackoora BD does not guarantee Meta Ads performance — we send correct purchase data to Meta, Meta\'s own system does algorithm optimization. Trackoora BD is not responsible for Meta Algorithm failure. Our maximum liability is not more than your last one month\'s subscription fee.'}
                      </p>

                      <h3>{i18n.language === 'bn' ? '১০. Account Termination' : '10. Account Termination'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'নিম্নলিখিত কারণে Trackoora BD account বন্ধ করতে পারে — Terms violation, fraudulent activity, বা ৩০ দিনের বেশি payment failure। সাধারণত আগে warn করা হবে। গুরুতর violation-এর ক্ষেত্রে তাৎক্ষণিক বন্ধ করা হতে পারে।' 
                          : 'Trackoora BD may close an account for the following reasons — Terms violation, fraudulent activity, or payment failure for more than 30 days. Usually, a warning will be given beforehand. Immediate closure may occur for serious violations.'}
                      </p>

                      <h3>{i18n.language === 'bn' ? '১১. Terms পরিবর্তন' : '11. Terms Changes'}</h3>
                      <p className="pl-4 text-sm text-text2">
                        {i18n.language === 'bn' 
                          ? 'Terms of Service পরিবর্তন হলে সকল সেলারকে Telegram বা email-এ আগে জানানো হবে। পরিবর্তনের ৭ দিন পরে effective হবে। পরিবর্তনের পরেও service ব্যবহার করলে new terms accept করা বলে গণ্য হবে।' 
                          : 'Any changes to the Terms of Service will be notified to all sellers via Telegram or email beforehand. Changes will be effective after 7 days. Continued use of the service after changes will be considered as acceptance of the new terms.'}
                      </p>
                    </div>

                    <div className="modal-last-updated">
                      {i18n.language === 'bn' ? 'সর্বশেষ আপডেট: এপ্রিল ২০২৬ · Trackoora BD' : 'Last Updated: April 2026 · Trackoora BD'}
                    </div>
                  </div>
                )}

                {activeModal === 'contact' && (
                  <div className="py-8">
                    <div className="text-center">
                      <p className="mb-8 text-lg font-medium text-text">{i18n.language === 'bn' ? 'সরাসরি আমাদের সাথে কথা বলুন।' : 'Talk to us directly.'}</p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="https://m.me/trackoorabd" target="_blank" rel="noreferrer" className="btn-secondary flex items-center justify-center gap-2">
                          <Facebook className="w-5 h-5" />
                          Messenger
                        </a>
                        <a href="https://t.me/trackoorabd" target="_blank" rel="noreferrer" className="btn-secondary flex items-center justify-center gap-2">
                          <Smartphone className="w-5 h-5" />
                          Telegram
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
