import re

# Risk level categories for rules - ALL NOW MULTIPLY BY 3
RISK_LEVELS = {
    "high": {
        "multiplier": 3,
        "rules": {"urgency", "payment", "authority", "account_verification", "prize", "credential_theft", 
                 "money_transfer", "gift_card", "crypto", "sensitive_request", "authority_threat", 
                 "bank_transfer_scam", "legal_threat_scam", "securities_fraud", "nigerian_prince_scam"}
    },
    "mid": {
        "multiplier": 3,  # Changed from 2 to 3
        "rules": {"phishing", "tech_support", "romance", "health", "social_media", "fake_charity",
                 "remote_support", "family_emergency", "malicious_attachment", "disguised_executable"}
    },
    "low": {
        "multiplier": 3,  # Changed from 1 to 3
        "rules": {"generic", "persuasion", "mild_threat", "suspicious_link"}
    }
}

# Baseline scoring thresholds
HIGH_RISK_BASELINE_COUNT = 2  # 2 or more high risk words triggers 70% baseline
MID_RISK_BASELINE_COUNT = 5   # 5 or more mid risk words triggers 50% baseline
HIGH_RISK_BASELINE_PERCENTAGE = 70
MID_RISK_BASELINE_PERCENTAGE = 50

# Define the rules
RULES = [
    # URGENCY / TIME PRESSURE
    {"rx": re.compile(r"(urgent|immediately|right now|now|asap|don't delay|this minute)", re.IGNORECASE), "w": 20, "tag": "urgency"},
    {"rx": re.compile(r"(before.*(end of day|today|tomorrow))", re.IGNORECASE), "w": 15, "tag": "deadline"},
  
    # PAYMENT / MONEY REQUESTS
    {"rx": re.compile(r"(wire( a)? transfer|bank transfer|wire money|send (money|funds)|transfer (funds|money))", re.IGNORECASE), "w": 25, "tag": "money_transfer"},
    {"rx": re.compile(r"(gift card|iTunes card|google play card|amazon gift card|prepaid card)", re.IGNORECASE), "w": 28, "tag": "gift_card"},
    {"rx": re.compile(r"(bitcoin|crypto|ethereum|btc|send crypto)", re.IGNORECASE), "w": 25, "tag": "crypto"},
    {"rx": re.compile(r"(\$\s?\d{2,}|[0-9]{3,}\s?(dollars|usd))", re.IGNORECASE), "w": 15, "tag": "large_amount"},
  
    # FAMILY / EMOTIONAL MANIPULATION
    {"rx": re.compile(r"(grandson|granddaughter|son|daughter|mom|dad|mother|father).*(in jail|in trouble|accident|hurt|sick)", re.IGNORECASE), "w": 28, "tag": "family_emergency"},
    {"rx": re.compile(r"(your (child|grandchild) needs help|call me back or they'll)", re.IGNORECASE), "w": 22, "tag": "emotional_appeal"},
  
    # AUTHORITY / OFFICIAL THREATS
    {"rx": re.compile(r"(irs|social security|ssa|police|warrant|court|federal|taxes).*(fine|penalty|arrest|deport)", re.IGNORECASE), "w": 25, "tag": "authority_threat"},
    {"rx": re.compile(r"(we represent the (government|internal revenue service|police))", re.IGNORECASE), "w": 18, "tag": "authority_claim"},
  
    # CREDENTIALS / VERIFICATION
    {"rx": re.compile(r"(verify.*(pin|password|account number|security code|otp|one[- ]time code))", re.IGNORECASE), "w": 22, "tag": "credential_request"},
    {"rx": re.compile(r"(read me your (pin|password|code|ssn|social security number))", re.IGNORECASE), "w": 28, "tag": "sensitive_request"},
  
    # SECRECY / ISOLATION REQUESTS
    {"rx": re.compile(r"(don't tell|keep this (secret|between us)|do not mention to anyone)", re.IGNORECASE), "w": 18, "tag": "secrecy"},
  
    # NEW PAYEE / URGENCY TO SETUP
    {"rx": re.compile(r"(new (account|payee|recipient)|we need new payment info)", re.IGNORECASE), "w": 15, "tag": "new_payee"},
  
    # TECHNICAL SUPPORT / REMOTE ACCESS
    {"rx": re.compile(r"(remote access|download this app|teamviewer|anydesk|give me remote|install .* (remote|support))", re.IGNORECASE), "w": 25, "tag": "remote_support"},
    {"rx": re.compile(r"(computer is infected|your device has a virus|we blocked your account)", re.IGNORECASE), "w": 18, "tag": "tech_fear"},
  
    # PAYMENT CHANNELS / FAST METHODS
    {"rx": re.compile(r"(venmo|cash(app)?|zelle|paypal.me|western union|moneygram)", re.IGNORECASE), "w": 20, "tag": "fast_payment_channel"},
  
    # SOCIAL-ENGINEERING PHRASES
    {"rx": re.compile(r"(this is confidential|you must do this now|if you don't comply)", re.IGNORECASE), "w": 15, "tag": "social_pressure"},
    {"rx": re.compile(r"(only for you|do not discuss|for security reasons do not)", re.IGNORECASE), "w": 12, "tag": "isolating_instruction"},
  
    # SPOOF / CALLBACK REQUESTS
    {"rx": re.compile(r"(call us back at|call this number|verify by calling)", re.IGNORECASE), "w": 10, "tag": "callback_request"},
  
    # CONFIRMATION CODES / LINKS
    {"rx": re.compile(r"(click the link|open this link|follow this link|scan this qr)", re.IGNORECASE), "w": 15, "tag": "malicious_link"},
    {"rx": re.compile(r"(confirmation code|access code|verification link)", re.IGNORECASE), "w": 10, "tag": "confirm_code"},
  
    # LEGAL / URGENT FINES
    {"rx": re.compile(r"(final notice|final warning|past due|overdue payment|collection agency)", re.IGNORECASE), "w": 14, "tag": "collection_threat"},
  
    # PHISHING DETECTION RULES
    # Suspicious URLs and domains
    {"rx": re.compile(r"(http[s]?:\/\/[^\s]*(bit\.ly|tinyurl|goo\.gl|t\.co|short\.link))", re.IGNORECASE), "w": 15, "tag": "shortened_url"},
    {"rx": re.compile(r"(http[s]?:\/\/[^\s]*(\.tk|\.ml|\.ga|\.cf|\.click|\.download))", re.IGNORECASE), "w": 18, "tag": "suspicious_domain"},
    {"rx": re.compile(r"(http[s]?:\/\/[^\s]*[a-zA-Z0-9-]{20,}\.[a-zA-Z]{2,})", re.IGNORECASE), "w": 12, "tag": "long_random_url"},
    {"rx": re.compile(r"(http[s]?:\/\/[^\s]*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", re.IGNORECASE), "w": 16, "tag": "ip_address_url"},
  
    # Email spoofing indicators
    {"rx": re.compile(r"(from:.*@.*\..*@.*\..*|reply-to.*@.*\..*@.*\.)", re.IGNORECASE), "w": 20, "tag": "email_spoofing"},
    {"rx": re.compile(r"(sender.*@.*\..*but.*reply.*@.*\..*)", re.IGNORECASE), "w": 18, "tag": "reply_to_spoofing"},
    {"rx": re.compile(r"(display.*name.*@.*different.*domain)", re.IGNORECASE), "w": 15, "tag": "display_name_spoofing"},
  
    # Suspicious attachments
    {"rx": re.compile(r"(attachment.*\.(exe|scr|bat|cmd|com|pif|vbs|js|jar|zip|rar|7z))", re.IGNORECASE), "w": 20, "tag": "malicious_attachment"},
    {"rx": re.compile(r"(download.*(invoice|receipt|document|statement).*\.(exe|scr|bat))", re.IGNORECASE), "w": 22, "tag": "disguised_executable"},
    {"rx": re.compile(r"(password.*protected.*zip|encrypted.*attachment)", re.IGNORECASE), "w": 16, "tag": "password_protected_attachment"},
  
    # Fake login pages and credential harvesting
    {"rx": re.compile(r"(login.*page.*expired|session.*expired.*login|verify.*account.*login)", re.IGNORECASE), "w": 18, "tag": "fake_login_page"},
    {"rx": re.compile(r"(update.*billing.*information|verify.*payment.*method|confirm.*account.*details)", re.IGNORECASE), "w": 16, "tag": "credential_harvesting"},
    {"rx": re.compile(r"(suspended.*account.*reactivate|locked.*account.*unlock)", re.IGNORECASE), "w": 14, "tag": "account_suspension_scam"},
  
    # Impersonation and brand spoofing
    {"rx": re.compile(r"(microsoft.*support|apple.*support|google.*support|amazon.*support)", re.IGNORECASE), "w": 12, "tag": "tech_support_impersonation"},
    {"rx": re.compile(r"(paypal.*security.*team|bank.*security.*department|irs.*collection.*unit)", re.IGNORECASE), "w": 14, "tag": "financial_impersonation"},
    {"rx": re.compile(r"(fedex.*delivery.*team|ups.*shipping.*department|usps.*postal.*service)", re.IGNORECASE), "w": 12, "tag": "shipping_impersonation"},
  
    # Social media and dating scams
    {"rx": re.compile(r"(facebook.*security.*team|instagram.*support.*team|twitter.*verification)", re.IGNORECASE), "w": 12, "tag": "social_media_impersonation"},
    {"rx": re.compile(r"(military.*deployed.*overseas|oil.*rig.*worker.*stranded)", re.IGNORECASE), "w": 16, "tag": "romance_scam_profile"},
    {"rx": re.compile(r"(inheritance.*from.*deceased|lottery.*winner.*claim.*prize)", re.IGNORECASE), "w": 18, "tag": "inheritance_lottery_scam"},
  
    # Investment and crypto scams
    {"rx": re.compile(r"(guaranteed.*return.*investment|risk.*free.*trading.*opportunity)", re.IGNORECASE), "w": 16, "tag": "investment_scam"},
    {"rx": re.compile(r"(double.*your.*bitcoin|crypto.*mining.*investment.*guaranteed)", re.IGNORECASE), "w": 18, "tag": "crypto_investment_scam"},
    {"rx": re.compile(r"(pump.*and.*dump.*scheme|insider.*trading.*tip)", re.IGNORECASE), "w": 10, "tag": "securities_fraud"},
  
    # Job and work-from-home scams
    {"rx": re.compile(r"(work.*from.*home.*no.*experience.*needed|make.*money.*online.*guaranteed)", re.IGNORECASE), "w": 14, "tag": "work_from_home_scam"},
    {"rx": re.compile(r"(mystery.*shopper.*job|package.*forwarding.*job|check.*cashing.*job)", re.IGNORECASE), "w": 16, "tag": "job_scam"},
    {"rx": re.compile(r"(send.*us.*your.*resume.*and.*ssn|background.*check.*requires.*ssn)", re.IGNORECASE), "w": 18, "tag": "identity_theft_job"},
  
    # Charity and disaster scams
    {"rx": re.compile(r"(urgent.*donation.*needed|disaster.*relief.*fund|help.*victims.*send.*money)", re.IGNORECASE), "w": 14, "tag": "charity_scam"},
    {"rx": re.compile(r"(go.*fund.*me.*fake.*campaign|crowdfunding.*scam)", re.IGNORECASE), "w": 12, "tag": "crowdfunding_scam"},
  
    # Lottery and sweepstakes scams
    {"rx": re.compile(r"(congratulations.*you.*won.*lottery|sweepstakes.*winner.*claim.*prize)", re.IGNORECASE), "w": 16, "tag": "lottery_scam"},
    {"rx": re.compile(r"(nigerian.*prince.*inheritance|foreign.*government.*official.*needs.*help)", re.IGNORECASE), "w": 20, "tag": "nigerian_prince_scam"},
  
    # Tech support and software scams
    {"rx": re.compile(r"(windows.*security.*alert|microsoft.*detected.*virus|your.*computer.*is.*infected)", re.IGNORECASE), "w": 14, "tag": "tech_support_scam"},
    {"rx": re.compile(r"(subscription.*renewal.*required|payment.*method.*expired.*update)", re.IGNORECASE), "w": 12, "tag": "subscription_scam"},
    {"rx": re.compile(r"(software.*license.*expired|product.*key.*invalid.*purchase)", re.IGNORECASE), "w": 10, "tag": "software_license_scam"},
  
    # Banking and financial institution scams
    {"rx": re.compile(r"(suspicious.*activity.*detected.*account|unauthorized.*login.*attempt)", re.IGNORECASE), "w": 16, "tag": "banking_scam"},
    {"rx": re.compile(r"(card.*compromised.*replace.*immediately|fraud.*detected.*verify.*identity)", re.IGNORECASE), "w": 14, "tag": "card_fraud_scam"},
    {"rx": re.compile(r"(wire.*transfer.*to.*secure.*account|move.*money.*to.*safe.*account)", re.IGNORECASE), "w": 18, "tag": "bank_transfer_scam"},
  
    # Government and tax scams
    {"rx": re.compile(r"(irs.*tax.*refund.*claim|social.*security.*benefits.*suspended)", re.IGNORECASE), "w": 16, "tag": "government_scam"},
    {"rx": re.compile(r"(arrest.*warrant.*issued.*unless.*payment|court.*summons.*immediate.*response)", re.IGNORECASE), "w": 18, "tag": "legal_threat_scam"},
    {"rx": re.compile(r"(medicare.*card.*replacement.*required|medicaid.*benefits.*suspended)", re.IGNORECASE), "w": 14, "tag": "healthcare_scam"},
  
    # Generic phishing indicators
    {"rx": re.compile(r"(help me|need your help|please help)", re.IGNORECASE), "w": 8, "tag": "help_request"},
    {"rx": re.compile(r"(scam|fraud|suspicious)", re.IGNORECASE), "w": 10, "tag": "self_reference"}
]

