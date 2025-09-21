import re
import time
from constants import THREAT_KEYWORDS, generate_scam_summary
from rules import calculate_scam_score

class TranscriptAnalyzer:
    """
    Analyzes a live transcript for potential scam indicators and threat keywords.
    """
    
    def __init__(self):
        """Initialize the analyzer with threat keywords"""
        self.threat_keywords = THREAT_KEYWORDS
        # Compile regex patterns for each keyword for faster searching
        self.keyword_patterns = {
            keyword: re.compile(r'\b' + re.escape(keyword) + r'\b', re.IGNORECASE) 
            for keyword in self.threat_keywords
        }
        # Store the current transcript for analysis
        self.current_transcript = ""
        # Track found keywords
        self.found_keywords = set()
        # Store the latest scam score analysis
        self.latest_analysis = None
        # Store the latest AI summary
        self.latest_summary = None
        # Keep track of the last interim analysis timestamp to avoid too frequent updates
        self.last_interim_analysis_time = 0
        # Minimum time between interim analyses (in seconds)
        self.interim_analysis_interval = 1.5

    def update_transcript(self, new_text):
        """
        Update the transcript with new text and analyze for threats
        
        Args:
            new_text (str): New text to add to the transcript
            
        Returns:
            dict: Analysis results including found keywords and scam score
        """
        self.current_transcript += " " + new_text
        return self.analyze_current_transcript()
    
    def analyze_text(self, text, is_interim=True):
        """
        Analyze a text snippet without updating the stored transcript
        Useful for analyzing interim results without adding them to the transcript
        
        Args:
            text (str): Text to analyze
            is_interim (bool): Whether this is an interim (partial) result
            
        Returns:
            dict: Analysis results including found keywords and scam score
        """
        # For interim results, check if we should throttle the analysis
        if is_interim:
            current_time = time.time()
            # If it's too soon since the last interim analysis, we should still analyze the current text
            # to avoid showing stale results with new text
            if (current_time - self.last_interim_analysis_time) < self.interim_analysis_interval:
                # Always analyze the current text to avoid stale percentage with new text
                pass  # Continue with fresh analysis
            # Update the last analysis time
            self.last_interim_analysis_time = current_time
        
        # Find threat keywords in the text
        found_keywords = []
        for keyword, pattern in self.keyword_patterns.items():
            if pattern.search(text):
                found_keywords.append(keyword)
        
        # Calculate the scam score using the rules
        scam_analysis = calculate_scam_score(text)
        
        # Generate an AI summary of why this might be a scam
        summary = generate_scam_summary(
            scam_analysis.get("matches", []),
            found_keywords,
            scam_analysis.get("riskLevel", "minimal"),
            text
        )
        
        # Return the analysis results
        return {
            "foundKeywords": found_keywords,
            "keywordCount": len(found_keywords),
            "newlyFoundKeywords": found_keywords,
            "scamAnalysis": scam_analysis,
            "transcript": text,
            "aiSummary": summary
        }
    
    def analyze_current_transcript(self):
        """
        Analyze the current complete transcript for threat indicators
        
        Returns:
            dict: Analysis results including found keywords and scam score
        """
        # Find all threat keywords in the transcript
        found_keywords = []
        for keyword, pattern in self.keyword_patterns.items():
            if pattern.search(self.current_transcript):
                if keyword not in self.found_keywords:
                    found_keywords.append(keyword)
                self.found_keywords.add(keyword)
        
        # Calculate the scam score using the rules
        self.latest_analysis = calculate_scam_score(self.current_transcript)
        
        # Generate an AI summary of why this might be a scam
        self.latest_summary = generate_scam_summary(
            self.latest_analysis.get("matches", []),
            list(self.found_keywords),
            self.latest_analysis.get("riskLevel", "minimal"),
            self.current_transcript
        )
        
        # Return the analysis results
        return {
            "foundKeywords": list(self.found_keywords),
            "keywordCount": len(self.found_keywords),
            "newlyFoundKeywords": found_keywords,
            "scamAnalysis": self.latest_analysis,
            "transcript": self.current_transcript,
            "aiSummary": self.latest_summary
        }
    
    def get_final_analysis(self):
        """
        Get the final analysis of the complete transcript
        
        Returns:
            dict: Analysis results of the complete transcript
        """
        # Perform fresh analysis on the complete transcript
        if self.current_transcript.strip():
            final_analysis = self.analyze_text(self.current_transcript, is_interim=False)
            return final_analysis
        else:
            return {
                "foundKeywords": [],
                "keywordCount": 0,
                "newlyFoundKeywords": [],
                "scamAnalysis": {"percentageScore": 0, "riskLevel": "low", "description": "No content to analyze"},
                "transcript": "",
                "aiSummary": "No content was detected for analysis."
            }
    
    def reset(self):
        """Reset the transcript and analysis"""
        self.current_transcript = ""
        self.found_keywords = set()
        self.latest_analysis = None


def demo_live_transcript():
    """
    Demonstration of analyzing a simulated live transcript
    """
    from constants import SIMULATED_TRANSCRIPT_PARTS
    import time
    
    analyzer = TranscriptAnalyzer()
    print("Starting live transcript analysis demonstration...")
    print("-" * 50)
    
    for i, text_part in enumerate(SIMULATED_TRANSCRIPT_PARTS):
        print(f"\nReceived transcript part {i+1}:")
        print(f"  \"{text_part}\"")
        
        # Analyze the new transcript part
        result = analyzer.update_transcript(text_part)
        
        # Display results
        if result["newlyFoundKeywords"]:
            print(f"⚠️ New threat keywords found: {', '.join(result['newlyFoundKeywords'])}")
        
        print(f"Risk level: {result['scamAnalysis']['riskLevel']} ({result['scamAnalysis']['percentageScore']}%)")
        print(f"Description: {result['scamAnalysis']['description']}")
        print(f"Total keywords found so far: {result['keywordCount']}")
        
        if i < len(SIMULATED_TRANSCRIPT_PARTS) - 1:
            print("\nListening for more transcript...")
            time.sleep(1)  # Simulate waiting for more transcript
    
    print("\n" + "-" * 50)
    print("Analysis complete.")
    print(f"Final risk assessment: {result['scamAnalysis']['riskLevel']} ({result['scamAnalysis']['percentageScore']}%)")
    print(f"All threat keywords found: {', '.join(result['foundKeywords'])}")
    print("\n🤖 AI Summary:")
    print(result['aiSummary'])


if __name__ == "__main__":
    demo_live_transcript()