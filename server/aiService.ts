// AI Training Service for evaluating practice calls and generating student feedback

interface CallEvaluationCriteria {
  communicationClarity: number;
  empathy: number;
  problemResolution: number;
  policyKnowledge: number;
  professionalTone: number;
  activeListening: number;
}

interface AIEvaluationResult {
  overallScore: number;
  scores: CallEvaluationCriteria;
  feedback: string;
  criteria: string[];
  strengths: string[];
  improvements: string[];
}

class AITrainingService {
  async evaluateCall(transcript: string, scenario: string): Promise<AIEvaluationResult> {
    // Simulate AI evaluation based on transcript analysis and scenario context
    // In a real implementation, this would integrate with an AI service like OpenAI or Claude
    
    const evaluation = this.analyzeTranscriptForScenario(transcript, scenario);
    
    return {
      overallScore: evaluation.overallScore,
      scores: evaluation.scores,
      feedback: evaluation.feedback,
      criteria: [
        "Communication Clarity",
        "Empathy & Understanding", 
        "Problem Resolution",
        "Policy Knowledge",
        "Professional Tone",
        "Active Listening"
      ],
      strengths: this.identifyStrengths(evaluation.scores),
      improvements: this.identifyImprovements(evaluation.scores)
    };
  }

  private analyzeTranscriptForScenario(transcript: string, scenario: string): {
    overallScore: number;
    scores: CallEvaluationCriteria;
    feedback: string;
  } {
    // Detailed analysis based on transcript content and scenario type
    const words = transcript.toLowerCase().split(' ');
    const totalWords = words.length;
    
    // Base scoring analysis
    let scores: CallEvaluationCriteria = {
      communicationClarity: this.evaluateClarity(transcript),
      empathy: this.evaluateEmpathy(transcript),
      problemResolution: this.evaluateProblemSolving(transcript, scenario),
      policyKnowledge: this.evaluatePolicyKnowledge(transcript, scenario),
      professionalTone: this.evaluateProfessionalism(transcript),
      activeListening: this.evaluateListening(transcript)
    };

    // Scenario-specific adjustments
    if (scenario.includes('Low Class Consumption')) {
      scores = this.adjustForLowConsumptionScenario(scores, transcript);
    } else if (scenario.includes('4th Call')) {
      scores = this.adjustForFourthCallScenario(scores, transcript);
    }

    const overallScore = Math.round(
      (scores.communicationClarity + scores.empathy + scores.problemResolution + 
       scores.policyKnowledge + scores.professionalTone + scores.activeListening) / 6
    );

    const feedback = this.generateDetailedFeedback(scores, scenario, transcript);

    return { overallScore, scores, feedback };
  }

  private evaluateClarity(transcript: string): number {
    const words = transcript.toLowerCase().split(' ');
    const totalWords = words.length;
    
    // Check for clear communication indicators
    const clarityWords = ['understand', 'clear', 'explain', 'mean', 'help', 'see', 'know'];
    const clarityCount = clarityWords.reduce((count, word) => 
      count + words.filter(w => w.includes(word)).length, 0);
    
    // Check for filler words (negative impact)
    const fillers = ['um', 'uh', 'like', 'you know', 'actually'];
    const fillerCount = fillers.reduce((count, word) => 
      count + words.filter(w => w.includes(word)).length, 0);
    
    const clarityRatio = clarityCount / Math.max(totalWords / 50, 1);
    const fillerPenalty = fillerCount / Math.max(totalWords / 100, 1);
    
    return Math.max(4, Math.min(10, Math.round(6 + clarityRatio * 2 - fillerPenalty)));
  }

  private evaluateEmpathy(transcript: string): number {
    const empathyPhrases = [
      'i understand', 'i see', 'that must be', 'i appreciate', 'thank you for',
      'i can imagine', 'that sounds', 'i hear you', 'i get it', 'makes sense'
    ];
    
    const transcript_lower = transcript.toLowerCase();
    const empathyCount = empathyPhrases.reduce((count, phrase) => 
      count + (transcript_lower.includes(phrase) ? 1 : 0), 0);
    
    return Math.max(4, Math.min(10, 5 + empathyCount));
  }

