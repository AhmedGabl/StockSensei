import OpenAI from "openai";

// Configure for OpenRouter API gateway with OpenAI models
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getChatResponse(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o", // OpenRouter format for OpenAI GPT-4o
      messages: [
        {
          role: "system",
          content: "You are Claude, a helpful AI assistant created by Anthropic. You can help with a wide variety of tasks including answering questions, analysis, writing, coding, math, creative tasks, and general conversation. Be helpful, harmless, and honest in your responses."
        },
        ...messages
      ],
      max_tokens: 1500,
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
      model: "openai/gpt-4o", // OpenRouter format for OpenAI GPT-4o
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

// AI-powered short answer scoring
export async function scoreShortAnswer(
  studentAnswer: string, 
  expectedAnswer: string, 
  questionText: string
): Promise<{ isCorrect: boolean; score: number; explanation: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o", // OpenRouter format for OpenAI GPT-4o
      messages: [
        {
          role: "system",
          content: `You are an expert Class Mentor training evaluator. Score short answer responses based on accuracy, completeness, and understanding. 

SCORING CRITERIA:
- 1.0: Perfect answer - demonstrates complete understanding
- 0.75: Good answer - mostly correct with minor gaps
- 0.5: Partial answer - some understanding but missing key points
- 0.25: Poor answer - minimal understanding or largely incorrect
- 0.0: Incorrect or no relevant content

Consider:
- Key concepts mentioned
- Practical understanding shown
- Relevance to Class Mentor training
- Professional terminology usage

Respond in JSON format only.`
        },
        {
          role: "user",
          content: `Question: "${questionText}"

Expected Answer: "${expectedAnswer}"

Student Answer: "${studentAnswer}"

Please evaluate and respond with:
{
  "score": number (0.0 to 1.0),
  "isCorrect": boolean (true if score >= 0.6),
  "explanation": "Brief explanation of scoring rationale"
}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      score: Math.max(0, Math.min(1, result.score || 0)),
      isCorrect: result.isCorrect || (result.score >= 0.6),
      explanation: result.explanation || "Answer evaluated by AI scoring system."
    };
  } catch (error) {
    console.error("Short answer scoring error:", error);
    return {
      score: 0,
      isCorrect: false,
      explanation: "Unable to score answer automatically. Manual review required."
    };
  }
}