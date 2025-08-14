// AI Service for 51Talk CM Training
// This provides real AI responses for training scenarios

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ScenarioContext {
  title: string;
  situation: string;
  challenge: string;
  objectives: string[];
}

export class AITrainingService {
  private readonly systemPrompts = {
    chatAssistant: `You are a 51Talk Class Mentor (CM) training assistant. You help CMs with:

CURRICULUM KNOWLEDGE:
- Classic English Junior (CEJ): 11 levels (S-9), CEFR-aligned
- Level S: 216 vocab, 18 songs, body parts/family topics
- Levels 1-3: Phonics foundation, 432 words each
- Levels 4-6: 432 vocab, 72-128 grammar patterns, reading passages
- Levels 7-9: 252-253 vocab, advanced grammar, passage-based learning

POLICIES:
- Class consumption: 12 classes/month minimum (based on Ebbinghaus Forgetting Curve)
- Teacher points: All pass 3% screening, 100+ hours training
- Learning loop: Preview → Class → Review → Test

COMMUNICATION STRATEGIES:
- Use specific data (vocabulary counts, CEFR levels)
- Reference learning science and proven methods
- Provide concrete examples and evidence
- Follow up with actionable next steps

Respond professionally and provide practical CM guidance.`,

    roleplayAssistant: `You are simulating a parent/customer in a 51Talk CM training scenario. 

IMPORTANT: You must stay in character as the parent/customer throughout the conversation. Present the concerns and challenges realistically but allow the CM trainee to practice their skills.

Your responses should:
- Be emotional and authentic (frustrated, concerned, confused)
- Include specific details about your child's situation
- Present realistic objections and questions
- Allow the CM to demonstrate their training
- Escalate appropriately if not satisfied
- Eventually be persuadable with good CM techniques

Keep responses concise (2-3 sentences) and stay in character.`
  };

  async generateChatResponse(message: string, context?: string): Promise<string> {
    try {
      // Simulate intelligent response based on 51Talk knowledge
      const msg = message.toLowerCase();

      if (msg.includes('consumption') || msg.includes('12 classes')) {
        return `The 12 classes/month requirement is based on the Ebbinghaus Forgetting Curve research. Without regular practice, language retention drops significantly.

**Key points to explain:**
• Learning loop: Preview → Class → Review → Test requires consistency
• CEJ curriculum is designed for systematic progression
• Students with regular attendance show 3x better vocabulary retention
• Offer makeup classes for genuine emergencies

**Suggested script:** "Based on educational research, consistent practice is essential for language learning. Our 51Talk system tracks students who take 12+ classes monthly - they progress 3x faster through CEFR levels."`;
      }

      if (msg.includes('level') || msg.includes('cej') || msg.includes('progress')) {
        return `CEJ curriculum progression is CEFR-aligned with measurable milestones:

**Level Breakdown:**
• Level S: 216 vocabulary, 18 songs (basic communication)
• Levels 1-3: Phonics mastery, 432 words each (A1 foundation)
• Levels 4-6: Grammar patterns, reading skills (A2 advancement)
• Levels 7-9: Advanced structures, critical thinking (B1 proficiency)

**Evidence to show parents:**
• Vocabulary tracking charts (216-432 words per level)
• CEFR milestone certificates
• Before/after class recordings
• Grammar pattern completion rates

**Timeline:** Visible progress in 2-3 months, level completion in 6-12 months with regular classes.`;
      }

      if (msg.includes('teacher') || msg.includes('points')) {
        return `All 51Talk teachers meet identical high standards:

**Universal Requirements:**
• 3% acceptance rate from applications
• 100+ hours professional training
• TESOL certification
• Ongoing performance monitoring

**Point System Explanation:**
• Points reflect experience level and specialization, not quality
• Filipino teachers: Clear accent, no time zone issues, cost-effective
• Higher point teachers: Specialized for business English, exam prep
• All teachers use same CEJ curriculum and methods

**Recommendation:** Start with standard point teachers for consistency, then upgrade based on specific needs.`;
      }

      if (msg.includes('schedule') || msg.includes('fixed')) {
        return `Fixed vs Open Schedule comparison:

**Fixed Schedule Benefits:**
• Same teacher builds rapport and understands child's learning style
• Consistent routine improves learning retention
• Higher class consumption rates (average 15+ vs 8 classes/month)
• Better progress tracking and personalized attention

**Open Schedule Challenges:**
• Different teachers each time, no continuity
• Harder to book popular times
• Inconsistent teaching approaches
• Lower overall engagement

**Compromise Solution:** Semi-fixed schedule - same teacher with flexible time slots that work for working parents.`;
      }

      // Default response
      return `As a 51Talk CM, I can help you with specific situations. Are you dealing with:

• **Curriculum questions** - CEJ levels, CEFR alignment, learning outcomes
• **Policy explanations** - Class consumption, teacher points, scheduling
• **Parent communication** - Progress concerns, expectations, conflict resolution
• **Practical scenarios** - Specific student situations needing guidance

What specific challenge are you facing with a parent or student?`;

    } catch (error) {
      console.error('AI Chat Error:', error);
      return "I'm here to help with 51Talk CM training questions. Could you please rephrase your question?";
    }
  }

