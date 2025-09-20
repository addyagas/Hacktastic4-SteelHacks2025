function getMaxPossibleScore() {
  return RULES.reduce((total, rule) => total + rule.w, 0);
}

function interpretScamScore(percentageScore) {
  if (percentageScore >= 70) return { level: 'high', description: 'Highly likely to be a scam. Multiple strong indicators detected.' };
  if (percentageScore >= 40) return { level: 'medium', description: 'Moderate risk of being a scam. Some concerning patterns found.' };
  if (percentageScore >= 20) return { level: 'low', description: 'Low risk, but stay vigilant. Some concerning patterns detected.' };
  return { level: 'minimal', description: 'Minimal risk detected. Very few or no concerning patterns found.' };
}

function calculateScamScore(text) {
  let totalScore = 0;
  let matchedRules = [];
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

const RULES = [
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
  
  // Fake login pages and credential harvesting
  { rx: /(login.*page.*expired|session.*expired.*login|verify.*account.*login)/i, w: 18, tag: "fake_login_page" },
  { rx: /(update.*billing.*information|verify.*payment.*method|confirm.*account.*details)/i, w: 16, tag: "credential_harvesting" },
  { rx: /(suspended.*account.*reactivate|locked.*account.*unlock)/i, w: 14, tag: "account_suspension_scam" },
  
  // Impersonation and brand spoofing
  { rx: /(microsoft.*support|apple.*support|google.*support|amazon.*support)/i, w: 12, tag: "tech_support_impersonation" },
  { rx: /(paypal.*security.*team|bank.*security.*department|irs.*collection.*unit)/i, w: 14, tag: "financial_impersonation" },
  { rx: /(fedex.*delivery.*team|ups.*shipping.*department|usps.*postal.*service)/i, w: 12, tag: "shipping_impersonation" },
  
  // Social media and dating scams
  { rx: /(facebook.*security.*team|instagram.*support.*team|twitter.*verification)/i, w: 12, tag: "social_media_impersonation" },
  { rx: /(military.*deployed.*overseas|oil.*rig.*worker.*stranded)/i, w: 16, tag: "romance_scam_profile" },
  { rx: /(inheritance.*from.*deceased|lottery.*winner.*claim.*prize)/i, w: 18, tag: "inheritance_lottery_scam" },
  
  // Investment and crypto scams
  { rx: /(guaranteed.*return.*investment|risk.*free.*trading.*opportunity)/i, w: 16, tag: "investment_scam" },
  { rx: /(double.*your.*bitcoin|crypto.*mining.*investment.*guaranteed)/i, w: 18, tag: "crypto_investment_scam" },
  { rx: /(pump.*and.*dump.*scheme|insider.*trading.*tip)/i, w: 20, tag: "securities_fraud" },
  
  // Job and work-from-home scams
  { rx: /(work.*from.*home.*no.*experience.*needed|make.*money.*online.*guaranteed)/i, w: 14, tag: "work_from_home_scam" },
  { rx: /(mystery.*shopper.*job|package.*forwarding.*job|check.*cashing.*job)/i, w: 16, tag: "job_scam" },
  { rx: /(send.*us.*your.*resume.*and.*ssn|background.*check.*requires.*ssn)/i, w: 18, tag: "identity_theft_job" },
  
  // Charity and disaster scams
  { rx: /(urgent.*donation.*needed|disaster.*relief.*fund|help.*victims.*send.*money)/i, w: 14, tag: "charity_scam" },
  { rx: /(go.*fund.*me.*fake.*campaign|crowdfunding.*scam)/i, w: 12, tag: "crowdfunding_scam" },
  
  // Lottery and sweepstakes scams
  { rx: /(congratulations.*you.*won.*lottery|sweepstakes.*winner.*claim.*prize)/i, w: 16, tag: "lottery_scam" },
  { rx: /(nigerian.*prince.*inheritance|foreign.*government.*official.*needs.*help)/i, w: 20, tag: "nigerian_prince_scam" },
  
  // Tech support and software scams
  { rx: /(windows.*security.*alert|microsoft.*detected.*virus|your.*computer.*is.*infected)/i, w: 14, tag: "tech_support_scam" },
  { rx: /(subscription.*renewal.*required|payment.*method.*expired.*update)/i, w: 12, tag: "subscription_scam" },
  { rx: /(software.*license.*expired|product.*key.*invalid.*purchase)/i, w: 10, tag: "software_license_scam" },
  
  // Banking and financial institution scams
  { rx: /(suspicious.*activity.*detected.*account|unauthorized.*login.*attempt)/i, w: 16, tag: "banking_scam" },
  { rx: /(card.*compromised.*replace.*immediately|fraud.*detected.*verify.*identity)/i, w: 14, tag: "card_fraud_scam" },
  { rx: /(wire.*transfer.*to.*secure.*account|move.*money.*to.*safe.*account)/i, w: 18, tag: "bank_transfer_scam" },
  
  // Government and tax scams
  { rx: /(irs.*tax.*refund.*claim|social.*security.*benefits.*suspended)/i, w: 16, tag: "government_scam" },
  { rx: /(arrest.*warrant.*issued.*unless.*payment|court.*summons.*immediate.*response)/i, w: 18, tag: "legal_threat_scam" },
  { rx: /(medicare.*card.*replacement.*required|medicaid.*benefits.*suspended)/i, w: 14, tag: "healthcare_scam" },
  
  // Generic phishing indicators
  { rx: /(help me|need your help|please help)/i, w: 8, tag: "help_request" },
  { rx: /(scam|fraud|suspicious)/i, w: 6, tag: "self_reference" }
];

module.exports = {
  calculateScamScore,
  interpretScamScore,
  RULES
};
