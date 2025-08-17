import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotpressChat } from "./botpress-chat";
import { User } from "@/lib/types";

interface AIAssistantHubProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantHub({ user, isOpen, onClose }: AIAssistantHubProps) {
  const [activeTab, setActiveTab] = useState("chat");

  const scenarios = [
    {
      id: 1,
      title: "Low Class Consumption - Ahmed",
      situation: "Ahmed, 10 YO, international school. His consumption this month is 10 Level 3, No Fixed schedule.",
      challenge: "Student has low class consumption and no fixed schedule",
      objectives: ["Understand reasons for low consumption", "Propose fixed schedule benefits", "Address parent concerns"]
    },
    {
      id: 2,
      title: "Absent Student - Yara",
      situation: "Yara 6 YO, fixed 5 per week, class consumption on 20th is only 6 classes (a lot of absences) Level S",
      challenge: "High absence rate despite fixed schedule",
      objectives: ["Identify absence patterns", "Work with parent on commitment", "Suggest makeup solutions"]
    },
    {
      id: 3,
      title: "Class Consumption Rule Complaint",
      situation: "Customer refuses to accept the class consumption rule and is angry about the 12 classes/month requirement",
      challenge: "Customer wants refund, claims they weren't informed about consumption rules",
      objectives: ["Explain consumption policy clearly", "Show value of regular classes", "Find compromise solution"]
    },
    {
      id: 4,
      title: "No Improvement Concern",
      situation: "Customer says there's no improvement in child's English level and wants refund",
      challenge: "Parent has unrealistic expectations about progress timeline",
      objectives: ["Explain 51Talk learning progression", "Show measurable improvements", "Set realistic expectations"]
    },
    {
      id: 5,
      title: "Global Teachers Points Issue",
      situation: "Customer angry about global teacher points system, wasn't informed by CC about point differences",
      challenge: "Pricing transparency and teacher selection confusion",
      objectives: ["Explain teacher point system", "Show value of different teachers", "Resolve billing concerns"]
    }
  ];

