
import { toBanglaNumber } from './utils/numberUtils';

export interface AdCampaign {
  id: string;
  name: string;
  nameBn: string;
  leads: number; // This represents total conversations/messages
  spend: number;
  reach: number;
  impressions: number;
  confirmedOrders: number;
  revenue: number;
}

export const MOCK_ADS: AdCampaign[] = [
  { 
    id: 'CAMP-001', 
    name: 'Summer Sale 2026', 
    nameBn: 'সামার সেল ২০২৬', 
    leads: 250, 
    spend: 12500, 
    reach: 45000, 
    impressions: 65000,
    confirmedOrders: 18,
    revenue: 22500
  },
  { 
    id: 'CAMP-002', 
    name: 'Eid Special 2026', 
    nameBn: 'ঈদ স্পেশাল ২০২৬', 
    leads: 180, 
    spend: 9500, 
    reach: 38000, 
    impressions: 52000,
    confirmedOrders: 12,
    revenue: 29400
  },
  { 
    id: 'CAMP-003', 
    name: 'Flash Deal August', 
    nameBn: 'ফ্ল্যাশ ডিল আগস্ট', 
    leads: 120, 
    spend: 5000, 
    reach: 22000, 
    impressions: 31000,
    confirmedOrders: 8,
    revenue: 14800
  },
  { 
    id: 'CAMP-004', 
    name: 'Gadget Expo', 
    nameBn: 'গ্যাজেট এক্সপো', 
    leads: 85, 
    spend: 4200, 
    reach: 18000, 
    impressions: 25000,
    confirmedOrders: 5,
    revenue: 16000
  },
  { 
    id: 'DIRECT', 
    name: 'Direct Message', 
    nameBn: 'সরাসরি মেসেজ', 
    leads: 45, 
    spend: 0, 
    reach: 0, 
    impressions: 0,
    confirmedOrders: 3,
    revenue: 4500
  }
];

export const MOCK_ORDERS = [
  // Summer Sale Orders (18)
  ...Array.from({ length: 18 }, (_, i) => ({
    id: 100 + i,
    uid: `ORD-10${100 + i}`,
    customer: ['Abir Hasan', 'Jannatul Ferdous', 'Mizanur Rahman', 'Farhana Islam', 'Mehedi Hasan', 'Anika Tabassum'][i % 6],
    phone: `017112233${40 + i}`,
    address: 'Dhaka, Bangladesh',
    product: 'Premium T-Shirt',
    price: 1250,
    payment: i % 2 === 0 ? 'bKash' : 'COD',
    status: i < 15 ? 'Delivered' : 'Pending',
    campaign: 'Summer Sale 2026',
    ad_id: 'CAMP-001',
    date: new Date(Date.now() - (i * 2) * 3600000).toISOString()
  })),
  // Eid Special Orders (12)
  ...Array.from({ length: 12 }, (_, i) => ({
    id: 200 + i,
    uid: `ORD-20${200 + i}`,
    customer: ['Sultana Razia', 'Sadia Afrin', 'Rakib Hossain', 'Sumon Ahmed'][i % 4],
    phone: `018112233${50 + i}`,
    address: 'Chittagong, Bangladesh',
    product: 'Cotton Panjabi',
    price: 2450,
    payment: i % 2 === 0 ? 'Nagad' : 'COD',
    status: i < 8 ? 'Delivered' : 'Shipped',
    campaign: 'Eid Special 2026',
    ad_id: 'CAMP-002',
    date: new Date(Date.now() - (i * 3) * 3600000).toISOString()
  })),
  // Flash Deal (8)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: 300 + i,
    uid: `ORD-30${300 + i}`,
    customer: ['Kamrul Islam', 'Tanvir Ahmed', 'Nusrat Jahan'][i % 3],
    phone: `019112233${60 + i}`,
    address: 'Sylhet, Bangladesh',
    product: 'Denim Jeans',
    price: 1850,
    payment: 'bKash',
    status: 'Pending',
    campaign: 'Flash Deal August',
    ad_id: 'CAMP-003',
    date: new Date(Date.now() - (i * 5) * 3600000).toISOString()
  })),
  // Gadget Expo (5)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: 400 + i,
    uid: `ORD-40${400 + i}`,
    customer: 'Tech Buyer',
    phone: `015112233${70 + i}`,
    address: 'Uttara, Dhaka',
    product: 'Smart Watch',
    price: 3200,
    payment: 'COD',
    status: i === 0 ? 'Returned' : 'Delivered',
    campaign: 'Gadget Expo',
    ad_id: 'CAMP-004',
    date: new Date(Date.now() - (i * 8) * 3600000).toISOString()
  })),
  // Direct (3)
  ...Array.from({ length: 3 }, (_, i) => ({
    id: 500 + i,
    uid: `ORD-50${500 + i}`,
    customer: 'Direct Customer',
    phone: `013112233${80 + i}`,
    address: 'Mirpur, Dhaka',
    product: 'Various Items',
    price: 1500,
    payment: 'bKash',
    status: 'Delivered',
    campaign: 'Direct Message',
    ad_id: 'DIRECT',
    date: new Date(Date.now() - (i * 12) * 3600000).toISOString()
  }))
];

export const MOCK_CONVERSATIONS = [
  ...MOCK_ORDERS.map(o => ({
    id: o.id,
    fb_customer_name: o.customer,
    ad_name: o.campaign,
    ad_id: o.ad_id,
    status: 'Ordered',
    order_uid: o.uid,
    timestamp: new Date(o.date).getTime(),
    time: '2 hours ago',
    timeBn: '২ ঘণ্টা আগে'
  })),
  // Non-ordering conversations (Leads)
  ...MOCK_ADS.flatMap((ad, adIndex) => {
    const leadCount = 12; // Add some leads for each ad
    return Array.from({ length: leadCount }, (_, i) => ({
      id: 10000 + (adIndex * 100) + i,
      fb_customer_name: `Lead ${adIndex * leadCount + i + 1}`,
      ad_name: ad.name,
      ad_id: ad.id,
      status: i % 3 === 0 ? 'Open' : 'Not Ordered',
      timestamp: Date.now() - (i * 15 + 60) * 600000, // Ensure these are older than orders for demo
      time: `${i + 1} days ago`,
      timeBn: `${toBanglaNumber(i + 1)} দিন আগে`
    }));
  })
];
