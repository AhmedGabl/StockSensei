// Ringg AI Service for retrieving call transcripts and data
export class RinggService {
  private apiKey: string;
  private baseUrl = 'https://api.ringg.ai'; // Replace with actual Ringg API base URL
  
  constructor(apiKey: string = process.env.VITE_RINGG_X_API_KEY || 'be40b1db-451c-4ede-9acd-2c4403f51ef0') {
    this.apiKey = apiKey;
  }

  /**
   * Retrieve call transcript and data from Ringg AI API
   */
  async getCallData(callId: string): Promise<{
    callId: string;
    duration: number;
    transcript: string;
    audioUrl: string;
    metrics: any;
  } | null> {
    try {
      console.log(`Fetching call data for call ID: ${callId}`);
      
      // Make API request to Ringg to get call details
      const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Ringg API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      return {
        callId: data.id || callId,
        duration: data.duration || 0,
        transcript: data.transcript || '',
        audioUrl: data.audio_url || data.audioUrl || '',
        metrics: data.metrics || {}
      };
      
    } catch (error) {
      console.error('Error fetching call data from Ringg API:', error);
      return null;
    }
  }

  /**
   * Get call transcript specifically
   */
  async getCallTranscript(callId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/transcript`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Ringg transcript API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.transcript || '';
      
    } catch (error) {
      console.error('Error fetching transcript from Ringg API:', error);
      return null;
    }
  }

  /**
   * Start a new call with Ringg AI
   */
  async startCall(agentId: string, scenario: string): Promise<{
    callId: string;
    sessionToken: string;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          scenario: scenario,
          settings: {
            record_audio: true,
            generate_transcript: true,
            language: 'en'
          }
        }),
      });

      if (!response.ok) {
        console.error(`Ringg start call API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        callId: data.call_id || data.id,
        sessionToken: data.session_token || data.token
      };
      
    } catch (error) {
      console.error('Error starting call with Ringg API:', error);
      return null;
    }
  }

  /**
   * Mock method for development/testing when API is not available
   */
  generateMockCallData(scenario: string, duration: number = 120): {
    callId: string;
    duration: number;
    transcript: string;
    audioUrl: string;
    metrics: any;
  } {
    const mockTranscripts: Record<string, string> = {
      "Low Class Consumption": `Hello, I'm calling about my son Ahmed's English classes. I'm concerned that he's only taking 10 classes this month, and I don't understand why he needs a fixed schedule.

CM: Thank you for calling. I understand your concerns about Ahmed's class consumption. Let me explain our 12-class policy and how it benefits students like Ahmed.

Parent: But I paid for the classes, why can't he take them whenever he wants?

CM: I completely understand your perspective. The 12-class consumption requirement is based on the Ebbinghaus Forgetting Curve research. When students have gaps longer than 2-3 days between classes, they can lose up to 70% of what they learned.

Parent: That's interesting, but my son is busy with school.

CM: I hear you about his school schedule. What if we set up a semi-fixed schedule? We could have the same teacher for consistency but allow some flexibility with timing. This way Ahmed gets the learning benefits while accommodating his school needs.

Parent: That sounds more reasonable. How does that work?

CM: Perfect! I can help you set up a schedule where Ahmed has classes every other day with Teacher Lisa, but we can adjust the times within a 2-hour window. This maintains learning momentum while giving you flexibility.`,
      
      "4th Call Scenario": `Hello, this is the fourth time I'm calling this month. My daughter still seems to be struggling with her English.

CM: Thank you for your patience in working with us. I can see this is your fourth call, and I really appreciate your dedication to your daughter's progress. Let me pull up her learning history.

Parent: I just don't see the improvement I was hoping for.

CM: I understand your concern. Learning a language takes time, and progress isn't always immediately visible. Let me show you some specific improvements I can see in her records.

Parent: What kind of improvements?

CM: Looking at her teacher's notes, I can see her vocabulary has increased by 47 new words this month, and her pronunciation confidence has improved significantly. Her teacher notes she's now initiating conversations in class rather than just responding.

Parent: I hadn't noticed that at home.

CM: That's actually normal. Children often demonstrate skills in the learning environment first. What I'd like to suggest is a progress review session where we can show you exactly what she's learned and provide some activities you can do at home to reinforce her learning.

Parent: That would be helpful.

CM: Excellent! I'll schedule a progress review with her teacher for next week, and I'll also send you a detailed progress report showing her achievements and next learning goals.`
    };

    return {
      callId: `ringg-${Date.now()}`,
      duration,
      transcript: mockTranscripts[scenario] || mockTranscripts["Low Class Consumption"],
      audioUrl: `https://mock-audio-url.com/call-${Date.now()}`,
      metrics: {
        speakingTime: duration * 0.6,
        silenceDuration: duration * 0.4,
        wordsPerMinute: 150,
        sentimentScore: 0.8,
        keywordMatches: ['12-class policy', 'Ebbinghaus', 'learning momentum', 'flexibility']
      }
    };
  }
}

export const ringgService = new RinggService();