  const startVoicePracticeCall = () => {
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const voiceWindow = window.open('', '_blank', 'width=900,height=700');
    if (voiceWindow) {
      voiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>CM Roleplay Practice - 51Talk Training</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body class="bg-slate-50 min-h-screen">
          <div class="container mx-auto p-6 max-w-4xl">
            <div class="bg-white rounded-lg shadow-lg p-6">
              <div class="text-center mb-6">
                <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i class="fas fa-headset text-white text-2xl"></i>
                </div>
                <h1 class="text-2xl font-bold text-slate-800">CM Roleplay Practice</h1>
                <p class="text-slate-600">51Talk Class Mentor Training Session</p>
              </div>
              
              <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h3 class="font-semibold text-blue-900 mb-2">${randomScenario.title}</h3>
                  <p class="text-blue-800 text-sm mb-3"><strong>Situation:</strong> ${randomScenario.situation}</p>
                  <p class="text-blue-700 text-sm"><strong>Challenge:</strong> ${randomScenario.challenge}</p>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                  <h4 class="font-semibold text-green-900 mb-2">Learning Objectives:</h4>
                  <ul class="text-green-800 text-sm space-y-1">
                    ${randomScenario.objectives.map(obj => `<li>• ${obj}</li>`).join('')}
                  </ul>
                </div>
              </div>
              
              <div class="bg-yellow-50 p-4 rounded-lg mb-6">
                <h4 class="font-semibold text-yellow-900 mb-2">Key 51Talk Information to Remember:</h4>
                <div class="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
                  <div>
                    <p><strong>CEJ Levels:</strong> Level S-9 (11 levels total)</p>
                    <p><strong>Class Structure:</strong> 25-minute 1-on-1 sessions</p>
                    <p><strong>Learning Loop:</strong> Preview → Class → Review → Test</p>
                  </div>
                  <div>
                    <p><strong>Teacher Quality:</strong> 3% pass rate, 100+ hours training</p>
                    <p><strong>Platform:</strong> Air Class multi-device support</p>
                    <p><strong>Curriculum:</strong> CEFR-aligned, 720+ life scenarios</p>
                  </div>
                </div>
              </div>
              
              <!-- Interactive Roleplay Chat -->
              <div class="bg-white border rounded-lg mb-6">
                <div class="p-4 border-b bg-slate-50">
                  <h4 class="font-semibold text-slate-800">Interactive Roleplay Chat</h4>
                  <p class="text-sm text-slate-600">Practice with AI parent simulation</p>
                </div>
                <div id="roleplayChat" class="h-64 overflow-y-auto p-4 space-y-3">
                  <div class="bg-red-50 p-3 rounded-lg max-w-md">
                    <div class="flex items-center space-x-2 mb-1">
                      <i class="fas fa-user text-red-600"></i>
                      <span class="text-sm font-medium text-red-800">Parent</span>
                    </div>
                    <p class="text-sm text-red-700">${randomScenario.situation}</p>
                  </div>
                </div>
                <div class="p-4 border-t">
                  <div class="flex space-x-2">
                    <input 
                      type="text" 
                      id="roleplayInput" 
                      placeholder="Type your CM response..." 
                      class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onkeypress="handleKeyPress(event)"
                    >
                    <button 
                      onclick="sendRoleplayMessage()" 
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      <i class="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>
                
              <div class="flex justify-center space-x-4 mb-6">
                <button onclick="startCall()" id="startBtn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2">
                  <i class="fas fa-play"></i>
                  <span>Start Voice Session</span>
                </button>
                <button onclick="endCall()" id="endBtn" class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hidden">
                  <i class="fas fa-stop"></i>
                  <span>End Session</span>
                </button>
              </div>
              
              <div id="callStatus" class="hidden bg-green-50 p-4 rounded-lg mb-4">
                <div class="flex items-center justify-center space-x-2 mb-3">
                  <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-green-700 font-medium">Roleplay Session Active</span>
                  <span id="timer" class="text-green-600 font-mono">00:00</span>
                </div>
                <div class="text-center">
                  <p class="text-sm text-green-700 mb-2">Practice your CM skills in this realistic scenario</p>
                  <button onclick="showTips()" class="text-green-600 hover:text-green-800 text-sm underline">Show Conversation Tips</button>
                </div>
              </div>
              
              <div id="tips" class="hidden bg-blue-50 p-4 rounded-lg mb-4">
                <h5 class="font-semibold text-blue-900 mb-2">CM Best Practices:</h5>
                <ul class="text-blue-800 text-sm space-y-1">
                  <li>• Listen actively and acknowledge concerns</li>
                  <li>• Reference specific 51Talk curriculum benefits</li>
                  <li>• Use data to show progress (CEFR levels, vocabulary count)</li>
                  <li>• Offer practical solutions, not just explanations</li>
                  <li>• Follow up with clear next steps</li>
                </ul>
              </div>
              
              <div id="callSummary" class="hidden bg-slate-50 p-4 rounded-lg">
                <h4 class="font-semibold text-slate-800 mb-3">Session Summary</h4>
                <div class="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span class="font-medium">Duration:</span> <span id="duration">0:00</span></p>
                    <p><span class="font-medium">Scenario:</span> ${randomScenario.title}</p>
                    <p><span class="font-medium">Status:</span> <span class="text-green-600">Completed</span></p>
                  </div>
                  <div>
                    <p><span class="font-medium">Focus Area:</span> CM Communication Skills</p>
                    <p><span class="font-medium">Next Steps:</span> Review 51Talk curriculum details</p>
                  </div>
                </div>
              </div>
              </div>
              
              <div class="mt-6 pt-4 border-t">
                <div class="flex justify-between items-center">
                  <button onclick="window.location.reload()" class="text-blue-600 hover:text-blue-800 text-sm">
                    <i class="fas fa-redo mr-1"></i> Try Another Scenario
                  </button>
                  <button onclick="window.close()" class="text-slate-500 hover:text-slate-700 text-sm">
                    Close Session
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <script>
            let startTime;
            let duration = 0;
            let timerInterval;
            
            function startCall() {
              startTime = Date.now();
              document.getElementById('startBtn').classList.add('hidden');
              document.getElementById('endBtn').classList.remove('hidden');
              document.getElementById('callStatus').classList.remove('hidden');
              
              // Update timer
              timerInterval = setInterval(() => {
                duration = Math.floor((Date.now() - startTime) / 1000);
                document.getElementById('timer').textContent = formatTime(duration);
              }, 1000);
            }
            
            function endCall() {
              clearInterval(timerInterval);
              document.getElementById('endBtn').classList.add('hidden');
              document.getElementById('callStatus').classList.add('hidden');
              document.getElementById('tips').classList.add('hidden');
              document.getElementById('callSummary').classList.remove('hidden');
              document.getElementById('duration').textContent = formatTime(duration);
              
              // Save practice session record
              fetch(window.opener.location.origin + '/api/practice-calls', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  scenario: \`${randomScenario.title}\`,
                  outcome: 'COMPLETED',
                  notes: \`CM roleplay training: ${randomScenario.challenge}\`
                })
              }).catch(err => console.log('Training session completed'));
            }
            
            function showTips() {
              document.getElementById('tips').classList.toggle('hidden');
            }
            
            function formatTime(seconds) {
              const mins = Math.floor(seconds / 60);
              const secs = seconds % 60;
              return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
            }
          </script>
        </body>
        </html>
      `);
    }
    onClose();
  };

  const openTextAssistant = () => {
    const textWindow = window.open('', '_blank', 'width=1000,height=700');
    if (textWindow) {
      textWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>51Talk CM Knowledge Assistant</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body class="bg-slate-50 min-h-screen">
          <div class="container mx-auto p-6 max-w-6xl">
            <div class="bg-white rounded-lg shadow-lg h-[85vh] flex flex-col">
              <div class="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <h1 class="text-xl font-bold">51Talk CM Knowledge Assistant</h1>
                <p class="text-blue-100 text-sm">Expert guidance on curriculum, policies, and best practices</p>
              </div>
              
              <div class="flex-1 flex">
                <div class="w-1/3 border-r bg-slate-50 p-4 overflow-y-auto">
                  <h3 class="font-semibold text-slate-800 mb-3">Knowledge Base</h3>
                  <div class="space-y-3">
                    <div>
                      <h4 class="font-medium text-slate-700 mb-2">Curriculum</h4>
                      <div class="space-y-1">
                        <button onclick="loadTopic('cej')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Classic English Junior (CEJ)</button>
                        <button onclick="loadTopic('levels')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Level System (S-9)</button>
                        <button onclick="loadTopic('cefr')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">CEFR Alignment</button>
                        <button onclick="loadTopic('business')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Business English</button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 class="font-medium text-slate-700 mb-2">Common Issues</h4>
                      <div class="space-y-1">
                        <button onclick="loadTopic('consumption')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Class Consumption Rules</button>
                        <button onclick="loadTopic('points')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Teacher Points System</button>
                        <button onclick="loadTopic('progress')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Progress Expectations</button>
                        <button onclick="loadTopic('scheduling')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Fixed vs Open Schedule</button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 class="font-medium text-slate-700 mb-2">CM Best Practices</h4>
                      <div class="space-y-1">
                        <button onclick="loadTopic('communication')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Parent Communication</button>
                        <button onclick="loadTopic('escalation')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Issue Resolution</button>
                        <button onclick="loadTopic('reports')" class="w-full text-left px-3 py-2 rounded hover:bg-slate-200 text-sm">Progress Reports</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="flex-1 flex flex-col">
                  <div id="chatArea" class="flex-1 p-4 overflow-y-auto">
                    <div class="mb-4">
                      <div class="bg-purple-100 p-3 rounded-lg max-w-md">
                        <p class="text-sm text-purple-800">Hello! I'm your advanced text assistant. I can help with detailed training questions, policy interpretation, and complex scenarios. What would you like to know?</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="border-t p-4">
                    <div class="flex space-x-2">
                      <input 
                        type="text" 
                        id="messageInput"
                        placeholder="Ask me anything about CM training..." 
                        class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onkeypress="if(event.key==='Enter') sendMessage()"
                      />
                      <button 
                        onclick="sendMessage()"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <script>
            function loadTopic(topic) {
              const topicQueries = {
                cej: "Tell me about the Classic English Junior (CEJ) curriculum system",
                levels: "Explain the 51Talk level progression from S to 9", 
                cefr: "How does 51Talk align with CEFR standards?",
                business: "What is the Business English course structure?",
                consumption: "Explain the class consumption policy and rules",
                points: "How does the teacher points system work?",
                progress: "What are realistic progress expectations for students?",
                scheduling: "Compare fixed vs open schedule benefits",
                communication: "What are best practices for parent communication?",
                escalation: "How should CMs handle issue resolution?",
                reports: "How do I create effective progress reports?"
              };
              
              if (topicQueries[topic]) {
                addMessage(topicQueries[topic], 'user');
                
                // Show thinking message
                addMessage('Loading information...', 'assistant', 'thinking');
                
                // Get real AI response
                fetch('/api/ai/chat', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    message: topicQueries[topic],
                    context: '51Talk CM Knowledge Base'
                  })
                })
                .then(res => res.json())
                .then(data => {
                  // Remove thinking message
                  const thinkingMsg = document.querySelector('[data-type="thinking"]');
                  if (thinkingMsg) thinkingMsg.remove();
                  
                  if (data.response) {
                    addMessage(data.response, 'assistant');
                  } else {
                    addMessage('Sorry, I had trouble loading that information.', 'assistant');
                  }
                })
                .catch(err => {
                  console.error('Topic API Error:', err);
                  // Remove thinking message
                  const thinkingMsg = document.querySelector('[data-type="thinking"]');
                  if (thinkingMsg) thinkingMsg.remove();
                  
                  addMessage('Unable to load topic information right now.', 'assistant');
                });
              }
            }
            
