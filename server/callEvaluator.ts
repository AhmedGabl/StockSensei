import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CallEvaluationResult {
  overallScore: number;
  toneOfVoiceScore: number;
  buildingRapportScore: number;
  showingEmpathyScore: number;
  handlingSkillsScore: number;
  knowledgeScore: number;
  feedback: string;
}

export async function evaluateCallTranscript(
  transcript: string,
  participantName: string,
  callDuration: string
): Promise<CallEvaluationResult> {
  if (!transcript || transcript.trim() === '') {
    throw new Error('No transcript available for evaluation');
  }

  const evaluationPrompt = `
You are an expert call evaluation specialist for a Class Mentor (CM) training program. 
Analyze the following practice call transcript and provide scores for each criterion.

PARTICIPANT: ${participantName}
CALL DURATION: ${callDuration} seconds
TRANSCRIPT:
${transcript}

EVALUATION CRITERIA (Each scored 0-100):

1. TONE OF VOICE (20% weight):
   - Professional and appropriate tone
   - Clear communication
   - Confidence and authority
   - Appropriate pace and volume

2. BUILDING RAPPORT (20% weight):
   - Establishing connection with student/parent
   - Active listening skills
   - Personalization and engagement
   - Creating comfortable atmosphere

3. SHOWING EMPATHY (20% weight):
   - Understanding student/parent concerns
   - Acknowledging feelings and situations
   - Compassionate responses
   - Emotional intelligence

4. HANDLING SKILLS (20% weight):
   - Problem resolution abilities
   - Objection handling
   - Conflict management
   - Professional responses to challenges

5. KNOWLEDGE (20% weight):
   - Curriculum understanding
   - Company policies and procedures
   - Technical competence
   - Accurate information delivery

INSTRUCTIONS:
- Provide scores from 0-100 for each criterion
- Calculate overall score as weighted average: (sum of all scores) / 5
- Provide specific, actionable feedback with examples from the transcript
- Focus on constructive improvement suggestions
- Be fair but thorough in evaluation

Please respond in the following JSON format:
{
  "overallScore": number,
  "toneOfVoiceScore": number,
  "buildingRapportScore": number,
  "showingEmpathyScore": number,
  "handlingSkillsScore": number,
  "knowledgeScore": number,
  "feedback": "detailed feedback with specific examples and improvement suggestions"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert call evaluation specialist. Provide accurate, fair, and constructive evaluations based on the provided criteria. Always respond with valid JSON format.'
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const evaluation = JSON.parse(content) as CallEvaluationResult;
    
    // Validate scores are within range
    const validateScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));
    
    evaluation.overallScore = validateScore(evaluation.overallScore);
    evaluation.toneOfVoiceScore = validateScore(evaluation.toneOfVoiceScore);
    evaluation.buildingRapportScore = validateScore(evaluation.buildingRapportScore);
    evaluation.showingEmpathyScore = validateScore(evaluation.showingEmpathyScore);
    evaluation.handlingSkillsScore = validateScore(evaluation.handlingSkillsScore);
    evaluation.knowledgeScore = validateScore(evaluation.knowledgeScore);

    return evaluation;
  } catch (error) {
    console.error('Error evaluating call transcript:', error);
    throw new Error('Failed to evaluate call transcript');
  }
}

export async function isCallEvaluationAvailable(): Promise<boolean> {
  return !!process.env.OPENAI_API_KEY;
}