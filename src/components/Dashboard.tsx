import React, { useState, useEffect, useMemo, useCallback, startTransition } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Facebook,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  LayoutGrid,
  Play,
  Calendar,
  Eye,
  Download,
  X,
  ArrowRight,
  Filter,
  RefreshCw,
  Globe2,
  Target,
  BadgeCheck,
  Edit,
  Save,
  User,
  Bot,
  Phone,
  MapPin,
  Hash,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Clock,
  ExternalLink,
  Zap,
  Database,
  Globe,
  ShieldCheck,
  CreditCard,
  Trash2,
  CheckCircle,
  Menu,
  Lock,
  ShoppingCart,
  Camera,
  Shield,
  Store,
  History,
  ArrowLeft,
  KeyRound,
  Mail,
  AlertTriangle,
  HelpCircle,
  Send,
  PlayCircle,
  BookOpen,
  MessageCircle,
  Sun,
  Moon,
  Image as ImageIcon,
  Info,
  Truck,
  Edit3,
  Briefcase,
  Plug,
  LifeBuoy,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { Logo } from "./Logo";
import { MOCK_ADS, MOCK_ORDERS, MOCK_CONVERSATIONS } from "../mockData";
import { supabase } from "../lib/supabase";
import { toBanglaNumber as convertToBangla } from "../utils/numberUtils";

const data = [
  { name: "শনি", sales: 4000, conv: 240 },
  { name: "রবি", sales: 3000, conv: 139 },
  { name: "সোম", sales: 2000, conv: 980 },
  { name: "মঙ্গল", sales: 2780, conv: 390 },
  { name: "বুধ", sales: 1890, conv: 480 },
  { name: "বৃহঃ", sales: 2390, conv: 380 },
  { name: "শুক্র", sales: 3490, conv: 430 },
];

interface DashboardProps {
  user: any;
  onLogout: () => void;
  language: "en" | "bn";
  theme: "light" | "dark";
  onToggleTheme: () => void;
  integrationSkipped?: boolean;
  onCompleteIntegration?: () => void;
  onStartConnectFb?: () => void;
  onUpdateUser?: (updatedData: any) => void;
}

