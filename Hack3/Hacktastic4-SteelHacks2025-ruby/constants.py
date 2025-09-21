THREAT_KEYWORDS = [
    # Original keywords
    'urgent',
    'verify',
    'social security',
    'irs',
    'bank account',
    'compromised',
    'suspicious',
    'immediately',
    'gift card',
    'warrant',
    'arrest',
    'fee',
    'winner',
    'lottery',
    'inheritance',
    'secret',
    'wire transfer',
    'access',
    'password',
    'account',
    'security',
    'ssn',
    'accident',
    'activity',
    'alert',
    'amazon',
    'anydesk',
    'asap',
    'attachment',
    'attempt',
    'background check',
    'bank transfer',
    'benefits',
    'bitcoin',
    'btc',
    'call back',
    'call this number',
    'card compromised',
    'cash app',
    'claim',
    'click the link',
    'collection agency',
    'computer infected',
    'confidential',
    'confirm',
    'confirmation code',
    'congratulations',
    'court',
    'credit card',
    'crypto',
    'deadline',
    'debit card',
    'delivery',
    'deposit',
    'disaster',
    'donation',
    'download',
    'emergency',
    'encrypted',
    'ethereum',
    'exe file',
    'expired',
    'facebook',
    'family emergency',
    'fedex',
    'final notice',
    'final warning',
    'fine',
    'follow this link',
    'fraud',
    'free',
    'gift cards',
    'google',
    'government',
    'guaranteed',
    'help',
    'identity',
    'infected',
    'information',
    'install',
    'investment',
    'jail',
    'legal',
    'locked account',
    'login',
    'malware',
    'medicare',
    'microsoft',
    'money',
    'moneygram',
    'nigerian prince',
    'offer',
    'overdue',
    'payment',
    'paypal',
    'penalty',
    'personal information',
    'phishing',
    'police',
    'problem',
    'processing fee',
    'prize',
    'remote access',
    'request',
    'required',
    'reward',
    'safe',
    'scan',
    'secure',
    'send money',
    'server',
    'service',
    'social media',
    'software',
    'support',
    'suspended',
    'tax',
    'threat',
    'transfer',
    'unauthorized',
    'update',
    'ups',
    'usps',
    'venmo',
    'virus',
    'warning',
    'western union',
    'windows',
    'wire money',
    'zelle'
]


SIMULATED_TRANSCRIPT_PARTS = [
    "Hello, how are you today?",
    "We're calling about your car's extended warranty.",
    "This is an urgent message regarding your bank account.",
    "We need you to verify your personal information.",
    "There has been suspicious activity on your social security number.",
    "You need to act immediately to resolve this issue.",
    "Can you confirm your mother's maiden name?",
    "You have been selected as a grand prize winner!",
    "To claim your prize, you just need to pay a small processing fee.",
    "The only way to pay the fee is with a gift card.",
    "We've detected a problem with your computer, we can fix it if you grant us access.",
    "This is the IRS, and there is a warrant for your arrest unless you pay now.",
    "What a lovely day for a walk in the park.",
    "I'm going to the grocery store later, do you need anything?",
    "Remember to call your grandchildren this weekend.",
    "We need you to send a wire transfer to a secure account."
]

