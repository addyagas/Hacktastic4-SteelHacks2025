
export enum AppState {
    IDLE = 'IDLE',
    LISTENING = 'LISTENING',
    ANALYZING = 'ANALYZING',
    THREAT_DETECTED = 'THREAT_DETECTED',
    SAFE = 'SAFE',
    ERROR = 'ERROR'
}

export interface ThreatResult {
    score: number;
    keywordsFound: string[];
    explanation: string;
}
