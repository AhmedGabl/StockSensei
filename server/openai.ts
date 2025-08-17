import OpenAI from "openai";

// Configure for OpenRouter API gateway
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // OpenRouter uses OPENAI_API_KEY env var
  baseURL: "https://openrouter.ai/api/v1",
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getChatResponse(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o", // OpenRouter format: provider/model
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for the CM Training platform. You help Class Mentors with training questions, provide guidance on best practices, and assist with roleplay scenarios. Be professional, supportive, and provide actionable advice."
        },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to get AI response");
  }
}

export async function analyzePracticeCall(transcript: string): Promise<{
  score: number;
  feedback: string;
  improvements: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o", // OpenRouter format: provider/model
      messages: [
        {
          role: "system",
          content: "You are an expert Class Mentor trainer. Analyze practice call transcripts and provide constructive feedback. Rate performance 1-10, give specific feedback, and suggest 3 key improvements. Respond in JSON format."
        },
        {
          role: "user",
          content: `Please analyze this practice call transcript and provide feedback:\n\n${transcript}\n\nFormat: {"score": number, "feedback": "detailed feedback", "improvements": ["improvement1", "improvement2", "improvement3"]}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      score: Math.max(1, Math.min(10, result.score || 5)),
      feedback: result.feedback || "Practice call completed.",
      improvements: result.improvements || ["Continue practicing", "Focus on clarity", "Build confidence"]
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    return {
      score: 5,
      feedback: "Unable to analyze the call at this time. Please try again.",
      improvements: ["Continue practicing", "Focus on communication", "Review training materials"]
    };
  }
}