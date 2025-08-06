export interface User {
  id: string;
  email: string;
  name?: string;
  role: "STUDENT" | "TRAINER" | "ADMIN";
}

export interface Progress {
  id: string;
  userId: string;
  module: string;
  score?: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  attempts: number;
  lastTouched: string;
}

export interface PracticeCall {
  id: string;
  userId: string;
  scenario: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  outcome?: "PASSED" | "IMPROVE" | "N/A";
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  type: "PDF" | "POWERPOINT" | "VIDEO" | "SCRIPT" | "DOCUMENT";
  url?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  tags: string[];
  uploadedBy?: string;
  createdAt: string;
}

export interface ModuleInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const MODULES: ModuleInfo[] = [
  {
    id: "SOP_1ST_CALL",
    title: "SOP 1st Call",
    description: "Standard Operating Procedures",
    icon: "fas fa-phone-alt",
    color: "emerald"
  },
  {
    id: "SOP_4TH",
    title: "SOP 4th Call",
    description: "Advanced Procedures",
    icon: "fas fa-graduation-cap",
    color: "blue"
  },
  {
    id: "VOIP",
    title: "VOIP Training",
    description: "Voice over IP Systems",
    icon: "fas fa-headset",
    color: "purple"
  },
  {
    id: "REFERRALS",
    title: "Referrals",
    description: "Building Networks",
    icon: "fas fa-users",
    color: "amber"
  },
  {
    id: "SCRM",
    title: "SCRM",
    description: "Student Relationship Management",
    icon: "fas fa-chart-line",
    color: "green"
  },
  {
    id: "CURRICULUM",
    title: "Curriculum",
    description: "Course Content Management",
    icon: "fas fa-book",
    color: "indigo"
  }
];