            function sendMessage() {
              const input = document.getElementById('messageInput');
              const message = input.value.trim();
              if (!message) return;
              
              addMessage(message, 'user');
              input.value = '';
              
              // Show thinking message
              addMessage('Analyzing your question...', 'assistant', 'thinking');
              
              // Get real AI response from backend
              fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  message: message,
                  context: '51Talk CM Knowledge Assistant'
                })
              })
              .then(res => res.json())
              .then(data => {
                // Remove thinking message
                const thinkingMsg = document.querySelector('[data-type="thinking"]');
                if (thinkingMsg) thinkingMsg.remove();
                
                if (data.response) {
                  addMessage(data.response, 'assistant');
                } else {
                  addMessage('Sorry, I had trouble processing your request. Please try again.', 'assistant');
                }
              })
              .catch(err => {
                console.error('AI API Error:', err);
                // Remove thinking message
                const thinkingMsg = document.querySelector('[data-type="thinking"]');
                if (thinkingMsg) thinkingMsg.remove();
                
                addMessage('I\\'m having trouble connecting right now. Please try again.', 'assistant');
              });
            }
            
            function generateResponse(message) {
              const msg = message.toLowerCase();
              
              if (msg.includes('consumption') || msg.includes('12 classes')) {
                return "**Class Consumption Rule Explanation:**\\n\\nThe 12 classes/month requirement is based on educational research (Ebbinghaus Forgetting Curve). Without regular practice, language learning retention drops significantly.\\n\\n**Key points to emphasize:**\\n• Learning loop: Preview → Class → Review → Test\\n• Consistent exposure builds neural pathways\\n• 51Talk's system designed for optimal retention\\n• Flexibility with makeup classes for emergencies\\n\\n**Suggested approach:** Show parent successful student examples with regular attendance vs. irregular patterns.";
              }
              
              if (msg.includes('progress') || msg.includes('improvement')) {
                return "**Managing Progress Expectations:**\\n\\n**Realistic Timeline:**\\n• First month: Comfort with platform and teacher\\n• 2-3 months: Noticeable vocabulary increase\\n• 6+ months: Fluency improvement in target level\\n\\n**Evidence to provide:**\\n• Recorded class comparisons\\n• Vocabulary tracking (216+ words per level)\\n• CEFR milestone achievements\\n• Teacher feedback reports\\n\\n**Remember:** Language learning is gradual but measurable with 51Talk's systematic approach.";
              }
              
              if (msg.includes('teacher') || msg.includes('points')) {
                return "**Teacher Points System Clarification:**\\n\\n**All teachers meet same standards:**\\n• 3% pass rate from applications\\n• 100+ hours professional training\\n• TESOL certification requirements\\n\\n**Point differences reflect:**\\n• Teaching experience level\\n• Specialization areas\\n• Demand and availability\\n\\n**Recommendation:** Start with standard point teachers for consistency, upgrade based on specific needs (business English, exam prep, etc.).";
              }
              
              if (msg.includes('schedule') || msg.includes('fixed')) {
                return "**Fixed vs Open Schedule Benefits:**\\n\\n**Fixed Schedule Advantages:**\\n• Guaranteed teacher consistency\\n• Builds learning routine\\n• Higher consumption rates\\n• Better progress tracking\\n\\n**Open Schedule Challenges:**\\n• Teacher availability varies\\n• Inconsistent learning rhythm\\n• Lower completion rates\\n\\n**Solution:** Offer semi-fixed (same teacher, flexible times) as compromise for working parents.";
              }
              
              return "Based on 51Talk's curriculum framework and your question, I recommend checking our specific policies in the knowledge base. Each situation requires understanding both our educational methodology and individual student needs.\\n\\nWould you like me to explain any specific aspect of our CEFR-aligned curriculum or teaching approach?";
            }
            
            function addMessage(text, sender, type = '') {
              const chatArea = document.getElementById('chatArea');
              const messageDiv = document.createElement('div');
              messageDiv.className = 'mb-4';
              if (type) messageDiv.setAttribute('data-type', type);
              
              if (sender === 'user') {
                messageDiv.innerHTML = \`
                  <div class="flex justify-end">
                    <div class="bg-purple-600 text-white p-3 rounded-lg max-w-md">
                      <p class="text-sm">\${text}</p>
                    </div>
                  </div>
                \`;
              } else {
                const bgClass = type === 'thinking' ? 'bg-yellow-100' : 'bg-purple-100';
                const textClass = type === 'thinking' ? 'text-yellow-800 italic' : 'text-purple-800';
                messageDiv.innerHTML = \`
                  <div class="\${bgClass} p-3 rounded-lg max-w-md">
                    <div class="text-sm \${textClass}" style="white-space: pre-line">\${text}</div>
                  </div>
                \`;
              }
              
              chatArea.appendChild(messageDiv);
              chatArea.scrollTop = chatArea.scrollHeight;
            }
          </script>
        </body>
        </html>
      `);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <i className="fas fa-robot text-white text-lg"></i>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800">AI Training Assistant Hub</span>
              <p className="text-sm font-normal text-gray-600">Professional training tools powered by AI</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 bg-orange-50 border border-orange-200">
            <TabsTrigger 
              value="text" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <i className="fas fa-keyboard text-sm"></i>
              <span className="font-medium">Text Assistant</span>
            </TabsTrigger>
            <TabsTrigger 
              value="voice" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <i className="fas fa-microphone text-sm"></i>
              <span className="font-medium">Voice Practice</span>
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <i className="fas fa-comments text-sm"></i>
              <span className="font-medium">Q&A Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="h-[500px] mt-4">
            <div className="h-full bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200 shadow-lg overflow-hidden">
              {/* Chat Interface */}
              <div className="flex-1 h-[450px]">
                <BotpressChat
                  user={user}
                  isCollapsed={false}
                  onToggle={() => {}}
                />
              </div>

              {/* Footer with AI status */}
              <div className="bg-gray-50 border-t border-orange-100 p-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-shield-alt text-orange-500"></i>
                    <span>Powered by Botpress • Secure & Private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-clock text-orange-500"></i>
                    <span>Response time: ~2-3 seconds</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="mt-4">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-microphone text-white text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Voice Roleplay Practice</h3>
                <p className="text-slate-600 mb-6">
                  Practice real conversations with our AI trainer. Perfect your communication skills 
                  through realistic roleplay scenarios.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-2">What You'll Practice</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Customer service conversations</li>
                    <li>• Conflict resolution scenarios</li>
                    <li>• Product knowledge discussions</li>
                    <li>• Professional communication</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-2">How It Works</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• AI responds with realistic voice</li>
                    <li>• Real-time conversation flow</li>
                    <li>• Instant feedback and tips</li>
                    <li>• Progress tracking</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={startVoicePracticeCall}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8"
                >
                  <i className="fas fa-phone mr-2"></i>
                  Start Voice Practice Session
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-keyboard text-white text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Claude AI Assistant</h3>
                <p className="text-slate-600 mb-6">
                  Chat with Claude, a powerful AI assistant that can help with analysis, writing, 
                  coding, math, creative projects, and general conversation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-2">AI Capabilities</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Text analysis & writing</li>
                    <li>• Code generation & debugging</li>
                    <li>• Math & calculations</li>
                    <li>• Creative projects</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-2">Best For</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Research & analysis</li>
                    <li>• Learning & explanations</li>
                    <li>• Brainstorming ideas</li>
                    <li>• General conversation</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={openTextAssistant}
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  Open Claude AI Assistant
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              All AI Services Active
            </Badge>
          </div>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}