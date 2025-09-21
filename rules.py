import re

# Define the rules
RULES = [
    # URGENCY / TIME PRESSURE
    {"rx": re.compile(r"(urgent|immediately|right now|now|asap|don't delay|this minute)", re.IGNORECASE), "w": 18, "tag": "urgency"},
    {"rx": re.compile(r"(before.*(end of day|today|tomorrow))", re.IGNORECASE), "w": 12, "tag": "deadline"},
  
    # PAYMENT / MONEY REQUESTS
    {"rx": re.compile(r"(wire( a)? transfer|bank transfer|wire money|send (money|funds)|transfer (funds|money))", re.IGNORECASE), "w": 20, "tag": "money_transfer"},
    {"rx": re.compile(r"(gift card|iTunes card|google play card|amazon gift card|prepaid card)", re.IGNORECASE), "w": 22, "tag": "gift_card"},
    {"rx": re.compile(r"(bitcoin|crypto|ethereum|btc|send crypto)", re.IGNORECASE), "w": 20, "tag": "crypto"},
    {"rx": re.compile(r"(\$\s?\d{2,}|[0-9]{3,}\s?(dollars|usd))", re.IGNORECASE), "w": 12, "tag": "large_amount"},
  
    # FAMILY / EMOTIONAL MANIPULATION
    {"rx": re.compile(r"(grandson|granddaughter|son|daughter|mom|dad|mother|father).*(in jail|in trouble|accident|hurt|sick)", re.IGNORECASE), "w": 22, "tag": "family_emergency"},
    {"rx": re.compile(r"(your (child|grandchild) needs help|call me back or they'll)", re.IGNORECASE), "w": 18, "tag": "emotional_appeal"},
  
    # AUTHORITY / OFFICIAL THREATS
    {"rx": re.compile(r"(irs|social security|ssa|police|warrant|court|federal|taxes).*(fine|penalty|arrest|deport)", re.IGNORECASE), "w": 20, "tag": "authority_threat"},
    {"rx": re.compile(r"(we represent the (government|internal revenue service|police))", re.IGNORECASE), "w": 14, "tag": "authority_claim"},
  
    # CREDENTIALS / VERIFICATION
    {"rx": re.compile(r"(verify.*(pin|password|account number|security code|otp|one[- ]time code))", re.IGNORECASE), "w": 18, "tag": "credential_request"},
    {"rx": re.compile(r"(read me your (pin|password|code|ssn|social security number))", re.IGNORECASE), "w": 22, "tag": "sensitive_request"},
  
    # SECRECY / ISOLATION REQUESTS
    {"rx": re.compile(r"(don't tell|keep this (secret|between us)|do not mention to anyone)", re.IGNORECASE), "w": 14, "tag": "secrecy"},
  
    # NEW PAYEE / URGENCY TO SETUP
    {"rx": re.compile(r"(new (account|payee|recipient)|we need new payment info)", re.IGNORECASE), "w": 12, "tag": "new_payee"},
  
    # TECHNICAL SUPPORT / REMOTE ACCESS
    {"rx": re.compile(r"(remote access|download this app|teamviewer|anydesk|give me remote|install .* (remote|support))", re.IGNORECASE), "w": 18, "tag": "remote_support"},
    {"rx": re.compile(r"(computer is infected|your device has a virus|we blocked your account)", re.IGNORECASE), "w": 14, "tag": "tech_fear"},
  
    # PAYMENT CHANNELS / FAST METHODS
    {"rx": re.compile(r"(venmo|cash(app)?|zelle|paypal.me|western union|moneygram)", re.IGNORECASE), "w": 16, "tag": "fast_payment_channel"},
  
    # SOCIAL-ENGINEERING PHRASES
    {"rx": re.compile(r"(this is confidential|you must do this now|if you don't comply)", re.IGNORECASE), "w": 12, "tag": "social_pressure"},
    {"rx": re.compile(r"(only for you|do not discuss|for security reasons do not)", re.IGNORECASE), "w": 10, "tag": "isolating_instruction"},
  
    # SPOOF / CALLBACK REQUESTS
    {"rx": re.compile(r"(call us back at|call this number|verify by calling)", re.IGNORECASE), "w": 10, "tag": "callback_request"},
  
    # CONFIRMATION CODES / LINKS
    {"rx": re.compile(r"(click the link|open this link|follow this link|scan this qr)", re.IGNORECASE), "w": 12, "tag": "malicious_link"},
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
    {"rx": re.compile(r"(pump.*and.*dump.*scheme|insider.*trading.*tip)", re.IGNORECASE), "w": 20, "tag": "securities_fraud"},
  
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
    {"rx": re.compile(r"(scam|fraud|suspicious)", re.IGNORECASE), "w": 6, "tag": "self_reference"}
]

def get_max_possible_score():
    """Calculate the maximum possible score from all rules"""
    return sum(rule["w"] for rule in RULES)

def interpret_scam_score(percentage_score):
    """Interpret the scam score as a risk level and description"""
    if percentage_score >= 70:
        return {"level": "high", "description": "Highly likely to be a scam. Multiple strong indicators detected."}
    if percentage_score >= 40:
        return {"level": "medium", "description": "Moderate risk of being a scam. Some concerning patterns found."}
    if percentage_score >= 20:
        return {"level": "low", "description": "Low risk, but stay vigilant. Some concerning patterns detected."}
    return {"level": "minimal", "description": "Minimal risk detected. Very few or no concerning patterns found."}

def calculate_scam_score(text):
    """
    Calculate a scam score for the given text by checking against defined rules.
    
    Args:
        text (str): The text to analyze for scam indicators
        
    Returns:
        dict: A dictionary containing the score, percentage, matched rules, and interpretation
    """
    total_score = 0
    matched_rules = []
    max_score = get_max_possible_score()

    for rule in RULES:
        if rule["rx"].search(text):
            total_score += rule["w"]
            matched_rules.append({"tag": rule["tag"], "weight": rule["w"]})

    percentage_score = (total_score / max_score) * 100
    interpretation = interpret_scam_score(percentage_score)
    
    return {
        "score": total_score,
        "percentageScore": round(percentage_score),
        "maxPossibleScore": max_score,
        "matches": matched_rules,
        "riskLevel": interpretation["level"],
        "description": interpretation["description"]
    }

# Export functions for use in other modules
__all__ = ["calculate_scam_score", "interpret_scam_score", "RULES"]