# Dictionary mapping rule tags to human-readable explanations
SCAM_PATTERNS_EXPLANATION = {
    # Urgency patterns
    "urgency": "The caller is creating a false sense of urgency",
    "deadline": "The caller is imposing an artificial deadline to pressure you",
    
    # Payment requests
    "money_transfer": "The caller is requesting a wire transfer or money movement",
    "gift_card": "The caller is requesting payment via gift cards, a common scam tactic",
    "crypto": "The caller is requesting cryptocurrency, which is often used in scams due to irreversibility",
    "large_amount": "The caller is discussing suspiciously large amounts of money",
    
    # Emotional manipulation
    "family_emergency": "The caller is claiming a family member is in trouble, a common manipulation tactic",
    "emotional_appeal": "The caller is using emotional manipulation to bypass your rational thinking",
    
    # Authority threats
    "authority_threat": "The caller is impersonating authorities and making threats",
    "authority_claim": "The caller is falsely claiming to represent government agencies",
    
    # Credential requests
    "credential_request": "The caller is requesting sensitive verification information",
    "sensitive_request": "The caller is asking for highly sensitive personal information",
    
    # Isolation tactics
    "secrecy": "The caller is asking for secrecy, a red flag in legitimate transactions",
    "isolating_instruction": "The caller is trying to isolate you from others who might detect the scam",
    
    # Financial manipulation
    "new_payee": "The caller is requesting changes to payment information",
    "fast_payment_channel": "The caller is requesting payment through channels with minimal protection",
    
    # Technical deception
    "remote_support": "The caller is requesting remote access to your device",
    "tech_fear": "The caller is using technical threats to create fear",
    
    # Social engineering
    "social_pressure": "The caller is using social pressure to manipulate you",
    "callback_request": "The caller wants you to call back, possibly to a premium number or to build trust",
    
    # Malicious links/verification
    "malicious_link": "The caller is trying to get you to click on potentially dangerous links",
    "confirm_code": "The caller is asking for verification codes that could compromise your accounts",
    
    # Legal threats
    "collection_threat": "The caller is making collection or legal threats to pressure you",
    
    # URL/domain threats
    "shortened_url": "The caller shared shortened URLs that hide their true destination",
    "suspicious_domain": "The caller referenced suspicious website domains",
    "long_random_url": "The caller mentioned unusually long or random URLs, typical of phishing",
    "ip_address_url": "The caller referenced raw IP addresses instead of proper domain names",
    
    # Email threats
    "email_spoofing": "The conversation involves suspicious email addresses or spoofing",
    "reply_to_spoofing": "The caller mentioned suspicious email reply addresses",
    "display_name_spoofing": "The caller referenced email display name manipulation",
    
    # Attachment threats
    "malicious_attachment": "The conversation mentions suspicious file attachments",
    "disguised_executable": "The caller referenced disguised executable files",
    "password_protected_attachment": "The caller mentioned password-protected attachments, often used to bypass security",
    
    # Credential harvesting
    "fake_login_page": "The caller referenced expired logins or session timeouts to harvest credentials",
    "credential_harvesting": "The caller is attempting to gather your account or payment information",
    "account_suspension_scam": "The caller claims your account is suspended or locked",
    
    # Brand impersonation
    "tech_support_impersonation": "The caller is impersonating technical support from a known company",
    "financial_impersonation": "The caller is impersonating financial institutions",
    "shipping_impersonation": "The caller is impersonating shipping or delivery companies",
    "social_media_impersonation": "The caller is impersonating social media platform support",
    
    # Romance and inheritance scams
    "romance_scam_profile": "The conversation contains elements typical of romance scams",
    "inheritance_lottery_scam": "The caller is using classic inheritance or lottery scam tactics",
    
    # Investment scams
    "investment_scam": "The caller is promoting suspicious investment opportunities",
    "crypto_investment_scam": "The caller is promoting suspicious cryptocurrency investments",
    "securities_fraud": "The caller is engaging in potential securities fraud or market manipulation",
    
    # Job scams
    "work_from_home_scam": "The caller is promoting suspicious work-from-home opportunities",
    "job_scam": "The caller is offering suspicious job opportunities",
    "identity_theft_job": "The caller is requesting sensitive personal information for alleged job purposes",
    
    # Charity scams
    "charity_scam": "The caller is soliciting donations in a suspicious manner",
    "crowdfunding_scam": "The caller referenced suspicious crowdfunding campaigns",
    
    # Lottery scams
    "lottery_scam": "The caller claims you've won a lottery or sweepstakes you didn't enter",
    "nigerian_prince_scam": "The conversation has elements of the classic 'Nigerian prince' or foreign official scam",
    
    # Tech support scams
    "tech_support_scam": "The caller is running a technical support scam",
    "subscription_scam": "The caller claims your subscription needs renewal or payment",
    "software_license_scam": "The caller claims your software license is expired or invalid",
    
    # Banking scams
    "banking_scam": "The caller is attempting a banking-related scam",
    "card_fraud_scam": "The caller claims your card has been compromised",
    "bank_transfer_scam": "The caller is requesting suspicious bank transfers",
    
    # Government scams
    "government_scam": "The caller is impersonating government agencies",
    "legal_threat_scam": "The caller is making legal threats to pressure you",
    "healthcare_scam": "The caller is impersonating healthcare or insurance entities",
    
    # Generic phishing
    "help_request": "The caller is making suspicious help requests",
    "self_reference": "The conversation references scams, which can be a way to build false trust"
}