export default function Dashboard({
  user,
  onLogout,
  language,
  theme,
  onToggleTheme,
  integrationSkipped,
  onCompleteIntegration,
  onStartConnectFb,
  onUpdateUser,
}: DashboardProps) {
  const { i18n } = useTranslation();

  const t = (en: string, bn: string) => (language === "bn" ? bn : en);

  const toBanglaNumber = useCallback(
    (num: number | string): string => {
      return convertToBangla(num, language);
    },
    [language],
  );

  const [activeTab, setActiveTabRaw] = useState("overview");
  const [fastActiveTab, setFastActiveTab] = useState("overview");
  
  const setActiveTab = useCallback((tab: string) => {
    setFastActiveTab(tab);
    React.startTransition(() => {
      setActiveTabRaw(tab);
    });
  }, []);

  useEffect(() => {
    // Reset filters when changing main tabs
    setOrderStatusFilter("All");
    setOrderPaymentFilter("All");
  }, [activeTab]);
  const [loading, setLoading] = useState(true);
  const [showOrderPanel, setShowOrderPanel] = useState<any>(null);
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "cod">("cod");
  const [orderAdSource, setOrderAdSource] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [adReport, setAdReport] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderProducts, setOrderProducts] = useState([
    { id: Date.now(), name: "", price: "", quantity: 1 },
  ]);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    subscription_plan: "Starter",
    trial_ends_at: new Date(
      new Date().getTime() + 15 * 24 * 3600000,
    ).toISOString(),
    orders_this_month_count: 32,
    telegram_chat_id: "123456789",
  });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth">(
    "starter",
  );
  const [subPaymentMethod, setSubPaymentMethod] = useState<
    "bkash" | "nagad" | "bank"
  >("bkash");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [isTrialExpired, setIsTrialExpired] = useState(false); // Mock trial expired state
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [daysLeft, setDaysLeft] = useState(14);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [lastDismissedMilestone, setLastDismissedMilestone] = useState<
    number | null
  >(() => {
    const saved = localStorage.getItem("last_dismissed_milestone");
    return saved ? parseInt(saved) : null;
  });

  const [customRange, setCustomRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (settings?.trial_ends_at) {
      const end = new Date(settings.trial_ends_at).getTime();
      const now = new Date().getTime();
      const diff = end - now;
      const days = Math.floor(diff / (24 * 3600 * 1000));
      const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));

      setDaysLeft(days);
      setHoursLeft(hours);

      const milestones = [0, 3, 7, 10, 14];
      const activeMilestone = milestones.find((m) => days <= m);

      // Hide if expired or if future trial
      if (days < 0 || days > 14) {
        setShowTrialBanner(false);
      } else if (
        lastDismissedMilestone !== null &&
        lastDismissedMilestone === activeMilestone
      ) {
        setShowTrialBanner(false);
      } else {
        setShowTrialBanner(true);
      }
    }
  }, [settings, lastDismissedMilestone]);

  const handleDismissTrial = () => {
    const milestones = [0, 3, 7, 10, 14];
    const activeMilestone = milestones.find((m) => daysLeft <= m);
    if (activeMilestone !== undefined) {
      localStorage.setItem(
        "last_dismissed_milestone",
        activeMilestone.toString(),
      );
      setLastDismissedMilestone(activeMilestone);
    }
    setShowTrialBanner(false);
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showConnectSuccessModal, setShowConnectSuccessModal] = useState(false);
  const [filterRange, setFilterRange] = useState("7days");
  const [overviewFilterOpen, setOverviewFilterOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    | "profile"
    | "security"
    | "connected"
    | "notifications"
    | "billing"
    | "support"
  >("profile");
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || user?.name || "Seller Name",
    email: user?.email || "seller@example.com",
    phone: user?.user_metadata?.phone || "01712345678",
    avatar: user?.user_metadata?.avatar_url || user?.picture || null,
    businessName: settings?.meta_page_name || "",
    businessCategory: settings?.meta_page_category || "",
    address: "",
    telegramId: settings?.telegram_chat_id || "",
    uid: user?.id 
          ? user.id.startsWith('demo-user') 
              ? `ITB-${user.id.split('-').pop()?.substring(0,6).toUpperCase()}` 
              : `ITB-${user.id.substring(0,8).toUpperCase()}` 
          : "ITB-DEMO",
    isGoogleUser: !!user?.email?.includes("@gmail.com"),
  });

  useEffect(() => {
    setProfileData((prev) => ({
      ...prev,
      name: user?.user_metadata?.full_name || user?.name || prev.name,
      email: user?.email || prev.email,
      phone: user?.user_metadata?.phone || prev.phone,
      avatar: user?.user_metadata?.avatar_url || user?.picture || prev.avatar,
      uid: user?.id 
            ? user.id.startsWith('demo-user') 
                ? `ITB-${user.id.split('-').pop()?.substring(0,6).toUpperCase()}` 
                : `ITB-${user.id.substring(0,8).toUpperCase()}` 
            : prev.uid
    }));
  }, [user]);

  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [show2faModal, setShow2faModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpType, setOtpType] = useState<"phone" | "email" | "password_reset">(
    "phone",
  );
  const [otpTarget, setOtpTarget] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState<{
    onConfirm: () => void;
    title: string;
  } | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTimer = (seconds: number) => {
    if (seconds <= 0) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }
    return `${secs}`;
  };
  const [showForgotPasswordOptions, setShowForgotPasswordOptions] =
    useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotif: true,
    msgNotif: true,
    supportNotif: true,
    emailAlerts: false,
    smsAlerts: false,
  });
  const [convFilterOpen, setConvFilterOpen] = useState(false);
  const [orderFilterOpen, setOrderFilterOpen] = useState(false);
  const [supportFilterOpen, setSupportFilterOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<
    "all" | "unread"
  >("all");
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>(
    [],
  );
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showFollowUpPanel, setShowFollowUpPanel] = useState<any>(null);
  const [followUpDelay, setFollowUpDelay] = useState("3 days");
  const [followUpType, setFollowUpType] = useState("Reminder");
  const [isEditingFollowUp, setIsEditingFollowUp] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "phone">(
    "email",
  );
  const [supportIssueType, setSupportIssueType] = useState("Technical Bug");
  const [supportDesc, setSupportDesc] = useState("");
  const [supportScreenshot, setSupportScreenshot] = useState<File | null>(null);
  const [submittedReports, setSubmittedReports] = useState<any[]>([
    { id: "1", date: "2026-04-10", type: "Billing", status: "Solved" },
    { id: "2", date: "2026-04-15", type: "Technical Bug", status: "Solved" },
    { id: "3", date: "2026-04-20", type: "Feature", status: "Solved" },
  ]);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<any[]>([
    {
      role: "ai",
      text: "সালাম! আমি আপনার AI অ্যাসিস্ট্যান্ট। আমি আপনাকে কীভাবে সাহায্য করতে পারি? নিচের অপশনগুলো থেকে আপনার সমস্যাটি বেছে নিন:",
      options: [
        "তাত্ক্ষণিক সমাধান",
        "পেমেন্ট ও বিলিং",
        "সেটিংস হেল্প",
        "অন্য কিছু",
      ],
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [orderConfirmationMsg, setOrderConfirmationMsg] = useState("");
  const [orderCourier, setOrderCourier] = useState("");
  const [orderCourierPopupOpen, setOrderCourierPopupOpen] = useState(false);
  const [isEditingMsg, setIsEditingMsg] = useState(false);
  const [orderConfirmationTemplate, setOrderConfirmationTemplate] = useState(() => {
    return localStorage.getItem("order_confirmation_template") || "";
  });
  const [customerName, setCustomerName] = useState("");
  const [showCRMDetail, setShowCRMDetail] = useState(false);
  const [selectedCRMData, setSelectedCRMData] = useState<any>(null);
  const [crmDateFilterOpen, setCrmDateFilterOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [paymentSplitFilterOpen, setPaymentSplitFilterOpen] = useState(false);
  const [showReturnPopup, setShowReturnPopup] = useState<any>(null);
  const [returnCourierCharge, setReturnCourierCharge] = useState("80");

  // Popup states for selection bars
  const [orderPaymentPopupOpen, setOrderPaymentPopupOpen] = useState(false);
  const [orderPaymentMethodPopupOpen, setOrderPaymentMethodPopupOpen] =
    useState(false);
  const [adSearch, setAdSearch] = useState("");
  const [showAdBreakdown, setShowAdBreakdown] = useState<any>(null);

  const [isSyncingMeta, setIsSyncingMeta] = useState(false);

  const [orders, setOrders] = useState(MOCK_ORDERS);

  const filteredAds = useMemo(() => {
    // True Attribution Mapping
    const realAdData = MOCK_ADS.map(ad => {
      // Find orders matching this campaign based on CAPI tracking
      const matchingOrders = orders.filter(
        o => o.campaign === ad.name || (o.adSource && o.adSource.includes(ad.id))
      );
      
      const realPurchases = matchingOrders.length;
      const realRevenue = matchingOrders.reduce((sum, o) => sum + (o.status !== "Cancelled" ? o.price : 0), 0);
      
      return {
        ...ad,
        confirmedOrders: realPurchases,
        revenue: realRevenue,
        dynamicRoas: ad.spend > 0 ? (realRevenue / ad.spend).toFixed(2) : "0.00"
      };
    });

    return realAdData.filter(
      (c) =>
        c.name.toLowerCase().includes(adSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(adSearch.toLowerCase()),
    );
  }, [adSearch, orders]);

  // Meta Sync Logic
  const handleMetaSync = useCallback(async () => {
    setIsSyncingMeta(true);
    // Simulate real sync delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSyncingMeta(false);
  }, []);

  const [rowStatusPopupOpenId, setRowStatusPopupOpenId] = useState<
    number | null
  >(null);
  const [editOrderPaymentPopupOpen, setEditOrderPaymentPopupOpen] =
    useState(false);
  const [editOrderStatusPopupOpen, setEditOrderStatusPopupOpen] =
    useState(false);
  const [editOrderCourierPopupOpen, setEditOrderCourierPopupOpen] =
    useState(false);
  const [editOrderAdvanceMethodPopupOpen, setEditOrderAdvanceMethodPopupOpen] =
    useState(false);

  const followUpMessages = {
    Reminder: t(
      "Hi! We noticed you were interested in our products. Do you have any questions?",
      "হাই! আমরা লক্ষ্য করেছি আপনি আমাদের প্রোডাক্টে আগ্রহী ছিলেন। আপনার কি কোনো প্রশ্ন আছে?",
    ),
    "Discount Offer": t(
      "Special offer! Get 10% off if you order within the next 24 hours.",
      "স্পেশাল অফার! আগামী ২৪ ঘণ্টার মধ্যে অর্ডার করলে ১০% ডিসকাউন্ট পান।",
    ),
    "Back in Stock": t(
      "Good news! The item you were looking for is back in stock.",
      "সুসংবাদ! আপনি যে আইটেমটি খুঁজছিলেন তা আবার স্টকে এসেছে।",
    ),
  };

  const [followUpMode, setFollowUpMode] = useState<"view" | "edit">("edit");

  const [followUpDoneCount, setFollowUpDoneCount] = useState(12);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Order Received",
      titleBn: "নতুন অর্ডার পাওয়া গেছে",
      desc: "Customer #101 just placed an order.",
      descBn: "কাস্টমার #১০১ একটি অর্ডার করেছেন।",
      time: "2h ago",
      timeBn: "২ ঘণ্টা আগে",
      read: false,
    },
    {
      id: 2,
      title: "Payment Successful",
      titleBn: "পেমেন্ট সফল হয়েছে",
      desc: "Your subscription has been renewed.",
      descBn: "আপনার সাবস্ক্রিপশন রিনিউ করা হয়েছে।",
      time: "5h ago",
      timeBn: "৫ ঘণ্টা আগে",
      read: true,
    },
    {
      id: 3,
      title: "Meta Connection Alert",
      titleBn: "মেটা কানেকশন অ্যালার্ট",
      desc: "Your Meta account needs re-authentication.",
      descBn: "আপনার মেটা অ্যাকাউন্ট পুনরায় কানেক্ট করতে হবে।",
      time: "1d ago",
      timeBn: "১ দিন আগে",
      read: false,
    },
  ]);

  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);

  useEffect(() => {
    if (showFollowUpPanel) {
      setFollowUpMode(showFollowUpPanel.mode || "edit");
      if (showFollowUpPanel.type && !isEditingFollowUp) {
        setFollowUpType(showFollowUpPanel.type);
      }
      if (showFollowUpPanel.delay) {
        setFollowUpDelay(showFollowUpPanel.delay);
      }
      // Use existing message if available, otherwise use default
      const existingMsg = conversations.find(
        (c) => c.id === showFollowUpPanel.id,
      )?.followUpMessage;
      setFollowUpMessage(
        existingMsg ||
          followUpMessages[followUpType as keyof typeof followUpMessages],
      );
    }
  }, [showFollowUpPanel, followUpType, conversations]);

  useEffect(() => {
    if (showOrderPanel) {
      setCustomerName(showOrderPanel.fb_customer_name || "");
    }
  }, [showOrderPanel]);

  useEffect(() => {
    if (showOrderPanel) {
      const name =
        customerName || showOrderPanel.fb_customer_name || "Customer";
      const productsList = orderProducts
        .map(
          (p) => `${p.name || "[পণ্য]"} (৳${p.price || "০"} x ${p.quantity})`,
        )
        .join(", ");
      const totalPrice = orderProducts.reduce(
        (acc, p) => acc + (parseFloat(p.price) || 0) * (p.quantity || 1),
        0,
      );
      const netTotal = totalPrice + (parseFloat(deliveryCharge) || 0);

      if (!isEditingMsg) {
        if (orderConfirmationTemplate) {
          let msg = orderConfirmationTemplate;
          msg = msg.replace(/{name}/g, name);
          msg = msg.replace(/{products}/g, productName || productsList);
          msg = msg.replace(/{total}/g, toBanglaNumber(totalPrice.toString()));
          msg = msg.replace(/{delivery}/g, toBanglaNumber(deliveryCharge || "০"));
          msg = msg.replace(/{net}/g, toBanglaNumber(netTotal.toString()));
          setOrderConfirmationMsg(msg);
        } else {
          setOrderConfirmationMsg(
            t(
              `Hello ${name}! Your order for ${productName || productsList} has been confirmed. Total Price: ৳${totalPrice}, Delivery Charge: ৳${deliveryCharge || "0"}. Net Total: ৳${netTotal}. Thank you for shopping with us!`,
              `হ্যালো ${name}! ${productName || productsList}-এর জন্য আপনার অর্ডারটি কনফার্ম করা হয়েছে। পণ্যের দাম: ৳${toBanglaNumber(totalPrice.toString())}, ডেলিভারি চার্জ: ৳${toBanglaNumber(deliveryCharge || "০")}। মোট: ৳${toBanglaNumber(netTotal.toString())}। আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!`,
            ),
          );
        }
      }
    }
  }, [
    showOrderPanel,
    customerName,
    productName,
    orderProducts,
    deliveryCharge,
    language,
    orderConfirmationTemplate,
    isEditingMsg,
  ]);
  const [convSearch, setConvSearch] = useState("");
  const [convFilter, setConvFilter] = useState("Open");
  const [showConvSuggestions, setShowConvSuggestions] = useState(false);

  const convSuggestions = useMemo(() => {
    if (!convSearch) return [];
    const searchLower = convSearch.toLowerCase();
    const suggestions = new Set<string>();

    conversations.forEach((c) => {
      if (c.ad_name.toLowerCase().includes(searchLower))
        suggestions.add(c.ad_name);
      if (c.ad_id?.toString().toLowerCase().includes(searchLower))
        suggestions.add(c.ad_id.toString());
    });

    return Array.from(suggestions).slice(0, 5);
  }, [convSearch, conversations]);

  const tabCounts = useMemo(() => {
    return {
      All: conversations.length,
      Open: conversations.filter((c) => c.status === "Open").length,
      Ordered: conversations.filter((c) => c.status === "Ordered").length,
      "Not Ordered": conversations.filter((c) => c.status === "Not Ordered")
        .length,
      "Follow-Up Pending": conversations.filter(
        (c) =>
          c.status === "Follow-Up Pending" ||
          (c.status === "Not Ordered" && c.followUpScheduled),
      ).length,
      "Follow-Up Complete": conversations.filter(
        (c) => c.status === "Follow-Up Complete",
      ).length,
    };
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter((c) => {
      const searchLower = convSearch.toLowerCase();
      const matchesSearch =
        c.fb_customer_name.toLowerCase().includes(searchLower) ||
        c.ad_name.toLowerCase().includes(searchLower) ||
        (c.ad_id?.toString().toLowerCase().includes(searchLower) ?? false);
      const matchesFilter =
        convFilter === "All" ||
        (convFilter === "Open" && c.status === "Open") ||
        (convFilter === "Ordered" && c.status === "Ordered") ||
        (convFilter === "Not Ordered" && c.status === "Not Ordered") ||
        (convFilter === "Follow-Up Pending" &&
          (c.status === "Follow-Up Pending" ||
            (c.status === "Not Ordered" && c.followUpScheduled))) ||
        (convFilter === "Follow-Up Complete" &&
          c.status === "Follow-Up Complete");
      return matchesSearch && matchesFilter;
    });

    const now = new Date().getTime();
    let timeFiltered = filtered;
    if (filterRange === "today") {
      timeFiltered = filtered.filter((c) => now - c.timestamp < 24 * 3600000);
    } else if (filterRange === "yesterday") {
      const yesterdayStart = now - 48 * 3600000;
      const yesterdayEnd = now - 24 * 3600000;
      timeFiltered = filtered.filter(
        (c) => c.timestamp >= yesterdayStart && c.timestamp < yesterdayEnd,
      );
    } else if (filterRange === "30days") {
      timeFiltered = filtered.filter(
        (c) => now - c.timestamp < 30 * 24 * 3600000,
      );
    } else if (
      filterRange === "custom" &&
      customRange.start &&
      customRange.end
    ) {
      const start = customRange.start.getTime();
      const end = customRange.end.getTime() + 24 * 3600000;
      timeFiltered = filtered.filter(
        (c) => c.timestamp >= start && c.timestamp < end,
      );
    }

    // NEWEST FIRST SORTING
    return [...timeFiltered].sort((a, b) => b.timestamp - a.timestamp);
  }, [conversations, convSearch, convFilter, filterRange, customRange]);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const searchLower = orderSearch.toLowerCase();
      const matchesSearch =
        order.uid.toLowerCase().includes(searchLower) ||
        order.customer.toLowerCase().includes(searchLower) ||
        order.phone.includes(searchLower);
      const matchesStatus =
        orderStatusFilter === "All" || order.status === orderStatusFilter;
      const matchesPayment =
        orderPaymentFilter === "All" || order.payment === orderPaymentFilter;

      let matchesDate = true;
      if (filterRange !== "all") {
        const orderDate = new Date(order.date).getTime();
        const now = new Date().getTime();
        if (filterRange === "today") {
          matchesDate = now - orderDate < 24 * 3600000;
        } else if (filterRange === "30days") {
          matchesDate = now - orderDate < 30 * 24 * 3600000;
        }
      }
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });

    // NEWEST FIRST SORTING
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [orders, orderSearch, orderStatusFilter, orderPaymentFilter, filterRange]);
  const orderStats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "Pending").length;
    const shipped = orders.filter((o) => o.status === "Shipped").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const returned = orders.filter((o) => o.status === "Returned").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;

    // Revenue from orders that are not returned or cancelled
    const gross = orders.reduce(
      (acc, o) =>
        acc +
        (o.status !== "Returned" && o.status !== "Cancelled"
          ? Number(o.price) || 0
          : 0),
      0,
    );
    const returnLoss = orders
      .filter((o) => o.status === "Returned")
      .reduce((acc, o) => acc + (o.courierChargeDeducted || 80), 0);
    const net = gross - returnLoss;

    const returnRate = total > 0 ? ((returned / total) * 100).toFixed(1) : "0";

    return {
      total,
      pending,
      shipped,
      delivered,
      returned,
      cancelled,
      returnRate,
      gross: gross.toLocaleString(),
      grossNum: gross,
      net: net.toLocaleString(),
      netNum: net,
      returnLoss: returnLoss.toLocaleString(),
    };
  }, [orders]);

  const adStats = useMemo(() => {
    const totalSpend = MOCK_ADS.reduce((acc, ad) => acc + ad.spend, 0);
    const totalLeads = conversations.length;
    // Map purchases only from CAPI identified orders
    const adDrivenOrders = orders.filter(o => 
      o.campaign && o.campaign !== "Direct Message" && o.adSource && !o.adSource.includes("Direct")
    );
    const totalPurchases = adDrivenOrders.length;
    const totalRevenue = adDrivenOrders.reduce(
      (acc, o) => acc + (o.status !== "Cancelled" ? o.price : 0),
      0,
    );

    const cpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
    const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00";
    const cpp = totalPurchases > 0 ? Math.round(totalSpend / totalPurchases) : 0;

    return {
      spend: totalSpend.toLocaleString(),
      roas,
      leads: totalLeads,
      cpl: cpl.toLocaleString(),
      purchases: totalPurchases,
      cpp: cpp.toLocaleString()
    };
  }, [conversations, orders]);

  const chartData = useMemo(() => {
    if (filterRange === "today") {
      return [
        { name: "10 AM", sales: 400 },
        { name: "12 PM", sales: 800 },
        { name: "2 PM", sales: 600 },
        { name: "4 PM", sales: 1200 },
        { name: "6 PM", sales: 900 },
        { name: "8 PM", sales: 1500 },
        { name: "10 PM", sales: 1100 },
      ];
    }
    if (filterRange === "30days") {
      return Array.from({ length: 30 }, (_, i) => ({
        name: toBanglaNumber(i + 1),
        sales: Math.floor(Math.random() * 5000) + 1000,
      }));
    }
    return [
      { name: t("Sat", "শনি"), sales: 4000 },
      { name: t("Sun", "রবি"), sales: 3000 },
      { name: t("Mon", "সোম"), sales: 2000 },
      { name: t("Tue", "মঙ্গল"), sales: 2780 },
      { name: t("Wed", "বুধ"), sales: 1890 },
      { name: t("Thu", "বৃহঃ"), sales: 2390 },
      { name: t("Fri", "শুক্র"), sales: 3490 },
    ];
  }, [filterRange, language]);

  const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
    if (newStatus === "Returned") {
      const order = orders.find((o) => o.id === orderId);
      setShowReturnPopup(order);
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              deliveredDate:
                newStatus === "Delivered"
                  ? new Date().toISOString()
                  : o.deliveredDate,
            }
          : o,
      ),
    );
  };

  const handleConfirmReturn = () => {
    if (!showReturnPopup) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === showReturnPopup.id
          ? {
              ...o,
              status: "Returned",
              courierChargeDeducted: parseInt(returnCourierCharge) || 0,
            }
          : o,
      ),
    );

    setShowReturnPopup(null);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setOrders((prev) => {
      const updatedOrder = {
        ...selectedOrder,
        deliveredDate:
          selectedOrder.status === "Delivered" && !selectedOrder.deliveredDate
            ? new Date().toISOString()
            : selectedOrder.deliveredDate,
      };
      const exists = prev.some((o) => o.id === updatedOrder.id);
      if (exists) {
        return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      }
      return [updatedOrder, ...prev];
    });
    setShowOrderManagement(false);
    setSelectedOrder(null);
    setIsEditingOrder(false);
  };

  const SelectionPopup = ({
    title,
    options,
    selectedId,
    onSelect,
    isOpen,
    setIsOpen,
    triggerLabel,
    disabled,
    align = "left",
  }: {
    title: string;
    options: { id: string; label: string }[];
    selectedId: string;
    onSelect: (id: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    triggerLabel?: string;
    disabled?: boolean;
    align?: "left" | "right";
  }) => {
    return (
      <div className="relative selection-popup-container">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2 bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs font-bold hover:border-orange transition-all w-full text-left appearance-none ${disabled ? "opacity-70 cursor-not-allowed border-dashed" : ""}`}
        >
          <span className="truncate flex-1">
            {triggerLabel ||
              options.find((opt) => opt.id === selectedId)?.label ||
              title}
          </span>
          {!disabled && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-text3 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] sm:bg-transparent sm:backdrop-blur-none"
              />

              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", damping: 25, stiffness: 300 },
                }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`
                  fixed sm:absolute z-[120] sm:z-[120] 
                  bottom-4 left-4 right-4 sm:bottom-auto 
                  sm:top-full sm:mt-2 w-auto sm:w-64 
                  bg-card border border-border rounded-3xl sm:rounded-2xl shadow-2xl p-2
                  ${align === "right" ? "sm:right-0 sm:left-auto" : "sm:left-0 sm:right-auto"}
                `}
              >
                <div className="p-3 border-b border-border mb-2 sm:hidden flex items-center justify-between">
                  <h3 className="font-bold text-sm text-text">{title}</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-bg3 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    {options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onSelect(opt.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                          selectedId === opt.id
                            ? "bg-orange/10 text-orange font-bold"
                            : "text-text2 hover:bg-bg3"
                        }`}
                      >
                        <span className="text-xs">{opt.label}</span>
                        {selectedId === opt.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const DateFilterPopup = ({
    selectedRange,
    onSelect,
    isOpen,
    setIsOpen,
    align = "right",
  }: {
    selectedRange: string;
    onSelect: (range: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    align?: "left" | "right";
  }) => {
    const options = [
      { id: "today", label: t("Today", "আজ") },
      { id: "yesterday", label: t("Yesterday", "গতকাল") },
      { id: "7days", label: t("Last 7 Days", "গত ৭ দিন") },
      { id: "30days", label: t("Last 30 Days", "গত ৩০ দিন") },
      { id: "custom", label: t("Custom Range", "কাস্টম রেঞ্জ") },
    ];

    const [tempStart, setTempStart] = useState<string>("");
    const [tempEnd, setTempEnd] = useState<string>("");

    return (
      <div className="relative date-filter-container">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-bg3 border border-border rounded-xl px-4 py-2.5 text-sm font-bold hover:border-orange transition-all"
        >
          <Filter className="w-4 h-4 text-orange" />
          <span className="hidden sm:inline">
            {selectedRange === "custom" && customRange.start && customRange.end
              ? `${customRange.start.toLocaleDateString()} - ${customRange.end.toLocaleDateString()}`
              : options.find((opt) => opt.id === selectedRange)?.label ||
                t("Today", "আজ")}
          </span>
          <span className="sm:hidden">{t("Filter", "ফিল্টার")}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile/Desktop Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] sm:bg-transparent sm:backdrop-blur-none"
              />

              {/* Popup Content */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", damping: 25, stiffness: 300 },
                }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`
                  fixed sm:absolute z-[100] sm:z-50
                  bottom-4 left-4 right-4 sm:bottom-auto sm:left-auto sm:top-full
                  sm:mt-2 w-auto sm:w-64 bg-card border border-border rounded-3xl sm:rounded-2xl shadow-2xl p-2
                  ${align === "right" ? "sm:right-0" : "sm:left-0"}
                `}
              >
                <div className="p-3 border-b border-border mb-2 sm:hidden flex items-center justify-between">
                  <h3 className="font-bold text-sm">
                    {t("Select Range", "রেঞ্জ নির্বাচন করুন")}
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-bg3 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === "custom") {
                        setShowCalendar(true);
                        setIsOpen(false);
                      } else {
                        onSelect(opt.id);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-3.5 sm:py-3 rounded-2xl sm:rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                      selectedRange === opt.id
                        ? "bg-orange/10 text-orange"
                        : "text-text2 hover:bg-bg2 hover:text-text"
                    }`}
                  >
                    {opt.label}
                    {selectedRange === opt.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCalendar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCalendar(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-card border border-border rounded-3xl shadow-2xl z-[70] overflow-hidden"
              >
                <div className="p-6 border-b border-border bg-bg2 flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange" />
                    {t("Select Custom Range", "কাস্টম রেঞ্জ নির্বাচন করুন")}
                  </h3>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="p-2 hover:bg-bg3 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text3 uppercase ml-1">
                        {t("Start Date", "শুরুর তারিখ")}
                      </label>
                      <input
                        type="date"
                        className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-orange transition-all"
                        value={tempStart}
                        onChange={(e) => setTempStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text3 uppercase ml-1">
                        {t("End Date", "শেষের তারিখ")}
                      </label>
                      <input
                        type="date"
                        className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-orange transition-all"
                        value={tempEnd}
                        onChange={(e) => setTempEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="bg-orange/5 border border-orange/10 rounded-2xl p-4">
                    <p className="text-xs text-orange font-medium leading-relaxed">
                      {t(
                        "Select a date range to view specific performance data for that period.",
                        "নির্দিষ্ট সময়ের পারফরম্যান্স ডেটা দেখতে একটি তারিখের রেঞ্জ নির্বাচন করুন।",
                      )}
                    </p>
                  </div>
                </div>
                <div className="p-6 bg-bg2 border-t border-border flex gap-3">
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-bg3 transition-all"
                  >
                    {t("Cancel", "বাতিল")}
                  </button>
                  <button
                    onClick={() => {
                      if (tempStart && tempEnd) {
                        setCustomRange({
                          start: new Date(tempStart),
                          end: new Date(tempEnd),
                        });
                        onSelect("custom");
                        setShowCalendar(false);
                        setIsOpen(false);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-orange text-white font-bold text-sm hover:bg-orange/90 transition-all shadow-lg shadow-orange/20"
                  >
                    {t("Apply", "প্রয়োগ করুন")}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".profile-dropdown") &&
        !target.closest(".profile-btn")
      ) {
        setIsProfileOpen(false);
      }
      if (
        !target.closest(".notification-dropdown") &&
        !target.closest(".notification-btn")
      ) {
        setShowNotifications(false);
      }
      if (!target.closest(".search-container")) {
        setShowSearchResults(false);
      }
      if (!target.closest(".conv-search-container")) {
        setShowConvSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async (retries = 3) => {
    let token = localStorage.getItem("token");

    // Try to get Supabase session if no token or even if there is one (Supabase is source of truth now)
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        token = session.access_token;
      }
    }

    if (!token) return;

    setLoading(true);
    try {
      // For demo purposes, we use mock data for conversations and orders
      // but we can still try to fetch settings if available
      const settingsRes = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (settingsRes.ok) {
        const contentType = settingsRes.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
      } else {
        const errorText = await settingsRes.text();
        console.warn(
          `Settings fetch failed with status ${settingsRes.status}: ${errorText}`,
        );
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error?.message || error);
      const isFetchFailure = error?.message?.includes("Failed to fetch");
      setLastErrorWasFetchFailure(isFetchFailure);

      if (retries > 0 && isFetchFailure) {
        console.log(`Retrying fetch... (${retries} attempts left)`);
        setTimeout(() => fetchData(retries - 1), 1000);
      } else if (isFetchFailure) {
        console.warn(
          "Network error detected after retries. Running in offline/demo mode.",
        );
      }
    } finally {
      // Only set loading to false if we're not retrying or if we've exhausted all retries
      const isRetrying = retries > 0 && lastErrorWasFetchFailure;
      if (!isRetrying) {
        setLoading(false);
      }
    }
  };

  // Helper to check if error is specifically a fetch failure
  const [lastErrorWasFetchFailure, setLastErrorWasFetchFailure] =
    useState(false);

  const handleUpdateProfile = () => {
    setIsProfileEditing(false);
    if (onUpdateUser) {
      onUpdateUser({
        full_name: profileData.name,
        phone: profileData.phone,
        avatar_url: profileData.avatar,
      });
    }
    toast.success(
      t("Profile updated successfully", "প্রোফাইল সফলভাবে আপডেট করা হয়েছে"),
    );
  };

  const handleUpdatePassword = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error(
        t(
          "Please fill all password fields",
          "দয়া করে সব পাসওয়ার্ড ফিল্ড পূরণ করুন",
        ),
      );
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error(t("Passwords do not match", "পাসওয়ার্ড ম্যাচ করছে না"));
      return;
    }
    toast.success(
      t("Password updated successfully", "পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে"),
    );
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  const handleUpdateBusinessInfo = () => {
    toast.success(
      t(
        "Business info updated successfully",
        "বিজনেস তথ্য সফলভাবে আপডেট করা হয়েছে",
      ),
    );
  };

  const handleLogoutSession = (session: any) => {
    setShowPasswordConfirmModal({
      title: t(
        "Confirm Logout from " + session.device,
        "লগআউট নিশ্চিত করুন - " + session.device,
      ),
      onConfirm: () => {
        toast.success(
          t(
            "Logged out from session successfully",
            "সেশন থেকে সফলভাবে লগআউট করা হয়েছে",
          ),
        );
        setShowPasswordConfirmModal(null);
        setConfirmPassword("");
      },
    });
  };

  const handleVerifyOtp = () => {
    if (otpValue.length === 6) {
      toast.success(t("Verified successfully!", "সফলভাবে ভেরিফাই করা হয়েছে!"));
      setShowOtpModal(false);
      setOtpValue("");
      setOtpTimer(0);
      setResendCount(0);
      if (otpType === "phone") {
        setProfileData((prev) => ({ ...prev, phone: otpTarget }));
      }
    } else {
      toast.error(
        t("Please enter a valid 6-digit OTP", "সঠিক ৬ ডিজিটের OTP লিখুন"),
      );
    }
  };

  const handleResendOtp = () => {
    if (otpTimer > 0) return;

    let nextTimer = 59;
    if (resendCount === 1)
      nextTimer = 119; // 2 mins
    else if (resendCount >= 2) nextTimer = 299; // 5 mins

    setOtpTimer(nextTimer);
    setResendCount((prev) => prev + 1);
    toast.success(t("OTP Resent Successfully", "OTP পুনরায় পাঠানো হয়েছে"));
  };

  const [deleteStep, setDeleteStep] = useState<"request" | "survey" | "final">(
    "request",
  );
  const [deleteReason, setDeleteReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const handleDeleteAccount = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmation: deleteConfirmText }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success(
        t(
          "Account deleted successfully",
          "অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে",
        ),
      );
      onLogout();
      window.location.href = "/"; // Redirect to landing
    } catch (error) {
      console.error("Account deletion error:", error);
      toast.error(
        t("Failed to delete account", "অ্যাকাউন্ট মুছতে ব্যর্থ হয়েছে"),
      );
      setSubmitting(false);
    }
  };

  const handleEnable2fa = () => {
    if (!is2faEnabled) {
      setOtpType(twoFactorMethod === "phone" ? "phone" : "email");
      setOtpTarget(
        twoFactorMethod === "phone" ? profileData.phone : profileData.email,
      );
      setShowOtpModal(true);
      setOtpTimer(59);
      // For demo, we auto-enable. In real app, this happens in handleVerifyOtp.
      setIs2faEnabled(true);
      toast.success(
        t("2FA Security Enabled", "২-ফ্যাক্টর নিরাপত্তা সচল করা হয়েছে"),
      );
    } else {
      setIs2faEnabled(false);
      toast.success(t("2FA Disabled", "২-ফ্যাক্টর অথেন্টিকেশন বন্ধ করা হয়েছে"));
    }
    setShow2faModal(false);
  };

  const handleUpdateSettings = async (updates: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        // Fallback for demo
        setSettings({ ...settings, ...updates });
        return;
      }
      fetchData();
    } catch (error) {
      console.error("Settings update error:", error);
      // Fallback for demo
      setSettings({ ...settings, ...updates });
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    status: string,
    rCharge?: number,
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, returnCharge: rCharge }),
      });

      if (!response.ok) {
        console.warn(
          "Backend failed to update status, simulating success for UI",
        );
      }

      fetchData();
      setShowReturnPopup(null);
      setReturnCourierCharge("80");
    } catch (error) {
      console.error("Status update error:", error);
      // Simulate success even on network error for mock data
      setShowReturnPopup(null);
      setReturnCourierCharge("80");
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const totalProductPrice = orderProducts.reduce(
      (acc, p) => acc + (parseFloat(p.price) || 0) * (p.quantity || 1),
      0,
    );
    const netTotal = totalProductPrice + (parseFloat(deliveryCharge) || 0);
    const orderUid = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Traffic Source Tracking Logic
    let campaignLabel = orderAdSource || t("Direct Page", "ডাইরেক্ট পেইজ");
    if (!orderAdSource) {
      if (showOrderPanel.ad_name) {
        campaignLabel = showOrderPanel.ad_name;
      } else if (showOrderPanel.id === "manual") {
        campaignLabel = t("Manual Order", "ম্যানুয়াল অর্ডার");
      }
    }

    try {
      const token = localStorage.getItem("token");
      // Attempt backend call
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: showOrderPanel.id || "mock-id",
          products: orderProducts,
          totalPrice: netTotal,
          paymentMethod,
          deliveryAddress,
          orderUid,
          customerName,
          customerPhone,
          confirmationMsg: orderConfirmationMsg,
          campaignLabel,
          adId: showOrderPanel.ad_id || "",
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(
            errorData.error ||
              t(
                "Order limit reached. Please upgrade.",
                "অর্ডার লিমিট শেষ। আপগ্রেড করুন।",
              ),
          );
          setSubmitting(false);
          return;
        }
      }

      // Success implementation (Local State Update)
      const newOrder: any = {
        id: Date.now(),
        uid: orderUid,
        customer:
          customerName || showOrderPanel.fb_customer_name || "New Customer",
        phone: customerPhone || "01XXXXXXXXX",
        address: deliveryAddress,
        product: orderProducts.map((p) => p.name || "[Unnamed]").join(", "),
        products: [...orderProducts],
        productPrice: totalProductPrice,
        deliveryCharge: parseInt(deliveryCharge) || 0,
        price: netTotal,
        payment:
          paymentMethod === "cod"
            ? "COD"
            : paymentMethod === "bkash"
              ? "bKash"
              : "Nagad",
        status: "Pending",
        campaign: campaignLabel,
        adSource: showOrderPanel.ad_id
          ? `${t("Ad ID", "অ্যাড আইডি")}: ${showOrderPanel.ad_id}`
          : t("Direct", "সরাসরি"),
        date: new Date().toISOString(),
      };

      setOrders((prev) => [newOrder, ...prev]);

      if (showOrderPanel.id && showOrderPanel.id !== "manual") {
        setConversations(
          conversations.map((c) =>
            c.id === showOrderPanel.id
              ? { ...c, status: "Ordered", order_uid: orderUid, timestamp: Date.now() }
              : c,
          ),
        );

        const newNotif = {
          id: Date.now(),
          title: "Order Confirmation Sent",
          titleBn: "অর্ডার কনফার্মেশন পাঠানো হয়েছে",
          desc: `Automatic confirmation message sent to ${showOrderPanel.fb_customer_name} for Order ${orderUid}.`,
          descBn: `${showOrderPanel.fb_customer_name}-কে অর্ডার ${toBanglaNumber(orderUid)} এর জন্য স্বয়ংক্রিয় কনফার্মেশন মেসেজ পাঠানো হয়েছে।`,
          time: "Just now",
          timeBn: "এই মাত্র",
          read: false,
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }

      const successActions = [];
      if (showOrderPanel.id && showOrderPanel.id !== "manual") {
        successActions.push(t("Auto Message Sent", "স্বয়ংক্রিয় মেসেজ পাঠানো হয়েছে"));
        successActions.push(t("CRM Log Updated", "CRM লগ আপডেট করা হয়েছে"));
      } else {
        successActions.push(t("CRM Log Updated", "CRM লগ আপডেট করা হয়েছে"));
      }
      successActions.push(t("Meta Signal Sent (Server-side)", "মেটা সিগন্যাল পাঠানো হয়েছে (সার্ভার-সাইড)"));

      setShowOrderSuccessModal({ ...newOrder, actions: successActions });
      setShowOrderPanel(null);

      // Reset Form States
      setCustomerName("");
      setCustomerPhone("");
      setProductName("");
      setPrice("");
      setDeliveryCharge("0");
      setDeliveryAddress("");
      setOrderConfirmationMsg("");
      setOrderProducts([{ id: Date.now(), name: "", price: "", quantity: 1 }]);
    } catch (error) {
      console.error("Order confirmation error:", error);
      toast.error(
        t(
          "Order calculation error. Check inputs.",
          "অর্ডার ক্যালকুলেশনে সমস্যা হয়েছে।",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const searchOptions = [
    {
      id: "overview",
      labelEn: "Dashboard",
      labelBn: "ড্যাশবোর্ড",
      tab: "overview",
    },
    {
      id: "conversations",
      labelEn: "Messages",
      labelBn: "ম্যাসেজ",
      tab: "conversations",
    },
    { id: "orders", labelEn: "Orders", labelBn: "অর্ডার", tab: "orders" },
    {
      id: "reports",
      labelEn: "Ads Performance",
      labelBn: "অ্যাড পারফর্ম্যান্স",
      tab: "reports",
    },
    { id: "settings", labelEn: "Settings", labelBn: "সেটিংস", tab: "settings" },
    {
      id: "subscription",
      labelEn: "Subscription",
      labelBn: "সাবস্ক্রিপশন",
      tab: "subscription",
    },
  ];

  const filteredSearch = searchQuery
    ? searchOptions.filter(
        (opt) =>
          opt.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.labelBn.includes(searchQuery),
      )
    : [];

  const handleSearchSelect = (tab: string) => {
    setActiveTab(tab);
    if (tab === "conversations") setConvFilter("Open");
    setSearchQuery("");
    setShowSearchResults(false);
  };

  return (
    <div className="flex h-screen bg-bg text-text font-sans overflow-hidden">
      <Toaster position="top-right" duration={3000} reverseOrder={false} />
      
      {/* Meta Connect Success Modal */}
      <AnimatePresence>
        {showConnectSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-md bg-card border border-border rounded-3xl p-8 z-[101] shadow-2xl text-center"
             >
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-text mb-4">Setup Complete!</h2>
                <p className="text-sm font-medium text-text2 mb-8">
                  From now on, messages from any source to your page will be synced and displayed according to app features.
                </p>
                <button
                  onClick={() => {
                    setShowConnectSuccessModal(false);
                    setActiveTab('overview');
                  }}
                  className="btn-primary w-full"
                >
                   Go to Dashboard
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Popup Modal */}
      <AnimatePresence>
        {showReturnPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReturnPopup(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 z-[101] shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red/10 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-red" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {t("Confirm Return", "রিটার্ন নিশ্চিত করুন")}
                  </h3>
                  <p className="text-text3 text-xs">
                    {t(
                      "Deduct courier charges for order",
                      "অর্ডারের জন্য কুরিয়ার চার্জ কাটুন",
                    )}{" "}
                    {showReturnPopup.uid}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                    {t("Courier Charge (BDT)", "কুরিয়ার চার্জ (টাকা)")}
                  </label>
                  <input
                    type="number"
                    value={returnCourierCharge}
                    onChange={(e) => setReturnCourierCharge(e.target.value)}
                    className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red transition-all"
                    placeholder="80"
                  />
                </div>
                <div className="bg-red/5 border border-red/10 rounded-xl p-3">
                  <p className="text-[10px] text-red leading-relaxed">
                    {t(
                      "Note: This amount will be deducted from your estimated net revenue to reflect the loss from this return.",
                      "দ্রষ্টব্য: এই পরিমাণটি আপনার আনুমানিক নিট রেভিনিউ থেকে কাটা হবে যাতে এই রিটার্ন থেকে হওয়া ক্ষতি প্রতিফলিত হয়।",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReturnPopup(null)}
                  className="btn-secondary flex-1"
                >
                  {t("Cancel", "বাতিল")}
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="btn-primary flex-1 bg-red shadow-red/20"
                >
                  {t("Confirm Return", "রিটার্ন নিশ্চিত করুন")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full Order Management Modal */}
      <AnimatePresence>
        {showOrderManagement && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowOrderManagement(false);
                setIsEditingOrder(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-card border-l border-border z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-bg3/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-orange" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {t("Order Management", "অর্ডার ম্যানেজমেন্ট")}
                    </h3>
                    <p className="text-text3 text-xs">
                      {t("Editing Order", "অর্ডার এডিট করা হচ্ছে")}{" "}
                      {selectedOrder.uid}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowOrderManagement(false);
                    setIsEditingOrder(false);
                  }}
                  className="p-2 hover:bg-bg2 rounded-full text-text3 hover:text-text transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                <div className="space-y-8 pb-10">
                  {/* Section 1: Customer Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-orange uppercase tracking-widest flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />{" "}
                      {t("Customer Information", "কাস্টমার ইনফরমেশন")}
                    </h4>
                    <div className="space-y-4 px-1">
                      <div>
                        <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                          {t("Source", "সোর্স")}
                        </label>
                        <div className="w-full bg-bg2/50 border border-border rounded-2xl py-3.5 px-5 text-xs text-text font-bold flex items-center gap-3 shadow-sm">
                          <Globe className="w-4 h-4 text-text3/50" />
                          <div className="flex items-center gap-2">
                            <span className="text-text3/70">
                              {t("Ad ID:", "অ্যাড আইডি:")}
                            </span>
                            <span className="bg-bg3 px-2 py-0.5 rounded border border-border text-[10px] font-mono">
                              {selectedOrder.uid || "Direct"}
                            </span>
                            <span className="text-text2 ml-1">
                              {selectedOrder.adSource ||
                                selectedOrder.campaign ||
                                t("Manual Order", "ম্যানুয়াল অর্ডার")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                          {t("Customer Name", "কাস্টমার নাম")}
                        </label>
                        <input
                          type="text"
                          disabled={!isEditingOrder}
                          value={selectedOrder.customer}
                          placeholder={t("Enter name", "নাম লিখুন")}
                          onChange={(e) =>
                            setSelectedOrder({
                              ...selectedOrder,
                              customer: e.target.value,
                            })
                          }
                          className={`w-full bg-bg2/50 border border-border rounded-2xl py-3.5 px-5 text-xs text-text focus:border-orange outline-none transition-all placeholder:text-text3/50 font-bold shadow-sm ${!isEditingOrder ? "opacity-70 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                          {t("Customer Phone", "কাস্টমার ফোন")}
                        </label>
                        <input
                          type="text"
                          disabled={!isEditingOrder}
                          value={selectedOrder.phone}
                          placeholder="01XXXXXXXXX"
                          onChange={(e) =>
                            setSelectedOrder({
                              ...selectedOrder,
                              phone: e.target.value,
                            })
                          }
                          className={`w-full bg-bg2/50 border border-border rounded-2xl py-3.5 px-5 text-xs text-text focus:border-orange outline-none transition-all placeholder:text-text3/50 font-bold shadow-sm ${!isEditingOrder ? "opacity-70 cursor-not-allowed" : ""}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                          {t("Shipping Address", "শিপিং অ্যাড্রেস")}
                        </label>
                        <textarea
                          disabled={!isEditingOrder}
                          value={selectedOrder.address}
                          onChange={(e) =>
                            setSelectedOrder({
                              ...selectedOrder,
                              address: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder={t("Enter address", "ঠিকানা লিখুন")}
                          className={`w-full bg-bg2/50 border border-border rounded-2xl py-3.5 px-5 text-xs text-text focus:border-orange outline-none transition-all resize-none shadow-sm leading-relaxed font-bold ${!isEditingOrder ? "opacity-70 cursor-not-allowed" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Order Details */}
                  <div className="space-y-4 bg-orange/5 p-5 rounded-3xl border border-orange/10 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black text-orange uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />{" "}
                        {t("Product Details", "প্রোডাক্ট ডিটেইলস")}
                      </h4>
                      {isEditingOrder && (
                        <button
                          type="button"
                          onClick={() => {
                            const prods = selectedOrder.products || [];
                            setSelectedOrder({
                              ...selectedOrder,
                              products: [
                                ...prods,
                                {
                                  id: Date.now(),
                                  name: "",
                                  price: "",
                                  quantity: 1,
                                },
                              ],
                            });
                          }}
                          className="btn-primary !px-4 !py-2 !text-[10px]"
                        >
                          <Plus className="w-3 h-3" /> {t("Add", "যোগ করুন")}
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(
                        selectedOrder.products || [
                          {
                            id: Date.now(),
                            name: selectedOrder.product || "",
                            price:
                              selectedOrder.productPrice ||
                              selectedOrder.price ||
                              "",
                            quantity: 1,
                          },
                        ]
                      ).map((prod: any, idx: number, arr: any[]) => (
                        <div
                          key={prod.id || idx}
                          className="bg-card border border-border/60 p-4 rounded-2xl shadow-sm relative group transition-all hover:border-orange/30"
                        >
                          <div className="grid grid-cols-1 gap-4">
                            <div className="relative">
                              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-orange/50 w-3.5 h-3.5" />
                              <input
                                type="text"
                                disabled={!isEditingOrder}
                                placeholder={t("Product Name", "পণ্যের নাম")}
                                className={`w-full bg-bg3/40 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-[11px] text-text focus:border-orange outline-none font-bold ${!isEditingOrder ? "opacity-70 cursor-not-allowed" : ""}`}
                                value={prod.name}
                                onChange={(e) => {
                                  const newProds = [...arr];
                                  newProds[idx].name = e.target.value;
                                  const newStr = newProds
                                    .map((p) => p.name)
                                    .join(", ");
                                  setSelectedOrder({
                                    ...selectedOrder,
                                    products: newProds,
                                    product: newStr,
                                  });
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange/50 text-[10px] font-black">
                                  ৳
                                </span>
                                <input
                                  type="number"
                                  disabled={!isEditingOrder}
                                  placeholder={t("Price", "মূল্য")}
                                  className={`w-full bg-bg3/40 border border-border/50 rounded-xl py-2.5 pl-8 pr-4 text-[11px] text-text focus:border-orange outline-none font-black ${!isEditingOrder ? "opacity-70 cursor-not-allowed" : ""}`}
                                  value={prod.price}
                                  onChange={(e) => {
                                    const newProds = [...arr];
                                    newProds[idx].price = e.target.value;

                                    const totalProdPrice = newProds.reduce(
                                      (acc, p) =>
                                        acc +
                                        (parseFloat(p.price) || 0) *
                                          (p.quantity || 1),
                                      0,
                                    );
                                    setSelectedOrder({
                                      ...selectedOrder,
                                      products: newProds,
                                      productPrice: totalProdPrice,
                                      price:
                                        totalProdPrice +
                                        (selectedOrder.deliveryCharge || 0),
                                    });
                                  }}
                                />
                              </div>
                              <div className="w-24 bg-bg3/40 border border-border/50 rounded-xl flex items-center overflow-hidden">
                                <button
                                  type="button"
                                  disabled={!isEditingOrder}
                                  onClick={() => {
                                    const newProds = [...arr];
                                    newProds[idx].quantity = Math.max(
                                      1,
                                      (newProds[idx].quantity || 1) - 1,
                                    );
                                    const totalProdPrice = newProds.reduce(
                                      (acc, p) =>
                                        acc +
                                        (parseFloat(p.price) || 0) *
                                          (p.quantity || 1),
                                      0,
                                    );
                                    setSelectedOrder({
                                      ...selectedOrder,
                                      products: newProds,
                                      productPrice: totalProdPrice,
                                      price:
                                        totalProdPrice +
                                        (selectedOrder.deliveryCharge || 0),
                                    });
                                  }}
                                  className="flex-1 py-2.5 text-text3 hover:bg-bg3 transition-colors font-black disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-[10px] font-black">
                                  {prod.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  disabled={!isEditingOrder}
                                  onClick={() => {
                                    const newProds = [...arr];
                                    newProds[idx].quantity =
                                      (newProds[idx].quantity || 1) + 1;
                                    const totalProdPrice = newProds.reduce(
                                      (acc, p) =>
                                        acc +
                                        (parseFloat(p.price) || 0) *
                                          (p.quantity || 1),
                                      0,
                                    );
                                    setSelectedOrder({
                                      ...selectedOrder,
                                      products: newProds,
                                      productPrice: totalProdPrice,
                                      price:
                                        totalProdPrice +
                                        (selectedOrder.deliveryCharge || 0),
                                    });
                                  }}
                                  className="flex-1 py-2.5 text-text3 hover:bg-bg3 transition-colors font-black disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                              {isEditingOrder && arr.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newProds = arr.filter(
                                      (_, i) => i !== idx,
                                    );
                                    const newStr = newProds
                                      .map((p) => p.name)
                                      .join(", ");
                                    const totalProdPrice = newProds.reduce(
                                      (acc, p) =>
                                        acc +
                                        (parseFloat(p.price) || 0) *
                                          (p.quantity || 1),
                                      0,
                                    );
                                    setSelectedOrder({
                                      ...selectedOrder,
                                      products: newProds,
                                      product: newStr,
                                      productPrice: totalProdPrice,
                                      price:
                                        totalProdPrice +
                                        (selectedOrder.deliveryCharge || 0),
                                    });
                                  }}
                                  className="p-2.5 bg-red/5 text-red hover:bg-red/10 rounded-xl transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text3">
                          {t("Delivery Charge", "ডেলিভারি চার্জ")}
                        </label>
                        <div className="relative w-36">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange font-black text-[10px]">
                            ৳
                          </span>
                          <input
                            type="number"
                            disabled={!isEditingOrder}
                            value={
                              selectedOrder.deliveryCharge !== undefined
                                ? selectedOrder.deliveryCharge
                                : ""
                            }
                            placeholder="0"
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const val = valStr === "" ? 0 : parseInt(valStr);
                              setSelectedOrder({
                                ...selectedOrder,
                                deliveryCharge: val,
                                price: (selectedOrder.productPrice || 0) + val,
                              });
                            }}
                            className={`w-full bg-bg3/60 border border-border rounded-xl py-2.5 pl-8 pr-4 text-[11px] text-text focus:border-orange outline-none transition-all font-black shadow-inner ${!isEditingOrder ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </div>
                      </div>

                      <div className="bg-bg2/80 border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-[10px] font-black text-text3 uppercase tracking-widest mb-1">
                            {t("Payable Amount", "মোট প্রদেয়")}
                          </p>
                          <p className="text-[9px] text-text3/60 font-bold italic">
                            {t("Price + Delivery", "পণ্য + শিপিং খরচ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-orange tracking-tighter">
                            ৳
                            {toBanglaNumber(
                              (selectedOrder.price ?? 0).toString(),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Delivery Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-orange uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Truck className="w-3.5 h-3.5" />{" "}
                      {t("Delivery Information", "ডেলিভারি ইনফরমেশন")}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text3 uppercase mb-2 ml-1">
                          {t("Payment Method", "পেমেন্ট মেথড")}
                        </label>
                        <SelectionPopup
                          title={t("Select Payment", "পেমেন্ট নির্বাচন")}
                          disabled={!isEditingOrder}
                          options={[
                            { id: "COD", label: t("Cash on Delivery", "ক্যাশ অন ডেলিভারি") },
                            { id: "bKash", label: "bKash" },
                            { id: "Nagad", label: "Nagad" },
                          ]}
                          selectedId={selectedOrder.payment}
                          onSelect={(id) =>
                            setSelectedOrder({ ...selectedOrder, payment: id as any })
                          }
                          isOpen={editOrderPaymentPopupOpen}
                          setIsOpen={setEditOrderPaymentPopupOpen}
                          triggerLabel={
                            selectedOrder.payment === "COD" || selectedOrder.payment === "cod"
                              ? t("Cash on Delivery", "ক্যাশ অন ডেলিভারি")
                              : selectedOrder.payment
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text3 uppercase mb-2 ml-1">
                          {t("Courier Name", "কুরিয়ার নাম")}
                        </label>
                        <SelectionPopup
                          title={t("Select Courier", "কুরিয়ার নির্বাচন")}
                          disabled={!isEditingOrder}
                          options={[
                            { id: "Steadfast", label: "Steadfast" },
                            { id: "Pathao", label: "Pathao" },
                            { id: "RedX", label: "RedX" },
                            { id: "E-Courier", label: "E-Courier" },
                            { id: "PaperFly", label: "PaperFly" },
                            { id: "Sundarban", label: "Sundarban Courier" },
                          ]}
                          selectedId={selectedOrder.courier || ""}
                          onSelect={(id) =>
                            setSelectedOrder({ ...selectedOrder, courier: id })
                          }
                          isOpen={editOrderCourierPopupOpen}
                          setIsOpen={setEditOrderCourierPopupOpen}
                          triggerLabel={
                            selectedOrder.courier ||
                            t("Select Courier", "কুরিয়ার নির্বাচন করুন")
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-text3 uppercase mb-2 ml-1">
                          {t("Order Status", "অর্ডার স্ট্যাটাস")}
                        </label>
                        <SelectionPopup
                          title={t("Select Status", "স্ট্যাটাস নির্বাচন")}
                          disabled={!isEditingOrder}
                          options={[
                            { id: "Pending", label: t("Pending", "পেন্ডিং") },
                            { id: "Shipped", label: t("Shipped", "শিপড") },
                            {
                              id: "Delivered",
                              label: t("Delivered", "ডেলিভার্ড"),
                            },
                            { id: "Returned", label: t("Returned", "রিটার্নড") },
                            { id: "Cancelled", label: t("Cancelled", "বাতিল") },
                          ]}
                          selectedId={selectedOrder.status}
                          onSelect={(id) => {
                            const updates: any = { status: id };
                            if (id === "Delivered" && !selectedOrder.deliveredDate) {
                              updates.deliveredDate = new Date().toISOString().split("T")[0];
                            } else if (id === "Returned" && !selectedOrder.returnedDate) {
                              updates.returnedDate = new Date().toISOString().split("T")[0];
                            } else if (id === "Cancelled" && !selectedOrder.cancelledDate) {
                              updates.cancelledDate = new Date().toISOString().split("T")[0];
                            }
                            setSelectedOrder({ ...selectedOrder, ...updates });
                          }}
                          isOpen={editOrderStatusPopupOpen}
                          setIsOpen={setEditOrderStatusPopupOpen}
                        />
                      </div>
                      {(selectedOrder.status === "Delivered" || selectedOrder.status === "Returned" || selectedOrder.status === "Cancelled") && (
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                            {selectedOrder.status === "Delivered" ? t("Delivered Date", "ডেলিভারি তারিখ") : selectedOrder.status === "Returned" ? t("Returned Date", "রিটার্ন তারিখ") : t("Cancelled Date", "বাতিল তারিখ")}
                          </label>
                          <input
                            type="date"
                            disabled={!isEditingOrder}
                            value={selectedOrder.status === "Delivered" ? (selectedOrder.deliveredDate || "") : selectedOrder.status === "Returned" ? (selectedOrder.returnedDate || "") : (selectedOrder.cancelledDate || "")}
                            onChange={(e) => {
                              const key = selectedOrder.status === "Delivered" ? "deliveredDate" : selectedOrder.status === "Returned" ? "returnedDate" : "cancelledDate";
                              setSelectedOrder({
                                ...selectedOrder,
                                [key]: e.target.value,
                              });
                            }}
                            className={`w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange ${!isEditingOrder ? "opacity-70 cursor-not-allowed" : ""}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-bg3/50 flex flex-col sm:flex-row gap-3">
                {!isEditingOrder ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingOrder(true)}
                    className="btn-primary w-full"
                  >
                    <Edit3 className="w-4 h-4" />
                    {t("Edit Order Details", "অর্ডার এডিট করুন")}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingOrder(false);
                        if (
                          (selectedOrder.campaign === "Manual Order" || !selectedOrder.campaign) &&
                          !orders.find((o) => o.id === selectedOrder.id)
                        ) {
                          setShowOrderManagement(false);
                          setSelectedOrder(null);
                        }
                      }}
                      className="btn-secondary w-full order-2 sm:order-1"
                    >
                      {t("Cancel", "বাতিল")}
                    </button>
                    <button
                      onClick={handleSaveOrder}
                      className="btn-primary w-full bg-green-500 shadow-green-500/20 order-1 sm:order-2"
                    >
                      <Save className="w-4 h-4" />
                      {orders.find((o) => o.id === selectedOrder.id)
                        ? t("Update Details", "ডিটেইলস আপডেট")
                        : t("Save Order", "অর্ডার সেভ করুন")}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-52 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 flex items-center justify-between shrink-0">
          <Logo size="sm" showText={true} theme={theme} />
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-text3 hover:text-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 min-h-0 px-3 py-2 space-y-0.5 overflow-y-auto hide-scrollbar">
          <SidebarItem
            icon={<LayoutDashboard />}
            label={t("Dashboard", "ড্যাশবোর্ড")}
            active={fastActiveTab === "overview"}
            onClick={() => {
              setActiveTab("overview");
              setIsMobileMenuOpen(false);
            }}
          />
          <SidebarItem
            icon={<MessageSquare />}
            label={t("Messages", "ম্যাসেজ")}
            active={fastActiveTab === "conversations"}
            onClick={() => {
              setActiveTab("conversations");
              setConvFilter("Open");
              setIsMobileMenuOpen(false);
            }}
          />
          <SidebarItem
            icon={<Package />}
            label={t("Orders", "অর্ডার")}
            active={fastActiveTab === "orders"}
            onClick={() => {
              setActiveTab("orders");
              setIsMobileMenuOpen(false);
            }}
          />
          <SidebarItem
            icon={<BarChart3 />}
            label={t("Ads Performance", "অ্যাড পারফর্ম্যান্স")}
            active={fastActiveTab === "reports"}
            onClick={() => {
              setActiveTab("reports");
              setIsMobileMenuOpen(false);
            }}
          />
        </nav>

        <div className="p-2.5 border-t border-border space-y-1 shrink-0 bg-card relative z-10">
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-bg3/50 border border-border/50 text-text2 hover:text-text hover:bg-bg2 transition-all mb-2 shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange/10 flex items-center justify-center">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-orange" />
                ) : (
                  <Sun className="w-4 h-4 text-orange" />
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">
                {theme === "dark"
                  ? t("Dark Mode", "ডার্ক মোড")
                  : t("Light Mode", "লাইট মোড")}
              </span>
            </div>
            <div
              className={`w-8 h-4 rounded-full relative transition-all border border-border/50 ${theme === "dark" ? "bg-orange" : "bg-bg3"}`}
            >
              <div
                className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-all ${theme === "dark" ? "right-0.5" : "left-0.5"}`}
              />
            </div>
          </button>

          <div className="flex bg-bg3 rounded-lg p-0.5 mb-1.5 border border-border">
            <button
              onClick={() => i18n.changeLanguage("en")}
              className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${i18n.language === "en" ? "bg-orange text-white shadow-md shadow-orange/20" : "text-text3 hover:text-text"}`}
            >
              EN
            </button>
            <button
              onClick={() => i18n.changeLanguage("bn")}
              className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${i18n.language === "bn" ? "bg-orange text-white shadow-md shadow-orange/20" : "text-text3 hover:text-text"}`}
            >
              BN
            </button>
          </div>

          <button
            onClick={() => {
              setActiveTab("settings");
              setSettingsTab("support");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all font-medium text-xs border ${fastActiveTab === "settings" && settingsTab === "support" ? "bg-orange text-white shadow-md shadow-orange/20 border-orange" : "text-text3 hover:text-text hover:bg-bg2 border-transparent"}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t("Support", "সাপোর্ট")}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("settings");
              setSettingsTab("profile");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all font-medium text-xs border ${fastActiveTab === "settings" && settingsTab !== "support" ? "bg-orange/10 text-orange border-orange/20" : "text-text3 hover:text-text hover:bg-bg2 border-transparent"}`}
          >
            <Settings className="w-4 h-4" />
            <span>{t("Settings", "সেটিংস")}</span>
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setShowLogoutConfirm(true);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-red hover:bg-red/10 border border-transparent hover:border-red/20 rounded-lg transition-all font-medium text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("Logout", "লগআউট")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-52">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 relative z-10 transition-colors duration-300">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-text3 hover:text-text"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative flex-1 md:w-80 search-container">
              <div className="flex items-center gap-2 md:gap-3 bg-bg2 px-3 py-1.5 rounded-lg border border-border">
                <Search className="w-4 h-4 text-text3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder={t(
                    "Search settings, sections...",
                    "সেটিংস, সেকশন খুঁজুন...",
                  )}
                  className="bg-transparent border-none outline-none text-xs w-full min-w-0"
                />
              </div>
              {showSearchResults && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl py-2 z-50 max-h-64 overflow-y-auto">
                  {filteredSearch.length > 0 ? (
                    filteredSearch.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSearchSelect(opt.tab)}
                        className="w-full text-left px-4 py-3 text-sm text-text2 hover:text-text hover:bg-bg2 transition-colors flex items-center gap-3"
                      >
                        <Search className="w-4 h-4 text-text3" />
                        {language === "bn" ? opt.labelBn : opt.labelEn}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-text3 text-center">
                      {t("Not found", "পাওয়া যায়নি")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5 ml-4">
            <div className="relative notification-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-text3 hover:text-text transition-colors shrink-0 notification-btn"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange rounded-full border-2 border-card"></span>
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl py-2 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-border flex items-center justify-between bg-bg2">
                      <h3 className="font-bold text-sm">
                        {t("Notifications", "নোটিফিকেশন")}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setNotificationFilter("all")}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${notificationFilter === "all" ? "bg-orange text-white" : "bg-bg3 text-text3 hover:text-text"}`}
                        >
                          {t("All", "সব")}
                        </button>
                        <button
                          onClick={() => setNotificationFilter("unread")}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${notificationFilter === "unread" ? "bg-orange text-white" : "bg-bg3 text-text3 hover:text-text"}`}
                        >
                          {t("Unread", "অপঠিত")}
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications
                        .filter((n) => notificationFilter === "all" || !n.read)
                        .map((n) => (
                          <div
                            key={n.id}
                            className={`p-4 border-b border-border hover:bg-bg2 transition-all cursor-pointer relative ${!n.read ? "bg-orange/5" : ""}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-bold text-xs text-text">
                                {t(n.title, n.titleBn)}
                              </p>
                              <span className="text-[10px] text-text3">
                                {t(n.time, n.timeBn)}
                              </span>
                            </div>
                            <p className="text-[11px] text-text2 line-clamp-2">
                              {t(n.desc, n.descBn)}
                            </p>
                            {!n.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotifications(
                                    notifications.map((notif) =>
                                      notif.id === n.id
                                        ? { ...notif, read: true }
                                        : notif,
                                    ),
                                  );
                                }}
                                className="mt-2 text-[10px] text-orange font-bold hover:underline"
                              >
                                {t("Mark as read", "পঠিত হিসেবে চিহ্নিত করুন")}
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("notifications");
                        setShowNotifications(false);
                      }}
                      className="w-full p-3 text-xs font-bold text-orange hover:bg-orange/5 transition-all border-t border-border"
                    >
                      {t("See More", "আরও দেখুন")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative profile-dropdown">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-3 md:pl-6 border-l border-border focus:outline-none profile-btn"
              >
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-sm truncate max-w-[120px]">
                    {profileData.name}
                  </p>
                  <p className="text-xs text-text3">
                    {t("Starter Plan", "স্টার্টার প্ল্যান")}
                  </p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-bg3 rounded-full border border-border flex items-center justify-center text-orange font-bold text-sm md:text-base hover:border-orange transition-colors overflow-hidden">
                  {profileData.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt={profileData.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    profileData.name?.[0] || "S"
                  )}
                </div>
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl py-2 z-[100] overflow-hidden origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 bg-bg3 rounded-full border border-border flex items-center justify-center text-orange font-bold text-base overflow-hidden">
                        {profileData.avatar ? (
                          <img
                            src={profileData.avatar}
                            alt={profileData.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          profileData.name?.[0] || "S"
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-text">
                          {profileData.name}
                        </p>
                        <p className="text-[10px] text-text3 font-mono">
                          UID: {profileData.uid}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-text3 font-bold uppercase">
                          {t("Order Credit", "অর্ডার ক্রেডিট")}
                        </span>
                        <span className="text-xs font-bold">
                          {toBanglaNumber(
                            settings?.orders_this_month_count || 0,
                          )}{" "}
                          / {toBanglaNumber(100)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange rounded-full"
                          style={{
                            width: `${Math.min(((settings?.orders_this_month_count || 0) / 100) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab("settings");
                          setSettingsTab("profile");
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-text2 hover:text-text hover:bg-bg2 transition-colors flex items-center gap-3"
                      >
                        <User className="w-4 h-4" />{" "}
                        {t("Profile Settings", "প্রোফাইল সেটিংস")}
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("subscription");
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-text2 hover:text-text hover:bg-bg2 transition-colors flex items-center gap-3"
                      >
                        <CreditCard className="w-4 h-4" />{" "}
                        {t("Upgrade Plan", "প্ল্যান আপগ্রেড")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Order Limit Warning Banner */}
        {settings &&
          settings.subscription_plan !== "pro" &&
          settings.orders_this_month_count >=
            (settings.subscription_plan === "growth" ? 300 : 100) * 0.8 &&
          settings.orders_this_month_count <
            (settings.subscription_plan === "growth" ? 300 : 100) && (
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 md:px-8 py-3 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-sm text-yellow-600 font-medium font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {t(
                  `You have ${toBanglaNumber((settings.subscription_plan === "growth" ? 300 : 100) - settings.orders_this_month_count)} orders left this month.`,
                  `আপনার এই মাসের ${toBanglaNumber((settings.subscription_plan === "growth" ? 300 : 100) - settings.orders_this_month_count)} orders বাকি আছে।`,
                )}
              </div>
              <button
                onClick={() => setActiveTab("subscription")}
                className="px-4 py-1.5 bg-yellow-500 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow active:scale-95 transition-all whitespace-nowrap uppercase tracking-wider"
              >
                {t("Upgrade", "আপগ্রেড করুন")}
              </button>
            </div>
          )}

        {/* Trial Banner */}
        <AnimatePresence>
          {showTrialBanner && (

            <motion.div
              initial={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0, overflow: "hidden" }}
              className="bg-orange/10 border-b border-orange/20 px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative"
            >
              <div className="flex items-center gap-2 text-sm text-orange font-medium pr-8">
                <Clock className="w-4 h-4 shrink-0" />
                <p>
                  {daysLeft === 0
                    ? t(
                        `Your free trial ends in ${hoursLeft} hours. Upgrade now to avoid service interruption.`,
                        `আপনার ফ্রি ট্রায়াল ${toBanglaNumber(hoursLeft)} ঘণ্টার মধ্যে শেষ হবে। সার্ভিস সচল রাখতে এখনই আপগ্রেড করুন।`,
                      )
                    : t(
                        `Your free trial ends in ${daysLeft} days.`,
                        `আপনার ফ্রি ট্রায়াল ${toBanglaNumber(daysLeft)} দিন পর শেষ হবে।`,
                      )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("subscription")}
                  className="text-xs font-bold bg-orange text-white px-4 py-1.5 rounded-full hover:bg-orange/90 transition-all whitespace-nowrap"
                >
                  {t("Upgrade Now", "আপগ্রেড করুন")}
                </button>
                <button
                  onClick={handleDismissTrial}
                  className="absolute top-2 right-4 text-orange hover:text-orange/70 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Content */}
        <div className={`flex-1 p-4 md:p-8 space-y-6 md:space-y-8 relative overflow-y-auto`}>
          {integrationSkipped && ['messages', 'orders', 'ads'].includes(activeTab) ? (
             <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 10 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 className="w-full max-w-sm bg-card border border-border2 rounded-3xl p-8 text-center relative shadow-xl overflow-hidden"
               >
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-orange"></div>
                 <div className="space-y-3 mb-8">
                   <h2 className="text-xl font-black tracking-tight">
                     {language === 'bn' ? 'ফেসবুক কানেক্ট করুন' : 'Connect Facebook'}
                   </h2>
                   <p className="text-text3 text-sm leading-relaxed px-2 font-medium">
                     {language === 'bn' 
                       ? `আপনার ${activeTab === 'messages' ? 'ম্যাসেজ' : activeTab === 'orders' ? 'অর্ডার' : 'অ্যাড'} ট্র্যাকিং শুরু করতে ফেসবুক পেজটি কানেক্ট করা প্রয়োজন।` 
                       : `Connect your Facebook page to access ${activeTab} tracking features.`}
                   </p>
                 </div>
                 <button 
                   onClick={() => { onStartConnectFb && onStartConnectFb(); }} 
                   className="btn-primary w-full py-3.5 rounded-full font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
                 >
                   {language === 'bn' ? 'কানেক্ট করুন' : 'Connect'}
                 </button>
               </motion.div>
             </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-8">
              {/* Welcome Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight font-syne uppercase">
                    {t("Welcome back,", "স্বাগতম,")}{" "}
                    {profileData.name.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-xs text-text3 mt-0.5">
                    {t(
                      "Here is what is happening with your store today.",
                      "আজ আপনার স্টোরে যা ঘটছে তা এখানে দেখুন।",
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DateFilterPopup
                    selectedRange={filterRange}
                    onSelect={setFilterRange}
                    isOpen={overviewFilterOpen}
                    setIsOpen={setOverviewFilterOpen}
                    align="right"
                  />
                  {settings?.meta_connected !== false ? (
                    <button className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 px-3 py-2 rounded-lg font-bold text-xs flex-1 md:flex-none cursor-default">
                      <Facebook className="w-3.5 h-3.5" />
                      {t("Meta Connected", "মেটা কানেক্টেড")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="flex items-center justify-center gap-2 bg-red/10 border border-red/20 text-red px-3 py-2 rounded-lg font-bold text-xs hover:bg-red/20 transition-all flex-1 md:flex-none"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t("Connect Meta", "Meta কানেক্ট করুন")}
                    </button>
                  )}
                </div>
              </div>

              {/* Meta Integration Status Banner */}
              <div className="bg-bg3 border border-border rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-green-500/10 rounded-full flex items-center justify-center relative">
                    <Globe className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-bg3 flex items-center justify-center">
                      <Check className="w-1.5 h-1.5 md:w-2 md:h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold flex flex-wrap items-center gap-2">
                      {t(
                        "Meta Integration Status",
                        "মেটা ইন্টিগ্রেশন স্ট্যাটাস",
                      )}
                      <span className="bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        {t("Active", "অ্যাক্টিভ")}
                      </span>
                    </h3>
                    <p className="text-[10px] md:text-xs text-text3 mt-0.5">
                      {t(
                        "Your Facebook Page and Ads Account are perfectly synced.",
                        "আপনার ফেসবুক পেজ এবং অ্যাড অ্যাকাউন্ট সঠিকভাবে সিঙ্ক করা আছে।",
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="flex-1 md:flex-none bg-card border border-border px-3 py-1.5 rounded-lg text-center">
                    <p className="text-[9px] font-bold text-text3 uppercase tracking-widest">
                      {t("Events Sent", "ইভেন্ট পাঠানো হয়েছে")}
                    </p>
                    <p className="text-sm md:text-base font-black text-cyan">
                      {toBanglaNumber("1,284")}
                    </p>
                  </div>
                  <div className="flex-1 md:flex-none bg-card border border-border px-3 py-1.5 rounded-lg text-center">
                    <p className="text-[9px] font-bold text-text3 uppercase tracking-widest">
                      {t("Match Rate", "ম্যাচ রেট")}
                    </p>
                    <p className="text-sm md:text-base font-black text-green-500">
                      {toBanglaNumber("94")}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label={t("Total Sales", "মোট বিক্রি")}
                  value={`৳${toBanglaNumber(orderStats.grossNum.toLocaleString())}`}
                  change={`+${toBanglaNumber("12.5")}%`}
                  trend="up"
                  icon={<TakaIcon className="w-6 h-6 text-orange" />}
                />
                <StatCard
                  label={t("Confirmed Orders", "কনফার্ম অর্ডার")}
                  value={toBanglaNumber(orderStats.total)}
                  change={`+${toBanglaNumber("8.2")}%`}
                  trend="up"
                  icon={<Package className="w-6 h-6 text-cyan" />}
                />
                <StatCard
                  label={t("Total Leads", "মোট লিড")}
                  value={toBanglaNumber(adStats.leads)}
                  change={`+${toBanglaNumber("24.1")}%`}
                  trend="up"
                  icon={<MessageSquare className="w-6 h-6 text-purple-500" />}
                />
                <StatCard
                  label={t("Conversion Rate", "কনভার্সন রেট")}
                  value={`${toBanglaNumber(conversations.length > 0 ? ((orders.length / conversations.length) * 100).toFixed(1) : 0)}%`}
                  change={`-${toBanglaNumber("2.4")}%`}
                  trend="down"
                  icon={<TrendingUp className="w-6 h-6 text-green-500" />}
                />
              </div>

              {/* Chart Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold">
                        {t("Sales Performance", "বিক্রয় পারফরম্যান্স")}
                      </h3>
                      <p className="text-sm text-text3">
                        {t(
                          "Daily revenue for the last 7 days",
                          "গত ৭ দিনের দৈনিক আয়",
                        )}
                      </p>
                    </div>
                    <DateFilterPopup
                      selectedRange={filterRange}
                      onSelect={setFilterRange}
                      isOpen={supportFilterOpen}
                      setIsOpen={setSupportFilterOpen}
                    />
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorSales"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#F97316"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#F97316"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="var(--text3)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="var(--text3)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `৳${toBanglaNumber(v)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "16px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                          }}
                          itemStyle={{
                            color: "var(--orange)",
                            fontWeight: "bold",
                          }}
                          formatter={(value: any) => [
                            `৳${toBanglaNumber(value)}`,
                            t("Sales", "বিক্রয়"),
                          ]}
                          labelStyle={{
                            color: "var(--text3)",
                            marginBottom: "4px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="var(--orange)"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorSales)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-6">
                    {t("Recent Orders", "সাম্প্রতিক অর্ডার")}
                  </h3>
                  <div className="space-y-6">
                    {filteredOrders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-bg3 rounded-full flex items-center justify-center text-orange font-bold">
                            {order.customer[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{order.customer}</p>
                            <p className="text-[10px] text-text3 uppercase font-bold">
                              {order.product}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-orange">
                            ৳{toBanglaNumber(order.price || 0)}
                          </p>
                          <p className="text-[10px] text-text3">
                            {new Date(order.date).toLocaleDateString(
                              language === "bn" ? "bn-BD" : "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="w-full mt-8 bg-bg3 border border-border py-3 rounded-xl font-bold text-sm hover:bg-bg2 transition-all"
                  >
                    {t("View All Orders", "সব অর্ডার দেখুন")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "conversations" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {t("Messages", "ম্যাসেজ")}
                </h2>
                <div className="flex items-center gap-2">
                  <DateFilterPopup
                    selectedRange={filterRange}
                    onSelect={setFilterRange}
                    isOpen={convFilterOpen}
                    setIsOpen={setConvFilterOpen}
                    align="right"
                  />
                  <div className="relative conv-search-container">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
                    <input
                      type="text"
                      value={convSearch}
                      onChange={(e) => {
                        setConvSearch(e.target.value);
                        setShowConvSuggestions(true);
                      }}
                      onFocus={() => setShowConvSuggestions(true)}
                      placeholder={t(
                        "Search by name or Ad...",
                        "নাম বা Ad দিয়ে খুঁজুন...",
                      )}
                      className="bg-bg3 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:border-orange w-full sm:w-60"
                    />
                    <AnimatePresence>
                      {showConvSuggestions && convSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-2xl py-1 z-50"
                        >
                          {convSuggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setConvSearch(s);
                                setShowConvSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-1.5 text-xs text-text2 hover:text-text hover:bg-bg2 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Message Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Total Messages", "মোট ম্যাসেজ")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-text tracking-tight">
                    {toBanglaNumber(conversations.length)}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm border-orange/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange" />
                    <p className="text-[10px] text-orange uppercase font-bold tracking-wider">
                      {t("Order Confirmed", "অর্ডার কনফার্ম")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-orange tracking-tight">
                    {toBanglaNumber(
                      conversations.filter((c) => c.status === "Ordered")
                        .length,
                    )}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm border-red/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red" />
                    <p className="text-[10px] text-red uppercase font-bold tracking-wider">
                      {t("Not Ordered", "অর্ডার হয়নি")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-red tracking-tight">
                    {toBanglaNumber(
                      conversations.filter((c) => c.status === "Not Ordered")
                        .length,
                    )}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm border-cyan/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan" />
                    <p className="text-[10px] text-cyan uppercase font-bold tracking-wider">
                      {t("Follow-Up Pending", "ফলো-আপ বাকি")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-cyan tracking-tight">
                    {toBanglaNumber(
                      conversations.filter(
                        (c) =>
                          c.status === "Follow-Up Pending" ||
                          (c.status === "Not Ordered" && c.followUpScheduled),
                      ).length,
                    )}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm border-green-500/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <p className="text-[10px] text-green-500 uppercase font-bold tracking-wider">
                      {t("Follow-Up Confirmed", "ফলো-আপ কনফার্ম")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-green-500 tracking-tight">
                    {toBanglaNumber(
                      conversations.filter(
                        (c) => c.status === "Follow-Up Complete",
                      ).length,
                    )}
                  </p>
                </div>
              </div>

              {/* Filter Tabs - Improved Segmented Control Design */}
              <div className="flex bg-bg3/50 backdrop-blur-sm p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto hide-scrollbar gap-1 border border-border/50 shadow-inner">
                {[
                  "All",
                  "Open",
                  "Ordered",
                  "Not Ordered",
                  "Follow-Up Pending",
                  "Follow-Up Complete",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setConvFilter(tab)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-wider flex items-center gap-2 ${
                      convFilter === tab
                        ? "bg-orange text-white shadow-lg shadow-orange/20 scale-[1.02]"
                        : "text-text3 hover:text-text hover:bg-bg2"
                    }`}
                  >
                    {t(
                      tab,
                      tab === "All"
                        ? "সব"
                        : tab === "Open"
                          ? "ওপেন"
                          : tab === "Ordered"
                            ? "অর্ডার কনফার্ম"
                            : tab === "Not Ordered"
                              ? "অর্ডার হয়নি"
                              : tab === "Follow-Up Pending"
                                ? "ফলো-আপ বাকি"
                                : "ফলো-আপ সম্পন্ন",
                    )}
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${convFilter === tab ? "bg-white/20 text-white" : "bg-bg2 text-text3 border border-border"}`}
                    >
                      {toBanglaNumber(tabCounts[tab as keyof typeof tabCounts])}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredConversations.map((c) => (
                  <div
                    key={c.id}
                    className="bg-card border border-border rounded-xl p-4 hover:border-border2 transition-all flex flex-col gap-4 relative"
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-text3">
                      <Clock className="w-2.5 h-2.5" /> {t(c.time, c.timeBn)}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 font-bold shrink-0 text-sm">
                        {c.fb_customer_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                          {c.fb_customer_name}
                        </p>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-500/10 text-blue-500 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1 whitespace-nowrap">
                              <Facebook className="w-2.5 h-2.5" /> {c.ad_name} (
                              {toBanglaNumber(c.ad_id)})
                            </span>
                          </div>
                          {c.order_uid && (
                            <div className="flex items-center gap-2">
                              <span className="bg-orange/10 text-orange text-[9px] font-bold px-2 py-0.5 rounded-full border border-orange/20 flex items-center gap-1 whitespace-nowrap">
                                <Hash className="w-2.5 h-2.5" />{" "}
                                {toBanglaNumber(c.order_uid)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        {c.status === "Open" && (
                          <span className="bg-yellow-500/10 text-yellow-500 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border border-yellow-500/20 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-yellow-500"></span>{" "}
                            {t("Open", "ওপেন")}
                          </span>
                        )}
                        {c.status === "Ordered" && (
                          <div className="flex flex-wrap gap-1.5 ml-auto">
                            <span className="bg-orange/20 text-orange text-[9px] font-black px-2.5 py-1 rounded-full border border-orange/30 flex items-center gap-1 uppercase tracking-tighter">
                              <CheckCircle2 className="w-2.5 h-2.5" />{" "}
                              {t("Order Confirmed", "অর্ডার কনফার্ম")}
                            </span>
                            <span className="bg-cyan/10 text-cyan text-[8px] font-bold px-1.5 py-0.5 rounded border border-cyan/20 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" />{" "}
                              {t("Meta Signal", "মেটা সিগন্যাল")}
                            </span>
                            <span className="bg-orange/10 text-orange text-[8px] font-bold px-1.5 py-0.5 rounded border border-orange/20 flex items-center gap-1">
                              <MessageSquare className="w-2.5 h-2.5" />{" "}
                              {t("Auto Message", "অটো মেসেজ")}
                            </span>
                            <span className="bg-green-500/10 text-green-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                              <Database className="w-2.5 h-2.5" />{" "}
                              {t("CRM Log", "CRM লগ")}
                            </span>
                          </div>
                        )}
                        {c.status === "Not Ordered" &&
                          convFilter !== "Follow-Up Pending" && (
                            <span className="bg-red/10 text-red text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border border-red/20 flex items-center gap-1">
                              <XCircle className="w-2.5 h-2.5" />{" "}
                              {t("Not Ordered", "অর্ডার হয়নি")}
                            </span>
                          )}
                        {(c.status === "Follow-Up Pending" ||
                          (c.status === "Not Ordered" &&
                            c.followUpScheduled)) &&
                          convFilter !== "Not Ordered" && (
                            <span className="bg-cyan/10 text-cyan text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border border-cyan/20 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />{" "}
                              {t(
                                "Follow-Up Scheduled",
                                "ফলো-আপ শিডিউল করা হয়েছে",
                              )}
                              <span className="ml-1 opacity-70">
                                (
                                {t(
                                  c.followUpType,
                                  c.followUpType === "Reminder"
                                    ? "রিমাইন্ডার"
                                    : c.followUpType === "Discount Offer"
                                      ? "ডিসকাউন্ট অফার"
                                      : "স্টক আপডেট",
                                )}{" "}
                                •{" "}
                                {t(
                                  c.followUpDelay,
                                  c.followUpDelay === "3 hours"
                                    ? "৩ ঘণ্টা পরে"
                                    : c.followUpDelay === "6 hours"
                                      ? "৬ ঘণ্টা পরে"
                                      : c.followUpDelay === "3 days"
                                        ? "৩ দিন পরে"
                                        : "৭ দিন পরে",
                                )}
                                )
                              </span>
                            </span>
                          )}
                        {c.status === "Follow-Up Complete" && (
                          <span className="bg-green-500/10 text-green-500 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border border-green-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />{" "}
                            {t("Follow-Up Sent", "ফলো-আপ পাঠানো হয়েছে")}
                            <span className="ml-1 opacity-70">
                              (
                              {t(
                                c.followUpType,
                                c.followUpType === "Reminder"
                                  ? "রিমাইন্ডার"
                                  : c.followUpType === "Discount Offer"
                                    ? "ডিসকাউন্ট অফার"
                                    : "স্টক আপডেট",
                              )}{" "}
                              •{" "}
                              {t(
                                c.followUpDelay,
                                c.followUpDelay === "3 hours"
                                  ? "৩ ঘণ্টা পরে"
                                  : c.followUpDelay === "6 hours"
                                    ? "৬ ঘণ্টা পরে"
                                    : c.followUpDelay === "3 days"
                                      ? "৩ দিন পরে"
                                      : "৭ দিন পরে",
                              )}
                              )
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {c.status === "Follow-Up Complete" && (
                          <button
                            onClick={() =>
                              setShowFollowUpPanel({
                                id: c.id,
                                fb_customer_name: c.fb_customer_name,
                                type: c.followUpType,
                                mode: "edit",
                              })
                            }
                            className="bg-cyan text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-cyan/90 transition-colors flex items-center gap-2"
                          >
                            <Calendar className="w-3.5 h-3.5" />{" "}
                            {t("Reschedule", "রিশিডিউল")}
                          </button>
                        )}

                        {(c.status === "Follow-Up Pending" ||
                          (c.status === "Not Ordered" &&
                            c.followUpScheduled)) &&
                          convFilter !== "Not Ordered" && (
                            <button
                              onClick={() =>
                                setShowFollowUpPanel({
                                  id: c.id,
                                  fb_customer_name: c.fb_customer_name,
                                  type: c.followUpType,
                                  delay: c.followUpDelay,
                                  mode: "view",
                                })
                              }
                              className="bg-bg3 border border-border text-text2 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-bg2 transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" />{" "}
                              {t("See Details", "বিস্তারিত দেখুন")}
                            </button>
                          )}

                        {c.status !== "Ordered" && (
                          <button
                            onClick={() =>
                              setShowOrderPanel({
                                id: c.id,
                                fb_customer_name: c.fb_customer_name,
                                ad_id: c.ad_id,
                                ad_name: c.ad_name,
                              })
                            }
                            className="bg-orange text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange/90 transition-colors"
                          >
                            {t("Confirm Order", "অর্ডার কনফার্ম করুন")}
                          </button>
                        )}

                        {c.status === "Not Ordered" &&
                          convFilter !== "Follow-Up Pending" && (
                            <button
                              disabled={c.followUpScheduled}
                              onClick={() =>
                                setShowFollowUpPanel({
                                  id: c.id,
                                  fb_customer_name: c.fb_customer_name,
                                  mode: "edit",
                                })
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                                c.followUpScheduled
                                  ? "bg-cyan/30 text-white/70 cursor-not-allowed"
                                  : "bg-cyan text-white hover:bg-cyan/90"
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {c.followUpScheduled
                                ? t(
                                    "Follow-Up Scheduled",
                                    "ফলো-আপ শিডিউল করা হয়েছে",
                                  )
                                : t("Follow Up", "ফলো-আপ")}
                            </button>
                          )}

                        {c.status === "Open" && (
                          <button
                            onClick={() =>
                              setConversations(
                                conversations.map((conv) =>
                                  conv.id === c.id
                                    ? { ...conv, status: "Not Ordered" }
                                    : conv,
                                ),
                              )
                            }
                            className="bg-transparent border border-border text-text2 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-bg3 transition-colors"
                          >
                            {t("Not Ordered", "অর্ডার হয়নি")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {t("All Notifications", "সব নোটিফিকেশন")}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setShowNotificationSettings(!showNotificationSettings)
                    }
                    className="p-2 bg-bg3 border border-border rounded-xl hover:border-orange transition-all"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (selectedNotifications.length > 0) {
                        if (
                          confirm(
                            t(
                              "Are you sure you want to delete selected notifications?",
                              "আপনি কি নিশ্চিত যে আপনি নির্বাচিত নোটিফিকেশনগুলো মুছে ফেলতে চান?",
                            ),
                          )
                        ) {
                          setNotifications(
                            notifications.filter(
                              (n) => !selectedNotifications.includes(n.id),
                            ),
                          );
                          setSelectedNotifications([]);
                        }
                      }
                    }}
                    className={`p-2 bg-bg3 border border-border rounded-xl transition-all ${selectedNotifications.length > 0 ? "text-red border-red/30 hover:bg-red/5" : "text-text3 opacity-50 cursor-not-allowed"}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl overflow-hidden">
                <div className="p-4 bg-bg2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedNotifications.length === notifications.length &&
                        notifications.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications(
                            notifications.map((n) => n.id),
                          );
                        } else {
                          setSelectedNotifications([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-border text-orange focus:ring-orange bg-bg3"
                    />
                    <span className="text-sm font-bold text-text3">
                      {t("Select All", "সব সিলেক্ট করুন")}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications(
                        notifications.map((n) => ({ ...n, read: true })),
                      )
                    }
                    className="text-xs font-bold text-orange hover:underline"
                  >
                    {t("Mark all as read", "সব পঠিত হিসেবে চিহ্নিত করুন")}
                  </button>
                </div>

                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-6 flex items-start gap-4 hover:bg-bg2 transition-all group ${!n.read ? "bg-orange/5" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(n.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotifications([
                              ...selectedNotifications,
                              n.id,
                            ]);
                          } else {
                            setSelectedNotifications(
                              selectedNotifications.filter((id) => id !== n.id),
                            );
                          }
                        }}
                        className="w-4 h-4 mt-1 rounded border-border text-orange focus:ring-orange bg-bg3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-text">
                            {t(n.title, n.titleBn)}
                          </h4>
                          <span className="text-xs text-text3">
                            {t(n.time, n.timeBn)}
                          </span>
                        </div>
                        <p className="text-sm text-text2 mb-3">
                          {t(n.desc, n.descBn)}
                        </p>
                        <div className="flex items-center gap-4">
                          {!n.read && (
                            <button
                              onClick={() =>
                                setNotifications(
                                  notifications.map((notif) =>
                                    notif.id === n.id
                                      ? { ...notif, read: true }
                                      : notif,
                                  ),
                                )
                              }
                              className="text-xs font-bold text-orange hover:underline"
                            >
                              {t("Mark as read", "পঠিত হিসেবে চিহ্নিত করুন")}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  t(
                                    "Delete this notification?",
                                    "এই নোটিফিকেশনটি মুছে ফেলবেন?",
                                  ),
                                )
                              ) {
                                setNotifications(
                                  notifications.filter(
                                    (notif) => notif.id !== n.id,
                                  ),
                                );
                              }
                            }}
                            className="text-xs font-bold text-red opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            {t("Delete", "মুছে ফেলুন")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-12 text-center text-text3 italic">
                      {t(
                        "No notifications found.",
                        "কোনো নোটিফিকেশন পাওয়া যায়নি।",
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">{t("Orders", "অর্ডার")}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrder({
                        id: Date.now(),
                        uid: "ORD-" + Math.floor(1000 + Math.random() * 9000),
                        customer: "",
                        phone: "",
                        address: "",
                        product: "",
                        productPrice: 0,
                        deliveryCharge: 0,
                        price: 0,
                        payment: "COD",
                        status: "Pending",
                        campaign: "Manual Order",
                        date: new Date().toISOString(),
                      });
                      React.startTransition(() => {
                        setIsEditingOrder(true);
                        setShowOrderManagement(true);
                      });
                    }}
                    className="bg-orange text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange/90 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />{" "}
                    {t("Make Order", "মেক অর্ডার")}
                  </button>
                  <button
                    onClick={() => setActiveTab("crm")}
                    className="bg-bg3 border border-border text-text2 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-bg2 transition-all flex items-center gap-2"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />{" "}
                    {t("Order Management", "অর্ডার ম্যানেজমেন্ট")}
                  </button>
                  <DateFilterPopup
                    selectedRange={filterRange}
                    onSelect={setFilterRange}
                    isOpen={orderFilterOpen}
                    setIsOpen={setOrderFilterOpen}
                    align="right"
                  />
                </div>
              </div>

              {/* Summary Tiles Row - Restored Revenue Placements and Desktop Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-orange" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Total Customers", "মোট কাস্টমার")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-text">
                    {toBanglaNumber(482)}
                  </p>
                  <p className="text-[9px] text-green-500 font-bold mt-1">
                    ↑ {toBanglaNumber(12)}% {t("this month", "এই মাসে")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <History className="w-3.5 h-3.5 text-cyan" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Repeat Rate", "রিপিট রেট")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-text">
                    {toBanglaNumber(24.5)}%
                  </p>
                  <p className="text-[9px] text-text3 font-bold mt-1">
                    {t("last 30 days", "গত ৩০ দিনে")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Success Ratio", "সফলতার অনুপাত")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-text">
                    {toBanglaNumber(89)}%
                  </p>
                  <p className="text-[9px] text-text3 font-bold mt-1">
                    {t("orders delivered", "অর্ডার ডেলিভার্ড")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-red" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Return Rate", "রিটার্ন রেট")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-text">
                    {toBanglaNumber(orderStats.returnRate)}%
                  </p>
                  <p className="text-[9px] text-red font-bold mt-1">
                    {t("returned orders", "অর্ডার রিটার্ন হয়েছে")}
                  </p>
                </div>
                {/* Total Revenue and Gross Revenue Restored Here */}
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm border-orange/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TakaIcon className="w-3.5 h-3.5 text-orange" />
                    <p className="text-[10px] text-orange uppercase font-bold tracking-wider">
                      {t("Gross Revenue", "মোট রেভিনিউ")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-orange">
                    ৳{toBanglaNumber(orderStats.gross)}
                  </p>
                  <p className="text-[9px] text-text3 font-bold mt-1">
                    {t("total earnings", "মোট উপার্জন")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm border-cyan/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Net Revenue", "নিট রেভিনিউ")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-cyan">
                    ৳{toBanglaNumber(orderStats.net)}
                  </p>
                  <p className="text-[9px] text-text3 font-bold mt-1">
                    {t("after returns/cancelled", "রিটার্ন/বাতিল বাদে")}
                  </p>
                </div>
              </div>

              {/* Status Filter Tabs - Improved Segmented Control Design */}
              <div className="flex bg-bg3/50 backdrop-blur-sm p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto hide-scrollbar gap-1 border border-border/50 shadow-inner">
                {[
                  "All",
                  "Pending",
                  "Shipped",
                  "Delivered",
                  "Returned",
                  "Cancelled",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setOrderStatusFilter(tab)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-wider flex items-center gap-2 ${
                      orderStatusFilter === tab
                        ? "bg-orange text-white shadow-lg shadow-orange/20 scale-[1.02]"
                        : "text-text3 hover:text-text hover:bg-bg2"
                    }`}
                  >
                    {t(
                      tab,
                      tab === "All"
                        ? "সব"
                        : tab === "Pending"
                          ? "পেন্ডিং"
                          : tab === "Shipped"
                            ? "শিপড"
                            : tab === "Delivered"
                              ? "ডেলিভার্ড"
                              : tab === "Returned"
                                ? "রিটার্নড"
                                : "বাতিল",
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-card border border-border rounded-xl flex flex-col">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-bg3 border-b border-border text-[10px] uppercase tracking-wider text-text3 whitespace-nowrap">
                      <th className="p-3 font-bold">
                        {t("Order Date", "অর্ডার তারিখ")}
                      </th>
                      <th className="p-3 font-bold">
                        {t("Order UID", "অর্ডার UID")}
                      </th>
                      <th className="p-3 font-bold">
                        {t("Customer", "কাস্টমার")}
                      </th>
                      <th className="p-3 font-bold">
                        {t("Product", "প্রোডাক্ট")}
                      </th>
                      <th className="p-3 font-bold">
                        {t("Price (BDT)", "মূল্য (টাকা)")}
                      </th>
                      <th className="p-3 font-bold">
                        {t("Payment", "পেমেন্ট")}
                      </th>
                      <th className="p-3 font-bold">
                        {t("Status", "স্ট্যাটাস")}
                      </th>
                      <th className="p-3 font-bold">
                        {t("Ad Source", "অ্যাড সোর্স")}
                      </th>
                      <th className="p-3 font-bold text-right">
                        {t("Actions", "অ্যাকশন")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 10).map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border hover:bg-bg2 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text2">
                              {new Date(order.date).toLocaleDateString(
                                language === "bn" ? "bn-BD" : "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {order.status === "Delivered" &&
                              order.deliveredDate && (
                                <span className="text-[9px] text-green-500 font-bold mt-0.5">
                                  {t("Delivered:", "ডেলিভারি:")}{" "}
                                  {new Date(
                                    order.deliveredDate,
                                  ).toLocaleDateString(
                                    language === "bn" ? "bn-BD" : "en-GB",
                                    { day: "2-digit", month: "short" },
                                  )}
                                </span>
                              )}
                            {order.status === "Returned" &&
                              order.returnedDate && (
                                <span className="text-[9px] text-red font-bold mt-0.5">
                                  {t("Returned:", "রিটার্ন:")}{" "}
                                  {new Date(
                                    order.returnedDate,
                                  ).toLocaleDateString(
                                    language === "bn" ? "bn-BD" : "en-GB",
                                    { day: "2-digit", month: "short" },
                                  )}
                                </span>
                              )}
                            {order.status === "Cancelled" &&
                              order.cancelledDate && (
                                <span className="text-[9px] text-text3 font-bold mt-0.5">
                                  {t("Cancelled:", "বাতিল:")}{" "}
                                  {new Date(
                                    order.cancelledDate,
                                  ).toLocaleDateString(
                                    language === "bn" ? "bn-BD" : "en-GB",
                                    { day: "2-digit", month: "short" },
                                  )}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="p-3 text-xs font-mono text-orange font-bold font-mono">
                          {order.uid}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">
                              {order.customer}
                            </span>
                            <span className="text-[10px] text-text3">
                              {order.phone}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-text2">
                          {order.product}
                        </td>
                        <td className="p-3 text-xs font-bold text-orange">
                          ৳{toBanglaNumber((order.price || 0).toLocaleString())}
                        </td>
                        <td className="p-3 text-xs text-text2">
                          <div className="flex items-center gap-2">
                            {order.payment}
                            {order.isSplit && (
                              <span className="bg-purple-500/10 text-purple-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-purple-500/20">
                                {t("Split", "স্প্লিট")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              order.status === "Delivered"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : order.status === "Shipped"
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : order.status === "Returned"
                                    ? "bg-red-500/10 text-red border-red-500/20"
                                    : order.status === "Cancelled"
                                      ? "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                      : "bg-orange/10 text-orange border-orange/20"
                            }`}
                          >
                            {t(
                              order.status,
                              order.status === "Delivered"
                                ? "ডেলিভার্ড"
                                : order.status === "Shipped"
                                  ? "শিপড"
                                  : order.status === "Returned"
                                    ? "রিটার্নড"
                                    : order.status === "Cancelled"
                                      ? "বাতিল"
                                      : "পেন্ডিং",
                            )}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] text-text2 font-medium">
                            {order.campaign}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsEditingOrder(false);
                              setShowOrderManagement(true);
                            }}
                            className="p-1.5 bg-bg3 border border-border rounded-lg text-text3 hover:text-orange hover:border-orange transition-all"
                            title={t("View Details", "বিস্তারিত দেখুন")}
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-10 text-center text-text3 text-xs italic"
                        >
                          {t(
                            "No orders found matching your search.",
                            "আপনার সার্চের সাথে মিলছে এমন কোনো অর্ডার পাওয়া যায়নি।",
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
                {filteredOrders.length > 10 && (
                  <div className="p-4 border-t border-border bg-bg3 text-center w-full rounded-b-xl">
                    <button
                      onClick={() => setActiveTab("crm")}
                      className="btn-primary mx-auto"
                    >
                      {t(
                        "View All Orders in Management",
                        "সব অর্ডার ম্যানেজমেন্টে দেখুন",
                      )}{" "}
                      
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Dashboard - Modernized */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                
                {/* Modern Payment Split */}
                <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm group hover:border-orange/20 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-text2 uppercase tracking-wider">
                      {t("Payment Split", "পেমেন্ট স্প্লিট")}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* bKash */}
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-sm font-bold flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                           {t("bKash", "বিকাশ")}
                        </span>
                        <span className="text-xs font-mono text-text2">
                          ৳{toBanglaNumber("28,500")} <span className="text-text3 opacity-70">({toBanglaNumber(59)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-bg3 rounded-full h-2 overflow-hidden border border-border/50">
                        <div className="bg-gradient-to-r from-pink-500 to-pink-400 h-full rounded-full transition-all duration-1000" style={{ width: "59%" }}></div>
                      </div>
                    </div>

                    {/* Nagad */}
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-sm font-bold flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-orange"></div>
                           {t("Nagad", "নগদ")}
                        </span>
                        <span className="text-xs font-mono text-text2">
                          ৳{toBanglaNumber("7,200")} <span className="text-text3 opacity-70">({toBanglaNumber(15)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-bg3 rounded-full h-2 overflow-hidden border border-border/50">
                        <div className="bg-gradient-to-r from-orange to-orange/80 h-full rounded-full transition-all duration-1000" style={{ width: "15%" }}></div>
                      </div>
                    </div>

                    {/* COD */}
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-sm font-bold flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           COD
                        </span>
                        <span className="text-xs font-mono text-text2">
                          ৳{toBanglaNumber("12,300")} <span className="text-text3 opacity-70">({toBanglaNumber(26)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-bg3 rounded-full h-2 overflow-hidden border border-border/50">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-1000" style={{ width: "26%" }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="mt-6 p-3 bg-bg2 rounded-xl flex items-center justify-between border border-border">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text3 uppercase tracking-wider mb-0.5">{t("Pre-Paid", "অগ্রিম প্রদান")}</span>
                      <span className="text-sm font-bold text-green-500">৳{toBanglaNumber("35,700")}</span>
                    </div>
                    <div className="w-px h-8 bg-border"></div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-text3 uppercase tracking-wider mb-0.5">{t("Awaiting COD", "COD অপেক্ষমান")}</span>
                      <span className="text-sm font-bold text-orange">৳{toBanglaNumber("12,300")}</span>
                    </div>
                  </div>
                </div>

                {/* Modern Revenue Summary */}
                <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm group hover:border-cyan/20 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-text2 uppercase tracking-wider">
                      {t("Revenue Summary", "রেভিনিউ সামারি")}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-bg2 p-4 rounded-xl border border-border border-b-2 border-b-orange/30">
                      <span className="block text-[10px] text-text3 uppercase tracking-wider mb-1">
                         {t("Gross Revenue", "মোট রেভিনিউ")}
                      </span>
                      <span className="text-lg font-bold text-orange">
                         ৳{toBanglaNumber(orderStats.gross)}
                      </span>
                      <span className="block text-[9px] text-text3 italic mt-1 leading-tight">
                         ({t("before courier", "কুরিয়ার চার্জ আগে")})
                      </span>
                    </div>
                    
                    <div className="bg-bg2 p-4 rounded-xl border border-border border-b-2 border-b-red/30">
                      <span className="block text-[10px] text-text3 uppercase tracking-wider mb-1">
                         {t("Return Loss", "রিটার্ন লস")}
                      </span>
                      <span className="text-lg font-bold text-red">
                         - ৳{toBanglaNumber(orderStats.returnLoss)}
                      </span>
                      <span className="block text-[9px] text-text3 italic mt-1 leading-tight">
                         ({t("failed deliveries", "ফেইল্ড ডেলিভারি")})
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-bg2 to-bg3 p-5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden">
                     <div className="absolute inset-0 bg-cyan/5"></div>
                     <div className="relative z-10">
                        <span className="block text-xs font-bold text-cyan uppercase tracking-wider mb-1">
                           {t("Est. Net Revenue", "আনুমানিক নিট রেভিনিউ")}
                        </span>
                        <span className="text-2xl font-black text-text font-mono tracking-tight">
                           ৳{toBanglaNumber(orderStats.net)}
                        </span>
                     </div>
                     <div className="relative z-10 text-right opacity-60 max-w-[100px]">
                        <span className="text-[9px] leading-tight block">
                           {t("V2 exact calculation coming soon", "V2 শীঘ্রই আসছে")}
                        </span>
                     </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">
                  {t("Ads Performance", "অ্যাড পারফরম্যান্স")}
                </h2>
              </div>

              {/* Relocated Filters & Search Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <DateFilterPopup
                    selectedRange={filterRange}
                    onSelect={setFilterRange}
                    isOpen={supportFilterOpen}
                    setIsOpen={setSupportFilterOpen}
                    align="left"
                  />
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
                    <input
                      type="text"
                      value={adSearch}
                      onChange={(e) => setAdSearch(e.target.value)}
                      placeholder={t(
                        "Search ads by name or ID...",
                        "নাম বা আইডি দিয়ে অ্যাড খুঁজুন...",
                      )}
                      className="bg-bg3 border border-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-orange w-full shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Metrics Row - Synced with Order page style */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-red" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Total Spend", "মোট খরচ")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-red">
                    ৳{toBanglaNumber(adStats.spend)}
                  </p>
                  <p className="text-[9px] text-text3 font-medium mt-1">
                    {t("last 7 days", "গত ৭ দিনে")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm border-green-500/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Total ROAS", "মোট ROAS")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-green-500">
                    {toBanglaNumber(adStats.roas)}x
                  </p>
                  <p className="text-[9px] text-green-500 font-bold mt-1">
                    ↑ {toBanglaNumber("1.2")} {t("points", "পয়েন্ট")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Total Leads", "মোট লিড")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-cyan">
                    {toBanglaNumber(adStats.leads)}
                  </p>
                  <p className="text-[9px] text-text3 font-medium mt-1">
                    {t("potential customers", "সম্ভাব্য কাস্টমার")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-500" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Cost Per Lead", "লিড প্রতি খরচ")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-purple-500">
                    ৳{toBanglaNumber(adStats.cpl)}
                  </p>
                  <p className="text-[9px] text-green-500 font-bold mt-1">
                    ↓ {toBanglaNumber("5")}% {t("reduction", "কম হয়েছে")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm border-orange/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Target className="w-3.5 h-3.5 text-orange" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Total Purchases", "মোট ক্রয়")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-orange">
                    {toBanglaNumber(adStats.purchases)}
                  </p>
                  <p className="text-[9px] text-text3 font-medium mt-1">
                    {t("confirmed orders", "নিশ্চিত অর্ডার")}
                  </p>
                </div>
                <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-text" />
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Cost Per Purchase", "ক্রয় প্রতি খরচ")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-text">
                    ৳{toBanglaNumber(adStats.cpp)}
                  </p>
                  <p className="text-[9px] text-text3 font-medium mt-1">
                    {t("avg. conversion cost", "গড় কনভারশন খরচ")}
                  </p>
                </div>
              </div>

              {/* Best Performing Ads Section - Global standard charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-orange flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />{" "}
                      {t(
                        "Campaign Performance Trend",
                        "ক্যাম্পেইন পারফরম্যান্স ট্রেন্ড",
                      )}
                    </h3>
                  </div>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data}>
                        <defs>
                          <linearGradient
                            id="colorSpend"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#ff6b00"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ff6b00"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f1f1"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#888" }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#888" }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                            fontSize: "12px",
                          }}
                          cursor={{ stroke: "#ff6b00", strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="#ff6b00"
                          fillOpacity={1}
                          fill="url(#colorSpend)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-green-500 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />{" "}
                      {t("Better Performing Ads", "সেরা পারফর্মিং অ্যাডস")}
                    </h3>
                    <button className="text-[10px] font-black text-orange hover:underline uppercase tracking-widest">
                      {t("See All", "সব দেখুন")}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {filteredAds.slice(0, 3).map((ad, idx) => {
                      const computedRoas = (4.5 - idx * 0.4).toFixed(1);
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-bg3/50 border border-border flex items-center justify-between hover:bg-bg3 transition-all group cursor-pointer"
                          onClick={() =>
                            setShowAdBreakdown({
                              ...ad,
                              spend: ad.spend || 5000,
                              purchases: Math.floor(ad.leads * 0.15),
                              roas: computedRoas,
                              cpp: 450,
                            })
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-black text-[10px] shadow-sm">
                              {toBanglaNumber(idx + 1)}
                            </div>
                            <div>
                              <p className="text-xs font-black tracking-tight group-hover:text-orange transition-colors">
                                {ad.name}
                              </p>
                              <p className="text-[9px] text-text3 font-bold uppercase tracking-widest font-mono">
                                {ad.id}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-green-500">
                              {toBanglaNumber(computedRoas)}x ROAS
                            </p>
                            <div className="flex items-center gap-2 justify-end mt-0.5">
                              <span className="text-[9px] text-text3 font-medium">
                                {toBanglaNumber(ad.leads)} {t("Leads", "লিড")}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-[9px] text-orange font-bold font-mono">
                                ৳{toBanglaNumber(450)} CPP
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black uppercase tracking-widest">
                    {t("Campaign Breakdown", "ক্যাম্পেইন ব্রেকডাউন")}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-bg3 border-b border-border text-[10px] uppercase tracking-widest text-text3 font-black">
                        <th className="p-4">
                          {t("Campaign Name", "ক্যাম্পেইন নাম")}
                        </th>
                        <th className="p-4">{t("Total Spend", "মোট খরচ")}</th>
                        <th className="p-4">{t("Total Leads", "মোট লিড")}</th>
                        <th className="p-4">
                          {t("Per Lead Cost", "লিড পিছু খরচ")}
                        </th>
                        <th className="p-4">{t("Purchases", "মোট ক্রয়")}</th>
                        <th className="p-4">
                          {t("Per Purchase Cost", "ক্রয় পিছু খরচ")}
                        </th>
                        <th className="p-4">
                          {t("Link Clicks", "লিঙ্ক ক্লিক")}
                        </th>
                        <th className="p-4">{t("ROAS", "ROAS")}</th>
                        <th className="p-4">{t("Status", "স্ট্যাটাস")}</th>
                        <th className="p-4 text-right">
                          {t("Action", "অ্যাকশন")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAds.map((camp, i) => {
                        const spend = camp.spend;
                        const adLeads = conversations.filter(
                          (c) => c.ad_id === camp.id,
                        ).length;
                        const purchases = orders.filter((o) => {
                          const adIdMatch =
                            o.adSource && o.adSource.includes(camp.id);
                          const campaignMatch =
                            o.campaign && o.campaign.includes(camp.name);
                          return adIdMatch || campaignMatch;
                        }).length;

                        const revenue = orders
                          .filter((o) => {
                            const adIdMatch =
                              o.adSource && o.adSource.includes(camp.id);
                            const campaignMatch =
                              o.campaign && o.campaign.includes(camp.name);
                            return adIdMatch || campaignMatch;
                          })
                          .reduce(
                            (acc, o) =>
                              acc + (o.status !== "Cancelled" ? o.price : 0),
                            0,
                          );

                        const cpl =
                          adLeads > 0 ? Math.round(spend / adLeads) : 0;
                        const cpp =
                          purchases > 0 ? Math.round(spend / purchases) : 0;
                        const roas =
                          spend > 0 ? (revenue / spend).toFixed(1) : "0";

                        return (
                          <tr
                            key={camp.id}
                            className="border-b border-border hover:bg-bg2 transition-colors group"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ring-4 ring-bg3 ${i % 2 === 0 ? "bg-green-500 ring-green-500/10" : "bg-red ring-red/10"}`}
                                ></div>
                                <div>
                                  <p className="text-xs font-black tracking-tight">
                                    {camp.name}
                                  </p>
                                  <p className="text-[9px] text-text3 font-mono font-bold mt-0.5 uppercase tracking-widest">
                                    {camp.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-xs font-bold text-text2 tracking-tight">
                              ৳{toBanglaNumber(spend.toLocaleString())}
                            </td>
                            <td className="p-4 text-xs font-black text-cyan">
                              {toBanglaNumber(adLeads)}
                            </td>
                            <td className="p-4 text-xs text-text3 font-bold">
                              ৳{toBanglaNumber(cpl)}
                            </td>
                            <td className="p-4 text-xs font-black text-orange">
                              {toBanglaNumber(purchases)}
                            </td>
                            <td className="p-4 text-xs text-text3 font-bold">
                              ৳{toBanglaNumber(cpp)}
                            </td>
                            <td className="p-4 text-xs text-text3 font-bold">
                              {toBanglaNumber(camp.linkClicks)}
                            </td>
                            <td className="p-4 text-xs font-black text-green-500">
                              {toBanglaNumber(roas)}x
                            </td>
                            <td className="p-4">
                              <span
                                className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase border transition-all ${i % 2 === 0 ? "bg-green-500/10 text-green-500 border-green-500/10" : "bg-red/10 text-red border-red/10"}`}
                              >
                                {i % 2 === 0
                                  ? t("Active", "অ্যাক্টিভ")
                                  : t("Paused", "পজড")}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() =>
                                  setShowAdBreakdown({
                                    ...camp,
                                    spend,
                                    purchases,
                                    adLeads,
                                    cpl,
                                    cpp,
                                    roas,
                                    revenue,
                                  })
                                }
                                className="btn-secondary !py-1.5 !px-3 !text-[9px]"
                              >
                                {t("Breakdown", "ব্রেকডাউন")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "crm" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="p-2 hover:bg-bg3 rounded-full text-text3 hover:text-orange transition-all"
                    title={t("Back to Orders", "অর্ডারে ফিরে যান")}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-orange" />
                    {t("Order Management", "অর্ডার ম্যানেজমেন্ট")}
                  </h2>
                </div>
              </div>

              {/* Order Management Summary - Relocated Order Status Metrics here (Non-scrolling Grid) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-bg3 rounded-lg flex items-center justify-center text-text3">
                      <Package className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Total Orders", "মোট অর্ডার")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-text tracking-tight">
                    {toBanglaNumber(orderStats.total)}
                  </p>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Delivered", "ডেলিভার্ড")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-green-500 tracking-tight">
                    {toBanglaNumber(orderStats.delivered)}
                  </p>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Pending", "পেন্ডিং")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-yellow-500 tracking-tight">
                    {toBanglaNumber(orderStats.pending)}
                  </p>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Shipped", "শিপড")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-blue-500 tracking-tight">
                    {toBanglaNumber(orderStats.shipped || 12)}
                  </p>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-red/10 rounded-lg flex items-center justify-center text-red">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Returned", "রিটার্নড")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-red tracking-tight">
                    {toBanglaNumber(orderStats.returned)}
                  </p>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-text3/10 rounded-lg flex items-center justify-center text-text3">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Cancelled", "বাতিল")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-text3 tracking-tight">
                    {toBanglaNumber(orderStats.cancelled)}
                  </p>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Delivered Rate", "ডেলিভারি রেট")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-green-500 tracking-tight">
                    {toBanglaNumber(
                      orderStats.total > 0
                        ? (
                            (orderStats.delivered / orderStats.total) *
                            100
                          ).toFixed(1)
                        : 0,
                    )}
                    %
                  </p>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-red/10 rounded-lg flex items-center justify-center text-red">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-text3 uppercase font-bold tracking-wider">
                      {t("Return Rate", "রিটার্ন রেট")}
                    </p>
                  </div>
                  <p className="text-xl font-black text-red tracking-tight">
                    {toBanglaNumber(orderStats.returnRate)}%
                  </p>
                </div>
              </div>

              {/* Filters Row - Relocated below tiles */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[160px]">
                  <SelectionPopup
                    title={t("Payment Filter", "পেমেন্ট ফিল্টার")}
                    options={[
                      { id: "All", label: t("All Payments", "সব পেমেন্ট") },
                      { id: "COD", label: t("COD", "ক্যাশ অন ডেলিভারি") },
                      { id: "bKash", label: "bKash" },
                      { id: "Nagad", label: "Nagad" },
                    ]}
                    selectedId={orderPaymentFilter}
                    onSelect={(id) => setOrderPaymentFilter(id)}
                    isOpen={orderPaymentPopupOpen}
                    setIsOpen={setOrderPaymentPopupOpen}
                  />
                </div>
                <DateFilterPopup
                  selectedRange={filterRange}
                  onSelect={setFilterRange}
                  isOpen={crmDateFilterOpen}
                  setIsOpen={setCrmDateFilterOpen}
                  align="left"
                />
              </div>

              {/* Status Filter Tabs - Improved Segmented Control Design */}
              <div className="flex bg-bg3/50 backdrop-blur-sm p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto hide-scrollbar gap-1 border border-border/50 shadow-inner mt-2">
                {[
                  "All",
                  "Pending",
                  "Shipped",
                  "Delivered",
                  "Returned",
                  "Cancelled",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setOrderStatusFilter(tab)}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-wider flex items-center gap-2 ${
                      orderStatusFilter === tab
                        ? "bg-orange text-white shadow-lg shadow-orange/20 scale-[1.02]"
                        : "text-text3 hover:text-text hover:bg-bg2"
                    }`}
                  >
                    {t(
                      tab,
                      tab === "All"
                        ? "সব"
                        : tab === "Pending"
                          ? "পেন্ডিং"
                          : tab === "Shipped"
                            ? "শিপড"
                            : tab === "Delivered"
                              ? "ডেলিভার্ড"
                              : tab === "Returned"
                                ? "রিটার্নড"
                                : "বাতিল",
                    )}
                  </button>
                ))}
              </div>

              {/* Search Bar - Relocated below status filter tabs */}
              <div className="relative w-full max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder={t(
                    "Search by UID, Name or Phone...",
                    "UID, নাম বা ফোন নম্বর দিয়ে খুঁজুন...",
                  )}
                  className="bg-bg3 border border-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-orange w-full shadow-sm"
                />
              </div>

              <div className="bg-card border border-border rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-border bg-bg3 flex items-center justify-between">
                  <h3 className="font-bold text-sm">
                    {t("Full Order Management", "সম্পূর্ণ অর্ডার ম্যানেজমেন্ট")}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-bg2 border-b border-border text-[10px] uppercase tracking-wider text-text3 whitespace-nowrap">
                        <th className="p-4 font-bold">
                          {t("Order Date", "অর্ডার তারিখ")}
                        </th>
                        <th className="p-4 font-bold">
                          {t("Order UID", "অর্ডার UID")}
                        </th>
                        <th className="p-4 font-bold">
                          {t("Customer", "কাস্টমার")}
                        </th>
                        <th className="p-4 font-bold">
                          {t("Product", "প্রোডাক্ট")}
                        </th>
                        <th className="p-4 font-bold">
                          {t("Price (BDT)", "মূল্য (টাকা)")}
                        </th>
                        <th className="p-4 font-bold">
                          {t("Payment", "পেমেন্ট")}
                        </th>
                        <th className="p-4 font-bold">
                          {t("Status", "স্ট্যাটাস")}
                        </th>
                        <th className="p-4 font-bold">
                          {t("Ad Source", "অ্যাড সোর্স")}
                        </th>
                        <th className="p-4 font-bold text-right">
                          {t("Actions", "অ্যাকশন")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => {
                          return (
                            <tr
                              key={order.id}
                              className="border-b border-border hover:bg-bg2 transition-colors"
                            >
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-text2">
                                    {new Date(order.date).toLocaleDateString(
                                      language === "bn" ? "bn-BD" : "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </span>
                                  {order.status === "Delivered" &&
                                    order.deliveredDate && (
                                      <span className="text-[9px] text-green-500 font-bold mt-0.5">
                                        {t("Delivered:", "ডেলিভারি:")}{" "}
                                        {new Date(
                                          order.deliveredDate,
                                        ).toLocaleDateString(
                                          language === "bn" ? "bn-BD" : "en-GB",
                                          { day: "2-digit", month: "short" },
                                        )}
                                      </span>
                                    )}
                                  {order.status === "Returned" &&
                                    order.returnedDate && (
                                      <span className="text-[9px] text-red font-bold mt-0.5">
                                        {t("Returned:", "রিটার্ন:")}{" "}
                                        {new Date(
                                          order.returnedDate,
                                        ).toLocaleDateString(
                                          language === "bn" ? "bn-BD" : "en-GB",
                                          { day: "2-digit", month: "short" },
                                        )}
                                      </span>
                                    )}
                                  {order.status === "Cancelled" &&
                                    order.cancelledDate && (
                                      <span className="text-[9px] text-text3 font-bold mt-0.5">
                                        {t("Cancelled:", "বাতিল:")}{" "}
                                        {new Date(
                                          order.cancelledDate,
                                        ).toLocaleDateString(
                                          language === "bn" ? "bn-BD" : "en-GB",
                                          { day: "2-digit", month: "short" },
                                        )}
                                      </span>
                                    )}
                                </div>
                              </td>
                              <td className="p-4 text-xs font-mono text-orange font-bold">
                                {order.uid}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-orange/10 rounded-full flex items-center justify-center text-orange font-bold text-[10px]">
                                    {order.customer[0]}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold block">
                                      {order.customer}
                                    </span>
                                    <span className="text-[10px] text-text3">
                                      {order.phone}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-xs text-text2 max-w-[150px] truncate" title={order.product}>
                                {order.product}
                              </td>
                              <td className="p-4 text-xs font-bold text-orange">
                                ৳{toBanglaNumber((order.price || 0).toLocaleString())}
                              </td>
                              <td className="p-4 text-xs text-text2">
                                <div className="flex items-center gap-2">
                                  {order.payment}
                                  {order.isSplit && (
                                    <span className="bg-purple-500/10 text-purple-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-purple-500/20">
                                      {t("Split", "স্প্লিট")}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                    order.status === "Delivered"
                                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                                      : order.status === "Shipped"
                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        : order.status === "Returned"
                                          ? "bg-red-500/10 text-red border-red-500/20"
                                          : order.status === "Cancelled"
                                            ? "bg-text3/10 text-text3 border-text3/20"
                                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                  }`}
                                >
                                  {t(
                                    order.status,
                                    order.status === "Delivered"
                                      ? "ডেলিভার্ড"
                                      : order.status === "Shipped"
                                        ? "শিপড"
                                        : order.status === "Returned"
                                          ? "রিটার্নড"
                                          : order.status === "Cancelled"
                                            ? "বাতিল"
                                            : "পেন্ডিং",
                                  )}
                                </span>
                              </td>
                              <td className="p-4 text-xs text-text3 font-medium">
                                {order.adSource || order.campaign}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-28 text-left">
                                    <SelectionPopup
                                      title={t(
                                        "Select Status",
                                        "স্ট্যাটাস নির্বাচন",
                                      )}
                                      options={[
                                        {
                                          id: "Pending",
                                          label: t("Pending", "পেন্ডিং"),
                                        },
                                        {
                                          id: "Shipped",
                                          label: t("Shipped", "শিপড"),
                                        },
                                        {
                                          id: "Delivered",
                                          label: t("Delivered", "ডেলিভার্ড"),
                                        },
                                        {
                                          id: "Returned",
                                          label: t("Returned", "রিটার্নড"),
                                        },
                                        {
                                          id: "Cancelled",
                                          label: t("Cancelled", "বাতিল"),
                                        },
                                      ]}
                                      selectedId={order.status}
                                      onSelect={(id) =>
                                        handleUpdateOrderStatus(order.id, id)
                                      }
                                      isOpen={rowStatusPopupOpenId === order.id}
                                      setIsOpen={(open) =>
                                        setRowStatusPopupOpenId(
                                          open ? order.id : null,
                                        )
                                      }
                                    />
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setShowOrderManagement(true);
                                    }}
                                    className="p-1.5 hover:bg-bg3 rounded-lg text-text3 hover:text-orange transition-all"
                                  >
                                    <Settings className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedCRMData(order);
                                      setShowCRMDetail(true);
                                    }}
                                    className="bg-orange/10 text-orange px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-orange hover:text-white transition-all flex items-center gap-1.5"
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    {t("CRM Check", "CRM চেক")}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-10 text-center text-text3 text-xs italic"
                          >
                            {t(
                              "No data matching filters.",
                              "ফিল্টার অনুযায়ী কোনো ডেটা পাওয়া যায়নি।",
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && settings && (
            <div className="max-w-6xl flex flex-col md:flex-row items-start gap-8 pb-20">
              <div className="w-full md:w-56 shrink-0 flex flex-col gap-1 relative md:sticky md:top-24">
                <h2 className="text-xl font-black mb-4 px-2 tracking-tight">{t("Settings", "সেটিংস")}</h2>
                <div className="flex md:flex-col items-stretch gap-1 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
                  {(
                    [
                      "profile",
                      "security",
                      "connected",
                      "notifications",
                      "billing",
                      "support",
                    ] as const
                  ).map((tab: string) => (
                    <button
                      key={tab}
                      onClick={() => setSettingsTab(tab as any)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex whitespace-nowrap ${
                        settingsTab === tab
                          ? "bg-orange text-white shadow-md shadow-orange/20"
                          : "text-text3 hover:bg-bg3 hover:text-text"
                      }`}
                    >
                      {t(
                        tab.charAt(0).toUpperCase() + tab.slice(1),
                        tab === "profile"
                          ? "প্রোফাইল"
                          : tab === "business"
                            ? "বিজনেস"
                            : tab === "security"
                              ? "সিকিউরিটি"
                              : tab === "connected"
                                ? "কানেক্টেড"
                                : tab === "notifications"
                                  ? "নোটিফিকেশন"
                                  : tab === "billing"
                                    ? "বিলিং"
                                    : "সাপোর্ট",
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full max-w-full">

              {settingsTab === "profile" && (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
                      <div className="relative w-24 h-24 mx-auto mb-4 group">
                        <div className="w-full h-full rounded-full bg-bg3 border-4 border-white dark:border-border flex items-center justify-center overflow-hidden shadow-xl ring-1 ring-border/50">
                          {profileData.avatar ? (
                            <img
                              src={profileData.avatar}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="w-10 h-10 text-text3" />
                          )}
                        </div>
                        {isProfileEditing && (
                          <label className="absolute bottom-1 right-1 w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer ring-2 ring-white dark:ring-bg2">
                            <Camera className="w-4 h-4" />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setProfileData({
                                      ...profileData,
                                      avatar: reader.result as string,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-text">
                        {profileData.name}
                      </h3>
                      <p className="text-[10px] text-text3 mt-1 uppercase font-black tracking-widest bg-bg3 py-1 px-3 rounded-full inline-block border border-border/50">
                        UID: {profileData.uid}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <h3 className="font-syne font-black text-sm uppercase tracking-tight flex items-center gap-2">
                          <User className="w-4 h-4 text-orange" />
                          {t("Personal Information", "ব্যক্তিগত তথ্য")}
                        </h3>
                        {!isProfileEditing ? (
                          <button
                            onClick={() => setIsProfileEditing(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bg3 text-text hover:bg-bg2 transition-all text-xs font-bold border border-border/50 shadow-sm"
                          >
                            <Settings className="w-4 h-4" />
                            {t("Edit Personal Info", "তথ্য পরিবর্তন করুন")}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsProfileEditing(false)}
                              className="px-4 py-2 rounded-xl text-text3 hover:text-text transition-all text-xs font-bold"
                            >
                              {t("Cancel", "বাতিল")}
                            </button>
                            <button
                              onClick={handleUpdateProfile}
                              className="px-5 py-2 rounded-xl bg-orange text-white text-xs font-bold shadow-lg shadow-orange/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {t("Save Changes", "সংরক্ষণ করুন")}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                            {t("Unique ID", "ইউনিক আইডি")}
                          </label>
                          <div className="w-full bg-bg3/50 border border-border rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-orange select-all">
                            {profileData.uid}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                            {t("Full Name", "পুরো নাম")}
                          </label>
                          <input
                            type="text"
                            disabled={!isProfileEditing}
                            value={profileData.name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                name: e.target.value,
                              })
                            }
                            placeholder={t(
                              "Enter your full name",
                              "আপনার পুরো নাম লিখুন",
                            )}
                            className={`w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none transition-all ${isProfileEditing ? "focus:border-orange bg-white dark:bg-bg2 shadow-inner" : "opacity-60 cursor-not-allowed"}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                            {t("Email Address", "ইমেইল এড্রেস")}
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              disabled={true}
                              value={profileData.email}
                              className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none opacity-60 cursor-not-allowed pr-10"
                            />
                            {profileData.isGoogleUser && (
                              <div
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                title={t(
                                  "Google accounts cannot change email",
                                  "গুগল অ্যাকাউন্ট ইমেইল পরিবর্তন করতে পারবে না",
                                )}
                              >
                                <Lock className="w-3.5 h-3.5 text-text3" />
                              </div>
                            )}
                          </div>
                          {profileData.isGoogleUser && (
                            <p className="text-[9px] text-text3 mt-1 ml-1 font-medium">
                              {t(
                                "Linked with Google Account",
                                "গুগল অ্যাকাউন্টের সাথে যুক্ত",
                              )}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                            {t("Phone Number", "ফোন নম্বর")}
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="tel"
                              disabled={!isProfileEditing}
                              readOnly={!isProfileEditing}
                              value={profileData.phone}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  phone: e.target.value,
                                })
                              }
                              className={`w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none transition-all ${isProfileEditing ? "focus:border-orange bg-white dark:bg-bg2 shadow-inner" : "opacity-60 cursor-not-allowed"}`}
                            />
                            {isProfileEditing && (
                              <button
                                onClick={() => {
                                  setOtpType("phone");
                                  setOtpTarget(profileData.phone);
                                  setShowOtpModal(true);
                                  setOtpTimer(59);
                                }}
                                className="px-4 py-2 bg-orange text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-lg shadow-orange/20 active:scale-95 transition-all flex items-center gap-2"
                              >
                                {t("Change", "পরিবর্তন")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-orange/5 border border-orange/10 rounded-2xl flex items-start gap-4 text-orange">
                        <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center shrink-0">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">
                            {t("Account Security", "অ্যাকাউন্ট সিকিউরিটি")}
                          </p>
                          <p className="text-[10px] text-text3 mt-1 font-medium leading-relaxed">
                            {t(
                              "Google account users cannot change their email address directly. Your phone number updates require OTP verification for your protection.",
                              "গুগল অ্যাকাউন্ট ব্যবহারকারীরা সরাসরি তাদের ইমেইল পরিবর্তন করতে পারেন না। আপনার নিরাপত্তার জন্য ফোন নম্বর পরিবর্তনে OTP ভেরিফিকেশন প্রয়োজন।",
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border space-y-6">
                        <h3 className="font-syne font-black text-sm uppercase tracking-tight flex items-center gap-2">
                          <Store className="w-4 h-4 text-orange" />
                          {t("Business Information", "বিজনেস তথ্য")}
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                              {t("Store Name", "স্টোরের নাম")}
                            </label>
                            <input
                              type="text"
                              disabled={!isProfileEditing}
                              value={profileData.businessName}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  businessName: e.target.value,
                                })
                              }
                              className={`w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none transition-all ${isProfileEditing ? "focus:border-orange bg-white dark:bg-bg2 shadow-inner" : "opacity-60 cursor-not-allowed"}`}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                              {t("Business Category", "বিজনেস ক্যাটাগরি")}
                            </label>
                            <select
                              disabled={!isProfileEditing}
                              className={`w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none transition-all appearance-none ${isProfileEditing ? "focus:border-orange bg-white dark:bg-bg2 shadow-inner" : "opacity-60 cursor-not-allowed"}`}
                              value={profileData.businessCategory}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  businessCategory: e.target.value,
                                })
                              }
                            >
                              <option value="">
                                {t(
                                  "Select Category",
                                  "ক্যাটাগরি নির্বাচন করুন",
                                )}
                              </option>
                              <option value="fashion">
                                {t("Fashion & Apparel", "ফ্যাশন ও পোশাক")}
                              </option>
                              <option value="electronics">
                                {t("Electronics", "ইলেকট্রনিক্স")}
                              </option>
                              <option value="food">
                                {t("Food & Grocery", "খাদ্য ও গ্রোসারি")}
                              </option>
                              <option value="beauty">
                                {t("Beauty & Health", "বিউটি ও হেলথ")}
                              </option>
                              <option value="other">
                                {t("Other", "অন্যান্য")}
                              </option>
                            </select>
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                              {t("Business Address", "বিজনেসের ঠিকানা")}
                            </label>
                            <textarea
                              disabled={!isProfileEditing}
                              rows={3}
                              value={profileData.address}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  address: e.target.value,
                                })
                              }
                              className={`w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none transition-all resize-none ${isProfileEditing ? "focus:border-orange bg-white dark:bg-bg2 shadow-inner" : "opacity-60 cursor-not-allowed"}`}
                              placeholder={t(
                                "Enter your full business address...",
                                "আপনার পূর্ণ বিজনেস ঠিকানা লিখুন...",
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "security" && (
                <div className="max-w-2xl space-y-6">
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                    <h3 className="font-syne font-black text-sm uppercase tracking-tight flex items-center gap-2 border-b border-border pb-4">
                      <Lock className="w-4 h-4 text-orange" />
                      {t("Change Password", "পাসওয়ার্ড পরিবর্তন")}
                    </h3>
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                          {t("Current Password", "বর্তমান পাসওয়ার্ড")}
                        </label>
                        <input
                          type="password"
                          value={passwordData.current}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              current: e.target.value,
                            })
                          }
                          placeholder="••••••••"
                          className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange transition-all shadow-inner"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                            {t("New Password", "নতুন পাসওয়ার্ড")}
                          </label>
                          <input
                            type="password"
                            value={passwordData.new}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                new: e.target.value,
                              })
                            }
                            placeholder="••••••••"
                            className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                            {t("Confirm Password", "পাসওয়ার্ড নিশ্চিত করুন")}
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirm}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirm: e.target.value,
                              })
                            }
                            placeholder="••••••••"
                            className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 pt-2">
                        <div className="flex justify-start">
                          <button
                            onClick={() => {
                              setOtpType("password_reset");
                              setOtpTarget(profileData.email);
                              setShowForgotPasswordOptions(true);
                            }}
                            className="text-[11px] font-black text-orange hover:underline transition-all"
                          >
                            {t("Forgot Password?", "পাসওয়ার্ড ভুলে গেছেন?")}
                          </button>
                        </div>
                        <button
                          onClick={handleUpdatePassword}
                          className="bg-orange text-white w-fit px-8 py-3 rounded-xl font-bold text-xs hover:bg-orange/90 transition-all shadow-lg shadow-orange/20 active:scale-95 flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          {t("Update Password", "পাসওয়ার্ড আপডেট করুন")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pb-10">
                    {/* Two-Factor Authentication */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm hover:border-orange/20 transition-all group overflow-hidden relative">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange/5 rounded-full blur-3xl group-hover:bg-orange/10 transition-all" />
                      <div className="flex items-center justify-between relative">
                        <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center text-orange group-hover:scale-110 transition-transform shadow-inner">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${is2faEnabled ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red/10 text-red border-red/20"}`}
                        >
                          {is2faEnabled
                            ? t("Enabled", "চালু আছে")
                            : t("Disabled", "বন্ধ আছে")}
                        </div>
                      </div>
                      <div className="relative">
                        <h4 className="font-syne font-black text-sm uppercase mb-1.5 tracking-tight">
                          {t("2-Step Verification", "টু-স্টেপ ভেরিফিকেশন")}
                        </h4>
                        <p className="text-[10px] text-text3 font-medium leading-relaxed">
                          {t(
                            "Protect your account with an additional security layer using Phone/Email OTP.",
                            "ফোন বা ইমেইল OTP-র মাধ্যমে আপনার অ্যাকাউন্টে অতিরিক্ত নিরাপত্তা যোগ করুন।",
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => setShow2faModal(true)}
                        className={`w-full ${
                          is2faEnabled ? "btn-secondary border-red/10 text-red hover:bg-red/5" : "btn-primary shadow-orange/20"
                        }`}
                      >
                        {is2faEnabled
                          ? t("Disable Security", "নিরাপত্তা বন্ধ করুন")
                          : t("Enable Security", "নিরাপত্তা চালু করুন")}
                      </button>
                    </div>

                    {/* Active Sessions */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm hover:border-cyan/20 transition-all group relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan/5 rounded-full blur-3xl group-hover:bg-cyan/10 transition-all" />
                      <div className="flex items-center justify-between relative">
                        <div className="w-12 h-12 rounded-2xl bg-cyan/10 flex items-center justify-center text-cyan group-hover:scale-110 transition-transform shadow-inner">
                          <Globe className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-text3 bg-bg3/80 px-3 py-1 rounded-full border border-border/50 shadow-sm">
                          2 {t("Active", "সচল")}
                        </span>
                      </div>
                      <div className="relative">
                        <h4 className="font-syne font-black text-sm uppercase mb-1.5 tracking-tight">
                          {t("Device Management", "ডিভাইস ম্যানেজমেন্ট")}
                        </h4>
                        <p className="text-[10px] text-text3 font-medium leading-relaxed">
                          {t(
                            "Check all devices that currently have access to your Trackoora account.",
                            "বর্তমানে আপনার অ্যাকাউন্টে লগইন থাকা ডিভাইসগুলো দেখুন।",
                          )}
                        </p>
                      </div>
                      <div className="space-y-3 relative">
                        <div className="flex items-center justify-between p-3.5 bg-bg3/40 rounded-2xl border border-border/50 hover:border-cyan/30 hover:bg-bg3/60 transition-all group/item shadow-inner">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                            <div>
                              <p className="text-[10px] font-black text-text">
                                Windows PC • Dhaka
                              </p>
                              <p className="text-[8px] text-text3 font-black uppercase tracking-widest">
                                {t("Current Session", "বর্তমান সেশন")}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setShowPasswordConfirmModal({
                                onConfirm: () => {
                                  toast.success(
                                    t(
                                      "Logged out from other devices",
                                      "অন্যান্য ডিভাইস থেকে লগআউট করা হয়েছে",
                                    ),
                                  );
                                  setShowPasswordConfirmModal(null);
                                  setConfirmPassword("");
                                },
                                title: t(
                                  "Confirm Identity",
                                  "পরিচয় নিশ্চিত করুন",
                                ),
                              })
                            }
                            className="btn-secondary !text-red !bg-red/10 !border-red/20 hover:!bg-red hover:!text-white !py-1.5 !px-3 !text-[9px]"
                          >
                            {t("Logout", "লগআউট")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red/5 border-2 border-red/30 rounded-3xl p-6 overflow-hidden relative shadow-lg shadow-red/10">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-red/10 rounded-full blur-3xl" />
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-red/20 flex items-center justify-center text-red shadow-inner">
                        <AlertTriangle className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-red uppercase tracking-tight">
                          {t("Danger Zone", "সাবধানতা এলাকা")}
                        </h4>
                        <p className="text-[11px] text-red/70 font-bold px-2 py-0.5 bg-red/10 rounded overflow-hidden max-w-fit">
                          {t("Permanent Actions", "স্থায়ী পদক্ষেপ")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-5 bg-card dark:bg-bg2 rounded-2xl border border-red/20 shadow-sm">
                        <p className="text-sm font-black text-text mb-1.5">
                          {t("Delete My Account", "অ্যাকাউন্ট মুছে ফেলুন")}
                        </p>
                        <p className="text-[11px] text-text3 leading-relaxed mb-5 font-medium">
                          {t(
                            "Permanently delete all your business data, order history, and store settings. This action cannot be revoked once confirmed.",
                            "আপনার সব বিজনেস ডেটা, অর্ডার হিস্ট্রি এবং সেটিংস চিরতরে মুছে ফেলুন। এটি আর ফিরে পাওয়া সম্ভব নয়।",
                          )}
                        </p>
                        <button
                          onClick={() => {
                            setDeleteStep("request");
                            setShowDeleteModal(true);
                          }}
                          className="btn-primary bg-red shadow-red/30 w-full sm:w-auto"
                        >
                          <Trash2 className="w-4 h-4 inline-block mr-2" />
                          {t(
                            "Request Account Deletion",
                            "অ্যাকাউন্ট মোছার আবেদন",
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "business" && (
                <div className="max-w-2xl space-y-6">
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                    <h3 className="font-bold text-sm border-b border-border pb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 text-orange" />
                      {t("Business Information", "বিজনেস তথ্য")}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                            {t("Store Name", "স্টোরের নাম")}
                          </label>
                          <input
                            type="text"
                            value={profileData.businessName}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                businessName: e.target.value,
                              })
                            }
                            className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                            {t("Business Category", "বিজনেস ক্যাটাগরি")}
                          </label>
                          <select
                            className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange transition-all appearance-none"
                            value={profileData.businessCategory}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                businessCategory: e.target.value,
                              })
                            }
                          >
                            <option value="">
                              {t("Select Category", "ক্যাটাগরি নির্বাচন করুন")}
                            </option>
                            <option value="fashion">
                              {t("Fashion & Apparel", "ফ্যাশন ও পোশাক")}
                            </option>
                            <option value="electronics">
                              {t("Electronics", "ইলেকট্রনিক্স")}
                            </option>
                            <option value="food">
                              {t("Food & Grocery", "খাদ্য ও গ্রোসারি")}
                            </option>
                            <option value="beauty">
                              {t("Beauty & Health", "বিউটি ও হেলথ")}
                            </option>
                            <option value="other">
                              {t("Other", "অন্যান্য")}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                          {t("Business Address", "বিজনেসের ঠিকানা")}
                        </label>
                        <textarea
                          rows={3}
                          value={profileData.address}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              address: e.target.value,
                            })
                          }
                          className="w-full bg-bg3 border border-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange transition-all resize-none"
                          placeholder={t(
                            "Enter your full business address...",
                            "আপনার পূর্ণ বিজনেস ঠিকানা লিখুন...",
                          )}
                        />
                      </div>
                      <button
                        onClick={handleUpdateBusinessInfo}
                        className="btn-primary !px-6 !py-2.5"
                      >
                        {t("Update Business Info", "বিজনেস তথ্য আপডেট করুন")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "notifications" && (
                <div className="max-w-2xl space-y-6">
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange" />
                        {t("Notification Settings", "নোটিফিকেশন সেটিংস")}
                      </h3>
                      <button
                        onClick={() => {
                          setNotificationSettings({
                            order: true,
                            message: true,
                            report: true,
                            email: true,
                            sms: true,
                          });
                        }}
                        className="text-[10px] font-black uppercase text-text3 hover:text-orange transition-colors"
                      >
                        {t("Reset to Default", "ডিফল্ট করুন")}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text3 mb-4">
                        {t("System Alerts", "সিস্টেম অ্যালার্ট")}
                      </p>
                      {[
                        {
                          id: "order",
                          label: t(
                            "Order Notifications",
                            "নতুন অর্ডার নোটিফিকেশন",
                          ),
                          desc: t(
                            "Instantly notified when a customer places an order.",
                            "অর্ডার প্লেস করার সাথে সাথে নোটিফিকেশন পান।",
                          ),
                          icon: Store,
                        },
                        {
                          id: "message",
                          label: t("Message Alerts", "ম্যাসেজ অ্যালার্ট"),
                          desc: t(
                            "Get notified when you receive a customer inquiry.",
                            "কাস্টমার ইনকোয়ারি বা ম্যাসেজ আসলে নোটিফিকেশন পান।",
                          ),
                          icon: MessageSquare,
                        },
                        {
                          id: "report",
                          label: t(
                            "Performance Reports",
                            "পারফরম্যান্স রিপোর্ট",
                          ),
                          desc: t(
                            "Daily automated summaries of your store performance.",
                            "আপনার স্টোরের পারফরম্যান্সের দৈনিক স্বয়ংক্রিয় সারাংশ।",
                          ),
                          icon: Zap,
                        },
                      ].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-bg3/30 rounded-2xl border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-bg2 flex items-center justify-center text-text3 border border-border/50 shadow-sm">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-xs text-text">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-text3 mt-0.5 max-w-xs">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setNotificationSettings({
                                ...notificationSettings,
                                [item.id]:
                                  !notificationSettings[
                                    item.id as keyof typeof notificationSettings
                                  ],
                              })
                            }
                            className={`w-10 h-5 rounded-full relative transition-all ${notificationSettings[item.id as keyof typeof notificationSettings] ? "bg-orange" : "bg-border"}`}
                          >
                            <motion.div
                              layout
                              className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm ${notificationSettings[item.id as keyof typeof notificationSettings] ? "right-1" : "left-1"}`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 space-y-2 border-t border-border mt-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-text3 mb-4">
                        {t("Global Channels", "গ্লোবাল চ্যানেল")}
                      </p>
                      {[
                        {
                          id: "email",
                          label: t("Email Alerts", "ইমেইল অ্যালার্ট"),
                          desc: t(
                            "Receive professional updates on your primary email address.",
                            "আপনার প্রাইমারি ইমেইলে প্রফেশনাল আপডেটগুলো পান।",
                          ),
                          icon: Globe,
                        },
                      ].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-bg3/30 rounded-2xl border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-bg2 flex items-center justify-center text-text3 border border-border/50 shadow-sm">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-xs text-text">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-text3 mt-0.5 max-w-xs">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setNotificationSettings({
                                ...notificationSettings,
                                [item.id]:
                                  !notificationSettings[
                                    item.id as keyof typeof notificationSettings
                                  ],
                              })
                            }
                            className={`w-10 h-5 rounded-full relative transition-all ${notificationSettings[item.id as keyof typeof notificationSettings] ? "bg-orange" : "bg-border"}`}
                          >
                            <motion.div
                              layout
                              className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm ${notificationSettings[item.id as keyof typeof notificationSettings] ? "right-1" : "left-1"}`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "connected" && (
                <div className="max-w-3xl space-y-6">
                  {/* Section 1: Connected Accounts */}
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-border bg-bg3">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4 text-orange" />
                        {t("Connected Accounts", "কানেক্টেড অ্যাকাউন্ট")}
                      </h3>
                    </div>
                    <div className="p-5 space-y-5">
                      {integrationSkipped ? (
                         <div className="text-center py-6 flex flex-col items-center">
                           <div className="w-16 h-16 bg-[#1877F2]/10 rounded-full flex items-center justify-center mb-4">
                             <Facebook className="w-8 h-8 text-[#1877F2]" />
                           </div>
                           <p className="text-sm font-bold mb-2">Facebook Not Connected</p>
                           <p className="text-xs text-text3 mb-4">Connect your Facebook Page to track performance.</p>
                           <button onClick={() => { onStartConnectFb && onStartConnectFb(); }} className="btn-primary bg-[#1877F2] shadow-[#1877F2]/20 !px-6 !py-2.5">
                             <Facebook className="w-4 h-4" fill="currentColor" />
                             {t("Connect Facebook", "ফেসবুক কানেক্ট করুন")}
                           </button>
                         </div>
                      ) : (
                      <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <Facebook className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-text">
                              {t("Facebook Page", "ফেসবুক পেজ")}
                            </p>
                            <p className="text-[10px] text-text3">
                              {t("Fashion Hub BD", "ফ্যাশন হাব বিডি")}
                            </p>
                          </div>
                        </div>
                        <span className="bg-green-500/10 text-green-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-green-500/20">
                          {t("Connected", "কানেক্টেড")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-orange" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-text">
                              {t("Meta Ads Account", "মেটা অ্যাডস অ্যাকাউন্ট")}
                            </p>
                            <p className="text-[10px] text-text3">
                              {t("Fashion Hub Ads", "ফ্যাশন হাব অ্যাডস")} (
                              {toBanglaNumber(12938475)})
                            </p>
                          </div>
                        </div>
                        <span className="bg-green-500/10 text-green-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-green-500/20">
                          {t("Connected", "কানেক্টেড")}
                        </span>
                      </div>
                      </>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Telegram Daily Report */}
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-border bg-bg3">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange" />
                        {t("Telegram Daily Report", "টেলিগ্রাম ডেইলি রিপোর্ট")}
                      </h3>
                    </div>
                    <div className="p-5">
                      {settings.telegram_chat_id ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan/10 rounded-lg flex items-center justify-center">
                              <MessageSquare className="w-5 h-5 text-cyan" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-text">
                                {t("Telegram Connected", "টেলিগ্রাম কানেক্টেড")}
                              </p>
                              <p className="text-[10px] text-text3">
                                {t("ID", "আইডি")}:{" "}
                                {toBanglaNumber(settings.telegram_chat_id)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleUpdateSettings({ telegram_chat_id: null })
                            }
                            className="text-red text-[10px] font-bold hover:underline"
                          >
                            {t("Disconnect", "ডিসকানেক্ট")}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-text2 text-xs mb-3">
                            {t(
                              "Get a daily summary of your sales directly on Telegram.",
                              "আপনার বিক্রয়ের একটি দৈনিক সারাংশ সরাসরি টেলিগ্রামে পান।",
                            )}
                          </p>
                          <button
                            onClick={() =>
                              handleUpdateSettings({
                                telegram_chat_id: "mock-id-123",
                              })
                            }
                            className="btn-primary bg-cyan shadow-cyan/20 !px-5 !py-2"
                          >
                            {t("Connect Telegram", "টেলিগ্রাম কানেক্ট করুন")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "billing" && (
                <div className="max-w-3xl space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => setSettingsTab("profile")}
                      className="p-2 hover:bg-bg3 rounded-xl text-text3 transition-all border border-transparent hover:border-border/50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-sm">
                      {t("Billing & Subscription", "বিলিং ও সাবস্কিপশন")}
                    </h3>
                  </div>

                  {/* Section 3: Subscription & Usage */}
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-bg3/50 backdrop-blur-sm flex items-center justify-between">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-orange" />
                        {t("Subscription Plan", "সাবস্ক্রিপশন প্ল্যান")}
                      </h3>
                      <p className="text-[10px] font-black uppercase text-orange bg-orange/10 px-3 py-1 rounded-full border border-orange/20">
                        {t("Monthly Billing", "মাসিক বিলিং")}
                      </p>
                    </div>
                    <div className="p-6 space-y-8">
                      <div className="grid sm:grid-cols-2 gap-6 p-5 bg-bg3/20 rounded-3xl border border-border/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-orange/10 transition-colors" />
                        <div className="relative">
                          <p className="text-[10px] text-text3 uppercase font-black tracking-widest mb-1.5 opacity-60">
                            {t("Your Current Tier", "আপনার বর্তমান প্ল্যান")}
                          </p>
                          <div className="flex items-center gap-3">
                            <h4 className="text-2xl font-black text-text tracking-tighter uppercase">
                              {settings.subscription_plan === "Starter" || settings.subscription_plan === "Free Trial" ? "ফ্রি ট্রায়াল" : 
                               settings.subscription_plan === "growth" ? "পেইড (গ্রোথ)" : 
                               settings.subscription_plan === "pro" ? "পেইড (প্রো)" : 
                               "ফ্রি ট্রায়াল"}
                            </h4>
                            <span className="bg-green-500/10 text-green-500 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-green-500/20 shadow-sm animate-pulse-slow">
                              {t("Active", "অ্যাক্টিভ")}
                            </span>
                          </div>
                          <p className="text-[10px] text-text3 mt-2 font-medium">
                            {t(
                              "Subscription renewing on",
                              "সাবস্ক্রিপশন রিনিউ হবে",
                            )}{" "}
                            {toBanglaNumber(
                              new Date(
                                settings.trial_ends_at,
                              ).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
                            )}
                          </p>
                        </div>
                        <div className="relative flex flex-col justify-end items-start sm:items-end">
                          <p className="text-[10px] text-text3 uppercase font-black tracking-widest mb-1.5 opacity-60">
                            {t("Member Since", "মেম্বারশিপ শুরু")}
                          </p>
                          <p className="font-bold text-sm text-text">
                            {user?.created_at ? toBanglaNumber(new Date(user.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })) : toBanglaNumber(new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }))}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-text3 uppercase tracking-widest opacity-60">
                              {t("Usage Limits", "ব্যবহারের সীমা")}
                            </p>
                            <p className="text-xs font-bold text-text mt-1">
                              {t("Order Volume", "অর্ডার ভলিউম")}{" "}
                              <span className="text-text3 font-normal">
                                ({t("Monthly", "মাসিক")})
                              </span>
                            </p>
                          </div>
                          <p className="text-sm font-black text-text">
                            {toBanglaNumber(
                              settings?.orders_this_month_count || 0,
                            )}{" "}
                            <span className="text-text3 text-[11px] font-bold">
                              / {settings.subscription_plan === "pro" ? "আনলিমিটেড" : toBanglaNumber(settings.subscription_plan === "growth" ? 300 : 100)}
                            </span>
                          </p>
                        </div>
                        <div className="h-2.5 bg-bg3 rounded-full overflow-hidden border border-border/50 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min((settings.orders_this_month_count / (settings.subscription_plan === "pro" ? Infinity : settings.subscription_plan === "growth" ? 300 : 100)) * 100, 100)}%`,
                            }}
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,87,34,0.3)] ${
                              settings.orders_this_month_count > (settings.subscription_plan === "pro" ? Infinity : settings.subscription_plan === "growth" ? 270 : 90)
                                ? "bg-red"
                                : settings.orders_this_month_count > (settings.subscription_plan === "pro" ? Infinity : settings.subscription_plan === "growth" ? 210 : 70)
                                  ? "bg-orange"
                                  : "bg-orange shadow-[0_0_15px_rgba(255,87,34,0.4)]"
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-text3 font-medium flex items-center gap-1.5 italic">
                          <Zap className="w-3 h-3 text-orange" />
                          {t(
                            "Upgrade your plan to unlock higher order volume and advanced automation.",
                            "অধিক অর্ডার ভলিউম এবং অ্যাডভান্সড অটোমেশন আনলক করতে প্ল্যান আপগ্রেড করুন।",
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-border">
                        <button
                          onClick={() => setActiveTab("subscription")}
                          className="btn-secondary w-full sm:flex-1 py-3.5 !text-[10px]"
                        >
                          {t("Manage Subscription", "সাবস্ক্রিপশন ম্যানেজ")}
                        </button>
                        <button
                          onClick={() => setActiveTab("subscription")}
                          className="btn-primary w-full sm:flex-1 py-3.5 shadow-orange/20 !text-[10px]"
                        >
                          {t("Upgrade Current Plan", "প্ল্যান আপগ্রেড করুন")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-border bg-bg3">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-orange" />
                        {t(
                          "Invoices & Billing History",
                          "ইনভয়েস ও বিলিং হিস্ট্রি",
                        )}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-bg2/50 border-b border-border text-[10px] uppercase tracking-widest text-text3">
                            <th className="p-5 font-black">
                              {t("Transaction Date", "তারিখ")}
                            </th>
                            <th className="p-5 font-black">
                              {t("Total Amount", "পরিমাণ")}
                            </th>
                            <th className="p-5 font-black">
                              {t("Payment Status", "স্ট্যাটাস")}
                            </th>
                            <th className="p-5 font-black text-right">
                              {t("Invoice PDF", "ইনভয়েস")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {[
                            {
                              date: t("Apr 15, 2026", "১৫ এপ্রি, ২০২৬"),
                              amount: "৳১,৫০০",
                              status: "Paid",
                              method: "bKash",
                            },
                            {
                              date: t("Mar 15, 2026", "১৫ মার্চ, ২০২৬"),
                              amount: "৳১,৫০০",
                              status: "Paid",
                              method: "Nagad",
                            },
                            {
                              date: t("Feb 15, 2026", "১৫ ফেব, ২০২৬"),
                              amount: "৳১,৫০০",
                              status: "Paid",
                              method: "bKash",
                            },
                          ].map((invoice, i) => (
                            <tr
                              key={i}
                              className="hover:bg-bg3/30 transition-colors group"
                            >
                              <td className="p-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-bg3 flex items-center justify-center text-text3 border border-border/50">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  <p className="text-xs font-bold text-text">
                                    {invoice.date}
                                  </p>
                                </div>
                              </td>
                              <td className="p-5 text-sm font-black text-orange">
                                {toBanglaNumber(invoice.amount)}
                              </td>
                              <td className="p-5">
                                <span className="bg-green-500/10 text-green-500 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-green-500/20">
                                  {t(invoice.status, "পেইড")}
                                </span>
                              </td>
                              <td className="p-5 text-right">
                                <a
                                  href="data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoKMiAwIG9iaiAKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCgozIDAgb2JqIAo8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDU5NS4yOCA4NDEuODldCi9Db250ZW50cyA0IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA1IDAgUgo+Pgo+Pgo+PgplbmRvYmoKCjQgMCBvYmogCjw8Ci9MZW5ndGggNjcKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgoyMDAgNzAwIFRkCihJbnZvaWNlIC0gSW5ib3hUcmFjayBCRCkgVGoKRVQKCgplbmRzdHJlYW0KZW5kb2JqCgo1IDAgb2JqIAo8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE3IDAwMDAwIG4gCjAwMDAwMDAyMjUgMDAwMDAgbiAKMDAwMDAwMDM0MiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQyOQolJUVPRgo="
                                  download={`Invoice_${invoice.date.replace(/, /g, "_").replace(/ /g, "_")}.pdf`}
                                  className="text-[10px] font-black uppercase text-text3 hover:text-orange flex items-center gap-2 ml-auto group-hover:-translate-x-1 transition-all"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  {t("Download", "ডাউনলোড")}
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === "support" && (
                <div className="max-w-4xl space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => setSettingsTab("profile")}
                      className="p-2 hover:bg-bg3 rounded-xl text-text3 transition-all border border-transparent hover:border-border/50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-xl font-black text-text">
                      {t("Support Center", "সাপোর্ট সেন্টার")}
                    </h2>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                      {/* Your Reports Summary */}
                      <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-text">
                              {toBanglaNumber(submittedReports.length)}
                            </span>
                            <span className="text-[10px] text-text3 font-black uppercase tracking-widest">
                              {t("Sent Reports", "প্রেরিত রিপোর্ট")}
                            </span>
                          </div>
                          <div className="w-px h-10 bg-border" />
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-green-500">
                              {toBanglaNumber(
                                submittedReports.filter(
                                  (r) => r.status === "Solved",
                                ).length,
                              )}
                            </span>
                            <span className="text-[10px] text-text3 font-black uppercase tracking-widest">
                              {t("System Solved", "সিস্টেম সমাধান")}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 max-h-[160px] overflow-y-auto w-full hide-scrollbar space-y-2">
                          <h5 className="text-[9px] font-black uppercase tracking-widest text-text3 mb-2">
                            {t(
                              "Recent Reports History",
                              "সাম্প্রতিক রিপোর্টের ইতিহাস",
                            )}
                          </h5>
                          {submittedReports.map((report) => (
                            <div
                              key={report.id}
                              className="flex items-center justify-between p-3 bg-bg3/30 border border-border rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${report.status === "Solved" ? "bg-green-500/10 text-green-500" : "bg-orange/10 text-orange"}`}
                                >
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-text truncate max-w-[120px]">
                                    {t(report.type, report.type)}
                                  </p>
                                  <p className="text-[8px] text-text3">
                                    {toBanglaNumber(
                                      new Date(
                                        report.date,
                                      ).toLocaleDateString(),
                                    )}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${report.status === "Solved" ? "bg-green-500 text-white" : "bg-orange text-white"}`}
                              >
                                {t(
                                  report.status,
                                  report.status === "Solved"
                                    ? "সমাধান"
                                    : "প্রক্রিয়াধীন",
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Report Problem Section */}
                      <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                        <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 mb-8 text-text border-b border-border pb-6">
                          <AlertCircle className="w-4 h-4 text-orange" />
                          {t("Report a Bug", "বাগ রিপোর্ট করুন")}
                        </h4>

                        <div className="flex flex-col gap-6">
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-text3 uppercase tracking-widest ml-1">
                                {t("Problem Category", "সমস্যার বিষয়")}
                              </label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {[
                                  "Technical Bug",
                                  "Billing",
                                  "Feature",
                                  "Account",
                                ].map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => setSupportIssueType(type)}
                                    className={`px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                      supportIssueType === type
                                        ? "bg-orange text-white border-orange shadow-md shadow-orange/20"
                                        : "bg-bg3 border-border text-text3 hover:border-orange/20"
                                    }`}
                                  >
                                    {t(
                                      type,
                                      type === "Technical Bug"
                                        ? "টেকনিক্যাল"
                                        : type === "Billing"
                                          ? "বিলিং"
                                          : type === "Feature"
                                            ? "ফিচার"
                                            : "অ্যাকাউন্ট",
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-text3 uppercase tracking-widest ml-1">
                                {t("Describe your issue", "বিস্তারিত লিখুন")}
                              </label>
                              <textarea
                                rows={5}
                                value={supportDesc}
                                onChange={(e) => setSupportDesc(e.target.value)}
                                placeholder={t(
                                  "Tell us what happened...",
                                  "কী হয়েছে আমাদের বিস্তারিত জানান...",
                                )}
                                className="w-full bg-bg3 border border-border rounded-2xl p-5 text-xs outline-none focus:border-orange transition-all shadow-inner resize-none min-h-[120px]"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (!supportDesc.trim()) {
                                toast.error(
                                  t(
                                    "Please describe the issue",
                                    "অনুগ্রহ করে বিষয়টি বিস্তারিত লিখুন",
                                  ),
                                );
                                return;
                              }

                              // Show success popup
                              toast.custom(
                                (t_toast) => (
                                  <div
                                    className={`${t_toast.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-card shadow-2xl rounded-[2.5rem] pointer-events-auto flex flex-col items-center p-8 border border-border`}
                                  >
                                    <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                                      <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-black text-text mb-2 text-center">
                                      {t(
                                        "Bug Report Submitted!",
                                        "বাগ রিপোর্ট জমা হয়েছে!",
                                      )}
                                    </h4>
                                    <p className="text-xs text-text3 text-center mb-8 leading-relaxed">
                                      {t(
                                        "Your report is successfully submitted, our team will get back to you soon with a solution.",
                                        "আপনার রিপোর্টটি সফলভাবে জমা হয়েছে, আমাদের টিম শীঘ্রই সমাধান নিয়ে আপনার সাথে যোগাযোগ করবে।",
                                      )}
                                    </p>
                                    <button
                                      onClick={() => toast.dismiss(t_toast.id)}
                                      className="btn-primary w-full shadow-orange/20"
                                    >
                                      {t("Great, Thanks!", "ধন্যবাদ!")}
                                    </button>
                                  </div>
                                ),
                                { duration: 5000 },
                              );

                              setSupportDesc("");
                              setSubmittedReports((prev) => [
                                {
                                  id: Date.now().toString(),
                                  date: new Date().toISOString().split("T")[0],
                                  type: supportIssueType,
                                  status: "Solved",
                                },
                                ...prev,
                              ]);
                            }}
                            className="w-full md:w-auto px-8 bg-orange text-white py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-orange/20 hover:shadow-orange/30 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-orange-700 mx-auto"
                          >
                            <Send className="w-4 h-4" />
                            {t("Submit Bug Report", "বাগ রিপোর্ট পাঠান")}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-text mb-8 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            {t("Self-Help Resources", "সেলফ-হেল্প রিসোর্স")}
                          </h4>
                          <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 bg-bg3/30 hover:bg-bg3 border border-border rounded-2xl transition-all group">
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center text-red group-hover:scale-110 transition-transform">
                                  <PlayCircle className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="block text-[11px] font-black text-text uppercase tracking-tight">
                                    {t("Watch Tutorials", "টিউটোরিয়াল দেখুন")}
                                  </span>
                                  <span className="text-[9px] text-text3 font-medium">
                                    {t(
                                      "How-to videos gallery",
                                      "কাজের ভিডিও গ্যালারি",
                                    )}
                                  </span>
                                </div>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-text3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          )}

          {/* Campaign Details Overlay */}
          <AnimatePresence>
            {selectedCampaign && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedCampaign(null)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 transition-all duration-500"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-4 md:inset-10 lg:inset-20 bg-card border border-border z-50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
                >
                  <div className="p-8 border-b border-border flex items-center justify-between bg-bg2">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight">
                        {selectedCampaign.name}
                      </h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            selectedCampaign.status === "Active"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-text3/10 text-text3 border-border"
                          }`}
                        >
                          {t(
                            selectedCampaign.status,
                            selectedCampaign.status === "Active"
                              ? "সক্রিয়"
                              : "নিষ্ক্রিয়",
                          )}
                        </span>
                        <span className="text-xs text-text3 font-mono">
                          ID: {selectedCampaign.id}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCampaign(null)}
                      className="p-3 hover:bg-bg3 rounded-2xl transition-all shadow-inner border border-transparent hover:border-border btn-secondary !p-3"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-bg2/50 scrollbar-hide">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm group hover:border-orange transition-colors">
                        <p className="text-[10px] text-text3 font-black uppercase tracking-widest mb-2 group-hover:text-orange transition-colors">
                          {t("Spent", "খরচ")}
                        </p>
                        <p className="text-2xl font-black">
                          ৳
                          {toBanglaNumber(
                            selectedCampaign.spend.toLocaleString(),
                          )}
                        </p>
                      </div>
                      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm group hover:border-cyan transition-colors">
                        <p className="text-[10px] text-cyan font-black uppercase tracking-widest mb-2">
                          {t("Leads/Conv", "লিড/কনভার্সন")}
                        </p>
                        <p className="text-2xl font-black text-cyan">
                          {toBanglaNumber(selectedCampaign.leads)}
                        </p>
                      </div>
                      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm group hover:border-green-500 transition-colors">
                        <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-2">
                          {t("Pur. ROAS", "ROAS")}
                        </p>
                        <p className="text-2xl font-black text-green-500">
                          {toBanglaNumber(selectedCampaign.roas)}x
                        </p>
                      </div>
                      <div className="bg-card p-6 rounded-3xl border border-border shadow-sm group hover:border-orange transition-colors">
                        <p className="text-[10px] text-orange font-black uppercase tracking-widest mb-2">
                          {t("Cost Per Lead", "প্রতি লিড খরচ")}
                        </p>
                        <p className="text-2xl font-black">
                          ৳{toBanglaNumber(selectedCampaign.cpl)}
                        </p>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                          <div className="p-5 border-b border-border bg-bg3 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-orange" />{" "}
                            {t("Ad Set Performance", "অ্যাড সেট পারফরম্যান্স")}
                          </div>
                          <div className="divide-y divide-border/50">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="p-5 hover:bg-bg3 transition-colors flex items-center justify-between group"
                              >
                                <div>
                                  <p className="text-xs font-bold leading-tight group-hover:text-orange transition-colors">
                                    Targeting_Broad_BD_Set_{i}
                                  </p>
                                  <p className="text-[9px] text-text3 font-medium uppercase mt-1">
                                    Status: Active
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-green-500">
                                    {toBanglaNumber(5.2 - i * 0.5)}x ROAS
                                  </p>
                                  <p className="text-[10px] text-text3">
                                    ৳
                                    {toBanglaNumber(
                                      Math.round(selectedCampaign.spend / 3),
                                    )}{" "}
                                    {t("spent", "খরচ")}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                          <div className="p-5 border-b border-border bg-bg3 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan" />{" "}
                            {t("Audience Insights", "অডিয়েন্স ইনসাইটস")}
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase text-text3 mb-1">
                                <span>{t("Age 18-24", "১৮-২৪ বছর")}</span>
                                <span>45%</span>
                              </div>
                              <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: "45%" }}
                                  className="h-full bg-orange rounded-full"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase text-text3 mb-1">
                                <span>{t("Age 25-34", "২৫-৩৪ বছর")}</span>
                                <span>35%</span>
                              </div>
                              <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: "35%" }}
                                  className="h-full bg-orange rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase text-text3 mb-1">
                                <span>{t("Age 35-44", "৩৫-৪৪ বছর")}</span>
                                <span>20%</span>
                              </div>
                              <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: "20%" }}
                                  className="h-full bg-orange rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                          <div className="p-5 border-b border-border bg-bg3 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-cyan" />{" "}
                            {t("Creative Analysis", "ক্রিয়েটিভ এনালাইসিস")}
                          </div>
                          <div className="p-6 grid grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="bg-bg2 rounded-2xl border border-border overflow-hidden hover:border-orange transition-all group"
                              >
                                <div className="aspect-[4/5] bg-bg3 flex items-center justify-center relative">
                                  <Play className="w-10 h-10 text-white/30 group-hover:scale-110 transition-transform" />
                                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-tighter border border-white/10">
                                    Video Ad
                                  </div>
                                </div>
                                <div className="p-4">
                                  <p className="text-[11px] font-black group-hover:text-orange transition-colors truncate">
                                    Creative_Static_V{i}_Summer.jpg
                                  </p>
                                  <div className="flex justify-between mt-3 items-center">
                                    <div className="text-center bg-bg3 px-2 py-1 rounded-lg border border-border/50">
                                      <span className="text-[9px] text-text3 uppercase block tracking-tighter">
                                        CTR
                                      </span>
                                      <span className="text-xs font-black">
                                        {toBanglaNumber("2.4")}%
                                      </span>
                                    </div>
                                    <div className="text-center bg-green-500/5 px-2 py-1 rounded-lg border border-green-500/20">
                                      <span className="text-[9px] text-green-500 uppercase block tracking-tighter">
                                        ROAS
                                      </span>
                                      <span className="text-xs font-black text-green-500">
                                        {toBanglaNumber("4.8")}x
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Follow-up Panel Overlay */}
          <AnimatePresence>
            {showFollowUpPanel && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFollowUpPanel(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-[101] shadow-2xl flex flex-col"
                >
                  <div className="p-6 border-b border-border flex items-center justify-between bg-bg2 relative">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan/10 rounded-xl flex items-center justify-center text-cyan shadow-inner">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight">
                          {followUpMode === "view"
                            ? t("Follow-up Details", "ফলো-আপের বিস্তারিত")
                            : t("Schedule Follow-up", "ফলো-আপ শিডিউল")}
                        </h3>
                        <p className="text-[10px] text-text3 font-bold uppercase tracking-widest mt-0.5">
                          {showFollowUpPanel.fb_customer_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFollowUpPanel(null)}
                      className="p-1.5 hover:bg-bg3 rounded-full transition-all text-text3 hover:text-red bg-bg3/20 btn-secondary !p-1.5 !rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
                    <div className="bg-orange/5 border border-orange/10 p-5 rounded-2xl">
                      <p className="text-sm font-bold text-text mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-orange" />{" "}
                        {followUpMode === "view"
                          ? t("Follow-up Review", "ফলো-আপ রিভিউ")
                          : t("New Schedule", "নতুন শিডিউল")}
                      </p>
                      <p className="text-xs text-text3 leading-relaxed">
                        {followUpMode === "view"
                          ? t(
                              "This follow-up was scheduled after the customer failed to complete an order.",
                              "অর্ডার সম্পন্ন না হওয়ায় এই কাস্টমারের জন্য ফলো-আপ শিডিউল করা হয়েছে।",
                            )
                          : t(
                              "Schedule a reminder message to re-engage this customer and close the sale.",
                              "কাস্টমারের সাথে পুনরায় যোগাযোগ করতে এবং অর্ডার নিশ্চিত করতে রিমাইন্ডার সেট করুন।",
                            )}
                      </p>
                    </div>

                    {followUpMode === "view" ? (
                      <div className="space-y-6">
                        <div className="bg-bg3/40 border border-border rounded-2xl p-5 space-y-5 shadow-inner">
                          <div className="flex justify-between items-center pb-3 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-text3" />
                              <span className="text-[10px] font-black uppercase text-text3 tracking-wider">
                                {t("Scheduled Delay", "শিডিউল করা সময়")}
                              </span>
                            </div>
                            <span className="text-xs font-black text-orange">
                              {t(
                                followUpDelay,
                                followUpDelay === "3 hours"
                                  ? "৩ ঘণ্টা পরে"
                                  : followUpDelay === "6 hours"
                                    ? "৬ ঘণ্টা পরে"
                                    : followUpDelay === "3 days"
                                      ? "৩ দিন পরে"
                                      : "৭ দিন পরে",
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3.5 h-3.5 text-text3" />
                              <span className="text-[10px] font-black uppercase text-text3 tracking-wider">
                                {t("Message Type", "মেসেজের ধরন")}
                              </span>
                            </div>
                            <span className="text-xs font-black text-cyan">
                              {t(
                                followUpType,
                                followUpType === "Reminder"
                                  ? "রিমাইন্ডার"
                                  : followUpType === "Discount Offer"
                                    ? "ডিসকাউন্ট অফার"
                                    : "স্টক আপডেট",
                              )}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-text3" />
                              <span className="text-[10px] font-black uppercase text-text3 tracking-wider">
                                {t("Message Content", "মেসেজের বিষয়বস্তু")}
                              </span>
                            </div>
                            <p className="text-xs text-text2 italic bg-card p-4 rounded-xl border border-border shadow-sm leading-relaxed">
                              "{followUpMessage}"
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setFollowUpMode("edit")}
                          className="btn-secondary w-full py-4 !text-xs"
                        >
                          <Settings className="w-4 h-4" />{" "}
                          {t("Edit Follow-Up Details", "ফলো-আপ এডিট করুন")}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-text3 ml-1 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />{" "}
                            {t("Select Delay", "সময় নির্বাচন করুন")}
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {["3 hours", "6 hours", "3 days", "7 days"].map(
                              (delay) => (
                                <button
                                  key={delay}
                                  onClick={() => setFollowUpDelay(delay)}
                                  className={`py-3.5 rounded-xl border font-black text-xs transition-all ${
                                    followUpDelay === delay
                                      ? "bg-orange text-white border-orange shadow-lg shadow-orange/30"
                                      : "bg-bg3 border-border text-text2 hover:border-orange"
                                  }`}
                                >
                                  {t(
                                    delay,
                                    delay === "3 hours"
                                      ? "৩ ঘণ্টা পরে"
                                        : delay === "3 days"
                                          ? "৩ দিন পরে"
                                          : "৭ দিন পরে",
                                  )}
                                </button>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-text3 ml-1 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" />{" "}
                            {t("Message Type", "মেসেজের ধরন")}
                          </label>
                          <div className="space-y-3">
                            {Object.keys(followUpMessages).map((type) => (
                              <div key={type} className="space-y-2">
                                <button
                                  onClick={() => {
                                    setFollowUpType(type);
                                    setIsEditingFollowUp(false);
                                  }}
                                  className={`w-full py-4 px-4 rounded-2xl border font-black text-xs transition-all text-left flex items-center justify-between ${
                                    followUpType === type
                                      ? "bg-orange/5 border-orange text-orange"
                                      : "bg-bg3 border-border text-text2 hover:border-orange"
                                  }`}
                                >
                                  {t(
                                    type,
                                    type === "Reminder"
                                      ? "রিমাইন্ডার"
                                      : type === "Discount Offer"
                                        ? "ডিসকাউন্ট অফার"
                                        : "স্টক আপডেট",
                                  )}
                                  {followUpType === type ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-text3" />
                                  )}
                                </button>

                                {followUpType === type && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="bg-bg3/50 border border-border/50 rounded-2xl p-4 space-y-3 shadow-inner"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-black uppercase text-text3 tracking-widest">
                                        {t("Preview Message", "মেসেজ প্রিভিউ")}
                                      </span>
                                      <button
                                        onClick={() =>
                                          setIsEditingFollowUp(
                                            !isEditingFollowUp,
                                          )
                                        }
                                        className="text-[10px] font-black text-orange hover:underline flex items-center gap-1"
                                      >
                                        {isEditingFollowUp
                                          ? t("Save", "সেভ")
                                          : t("Edit", "এডিট")}
                                      </button>
                                    </div>
                                    {isEditingFollowUp ? (
                                      <textarea
                                        className="w-full bg-card border border-border rounded-xl p-4 text-xs font-bold outline-none focus:border-orange min-h-[120px] resize-none leading-relaxed shadow-sm"
                                        value={followUpMessage}
                                        onChange={(e) =>
                                          setFollowUpMessage(e.target.value)
                                        }
                                      />
                                    ) : (
                                      <p className="text-xs text-text2 italic leading-relaxed">
                                        "{followUpMessage}"
                                      </p>
                                    )}
                                  </motion.div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-6 border-t border-border bg-bg2 space-y-3">
                    {followUpMode === "edit" && (
                      <button
                        onClick={() => {
                          setConversations(
                            conversations.map((c) => {
                              if (c.id === showFollowUpPanel.id) {
                                if (c.status === "Not Ordered") {
                                  return {
                                    ...c,
                                    followUpScheduled: true,
                                    followUpType,
                                    followUpDelay,
                                    followUpMessage,
                                  };
                                }
                                return {
                                  ...c,
                                  status: "Follow-Up Pending",
                                  followUpType,
                                  followUpDelay,
                                  followUpMessage,
                                };
                              }
                              return c;
                            }),
                          );
                          setFollowUpDoneCount((prev) => prev + 1);
                          setShowFollowUpPanel(null);
                        }}
                        className="btn-primary bg-cyan shadow-cyan/30 w-full"
                      >
                        <Clock className="w-5 h-5" />{" "}
                        {showFollowUpPanel.mode === "view"
                          ? t("Confirm Updates", "আপডেট কনফার্ম করুন")
                          : t("Schedule Follow-up", "ফলো-আপ শিডিউল")}
                      </button>
                    )}
                      <button
                        onClick={() => {
                          setShowFollowUpPanel(null);
                        }}
                        className="btn-secondary w-full py-4 shadow-sm"
                      >
                        {followUpMode === "view"
                          ? t("Close Panel", "প্যানেল বন্ধ করুন")
                          : t("Discard Schedule", "শিডিউল বাতিল")}
                      </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          {activeTab === "subscription" && (
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setActiveTab("settings")}
                  className="btn-secondary !p-2 !rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">
                  {t("Back to Dashboard", "ড্যাশবোর্ড ফিরে যান")}
                </h2>
              </div>

              <div className="text-center mb-12">
                <h2 className="text-3xl font-black tracking-tight mb-4">
                  {isTrialExpired
                    ? t(
                        "Your free trial has ended.",
                        "আপনার ফ্রি ট্রায়াল শেষ হয়েছে।",
                      )
                    : t("Choose your plan", "আপনার জন্য সঠিক প্ল্যান বেছে নিন")}
                </h2>
                <p className="text-text3 text-sm max-w-lg mx-auto">
                  {t(
                    "Select a plan to continue using Trackoora BD and grow your business today.",
                    "Trackoora BD ব্যবহার চালিয়ে যেতে এবং আপনার বিজনেস দ্রুত বৃদ্ধি করতে প্ল্যান বেছে নিন।",
                  )}
                </p>
              </div>

              {paymentStatus === "success" ? (
                <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-xl">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-green-500 mb-4">
                    {t("Payment Successful!", "পেমেন্ট সফল হয়েছে!")}
                  </h3>
                  <p className="text-text2 mb-8">
                    {t(
                      "Your Starter Plan is now active. Enjoy all the professional features.",
                      "আপনার স্টার্টার প্ল্যান এখন সচল। সব প্রফেশনাল ফিচার ব্যবহার শুরু করুন।",
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setPaymentStatus("idle");
                      setIsTrialExpired(false);
                      setActiveTab("overview");
                    }}
                    className="btn-primary px-8 py-3.5"
                  >
                    {t("Go to Dashboard", "ড্যাশবোর্ডে যান")}
                  </button>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  {!showPaymentForm ? (
                    <div
                      onClick={() => setSelectedPlan("starter")}
                      className="relative bg-card rounded-[2.5rem] p-10 cursor-pointer transition-all border-2 border-orange shadow-[0_20px_50px_rgba(249,115,22,0.15)] overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-orange/10 transition-colors" />

                      <div className="absolute top-6 right-6 w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center shadow-lg shadow-orange/20">
                        <Check className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-orange" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-tight">
                            {t("Starter Plan", "স্টার্টার প্ল্যান")}
                          </h3>
                          <p className="text-[10px] text-text3 font-bold uppercase tracking-widest">
                            {t("Most Popular", "সবার পছন্দ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 mb-8 border-b border-border pb-6">
                        <span className="text-5xl font-black font-syne text-orange tracking-tighter">
                          ৳{toBanglaNumber(499)}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-text3 text-sm font-bold">
                            / {t("month", "মাস")}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-5 text-sm mb-10">
                        {[
                          "Meta Algorithm Signal (Server-side)",
                          "Ad Attribution Dashboard",
                          "Conversation Card Dashboard",
                          "Auto Order Confirmation Message",
                          "Order Status Tracker",
                          "Smart CRM Feature",
                          "Telegram Daily Report",
                          "সম্পূর্ণ বাংলা Interface",
                          "১টি Facebook Page · মাসে ১০০ অর্ডার",
                        ].map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-4 text-text font-medium text-xs"
                          >
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-green-500" />
                            </div>
                            {t(feature, feature)}
                          </li>
                        ))}
                      </ul>

                      <div className="p-4 bg-orange/5 border border-orange/10 rounded-2xl mb-8">
                        <p className="text-[10px] text-orange font-bold text-center leading-relaxed">
                          {t(
                            "Ready to scale? This plan provides everything you need to manage up to ৳১০০,০০০/month in revenue.",
                            "আপনার বিজনেস সফলভাবে এগিয়ে নিতে এই প্ল্যানটি সব ধরনের ফিচার প্রদান করে।"
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="btn-primary w-full py-5 !text-[12px] shadow-orange/20 hover:scale-[1.02]"
                      >
                        {t("Get Started Now", "এখনই শুরু করুন")}
                      </button>

                      <p className="text-[9px] text-text3 font-bold uppercase tracking-widest text-center mt-6 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />{" "}
                        {t(
                          "Secure Payment via SSLCommerz",
                          "SSLCommerz-এর মাধ্যমে নিরাপদ পেমেন্ট"
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-card rounded-[2.5rem] p-8 sm:p-10 border-2 border-border shadow-xl">
                      <div className="flex items-center mb-8 pb-6 border-b border-border">
                        <button 
                          onClick={() => setShowPaymentForm(false)}
                          className="btn-secondary !w-10 !h-10 !rounded-full !p-0"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="ml-4">
                          <h3 className="text-xl font-bold">{t("Payment Setup", "পেমেন্ট সেটআপ")}</h3>
                          <p className="text-xs text-text3">{t("Starter Plan", "স্টার্টার প্ল্যান")} - ৳{toBanglaNumber(499)}</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold mb-3">{t("Select Payment Method", "পেমেন্ট মাধ্যম বেছে নিন")}</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setSubPaymentMethod("bkash")}
                              className={`py-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 ${
                                subPaymentMethod === "bkash" 
                                  ? "border-pink-500 bg-pink-500/5 text-pink-600" 
                                  : "border-border hover:border-pink-500/30 text-text"
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-black text-[10px]">bKash</div>
                              bKash
                            </button>
                            <button
                              onClick={() => setSubPaymentMethod("nagad")}
                              className={`py-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 ${
                                subPaymentMethod === "nagad" 
                                  ? "border-orange border-opacity-80 bg-orange/5 text-orange" 
                                  : "border-border hover:border-orange/30 text-text"
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center font-black text-[10px]">Nagad</div>
                              Nagad
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold mb-2">{t("Mobile Number", "মোবাইল নাম্বার")}</label>
                          <input
                            type="tel"
                            placeholder="e.g., 01XXXXXXXXX"
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange transition-all"
                          />
                        </div>
                      </div>

                      <div className="mt-10">
                        <button
                          onClick={() => {
                            if (!paymentPhone) {
                              alert(t("Please enter your mobile number", "অনুগ্রহ করে আপনার mobile number দিন"));
                              return;
                            }
                            setPaymentStatus("processing");
                            // Placeholder for SSLCommerce redirection
                            setTimeout(() => {
                              setPaymentStatus("success");
                              setShowPaymentForm(false);
                            }, 2000);
                          }}
                          disabled={!paymentPhone || paymentStatus === ("processing" as any)}
                          className="btn-primary w-full py-4 !bg-zinc-900 shadow-zinc-900/20"
                        >
                          {paymentStatus === ("processing" as any) ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            t("Proceed to SSLCommerz", "SSLCommerz-এ পেমেন্ট করুন")
                          )}
                        </button>
                        <p className="text-[10px] text-text3 text-center mt-4">
                          {t("You will be redirected to SSLCommerz secure checkout", "আপনাকে SSLCommerz এর নিরাপদ চেকআউটে নিয়ে যাওয়া হবে")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Order Confirmation Panel Overlay - Restored Right Slide-over */}
          <AnimatePresence>
            {showOrderPanel && (
              <div className="fixed inset-0 z-[110] flex justify-end overflow-hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowOrderPanel(null)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] shadow-2xl"
                />
                <motion.div
                  initial={{ opacity: 0, x: "100%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-card border-l border-border z-[101] shadow-2xl flex flex-col"
                >
                  <div className="p-6 border-b border-border flex items-center justify-between bg-bg3/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-orange" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">
                          {t("Confirm Order", "অর্ডার কনফার্ম করুন")}
                        </h3>
                        <p className="text-text3 text-xs">
                          {showOrderPanel.fb_customer_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowOrderPanel(null)}
                      className="p-2 hover:bg-bg2 rounded-full text-text3 hover:text-text transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    <form
                      onSubmit={handleConfirmOrder}
                      className="space-y-8 pb-10"
                    >
                      {/* Section 1: Customer Details */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-orange uppercase tracking-widest flex items-center gap-2">
                          <User className="w-3.5 h-3.5" />{" "}
                          {t("Customer Information", "কাস্টমার ইনফরমেশন")}
                        </h4>
                        <div className="space-y-4 px-1">
                          <div>
                            <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                              {t("Source", "সোর্স")}
                            </label>
                            <div className="w-full bg-bg2/50 border border-border rounded-2xl py-3.5 px-5 text-xs text-text font-bold flex items-center gap-3 shadow-sm">
                              <Globe className="w-4 h-4 text-text3/50" />
                              <div className="flex items-center gap-2">
                                <span className="text-text3/70">
                                  {t("Ad ID:", "অ্যাড আইডি:")}
                                </span>
                                <span className="bg-bg3 px-2 py-0.5 rounded border border-border text-[10px] font-mono">
                                  {showOrderPanel.ad_id || "Direct"}
                                </span>
                                <span className="text-text2 ml-1">
                                  {showOrderPanel.ad_name ||
                                    t("Direct Message", "ডাইরেক্ট মেসেজ")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                              {t("Customer Name", "কাস্টমার নাম")}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={t(
                                "Enter customer name",
                                "কাস্টমার নাম লিখুন",
                              )}
                              className="w-full bg-bg2/50 border border-border rounded-2xl py-3.5 px-5 text-xs text-text focus:border-orange outline-none transition-all placeholder:text-text3/50 font-bold shadow-sm"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                              {t("Customer Phone", "কাস্টমার ফোন")}
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="01XXXXXXXXX"
                              className="w-full bg-bg2/50 border border-border rounded-2xl py-3.5 px-5 text-xs text-text focus:border-orange outline-none transition-all placeholder:text-text3/50 font-bold shadow-sm"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-text3 uppercase mb-1.5 ml-1">
                              {t("Shipping Address", "শিপিং অ্যাড্রেস")}
                            </label>
                            <textarea
                              rows={3}
                              required
                              placeholder={t(
                                "Enter full address...",
                                "পুরো ঠিকানা লিখুন...",
                              )}
                              className="w-full bg-bg2/50 border border-border rounded-2xl py-3.5 px-5 text-xs text-text focus:border-orange outline-none transition-all resize-none shadow-sm leading-relaxed font-bold"
                              value={deliveryAddress}
                              onChange={(e) =>
                                setDeliveryAddress(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Product Details (Multi-Product) */}
                      <div className="space-y-4 bg-orange/5 p-5 rounded-3xl border border-orange/10 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black text-orange uppercase tracking-widest flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />{" "}
                            {t("Product Details", "প্রোডাক্ট ডিটেইলস")}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              setOrderProducts([
                                ...orderProducts,
                                {
                                  id: Date.now(),
                                  name: "",
                                  price: "",
                                  quantity: 1,
                                },
                              ])
                            }
                            className="flex items-center gap-1.5 text-[10px] font-black bg-orange text-white px-4 py-2 rounded-xl hover:bg-orange/90 transition-all shadow-lg shadow-orange/20 border border-orange"
                          >
                            <Plus className="w-3 h-3" /> {t("Add", "যোগ করুন")}
                          </button>
                        </div>

                        <div className="space-y-3">
                          {orderProducts.map((prod, idx) => (
                            <div
                              key={prod.id}
                              className="bg-card border border-border/60 p-4 rounded-2xl shadow-sm relative group transition-all hover:border-orange/30"
                            >
                              <div className="grid grid-cols-1 gap-4">
                                <div className="relative">
                                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-orange/50 w-3.5 h-3.5" />
                                  <input
                                    type="text"
                                    required
                                    placeholder={t(
                                      "Product Name",
                                      "পণ্যের নাম",
                                    )}
                                    className="w-full bg-bg3/40 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-[11px] text-text focus:border-orange outline-none font-bold"
                                    value={prod.name}
                                    onChange={(e) => {
                                      const newProds = [...orderProducts];
                                      newProds[idx].name = e.target.value;
                                      setOrderProducts(newProds);
                                    }}
                                  />
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange/50 text-[10px] font-black">
                                      ৳
                                    </span>
                                    <input
                                      type="number"
                                      required
                                      placeholder={t("Price", "মূল্য")}
                                      className="w-full bg-bg3/40 border border-border/50 rounded-xl py-2.5 pl-8 pr-4 text-[11px] text-text focus:border-orange outline-none font-black"
                                      value={prod.price}
                                      onChange={(e) => {
                                        const newProds = [...orderProducts];
                                        newProds[idx].price = e.target.value;
                                        setOrderProducts(newProds);
                                      }}
                                    />
                                  </div>
                                  <div className="w-24 bg-bg3/40 border border-border/50 rounded-xl flex items-center overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newProds = [...orderProducts];
                                        newProds[idx].quantity = Math.max(
                                          1,
                                          newProds[idx].quantity - 1,
                                        );
                                        setOrderProducts(newProds);
                                      }}
                                      className="flex-1 py-2.5 text-text3 hover:bg-bg3 transition-colors font-black"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center text-[10px] font-black text-text">
                                      {prod.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newProds = [...orderProducts];
                                        newProds[idx].quantity =
                                          newProds[idx].quantity + 1;
                                        setOrderProducts(newProds);
                                      }}
                                      className="flex-1 py-2.5 text-text3 hover:bg-bg3 transition-colors font-black"
                                    >
                                      +
                                    </button>
                                  </div>
                                  {orderProducts.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOrderProducts(
                                          orderProducts.filter(
                                            (p) => p.id !== prod.id,
                                          ),
                                        )
                                      }
                                      className="p-2.5 bg-red/5 text-red hover:bg-red/10 rounded-xl transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-4 px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text3">
                              {t("Delivery Charge", "ডেলিভারি চার্জ")}
                            </label>
                            <div className="relative w-36">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange font-black text-[10px]">
                                ৳
                              </span>
                              <input
                                type="number"
                                required
                                placeholder={toBanglaNumber("0")}
                                className="w-full bg-bg3/60 border border-border rounded-xl py-2.5 pl-8 pr-4 text-[11px] text-text focus:border-orange outline-none transition-all font-black shadow-inner"
                                value={deliveryCharge}
                                onChange={(e) =>
                                  setDeliveryCharge(e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div className="bg-bg2/80 border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
                            <div>
                              <p className="text-[10px] font-black text-text3 uppercase tracking-widest mb-1">
                                {t("Payable Amount", "মোট প্রদেয়")}
                              </p>
                              <p className="text-[9px] text-text3/60 font-bold italic">
                                {t("Price + Delivery", "পণ্য + শিপিং খরচ")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black text-orange tracking-tighter">
                                ৳
                                {toBanglaNumber(
                                  (
                                    orderProducts.reduce(
                                      (acc, p) =>
                                        acc +
                                        (parseFloat(p.price) || 0) *
                                          (p.quantity || 1),
                                      0,
                                    ) + (parseFloat(deliveryCharge) || 0)
                                  ).toString(),
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Delivery Info */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-orange uppercase tracking-widest flex items-center gap-2 mb-4">
                          <Truck className="w-3.5 h-3.5" />{" "}
                          {t("Delivery Information", "ডেলিভারি ইনফরমেশন")}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-text3 uppercase mb-2 ml-1">
                              {t("Payment Method", "পেমেন্ট মেথড")}
                            </label>
                            <SelectionPopup
                              title={t(
                                "Select Payment Method",
                                "পেমেন্ট মেথড নির্বাচন করুন",
                              )}
                              options={[
                                {
                                  id: "cod",
                                  label: t(
                                    "Cash on Delivery",
                                    "ক্যাশ অন ডেলিভারি",
                                  ),
                                },
                                {
                                  id: "bkash",
                                  label: t("bKash Payment", "বিকাশ পেমেন্ট"),
                                },
                                {
                                  id: "nagad",
                                  label: t("Nagad Payment", "নগদ পেমেন্ট"),
                                },
                              ]}
                              selectedId={paymentMethod}
                              onSelect={(id) => setPaymentMethod(id as any)}
                              isOpen={orderPaymentMethodPopupOpen}
                              setIsOpen={setOrderPaymentMethodPopupOpen}
                              triggerLabel={
                                paymentMethod === "cod"
                                  ? t("Cash on Delivery", "ক্যাশ অন ডেলিভারি")
                                  : paymentMethod === "bkash"
                                    ? t("bKash Payment", "বিকাশ পেমেন্ট")
                                    : t("Nagad Payment", "নগদ পেমেন্ট")
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-text3 uppercase mb-2 ml-1">
                              {t("Courier Name", "কুরিয়ার নাম")}
                            </label>
                            <SelectionPopup
                              title={t("Select Courier", "কুরিয়ার নির্বাচন")}
                              options={[
                                { id: "Steadfast", label: "Steadfast" },
                                { id: "Pathao", label: "Pathao" },
                                { id: "RedX", label: "RedX" },
                                { id: "E-Courier", label: "E-Courier" },
                                { id: "PaperFly", label: "PaperFly" },
                                { id: "Sundarban", label: "Sundarban Courier" },
                              ]}
                              selectedId={orderCourier}
                              onSelect={(id) => setOrderCourier(id)}
                              isOpen={orderCourierPopupOpen}
                              setIsOpen={setOrderCourierPopupOpen}
                              triggerLabel={
                                orderCourier ||
                                t("Select Courier", "কুরিয়ার নির্বাচন করুন")
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Confirmation Message Options */}
                      <div className="space-y-4 bg-bg3/30 p-6 rounded-3xl border border-border shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[11px] font-black text-orange uppercase tracking-[0.2em] flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {t("Confirmation Message", "কনফার্মেশন মেসেজ")}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingMsg) {
                                // Save template
                                localStorage.setItem(
                                  "order_confirmation_template",
                                  orderConfirmationMsg,
                                );
                                setOrderConfirmationTemplate(
                                  orderConfirmationMsg,
                                );
                                setIsEditingMsg(false);
                              } else {
                                setIsEditingMsg(true);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isEditingMsg ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-bg3 text-text hover:bg-bg2 border border-border shadow-sm"}`}
                          >
                            {isEditingMsg ? (
                              <>
                                <Save className="w-3 h-3" />{" "}
                                {t("Save Message", "সেভ মেসেজ")}
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-3 h-3" />{" "}
                                {t("Edit Message", "এডিট মেসেজ")}
                              </>
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <textarea
                            rows={6}
                            disabled={!isEditingMsg}
                            className={`w-full bg-card border border-border rounded-2xl py-4 px-5 text-text focus:border-orange outline-none transition-all text-sm leading-relaxed font-bold resize-none shadow-sm ${!isEditingMsg ? "opacity-90 cursor-not-allowed select-none" : ""}`}
                            value={orderConfirmationMsg}
                            onChange={(e) =>
                              setOrderConfirmationMsg(e.target.value)
                            }
                          />
                          {!isEditingMsg && (
                            <div
                              className="absolute inset-0 bg-transparent cursor-pointer rounded-2xl"
                              onClick={() => setIsEditingMsg(true)}
                            />
                          )}
                        </div>
                        {isEditingMsg && (
                          <p className="text-[9px] text-text3 font-medium px-2 flex items-center gap-1.5 leading-tight">
                            <HelpCircle className="w-3 h-3 text-orange shrink-0" />
                            {t(
                              "Use placeholders: {name} for Customer Name, {products} for Product List, {total} for Subtotal, {delivery} for Shipping, {net} for Total Amount.",
                              "প্লেসহোল্ডার ব্যবহার করুন: {name} কাস্টমার নাম, {products} পণ্যের লিস্ট, {total} পণ্যের দাম, {delivery} শিপিং চার্জ, {net} মোট দাম এর জন্য।",
                            )}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="bg-cyan/10 text-cyan text-[8px] font-bold px-3 py-1 rounded-lg border border-cyan/20 flex items-center gap-1.5 uppercase">
                            <Zap className="w-3 h-3 animate-pulse" />{" "}
                            {t("Meta Signal", "মেটা সিগন্যাল")}
                          </span>
                          <span className="bg-orange/10 text-orange text-[8px] font-bold px-3 py-1 rounded-lg border border-orange/20 flex items-center gap-1.5 uppercase">
                            <MessageSquare className="w-3 h-3 animate-pulse" />{" "}
                            {t("Auto Message", "অটো মেসেজ")}
                          </span>
                          <span className="bg-green-500/10 text-green-500 text-[8px] font-bold px-3 py-1 rounded-lg border border-green-500/20 flex items-center gap-1.5 uppercase">
                            <Database className="w-3 h-3 animate-pulse" />{" "}
                            {t("CRM Log", "CRM লগ")}
                          </span>
                        </div>
                      </div>

                      <div className="pt-6 pb-12">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-4.5 bg-orange text-white rounded-2xl font-black text-base hover:bg-orange/90 transition-all shadow-2xl shadow-orange/30 flex items-center justify-center gap-3 group relative overflow-hidden active:scale-[0.98]"
                        >
                          <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                          {submitting ? (
                            <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              {t("Confirm Order", "অর্ডার কনফার্ম করুন")}
                              
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAdBreakdown && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAdBreakdown(null)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-card border border-border w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
                >
                  <div className="p-6 border-b border-border bg-bg3/50 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">
                        {showAdBreakdown.name}
                      </h3>
                      <p className="text-xs text-text3 font-mono font-bold uppercase tracking-widest mt-1">
                        {showAdBreakdown.id}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAdBreakdown(null)}
                      className="p-2 hover:bg-bg3 rounded-full transition-all text-text3 hover:text-text bg-bg2 shadow-sm border border-border/50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-bg2/30">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] text-text3 uppercase font-black tracking-widest mb-2">
                          {t("Total Spend", "মোট খরচ")}
                        </p>
                        <p className="text-2xl font-black text-red">
                          ৳
                          {toBanglaNumber(
                            (showAdBreakdown.spend || 0).toLocaleString(),
                          )}
                        </p>
                      </div>
                      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] text-cyan uppercase font-black tracking-widest mb-2">
                          {t("Messages", "ম্যাসেজ")}
                        </p>
                        <p className="text-2xl font-black text-cyan">
                          {toBanglaNumber(showAdBreakdown.adLeads || 0)}
                        </p>
                      </div>
                      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm ring-2 ring-orange/20">
                        <p className="text-[10px] text-orange uppercase font-black tracking-widest mb-2">
                          {t("Orders", "অর্ডার")}
                        </p>
                        <p className="text-2xl font-black text-orange">
                          {toBanglaNumber(showAdBreakdown.purchases)}
                        </p>
                      </div>
                      <div className="bg-card border-2 border-orange/30 p-5 rounded-2xl shadow-sm bg-orange/5">
                        <p className="text-[10px] text-orange uppercase font-black tracking-widest mb-2">
                          {t("Per Order Cost", "অর্ডার পিছু খরচ")}
                        </p>
                        <p className="text-2xl font-black text-text">
                          ৳{toBanglaNumber(showAdBreakdown.cpp)}
                        </p>
                      </div>
                      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] text-text3 uppercase font-black tracking-widest mb-2">
                          {t("ROAS", "ROAS")}
                        </p>
                        <p className="text-2xl font-black text-green-500">
                          {toBanglaNumber(showAdBreakdown.roas)}x
                        </p>
                      </div>
                      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] text-text3 uppercase font-black tracking-widest mb-2">
                          {t("Link Clicks", "ক্লিকস")}
                        </p>
                        <p className="text-2xl font-black text-cyan">
                          {toBanglaNumber(
                            showAdBreakdown.linkClicks ||
                              showAdBreakdown.clicks,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 pb-10">
                      {/* Left Column: Demographics (Occupies 2 columns now) */}
                      <div className="lg:col-span-2 space-y-8">
                        {/* Gender & Age Breakdown */}
                        <div className="bg-bg3/20 border border-border rounded-3xl p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-orange flex items-center gap-2">
                              <Users className="w-3.5 h-3.5" />{" "}
                              {t(
                                "Demographic Purchase Breakdown",
                                "জনসংখ্যার ক্রয় বিশ্লেষণ",
                              )}
                            </h4>
                            <div className="flex gap-2">
                              <span className="text-[8px] font-black py-1 px-2 bg-blue-500 text-white rounded-lg shadow-sm shadow-blue-500/20">
                                {t("Male", "পুরুষ")}:{" "}
                                {toBanglaNumber(
                                  showAdBreakdown.demographics?.gender.male ??
                                    45,
                                )}
                                %
                              </span>
                              <span className="text-[8px] font-black py-1 px-2 bg-pink-500 text-white rounded-lg shadow-sm shadow-pink-500/20">
                                {t("Female", "মহিলা")}:{" "}
                                {toBanglaNumber(
                                  showAdBreakdown.demographics?.gender.female ??
                                    55,
                                )}
                                %
                              </span>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-xl border border-border/50 bg-bg3/30 backdrop-blur-md">
                            <table className="w-full text-left">
                              <thead className="bg-bg3/80">
                                <tr className="text-[8px] uppercase font-black text-text3">
                                  <th className="p-3">
                                    {t("Age Group", "বয়স সীমা")}
                                  </th>
                                  <th className="p-3">{t("Male", "পুরুষ")}</th>
                                  <th className="p-3">
                                    {t("Female", "মহিলা")}
                                  </th>
                                  <th className="p-3">
                                    {t("Best Creative", "সেরা ক্রিয়েটিভ")}
                                  </th>
                                  <th className="p-3 text-right">
                                    {t("Total", "মোট")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/20">
                                {Object.entries(
                                  showAdBreakdown.demographics?.age || {
                                    "18-24": 30,
                                    "25-34": 50,
                                    "35-44": 15,
                                    "45+": 5,
                                  },
                                ).map(([age, weight], idx) => {
                                  const totalAgePurchases = Math.round(
                                    (Number(weight) / 100) *
                                      showAdBreakdown.purchases,
                                  );
                                  const maleRatio =
                                    (showAdBreakdown.demographics?.gender
                                      .male ?? 45) / 100;
                                  const femaleRatio =
                                    (showAdBreakdown.demographics?.gender
                                      .female ?? 55) / 100;
                                  const malePurchases = Math.round(
                                    totalAgePurchases * maleRatio,
                                  );
                                  const femalePurchases =
                                    totalAgePurchases - malePurchases;
                                  const winningCreatives = [
                                    "Video V1",
                                    "Image V2",
                                    "Carousel",
                                    "Video V1",
                                  ];
                                  const winningCreative =
                                    winningCreatives[
                                      idx % winningCreatives.length
                                    ];

                                  return (
                                    <tr
                                      key={age}
                                      className="text-[9px] hover:bg-bg3/40 transition-colors"
                                    >
                                      <td className="p-3 font-bold text-text2">
                                        {age}
                                      </td>
                                      <td className="p-3 font-medium text-blue-500/80">
                                        {toBanglaNumber(malePurchases)}
                                      </td>
                                      <td className="p-3 font-medium text-pink-500/80">
                                        {toBanglaNumber(femalePurchases)}
                                      </td>
                                      <td className="p-3">
                                        <span className="px-1.5 py-0.5 bg-orange/10 rounded text-[7px] font-black uppercase tracking-tighter text-orange border border-orange/20">
                                          {winningCreative}
                                        </span>
                                      </td>
                                      <td className="p-3 font-black text-right text-text">
                                        {toBanglaNumber(totalAgePurchases)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-8">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-cyan mb-6 flex items-center gap-2">
                              <TrendingUp className="w-3.5 h-3.5" />{" "}
                              {t(
                                "Daily Conversion Trend",
                                "দৈনিক কনভারশন ট্রেন্ড",
                              )}
                            </h4>
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e1e1e1"
                                    vertical={false}
                                  />
                                  <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 8, fill: "#888" }}
                                  />
                                  <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 8, fill: "#888" }}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      borderRadius: "12px",
                                      border: "none",
                                      fontSize: "9px",
                                      boxShadow:
                                        "0 10px 15px -3px rgba(0,0,0,0.1)",
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="conv"
                                    stroke="#ff6b00"
                                    strokeWidth={3}
                                    dot={{
                                      r: 4,
                                      fill: "#ff6b00",
                                      strokeWidth: 2,
                                      stroke: "#fff",
                                    }}
                                    activeDot={{ r: 6 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Creative Results */}
                      <div className="space-y-6">
                        <div className="bg-bg3/20 border border-border rounded-3xl p-6 shadow-sm">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-orange mb-6 flex items-center gap-2">
                            <Play className="w-4 h-4" />{" "}
                            {t(
                              "Creative Performance",
                              "ক্রিয়েটিভ পারফরম্যান্স",
                            )}
                          </h4>
                          <div className="space-y-4">
                            {[
                              {
                                img: "https://picsum.photos/seed/ad1/200/250",
                                label: "Video V1: Product Demo",
                                purchases: 12,
                                roas: "5.2x",
                                bestAudience: "Female, 25-34",
                              },
                              {
                                img: "https://picsum.photos/seed/ad2/200/250",
                                label: "Image V2: Lifestyle",
                                purchases: 8,
                                roas: "4.1x",
                                bestAudience: "Male, 18-24",
                              },
                              {
                                img: "https://picsum.photos/seed/ad3/200/250",
                                label: "Carousel: Collection",
                                purchases: 5,
                                roas: "3.8x",
                                bestAudience: "Female, 35-44",
                              },
                            ].map((ad, idx) => (
                              <div
                                key={idx}
                                className="flex gap-4 p-3 bg-bg3/40 border border-border rounded-2xl hover:bg-bg3/60 transition-all group border-dashed hover:border-solid hover:border-orange/30"
                              >
                                <img
                                  src={ad.img}
                                  alt={ad.label}
                                  className="w-20 h-24 object-cover rounded-xl shadow-sm border border-border/50"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 flex flex-col justify-center">
                                  <p className="text-[10px] font-black text-text mb-1 group-hover:text-orange transition-colors">
                                    {ad.label}
                                  </p>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[8px] text-text3 font-bold uppercase">
                                        {t("Purchases", "ক্রয়")}
                                      </span>
                                      <span className="text-[10px] font-black text-orange">
                                        {toBanglaNumber(ad.purchases)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[8px] text-text3 font-bold uppercase">
                                        ROAS
                                      </span>
                                      <span className="text-[10px] font-black text-green-500">
                                        {toBanglaNumber(ad.roas)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-8 p-4 bg-bg3/30 border border-dashed border-border rounded-2xl text-center">
                            <p className="text-[10px] text-text3 font-bold uppercase tracking-widest">
                              {t("Performance Insight", "পারফরম্যান্স ইনসাইট")}:{" "}
                              <span className="text-orange">
                                Facebook Mobile Feed
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-border bg-bg3/50 text-center">
                    <button
                      onClick={() => setShowAdBreakdown(null)}
                      className="px-8 py-4 bg-orange text-white rounded-2xl font-black text-sm hover:bg-orange/90 transition-all shadow-xl shadow-orange/20 flex items-center justify-center gap-2 mx-auto"
                    >
                      
                      {t("Close Breakdown", "ব্রেকডাউন বন্ধ করুন")}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCRMDetail &&
              selectedCRMData &&
              (() => {
                const customerOrders = orders.filter(
                  (o) =>
                    o.phone === selectedCRMData.phone ||
                    o.customer === selectedCRMData.customer,
                );
                const totalOrdered = customerOrders.length;
                const delivered = customerOrders.filter(
                  (o) => o.status === "Delivered",
                ).length;
                const cancelled = customerOrders.filter(
                  (o) => o.status === "Cancelled",
                ).length;
                const returned = customerOrders.filter(
                  (o) => o.status === "Returned",
                ).length;
                const received = delivered; // Received is same as delivered for now

                const successRate =
                  totalOrdered > 0
                    ? ((delivered / totalOrdered) * 100).toFixed(0)
                    : "0";
                const returnRate =
                  totalOrdered > 0
                    ? ((returned / totalOrdered) * 100).toFixed(0)
                    : "0";

                return (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowCRMDetail(false)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                      {/* Modal Header */}
                      <div className="p-6 border-b border-border flex items-center justify-between bg-bg2">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-orange/10 rounded-2xl flex items-center justify-center text-orange font-black text-2xl uppercase shadow-inner">
                            {selectedCRMData.customer[0]}
                          </div>
                          <div>
                            <h3 className="text-xl font-black tracking-tight">
                              {selectedCRMData.customer}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-sm text-text3 font-mono bg-bg3 px-2 py-0.5 rounded-lg border border-border/50">
                                {selectedCRMData.phone}
                              </p>
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                                {t("Active Lead", "অ্যাক্টিভ লিড")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowCRMDetail(false)}
                          className="p-2.5 hover:bg-bg3 rounded-full transition-all text-text2 hover:text-red bg-bg2 shadow-sm border border-border/50"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      {/* Modal Content */}
                      <div className="p-6 overflow-y-auto hide-scrollbar space-y-8 bg-card">
                        {/* Performance Indicators */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-bg3/30 p-4 rounded-2xl border border-border/50 text-center">
                            <p className="text-[9px] text-text3 uppercase font-black mb-1">
                              {t("Total Ordered", "মোট অর্ডার")}
                            </p>
                            <p className="text-xl font-black text-orange">
                              {toBanglaNumber(totalOrdered)}
                            </p>
                          </div>
                          <div className="bg-bg3/30 p-4 rounded-2xl border border-border/50 text-center">
                            <p className="text-[9px] text-text3 uppercase font-black mb-1">
                              {t("Received", "রিসিভড")}
                            </p>
                            <p className="text-xl font-black text-green-500">
                              {toBanglaNumber(received)}
                            </p>
                          </div>
                          <div className="bg-bg3/30 p-4 rounded-2xl border border-border/50 text-center">
                            <p className="text-[9px] text-text3 uppercase font-black mb-1">
                              {t("Cancelled", "বাতিল")}
                            </p>
                            <p className="text-xl font-black text-red">
                              {toBanglaNumber(cancelled)}
                            </p>
                          </div>
                          <div className="bg-bg3/30 p-4 rounded-2xl border border-border/50 text-center">
                            <p className="text-[9px] text-text3 uppercase font-black mb-1">
                              {t("Returned", "রিটার্নড")}
                            </p>
                            <p className="text-xl font-black text-red-700">
                              {toBanglaNumber(returned)}
                            </p>
                          </div>
                        </div>

                        {/* Behavior Rates - NEW SECTION */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-orange uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" />{" "}
                            {t(
                              "Customer Behavior Rates",
                              "কাস্টমার বিহেভিয়ার রেটস",
                            )}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 space-y-3">
                              <div className="flex justify-between items-center text-xs font-bold text-green-600">
                                <span>{t("Success Rate", "সফলতার হার")}</span>
                                <span>{toBanglaNumber(successRate)}%</span>
                              </div>
                              <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${successRate}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-text3 font-medium italic">
                                {t(
                                  "* Good behavior. Highly recommended for shipping.",
                                  "* ভালো আচরণ। শিপিংয়ের জন্য সুপারিশ করা হচ্ছে।",
                                )}
                              </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-red/5 border border-red/10 space-y-3">
                              <div className="flex justify-between items-center text-xs font-bold text-red">
                                <span>{t("Return Rate", "রিটার্ন হার")}</span>
                                <span>{toBanglaNumber(returnRate)}%</span>
                              </div>
                              <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red"
                                  style={{ width: `${returnRate}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-text3 font-medium italic">
                                {t(
                                  "* Risky customer. Please verify before shipping.",
                                  "* ঝুঁকিপূর্ণ কাস্টমার। শিপিংয়ের আগে দয়া করে যাচাই করুন।",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Customer Journey / Ads History */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-orange uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-3.5 h-3.5" />{" "}
                            {t(
                              "Customer Journey & Ads History",
                              "কাস্টমার জার্নি ও অ্যাড হিস্ট্রি",
                            )}
                          </h4>
                          <div className="space-y-3 bg-bg3/20 p-5 rounded-2xl border border-border/50">
                            <div className="flex items-center justify-between pb-3 border-b border-border/50">
                              <div className="text-xs">
                                <p className="text-text3 mb-1">
                                  {t("Initial Lead Source", "প্রথম লিড সোর্স")}
                                </p>
                                <p className="font-bold flex items-center gap-2 text-orange">
                                  <Facebook className="w-3.5 h-3.5" />
                                  {selectedCRMData.adSource ||
                                    selectedCRMData.campaign ||
                                    "Facebook Organic"}
                                </p>
                              </div>
                              <div className="text-right text-xs">
                                <p className="text-text3 mb-1">
                                  {t("Latest Campaign", "সর্বশেষ ক্যাম্পেইন")}
                                </p>
                                <p className="font-bold text-cyan">
                                  {selectedCRMData.campaign || "N/A"}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2">
                              <p className="text-[9px] text-text3 uppercase font-black mb-3">
                                {t(
                                  "Source Distribution",
                                  "সোর্স ডিস্ট্রিবিউশন",
                                )}
                              </p>
                              {[
                                {
                                  source:
                                    selectedCRMData.adSource ||
                                    selectedCRMData.campaign ||
                                    "Organic",
                                  count: Math.ceil(totalOrdered * 0.7),
                                  percent: 70,
                                  type: "Ad",
                                },
                                {
                                  source: "Direct/Message",
                                  count: Math.floor(totalOrdered * 0.3),
                                  percent: 30,
                                  type: "Direct",
                                },
                              ].map((s, idx) => (
                                <div
                                  key={idx}
                                  className="space-y-2 mb-4 last:mb-0"
                                >
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold flex items-center gap-2">
                                      {s.type === "Ad" ? (
                                        <Zap className="w-3 h-3 text-orange" />
                                      ) : (
                                        <Globe2 className="w-3 h-3 text-cyan" />
                                      )}
                                      {s.source}
                                    </span>
                                    <span className="text-text3 font-bold">
                                      {toBanglaNumber(s.count)}{" "}
                                      {t("Orders", "অর্ডার")}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                                    <div
                                      className="h-full transition-all duration-1000"
                                      style={{
                                        width: `${s.percent}%`,
                                        backgroundColor:
                                          s.type === "Ad"
                                            ? "#ff6b00"
                                            : "#00e5ff",
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Full Order Detail History */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-cyan uppercase tracking-widest flex items-center gap-2">
                            <History className="w-3.5 h-3.5" />{" "}
                            {t(
                              "Detailed Order History",
                              "বিস্তারিত অর্ডার হিস্ট্রি",
                            )}
                          </h4>
                          <div className="space-y-4">
                            {customerOrders.length > 0 ? (
                              customerOrders.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-col p-5 border border-border rounded-3xl bg-card hover:bg-bg3/20 transition-all border-dashed"
                                >
                                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 bg-bg3 rounded-xl flex items-center justify-center">
                                        <Package className="w-4.5 h-4.5 text-text3" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-black tracking-tight">
                                          {item.product}
                                        </p>
                                        <p className="text-[10px] text-text3 font-mono uppercase tracking-widest">
                                          {item.uid}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span
                                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                          item.status === "Delivered"
                                            ? "bg-green-500/10 text-green-500"
                                            : item.status === "Cancelled"
                                              ? "bg-red/10 text-red"
                                              : "bg-blue-500/10 text-blue-500"
                                        }`}
                                      >
                                        {t(item.status, item.status)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-text3 uppercase font-bold">
                                        {t("Purchase Date", "ক্রয়ের তারিখ")}
                                      </p>
                                      <p className="font-bold">
                                        {toBanglaNumber(
                                          new Date(
                                            item.date,
                                          ).toLocaleDateString(),
                                        )}
                                      </p>
                                      {item.status === "Delivered" && item.deliveredDate && (
                                        <p className="text-[10px] text-green-500 font-bold mt-1">
                                          {t("Delivered:", "ডেলিভারি:")} {toBanglaNumber(new Date(item.deliveredDate).toLocaleDateString())}
                                        </p>
                                      )}
                                      {item.status === "Returned" && item.returnedDate && (
                                        <p className="text-[10px] text-red font-bold mt-1">
                                          {t("Returned:", "রিটার্ন:")} {toBanglaNumber(new Date(item.returnedDate).toLocaleDateString())}
                                        </p>
                                      )}
                                      {item.status === "Cancelled" && item.cancelledDate && (
                                        <p className="text-[10px] text-text3 font-bold mt-1">
                                          {t("Cancelled:", "বাতিল:")} {toBanglaNumber(new Date(item.cancelledDate).toLocaleDateString())}
                                        </p>
                                      )}
                                    </div>
                                    <div className="space-y-1 text-right">
                                      <p className="text-[10px] text-text3 uppercase font-bold">
                                        {t("Amount Total", "মোট পরিমাণ")}
                                      </p>
                                      <p className="font-bold text-orange">
                                        ৳
                                        {toBanglaNumber(
                                          (item.price || 0).toLocaleString(),
                                        )}
                                      </p>
                                    </div>
                                    <div className="col-span-2 space-y-1 pt-2 border-t border-border/30">
                                      <p className="text-[10px] text-text3 uppercase font-bold">
                                        {t(
                                          "Lead Source Info",
                                          "লিড সোর্স ইনফো",
                                        )}
                                      </p>
                                      <p className="text-[11px] font-medium text-text2 flex items-center gap-2">
                                        <Target className="w-3 h-3" />
                                        {item.adSource ||
                                          item.campaign ||
                                          "Organic Direct Lead"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-12 text-center bg-bg3/20 rounded-3xl border-2 border-dashed border-border">
                                <ShoppingCart className="w-8 h-8 text-text3 mx-auto mb-3 opacity-20" />
                                <p className="text-xs text-text3 font-bold">
                                  {t(
                                    "No order history found",
                                    "কোনো অর্ডার হিস্ট্রি পাওয়া যায়নি",
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-6 border-t border-border bg-bg2">
                        <button
                          onClick={() => setShowCRMDetail(false)}
                          className="w-full bg-orange text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange/90 transition-all shadow-lg shadow-orange/20"
                        >
                          {t("Finish Tracking", "ট্র্যাকিং বন্ধ করুন")}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                );
              })()}
          </AnimatePresence>

          {/* Forgot Password Selection Modal */}
          <AnimatePresence>
            {showForgotPasswordOptions && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowForgotPasswordOptions(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden shadow-orange/10"
                >
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange/10 rounded-full blur-3xl opacity-50" />
                  <div className="relative text-center space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-orange/10 flex items-center justify-center text-orange mx-auto shadow-inner group transition-all">
                      <KeyRound className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h3 className="font-syne font-black text-xl uppercase tracking-tight">
                        {t("Recovery Options", "পাসওয়ার্ড উদ্ধার")}
                      </h3>
                      <p className="text-xs text-text3 font-medium mt-2 leading-relaxed">
                        {t(
                          "Choose a method to receive a verification code for resetting your password.",
                          "পাসওয়ার্ড রিসেট করার জন্য একটি ভেরিফিকেশন মাধ্যম বেছে নিন।",
                        )}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setOtpType("password_reset");
                          setOtpTarget(profileData.phone);
                          setShowForgotPasswordOptions(false);
                          setShowOtpModal(true);
                          setOtpTimer(59);
                        }}
                        className="w-full group p-4 bg-bg3 border border-border hover:border-orange hover:bg-orange/5 rounded-2xl transition-all flex items-center gap-4 text-left active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange text-white flex items-center justify-center shadow-lg shadow-orange/20 group-hover:scale-110 transition-transform shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-text uppercase tracking-tight">
                            {t("Via SMS OTP", "এসএমএস এর মাধ্যমে")}
                          </p>
                          <p className="text-[10px] text-text3 font-bold">
                            {profileData.phone}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setOtpType("password_reset");
                          setOtpTarget(profileData.email);
                          setShowForgotPasswordOptions(false);
                          setShowOtpModal(true);
                          setOtpTimer(59);
                        }}
                        className="w-full group p-4 bg-bg3 border border-border hover:border-orange hover:bg-orange/5 rounded-2xl transition-all flex items-center gap-4 text-left active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange text-white flex items-center justify-center shadow-lg shadow-orange/20 group-hover:scale-110 transition-transform shrink-0">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-text uppercase tracking-tight">
                            {t("Via Email Code", "ইমেইল এর মাধ্যমে")}
                          </p>
                          <p className="text-[10px] text-text3 font-bold">
                            {profileData.email}
                          </p>
                        </div>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowForgotPasswordOptions(false)}
                      className="w-full py-4 text-xs font-black uppercase text-text3 hover:text-text tracking-widest transition-all"
                    >
                      {t("Go Back", "ফিরে যান")}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showOtpModal && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowOtpModal(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 text-center"
                >
                  <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-8 h-8 text-orange" />
                  </div>
                  <h3 className="text-xl font-black mb-2">
                    {otpType === "password_reset"
                      ? t("Reset Password", "পাসওয়ার্ড রিসেট")
                      : t("OTP Verification", "OTP ভেরিফিকেশন")}
                  </h3>
                  <p className="text-xs text-text3 mb-8">
                    {t(
                      "We have sent a 6-digit verification code to",
                      "আমরা একটি ৬ ডিজিটের ভেরিফিকেশন কোড পাঠিয়েছি",
                    )}{" "}
                    <span className="text-text font-bold">{otpTarget}</span>
                  </p>

                  <div className="flex justify-center gap-2 mb-4">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) =>
                        setOtpValue(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="000000"
                      className="w-full bg-bg3 border border-border rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5em] focus:border-orange outline-none transition-all shadow-inner"
                    />
                  </div>

                  {otpTimer > 0 ? (
                    <p className="text-[10px] text-text3 mb-8">
                      {t("Resend code in", "কোড পুনরায় পাঠান")}{" "}
                      <span className="text-orange font-bold uppercase tracking-widest">
                        {formatTimer(otpTimer)}
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-[10px] font-black uppercase text-orange hover:underline mb-8"
                    >
                      {t("Resend Code", "কোড পুনরায় পাঠান")}
                    </button>
                  )}

                  <button
                    onClick={handleVerifyOtp}
                    className="w-full bg-orange text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange/20 hover:bg-orange/90 transition-all mb-4"
                  >
                    {t("Verify & Continue", "ভেরিফাই করুন")}
                  </button>

                  <button
                    onClick={() => setShowOtpModal(false)}
                    className="text-[10px] font-black uppercase text-text3 hover:text-text transition-colors"
                  >
                    {t("Cancel", "বাতিল")}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {show2faModal && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShow2faModal(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden shadow-orange/10"
                >
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange/10 rounded-full blur-3xl opacity-50" />
                  <div className="relative text-center space-y-6">
                    <div
                      className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-inner group transition-all ${is2faEnabled ? "bg-red/10 text-red" : "bg-orange/10 text-orange"}`}
                    >
                      <Shield className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h3 className="font-syne font-black text-xl uppercase tracking-tight">
                        {is2faEnabled
                          ? t("Disable Security", "নিরাপত্তা বন্ধ")
                          : t("2-Step Security", "টু-স্টেপ সিকিউরিটি")}
                      </h3>
                      <p className="text-xs text-text3 font-medium mt-2 leading-relaxed">
                        {is2faEnabled
                          ? t(
                              "Are you sure you want to disable two-factor authentication? Your account will be less secure.",
                              "আপনি কি নিশ্চিত যে টু-ফ্যাক্টর অথেন্টিকেশন বন্ধ করতে চান? আপনার অ্যাকাউন্ট কম সুরক্ষিত হবে।",
                            )
                          : t(
                              "Choose how you want to receive your one-time verification codes.",
                              "ভেরিফিকেশন কোড পাওয়ার জন্য একটি মাধ্যম বেছে নিন।",
                            )}
                      </p>
                    </div>

                    {!is2faEnabled && (
                      <div className="space-y-3">
                        <button
                          onClick={() => setTwoFactorMethod("phone")}
                          className={`w-full group p-4 border rounded-2xl transition-all flex items-center gap-4 text-left active:scale-[0.98] ${twoFactorMethod === "phone" ? "bg-orange/5 border-orange shadow-inner" : "bg-bg3 border-border hover:border-orange/50"}`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform shrink-0 ${twoFactorMethod === "phone" ? "bg-orange text-white shadow-orange/20 scale-110" : "bg-bg2 text-text3"}`}
                          >
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-text uppercase tracking-tight">
                              {t("SMS OTP", "এসএমএস এর মাধ্যমে")}
                            </p>
                            <p className="text-[10px] text-text3 font-bold">
                              {profileData.phone}
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => setTwoFactorMethod("email")}
                          className={`w-full group p-4 border rounded-2xl transition-all flex items-center gap-4 text-left active:scale-[0.98] ${twoFactorMethod === "email" ? "bg-orange/5 border-orange shadow-inner" : "bg-bg3 border-border hover:border-orange/50"}`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform shrink-0 ${twoFactorMethod === "email" ? "bg-orange text-white shadow-orange/20 scale-110" : "bg-bg2 text-text3"}`}
                          >
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-text uppercase tracking-tight">
                              {t("Email Code", "ইমেইল এর মাধ্যমে")}
                            </p>
                            <p className="text-[10px] text-text3 font-bold">
                              {profileData.email}
                            </p>
                          </div>
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleEnable2fa}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all ${
                          is2faEnabled
                            ? "bg-red text-white shadow-red/20 hover:bg-red/90"
                            : "bg-orange text-white shadow-orange/20 hover:shadow-orange/30"
                        }`}
                      >
                        {is2faEnabled
                          ? t("Disable Now", "এখনই বন্ধ করুন")
                          : t("Secure My Account", "অ্যাকাউন্ট সুরক্ষিত করুন")}
                      </button>
                      <button
                        onClick={() => setShow2faModal(false)}
                        className="w-full py-2 text-[10px] font-black uppercase text-text3 hover:text-text tracking-widest transition-all"
                      >
                        {t("Cancel", "বাতিল")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Multi-step Account Deletion Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden shadow-red/10"
                >
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-red/10 rounded-full blur-3xl opacity-50" />

                  {deleteStep === "request" && (
                    <div className="relative text-center space-y-6">
                      <div className="w-16 h-16 rounded-3xl bg-red/10 flex items-center justify-center text-red mx-auto shadow-inner">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-syne font-black text-xl uppercase tracking-tight text-red">
                          {t("Delete Account?", "অ্যাকাউন্ট মুছবেন?")}
                        </h3>
                        <p className="text-xs text-text3 font-medium mt-2 leading-relaxed">
                          {t(
                            "This will permanently erase all your data. This action is terminal.",
                            "এর ফলে আপনার সব ডেটা চিরতরে মুছে যাবে। এই পদক্ষেপটি অপরিবর্তনীয়।",
                          )}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setShowDeleteModal(false)}
                          className="py-4 rounded-2xl bg-bg3 text-text3 font-black text-[10px] uppercase tracking-widest"
                        >
                          {t("Keep Account", "না, থাক")}
                        </button>
                        <button
                          onClick={() => setDeleteStep("survey")}
                          className="py-4 rounded-2xl bg-red text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red/20"
                        >
                          {t("Continue", "এগিয়ে যান")}
                        </button>
                      </div>
                    </div>
                  )}

                  {deleteStep === "survey" && (
                    <div className="relative space-y-6">
                      <h3 className="font-syne font-black text-lg uppercase tracking-tight text-center">
                        {t("Help us improve", "আমাদের উন্নত হতে সাহায্য করুন")}
                      </h3>
                      <p className="text-[11px] text-text3 text-center mb-4">
                        {t(
                          "Why are you leaving us today?",
                          "আজ কেন আমাদের ছেড়ে যাচ্ছেন?",
                        )}
                      </p>

                      <div className="space-y-2">
                        {[
                          t("It is too expensive", "অধিক খরচ"),
                          t("Hard to use", "ব্যবহার করা কঠিন"),
                          t("Missing features", "ফিচার কম"),
                          t("Other", "অন্যান্য"),
                        ].map((reason) => (
                          <button
                            key={reason}
                            onClick={() => setDeleteReason(reason)}
                            className={`w-full p-4 rounded-2xl text-xs font-bold transition-all text-left flex items-center justify-between border ${deleteReason === reason ? "bg-orange/5 border-orange text-orange shadow-inner" : "bg-bg3 border-border text-text2 hover:border-orange/50"}`}
                          >
                            {reason}
                            <div
                              className={`w-2.5 h-2.5 rounded-full border border-border ${deleteReason === reason ? "bg-orange border-orange" : ""}`}
                            />
                          </button>
                        ))}
                        {deleteReason === t("Other", "অন্যান্য") && (
                          <textarea
                            value={otherReason}
                            onChange={(e) => setOtherReason(e.target.value)}
                            placeholder={t(
                              "Tell us more...",
                              "আমাদের আরও বলুন...",
                            )}
                            className="w-full bg-bg3 border border-orange/50 rounded-2xl p-4 text-xs outline-none mt-2 shadow-inner h-20 resize-none"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setDeleteStep("request")}
                          className="py-4 rounded-2xl bg-bg3 text-text3 font-black text-[10px] uppercase tracking-widest hover:text-text hover:bg-bg2 transition-all"
                        >
                          {t("Go Back", "পিছনে যান")}
                        </button>
                        <button
                          disabled={!deleteReason}
                          onClick={() => setDeleteStep("final")}
                          className="w-full py-4 rounded-2xl bg-orange text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange/20 disabled:opacity-50"
                        >
                          {t("Submit & Finalize", "জমা দিন ও শেষ ধাপে যান")}
                        </button>
                      </div>
                    </div>
                  )}

                  {deleteStep === "final" && (
                    <div className="relative text-center space-y-6">
                      <div className="w-16 h-16 rounded-3xl bg-red flex items-center justify-center text-white mx-auto shadow-xl shadow-red/20 animate-pulse">
                        <Trash2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-syne font-black text-xl uppercase tracking-tight text-red">
                          {t("Final Confirmation", "চুড়ান্ত নিশ্চিতকরণ")}
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-text3 ml-1 text-left">
                            {t("Your Password", "আপনার পাসওয়ার্ড")}
                          </label>
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-bg3 border border-border rounded-2xl py-3.5 px-4 text-xs focus:border-red outline-none transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-text3 ml-1 text-left">
                            {t('Type "Confirm"', 'নিচে "Confirm" লিখুন')}
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) =>
                              setDeleteConfirmText(e.target.value)
                            }
                            placeholder="Confirm"
                            className="w-full bg-bg3 border border-border rounded-2xl py-3.5 text-center text-sm font-black focus:border-red outline-none transition-all shadow-inner placeholder:opacity-20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setDeleteStep("survey")}
                          className="py-4 rounded-2xl bg-bg3 text-text3 font-black text-[10px] uppercase tracking-widest"
                        >
                          {t("Go Back", "পিছনে যান")}
                        </button>
                        <button
                          disabled={
                            deleteConfirmText !== "Confirm" || !deletePassword
                          }
                          onClick={handleDeleteAccount}
                          className="py-4 rounded-2xl bg-red text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red/20 disabled:opacity-50"
                        >
                          {t("Delete Account", "অ্যাকাউন্ট মুছুন")}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAiChat && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAiChat(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[500px]"
                >
                  <div className="p-6 bg-cyan text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-tight">
                          {t("Insta-Help AI", "ইন্সটা-হেল্প AI")}
                        </h3>
                        <p className="text-[10px] opacity-80">
                          {t("Always here to solve", "আপনার সেবায় নিয়োজিত")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAiChat(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg2/30">
                    {aiChatMessages.map((msg, i) => (
                      <div key={i} className="space-y-4">
                        <div
                          className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              msg.role === "ai"
                                ? "bg-cyan/10 border-cyan/20 text-cyan"
                                : "bg-orange/10 border-orange/20 text-orange"
                            }`}
                          >
                            {msg.role === "ai" ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div
                            className={`border rounded-2xl p-4 shadow-sm max-w-[80%] ${
                              msg.role === "ai"
                                ? "bg-bg2 border-border rounded-tl-none"
                                : "bg-orange text-white border-orange rounded-tr-none"
                            }`}
                          >
                            <p className="text-xs leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        </div>

                        {msg.role === "ai" && msg.options && (
                          <div className="flex flex-wrap gap-2 pl-11">
                            {msg.options.map((option: string) => (
                              <button
                                key={option}
                                onClick={() => {
                                  setAiChatMessages((prev) => [
                                    ...prev,
                                    { role: "user", text: option },
                                  ]);

                                  // Decision logic
                                  setTimeout(() => {
                                    let aiResponse = "";
                                    let nextOptions: string[] = [];

                                    if (option === "তাত্ক্ষণিক সমাধান") {
                                      aiResponse =
                                        "কী ধরণের সমাধান খুঁজছেন? আপনার সমস্যার ক্যাটাগরি বেছে নিন:";
                                      nextOptions = [
                                        "অর্ডার ট্র্যাকিং",
                                        "অটো রিপ্লাই সেটিংস",
                                        "কুরিয়ার আপডেট",
                                        "পিছনে যান",
                                      ];
                                    } else if (option === "পেমেন্ট ও বিলিং") {
                                      aiResponse =
                                        "পেমেন্ট সংক্রান্ত কী সমস্যা হচ্ছে?";
                                      nextOptions = [
                                        "বিকাশ পেমেন্ট ইস্যু",
                                        "ইনভয়েস পাচ্ছি না",
                                        "প্ল্যান আপডেট হচ্ছে না",
                                        "পিছনে যান",
                                      ];
                                    } else if (option === "সেটিংস হেল্প") {
                                      aiResponse =
                                        "সেটিংসের কোন অংশ বুঝতে সমস্যা হচ্ছে?";
                                      nextOptions = [
                                        "প্রোফাইল সেটিংস",
                                        "নিরাপত্তা সেটিংস",
                                        "কানেক্টেড অ্যাপস",
                                        "পিছনে যান",
                                      ];
                                    } else if (
                                      option === "এক্সপার্ট সমাধান নিন"
                                    ) {
                                      aiResponse =
                                        "অবশ্যই! আমি আপনাকে আমাদের একজন হিউম্যান এজেন্টের সাথে কানেক্ট করার জন্য রিকোয়েস্ট পাঠিয়েছি। শীঘ্রই যোগাযোগ করা হবে।";
                                      toast.success(
                                        t(
                                          "Human assistant request sent",
                                          "হিউম্যান অ্যাসিস্ট্যান্ট রিকোয়েস্ট পাঠানো হয়েছে",
                                        ),
                                      );
                                    } else if (
                                      option === "পিছনে যান" ||
                                      option === "অন্য কিছু"
                                    ) {
                                      aiResponse =
                                        "ঠিক আছে, আমি কীভাবে সাহায্য করতে পারি? নিচের অপশনগুলো দেখুন:";
                                      nextOptions = [
                                        "তাত্ক্ষণিক সমাধান",
                                        "পেমেন্ট ও বিলিং",
                                        "সেটিংস হেল্প",
                                        "এক্সপার্ট সমাধান নিন",
                                      ];
                                    } else {
                                      aiResponse = `আমি "${option}" সম্পর্কে বুঝতে পারছি। তবে এর জন্য কোনো সরাসরি সমাধান এখন নেই। আপনি কি আমাদের টিমের সাথে সরাসরি কথা বলতে চান?`;
                                      nextOptions = [
                                        "এক্সপার্ট সমাধান নিন",
                                        "পিছনে যান",
                                      ];
                                    }

                                    setAiChatMessages((prev) => [
                                      ...prev,
                                      {
                                        role: "ai",
                                        text: aiResponse,
                                        options:
                                          nextOptions.length > 0
                                            ? nextOptions
                                            : undefined,
                                      },
                                    ]);
                                  }, 800);
                                }}
                                className="px-3 py-1.5 bg-bg3 border border-cyan/30 text-cyan rounded-full text-[10px] font-bold hover:bg-cyan hover:text-white transition-all shadow-sm shadow-cyan/10"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-border bg-card">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!aiInput.trim()) return;
                        const userMsg = aiInput;
                        setAiChatMessages((prev) => [
                          ...prev,
                          { role: "user", text: userMsg },
                        ]);
                        setAiInput("");

                        // Simulate general AI response
                        setTimeout(() => {
                          setAiChatMessages((prev) => [
                            ...prev,
                            {
                              role: "ai",
                              text: `আপনার "${userMsg}" বিষয়টি আমি নোট করেছি। তবে দ্রুত সমাধানের জন্য নিচের অপশনগুলো ব্যবহার করুন:`,
                              options: [
                                "তাত্ক্ষণিক সমাধান",
                                "পেমেন্ট ও বিলিং",
                                "এক্সপার্ট সমাধান নিন",
                              ],
                            },
                          ]);
                        }, 1000);
                      }}
                      className="relative"
                    >
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder={t(
                          "Type your issue here...",
                          "আপনার সমস্যা এখানে লিখুন...",
                        )}
                        className="w-full bg-bg3 border border-border rounded-2xl py-4 px-4 pr-14 text-sm outline-none focus:border-cyan transition-all shadow-inner"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-cyan text-white flex items-center justify-center shadow-lg shadow-cyan/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPasswordConfirmModal && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPasswordConfirmModal(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-8"
                >
                  <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-red" />
                  </div>
                  <h3 className="text-xl font-black text-center mb-2">
                    {showPasswordConfirmModal.title}
                  </h3>
                  <p className="text-xs text-text3 text-center mb-8">
                    {t(
                      "For your security, please confirm your password to proceed.",
                      "আপনার নিরাপত্তার জন্য, অনুগ্রহ করে পাসওয়ার্ড দিয়ে নিশ্চিত করুন।",
                    )}
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text3 uppercase ml-1 tracking-widest">
                        {t("Enter Password", "পাসওয়ার্ড লিখুন")}
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-bg3 border border-border rounded-2xl py-3 px-4 text-sm focus:border-orange outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowPasswordConfirmModal(null)}
                      className="py-4 rounded-2xl bg-bg3 text-text3 font-black text-[10px] uppercase tracking-widest hover:bg-bg2 transition-all"
                    >
                      {t("Cancel", "বাতিল")}
                    </button>
                    <button
                      onClick={showPasswordConfirmModal.onConfirm}
                      disabled={!confirmPassword}
                      className="py-4 rounded-2xl bg-red text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red/20 hover:bg-red/90 transition-all disabled:opacity-50"
                    >
                      {t("Confirm", "নিশ্চিত")}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        {/* Order Success Modal */}
          <AnimatePresence>
            {showOrderSuccessModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowOrderSuccessModal(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-card border border-border rounded-3xl p-8 z-10 shadow-2xl flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-black text-text tracking-tight mb-2">
                    {t("Order Confirmed Successfully!", "অর্ডার সফলভাবে কনফার্ম হয়েছে!")}
                  </h3>
                  <p className="text-xs text-text3 font-medium mb-8">
                    {t("Order ID: ", "অর্ডার আইডি: ")} <span className="font-bold text-text">{toBanglaNumber(showOrderSuccessModal.uid)}</span>
                  </p>
                  
                  <div className="w-full bg-bg3/50 rounded-2xl p-4 space-y-3 mb-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text3 text-left mb-4">
                      {t("Automated Background Actions", "স্বয়ংক্রিয় ব্যাকগ্রাউন্ড কাজ")}
                    </h4>
                    {showOrderSuccessModal.actions?.map((action: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 w-4 h-4 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                        </div>
                        <p className="text-xs font-bold text-text text-left leading-tight">{action}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowOrderSuccessModal(null)}
                    className="w-full bg-bg3 hover:bg-bg2 border border-border text-text font-black text-xs py-3.5 rounded-xl transition-all"
                  >
                    {t("Dismiss", "বন্ধ করুন")}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          
          {/* Logout Confirmation Modal */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={() => setShowLogoutConfirm(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
                >
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LogOut className="w-8 h-8 text-red" />
                    </div>
                    <h3 className="text-xl font-bold text-text mb-2">
                      {t("Logout?", "লগআউট করতে চান?")}
                    </h3>
                    <p className="text-sm text-text2 mb-6">
                      {t(
                        "Are you sure you want to log out of your account?",
                        "আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?",
                      )}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-text hover:bg-bg2 transition-colors border border-border bg-bg3/50"
                      >
                        {t("Cancel", "বাতিল")}
                      </button>
                      <button
                        onClick={() => {
                          setShowLogoutConfirm(false);
                          onLogout();
                        }}
                        className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-red hover:bg-red/90 transition-colors shadow-md shadow-red/20"
                      >
                        {t("Logout", "লগআউট")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
            </>
          )}
          
        </div>
      </main>
    </div>
  );
}

const SidebarItem = React.memo(
  ({
    icon,
    label,
    active,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
  }) => {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all font-medium text-xs ${
          active
            ? "bg-orange text-white shadow-md shadow-orange/20"
            : "text-text3 hover:text-text hover:bg-bg2"
        }`}
      >
        <div className={`${active ? "text-white" : "text-text3"}`}>
          {React.cloneElement(icon as React.ReactElement, {
            className: "w-4 h-4",
          })}
        </div>
        <span>{label}</span>
      </button>
    );
  },
);

const TakaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <span
    className={`${className} font-bold flex items-center justify-center leading-none text-base`}
    style={{ fontStyle: "normal" }}
  >
    ৳
  </span>
);

const StatCard = React.memo(
  ({
    label,
    value,
    change,
    trend,
    icon,
  }: {
    label: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: React.ReactNode;
  }) => {
    return (
      <div className="bg-card border border-border rounded-xl p-4 hover:border-orange/30 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-bg2 rounded-lg group-hover:bg-orange/10 transition-all">
            {React.cloneElement(icon as React.ReactElement, {
              className: "w-5 h-5",
            })}
          </div>
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              trend === "up"
                ? "text-green-500 bg-green-500/10"
                : "text-red bg-red/10"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-2.5 h-2.5" />
            ) : (
              <ArrowDownRight className="w-2.5 h-2.5" />
            )}
            {change}
          </div>
        </div>
        <p className="text-text3 text-xs font-medium">{label}</p>
        <h4 className="text-xl font-bold mt-0.5">{value}</h4>
      </div>
    );
  },
);
