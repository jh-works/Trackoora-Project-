import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "login": "Login",
        "get_started": "Get Started"
      },
      "hero": {
        "headline_1": "Why Your Meta Ads Aren't Working —",
        "headline_2": "And How to Fix It",
        "subheadline": "Every DM sale now sends a real Purchase signal to Meta. Ads optimize automatically.",
        "cta": "Start Free for 30 Days",
        "trust": "1 minute setup • No code required • Use in Bangla"
      },
      "problems": {
        "label": "What's the problem?",
        "card_1_title": "Invisible Sales",
        "card_1_desc": "Meta never sees your DM orders. Ads optimize for messages, not buyers.",
        "card_2_title": "No Order System",
        "card_2_desc": "Orders in notebooks. Customers forgotten. Follow-ups never happen.",
        "card_3_title": "Courier Chaos",
        "card_3_desc": "Manual bookings. Fake COD orders. Hours lost every day."
      },
      "how_it_works": {
        "label": "How it works",
        "step_1_title": "Connect",
        "step_1_desc": "Connect your Facebook Page and Meta Ads account. One-time. 5 minutes.",
        "step_2_title": "Confirm Orders",
        "step_2_desc": "When a customer agrees to buy, click Confirm Order in your dashboard.",
        "step_3_title": "Ads Improve",
        "step_3_desc": "Every confirmed sale fires a signal to Meta. Your ads optimise automatically."
      },
      "stats": {
        "sellers": "500,000+",
        "sellers_label": "F-Commerce sellers in BD",
        "code": "0 Code",
        "code_label": "Required to set up",
        "price": "৳499/mo",
        "price_label": "Pays for itself with 1 sale"
      }
    }
  },
  bn: {
    translation: {
      "nav": {
        "login": "Login করুন",
        "get_started": "শুরু করুন"
      },
      "hero": {
        "headline_1": "আপনার Meta Ads কেন কাজ করছে না —",
        "headline_2": "এবং কীভাবে ঠিক করবেন",
        "subheadline": "প্রতিটি DM sale এখন সরাসরি Meta-তে Purchase signal পাঠাবে। Ads optimize হবে automatically।",
        "cta": "৩০ দিন ফ্রি শুরু করুন",
        "trust": "১ মিনিটে setup • কোনো code লাগবে না • বাংলায় ব্যবহার করুন"
      },
      "problems": {
        "label": "সমস্যা কি?",
        "card_1_title": "অদৃশ্য সেলস",
        "card_1_desc": "Meta আপনার DM অর্ডারগুলো দেখতে পায় না। Ads শুধু মেসেজের জন্য অপ্টিমাইজ হয়, ক্রেতার জন্য নয়।",
        "card_2_title": "অর্ডার সিস্টেম নেই",
        "card_2_desc": "খাতায় অর্ডার লেখা। কাস্টমার ভুলে যাওয়া। ফলো-আপ কখনো হয় না।",
        "card_3_title": "কুরিয়ার ঝামেলা",
        "card_3_desc": "ম্যানুয়াল বুকিং। ফেক COD অর্ডার। প্রতিদিন ঘণ্টার পর ঘণ্টা নষ্ট।"
      },
      "how_it_works": {
        "label": "কীভাবে কাজ করে",
        "step_1_title": "কানেক্ট করুন",
        "step_1_desc": "আপনার Facebook Page এবং Meta Ads অ্যাকাউন্ট কানেক্ট করুন। মাত্র ৫ মিনিট সময় লাগবে।",
        "step_2_title": "অর্ডার কনফার্ম করুন",
        "step_2_desc": "যখন কোনো কাস্টমার কিনতে রাজি হবে, ড্যাশবোর্ডে 'Confirm Order' ক্লিক করুন।",
        "step_3_title": "অ্যাডস ইমপ্রুভ হবে",
        "step_3_desc": "প্রতিটি কনফার্ম সেল Meta-তে সিগন্যাল পাঠাবে। আপনার অ্যাডস অটোমেটিক অপ্টিমাইজ হবে।"
      },
      "stats": {
        "sellers": "৫০০,০০০+",
        "sellers_label": "বাংলাদেশে F-Commerce বিক্রেতা",
        "code": "০ কোড",
        "code_label": "সেটআপ করতে কোনো কোড লাগবে না",
        "price": "৳৪৯৯/মাস",
        "price_label": "১টি বাড়তি সেলেই খরচ উঠে আসবে"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'bn',
    fallbackLng: 'bn',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
