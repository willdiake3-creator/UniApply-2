export interface StudentProfile {
  firstName: string;
  lastName: string;
  email: string;
  nationality: string;
  countryOfResidence: string;
  phone: string;
  highestDegree: string;
  gpa: number;
  gpaScale: number;
  majorInterest: string;
  testScores: {
    toefl?: number;
    ielts?: number;
    gre?: number;
  };
  languages: string[];
  emailTemplateSubject?: string;
  emailTemplateBody?: string;
  avatarUrl?: string;
}

export type DocumentType = 'Transcript' | 'Passport' | 'CV' | 'Statement of Purpose' | 'Diploma' | 'Letter of Recommendation' | 'Other';

export interface ExtractedInfo {
  name?: string;
  gpa?: number;
  gpaScale?: number;
  institution?: string;
  skills?: string[];
  languages?: string[];
  nationality?: string;
  passportNumber?: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  docType: DocumentType;
  uploadedAt: string;
  fileSize: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedData?: ExtractedInfo;
  isVerified: boolean;
  filePath?: string;
  mimeType?: string;
  tailoringSuggestions?: string;
}

export interface UniversityProgram {
  id: string;
  universityName: string;
  name: string;
  degreeLevel: 'Bachelor' | 'Master' | 'PhD';
  country: string;
  city: string;
  department: string;
  durationMonths: number;
  tuitionFee: number;
  currency: string;
  applicationDeadline: string;
  minGpa: number;
  requiredDocuments: DocumentType[];
  description: string;
  slug: string;
  logo: string;
  websiteUrl?: string;
}

export interface Scholarship {
  id: string;
  name: string;
  universityId?: string; // Optional, can be national/regional
  awardType: 'Full Tuition' | 'Full Ride' | 'Partial Tuition' | 'Stipend' | string;
  awardAmount: number;
  currency: string;
  minGpa: number;
  eligibleNationalities: string[];
  eligibleDegreeLevels: string[];
  requiredDocuments: DocumentType[];
  applicationDeadline: string;
  description: string;
  country: string; // which country covers it
  websiteUrl?: string;
}

export function getProgramWebsiteUrl(program: Partial<UniversityProgram> & { universityName?: string; name?: string; websiteUrl?: string }): string {
  if (program.websiteUrl && program.websiteUrl.trim().length > 0) {
    return program.websiteUrl;
  }
  const uni = program.universityName || '';
  const prog = program.name || '';
  return `https://www.google.com/search?q=${encodeURIComponent(uni + ' ' + prog + ' official admissions')}`;
}

export function getScholarshipWebsiteUrl(scholarship: Partial<Scholarship> & { name?: string; country?: string; websiteUrl?: string }): string {
  if (scholarship.websiteUrl && scholarship.websiteUrl.trim().length > 0) {
    return scholarship.websiteUrl;
  }
  const name = scholarship.name || '';
  const country = scholarship.country || '';
  return `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + country + ' scholarship official portal')}`;
}

export type ApplicationStatus = 'Draft' | 'Automating' | 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

export interface ApplicationStep {
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  timestamp?: string;
  details?: string;
}

export interface ApplicationRecord {
  id: string;
  programId: string;
  scholarshipId?: string;
  status: ApplicationStatus;
  applicationNumber: string;
  submittedAt?: string;
  linkedDocuments: { [key in DocumentType]?: string }; // documentId
  automationSteps: ApplicationStep[];
  logs: string[];
  gmailSent: boolean;
  gmailReceiptId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  isRead: boolean;
}

export type VisaStatus = 'Not Started' | 'Preparing Documents' | 'Appointment Scheduled' | 'Submitted' | 'Approved' | 'Rejected';

export interface VisaStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'completed';
  completedAt?: string;
}

export interface VisaApplicationRecord {
  id: string;
  country: string;
  visaType: string; // e.g. "Schengen Visa Type D (Study)"
  status: VisaStatus;
  appointmentDate?: string;
  appointmentLocation?: string;
  trackingNumber?: string;
  blockedAccountStatus: 'Not Required' | 'Required - Pending' | 'Blocked Account Funded';
  healthInsuranceStatus: 'Pending' | 'Secured';
  steps: VisaStep[];
  logs: string[];
  updatedAt: string;
}

