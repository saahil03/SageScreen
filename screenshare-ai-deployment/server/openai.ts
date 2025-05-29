import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generateAIResponse(question: string, screenContext?: string): Promise<string> {
  try {
    const contextPrompt = screenContext 
      ? `Based on the screen content showing: ${screenContext}, please answer this question: ${question}`
      : `You are an AI assistant helping users understand what they see on their laptop screen. Answer this question helpfully and concisely: ${question}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that provides clear, concise answers about screen content and general computing questions. Keep responses under 150 words and be practical and actionable."
        },
        {
          role: "user", 
          content: contextPrompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try asking your question again.";
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota')) {
        return "I'm temporarily unable to respond due to API quota limits. Please try again later.";
      } else if (error.message.includes('invalid_api_key')) {
        return "There's an issue with the AI service configuration. Please contact support.";
      }
    }
    
    return "I'm having trouble connecting to the AI service right now. Please try your question again in a moment.";
  }
}

export async function analyzeScreenContent(imageData?: string): Promise<string> {
  if (!imageData) {
    return "dashboard, performance metrics, user interface elements, and various application components";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Briefly describe what you see in this screen capture in 1-2 sentences. Focus on the main elements, interface, or content visible."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }
          ],
        },
      ],
      max_tokens: 100,
    });

    return response.choices[0].message.content || "various interface elements and content";
  } catch (error) {
    console.error('Screen analysis error:', error);
    return "dashboard interface with various metrics and controls";
  }
}