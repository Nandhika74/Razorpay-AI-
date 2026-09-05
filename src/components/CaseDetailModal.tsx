import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  Send,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Mail,
  Smartphone,
  Copy,
  Check,
  Crown,
  HelpCircle,
  Globe,
  Terminal,
  Code2,
} from 'lucide-react';
import { RecoveryCase, SupportedLanguage } from '../types';
import { CustomerPaymentPortalModal } from './CustomerPaymentPortalModal';

interface CaseDetailModalProps {
  caseItem: RecoveryCase | null;
  onClose: () => void;
  onExecuteAction: (caseId: string, actionType: string, customNote?: string) => Promise<void>;
  onGenerateAIOutreach: (caseId: string, channel: string, language: string) => Promise<void>;
  isLoadingAction: boolean;
  priorityRank?: number;
}

export const REGIONAL_LANGUAGES: {
  id: SupportedLanguage;
  label: string;
  nativeLabel: string;
  region: string;
  group: 'global' | 'south' | 'west_east' | 'north';
}[] = [
  { id: 'english', label: 'English', nativeLabel: 'English', region: 'Global & Pan-India Standard', group: 'global' },
  { id: 'tamil', label: 'Tamil', nativeLabel: 'தமிழ்', region: 'Tamil Nadu (Chennai, Coimbatore SaaS Hubs)', group: 'south' },
  { id: 'telugu', label: 'Telugu', nativeLabel: 'తెలుగు', region: 'Telangana & AP (Hyderabad Cyberabad)', group: 'south' },
  { id: 'kannada', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', region: 'Karnataka (Bengaluru Tech Corridor)', group: 'south' },
  { id: 'malayalam', label: 'Malayalam', nativeLabel: 'മലയാളം', region: 'Kerala (Kochi & Trivandrum Startups)', group: 'south' },
  { id: 'marathi', label: 'Marathi', nativeLabel: 'मराठी', region: 'Maharashtra (Mumbai Financial / Pune SaaS)', group: 'west_east' },
  { id: 'bengali', label: 'Bengali', nativeLabel: 'বাংলা', region: 'West Bengal (Kolkata Commercial & Arts Hubs)', group: 'west_east' },
  { id: 'gujarati', label: 'Gujarati', nativeLabel: 'ગુજરાતી', region: 'Gujarat (Ahmedabad & Surat Trade)', group: 'west_east' },
  { id: 'hindi', label: 'Hindi', nativeLabel: 'हिंदी', region: 'North & Central India (Delhi NCR, UP)', group: 'north' },
  { id: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish', region: 'Conversational Metro Mix', group: 'north' },
];

const getAvatarStyle = (name: string) => {
  const palettes = [
    { bg: 'from-indigo-600 to-blue-700', text: 'text-white', ring: 'ring-indigo-200' },
    { bg: 'from-purple-600 to-indigo-700', text: 'text-white', ring: 'ring-purple-200' },
    { bg: 'from-emerald-600 to-teal-700', text: 'text-white', ring: 'ring-emerald-200' },
    { bg: 'from-amber-600 to-orange-700', text: 'text-white', ring: 'ring-amber-200' },
    { bg: 'from-cyan-600 to-blue-600', text: 'text-white', ring: 'ring-cyan-200' },
    { bg: 'from-rose-600 to-pink-700', text: 'text-white', ring: 'ring-rose-200' },
  ];
  const charCode = name ? name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0) : 0;
  return palettes[charCode % palettes.length];
};

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseItem,
  onClose,
  onExecuteAction,
  onGenerateAIOutreach,
  isLoadingAction,
  priorityRank = 1,
}) => {
  if (!caseItem) return null;

  const [activeTab, setActiveTab] = useState<'decision_tree' | 'ai_outreach' | 'audit_trail'>('decision_tree');
  const [outreachChannel, setOutreachChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [outreachLanguage, setOutreachLanguage] = useState<SupportedLanguage>(
    caseItem.customer.preferredLanguage || 'english'
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [recipientMode, setRecipientMode] = useState<'customer' | 'custom'>('customer');
  const [customPhone, setCustomPhone] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [gatewayTransmission, setGatewayTransmission] = useState<{
    receiptId: string;
    timestamp: string;
    channel: 'whatsapp' | 'email' | 'sms';
    destination: string;
    endpoint: string;
    gatewayProvider: string;
    httpStatus: number;
    payload: any;
  } | null>(null);
  const [isCustomerPortalOpen, setIsCustomerPortalOpen] = useState(false);

  // Automatically synchronize tone & language to customer's registered preference whenever caseItem changes
  React.useEffect(() => {
    if (caseItem?.customer?.preferredLanguage) {
      setOutreachLanguage(caseItem.customer.preferredLanguage);
    } else {
      setOutreachLanguage('english');
    }
    setGatewayTransmission(null);
  }, [caseItem?.id, caseItem?.customer?.preferredLanguage]);

  const isHardDecline = caseItem.classification.zone === 'NEVER_RETRY';

  const handleAction = async (actionType: string, note?: string) => {
    setActionError(null);
    try {
      await onExecuteAction(caseItem.id, actionType, note);
    } catch (err: any) {
      setActionError(err.message || 'Action blocked by compliance rules');
    }
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setActionError(null);
    try {
      await onGenerateAIOutreach(caseItem.id, outreachChannel, outreachLanguage);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Comprehensive Authentic Multi-Regional Language Templates
  const getLanguageTemplateBody = (lang: SupportedLanguage): string => {
    const link = `https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}`;
    const replaceLink = `https://rzp.io/l/replace_mandate_${caseItem.id.toLowerCase()}`;
    const name = caseItem.customer.name;
    const plan = caseItem.customer.planName;
    const amountStr = `₹${caseItem.customer.amountINR.toLocaleString('en-IN')}`;
    const reason = caseItem.failureEvent.decline.reason;

    switch (lang) {
      case 'tamil':
        return isHardDecline
          ? `வணக்கம் ${name}!\n\nஉங்கள் ${plan} சந்தா கட்டணம் (${amountStr}) வங்கி கார்டு ரத்து செய்யப்பட்டதால் நிறுத்தப்பட்டுள்ளது.\n\nசேவை தடையின்றி தொடர, புதிய கட்டண முறையை சேர்க்க இந்த பாதுகாப்பான 1-க்ளிக் இணைப்பை பயன்படுத்தவும்:\n\n👉 ${replaceLink}\n\nஉதவிக்கு எங்களை தொடர்பு கொள்ளலாம். - Team Razorpay Support`
          : `வணக்கம் ${name}! 🙏\n\nஉங்கள் ${plan} சந்தா புதுப்பித்தல் (${amountStr}) தற்காலிக வங்கி சரிபார்ப்புக் காரணத்தால் (${reason}) நிறைவடையவில்லை.\n\nஉங்கள் சேவை தடையின்றி தொடர, இந்த பாதுகாப்பான 1-க்ளிக் இணைப்பு மூலம் சரிசெய்யவும்:\n\n👉 ${link}\n\nஏதேனும் உதவி தேவையா? இந்த செய்திக்கு பதிலளிக்கவும். - Team Razorpay Support`;

      case 'telugu':
        return isHardDecline
          ? `నమస్కారం ${name}!\n\nమీ ${plan} చందా (${amountStr}) బ్యాంక్ కార్డ్ రద్దు కావడం వల్ల ఆగిపోయింది.\n\nసేవలు నిరంతరంగా కొనసాగేందుకు, దయచేసి కొత్త కార్డ్ నమోదు చేయండి:\n\n👉 ${replaceLink}\n\n- Team Razorpay Support`
          : `నమస్కారం ${name}! 🙏\n\nమీ ${plan} పునరావృత చెల్లింపు (${amountStr}) తాత్కాలిక బ్యాంక్ కారణం (${reason}) వల్ల పూర్తి కాలేదు.\n\nసేవలు అంతరాయం లేకుండా ఉండటానికి 1-క్లిక్ లింక్ ద్వారా పునరుద్ధరించండి:\n\n👉 ${link}\n\nఏదైనా సహాయం కావాలా? ఈ సందేశానికి ప్రత్యుత్తరం ఇవ్వండి. - Team Razorpay Support`;

      case 'kannada':
        return isHardDecline
          ? `ನಮಸ್ಕಾರ ${name}!\n\nನಿಮ್ಮ ${plan} ಚಂದಾದಾರಿಕೆ ಪಾವತಿಯು (${amountStr}) ಬ್ಯಾಂಕ್ ಕಾರ್ಡ್ ರದ್ದತಿಯ ಕಾರಣ ಸ್ಥಗಿತಗೊಂಡಿದೆ.\n\nಸೇವೆ ಮುಂದುವರಿಸಲು, ದಯವಿಟ್ಟು ಹೊಸ ಪಾವತಿ ವಿಧಾನವನ್ನು ಸೇರಿಸಿ:\n\n👉 ${replaceLink}\n\n- Team Razorpay Support`
          : `ನಮಸ್ಕಾರ ${name}! 🙏\n\nನಿಮ್ಮ ${plan} ಚಂದಾದಾರಿಕೆ ಪಾವತಿಯು (${amountStr}) ಬ್ಯಾಂಕ್ ಪ್ರಕ್ರಿಯೆಯ ಕಾರಣದಿಂದ (${reason}) ಪೂರ್ಣಗೊಂಡಿಲ್ಲ.\n\nನಿಮ್ಮ ಸೇವೆ ತಡೆರಹಿತವಾಗಿ ಮುಂದುವರಿಯಲು, ದಯವಿಟ್ಟು 1-ಕ್ಲಿಕ್ ಲಿಂಕ್ ಬಳಸಿ ನವೀಕರಿಸಿ:\n\n👉 ${link}\n\nಸಹಾಯ ಬೇಕಿದ್ದಲ್ಲಿ ಉತ್ತರಿಸಿ. - Team Razorpay Support`;

      case 'malayalam':
        return isHardDecline
          ? `നമസ്കാരം ${name}!\n\nനിങ്ങളുടെ ${plan} സബ്സ്ക്രിപ്ഷൻ പേയ്മെന്റ് (${amountStr}) ബാങ്ക് കാർഡ് റദ്ദാക്കപ്പെട്ടതിനാൽ നിർത്തിവെച്ചിരിക്കുന്നു.\n\nസേവനം തുടരാൻ, ദയവായി പുതിയ പേയ്മെന്റ് രീതി നൽകുക:\n\n👉 ${replaceLink}\n\n- Team Razorpay Support`
          : `നമസ്കാരം ${name}! 🙏\n\nനിങ്ങളുടെ ${plan} സബ്സ്ക്രിപ്ഷൻ പേയ്മെന്റ് (${amountStr}) ബാങ്ക് പ്രോസസ്സിംഗ് കാരണം (${reason}) പൂർത്തിയായില്ല.\n\nസേവനം തടസ്സമില്ലാതെ തുടരാൻ, ഈ 1-ക്ലിക്ക് ലിങ്ക് വഴി പേയ്മെന്റ് പുതുക്കുക:\n\n👉 ${link}\n\nസഹായം ആവശ്യമെങ്കിൽ മറുപടി നൽകുക. - Team Razorpay Support`;

      case 'marathi':
        return isHardDecline
          ? `नमस्कार ${name}!\n\nतुमचे ${plan} वर्गणीचे पेमेंट (${amountStr}) बँक कार्ड निष्क्रिय झाल्यामुळे थांबवले गेले आहे.\n\nअखंड सेवेसाठी, कृपया या 1-क्लिक लिंकद्वारे नवीन पेमेंट पद्धत जोडा:\n\n👉 ${replaceLink}\n\n- Team Razorpay Support`
          : `नमस्कार ${name}! 🙏\n\nतुमचे ${plan} वर्गणीचे पेमेंट (${amountStr}) तात्पुरत्या बँक समस्येमुळे (${reason}) पूर्ण होऊ शकले नाही.\n\nअखंड सेवेसाठी, कृपया या सुरक्षित 1-क्लिक लिंकद्वारे पेमेंट पद्धत अपडेट करा:\n\n👉 ${link}\n\nमदतीसाठी या मेसेजला रिप्लाय करा. - Team Razorpay Support`;

      case 'bengali':
        return isHardDecline
          ? `নমস্কার ${name}!\n\nআপনার ${plan} সাবস্ক্রিপশন পেমেন্ট (${amountStr}) ব্যাংক কার্ড নিষ্ক্রিয় হওয়ার কারণে স্থগিত করা হয়েছে।\n\nপরিষেবাটি চালু রাখতে, অনুগ্রহ করে নতুন পেমেন্ট মাধ্যম যুক্ত করুন:\n\n👉 ${replaceLink}\n\n- Team Razorpay Support`
          : `নমস্কার ${name}! 🙏\n\nআপনার ${plan} সাবস্ক্রিপশন পেমেন্ট (${amountStr}) সাময়িক ব্যাংক ভেরিফিকেশনের কারণে (${reason}) সফল হয়নি।\n\nপরিষেবাটি চালু রাখতে, অনুগ্রহ করে এই নিরাপদ ১-ক্লিক লিংকের মাধ্যমে আপডেট করুন:\n\n👉 ${link}\n\nসাহায্যের জন্য উত্তর দিন। - Team Razorpay Support`;

      case 'gujarati':
        return isHardDecline
          ? `નમસ્તે ${name}!\n\nતમારા ${plan} સબ્સ્ક્રિપ્શન પેમેન્ટ (${amountStr}) બેંક કાર્ડ રદ થવાને કારણે અટકી ગયું છે.\n\nસેવા ચાલુ રાખવા માટે, કૃપા કરીને આ લિંક પરથી નવું કાર્ડ ઉમેરો:\n\n👉 ${replaceLink}\n\n- Team Razorpay Support`
          : `નમસ્તે ${name}! 🙏\n\nતમારા ${plan} સબ્સ્ક્રિપ્શન પેમેન્ટ (${amountStr}) બેંક અધિકૃતતા કારણે (${reason}) પૂર્ણ થઈ શક્યું નથી.\n\nઅવિરત સેવા માટે કૃપા કરીને આ 1-ક્લિક લિંકથી પેમેન્ટ અપડેટ કરો:\n\n👉 ${link}\n\nમદદ માટે આ મેસેજનો જવાબ આપો. - Team Razorpay Support`;

      case 'hindi':
        return isHardDecline
          ? `नमस्ते ${name},\n\nआपकी ${plan} सदस्यता (${amountStr}) का नवीनीकरण पूरा नहीं हो पाया क्योंकि आपके बैंक द्वारा कार्ड निष्क्रिय रिपोर्ट किया गया है।\n\nअपनी सेवा को बिना किसी रुकावट के जारी रखने के लिए, कृपया नीचे दिए गए सुरक्षित 1-क्लिक लिंक से नया भुगतान माध्यम जोड़ें:\n\n👉 ${replaceLink}\n\nहमारी सहायता टीम 24x7 उपलब्ध है। - Team Razorpay Support`
          : `नमस्ते ${name}! 🙏\n\nआपकी ${plan} सदस्यता (${amountStr}) का स्वतः भुगतान बैंक प्रमाणीकरण (${reason}) के कारण पूरा नहीं हो पाया।\n\nअपनी सेवा को बिना किसी रुकावट के जारी रखने के लिए, कृपया नीचे दिए गए सुरक्षित 1-क्लिक लिंक से भुगतान विधि अपडेट करें:\n\n👉 ${link}\n\nकिसी भी सहायता के लिए आप इस संदेश का उत्तर दे सकते हैं। - Team Razorpay Support`;

      case 'hinglish':
        return isHardDecline
          ? `Namaste ${name}! 👋\n\nAapka ${plan} subscription (${amountStr}) card issuer ke inactive report ki wajah se pause ho gaya hai.\n\nBina kisi interruption ke access continue rakhne ke liye, please neeche diye link se 1-click me replacement card set karein:\n\n👉 ${replaceLink}\n\nTeam Razorpay Support`
          : `Namaste ${name}! 👋\n\nAapka ${plan} subscription (${amountStr}) ka payment bank processing glitch ki wajah se complete nahi ho paya.\n\nAapki service bina kisi interruption ke continuous rahe, iske liye please neeche diye link se 1-click me payment refresh ya card update karein:\n\n👉 ${link}\n\nKoi help chahiye ho toh reply karein. Team Razorpay Support`;

      case 'english':
      default:
        return isHardDecline
          ? `Hi ${name},\n\nWe noticed your recurring subscription payment for ${plan} (${amountStr}) was halted because the payment card on file has been reported inactive/cancelled by your issuing bank.\n\nTo keep your access uninterrupted, please set up a replacement payment method here:\n\n👉 ${replaceLink}\n\nOur support team is also on standby to assist you directly. - Team Razorpay Support`
          : `Hi ${name},\n\nYour recurring subscription payment for ${plan} (${amountStr}) couldn't be processed due to a temporary bank authorization notice (${reason}).\n\nTo ensure your service remains uninterrupted, please refresh your payment method via this secure 1-click link:\n\n👉 ${link}\n\nNeed assistance? Reply to this message anytime. - Team Razorpay Support`;
    }
  };

  // Dynamic message body that automatically adapts to the selected/preferred language immediately
  const currentMessageBody =
    caseItem.outreachDraft && caseItem.outreachDraft.language === outreachLanguage
      ? caseItem.outreachDraft.messageBody
      : getLanguageTemplateBody(outreachLanguage);

  const activeTargetPhone = recipientMode === 'custom' && customPhone ? customPhone : caseItem.customer.phone;
  const activeTargetEmail = recipientMode === 'custom' && customEmail ? customEmail : caseItem.customer.email;

  // Intelligent Phone Normalization: If 10 digits (like 9994791779), prepend India country code 91!
  let cleanPhoneDigits = activeTargetPhone.replace(/[^0-9]/g, '');
  if (cleanPhoneDigits.length === 10) {
    cleanPhoneDigits = `91${cleanPhoneDigits}`;
  }

  const emailSubject = `Action Required: Renewal of ${caseItem.customer.planName} Subscription (₹${caseItem.customer.amountINR.toLocaleString('en-IN')})`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(currentMessageBody)}`;
  const mailtoUrl = `mailto:${activeTargetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(currentMessageBody)}`;
  const smsUrl = `sms:+${cleanPhoneDigits}?body=${encodeURIComponent(currentMessageBody)}`;

  const handleSimulateDispatch = async () => {
    const actionToTake = caseItem.status === 'RECOVERED' ? 'TEST_DISPATCH' : 'DISPATCH_COMMUNICATION';
    const destination = outreachChannel === 'email' ? activeTargetEmail : activeTargetPhone;
    const receiptNum = `ACK-${Math.floor(100000 + Math.random() * 900000)}`;
    const note = `Dispatched via ${outreachChannel.toUpperCase()} Gateway (${outreachLanguage}) to ${destination} [Receipt #${receiptNum}]`;

    await handleAction(actionToTake, note);

    const endpoints = {
      whatsapp: 'https://api.razorpay.com/v1/subscriptions/notifications/whatsapp',
      email: 'https://api.razorpay.com/v1/subscriptions/notifications/email',
      sms: 'https://api.razorpay.com/v1/subscriptions/notifications/sms',
    };

    const providers = {
      whatsapp: 'WhatsApp Business Cloud API (Meta Graph v19.0)',
      email: 'Razorpay Transactional Email Engine (AWS SES / SendGrid Enterprise)',
      sms: 'Karix / Gupshup DLT Compliant Telco Gateway',
    };

    setGatewayTransmission({
      receiptId: receiptNum,
      timestamp: new Date().toLocaleTimeString(),
      channel: outreachChannel,
      destination,
      endpoint: endpoints[outreachChannel],
      gatewayProvider: providers[outreachChannel],
      httpStatus: 200,
      payload: {
        event: 'subscription.recovery.dispatched',
        subscription_id: caseItem.id,
        mandate_id: caseItem.customer.mandateId,
        channel: outreachChannel,
        language: outreachLanguage,
        recipient: destination,
        amount: caseItem.customer.amountINR,
        recovery_url: `https://rzp.io/l/mandate_ref_${caseItem.id.toLowerCase()}`,
        dispatch_status: 'QUEUED_FOR_DELIVERY',
        receipt_id: receiptNum,
      },
    });
  };

  return (
    <div id="case-detail-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div id="case-detail-modal" className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Stylized Dynamic Avatar */}
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarStyle(caseItem.customer.name).bg} text-white flex items-center justify-center font-black text-lg shadow-sm ring-2 ${getAvatarStyle(caseItem.customer.name).ring}`}>
                {caseItem.customer.name.charAt(0)}
              </div>
              {(caseItem.customer.tenureMonths >= 12 || caseItem.customer.riskTier === 'low_risk_vip') && (
                <div 
                  title="VIP Customer (Loyal Subscriber)"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center shadow-xs"
                >
                  <Crown className="w-3 h-3 text-amber-900" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-900 text-lg">{caseItem.customer.name}</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  #{caseItem.id}
                </span>

                {/* Queue Rank Badge */}
                <span className={`text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold border flex items-center gap-1 ${
                  priorityRank === 1 ? 'bg-amber-100 text-amber-900 border-amber-300' :
                  priorityRank <= 3 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <span>Rank #{priorityRank}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">in queue</span>
                </span>

                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
                  {caseItem.batchSplit === 'held_out' ? 'Held-Out Split' : 'Design Split'}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
                <span className="text-slate-600 font-semibold">{caseItem.customer.email}</span>
                <span>•</span>
                <span>{caseItem.customer.phone}</span>
                <span>•</span>
                <span className="text-slate-800 font-bold">{caseItem.customer.planName} (₹{caseItem.customer.amountINR.toLocaleString('en-IN')})</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 text-[11px]">
                  {Math.round(caseItem.customer.historicalSuccessRate * 100)}% Baseline Reliability
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-close-case-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-100 px-6 flex space-x-8 text-xs font-bold bg-white">
          <button
            id="tab-btn-decision-tree"
            onClick={() => setActiveTab('decision_tree')}
            className={`py-3.5 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'decision_tree'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 font-semibold'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4-Stage Decision & Compliance</span>
          </button>
          <button
            id="tab-btn-ai-outreach"
            onClick={() => setActiveTab('ai_outreach')}
            className={`py-3.5 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'ai_outreach'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 font-semibold'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Smart Outreach Synthesizer</span>
          </button>
          <button
            id="tab-btn-audit-trail"
            onClick={() => setActiveTab('audit_trail')}
            className={`py-3.5 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'audit_trail'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 font-semibold'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Immutable Audit Trail ({caseItem.auditTrail.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#f8fafc] space-y-5">
          {/* Action Error Notification */}
          {actionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start space-x-3 shadow-sm animate-shake">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-xs uppercase tracking-wider text-rose-900 block mb-0.5">
                  Scheme Compliance Circuit Breaker Triggered
                </span>
                <p className="text-xs text-rose-800 font-medium leading-relaxed">{actionError}</p>
              </div>
              <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-700 text-xs font-bold">
                Dismiss
              </button>
            </div>
          )}

          {/* Hard Decline Permanent Circuit Breaker Banner */}
          {isHardDecline && (
            <div className="p-4 rounded-2xl bg-rose-900 text-white flex items-start space-x-3.5 shadow-lg border border-rose-950">
              <div className="w-6 h-6 rounded-xl bg-rose-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                🛑
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs uppercase tracking-widest text-rose-200">
                    Mandatory Scheme Hard Stop Enforced (MAC 21 / Stolen Card)
                  </span>
                  <span className="bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    0 Retries Allowed
                  </span>
                </div>
                <p className="text-xs text-rose-100 font-medium leading-relaxed">
                  This payment instrument is permanently deactivated ({caseItem.failureEvent.decline.reason}). All automated retries, customer 1-click debit links, and recovery dunning are strictly blocked to protect your MID from Visa/Mastercard VMMP fines ($5,000–$75,000/mo).
                </p>
                <p className="text-[11px] text-rose-300 font-semibold">
                  Compliant Path: Route case to Customer Success to guide customer through onboarding a brand new payment method.
                </p>
              </div>
            </div>
          )}

          {/* Settled / Recovered Banner */}
          {caseItem.status === 'RECOVERED' && (
            <div className="p-4 rounded-2xl bg-emerald-900 text-white flex items-start space-x-3.5 shadow-lg border border-emerald-950">
              <div className="w-6 h-6 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                ✓
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-widest text-emerald-200">
                    Terminal State: Payment Settled & Revenue Captured
                  </span>
                  <span className="bg-emerald-800 text-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                    ₹{caseItem.customer.amountINR.toLocaleString('en-IN')} Secured
                  </span>
                </div>
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  Method: {caseItem.recoveryMethod || 'Direct Authorization'}. Invoice is fully resolved. All dunning and retry actions are locked to prevent double-billing and customer friction.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: DECISION TREE & COMPLIANCE */}
          {activeTab === 'decision_tree' && (
            <div className="space-y-5">
              {/* Context Diagnostic Summary: Baseline vs Failure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Customer Baseline */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
                    Customer Baseline Context (Stage 1)
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Historical Reliability:</span>
                      <span className="font-bold text-slate-800">{Math.round(caseItem.customer.historicalSuccessRate * 100)}% Success Rate</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Tenure & History:</span>
                      <span className="font-bold text-slate-800">{caseItem.customer.tenureMonths} mos ({caseItem.customer.successfulHistoricalPayments}/{caseItem.customer.totalHistoricalPayments} paid)</span>
                    </div>
                    <div className="py-1.5 border-b border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Surprise Index:</span>
                        <span className={`font-bold ${caseItem.diagnosis.isAnomalousBlip ? 'text-amber-700' : 'text-slate-700'}`}>
                          {Math.round(caseItem.diagnosis.surpriseScore * 100)}% {caseItem.diagnosis.isAnomalousBlip ? '(Isolated Blip)' : '(Chronic Friction)'}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                        {caseItem.classification.isHardDecline ? (
                          <span className="text-rose-600 font-semibold">0.0 (Hard Decline Override)</span>
                        ) : (
                          <span>
                            {caseItem.customer.historicalSuccessRate.toFixed(2)} × min({caseItem.customer.tenureMonths}/12, 1) × (1 - {Math.max(0, caseItem.customer.totalHistoricalPayments - caseItem.customer.successfulHistoricalPayments)}/10) = <strong className="text-slate-700">{caseItem.diagnosis.surpriseScore.toFixed(2)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Card & Mandate:</span>
                      <span className="font-mono font-bold text-slate-700">{caseItem.customer.cardNetwork} •••• {caseItem.customer.cardLast4}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Razorpay Decline Event */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
                    Raw Razorpay Decline Signal (Stage 2)
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Error Reason:</span>
                      <span className="font-bold text-rose-700 font-mono">{caseItem.failureEvent.decline.reason}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Razorpay Error Code:</span>
                      <span className="font-mono text-slate-800 text-xs font-semibold">{caseItem.failureEvent.decline.code}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Triage Zone:</span>
                      <span className="font-bold text-indigo-600">{caseItem.classification.zone}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Hard Decline Stop:</span>
                      <span className={`font-bold ${caseItem.classification.isHardDecline ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {caseItem.classification.isHardDecline ? 'YES (0 Retries Allowed)' : 'NO (Recoverable Soft Decline)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 1 Diagnosis Reasoning Callout */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-start space-x-3 shadow-2xs">
                <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  i
                </div>
                <div>
                  <span className="font-bold text-indigo-900 block mb-0.5">Context Diagnosis Summary:</span>
                  <p className="text-indigo-800 leading-relaxed font-medium">{caseItem.diagnosis.explanation}</p>
                </div>
              </div>

              {/* Stage 3 & 4 Dual Outputs + Network Ceilings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Likelihood */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Recovery Likelihood
                  </span>
                  <div className="text-3xl font-black text-emerald-600 my-1">
                    {caseItem.trendScore.recoveryLikelihoodPct}%
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {isHardDecline ? (
                      'Terminal 0% (Hard Decline Lock)'
                    ) : caseItem.classification.zone === 'RETRY_SOON' ? (
                      `${caseItem.diagnosis.isAnomalousBlip ? '92% (Blip Base)' : '78% (Gateway Base)'}${caseItem.customer.riskTier === 'low_risk_vip' ? ' + 8% (VIP)' : caseItem.customer.riskTier === 'high_churn_risk' ? ' - 18% (Risk)' : ''}`
                    ) : caseItem.classification.zone === 'RETRY_LATER' ? (
                      `${caseItem.diagnosis.isAnomalousBlip ? '84% (Blip Base)' : '58% (Liquidity Base)'}${caseItem.customer.riskTier === 'low_risk_vip' ? ' + 8% (VIP)' : caseItem.customer.riskTier === 'high_churn_risk' ? ' - 18% (Risk)' : ''}`
                    ) : (
                      `${caseItem.customer.tenureMonths > 6 ? '74% (Tenured)' : '62% (New)'}${caseItem.customer.riskTier === 'low_risk_vip' ? ' + 8% (VIP)' : caseItem.customer.riskTier === 'high_churn_risk' ? ' - 18% (Risk)' : ''}`
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Zone Baseline + Risk Tier Modifier</p>
                </div>

                {/* Priority Rank & Triage Score */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Queue Priority Rank & Triage Score
                  </span>
                  
                  {/* Big Rank Badge + Composite Score */}
                  <div className="flex items-center justify-center gap-2 my-1">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-xl font-mono text-2xl font-black border ${
                      priorityRank === 1 ? 'bg-amber-100 text-amber-900 border-amber-300' :
                      priorityRank <= 3 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                      'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      #{priorityRank}
                    </span>
                    <span className="text-xl font-bold text-slate-400">
                      ({caseItem.trendScore.recoveryPriorityScore} pts)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-700 font-semibold">
                    ₹{caseItem.customer.amountINR.toLocaleString('en-IN')} · {Math.min(60, Math.round((caseItem.customer.amountINR / 8000) * 60))}pts Value + {caseItem.classification.isHardDecline ? 0 : Math.min(40, Math.round((14 - Math.max(1, caseItem.trendScore.daysRemainingInDunning)) * (40 / 13)))}pts Urgency
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Queue order = Revenue at Stake × Likelihood ({caseItem.trendScore.recoveryLikelihoodPct}%) × Urgency
                  </p>
                </div>

                {/* Network Compliance Meter */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    {caseItem.compliance.network} 30D Limit*
                  </span>
                  <div className={`text-3xl font-black my-1 ${isHardDecline ? 'text-rose-600' : caseItem.compliance.isCeilingReached ? 'text-amber-600' : 'text-slate-800'}`}>
                    {caseItem.compliance.attemptCount} / {caseItem.compliance.maxAllowedAttempts}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isHardDecline 
                      ? 'Hard Stop (0 retries permitted)'
                      : caseItem.compliance.isCeilingReached 
                      ? 'Ceiling reached — Escalated to CS' 
                      : `${caseItem.compliance.attemptsRemaining} retry attempts remaining`}
                  </p>
                  <p className="text-[9.5px] text-slate-400 italic mt-1 leading-tight">
                    *Per published network merchant guidelines
                  </p>
                </div>
              </div>

              {/* Action Simulator Panel */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">
                    Pipeline Execution Controls
                  </h3>
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    Current Status: <span className="font-bold text-slate-800">{caseItem.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Action 1: Smart Retry */}
                  <button
                    id="btn-action-smart-retry"
                    onClick={() => handleAction('SMART_RETRY')}
                    disabled={isLoadingAction || caseItem.compliance.isCeilingReached || isHardDecline || caseItem.status === 'RECOVERED'}
                    className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-bold text-xs transition-colors flex flex-col items-center justify-center space-y-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-center shadow-2xs"
                  >
                    <Zap className="w-5 h-5 text-indigo-600" />
                    <span>Execute Smart Retry</span>
                    <span className="text-[10px] text-indigo-600 font-normal">
                      {isHardDecline ? '🛑 Blocked (Hard Decline)' : 'Silent gateway / scheme re-auth'}
                    </span>
                  </button>

                  {/* Action 2: Simulate Customer 1-Click Link Pay */}
                  <button
                    id="btn-action-simulate-customer-pay"
                    onClick={() => handleAction('SIMULATE_CUSTOMER_PAY')}
                    disabled={isLoadingAction || isHardDecline || caseItem.status === 'RECOVERED'}
                    className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors flex flex-col items-center justify-center space-y-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-center shadow-2xs"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Simulate 1-Click Pay</span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      {isHardDecline ? '🛑 Blocked (Invalid Instrument)' : 'Customer authorizes via WhatsApp/SMS'}
                    </span>
                  </button>

                  {/* Action 3: Human CS Escalation */}
                  <button
                    id="btn-action-escalate-human"
                    onClick={() => handleAction('ESCALATE_HUMAN')}
                    disabled={isLoadingAction || caseItem.status === 'HANDED_OFF_CEILING' || caseItem.status === 'RECOVERED'}
                    className={`p-4 rounded-xl border font-bold text-xs transition-colors flex flex-col items-center justify-center space-y-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-center shadow-2xs ${
                      isHardDecline
                        ? 'border-indigo-500 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                        : 'border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900'
                    }`}
                  >
                    <UserCheck className={`w-5 h-5 ${isHardDecline ? 'text-white' : 'text-amber-700'}`} />
                    <span>{isHardDecline ? 'Escalate for Card Swap' : 'Escalate to CS Rep'}</span>
                    <span className={`text-[10px] font-normal ${isHardDecline ? 'text-indigo-100' : 'text-amber-800'}`}>
                      {isHardDecline ? 'Compliant handoff for new mandate' : 'Clean handoff without retry spam'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI OUTREACH GENERATOR */}
          {activeTab === 'ai_outreach' && (
            <div className="space-y-4">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                {/* Header & Gemini Action */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">Autonomous Recovery Outreach Hub</h3>
                      <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Powered by Gemini 3.7 Flash</span>
                      </span>
                      {caseItem.outreachDraft && caseItem.outreachDraft.language === outreachLanguage ? (
                        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          ✨ AI Personalized Draft Active
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                          ⚡ Instant Regional Template Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
                      <strong>Why synthesize with Gemini?</strong> Standard banking templates use rigid, generic copy. Gemini 3.7 Flash reads the customer's <strong>{caseItem.customer.tenureMonths}-month tenure</strong>, payment reliability, and exact decline reason (<code>{caseItem.failureEvent.decline.reason}</code>) to craft an empathetic recovery message that protects customer goodwill.
                    </p>
                  </div>
                  <button
                    id="btn-generate-ai-outreach"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                    title="Generate an empathetic AI-customized message tailored specifically to this customer's profile"
                  >
                    <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAI ? 'Synthesizing with Gemini...' : 'Synthesize with Gemini'}</span>
                  </button>
                </div>

                {/* STEP 1: Delivery Channel Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                      <span>Delivery Channel & Format</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Select where to dispatch outreach</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* WhatsApp Option */}
                    <button
                      type="button"
                      onClick={() => setOutreachChannel('whatsapp')}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        outreachChannel === 'whatsapp'
                          ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-2 ring-emerald-200/50'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${outreachChannel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-xs text-slate-900">WhatsApp</span>
                        </div>
                        {outreachChannel === 'whatsapp' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Highest engagement in India (85%+ open rate). Direct 1-click mandate recovery link.
                      </p>
                    </button>

                    {/* Email Option */}
                    <button
                      type="button"
                      onClick={() => setOutreachChannel('email')}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        outreachChannel === 'email'
                          ? 'bg-indigo-50/80 border-indigo-400 shadow-sm ring-2 ring-indigo-200/50'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${outreachChannel === 'email' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Mail className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-xs text-slate-900">Email Notice</span>
                        </div>
                        {outreachChannel === 'email' && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Formal B2B / SaaS invoice notice. Prefilled subject, body, and invoice breakdown.
                      </p>
                    </button>

                    {/* SMS Link Option */}
                    <button
                      type="button"
                      onClick={() => setOutreachChannel('sms')}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        outreachChannel === 'sms'
                          ? 'bg-purple-50/80 border-purple-400 shadow-sm ring-2 ring-purple-200/50'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${outreachChannel === 'sms' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-xs text-slate-900">SMS Notice</span>
                        </div>
                        {outreachChannel === 'sms' && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Instant telecom fallback. Telecom Regulatory Authority (TRAI) DLT compliant link.
                      </p>
                    </button>
                  </div>
                </div>

                {/* STEP 2: Regional Language Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                      <span>Regional Script & Language Localization</span>
                    </span>
                    {caseItem.customer.preferredLanguage && (
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold self-start sm:self-auto">
                        📍 Customer Registered Preference:{' '}
                        {REGIONAL_LANGUAGES.find((l) => l.id === caseItem.customer.preferredLanguage)?.nativeLabel || 'English'} ({caseItem.customer.preferredLanguage})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    Razorpay powers businesses across India’s major economic and technological hubs. Choose the native language matching your customer's location:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {REGIONAL_LANGUAGES.map((lang) => {
                      const isSelected = outreachLanguage === lang.id;
                      const isCustomerDefault = caseItem.customer.preferredLanguage === lang.id;

                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setOutreachLanguage(lang.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs">{lang.label}</span>
                            <span className={`text-[11px] font-semibold ${isSelected ? 'text-indigo-300' : 'text-indigo-600'}`}>
                              {lang.nativeLabel}
                            </span>
                          </div>
                          <span className={`text-[9.5px] mt-1 leading-tight line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {lang.region.split('(')[0]}
                          </span>
                          {isCustomerDefault && (
                            <span className={`text-[8.5px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.2 rounded ${
                              isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              Default Match
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 3: Recipient Contact Details */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                      <span>Target Recipient Contact</span>
                    </span>
                    <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setRecipientMode('customer')}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          recipientMode === 'customer'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Customer on File
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientMode('custom')}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          recipientMode === 'custom'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Test My Own Contact
                      </button>
                    </div>
                  </div>

                  {recipientMode === 'customer' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2.5">
                        <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Phone (WhatsApp / SMS):</span>
                          <span className="font-mono font-bold text-slate-800">{caseItem.customer.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Email Address:</span>
                          <span className="font-mono font-bold text-slate-800">{caseItem.customer.email}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Your Mobile / WhatsApp Number:</label>
                          <input
                            type="text"
                            value={customPhone}
                            onChange={(e) => setCustomPhone(e.target.value)}
                            placeholder="e.g. 9994791779 or +91 99947 91779"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Your Email Address:</label>
                          <input
                            type="email"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      {cleanPhoneDigits && (
                        <div className="text-[11px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center justify-between">
                          <span>✓ Auto-formatted WhatsApp Target: <strong>+{cleanPhoneDigits}</strong></span>
                          <span className="text-[10px] text-emerald-600">Pre-validated with country code</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* STEP 4: Live Message Preview */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                      <span>Formatted {outreachChannel === 'email' ? 'Email' : outreachChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} Preview</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentMessageBody)}
                      className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>

                  {/* Channel-Specific Authentic Live Mockups */}
                  {outreachChannel === 'email' ? (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      {/* Email Header */}
                      <div className="bg-slate-100 p-3.5 border-b border-slate-200 text-xs space-y-1.5 font-sans">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-bold text-slate-700">From:</span>
                          <span className="font-mono text-slate-600">Razorpay Billing & Mandates &lt;billing-notifications@razorpay.com&gt;</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-bold text-slate-700">To:</span>
                          <span className="font-mono text-indigo-700 font-semibold">{activeTargetEmail}</span>
                        </div>
                        <div className="flex items-start justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                          <span className="font-bold text-slate-700 shrink-0 mr-2">Subject:</span>
                          <span className="font-bold text-slate-800 text-left flex-1">{emailSubject}</span>
                        </div>
                      </div>
                      {/* Email Body */}
                      <div className="p-5 bg-white font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {currentMessageBody}
                      </div>
                    </div>
                  ) : outreachChannel === 'whatsapp' ? (
                    <div className="rounded-2xl border border-emerald-200 bg-[#EFEAE2] p-4 shadow-inner">
                      <div className="flex items-center space-x-2 pb-2 mb-3 border-b border-slate-300/60 text-xs">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                          R
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            Razorpay Verified Business <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Recipient: +{cleanPhoneDigits}</span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl rounded-tl-xs shadow-sm max-w-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {currentMessageBody}
                        <div className="text-right text-[10px] text-slate-400 mt-2 font-mono">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-purple-200 bg-slate-50 p-4 shadow-inner">
                      <div className="flex items-center space-x-2 pb-2 mb-3 border-b border-slate-200 text-xs">
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>Mobile Messaging App</span>
                            <span className="text-[10px] font-mono bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">Sender ID: RZP-NOTIFY</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Recipient: +{cleanPhoneDigits}</span>
                        </div>
                      </div>
                      <div className="bg-purple-600 text-white p-4 rounded-2xl rounded-tr-xs shadow-sm max-w-xl text-xs whitespace-pre-wrap leading-relaxed">
                        {currentMessageBody}
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>TRAI DLT Entity ID: 17011591234857</span>
                        <span>Length: {currentMessageBody.length} chars (Unicode Regional Script)</span>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: Clear, Non-Redundant Dispatch Actions */}
                  <div className="pt-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* 1. Direct App Dispatch based on Channel */}
                      {outreachChannel === 'email' && (
                        <a
                          href={mailtoUrl}
                          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-colors"
                        >
                          <Mail className="w-4 h-4 mr-1.5" />
                          <span>Send via Email Client ({activeTargetEmail})</span>
                          <ExternalLink className="w-3 h-3 ml-1.5 opacity-80" />
                        </a>
                      )}

                      {outreachChannel === 'whatsapp' && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          <span>Send via WhatsApp (+{cleanPhoneDigits})</span>
                          <ExternalLink className="w-3 h-3 ml-1.5 opacity-80" />
                        </a>
                      )}

                      {outreachChannel === 'sms' && (
                        <div className="flex items-center space-x-2">
                          <a
                            href={smsUrl}
                            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200 transition-colors"
                          >
                            <Smartphone className="w-4 h-4 mr-1.5" />
                            <span>Send via SMS App (+{cleanPhoneDigits})</span>
                            <ExternalLink className="w-3 h-3 ml-1.5 opacity-80" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentMessageBody)}
                            className="inline-flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Copy SMS text to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            <span>{copiedLink ? 'Copied!' : 'Copy Text'}</span>
                          </button>
                        </div>
                      )}

                      {/* 2. Automated Server Gateway Webhook Dispatch */}
                      <button
                        type="button"
                        id="btn-simulate-gateway-webhook"
                        onClick={handleSimulateDispatch}
                        disabled={isLoadingAction}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm shadow-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Simulate autonomous server-to-server gateway API dispatch via Razorpay"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                        <span>Dispatch via Razorpay Gateway (Webhook)</span>
                      </button>

                      {/* 3. Interactive Customer Payment Portal */}
                      <button
                        type="button"
                        id="btn-test-customer-portal"
                        onClick={() => setIsCustomerPortalOpen(true)}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                        title="Open interactive Razorpay customer checkout portal to test 1-click recovery"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                        <span>Test Customer Payment Portal</span>
                      </button>
                    </div>

                    {/* Channel Quick Switch Hint */}
                    <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                      <span>Tip:</span>
                      {outreachChannel === 'whatsapp' ? (
                        <span>Want to send via Email instead? <button type="button" onClick={() => setOutreachChannel('email')} className="text-indigo-600 font-bold underline cursor-pointer">Switch to Email</button></span>
                      ) : (
                        <span>Want to send via WhatsApp instead? <button type="button" onClick={() => setOutreachChannel('whatsapp')} className="text-emerald-600 font-bold underline cursor-pointer">Switch to WhatsApp</button></span>
                      )}
                    </p>
                  </div>

                  {/* GATEWAY WEBHOOK TRANSMISSION CONSOLE & LIVE SIMULATION */}
                  {gatewayTransmission && (
                    <div className="mt-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs space-y-3.5 shadow-lg animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="font-bold text-white text-xs uppercase tracking-wider">
                            Gateway API Transmission Completed (200 OK)
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-md">
                          Receipt #{gatewayTransmission.receiptId}
                        </span>
                      </div>

                      {/* Transmission Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
                        <div className="bg-slate-800/80 p-2.5 rounded-xl">
                          <span className="text-slate-400 block text-[9.5px] uppercase font-sans font-bold">Gateway Engine:</span>
                          <span className="text-slate-100 font-semibold">{gatewayTransmission.gatewayProvider}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-xl">
                          <span className="text-slate-400 block text-[9.5px] uppercase font-sans font-bold">API Route:</span>
                          <span className="text-indigo-300 truncate block">{gatewayTransmission.endpoint}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-xl">
                          <span className="text-slate-400 block text-[9.5px] uppercase font-sans font-bold">Recipient:</span>
                          <span className="text-emerald-300 font-semibold">{gatewayTransmission.destination}</span>
                        </div>
                      </div>

                      {/* Webhook JSON Payload Preview */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[10.5px] overflow-x-auto text-slate-300">
                        <div className="text-[9.5px] text-slate-500 mb-1 flex items-center gap-1 font-sans uppercase font-bold">
                          <Code2 className="w-3 h-3" />
                          <span>Delivered Webhook Payload</span>
                        </div>
                        <pre className="text-emerald-400">{JSON.stringify(gatewayTransmission.payload, null, 2)}</pre>
                      </div>

                      {/* Actionable Recovery Trigger right from the Webhook! */}
                      {caseItem.status !== 'RECOVERED' ? (
                        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-emerald-200 text-xs flex items-center gap-1.5">
                              <span>🚀 Customer Received Notification</span>
                            </p>
                            <p className="text-[11px] text-emerald-400 mt-0.5">
                              {isHardDecline
                                ? 'Customer must add a replacement card before completing payment:'
                                : `Simulate customer clicking the link on their device and completing payment of ₹${caseItem.customer.amountINR.toLocaleString('en-IN')}:`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAction('SIMULATE_CUSTOMER_PAY')}
                            disabled={isLoadingAction}
                            aria-live="polite"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:text-emerald-100 disabled:cursor-wait text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5 min-w-[190px]"
                          >
                            {isLoadingAction ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              isHardDecline ? 'Simulate Customer Adds New Card' : 'Simulate Customer Pays Now'
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Subscription successfully recovered! Verified payment recorded in audit ledger.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMMUTABLE AUDIT TRAIL */}
          {activeTab === 'audit_trail' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Deterministic Audit Ledger</h3>
                <span className="text-xs font-mono text-slate-400 font-medium">
                  {caseItem.auditTrail.length} Recorded Trace Events
                </span>
              </div>

              <div className="space-y-3">
                {caseItem.auditTrail.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                          {entry.stage}
                        </span>
                        <span>{entry.stageName}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-700">
                      <span className="font-mono font-bold text-xs text-indigo-600">{entry.action}</span>
                      <span className="text-slate-300">→</span>
                      <span className="font-bold text-slate-800">{entry.resultStatus}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono font-medium">{entry.actor}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                      {entry.reason}
                    </p>

                    {entry.complianceRule && (
                      <div className="text-[10px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-mono mt-1 font-semibold">
                        Rule: {entry.complianceRule}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Razorpay AI Revenue Recovery Engine • Visa/Mastercard Bounded Execution</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Interactive Customer Mandate Checkout Portal Modal */}
      <CustomerPaymentPortalModal
        caseItem={caseItem}
        isOpen={isCustomerPortalOpen}
        onClose={() => setIsCustomerPortalOpen(false)}
        onConfirmPayment={async (caseId) => {
          await handleAction('SIMULATE_CUSTOMER_PAY', 'Customer authorized 1-click mandate recovery via Razorpay portal');
        }}
      />
    </div>
  );
};
