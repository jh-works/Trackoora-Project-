import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AdCampaignData {
  name: string;
  spend: number;
  leads: number;
  purchases: number;
  cpl: number;
  cpp: number;
  roas: string;
  clicks: number;
  impressions: number;
  ageBreakdown?: Record<string, { leads: number, purchases: number }>;
  genderBreakdown?: Record<string, { leads: number, purchases: number }>;
}

export const getAdOptimizationSuggestions = async (campaignData: AdCampaignData) => {
  try {
    const prompt = `
      As an expert Meta Ads Strategist for F-commerce (Facebook inbox-only businesses in Bangladesh), analyze the following campaign data and provide 3 specific, researched optimization suggestions.
      
      Business Context: The user runs an inbox-based business. They don't have a website with "Add to Cart". All sales happen in the Messenger/WhatsApp inbox.
      
      Campaign Data:
      - Name: ${campaignData.name}
      - Spend: ৳${campaignData.spend}
      - Leads (Messages): ${campaignData.leads}
      - Purchases: ${campaignData.purchases}
      - Cost Per Lead (CPL): ৳${campaignData.cpl}
      - Cost Per Purchase (CPP): ৳${campaignData.cpp}
      - ROAS: ${campaignData.roas}x
      - Impressions: ${campaignData.impressions}
      
      Demographics (if available):
      ${JSON.stringify(campaignData.ageBreakdown || {})}
      ${JSON.stringify(campaignData.genderBreakdown || {})}

      Requirements:
      1. Provide exactly 3 suggestions.
      2. Suggestions MUST be agentic and based on DEEP analysis of performance ratios (e.g., Lead-to-Purchase conversion rate).
      3. Focus on Inbox conversion, reply speed, script optimization, and specific targeting adjustments.
      4. DO NOT suggest "Add to Cart" or website-related optimizations.
      5. Return the result in the following JSON format:
      [
        { "type": "high" | "medium" | "low", "title": "...", "desc": "..." },
        ...
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              desc: { type: Type.STRING }
            },
            required: ["type", "title", "desc"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error generating ad suggestions:", error);
    return [];
  }
};

export const getAdCreativeAnalysis = async (campaignData: AdCampaignData) => {
  try {
    const prompt = `
      Analyze the creative performance for the following F-commerce ad campaign:
      - Campaign: ${campaignData.name}
      - ROAS: ${campaignData.roas}
      - CTR: ${((campaignData.clicks / campaignData.impressions) * 100).toFixed(2)}%
      
      Provide 2 actionable suggestions for better creatives (images/videos) specifically for the Bangladesh market/F-commerce.
      Return as JSON: [{ "title": "...", "desc": "..." }]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              desc: { type: Type.STRING }
            },
            required: ["title", "desc"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error generating creative analysis:", error);
    return [];
  }
};