  private evaluateProblemSolving(transcript: string, scenario: string): number {
    const solutionWords = [
      'solution', 'solve', 'fix', 'help', 'resolve', 'address', 'handle',
      'recommend', 'suggest', 'propose', 'option', 'alternative'
    ];
    
    const words = transcript.toLowerCase().split(' ');
    const solutionCount = solutionWords.reduce((count, word) => 
      count + words.filter(w => w.includes(word)).length, 0);
    
    // Scenario-specific evaluation
    let baseScore = Math.min(10, 4 + solutionCount);
    
    if (scenario.includes('Low Class Consumption') && 
        transcript.toLowerCase().includes('12 class')) {
      baseScore += 2;
    }
    
    return Math.max(3, Math.min(10, baseScore));
  }

  private evaluatePolicyKnowledge(transcript: string, scenario: string): number {
    const policyWords = ['policy', 'rule', 'guideline', 'standard', 'procedure', 'protocol'];
    const words = transcript.toLowerCase().split(' ');
    const policyCount = policyWords.reduce((count, word) => 
      count + words.filter(w => w.includes(word)).length, 0);
    
    let score = 5 + policyCount;
    
    // Scenario-specific policy knowledge
    if (scenario.includes('Low Class Consumption')) {
      if (transcript.toLowerCase().includes('ebbinghaus') || 
          transcript.toLowerCase().includes('forgetting curve')) {
        score += 2;
      }
      if (transcript.toLowerCase().includes('12 class') || 
          transcript.toLowerCase().includes('consumption policy')) {
        score += 1;
      }
    }
    
    return Math.max(3, Math.min(10, score));
  }

  private evaluateProfessionalism(transcript: string): number {
    const professionalWords = [
      'please', 'thank you', 'certainly', 'absolutely', 'definitely',
      'appreciate', 'welcome', 'glad', 'happy', 'assist'
    ];
    
    const words = transcript.toLowerCase().split(' ');
    const professionalCount = professionalWords.reduce((count, word) => 
      count + words.filter(w => w.includes(word)).length, 0);
    
    // Check for unprofessional elements
    const casual = ['yeah', 'ok', 'sure', 'no problem', 'whatever'];
    const casualCount = casual.reduce((count, word) => 
      count + words.filter(w => w === word).length, 0);
    
    return Math.max(4, Math.min(10, 6 + professionalCount - casualCount));
  }

  private evaluateListening(transcript: string): number {
    const listeningCues = [
      'what you said', 'you mentioned', 'you told me', 'you explained',
      'from what i understand', 'if i heard correctly', 'you mean',
      'let me make sure', 'confirm', 'clarify'
    ];
    
    const transcript_lower = transcript.toLowerCase();
    const listeningCount = listeningCues.reduce((count, cue) => 
      count + (transcript_lower.includes(cue) ? 1 : 0), 0);
    
    return Math.max(4, Math.min(10, 5 + listeningCount));
  }

  private adjustForLowConsumptionScenario(scores: CallEvaluationCriteria, transcript: string): CallEvaluationCriteria {
    const transcript_lower = transcript.toLowerCase();
    
    // Bonus for mentioning key concepts
    if (transcript_lower.includes('ebbinghaus') || transcript_lower.includes('forgetting curve')) {
      scores.policyKnowledge = Math.min(10, scores.policyKnowledge + 1);
    }
    
    if (transcript_lower.includes('12 class') || transcript_lower.includes('consumption policy')) {
      scores.policyKnowledge = Math.min(10, scores.policyKnowledge + 1);
      scores.problemResolution = Math.min(10, scores.problemResolution + 1);
    }
    
    return scores;
  }