def get_risk_level(tag):
    """
    Get the risk level and multiplier for a given rule tag.
    
    Args:
        tag (str): The rule tag to check
        
    Returns:
        tuple: (risk_level, multiplier) where risk_level is 'high', 'mid', or 'low'
    """
    for level, config in RISK_LEVELS.items():
        if tag in config["rules"]:
            return level, config["multiplier"]
    
    # Default to low risk if tag not found
    return "low", RISK_LEVELS["low"]["multiplier"]

def interpret_scam_score(percentage_score):
    """Interpret the scam score as a risk level and description"""
    if percentage_score >= 75:
        return {"level": "high", "description": "Highly likely to be a scam. Multiple strong indicators detected."}
    if percentage_score >= 45:
        return {"level": "medium", "description": "Moderate risk of being a scam. Some concerning patterns found."}
    if percentage_score >= 25:
        return {"level": "low", "description": "Low risk, but stay vigilant. Some concerning patterns detected."}
    return {"level": "low", "description": "Low risk, but stay vigilant. Some concerning patterns detected."}

def calculate_scam_score(text):
    """
    Calculate a scam score based on the ratio of threat words to total words,
    weighted by the individual word weights.
    
    Args:
        text (str): The text to analyze for scam indicators
        
    Returns:
        dict: A dictionary containing the score, percentage, matched rules, and interpretation
    """
    matched_rules = []
    threat_word_count = 0
    total_weighted_score = 0
    
    # Count total words in the text (simple word count)
    words = text.split()
    total_word_count = len(words)
    
    if total_word_count == 0:
        return {
            "score": 0,
            "percentageScore": 0,
            "ratioPercentage": 0,
            "threatWordCount": 0,
            "totalWordCount": 0,
            "matches": [],
            "riskLevel": "low",
            "description": "No content to analyze"
        }
    
    # First pass: find all regex pattern matches from RULES
    for rule in RULES:
        tag = rule["tag"]
        weight = rule["w"]
        matches = list(rule["rx"].finditer(text))
        match_count = len(matches)
        
        if match_count > 0:
            risk_level, multiplier = get_risk_level(tag)
            
            # Each match contributes to threat word count
            threat_word_count += match_count
            
            # Calculate weighted contribution (match count * rule weight * multiplier)
            weighted_contribution = match_count * weight * multiplier
            total_weighted_score += weighted_contribution
            
            # Record the match details
            matched_rule = {
                "tag": tag,
                "risk_level": risk_level,
                "weight": weight,
                "match_count": match_count,
                "weighted_contribution": weighted_contribution
            }
            matched_rules.append(matched_rule)
    
    # Second pass: check for constants.py keywords that weren't caught by rules
    try:
        from constants import THREAT_KEYWORDS
        import re as regex_module
        
        text_lower = text.lower()
        constants_matches = []
        
        # Handle both dictionary and list formats of THREAT_KEYWORDS
        if isinstance(THREAT_KEYWORDS, dict):
            # New dictionary format: {keyword: risk_level}
            keywords_to_check = THREAT_KEYWORDS.items()
        else:
            # Old list format: [keyword1, keyword2, ...]
            # Assign default risk levels based on keyword characteristics
            keywords_to_check = []
            for keyword in THREAT_KEYWORDS:
                # Auto-assign risk levels based on keyword content
                keyword_lower = keyword.lower()
                if any(high_risk_word in keyword_lower for high_risk_word in 
                      ['gift card', 'wire transfer', 'bitcoin', 'warrant', 'arrest', 'irs', 'ssn', 
                       'urgent', 'immediately', 'asap', 'compromised', 'suspended']):
                    risk_level = 'high'
                elif any(med_risk_word in keyword_lower for med_risk_word in 
                        ['verify', 'suspicious', 'fee', 'access', 'password', 'account', 'security']):
                    risk_level = 'medium'
                else:
                    risk_level = 'low'
                keywords_to_check.append((keyword, risk_level))
        
        for keyword, risk_level in keywords_to_check:
            # Create word boundary pattern for each keyword
            pattern = regex_module.compile(r'\b' + regex_module.escape(keyword.lower()) + r'\b')
            keyword_matches = list(pattern.finditer(text_lower))
            
            if keyword_matches:
                # Check if this keyword was already caught by a rules.py pattern
                already_counted = False
                for rule_match in matched_rules:
                    # Simple check - if keyword is part of a rule pattern, skip it
                    # This is a basic approach to avoid double-counting
                    if keyword.lower() in str(rule_match.get('tag', '')).lower():
                        already_counted = True
                        break
                
                if not already_counted:
                    match_count = len(keyword_matches)
                    threat_word_count += match_count
                    
                    # Assign weight based on risk level from constants.py
                    if risk_level == 'high':
                        base_weight = 25
                        multiplier = 3
                    elif risk_level == 'medium':
                        base_weight = 15
                        multiplier = 3
                    else:  # low
                        base_weight = 10
                        multiplier = 3
                    
                    weighted_contribution = match_count * base_weight * multiplier
                    total_weighted_score += weighted_contribution
                    
                    constants_match = {
                        "tag": f"constants_{keyword}",
                        "risk_level": risk_level,
                        "weight": base_weight,
                        "match_count": match_count,
                        "weighted_contribution": weighted_contribution,
                        "source": "constants.py"
                    }
                    constants_matches.append(constants_match)
        
        # Add constants matches to the main matches list
        matched_rules.extend(constants_matches)
        
    except ImportError:
        pass  # constants.py not available, skip this step
    
    # Calculate the ratio of threat words to total words
    threat_ratio = threat_word_count / total_word_count if total_word_count > 0 else 0
    
    # Calculate percentage based on ratio and weighted scores
    # Base percentage from ratio (0-50% range)
    ratio_percentage = min(threat_ratio * 100, 50)
    
    # Additional percentage from weighted scores (0-50% range)
    # Normalize weighted score - assuming max reasonable weighted score is around 100
    max_expected_weighted_score = 100
    weighted_percentage = min((total_weighted_score / max_expected_weighted_score) * 50, 50)
    
    # Final percentage is ratio + weighted contribution
    percentage_score = min(ratio_percentage + weighted_percentage, 100)
    
    interpretation = interpret_scam_score(percentage_score)
    
    return {
        "score": round(total_weighted_score, 1),
        "percentageScore": round(percentage_score),
        "ratioPercentage": round(ratio_percentage, 1),
        "weightedPercentage": round(weighted_percentage, 1),
        "threatWordCount": threat_word_count,
        "totalWordCount": total_word_count,
        "threatRatio": round(threat_ratio, 3),
        "matches": matched_rules,
        "riskLevel": interpretation["level"],
        "description": interpretation["description"]
    }

# Export functions for use in other modules
__all__ = ["calculate_scam_score", "interpret_scam_score", "get_risk_level", "RULES", 
           "RISK_LEVELS", "HIGH_RISK_BASELINE_COUNT", "MID_RISK_BASELINE_COUNT"]