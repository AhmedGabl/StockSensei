// Ringg AI API Integration for call tracking and management
const RINGG_API_BASE = 'https://api.ringg.ai';
const RINGG_API_KEY = 'be40b1db-451c-4ede-9acd-2c4403f51ef0';

interface RinggCallDetails {
  id: string;
  agent?: {
    id: string;
    name: string;
  };
  participant?: {
    name: string;
    phoneNumber?: string;
  };
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  transcript?: string;
  recordingUrl?: string;
  cost?: number;
  outcome?: string;
  notes?: string;
}

interface RinggCallHistory {
  calls: RinggCallDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface RinggCallHistoryParams {
  startDate?: string;
  endDate?: string;
  agentId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch detailed information about a specific call from Ringg AI
 */
export async function fetchRinggCallDetails(callId: string): Promise<RinggCallDetails | null> {
  try {
    console.log(`Fetching call details for ID: ${callId}`);
    
    const response = await fetch(`${RINGG_API_BASE}/calls/${callId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RINGG_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Call ${callId} not found in Ringg AI`);
        return null;
      }
      throw new Error(`Ringg AI API error: ${response.status} ${response.statusText}`);
    }

    const callDetails = await response.json();
    console.log(`Successfully fetched call details for ${callId}`);
    return callDetails;
  } catch (error) {
    console.error(`Error fetching call details for ${callId}:`, error);
    throw error;
  }
}

/**
 * Fetch call history from Ringg AI with optional filtering
 */
export async function fetchRinggCallHistory(params: RinggCallHistoryParams = {}): Promise<RinggCallHistory> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.agentId) queryParams.append('agentId', params.agentId);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${RINGG_API_BASE}/calls/history?${queryParams.toString()}`;
    console.log(`Fetching call history from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RINGG_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ringg AI API error: ${response.status} ${response.statusText}`);
    }

    const callHistory = await response.json();
    console.log(`Successfully fetched ${callHistory.calls?.length || 0} calls from history`);
    return callHistory;
  } catch (error) {
    console.error('Error fetching call history:', error);
    throw error;
  }
}

/**
 * Get call recording URL from Ringg AI
 */
export async function fetchRinggCallRecording(callId: string): Promise<string | null> {
  try {
    console.log(`Fetching recording URL for call: ${callId}`);
    
    const response = await fetch(`${RINGG_API_BASE}/calls/${callId}/recording`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RINGG_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Recording not found for call ${callId}`);
        return null;
      }
      throw new Error(`Ringg AI API error: ${response.status} ${response.statusText}`);
    }

    const recordingData = await response.json();
    console.log(`Successfully fetched recording URL for ${callId}`);
    return recordingData.recordingUrl || recordingData.url;
  } catch (error) {
    console.error(`Error fetching recording for ${callId}:`, error);
    return null;
  }
}

/**
 * Get call transcript from Ringg AI
 */
export async function fetchRinggCallTranscript(callId: string): Promise<string | null> {
  try {
    console.log(`Fetching transcript for call: ${callId}`);
    
    const response = await fetch(`${RINGG_API_BASE}/calls/${callId}/transcript`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RINGG_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Transcript not found for call ${callId}`);
        return null;
      }
      throw new Error(`Ringg AI API error: ${response.status} ${response.statusText}`);
    }

    const transcriptData = await response.json();
    console.log(`Successfully fetched transcript for ${callId}`);
    return transcriptData.transcript || transcriptData.text;
  } catch (error) {
    console.error(`Error fetching transcript for ${callId}:`, error);
    return null;
  }
}

/**
 * Sync call data from Ringg AI to our database
 */
export async function syncCallFromRingg(callId: string): Promise<RinggCallDetails | null> {
  try {
    // Get basic call details
    const callDetails = await fetchRinggCallDetails(callId);
    if (!callDetails) {
      return null;
    }

    // Enhance with recording and transcript if available
    const [recordingUrl, transcript] = await Promise.all([
      fetchRinggCallRecording(callId),
      fetchRinggCallTranscript(callId)
    ]);

    return {
      ...callDetails,
      recordingUrl: recordingUrl || callDetails.recordingUrl,
      transcript: transcript || callDetails.transcript
    };
  } catch (error) {
    console.error(`Error syncing call ${callId} from Ringg:`, error);
    throw error;
  }
}

/**
 * Test Ringg AI API connection
 */
export async function testRinggConnection(): Promise<boolean> {
  try {
    console.log('Testing Ringg AI API connection...');
    
    const response = await fetch(`${RINGG_API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RINGG_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const isConnected = response.ok;
    console.log(`Ringg AI connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
    return isConnected;
  } catch (error) {
    console.error('Ringg AI connection test failed:', error);
    return false;
  }
}