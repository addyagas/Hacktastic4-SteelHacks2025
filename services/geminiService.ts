// Google Gemini AI Service for generating threat explanations

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found. AI explanations will not be available.');
}

export const generateThreatExplanation = async (keywords: string[]): Promise<string> => {
    if (!GEMINI_API_KEY || keywords.length === 0) {
        return "These keywords are commonly used in phone scams to create urgency and extract personal information.";
    }

    try {
        const prompt = `As a cybersecurity expert, explain in exactly 20 words or less why these keywords detected in a phone call could indicate a vishing/phone scam: ${keywords.join(', ')}. Focus on the psychological tactics scammers use.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 50, // Limit to ensure short response
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (explanation) {
            // Ensure it's 20 words or less
            const words = explanation.trim().split(/\s+/);
            if (words.length > 20) {
                return words.slice(0, 20).join(' ') + '...';
            }
            return explanation.trim();
        } else {
            throw new Error('No explanation generated');
        }

    } catch (error) {
        console.error('Error generating threat explanation:', error);
        
        // Fallback explanations based on keyword types
        if (keywords.some(k => ['urgent', 'immediately'].includes(k.toLowerCase()))) {
            return "Scammers create false urgency to pressure victims into quick decisions without thinking.";
        } else if (keywords.some(k => ['verify', 'account', 'security'].includes(k.toLowerCase()))) {
            return "Legitimate companies don't call requesting account verification or sensitive security information.";
        } else if (keywords.some(k => ['gift card', 'wire transfer', 'fee'].includes(k.toLowerCase()))) {
            return "Requests for unusual payment methods like gift cards are major red flags.";
        } else {
            return "These keywords are commonly used in phone scams to create urgency and extract personal information.";
        }
    }
};