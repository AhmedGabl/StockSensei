import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CallFeedbackModal } from "./call-feedback-modal";

export function TestFeedbackButton() {
  const [showFeedback, setShowFeedback] = useState(false);
  
  return (
    <>
      <Button 
        onClick={() => setShowFeedback(true)}
        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
        data-testid="button-test-feedback"
      >
        <i className="fas fa-star mr-2"></i>
        View Sample Feedback
      </Button>
      
      {showFeedback && (
        <CallFeedbackModal
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          callId="51b03fbc-e042-47ce-bc08-8bdc87ce3e9b"
        />
      )}
    </>
  );
}