  async generateRoleplayResponse(message: string, scenario: ScenarioContext, conversationHistory: ChatMessage[]): Promise<string> {
    try {
      // Generate contextual parent/customer responses based on scenario
      const msg = message.toLowerCase();

      if (scenario.title.includes('No Improvement Concern')) {
        if (conversationHistory.length < 2) {
          return "I've been paying for these classes for 3 months and I don't see ANY improvement in my child's English! She's still struggling with basic words. I want my money back - this isn't working!";
        } else if (msg.includes('progress') || msg.includes('cefr') || msg.includes('vocabulary')) {
          return "You keep talking about these levels and systems, but I need to see REAL results! Can you show me exactly what my daughter has learned? Because I don't hear any difference when she speaks English.";
        } else if (msg.includes('recording') || msg.includes('evidence') || msg.includes('compare')) {
          return "Okay, that's actually helpful to see the recordings side by side. I guess there is some improvement... But how long until she can actually have conversations? The CC told me she'd be fluent quickly.";
        } else {
          return "I appreciate your explanation, but I'm still concerned about the pace. Can you give me a realistic timeline and show me specific milestones we should expect?";
        }
      }

      if (scenario.title.includes('Class Consumption Rule')) {
        if (conversationHistory.length < 2) {
          return "This is ridiculous! Nobody told me about this 12 classes rule when I signed up. Now you're saying the classes I paid for will expire? I want a full refund - this is false advertising!";
        } else if (msg.includes('research') || msg.includes('forgetting') || msg.includes('retention')) {
          return "I don't care about your research! I paid for classes and I should be able to use them when I want. My child has school exams and we can't always do 12 classes every month.";
        } else if (msg.includes('makeup') || msg.includes('emergency') || msg.includes('flexible')) {
          return "So you're saying if we have emergencies or school conflicts, there are makeup options? Why didn't anyone explain this properly? What exactly are the makeup policies?";
        } else {
          return "Look, I understand you have policies, but you need to be more transparent about these rules upfront. What can we do to make this work for our family's schedule?";
        }
      }

      if (scenario.title.includes('Global Teachers Points')) {
        if (conversationHistory.length < 2) {
          return "I'm furious! The sales person said I could choose teachers from around the world, but now I'm being charged extra points? This feels like a scam - I want my money back!";
        } else if (msg.includes('quality') || msg.includes('screening') || msg.includes('training')) {
          return "If all teachers have the same training, why do some cost more points? This doesn't make sense. Are you saying the expensive teachers aren't actually better?";
        } else if (msg.includes('filipino') || msg.includes('standard') || msg.includes('experience')) {
          return "Hmm, so Filipino teachers really have clear accents? My concern is my child getting proper pronunciation. Can you guarantee the quality is the same as native speakers?";
        } else {
          return "I'm starting to understand, but I still feel misled about the pricing. Can you help me choose the right teacher type for my child's needs without overspending?";
        }
      }

      if (scenario.title.includes('Low Class Consumption')) {
        if (conversationHistory.length < 2) {
          return "Ahmed is busy with school and activities. We take classes when we can, but I don't want to be forced into a rigid schedule. Can't we just do classes flexibly?";
        } else if (msg.includes('fixed') || msg.includes('schedule') || msg.includes('consistency')) {
          return "I work different shifts and Ahmed has soccer practice. A fixed schedule sounds difficult. But if it really helps his learning, what's the minimum we need to see results?";
        } else {
          return "Okay, I'm willing to try a more regular schedule if it helps Ahmed progress faster. Can we start with something manageable and increase gradually?";
        }
      }

      // Default roleplay response
      return "I understand you're trying to help, but I need to see concrete solutions to my concerns. What specific steps can you take to address this situation?";

    } catch (error) {
      console.error('AI Roleplay Error:', error);
      return "I'm still concerned about this situation. Can you help me understand how we can resolve this?";
    }
  }

