interface Rule {
  rx: RegExp;
  w: number;
  tag: string;
}

interface MatchedRule {
  tag: string;
  weight: number;
}

interface ScamInterpretation {
  level: 'high' | 'medium' | 'low' | 'minimal';
  description: string;
}

interface ScamScore {
  score: number;
  percentageScore: number;
  maxPossibleScore: number;
  matches: MatchedRule[];
  riskLevel: ScamInterpretation['level'];
  description: string;
}

function getMaxPossibleScore(): number {
  return RULES.reduce((total, rule) => total + rule.w, 0);
}

function interpretScamScore(percentageScore: number): ScamInterpretation {
  if (percentageScore >= 70) return { level: 'high', description: 'Highly likely to be a scam. Multiple strong indicators detected.' };
  if (percentageScore >= 40) return { level: 'medium', description: 'Moderate risk of being a scam. Some concerning patterns found.' };
  if (percentageScore >= 20) return { level: 'low', description: 'Low risk, but stay vigilant. Some concerning patterns detected.' };
  return { level: 'minimal', description: 'Minimal risk detected. Very few or no concerning patterns found.' };
}

function calculateScamScore(text: string): ScamScore {
  let totalScore = 0;
  let matchedRules: MatchedRule[] = [];
  const maxScore = getMaxPossibleScore();

  RULES.forEach(rule => {
    if (rule.rx.test(text)) {
      totalScore += rule.w;
      matchedRules.push({ tag: rule.tag, weight: rule.w });
    }
  });

  const percentageScore = (totalScore / maxScore) * 100;
  const interpretation = interpretScamScore(percentageScore);
  return {
    score: totalScore,
    percentageScore: Math.round(percentageScore),
    maxPossibleScore: maxScore,
    matches: matchedRules,
    riskLevel: interpretation.level,
    description: interpretation.description
  };
}

const RULES: Rule[] = [
    // URGENCY / TIME PRESSURE
    { rx: /(urgent|immediately|right now|now|asap|don't delay|this minute)/i, w: 18, tag: "urgency" },
    { rx: /(before.*(end of day|today|tomorrow))/i, w: 12, tag: "deadline" },
  
    // PAYMENT / MONEY REQUESTS
    { rx: /(wire( a)? transfer|bank transfer|wire money|send (money|funds)|transfer (funds|money))/i, w: 20, tag: "money_transfer" },
    { rx: /(gift card|iTunes card|google play card|amazon gift card|prepaid card)/i, w: 22, tag: "gift_card" },
    { rx: /(bitcoin|crypto|ethereum|btc|send crypto)/i, w: 20, tag: "crypto" },
    { rx: /(\$\s?\d{2,}|[0-9]{3,}\s?(dollars|usd))/i, w: 12, tag: "large_amount" },
  
    // FAMILY / EMOTIONAL MANIPULATION
    { rx: /(grandson|granddaughter|son|daughter|mom|dad|mother|father).*(in jail|in trouble|accident|hurt|sick)/i, w: 22, tag: "family_emergency" },
    { rx: /(your (child|grandchild) needs help|call me back or they'll)/i, w: 18, tag: "emotional_appeal" },
  
    // AUTHORITY / OFFICIAL THREATS
    { rx: /(irs|social security|ssa|police|warrant|court|federal|taxes).*(fine|penalty|arrest|deport)/i, w: 20, tag: "authority_threat" },
    { rx: /(we represent the (government|internal revenue service|police))/i, w: 14, tag: "authority_claim" },
  
    // CREDENTIALS / VERIFICATION
    { rx: /(verify.*(pin|password|account number|security code|otp|one[- ]time code))/i, w: 18, tag: "credential_request" },
    { rx: /(read me your (pin|password|code|ssn|social security number))/i, w: 22, tag: "sensitive_request" },
  
    // SECRECY / ISOLATION REQUESTS
    { rx: /(don't tell|keep this (secret|between us)|do not mention to anyone)/i, w: 14, tag: "secrecy" },
  
    // NEW PAYEE / URGENCY TO SETUP
    { rx: /(new (account|payee|recipient)|we need new payment info)/i, w: 12, tag: "new_payee" },
  
    // TECHNICAL SUPPORT / REMOTE ACCESS
    { rx: /(remote access|download this app|teamviewer|anydesk|give me remote|install .* (remote|support))/i, w: 18, tag: "remote_support" },
    { rx: /(computer is infected|your device has a virus|we blocked your account)/i, w: 14, tag: "tech_fear" },
  
    // PAYMENT CHANNELS / FAST METHODS
    { rx: /(venmo|cash(app)?|zelle|paypal.me|western union|moneygram)/i, w: 16, tag: "fast_payment_channel" },
  
    // SOCIAL-ENGINEERING PHRASES
    { rx: /(this is confidential|you must do this now|if you don't comply)/i, w: 12, tag: "social_pressure" },
    { rx: /(only for you|do not discuss|for security reasons do not)/i, w: 10, tag: "isolating_instruction" },
  
    // SPOOF / CALLBACK REQUESTS
    { rx: /(call us back at|call this number|verify by calling)/i, w: 10, tag: "callback_request" },
  
    // CONFIRMATION CODES / LINKS
    { rx: /(click the link|open this link|follow this link|scan this qr)/i, w: 12, tag: "malicious_link" },
    { rx: /(confirmation code|access code|verification link)/i, w: 10, tag: "confirm_code" },
  
    // LEGAL / URGENT FINES
    { rx: /(final notice|final warning|past due|overdue payment|collection agency)/i, w: 14, tag: "collection_threat" },
  
    // PHISHING DETECTION RULES
    // Suspicious URLs and domains
    { rx: /(http[s]?:\/\/[^\s]*(bit\.ly|tinyurl|goo\.gl|t\.co|short\.link))/i, w: 15, tag: "shortened_url" },
    { rx: /(http[s]?:\/\/[^\s]*(\.tk|\.ml|\.ga|\.cf|\.click|\.download))/i, w: 18, tag: "suspicious_domain" },
    { rx: /(http[s]?:\/\/[^\s]*[a-zA-Z0-9-]{20,}\.[a-zA-Z]{2,})/i, w: 12, tag: "long_random_url" },
    { rx: /(http[s]?:\/\/[^\s]*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i, w: 16, tag: "ip_address_url" },
    
    // Email spoofing indicators
    { rx: /(from:.*@.*\..*@.*\..*|reply-to.*@.*\..*@.*\.)/i, w: 20, tag: "email_spoofing" },
    { rx: /(sender.*@.*\..*but.*reply.*@.*\..*)/i, w: 18, tag: "reply_to_spoofing" },
    { rx: /(display.*name.*@.*different.*domain)/i, w: 15, tag: "display_name_spoofing" },
    
    // Suspicious attachments
    { rx: /(attachment.*\.(exe|scr|bat|cmd|com|pif|vbs|js|jar|zip|rar|7z))/i, w: 20, tag: "malicious_attachment" },
    { rx: /(download.*(invoice|receipt|document|statement).*\.(exe|scr|bat))/i, w: 22, tag: "disguised_executable" },
    { rx: /(password.*protected.*zip|encrypted.*attachment)/i, w: 16, tag: "password_protected_attachment" },
    
    // And all other rules...
    // Generic phishing indicators
    { rx: /(help me|need your help|please help)/i, w: 8, tag: "help_request" },
    { rx: /(scam|fraud|suspicious)/i, w: 6, tag: "self_reference" }
];

export {
  calculateScamScore,
  interpretScamScore,
  RULES,
  type Rule,
  type ScamScore,
  type ScamInterpretation,
  type MatchedRule
};