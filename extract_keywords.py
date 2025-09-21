import re
from rules import RULES

def extract_keywords_from_rules():
    """Extract all potential keywords from the regex patterns in RULES"""
    keywords = set()
    
    for rule in RULES:
        # Get the pattern string
        pattern_str = rule["rx"].pattern
        
        # Remove regex specific characters and clean up the pattern
        # First remove the outer parentheses that wrap the whole pattern
        if pattern_str.startswith('(') and pattern_str.endswith(')'):
            pattern_str = pattern_str[1:-1]
        
        # Split by common regex separators
        parts = re.split(r'\||\(|\)|\.\*|\.\+|\.\?|\[|\]|\{|\}|\\s|\?|\\b|\\d|\+', pattern_str)
        
        # Clean up the parts and add them to the set
        for part in parts:
            part = part.strip()
            if part and not part.startswith('\\') and len(part) > 2:
                # Split further by non-alphanumeric characters
                words = re.split(r'[^a-zA-Z0-9\-\'_]', part)
                for word in words:
                    word = word.strip().lower()
                    if word and len(word) > 2 and not word.isdigit():
                        keywords.add(word)
    
    return sorted(list(keywords))

if __name__ == "__main__":
    keywords = extract_keywords_from_rules()
    print("Extracted", len(keywords), "unique keywords from rules.py")
    for keyword in keywords:
        print(keyword)