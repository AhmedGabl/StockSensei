import OpenAI from 'openai';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
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

export interface AudioAnalysisResult {
  audioTranscript?: string;
  toneAnalysis: {
    pace: string;
    clarity: string;
    confidence: string;
    professionalism: string;
    energy: string;
  };
  toneScore: number;
}



async function downloadAudio(audioUrl: string): Promise<string> {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }
  
  const buffer = await response.buffer();
  const tempPath = path.join('/tmp', `audio_${Date.now()}.mp3`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

export async function analyzeAudioRecording(audioUrl: string): Promise<AudioAnalysisResult> {
  try {
    // Download audio file
    const audioPath = await downloadAudio(audioUrl);
    
    try {
      // Transcribe audio using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'text',
        language: 'en'
      });

      // Analyze tone using the transcript with specialized audio prompts
      const tonePrompt = `
      Analyze the following call transcript specifically for TONE OF VOICE characteristics that would be evident in the audio.
      
      TRANSCRIPT: ${transcription}
      
      Evaluate the speaker's tone based on speech patterns, word choice, and communication style that would reflect audio qualities:
      
      1. PACE - How well-paced is the speech? (rushed, appropriate, too slow)
      2. CLARITY - How clear and articulate is the communication? 
      3. CONFIDENCE - What level of confidence is evident in the speech patterns?
      4. PROFESSIONALISM - How professional is the tone and language used?
      5. ENERGY - What energy level is conveyed through the communication?
      
      Provide a tone score from 0-100 and detailed analysis for each aspect.
      
      Respond in JSON format:
      {
        "toneAnalysis": {
          "pace": "detailed analysis",
          "clarity": "detailed analysis", 
          "confidence": "detailed analysis",
          "professionalism": "detailed analysis",
          "energy": "detailed analysis"
        },
        "toneScore": number
      }`;

      const toneResponse = await openai.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert voice and tone analyst. Analyze transcripts for tone qualities that would be evident in audio recordings.'
          },
          {
            role: 'user',
            content: tonePrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const toneContent = toneResponse.choices[0]?.message?.content;
      if (!toneContent) {
        throw new Error('No tone analysis response');
      }

      const toneAnalysis = JSON.parse(toneContent);
      
      return {
        audioTranscript: transcription,
        toneAnalysis: toneAnalysis.toneAnalysis,
        toneScore: Math.max(0, Math.min(100, Math.round(toneAnalysis.toneScore)))
      };

    } finally {
      // Clean up temporary file
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  } catch (error) {
    console.error('Error analyzing audio recording:', error);
    throw new Error('Failed to analyze audio recording');
  }
}

export async function evaluateCallWithAudio(
  transcript: string,
  participantName: string,
  callDuration: string,
  audioUrl?: string
): Promise<CallEvaluationResult> {
  if (!transcript || transcript.trim() === '') {
    throw new Error('No transcript available for evaluation');
  }

  let audioAnalysis: AudioAnalysisResult | null = null;
  
  // Analyze audio if URL is provided
  if (audioUrl) {
    try {
      audioAnalysis = await analyzeAudioRecording(audioUrl);
    } catch (error) {
      console.warn('Audio analysis failed, proceeding with transcript-only evaluation:', error);
    }
  }

  const evaluationPrompt = `
You are an expert call evaluation specialist for a Class Mentor (CM) training program. 
Analyze the following practice call transcript and provide scores for each criterion.

PARTICIPANT: ${participantName}
CALL DURATION: ${callDuration} seconds
TRANSCRIPT:
${transcript}

${audioAnalysis ? `
AUDIO TONE ANALYSIS AVAILABLE:
- Pace: ${audioAnalysis.toneAnalysis.pace}
- Clarity: ${audioAnalysis.toneAnalysis.clarity}  
- Confidence: ${audioAnalysis.toneAnalysis.confidence}
- Professionalism: ${audioAnalysis.toneAnalysis.professionalism}
- Energy: ${audioAnalysis.toneAnalysis.energy}
- Audio-derived Tone Score: ${audioAnalysis.toneScore}

USE THE AUDIO ANALYSIS TO ENHANCE YOUR TONE OF VOICE SCORING.
` : ''}

EVALUATION CRITERIA (Each scored 0-100):

1. TONE OF VOICE (20% weight):
   ${audioAnalysis ? 
     '- Use the provided audio analysis for accurate tone assessment' : 
     '- Infer from transcript: Professional and appropriate tone'
   }
   - Clear communication patterns
   - Confidence and authority in responses
   - Appropriate pace and professionalism

2. BUILDING RAPPORT (20% weight):
   - Establishing connection with student/parent
   - Active listening skills evident in responses
   - Personalization and engagement
   - Creating comfortable atmosphere

3. SHOWING EMPATHY (20% weight):
   - Understanding student/parent concerns
   - Acknowledging feelings and situations
   - Compassionate responses
   - Emotional intelligence in interactions

4. HANDLING SKILLS (20% weight):
   - Problem resolution abilities
   - Objection handling techniques
   - Conflict management
   - Professional responses to challenges

5. KNOWLEDGE (20% weight):
   - Curriculum understanding
   - Company policies and procedures
   - Technical competence
   - Accurate information delivery

INSTRUCTIONS:
- Provide scores from 0-100 for each criterion
- ${audioAnalysis ? 'IMPORTANT: Use the audio tone analysis to inform the Tone of Voice score' : 'Infer tone from transcript patterns'}
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
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
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
    console.error('Error evaluating call with audio:', error);
    throw new Error('Failed to evaluate call');
  }
}

export async function evaluateCallTranscript(
  transcript: string,
  participantName: string,
  callDuration: string
): Promise<CallEvaluationResult> {
  return evaluateCallWithAudio(transcript, participantName, callDuration);
}

export async function isCallEvaluationAvailable(): Promise<boolean> {
  return !!process.env.OPENAI_API_KEY;
}