  private adjustForFourthCallScenario(scores: CallEvaluationCriteria, transcript: string): CallEvaluationCriteria {
    const transcript_lower = transcript.toLowerCase();
    
    // Check for relationship building in 4th call
    if (transcript_lower.includes('progress') || transcript_lower.includes('improvement')) {
      scores.empathy = Math.min(10, scores.empathy + 1);
    }
    
    if (transcript_lower.includes('continue') || transcript_lower.includes('keep going')) {
      scores.problemResolution = Math.min(10, scores.problemResolution + 1);
    }
    
    return scores;
  }

  private identifyStrengths(scores: CallEvaluationCriteria): string[] {
    const strengths: string[] = [];
    
    if (scores.communicationClarity >= 7) strengths.push("Clear Communication");
    if (scores.empathy >= 7) strengths.push("Empathetic Approach");
    if (scores.problemResolution >= 7) strengths.push("Problem-Solving Skills");
    if (scores.policyKnowledge >= 7) strengths.push("Policy Knowledge");
    if (scores.professionalTone >= 7) strengths.push("Professional Demeanor");
    if (scores.activeListening >= 7) strengths.push("Active Listening");
    
    return strengths;
  }

  private identifyImprovements(scores: CallEvaluationCriteria): string[] {
    const improvements: string[] = [];
    
    if (scores.communicationClarity < 6) improvements.push("Communication Clarity");
    if (scores.empathy < 6) improvements.push("Empathy & Understanding");
    if (scores.problemResolution < 6) improvements.push("Problem Resolution");
    if (scores.policyKnowledge < 6) improvements.push("Policy Knowledge");
    if (scores.professionalTone < 6) improvements.push("Professional Tone");
    if (scores.activeListening < 6) improvements.push("Active Listening");
    
    return improvements;
  }

  private generateDetailedFeedback(scores: CallEvaluationCriteria, scenario: string, transcript: string): string {
    let feedback = "";
    
    // Overall performance assessment
    const avgScore = (scores.communicationClarity + scores.empathy + scores.problemResolution + 
                     scores.policyKnowledge + scores.professionalTone + scores.activeListening) / 6;
    
    if (avgScore >= 8) {
      feedback += "**Excellent Performance!** Your call demonstrated strong skills across all evaluation criteria.\n\n";
    } else if (avgScore >= 6) {
      feedback += "**Good Performance!** Your call showed solid competency with some areas for enhancement.\n\n";
    } else {
      feedback += "**Development Opportunity** Your call shows promise with several key areas to focus on for improvement.\n\n";
    }

    // Communication clarity feedback
    if (scores.communicationClarity >= 7) {
      feedback += "**Communication:** Your explanations were clear and easy to follow. You effectively conveyed information to the customer.\n";
    } else if (scores.communicationClarity >= 5) {
      feedback += "**Communication:** Generally clear communication with room to reduce filler words and improve explanation clarity.\n";
    } else {
      feedback += "**Communication:** Focus on speaking more clearly and reducing filler words. Practice explaining concepts step-by-step.\n";
    }

    // Empathy feedback
    if (scores.empathy >= 7) {
      feedback += "**Empathy:** You demonstrated genuine understanding and care for the customer's situation.\n";
    } else {
      feedback += "**Empathy:** Try to acknowledge the customer's feelings more often and show understanding of their perspective.\n";
    }

    // Problem resolution feedback
    if (scores.problemResolution >= 7) {
      feedback += "**Problem Solving:** You effectively addressed the customer's concerns and provided helpful solutions.\n";
    } else {
      feedback += "**Problem Solving:** Work on identifying customer needs more clearly and offering specific, actionable solutions.\n";
    }

    // Scenario-specific feedback
    if (scenario.includes('Low Class Consumption')) {
      if (transcript.toLowerCase().includes('ebbinghaus') || transcript.toLowerCase().includes('12 class')) {
        feedback += "**Scenario Knowledge:** Great job referencing the 12-class policy and learning principles!\n";
      } else {
        feedback += "**Scenario Knowledge:** Remember to mention the 12-class consumption policy and Ebbinghaus forgetting curve research.\n";
      }
    }

    feedback += "\n**Next Steps:** Continue practicing active listening, policy application, and solution-oriented responses.";
    
    return feedback;
  }
}

export const aiTrainingService = new AITrainingService();