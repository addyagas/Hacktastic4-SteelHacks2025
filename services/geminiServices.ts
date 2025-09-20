
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!import.meta.env.VITE_API_KEY) {
    throw new Error("VITE_API_KEY environment variable is not set");
}

const ai = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

export const getThreatExplanation = async (keywords: string[]): Promise<string> => {
    const prompt = `
        You are an AI assistant helping a senior citizen understand a potential phone scam.
        The following keywords were detected in their conversation: ${keywords.join(', ')}.
        Based on these keywords, explain in a simple, calm, and clear way why this conversation might be a scam.
        Do not be alarming. Use short sentences. Start with a reassuring phrase.
        Advise them to be cautious and suggest they hang up and call a trusted family member or their bank directly using a number they know is real.
        Keep the explanation to 2-3 sentences.
    `;

    try {
        const model = ai.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.3,
            }
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API error:", error);
        return "Could not get an explanation, but please be very cautious. The words detected are often used in scams. It's best to hang up and talk to someone you trust.";
    }
};