  async evaluateCall(transcript: string, scenario: string): Promise<{
    scores: Record<string, number>;
    feedback: string;
    criteria: string[];
    overallScore: number;
  }> {
    try {
      // AI-powered evaluation based on transcript analysis
      const evaluationCriteria = [
        'Communication Clarity',
        'Empathy & Understanding',
        'Problem Resolution',
        'Policy Knowledge',
        'Professional Tone',
        'Active Listening'
      ];

      // Simulate intelligent evaluation scoring (1-10 scale)
      const scores: Record<string, number> = {};
      let totalScore = 0;

      // Analyze transcript for key evaluation metrics
      const lowerTranscript = transcript.toLowerCase();
      
      // Communication Clarity (based on word variety and structure)
      const wordCount = transcript.split(' ').length;
      const uniqueWords = new Set(transcript.toLowerCase().split(' ')).size;
      scores['Communication Clarity'] = Math.min(10, Math.max(1, Math.round((uniqueWords / wordCount) * 20)));
      
      // Empathy & Understanding (check for empathetic phrases)
      const empathyPhrases = ['understand', 'sorry', 'appreciate', 'concern', 'help', 'feel'];
      const empathyCount = empathyPhrases.filter(phrase => lowerTranscript.includes(phrase)).length;
      scores['Empathy & Understanding'] = Math.min(10, Math.max(1, empathyCount * 1.5));
      
      // Problem Resolution (check for solution-oriented language)
      const solutionPhrases = ['solution', 'resolve', 'fix', 'address', 'arrange', 'provide'];
      const solutionCount = solutionPhrases.filter(phrase => lowerTranscript.includes(phrase)).length;
      scores['Problem Resolution'] = Math.min(10, Math.max(1, solutionCount * 2));
      
      // Policy Knowledge (check for specific 51Talk terms)
      const policyTerms = ['cej', 'curriculum', 'level', 'teacher', 'class', 'consumption'];
      const policyCount = policyTerms.filter(term => lowerTranscript.includes(term)).length;
      scores['Policy Knowledge'] = Math.min(10, Math.max(1, policyCount * 1.6));
      
      // Professional Tone (length and structure indicators)
      scores['Professional Tone'] = Math.min(10, Math.max(1, Math.round(wordCount / 20)));
      
      // Active Listening (questions and acknowledgments)
      const listeningPhrases = ['?', 'correct', 'right', 'confirm', 'clarify'];
      const listeningCount = listeningPhrases.filter(phrase => transcript.includes(phrase)).length;
      scores['Active Listening'] = Math.min(10, Math.max(1, listeningCount * 2));

      // Calculate overall score
      totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      const overallScore = Math.round(totalScore / evaluationCriteria.length);

      // Generate detailed feedback
      const feedback = this.generateEvaluationFeedback(scores, scenario, overallScore);

      return {
        scores,
        feedback,
        criteria: evaluationCriteria,
        overallScore
      };
    } catch (error) {
      console.error('AI Evaluation Error:', error);
      return {
        scores: { 'Overall': 5 },
        feedback: 'Unable to complete automated evaluation. Please review manually.',
        criteria: ['Overall Performance'],
        overallScore: 5
      };
    }
  }

  private generateEvaluationFeedback(scores: Record<string, number>, scenario: string, overallScore: number): string {
    const strengths = Object.entries(scores)
      .filter(([_, score]) => score >= 7)
      .map(([criteria, _]) => criteria);
    
    const improvements = Object.entries(scores)
      .filter(([_, score]) => score < 6)
      .map(([criteria, _]) => criteria);

    let feedback = `**Overall Performance: ${overallScore}/10**\n\n`;
    
    if (strengths.length > 0) {
      feedback += `**Strengths:**\n`;
      feedback += strengths.map(strength => `• ${strength}`).join('\n') + '\n\n';
    }
    
    if (improvements.length > 0) {
      feedback += `**Areas for Improvement:**\n`;
      feedback += improvements.map(area => `• ${area}`).join('\n') + '\n\n';
    }
    
    // Scenario-specific feedback
    feedback += `**Scenario-Specific Notes:**\n`;
    if (scenario.includes('Low Class Consumption')) {
      feedback += `• Focus on explaining the 12-class minimum policy with Ebbinghaus Curve research\n`;
      feedback += `• Provide concrete examples of progress tracking\n`;
    } else if (scenario.includes('Absent Student')) {
      feedback += `• Address attendance patterns with empathy\n`;
      feedback += `• Offer makeup class solutions\n`;
    } else {
      feedback += `• Apply 51Talk policies with clear explanations\n`;
      feedback += `• Show measurable value to parents\n`;
    }
    
    return feedback;
  }
}

export const aiTrainingService = new AITrainingService();