def generate_scam_summary(matched_rules, found_keywords, risk_level, transcript):
    """
    Generate a human-readable summary of why a call was flagged as a potential scam
    
    Args:
        matched_rules: List of rule tags that matched in the analysis
        found_keywords: List of keywords found in the transcript
        risk_level: The determined risk level (minimal, low, medium, high)
        transcript: The transcript text
        
    Returns:
        str: A summary explaining why the call was flagged
    """
    if risk_level == "minimal" and not matched_rules:
        return "This call appears to be legitimate. No significant scam indicators were detected."
    
    # Start with an appropriate introduction based on risk level
    if risk_level == "high":
        summary = "HIGH RISK: This call contains multiple strong indicators of a scam attempt. "
    elif risk_level == "medium":
        summary = "MEDIUM RISK: This call contains concerning patterns that may indicate a scam. "
    elif risk_level == "low":
        summary = "LOW RISK: This call contains a few concerning elements that warrant caution. "
    else:
        summary = "MINIMAL RISK: This call contains very few concerning elements, but stay vigilant. "

    # Identify top patterns based on weight, frequency, and priority
    top_patterns = []
    if matched_rules:
        # Sort rules by their applied_score (which includes frequency multipliers)
        sorted_rules = sorted(matched_rules, key=lambda x: x.get("applied_score", x.get("weight", 0)), reverse=True)
        
        # Get high-frequency rules
        high_frequency_rules = [rule for rule in sorted_rules if rule.get("frequency", 1) > 2]
        
        # Highlight repeated patterns
        for rule in sorted_rules[:3]:  # Take top 3 rules
            tag = rule.get("tag")
            frequency = rule.get("frequency", 1)
            
            if tag in SCAM_PATTERNS_EXPLANATION:
                explanation = SCAM_PATTERNS_EXPLANATION[tag]
                
                # Add frequency information for repeated patterns
                if frequency > 2:
                    explanation += f" (mentioned {frequency} times)"
                
                top_patterns.append(explanation)
    
    if top_patterns:
        summary += "Key concerns: " + "; ".join(top_patterns) + ". "
    
    # Add information about suspicious keywords and their frequency
    if found_keywords:
        # Count keyword frequencies for display
        keyword_freq = {}
        for keyword in found_keywords:
            lower_keyword = keyword.lower()
            if lower_keyword in keyword_freq:
                keyword_freq[lower_keyword] += 1
            else:
                keyword_freq[lower_keyword] = 1
        
        # Sort keywords by frequency for more relevant display
        sorted_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)
        
        # Format keyword list with frequencies for repeated terms
        formatted_keywords = []
        for keyword, freq in sorted_keywords[:5]:
            if freq > 1:
                formatted_keywords.append(f"{keyword} ({freq}×)")
            else:
                formatted_keywords.append(keyword)
                
    
    # Add appropriate advice based on risk level
    if risk_level in ["high", "medium"]:
        summary += "Recommendation: Do not share personal information or make payments. Hang up and contact the organization directly using their official contact information."
    elif risk_level == "low":
        summary += "Recommendation: Proceed with caution. Verify any requests independently before taking action."
    else:
        summary += "Recommendation: Standard precautions apply. Never share sensitive information unless you initiated the call."
    
    return summary