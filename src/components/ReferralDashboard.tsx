import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  CreditCard,
  PieChart,
  Headphones,
  Settings,
  LogOut,
  Search,
  Bell,
  RotateCw,
  Printer,
  Filter,
  SlidersHorizontal,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  Clock,
  Activity,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Check,
  Building2,
  Smartphone,
  FolderClock,
  Bookmark,
  Plus,
  Edit2,
  ShieldCheck,
  Mail,
  Phone,
  Award,
  Menu,
  AlertCircle,
  FileEdit,
  List,
  Grid,
} from 'lucide-react';
import { FacilityMarketplace, SCAN_TYPES, BODY_PARTS, CONTRAST_OPTIONS } from './FacilityMarketplace';
import type { Facility } from './FacilityMarketplace';
import { BookingSummary } from './BookingSummary';
import { ReferralSuccess } from './ReferralSuccess';
import { ReferralReview } from './ReferralReview';
import { RequisitionDocumentModal } from './RequisitionDocumentModal';
import { SearchableSelect } from './SearchableSelect';
import { Pagination } from './Pagination';
import { PaymentsView } from './PaymentsView';
import { ReportsView } from './ReportsView';
import {
  apiGetClinicalCatalog,
  apiCreateReferral,
  apiGetReferrals,
  apiLookupPatient,
  apiGetPatients,
  apiUpdateProfile,
} from '../services/api';
import { scrollToTop } from '../utils/scrollHelper';

interface ReferralDashboardProps {
  user: {
    email: string;
    fullname?: string;
    specialty?: string;
    licenseNumber?: string;
    phoneNumber?: string;
    practiceName?: string;
    practiceAddress?: string;
    photoURL?: string;
  };
  onSignOut: () => void;
  onAddToast?: (type: 'success' | 'error', title: string, message: string) => void;
  onUpdateUser?: (updated: any) => void;
}

export type ReferralStatus =
  | 'Draft'
  | 'Confirmed'
  | 'Submitted'
  | 'Booking in Progress'
  | 'Completed'
  | 'Report Ready'
  | 'Expired'
  | 'Pending'
  | 'Accepted';

export interface ReferralItem {
  id: string;
  patientName: string;
  service: string;
  provider: string;
  date: string;
  status: ReferralStatus;
  specialty?: string;
  hospital?: string;
  bodyPart?: string;
  clinicalNote?: string;
  isDraft?: boolean;
  draft?: ReferralDraft;
}

export const INITIAL_REFERRALS: ReferralItem[] = [];

export const ALL_STATUS_OPTIONS: ReferralStatus[] = [
  'Draft',
  'Confirmed',
  'Submitted',
  'Booking in Progress',
  'Completed',
  'Report Ready',
  'Expired',
];

export interface ReferralDraft {
  id: string;
  savedAt: string;
  savedAtDisplay: string;
  step: 'patient-info' | 'scan-details';
  workflowType: 'existing' | 'new';
  selectedPatientId?: string | null;
  formData: {
    fullName: string;
    gender: string;
    dob: string;
    email: string;
    phone: string;
    address: string;
    scanType: string;
    bodyPart: string;
    contrastOption?: string;
    clinicalNote: string;
  };
  uploadedFileName?: string;
  existingUserLookupEmail?: string;
}

export const SAMPLE_DRAFTS: ReferralDraft[] = [
  {
    id: 'draft-1',
    savedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    savedAtDisplay: 'Today, 11:15 AM',
    step: 'scan-details',
    workflowType: 'existing',
    selectedPatientId: 'pat-1',
    formData: {
      fullName: 'Anthony Odafe',
      gender: 'Male',
      dob: '10/01/1980',
      email: 'yourname@mail.com',
      phone: '0801 234 5678',
      address: 'Letmauck Cantoment, Mokola, Ibadan',
      scanType: 'MRI',
      bodyPart: 'Brain MRI',
      clinicalNote: 'Patient reports recurring frontal headaches and light sensitivity.',
    },
    uploadedFileName: 'Headache_history_report.pdf',
  },
  {
    id: 'draft-2',
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    savedAtDisplay: 'Yesterday, 4:20 PM',
    step: 'patient-info',
    workflowType: 'new',
    selectedPatientId: null,
    formData: {
      fullName: 'Amara Okonkwo',
      gender: 'Female',
      dob: '15/04/1993',
      email: 'amara.okonkwo@healthmail.com',
      phone: '0803 555 1290',
      address: 'Plot 14, Lekki Phase 1, Lagos',
      scanType: 'CT Scan',
      bodyPart: 'Abdomen & Pelvis',
      clinicalNote: 'Persistent lower right abdominal discomfort.',
    },
  },
  {
    id: 'draft-3',
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    savedAtDisplay: 'Sep 09, 2:45 PM',
    step: 'scan-details',
    workflowType: 'existing',
    selectedPatientId: 'pat-4',
    formData: {
      fullName: 'Sarah Jenkins',
      gender: 'Female',
      dob: '18/07/1988',
      email: 'sarah.jenkins@healthmail.com',
      phone: '0812 456 7890',
      address: 'Bodija Estate, Ibadan',
      scanType: 'Ultrasound',
      bodyPart: 'Thyroid',
      clinicalNote: 'Suspected nodule evaluation following routine physical.',
    },
  },
  {
    id: 'draft-4',
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    savedAtDisplay: 'Sep 08, 10:30 AM',
    step: 'scan-details',
    workflowType: 'new',
    selectedPatientId: null,
    formData: {
      fullName: 'David Adeleke',
      gender: 'Male',
      dob: '21/11/1985',
      email: 'david.adeleke@musiccorp.ng',
      phone: '0809 111 2233',
      address: 'Banana Island, Ikoyi, Lagos',
      scanType: 'X-Ray',
      bodyPart: 'Lumbar Spine',
      clinicalNote: 'Lower back stiffness after weight training; assess for compression.',
    },
  },
  {
    id: 'draft-5',
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    savedAtDisplay: 'Sep 07, 3:15 PM',
    step: 'patient-info',
    workflowType: 'existing',
    selectedPatientId: 'pat-2',
    formData: {
      fullName: 'Fatima Bello',
      gender: 'Female',
      dob: '05/09/1991',
      email: 'fatima.bello@mailservice.com',
      phone: '0814 333 4455',
      address: 'Garki 2, Abuja',
      scanType: 'Mammogram',
      bodyPart: 'Bilateral Breast Screening',
      clinicalNote: 'Routine annual screening mammography.',
    },
  },
];

export const DEFAULT_SAMPLE_REFERRALS: ReferralItem[] = [
  {
    id: 'REF-2026-8941',
    patientName: 'Anthony Odafe',
    service: 'MRI - Brain MRI (with contrast)',
    provider: 'EchoScan Diagnostics, Ikeja',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Confirmed',
    specialty: 'MRI',
    hospital: 'EchoScan Diagnostics, Ikeja',
    bodyPart: 'Brain MRI',
    clinicalNote: 'Patient reports recurring frontal headaches and light sensitivity. Rule out intracranial pathology.',
  },
  {
    id: 'REF-2026-8942',
    patientName: 'Sarah Jenkins',
    service: 'Ultrasound - Thyroid Doppler',
    provider: 'MeCure Healthcare, Lekki',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Booking in Progress',
    specialty: 'Ultrasound',
    hospital: 'MeCure Healthcare, Lekki',
    bodyPart: 'Thyroid',
    clinicalNote: 'Palpable solitary thyroid nodule evaluation with Doppler flow study.',
  },
  {
    id: 'REF-2026-8943',
    patientName: 'David Adeleke',
    service: 'X-Ray - Lumbar Spine (AP & Lateral)',
    provider: 'Clina-Lancet Laboratories, VI',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Confirmed',
    specialty: 'X-Ray',
    hospital: 'Clina-Lancet Laboratories, VI',
    bodyPart: 'Lumbar Spine',
    clinicalNote: 'Lower back stiffness after weight training; assess for lumbar compression.',
  },
  {
    id: 'REF-2026-8944',
    patientName: 'Amara Okonkwo',
    service: 'CT Scan - Abdomen & Pelvis',
    provider: 'Euracare Multi-Specialist Hospital',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Confirmed',
    specialty: 'CT Scan',
    hospital: 'Euracare Multi-Specialist Hospital',
    bodyPart: 'Abdomen & Pelvis',
    clinicalNote: 'Persistent lower right abdominal discomfort. Rule out acute appendicitis.',
  },
  {
    id: 'REF-2026-8945',
    patientName: 'Chioma Adeyemi',
    service: 'MRI - Lumbar Spine Scan',
    provider: 'Clinix Healthcare, Ilupeju',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Confirmed',
    specialty: 'MRI',
    hospital: 'Clinix Healthcare, Ilupeju',
    bodyPart: 'Lumbar Spine',
    clinicalNote: 'Radiculopathy radiating to right leg. MRI evaluation for disc herniation.',
  },
  {
    id: 'REF-2026-8946',
    patientName: 'Emeka Nwosu',
    service: 'Echocardiogram (Transthoracic TTE)',
    provider: 'Euracare Multi-Specialist Hospital, VI',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Booking in Progress',
    specialty: 'Cardiology',
    hospital: 'Euracare Multi-Specialist Hospital, VI',
    bodyPart: 'Cardiac',
    clinicalNote: 'Exertional dyspnea and grade II systolic ejection murmur evaluation.',
  },
  {
    id: 'REF-2026-8947',
    patientName: 'Zainab Ibrahim',
    service: 'Pelvic Ultrasound (Transvaginal)',
    provider: 'EchoScan Diagnostics, Ikeja',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Confirmed',
    specialty: 'Ultrasound',
    hospital: 'EchoScan Diagnostics, Ikeja',
    bodyPart: 'Pelvic',
    clinicalNote: 'Investigation of irregular menstrual bleeding and lower abdominal pelvic pain.',
  },
  {
    id: 'REF-2026-8948',
    patientName: 'Fatima Bello',
    service: 'Mammogram - Bilateral Breast Screening',
    provider: 'Lagoon Hospitals, Ikoyi',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Confirmed',
    specialty: 'Mammogram',
    hospital: 'Lagoon Hospitals, Ikoyi',
    bodyPart: 'Bilateral Breast Screening',
    clinicalNote: 'Routine annual screening mammography with 3D Tomosynthesis.',
  },
  {
    id: 'REF-2026-8949',
    patientName: 'Chukwuma Eze',
    service: 'CT Scan - High-Resolution Chest',
    provider: 'Reddington Hospital, Victoria Island',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Booking in Progress',
    specialty: 'CT Scan',
    hospital: 'Reddington Hospital, Victoria Island',
    bodyPart: 'Chest CT',
    clinicalNote: 'Persistent non-productive cough post-infection; assess for interstitial changes.',
  },
  {
    id: 'REF-2026-8950',
    patientName: 'Folake Adebayo',
    service: 'Ultrasound - Pelvic Ultrasound',
    provider: 'St. Nicholas Hospital, Lagos Island',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Confirmed',
    specialty: 'Ultrasound',
    hospital: 'St. Nicholas Hospital, Lagos Island',
    bodyPart: 'Pelvic',
    clinicalNote: 'Severe dysmenorrhea and pelvic pain evaluation.',
  },
];

interface ExistingPatient {
  id: string;
  name: string;
  email: string;
  gender: string;
  dob: string;
  phone: string;
  address: string;
  createdRelative: string;
  createdDate: string;
  initials: string;
}

const SAMPLE_EXISTING_PATIENTS: ExistingPatient[] = [
  {
    id: 'pat-1',
    name: 'Anthony Odafe',
    email: 'yourname@mail.com',
    gender: 'Male',
    dob: '10/01/1980',
    phone: '0801 234 5678',
    address: 'Letmauck Cantoment, Mokola, Ibadan',
    createdRelative: 'Monday',
    createdDate: '11/01/2026',
    initials: 'AO',
  },
  {
    id: 'pat-2',
    name: 'Anthony Odafe',
    email: 'yourname@mail.com',
    gender: 'Male',
    dob: '14/05/1985',
    phone: '0802 987 6543',
    address: 'Victoria Island, Lagos',
    createdRelative: 'Last week',
    createdDate: '11/01/2026',
    initials: 'AO',
  },
  {
    id: 'pat-3',
    name: 'Anthony Odafe',
    email: 'yourname@mail.com',
    gender: 'Male',
    dob: '22/09/1992',
    phone: '0805 112 3344',
    address: 'GRA Phase 2, Port Harcourt',
    createdRelative: 'December',
    createdDate: '11/01/2026',
    initials: 'AO',
  },
  {
    id: 'pat-4',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@healthmail.com',
    gender: 'Female',
    dob: '18/07/1988',
    phone: '0812 456 7890',
    address: 'Bodija Estate, Ibadan',
    createdRelative: 'November',
    createdDate: '11/01/2026',
    initials: 'SJ',
  },
];

interface ReferralProgressBarProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
}

const ReferralProgressBar: React.FC<ReferralProgressBarProps> = ({
  currentStep,
  onStepClick,
}) => {
  const stepPercentages: Record<1 | 2 | 3, string> = {
    1: '33%',
    2: '66%',
    3: '100%',
  };

  return (
    <div className="resq-stepper-container" aria-label="Referral creation progress">
      <div className="stepper-progress-track">
        <div
          className="stepper-progress-fill"
          style={{ width: stepPercentages[currentStep] }}
        />
      </div>

      <div className="stepper-nodes-row">
        {/* Step 1 Node */}
        <button
          type="button"
          className={`stepper-node-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'upcoming'}`}
          onClick={() => onStepClick?.(1)}
          title="Go to Step 1: Patient Information"
        >
          <div className="stepper-circle">
            {currentStep > 1 ? <Check size={13} strokeWidth={2.5} /> : '1'}
          </div>
          <span className="stepper-label-text">1. Patient Info</span>
        </button>

        <div className={`stepper-connector-line ${currentStep > 1 ? 'active' : ''}`} />

        {/* Step 2 Node */}
        <button
          type="button"
          className={`stepper-node-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'upcoming'}`}
          onClick={() => onStepClick?.(2)}
          title="Go to Step 2: Scan Details"
        >
          <div className="stepper-circle">
            {currentStep > 2 ? <Check size={13} strokeWidth={2.5} /> : '2'}
          </div>
          <span className="stepper-label-text">2. Scan Details</span>
        </button>

        <div className={`stepper-connector-line ${currentStep > 2 ? 'active' : ''}`} />

        {/* Step 3 Node */}
        <button
          type="button"
          className={`stepper-node-item ${currentStep === 3 ? 'active' : 'upcoming'}`}
          onClick={() => onStepClick?.(3)}
          title="Go to Step 3: Scan Location"
        >
          <div className="stepper-circle">
            3
          </div>
          <span className="stepper-label-text">3. Scan Location</span>
        </button>
      </div>
    </div>
  );
};

export const ReferralDashboard: React.FC<ReferralDashboardProps> = ({
  user,
  onSignOut,
  onAddToast,
  onUpdateUser,
}) => {
  // Initialize tab: Overview is the first tab on login unless user specifically navigated to /clinician/dashboard/referral/ etc.
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/clinician/dashboard/referral')) return 'referrals';
      if (path.includes('/clinician/dashboard/calendar') || path.includes('/clinician/dashboard/appointments')) return 'calendar';
      if (path.includes('/clinician/dashboard/patients')) return 'patients';
      if (path.includes('/clinician/dashboard/payments')) return 'payments';
      if (path.includes('/clinician/dashboard/reports')) return 'reports';
    }
    return 'overview';
  });

  useEffect(() => {
    if (activeTab === 'overview') {
      document.title = 'Overview | ResQ Healthcare';
    } else if (activeTab === 'referrals') {
      document.title = 'ResQ Healthcare';
    } else if (activeTab === 'appointments' || activeTab === 'calendar') {
      document.title = 'Calendar & Appointments | ResQ Healthcare';
    } else if (activeTab === 'patients') {
      document.title = 'Patients Directory | ResQ Healthcare';
    } else if (activeTab === 'payments') {
      document.title = 'Patient Payments | ResQ Healthcare';
    } else if (activeTab === 'reports') {
      document.title = 'Diagnostic & Clinical Reports | ResQ Healthcare';
    } else {
      document.title = 'Clinician Dashboard | ResQ Healthcare';
    }
  }, [activeTab]);

  const [referrals, setReferrals] = useState<ReferralItem[]>(() => DEFAULT_SAMPLE_REFERRALS);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState('');
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isUserFiltered, setIsUserFiltered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Calendar State
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'agenda'>('month');
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date>(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(() => new Date());
  const [calendarStatusFilter, setCalendarStatusFilter] = useState<string>('all');
  const [calendarSearchQuery, setCalendarSearchQuery] = useState<string>('');
  const [calendarAgendaCurrentPage, setCalendarAgendaCurrentPage] = useState<number>(1);
  const calendarAgendaPageSize = 8;

  // Patients Page State
  const [patientTabFilter, setPatientTabFilter] = useState<'all' | 'referred' | 'drafts'>('all');
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');
  const [patientViewMode, setPatientViewMode] = useState<'cards' | 'table'>('table');
  const [selectedRequisitionReferral, setSelectedRequisitionReferral] = useState<ReferralItem | null>(null);
  const [patientCurrentPage, setPatientCurrentPage] = useState<number>(1);
  const patientPageSize = 8;

  useEffect(() => {
    setPatientCurrentPage(1);
  }, [patientTabFilter, patientSearchQuery]);

  useEffect(() => {
    setCalendarAgendaCurrentPage(1);
  }, [calendarStatusFilter, calendarSearchQuery]);

  const parseReferralDate = (ref: ReferralItem): Date => {
    if (!ref.date) return new Date();
    const parsed = new Date(ref.date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    const parts = ref.date.split(/[/-]/);
    if (parts.length === 3) {
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const isSameCalendarDay = (d1: Date, d2: Date): boolean => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handlePrevMonth = () => {
    setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCalendarCurrentDate(now);
    setSelectedCalendarDate(now);
  };

  // Saved Referral Drafts List (persisted to localStorage)
  const [savedDrafts, setSavedDrafts] = useState<ReferralDraft[]>(() => {
    try {
      const stored = localStorage.getItem('resq_referral_drafts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((d: ReferralDraft) => d.id));
          const newSamples = SAMPLE_DRAFTS.filter((d) => !existingIds.has(d.id) && (d.id === 'draft-4' || d.id === 'draft-5'));
          return newSamples.length > 0 ? [...parsed, ...newSamples] : parsed;
        }
      }
      const legacy = localStorage.getItem('resq_referral_draft');
      if (legacy) {
        const legacyParsed = JSON.parse(legacy);
        return [legacyParsed, ...SAMPLE_DRAFTS.filter((d) => d.id !== legacyParsed.id)];
      }
      return SAMPLE_DRAFTS;
    } catch {
      return SAMPLE_DRAFTS;
    }
  });

  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal navigation state: 'none' | 'choose-type' | 'choose-draft' | 'choose-existing' | 'patient-info' | 'scan-details' | 'scan-location'
  const [modalStep, setModalStep] = useState<'none' | 'choose-type' | 'choose-draft' | 'choose-existing' | 'patient-info' | 'scan-details' | 'scan-location'>('none');
  const [scanLocationMode, setScanLocationMode] = useState<'provider' | 'patient-choice' | null>('provider');
  const [dashboardView, setDashboardView] = useState<'dashboard' | 'referral-review' | 'marketplace' | 'booking-summary' | 'submitted-success'>('dashboard');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string; display: string }>({
    date: 'Thu 20 February',
    time: '10:10 am',
    display: 'Thu 20 February at 10:10 am',
  });
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);

  // Scroll to top whenever page view changes
  useEffect(() => {
    scrollToTop();
  }, [dashboardView]);
  const [submittedReferralInfo, setSubmittedReferralInfo] = useState<{
    id: string;
    patientName: string;
    scanType: string;
    bodyPart?: string;
    facilityName: string;
    status: string;
    referralLink: string;
    bookingSlot?: { date: string; time: string; display: string };
    patientEmail?: string;
    patientPhone?: string;
    patientGender?: string;
    patientDob?: string;
    urgency?: string;
    createdAt?: string;
    doctorName?: string;
    facilityAddress?: string;
    contrastOption?: string;
    clinicalNote?: string;
  }>({
    id: 'REF-20260123-00001',
    patientName: 'Anthony Odafe',
    scanType: 'MRI',
    bodyPart: 'Brain',
    facilityName: 'Phoebe Medical Center',
    status: 'Submitted',
    referralLink: 'resqhealth.africa/referral/REF-20260123-00',
    bookingSlot: {
      date: 'Thu 20 February',
      time: '10:10 am',
      display: 'Thu 20 February at 10:10 am',
    },
    patientEmail: 'anthony.odafe@example.com',
    patientPhone: '+234 803 123 4567',
    patientGender: 'Male',
    urgency: 'Routine',
    createdAt: 'Today • 10:15 AM',
    doctorName: 'Dr. Enaikele Omoh',
    facilityAddress: 'Phoebe Center, Victoria Island, Lagos',
    contrastOption: 'Without Contrast',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Clinical Catalog from MongoDB
  const [catalogScanTypes, setCatalogScanTypes] = useState<string[]>(SCAN_TYPES);
  const [catalogBodyParts, setCatalogBodyParts] = useState<string[]>(BODY_PARTS);
  const [catalogContrastOptions, setCatalogContrastOptions] = useState<string[]>(CONTRAST_OPTIONS);

  // Fetch populated catalog from MongoDB on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const res = await apiGetClinicalCatalog();
        if (isMounted && res.success) {
          if (res.scanTypes && res.scanTypes.length > 0) {
            setCatalogScanTypes(res.scanTypes);
          }
          if (res.bodyParts && res.bodyParts.length > 0) {
            setCatalogBodyParts(res.bodyParts);
          }
          if (res.contrastOptions && res.contrastOptions.length > 0) {
            setCatalogContrastOptions(res.contrastOptions);
          }
        }
      } catch (err) {
        console.warn('Clinical catalog fetch warning, using defaults:', err);
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadDoctorReferrals = async () => {
    setIsLoadingReferrals(true);
    try {
      const res = await apiGetReferrals();
      if (res.success && Array.isArray(res.referrals)) {
        const mapped: ReferralItem[] = res.referrals.map((r) => ({
          id: r.referralId,
          patientName: r.patientName,
          service: r.bodyPart ? `${r.scanType} - ${r.bodyPart}` : r.scanType,
          provider: r.facilityName || 'Not selected',
          date: new Date(r.createdAt || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          status: r.status as ReferralStatus,
          specialty: r.scanType,
          hospital: r.facilityName || 'Not selected',
          bodyPart: r.bodyPart,
          clinicalNote: r.clinicalNote,
        }));
        if (mapped.length > 0) {
          setReferrals(mapped);
        } else {
          setReferrals((prev) => (prev.length > 0 ? prev : DEFAULT_SAMPLE_REFERRALS));
        }
      }
    } catch (e: any) {
      console.warn('Could not load referrals from DB:', e.message);
      setReferrals((prev) => (prev.length > 0 ? prev : DEFAULT_SAMPLE_REFERRALS));
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  useEffect(() => {
    loadDoctorReferrals();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    dob: '',
    email: '',
    phone: '',
    address: '',
    scanType: '',
    bodyPart: '',
    contrastOption: '',
    clinicalNote: '',
  });

  const [scanErrors, setScanErrors] = useState<{ scanType?: string; bodyPart?: string; contrastOption?: string }>({});

  const [patientWorkflowType, setPatientWorkflowType] = useState<'existing' | 'new'>('new');
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    gender: '',
    dob: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isExistingAccordionOpen, setIsExistingAccordionOpen] = useState(true);
  const [isNewUserAccordionOpen, setIsNewUserAccordionOpen] = useState(false);
  const [existingPatientFound, setExistingPatientFound] = useState(false);
  const [existingUserLookupEmail, setExistingUserLookupEmail] = useState('');

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [existingSearchQuery, setExistingSearchQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [sidebarImgError, setSidebarImgError] = useState(false);
  const [headerImgError, setHeaderImgError] = useState(false);

  // Clinician User & Profile State
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // Sign Out Confirmation Modal State
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Scroll to top whenever a modal opens or changes steps
  useEffect(() => {
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 25);
    const t2 = setTimeout(scrollToTop, 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [modalStep, isProfileModalOpen, isRequisitionModalOpen]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    fullname: '',
    specialty: '',
    licenseNumber: '',
    phoneNumber: '',
    practiceName: '',
    practiceAddress: '',
  });

  const handleOpenProfileModal = () => {
    setProfileFormData({
      fullname: currentUser.fullname || '',
      specialty: currentUser.specialty || 'Consultant Specialist',
      licenseNumber: currentUser.licenseNumber || '',
      phoneNumber: currentUser.phoneNumber || '',
      practiceName: currentUser.practiceName || 'ResQ Medical Center',
      practiceAddress: currentUser.practiceAddress || '',
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await apiUpdateProfile({
        fullname: profileFormData.fullname.trim(),
        specialty: profileFormData.specialty.trim(),
        licenseNumber: profileFormData.licenseNumber.trim(),
        phoneNumber: profileFormData.phoneNumber.trim(),
        practiceName: profileFormData.practiceName.trim(),
        practiceAddress: profileFormData.practiceAddress.trim(),
      });
      if (res.success && res.user) {
        const updated = {
          ...currentUser,
          ...res.user,
        };
        setCurrentUser(updated);
        onUpdateUser?.(updated);
        setIsProfileModalOpen(false);
        onAddToast?.('success', 'Profile Updated', 'Your clinician credentials have been updated successfully.');
      }
    } catch (err: any) {
      onAddToast?.('error', 'Update Failed', err.message || 'Could not save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const displayName = currentUser.fullname?.trim() || user.fullname?.trim() || 'Enaikele Omoh Kelvin';
  const displayEmail = currentUser.email?.trim() || user.email?.trim() || 'enaikeleomoh@gmail.com';
  const displaySpecialty = currentUser.specialty?.trim() || user.specialty?.trim() || 'Consultant Specialist';
  const displayLicense = currentUser.licenseNumber?.trim() || user.licenseNumber?.trim() || 'MDCN-REG-847291';
  const displayPhone = currentUser.phoneNumber?.trim() || user.phoneNumber?.trim() || '+234 802 345 6789';
  const displayPractice = currentUser.practiceName?.trim() || user.practiceName?.trim() || 'ResQ Medical Center';
  const displayAddress = currentUser.practiceAddress?.trim() || user.practiceAddress?.trim() || '15 Victoria Island, Lagos';
  // Fetch populated catalog from MongoDB on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const res = await apiGetClinicalCatalog();
        if (isMounted && res.success) {
          if (res.scanTypes && res.scanTypes.length > 0) {
            setCatalogScanTypes(res.scanTypes);
          }
          if (res.bodyParts && res.bodyParts.length > 0) {
            setCatalogBodyParts(res.bodyParts);
          }
          if (res.contrastOptions && res.contrastOptions.length > 0) {
            setCatalogContrastOptions(res.contrastOptions);
          }
        }
      } catch (err) {
        console.warn('Clinical catalog fetch warning, using defaults:', err);
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic Patients from MongoDB resqapp
  const [existingPatients, setExistingPatients] = useState<ExistingPatient[]>(SAMPLE_EXISTING_PATIENTS);
  const [isLookingUpPatient, setIsLookingUpPatient] = useState<boolean>(false);
  const [patientLookupStatus, setPatientLookupStatus] = useState<{
    found: boolean;
    name?: string;
    message?: string;
  } | null>(null);
  const latestLookupEmailRef = useRef<string>('');

  // Track which patient fields are auto-populated from ResQ database to make them immutable
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<{
    fullName?: boolean;
    gender?: boolean;
    dob?: boolean;
    email?: boolean;
    phone?: boolean;
    address?: boolean;
  }>({});

  const isFieldAutoPopulated = (fieldName: 'fullName' | 'gender' | 'dob' | 'email' | 'phone' | 'address') => {
    if (!existingPatientFound) return false;
    if (autoPopulatedFields[fieldName] !== undefined) {
      return Boolean(autoPopulatedFields[fieldName]);
    }
    // Fallback: If existing patient was found and value is present, treat as auto-populated
    if (fieldName === 'gender') {
      return Boolean(formData.gender && formData.gender !== 'Select Gender');
    }
    return Boolean(formData[fieldName]?.trim());
  };

  // Fetch registered and previously referred patients from MongoDB on mount
  useEffect(() => {
    let isMounted = true;
    apiGetPatients()
      .then((res) => {
        if (isMounted && res.success && res.patients && res.patients.length > 0) {
          setExistingPatients(res.patients);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch existing patients:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Format Helper: initials & photo
  const getInitial = (name?: string, email?: string) => {
    if (name && name.trim().length > 0) {
      return name.trim().charAt(0).toUpperCase();
    }
    if (email && email.trim().length > 0) {
      return email.trim().charAt(0).toUpperCase();
    }
    return 'E';
  };

  const userInitial = getInitial(user.fullname, user.email);
  const userPhoto = user.photoURL?.trim() || 'https://images.unsplash.com/photo-1594824813501-48af7a052ff3?auto=format&fit=crop&q=80&w=200';

  // Email lookup for Existing Users section in New User flow
  const handleExistingEmailLookup = async (emailVal: string) => {
    setExistingUserLookupEmail(emailVal);
    const clean = emailVal.trim().toLowerCase();
    latestLookupEmailRef.current = clean;

    if (!clean) {
      setPatientLookupStatus(null);
      setIsLookingUpPatient(false);
      setExistingPatientFound(false);
      setAutoPopulatedFields({});
      return;
    }

    // 1. Check local loaded patients
    const localMatch = existingPatients.find(
      (p) => p.email.toLowerCase() === clean
    );
    if (localMatch) {
      setFormData((prev) => ({
        ...prev,
        fullName: localMatch.name,
        gender: localMatch.gender,
        dob: localMatch.dob,
        email: localMatch.email,
        phone: localMatch.phone,
        address: localMatch.address,
      }));
      setExistingPatientFound(true);
      setAutoPopulatedFields({
        fullName: Boolean(localMatch.name?.trim()),
        gender: Boolean(localMatch.gender?.trim() && localMatch.gender !== 'Select Gender'),
        dob: Boolean(localMatch.dob?.trim()),
        email: Boolean(localMatch.email?.trim()),
        phone: Boolean(localMatch.phone?.trim()),
        address: Boolean(localMatch.address?.trim()),
      });
      setIsNewUserAccordionOpen(false);
      setIsExistingAccordionOpen(true);
      setPatientLookupStatus({
        found: true,
        name: localMatch.name,
        message: `Auto-filled details for ${localMatch.name}`,
      });
      if (onAddToast) {
        onAddToast('success', 'User Found', `Auto-filled details for ${localMatch.name}`);
      }
      return;
    }

    // 2. Query MongoDB backend if email has an @ and dot
    if (clean.includes('@') && clean.includes('.')) {
      setIsLookingUpPatient(true);
      try {
        const res = await apiLookupPatient(clean);
        if (latestLookupEmailRef.current !== clean) return;
        setIsLookingUpPatient(false);
        if (res.success && res.found && res.patient) {
          const p = res.patient;
          setFormData((prev) => ({
            ...prev,
            fullName: p.fullName,
            gender: p.gender || prev.gender,
            dob: p.dob || prev.dob,
            email: p.email || clean,
            phone: p.phone || prev.phone,
            address: p.address || prev.address,
          }));
          setExistingPatientFound(true);
          setAutoPopulatedFields({
            fullName: Boolean(p.fullName?.trim()),
            gender: Boolean(p.gender?.trim() && p.gender !== 'Select Gender'),
            dob: Boolean(p.dob?.trim()),
            email: Boolean((p.email || clean)?.trim()),
            phone: Boolean(p.phone?.trim()),
            address: Boolean(p.address?.trim()),
          });
          setIsNewUserAccordionOpen(false);
          setIsExistingAccordionOpen(true);
          setPatientLookupStatus({
            found: true,
            name: p.fullName,
            message: `Auto-filled details for ${p.fullName}`,
          });
          if (onAddToast) {
            onAddToast('success', 'User Found', `Auto-filled personal info for ${p.fullName}`);
          }
        } else {
          setExistingPatientFound(false);
          setAutoPopulatedFields({});
          setPatientLookupStatus({
            found: false,
            message: 'No existing ResQ patient profile found with this email.',
          });
        }
      } catch {
        if (latestLookupEmailRef.current === clean) {
          setIsLookingUpPatient(false);
          setExistingPatientFound(false);
          setAutoPopulatedFields({});
        }
      }
    }
  };

  const handleClearExistingLookup = () => {
    setExistingUserLookupEmail('');
    setPatientLookupStatus(null);
    setExistingPatientFound(false);
    setAutoPopulatedFields({});
    setFormData((prev) => ({
      ...prev,
      fullName: '',
      gender: '',
      dob: '',
      email: '',
      phone: '',
      address: '',
    }));
  };

  // Handle ESC to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSignOutModalOpen) {
          setIsSignOutModalOpen(false);
        } else if (isProfileModalOpen) {
          setIsProfileModalOpen(false);
        } else {
          setModalStep('none');
        }
      }
    };
    if (modalStep !== 'none' || isProfileModalOpen || isSignOutModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalStep, isProfileModalOpen, isSignOutModalOpen]);

  // Sync tab changes with requested URL format
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      if (tabId === 'referrals') {
        window.history.pushState(null, '', '/clinician/dashboard/referral/');
      } else {
        window.history.pushState(null, '', `/clinician/dashboard/${tabId}/`);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeTab === 'referrals') {
        if (!window.location.pathname.includes('/clinician/dashboard/referral/')) {
          window.history.pushState(null, '', '/clinician/dashboard/referral/');
        }
      } else if (activeTab === 'overview') {
        if (!window.location.pathname.includes('/clinician/dashboard/overview/')) {
          window.history.pushState(null, '', '/clinician/dashboard/overview/');
        }
      } else if (['calendar', 'patients', 'payments', 'reports'].includes(activeTab)) {
        if (!window.location.pathname.includes(`/clinician/dashboard/${activeTab}/`)) {
          window.history.pushState(null, '', `/clinician/dashboard/${activeTab}/`);
        }
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsStatusFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStatusFilter = (status: string) => {
    setIsUserFiltered(true);
    if (activeStatusFilters.includes(status)) {
      setActiveStatusFilters(activeStatusFilters.filter((s) => s !== status));
    } else {
      setActiveStatusFilters([...activeStatusFilters, status]);
    }
  };

  const handleRemoveStatusFilter = (status: string) => {
    setIsUserFiltered(true);
    setActiveStatusFilters(activeStatusFilters.filter((s) => s !== status));
  };

  const handleClearFilters = () => {
    setIsUserFiltered(true);
    setActiveStatusFilters([]);
    setTableSearch('');
  };

  // Map saved drafts into table items with clear formatting so they appear directly in the table
  const mappedDrafts: ReferralItem[] = savedDrafts.map((d) => ({
    id: d.id.startsWith('draft-') ? `DFT-${d.id.replace('draft-', '').padStart(3, '0')}` : d.id.toUpperCase(),
    patientName: d.formData.fullName || 'Untitled Patient',
    service: d.formData.scanType || (d.formData.bodyPart ? `${d.formData.bodyPart} Scan` : 'Diagnostic Scan'),
    provider: 'Not selected',
    date: d.savedAtDisplay || (d.savedAt ? new Date(d.savedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Saved recently'),
    status: 'Draft' as ReferralStatus,
    specialty: d.formData.scanType,
    hospital: 'Not selected',
    bodyPart: d.formData.bodyPart,
    clinicalNote: d.formData.clinicalNote,
    isDraft: true,
    draft: d,
  }));

  const allCombinedReferrals: ReferralItem[] = [
    ...mappedDrafts,
    ...referrals.map((r) => ({ ...r, isDraft: false })),
  ];

  const filteredReferrals = allCombinedReferrals.filter((item) => {
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const matchId = item.id.toLowerCase().includes(q) || (item.isDraft && item.draft?.id.toLowerCase().includes(q));
      const matchName = item.patientName.toLowerCase().includes(q);
      const matchService = (item.service || item.specialty || '').toLowerCase().includes(q);
      const matchProvider = (item.provider || item.hospital || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchService && !matchProvider) {
        return false;
      }
    }

    if (isUserFiltered && activeStatusFilters.length > 0) {
      if (!activeStatusFilters.includes(item.status)) {
        return false;
      }
    }

    return true;
  });

  // Mobile Pagination State (Strictly 5 referrals per page on mobile view)
  const MOBILE_REFERRALS_PER_PAGE = 5;
  const [mobileReferralPage, setMobileReferralPage] = useState(1);

  useEffect(() => {
    setMobileReferralPage(1);
  }, [tableSearch, activeStatusFilters]);

  const totalMobilePages = Math.ceil(filteredReferrals.length / MOBILE_REFERRALS_PER_PAGE) || 1;
  const safeMobilePage = Math.min(mobileReferralPage, totalMobilePages);
  const mobileStartIndex = (safeMobilePage - 1) * MOBILE_REFERRALS_PER_PAGE;
  const mobileEndIndex = mobileStartIndex + MOBILE_REFERRALS_PER_PAGE;
  const paginatedMobileReferrals = filteredReferrals.slice(mobileStartIndex, mobileEndIndex);

  const getStatusClass = (status: ReferralStatus | string): string => {
    switch (status) {
      case 'Draft':
        return 'status-draft';
      case 'Confirmed':
        return 'status-confirmed';
      case 'Submitted':
        return 'status-submitted';
      case 'Booking in Progress':
        return 'status-booking-progress';
      case 'Completed':
        return 'status-completed';
      case 'Report Ready':
        return 'status-report-ready';
      case 'Expired':
        return 'status-expired';
      default:
        return 'status-submitted';
    }
  };

  const totalKpi = referrals.length + savedDrafts.length;
  const submittedKpi = referrals.filter((r) => r.status === 'Submitted').length;
  const bookingKpi = referrals.filter((r) => r.status === 'Booking in Progress').length;
  const confirmedKpi = referrals.filter((r) => r.status === 'Confirmed' || r.status === 'Completed' || (r.status as string) === 'Paid').length;

  const handleNewReferralForPatient = (p: {
    name: string;
    email?: string;
    phone?: string;
    gender?: string;
    dob?: string;
    address?: string;
  }) => {
    setFormData({
      fullName: p.name,
      gender: p.gender || 'Male',
      dob: p.dob || '',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
      scanType: '',
      bodyPart: '',
      contrastOption: '',
      clinicalNote: '',
    });
    setNewUserForm({
      fullName: p.name,
      gender: p.gender || 'Male',
      dob: p.dob || '',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
    });
    setPatientWorkflowType('existing');
    setExistingPatientFound(true);
    setAutoPopulatedFields({
      fullName: true,
      email: Boolean(p.email),
      phone: Boolean(p.phone),
      gender: Boolean(p.gender),
      dob: Boolean(p.dob),
      address: Boolean(p.address),
    });
    setModalStep('scan-details');
    if (onAddToast) {
      onAddToast(
        'success',
        'Patient Selected',
        `Starting new referral for ${p.name}. Patient details have been pre-filled.`
      );
    }
  };

  // Calendar Calculations
  const calendarCurrentYear = calendarCurrentDate.getFullYear();
  const calendarCurrentMonth = calendarCurrentDate.getMonth();
  const calendarMonthLabel = calendarCurrentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarGridDays = useMemo(() => {
    const firstDayIndex = new Date(calendarCurrentYear, calendarCurrentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarCurrentYear, calendarCurrentMonth, 0).getDate();

    const prevMonthDays = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      prevMonthDays.push({
        dayNumber: daysInPrevMonth - i,
        date: new Date(calendarCurrentYear, calendarCurrentMonth - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    const currentMonthDays = [];
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      currentMonthDays.push({
        dayNumber: d,
        date: new Date(calendarCurrentYear, calendarCurrentMonth, d),
        isCurrentMonth: true,
      });
    }

    const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
    const totalGridCells = totalCellsSoFar > 35 ? 42 : 35;
    const nextMonthDaysCount = totalGridCells - totalCellsSoFar;
    const nextMonthDays = [];
    for (let d = 1; d <= nextMonthDaysCount; d++) {
      nextMonthDays.push({
        dayNumber: d,
        date: new Date(calendarCurrentYear, calendarCurrentMonth + 1, d),
        isCurrentMonth: false,
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [calendarCurrentYear, calendarCurrentMonth]);

  const getReferralsForDate = (date: Date) => {
    return referrals.filter((r) => {
      const rDate = parseReferralDate(r);
      return isSameCalendarDay(rDate, date);
    });
  };

  const selectedDateReferrals = useMemo(() => {
    return referrals.filter((r) => {
      const rDate = parseReferralDate(r);
      const matchesDay = isSameCalendarDay(rDate, selectedCalendarDate);
      if (!matchesDay) return false;
      if (calendarStatusFilter !== 'all' && r.status !== calendarStatusFilter) return false;
      if (calendarSearchQuery.trim()) {
        const q = calendarSearchQuery.toLowerCase().trim();
        const matchName = r.patientName.toLowerCase().includes(q);
        const matchService = r.service.toLowerCase().includes(q);
        const matchProvider = r.provider.toLowerCase().includes(q);
        return matchName || matchService || matchProvider;
      }
      return true;
    });
  }, [referrals, selectedCalendarDate, calendarStatusFilter, calendarSearchQuery]);

  // Calendar Sidebar Detail Panel Pagination (2 bookings per page for ergonomic height)
  const [calendarSidePage, setCalendarSidePage] = useState(1);
  const calendarSidePageSize = 2;

  // Reset side page whenever selected date, status filter, or search query changes
  useEffect(() => {
    setCalendarSidePage(1);
  }, [selectedCalendarDate, calendarStatusFilter, calendarSearchQuery]);

  const totalSideItems = selectedDateReferrals.length;
  const totalSidePages = Math.max(1, Math.ceil(totalSideItems / calendarSidePageSize));
  const pagedSideReferrals = useMemo(() => {
    const start = (calendarSidePage - 1) * calendarSidePageSize;
    return selectedDateReferrals.slice(start, start + calendarSidePageSize);
  }, [selectedDateReferrals, calendarSidePage, calendarSidePageSize]);

  const filteredCalendarAgendaReferrals = useMemo(() => {
    return referrals.filter((r) => {
      if (calendarStatusFilter !== 'all' && r.status !== calendarStatusFilter) return false;
      if (calendarSearchQuery.trim()) {
        const q = calendarSearchQuery.toLowerCase().trim();
        const matchName = r.patientName.toLowerCase().includes(q);
        const matchService = r.service.toLowerCase().includes(q);
        const matchProvider = r.provider.toLowerCase().includes(q);
        return matchName || matchService || matchProvider;
      }
      return true;
    });
  }, [referrals, calendarStatusFilter, calendarSearchQuery]);

  // Patients Page Calculations
  const referredPatientsList = useMemo(() => {
    const patientMap = new Map<
      string,
      {
        patientName: string;
        email: string;
        phone: string;
        gender: string;
        dob: string;
        address: string;
        referrals: ReferralItem[];
        latestReferral: ReferralItem;
      }
    >();

    referrals.forEach((ref) => {
      if (ref.isDraft) return;
      const key = ref.patientName.toLowerCase().trim();
      const existing = existingPatients.find((p) => p.name.toLowerCase().trim() === key);

      if (!patientMap.has(key)) {
        patientMap.set(key, {
          patientName: ref.patientName,
          email: existing?.email || `${ref.patientName.toLowerCase().replace(/\s+/g, '.')}@patientmail.com`,
          phone: existing?.phone || '+234 800 123 4567',
          gender: existing?.gender || 'Not specified',
          dob: existing?.dob || 'Not specified',
          address: existing?.address || 'Lagos, Nigeria',
          referrals: [ref],
          latestReferral: ref,
        });
      } else {
        const entry = patientMap.get(key)!;
        entry.referrals.push(ref);
      }
    });

    existingPatients.forEach((ep) => {
      const key = ep.name.toLowerCase().trim();
      if (!patientMap.has(key)) {
        const placeholderRef: ReferralItem = {
          id: `REC-${ep.id}`,
          patientName: ep.name,
          service: 'General Consultation Record',
          provider: 'ResQ Clinician Network',
          date: ep.createdDate || 'Recent',
          status: 'Confirmed',
        };
        patientMap.set(key, {
          patientName: ep.name,
          email: ep.email,
          phone: ep.phone,
          gender: ep.gender,
          dob: ep.dob,
          address: ep.address,
          referrals: [placeholderRef],
          latestReferral: placeholderRef,
        });
      }
    });

    return Array.from(patientMap.values());
  }, [referrals, existingPatients]);

  const filteredPatientDrafts = useMemo(() => {
    if (!patientSearchQuery.trim()) return savedDrafts;
    const q = patientSearchQuery.toLowerCase().trim();
    return savedDrafts.filter(
      (d) =>
        (d.formData.fullName || '').toLowerCase().includes(q) ||
        (d.formData.email || '').toLowerCase().includes(q) ||
        (d.formData.phone || '').toLowerCase().includes(q) ||
        (d.formData.scanType || '').toLowerCase().includes(q) ||
        (d.formData.bodyPart || '').toLowerCase().includes(q)
    );
  }, [savedDrafts, patientSearchQuery]);

  const filteredReferredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return referredPatientsList;
    const q = patientSearchQuery.toLowerCase().trim();
    return referredPatientsList.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.latestReferral?.service.toLowerCase().includes(q) ||
        p.latestReferral?.provider.toLowerCase().includes(q)
    );
  }, [referredPatientsList, patientSearchQuery]);

  const pagedCalendarAgendaReferrals = useMemo(() => {
    const start = (calendarAgendaCurrentPage - 1) * calendarAgendaPageSize;
    return filteredCalendarAgendaReferrals.slice(start, start + calendarAgendaPageSize);
  }, [filteredCalendarAgendaReferrals, calendarAgendaCurrentPage, calendarAgendaPageSize]);

  // Unified items list for Patients Directory so both drafts & referred patients paginate cleanly
  const allVisiblePatientItems = useMemo(() => {
    const items: Array<
      | { kind: 'draft'; id: string; draft: (typeof savedDrafts)[0] }
      | { kind: 'patient'; id: string; patient: (typeof referredPatientsList)[0] }
    > = [];
    if (patientTabFilter === 'all' || patientTabFilter === 'drafts') {
      filteredPatientDrafts.forEach((draft) => items.push({ kind: 'draft', id: draft.id, draft }));
    }
    if (patientTabFilter === 'all' || patientTabFilter === 'referred') {
      filteredReferredPatients.forEach((patient) => items.push({ kind: 'patient', id: patient.patientName, patient }));
    }
    return items;
  }, [patientTabFilter, filteredPatientDrafts, filteredReferredPatients]);

  const pagedPatientItems = useMemo(() => {
    const start = (patientCurrentPage - 1) * patientPageSize;
    return allVisiblePatientItems.slice(start, start + patientPageSize);
  }, [allVisiblePatientItems, patientCurrentPage, patientPageSize]);

  const closeModal = () => {
    setModalStep('none');
    setScanErrors({});
  };

  // Smooth back navigation between modals
  const handleModalBack = () => {
    setScanErrors({});
    if (modalStep === 'choose-existing' || modalStep === 'choose-draft') {
      setModalStep('choose-type');
    } else if (modalStep === 'patient-info') {
      if (activeDraftId) {
        setModalStep('choose-draft');
      } else if (patientWorkflowType === 'existing') {
        setModalStep('choose-existing');
      } else {
        setModalStep('choose-type');
      }
    } else if (modalStep === 'scan-details') {
      setModalStep('patient-info');
    } else if (modalStep === 'scan-location') {
      setModalStep('scan-details');
    }
  };

  // Direct step jump from progress bar with validation
  const handleStepJump = (targetStep: 1 | 2 | 3) => {
    if (targetStep === 1) {
      setModalStep('patient-info');
    } else if (targetStep === 2) {
      setModalStep('scan-details');
    } else if (targetStep === 3) {
      // Validate scan details before allowing jump to step 3
      const errors: { scanType?: string; bodyPart?: string; contrastOption?: string } = {};
      if (!formData.scanType?.trim()) errors.scanType = 'Scan type is required to proceed';
      if (!formData.bodyPart?.trim()) errors.bodyPart = 'Body part is required to proceed';
      if (!formData.contrastOption?.trim()) errors.contrastOption = 'Contrast option is required to proceed';
      if (Object.keys(errors).length > 0) {
        setScanErrors(errors);
        if (modalStep !== 'scan-details') {
          setModalStep('scan-details');
        }
        return;
      }
      setScanErrors({});
      setModalStep('scan-location');
    }
  };

  // 1. Choose Referral Type from Blurry Modal
  const handleSelectType = (type: 'existing' | 'new') => {
    setPatientWorkflowType(type);
    setExistingPatientFound(false);
    setScanErrors({});
    setNewUserForm({
      fullName: '',
      gender: 'Male',
      dob: '',
      email: '',
      phone: '',
      address: '',
    });
    if (type === 'existing') {
      setFormData({
        fullName: '',
        gender: 'Male',
        dob: '',
        email: '',
        phone: '',
        address: '',
        scanType: '',
        bodyPart: '',
        contrastOption: '',
        clinicalNote: '',
      });
      setSelectedPatientId(null);
      setUploadedFile(null);
      setModalStep('choose-existing');
    } else {
      // New Patient: empty form with placeholders matching Image 4
      setFormData({
        fullName: '',
        gender: '',
        dob: '',
        email: '',
        phone: '',
        address: '',
        scanType: '',
        bodyPart: '',
        contrastOption: '',
        clinicalNote: '',
      });
      setSelectedPatientId(null);
      setUploadedFile(null);
      setExistingUserLookupEmail('');
      setModalStep('patient-info');
    }
  };

  // 2. Select an Existing Patient
  const handleSelectExistingPatient = (patient: ExistingPatient) => {
    setPatientWorkflowType('existing');
    setSelectedPatientId(patient.id);
    setExistingPatientFound(true);
    setAutoPopulatedFields({
      fullName: Boolean(patient.name?.trim()),
      gender: Boolean(patient.gender?.trim() && patient.gender !== 'Select Gender'),
      dob: Boolean(patient.dob?.trim()),
      email: Boolean(patient.email?.trim()),
      phone: Boolean(patient.phone?.trim()),
      address: Boolean(patient.address?.trim()),
    });
    setScanErrors({});
    setFormData({
      fullName: patient.name,
      gender: patient.gender,
      dob: patient.dob,
      email: patient.email,
      phone: patient.phone,
      address: patient.address,
      scanType: '',
      bodyPart: '',
      contrastOption: '',
      clinicalNote: '',
    });
    setNewUserForm({
      fullName: '',
      gender: 'Male',
      dob: '',
      email: '',
      phone: '',
      address: '',
    });
    // Smoothly advance to Patient Information (Page 1 of 2) pre-filled for doctor review
    setModalStep('patient-info');
  };

  // Filter existing patients by search query
  const filteredExistingPatients = existingPatients.filter((p) => {
    const q = existingSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  // 3. Save Draft (creates new or updates existing draft)
  const handleSaveDraft = () => {
    const draftId = activeDraftId || `DRAFT-${Date.now()}`;
    const effectiveFormData =
      patientWorkflowType === 'new' && !existingPatientFound
        ? {
            ...formData,
            fullName: newUserForm.fullName,
            gender: newUserForm.gender || 'Male',
            dob: newUserForm.dob,
            email: newUserForm.email,
            phone: newUserForm.phone,
            address: newUserForm.address,
          }
        : { ...formData };
    const pName = effectiveFormData.fullName.trim();
    const newDraft: ReferralDraft = {
      id: draftId,
      savedAt: new Date().toISOString(),
      savedAtDisplay: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      step: modalStep === 'scan-details' ? 'scan-details' : 'patient-info',
      workflowType: patientWorkflowType,
      selectedPatientId,
      formData: effectiveFormData,
      uploadedFileName: uploadedFile?.name,
      existingUserLookupEmail,
    };

    const existingIdx = savedDrafts.findIndex((d) => d.id === draftId);
    let updatedDrafts: ReferralDraft[];
    if (existingIdx >= 0) {
      updatedDrafts = [...savedDrafts];
      updatedDrafts[existingIdx] = newDraft;
    } else {
      updatedDrafts = [newDraft, ...savedDrafts];
    }

    try {
      localStorage.setItem('resq_referral_drafts', JSON.stringify(updatedDrafts));
      setSavedDrafts(updatedDrafts);
      setActiveDraftId(draftId);
    } catch (e) {
      console.error('Failed to save drafts to localStorage', e);
    }

    if (onAddToast) {
      onAddToast(
        'success',
        'Draft Saved',
        pName
          ? `Referral draft for ${pName} saved securely.`
          : 'Your referral draft has been securely saved.'
      );
    }
    closeModal();
  };

  // 4. Resume Selected Draft from List
  const handleResumeDraft = (draft: ReferralDraft) => {
    setActiveDraftId(draft.id);
    setScanErrors({});
    setFormData({ contrastOption: '', ...draft.formData });
    if (draft.workflowType === 'new') {
      setNewUserForm({
        fullName: draft.formData.fullName || '',
        gender: draft.formData.gender || 'Male',
        dob: draft.formData.dob || '',
        email: draft.formData.email || '',
        phone: draft.formData.phone || '',
        address: draft.formData.address || '',
      });
    }
    setPatientWorkflowType(draft.workflowType);
    setSelectedPatientId(draft.selectedPatientId || null);
    if (draft.existingUserLookupEmail) {
      setExistingUserLookupEmail(draft.existingUserLookupEmail);
    }
    if (draft.workflowType === 'existing' || draft.existingUserLookupEmail) {
      setExistingPatientFound(true);
      setAutoPopulatedFields({
        fullName: Boolean(draft.formData.fullName?.trim()),
        gender: Boolean(draft.formData.gender?.trim() && draft.formData.gender !== 'Select Gender'),
        dob: Boolean(draft.formData.dob?.trim()),
        email: Boolean(draft.formData.email?.trim()),
        phone: Boolean(draft.formData.phone?.trim()),
        address: Boolean(draft.formData.address?.trim()),
      });
    }
    setModalStep(draft.step);

    if (onAddToast) {
      onAddToast(
        'success',
        'Draft Restored',
        `Resumed referral draft for ${draft.formData.fullName || 'patient'}.`
      );
    }
  };

  // 5. Delete / Discard a Specific Draft
  const handleDeleteDraft = (draftId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const draftToDelete = savedDrafts.find((d) => d.id === draftId);
    const updatedDrafts = savedDrafts.filter((d) => d.id !== draftId);
    try {
      localStorage.setItem('resq_referral_drafts', JSON.stringify(updatedDrafts));
      setSavedDrafts(updatedDrafts);
      if (activeDraftId === draftId) {
        setActiveDraftId(null);
      }
    } catch (err) {
      console.error(err);
    }

    if (onAddToast) {
      onAddToast(
        'success',
        'Draft Removed',
        draftToDelete?.formData.fullName
          ? `Draft for ${draftToDelete.formData.fullName} has been removed.`
          : 'Referral draft has been removed.'
      );
    }
  };

  // Filter drafts by search query
  const filteredDrafts = savedDrafts.filter((draft) => {
    if (!draftSearchQuery.trim()) return true;
    const q = draftSearchQuery.toLowerCase().trim();
    const nameMatch = (draft.formData.fullName || '').toLowerCase().includes(q);
    const scanMatch = (draft.formData.scanType || '').toLowerCase().includes(q);
    const bodyMatch = (draft.formData.bodyPart || '').toLowerCase().includes(q);
    const dateMatch = (draft.savedAtDisplay || '').toLowerCase().includes(q);
    return nameMatch || scanMatch || bodyMatch || dateMatch;
  });

  // 5. File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // 6. Handle Proceed from Scan Location Modal
  const handleProceedScanLocation = () => {
    if (scanLocationMode === 'provider') {
      closeModal();
      setDashboardView('marketplace');
    } else if (scanLocationMode === 'patient-choice') {
      const patientNameToUse = formData.fullName.trim() || 'Anthony Odafe';
      const specialtyToUse = formData.scanType.trim() || 'MRI Scan (Magnetic Resonance Imaging)';
      const bodyPartToUse = formData.bodyPart.trim() || 'Brain';
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const rand = Math.floor(10000 + Math.random() * 90000);
      const refId = `REF-${y}${m}${d}-${rand}`;

      const patientPortalBase = ((import.meta as any).env?.VITE_PATIENT_PORTAL_URL || 'https://resq-client.vercel.app').replace(/\/+$/, '');
      const referralLink = `${patientPortalBase}/?referralId=${refId}`;

      const newReferral: ReferralItem = {
        id: refId,
        patientName: patientNameToUse,
        service: bodyPartToUse ? `${specialtyToUse} - ${bodyPartToUse}` : specialtyToUse,
        provider: 'Patient Choice (Open Referral)',
        specialty: specialtyToUse,
        hospital: 'Patient will choose from suitable center',
        date: now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: 'Submitted',
        bodyPart: bodyPartToUse,
        clinicalNote: formData.clinicalNote,
      };

      setReferrals((prev) => [newReferral, ...prev]);
      setSubmittedReferralInfo({
        id: refId,
        patientName: patientNameToUse,
        scanType: specialtyToUse,
        bodyPart: bodyPartToUse,
        facilityName: 'Patient Choice (Open Referral)',
        status: 'Submitted',
        referralLink,
        patientEmail: formData.email,
        patientPhone: formData.phone,
        patientGender: formData.gender,
        patientDob: formData.dob,
        urgency: 'Routine',
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        doctorName: user.fullname || 'Dr. Enaikele Omoh',
        facilityAddress: 'Accredited ResQ Diagnostic Network',
        contrastOption: formData.contrastOption || 'Without Contrast',
        clinicalNote: formData.clinicalNote,
      });

      // Persist to MongoDB and dispatch patient email notification
      apiCreateReferral({
        referralId: refId,
        doctorEmail: user.email,
        doctorName: user.fullname,
        doctorSpecialty: user.specialty,
        doctorPractice: user.practiceName,
        patientName: patientNameToUse,
        patientEmail: formData.email,
        patientPhone: formData.phone,
        patientGender: formData.gender,
        patientDob: formData.dob,
        patientAddress: formData.address,
        scanType: specialtyToUse,
        bodyPart: bodyPartToUse,
        contrastOption: formData.contrastOption || 'Not Specified',
        clinicalNote: formData.clinicalNote,
        facilityName: 'Patient Choice (Open Referral)',
        status: 'Submitted',
        referralLink,
      }).catch((err) => {
        console.warn('API error creating referral in DB:', err.message);
      });

      if (activeDraftId) {
        const updatedDrafts = savedDrafts.filter((d) => d.id !== activeDraftId);
        setSavedDrafts(updatedDrafts);
        try {
          localStorage.setItem('resq_referral_drafts', JSON.stringify(updatedDrafts));
        } catch {}
        setActiveDraftId(null);
      }

      closeModal();
      setDashboardView('submitted-success');
      if (onAddToast) {
        onAddToast('success', 'Referral Created!', `Referral for ${patientNameToUse} created successfully.`);
      }
    }
  };

  const handleSelectBookingSlot = (facility: Facility, slot: { date: string; time: string; display: string }) => {
    setSelectedFacility(facility);
    setSelectedSlot(slot);
    setDashboardView('booking-summary');
  };

  const handleSubmitReferralFromBooking = () => {
    const patientNameToUse = formData.fullName.trim() || 'Anthony Odafe';
    const specialtyToUse = formData.scanType.trim() || 'MRI Scan (Magnetic Resonance Imaging)';
    const bodyPartToUse = formData.bodyPart.trim() || 'Brain';
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(10000 + Math.random() * 90000);
    const refId = `REF-${y}${m}${d}-${rand}`;
    const facilityNameToUse = selectedFacility?.name || 'Phoebe Medical Center';

    const patientPortalBase = ((import.meta as any).env?.VITE_PATIENT_PORTAL_URL || 'https://resq-client.vercel.app').replace(/\/+$/, '');
    const referralLink = `${patientPortalBase}/?referralId=${refId}`;

    const newReferral: ReferralItem = {
      id: refId,
      patientName: patientNameToUse,
      service: bodyPartToUse ? `${specialtyToUse} - ${bodyPartToUse}` : specialtyToUse,
      provider: facilityNameToUse,
      specialty: specialtyToUse,
      hospital: facilityNameToUse,
      date: now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status: 'Booking in Progress',
      bodyPart: bodyPartToUse,
      clinicalNote: formData.clinicalNote,
    };

    setReferrals((prev) => [newReferral, ...prev]);
    setSubmittedReferralInfo({
      id: refId,
      patientName: patientNameToUse,
      scanType: specialtyToUse,
      bodyPart: bodyPartToUse,
      facilityName: facilityNameToUse,
      status: 'Booking in Progress',
      referralLink,
      bookingSlot: selectedSlot || undefined,
      patientEmail: formData.email,
      patientPhone: formData.phone,
      patientGender: formData.gender,
      patientDob: formData.dob,
      urgency: 'Routine',
      createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      doctorName: user.fullname || 'Dr. Enaikele Omoh',
      facilityAddress: selectedFacility?.address || 'Victoria Island, Lagos',
      contrastOption: formData.contrastOption || 'Without Contrast',
      clinicalNote: formData.clinicalNote,
    });

    // Persist to MongoDB and dispatch patient email notification
    apiCreateReferral({
      referralId: refId,
      doctorEmail: user.email,
      doctorName: user.fullname,
      doctorSpecialty: user.specialty,
      doctorPractice: user.practiceName,
      patientName: patientNameToUse,
      patientEmail: formData.email,
      patientPhone: formData.phone,
      patientGender: formData.gender,
      patientDob: formData.dob,
      patientAddress: formData.address,
      scanType: specialtyToUse,
      bodyPart: bodyPartToUse,
      contrastOption: formData.contrastOption || 'Not Specified',
      clinicalNote: formData.clinicalNote,
      facilityId: selectedFacility?.id,
      providerId: selectedFacility?.providerId || 'CWZDBt9Xmv',
      serviceId: selectedFacility?.serviceId || 'P7S_Vf3fBt',
      facilityName: facilityNameToUse,
      facilityAddress: selectedFacility?.address,
      facilityPrice: selectedFacility?.price,
      slot: selectedSlot,
      status: 'Booking in Progress',
      referralLink,
    }).catch((err) => {
      console.warn('API error creating referral in DB:', err.message);
    });

    if (activeDraftId) {
      const updatedDrafts = savedDrafts.filter((d) => d.id !== activeDraftId);
      setSavedDrafts(updatedDrafts);
      try {
        localStorage.setItem('resq_referral_drafts', JSON.stringify(updatedDrafts));
      } catch {}
      setActiveDraftId(null);
    }

    setDashboardView('submitted-success');
    if (onAddToast) {
      onAddToast('success', 'Referral Created!', `Referral for ${patientNameToUse} created successfully.`);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'referrals', label: 'Referrals', icon: UserCheck },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: PieChart },
  ];

  if (dashboardView === 'referral-review') {
    return (
      <ReferralReview
        formData={formData}
        user={user}
        uploadedFileName={uploadedFile?.name}
        onEditPersonalInfo={() => {
          setDashboardView('dashboard');
          setModalStep('patient-info');
        }}
        onEditScanDetails={() => {
          setDashboardView('dashboard');
          setModalStep('scan-details');
        }}
        onProceed={() => {
          setDashboardView('dashboard');
          setModalStep('scan-location');
        }}
        onUpdateFormData={(updated) => setFormData((prev) => ({ ...prev, ...updated }))}
        onProceedToBooking={() => setDashboardView('marketplace')}
        onBackToDashboard={() => setDashboardView('dashboard')}
      />
    );
  }

  if (dashboardView === 'marketplace') {
    return (
      <FacilityMarketplace
        user={user}
        referralData={{
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          dob: formData.dob,
          address: formData.address,
          scanType: formData.scanType || 'MRI Scan (Magnetic Resonance Imaging)',
          bodyPart: formData.bodyPart || 'Brain',
          contrastOption: formData.contrastOption || 'Not Specified',
          clinicalNote: formData.clinicalNote,
        }}
        onSelectBooking={handleSelectBookingSlot}
        onBackToDashboard={() => setDashboardView('dashboard')}
        onUpdateReferralData={(updated) => setFormData((prev) => ({ ...prev, ...updated }))}
      />
    );
  }

  if (dashboardView === 'booking-summary' && selectedFacility) {
    return (
      <BookingSummary
        user={user}
        facility={selectedFacility}
        slot={selectedSlot}
        patientName={formData.fullName || 'Anthony Odafe'}
        referralData={{
          scanType: formData.scanType || 'MRI Scan (Magnetic Resonance Imaging)',
          bodyPart: formData.bodyPart || 'Brain',
          contrastOption: formData.contrastOption || 'Not Specified',
          clinicalNote: formData.clinicalNote,
        }}
        onBackToMarketplace={() => setDashboardView('marketplace')}
        onEditBooking={() => setDashboardView('marketplace')}
        onSubmitReferral={handleSubmitReferralFromBooking}
        onUpdateReferralData={(updated) => setFormData({ ...formData, ...updated })}
      />
    );
  }

  return (
    <div className="clinician-layout">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (Desktop Persistent & Mobile Slide-Over Drawer) */}
      <aside className={`clinician-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-group">
            <img src="/logo.png" alt="RESQ" className="resq-sidebar-logo" />
            <span className="resq-brand-text-lg">ResQ</span>
          </div>
          <button
            type="button"
            className="mobile-sidebar-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  handleTabChange(item.id);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <Icon size={19} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('support');
              setIsMobileSidebarOpen(false);
            }}
          >
            <Headphones size={19} className="nav-icon" />
            <span className="nav-label">Support</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              handleTabChange('settings');
              setIsMobileSidebarOpen(false);
            }}
          >
            <Settings size={19} className="nav-icon" />
            <span className="nav-label">Settings</span>
          </button>

          {/* Clinician Profile Footer */}
          <div className="clinician-user-card">
            <div className="avatar-wrapper">
              {userPhoto && !sidebarImgError ? (
                <img
                  src={userPhoto}
                  alt={displayName}
                  className="clinician-avatar-img"
                  onError={() => setSidebarImgError(true)}
                />
              ) : (
                <div className="clinician-avatar-fallback">
                  {userInitial}
                </div>
              )}
              <span className="online-indicator" />
            </div>

            <div className="clinician-info">
              <span className="clinician-name">{displayName}</span>
              <span className="clinician-email" title={displayEmail}>
                {displayEmail}
              </span>
            </div>

            <button
              type="button"
              className="logout-icon-btn"
              onClick={() => {
                setIsSignOutModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="clinician-main">
        {/* Top Header Bar */}
        <header className="clinician-header">
          <div className="header-title-wrap">
            <button
              type="button"
              className="mobile-menu-toggle-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              title="Open menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="header-page-title">
              {navItems.find((item) => item.id === activeTab)?.label || (activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : 'Referrals')}
            </h1>
          </div>

          <div className="header-actions">
            <button type="button" className="icon-badge-btn" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div
              className="header-profile-circle"
              onClick={handleOpenProfileModal}
              style={{ cursor: 'pointer' }}
              title="View & Edit Clinician Profile"
              role="button"
              tabIndex={0}
            >
              {userPhoto && !headerImgError ? (
                <img
                  src={userPhoto}
                  alt={displayName}
                  className="header-avatar-img"
                  onError={() => setHeaderImgError(true)}
                />
              ) : (
                <div className="clinician-avatar-fallback header-fallback">
                  {userInitial}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 1. OVERVIEW TAB VIEW */}
        {activeTab === 'overview' && (
          <div className="overview-container">
            <div className="overview-welcome-card">
              <div className="welcome-text-side">
                <span className="welcome-tag">Doctor Portal</span>
                <h2 className="welcome-title">
                  Welcome back, {displayName.toLowerCase().startsWith('dr.') ? displayName : `Dr. ${displayName}`}
                </h2>
                <p className="welcome-desc">
                  Manage patient cases, monitor incoming and outgoing referrals, and track care transitions seamlessly with the ResQ network.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn-create-referral flex-center-gap"
                    onClick={() => handleTabChange('referrals')}
                  >
                    <span>View Referrals</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenProfileModal}
                    style={{
                      background: 'rgba(255, 255, 255, 0.16)',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      color: '#FFFFFF',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      transition: 'all 0.15s ease',
                    }}
                    title="View and edit your clinician profile"
                  >
                    <Edit2 size={15} />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Clinician Profile Overview Card */}
            <div className="overview-profile-card">
              <div className="profile-card-header">
                <div className="profile-card-user-info">
                  <div className="profile-avatar-large">
                    {userPhoto && !headerImgError ? (
                      <img
                        src={userPhoto}
                        alt={displayName}
                        className="profile-img-large"
                        onError={() => setHeaderImgError(true)}
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <div>
                    <div className="profile-name-row">
                      <h3 className="profile-doctor-name">
                        {displayName.toLowerCase().startsWith('dr.') ? displayName : `Dr. ${displayName}`}
                      </h3>
                      <span className="profile-verified-badge">
                        <ShieldCheck size={13} /> ResQ Verified Clinician
                      </span>
                      <span className="profile-specialty-badge">
                        {displaySpecialty}
                      </span>
                    </div>
                    <p className="profile-practice-sub">
                      <Building2 size={14} />
                      <span>{displayPractice}</span>
                      {displayAddress && <span>• {displayAddress}</span>}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-edit-profile"
                  onClick={handleOpenProfileModal}
                  title="View and edit clinician profile"
                >
                  <Edit2 size={15} />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="profile-details-grid">
                <div className="profile-field-box">
                  <div className="profile-field-label">
                    <span>Email Address</span>
                    <span className="verified-tag">
                      <ShieldCheck size={11} /> Verified
                    </span>
                  </div>
                  <div className="profile-field-value text-locked" style={{ color: '#64748B' }}>
                    <Mail size={15} className="field-icon" style={{ color: '#64748B' }} />
                    <span>{displayEmail}</span>
                  </div>
                  <span className="field-hint">Primary verified login email</span>
                </div>

                <div className="profile-field-box">
                  <div className="profile-field-label">
                    <span>Medical License (MDCN)</span>
                  </div>
                  <div className="profile-field-value">
                    <Award size={15} className="field-icon text-primary" />
                    <span>{displayLicense || 'Not specified'}</span>
                  </div>
                  <span className="field-hint">Practicing medical registration</span>
                </div>

                <div className="profile-field-box">
                  <div className="profile-field-label">
                    <span>Phone Number</span>
                  </div>
                  <div className="profile-field-value">
                    <Phone size={15} className="field-icon text-emerald" />
                    <span>{displayPhone || 'Not specified'}</span>
                  </div>
                  <span className="field-hint">Direct clinician contact number</span>
                </div>

                <div className="profile-field-box">
                  <div className="profile-field-label">
                    <span>Practice / Clinic Name</span>
                  </div>
                  <div className="profile-field-value">
                    <Building2 size={15} className="field-icon text-indigo" />
                    <span>{displayPractice || 'Not specified'}</span>
                  </div>
                  <span className="field-hint">Registered clinical practice</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="overview-stats-grid">
              <div className="stat-card">
                <div className="stat-icon-circle bg-blue-tint">
                  <Users size={22} className="text-primary" />
                </div>
                <div>
                  <span className="stat-label">Total Patients</span>
                  <h3 className="stat-number">{referrals.length}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-circle bg-amber-tint">
                  <ClipboardList size={22} className="text-amber" />
                </div>
                <div>
                  <span className="stat-label">Active Referrals</span>
                  <h3 className="stat-number">{referrals.length}</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-circle bg-emerald-tint">
                  <Clock size={22} className="text-emerald" />
                </div>
                <div>
                  <span className="stat-label">Appointments</span>
                  <h3 className="stat-number">0</h3>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-circle bg-indigo-tint">
                  <Activity size={22} className="text-indigo" />
                </div>
                <div>
                  <span className="stat-label">Practice Status</span>
                  <h3 className="stat-number text-success-sm">Online</h3>
                </div>
              </div>
            </div>

            {/* Referrals shortcut row */}
            <div className="overview-referrals-banner">
              <div>
                <h3 className="banner-title">Need to refer a patient?</h3>
                <p className="banner-sub">
                  Your referral directory connects you with specialized healthcare facilities across Africa.
                </p>
              </div>
              <button
                type="button"
                className="btn-create-referral"
                onClick={() => handleTabChange('referrals')}
              >
                Go to Referrals
              </button>
            </div>
          </div>
        )}

        {/* 2. REFERRALS TAB VIEW */}
        {activeTab === 'referrals' && (
          <div className="referrals-view-wrapper">
            {dashboardView === 'submitted-success' ? (
              <div className="clinician-body clinician-body-success-screen">
                <ReferralSuccess
                  referral={submittedReferralInfo}
                  onViewReferrals={() => {
                    setDashboardView('dashboard');
                    setActiveTab('referrals');
                  }}
                  onCreateNewReferral={() => {
                    setDashboardView('dashboard');
                    setActiveTab('referrals');
                    setFormData({
                      fullName: '',
                      gender: '',
                      dob: '',
                      email: '',
                      phone: '',
                      address: '',
                      scanType: '',
                      bodyPart: '',
                      contrastOption: 'Without Contrast',
                      clinicalNote: '',
                    });
                    setUploadedFile(null);
                    setModalStep('choose-type');
                  }}
                  onViewRequisition={() => {
                    setIsRequisitionModalOpen(true);
                  }}
                  onAddToast={onAddToast}
                />
                <RequisitionDocumentModal
                  isOpen={isRequisitionModalOpen}
                  onClose={() => setIsRequisitionModalOpen(false)}
                  patientData={{
                    fullName: submittedReferralInfo.patientName,
                    email: submittedReferralInfo.patientEmail,
                    phone: submittedReferralInfo.patientPhone,
                    gender: submittedReferralInfo.patientGender,
                    dob: submittedReferralInfo.patientDob,
                    address: formData.address,
                  }}
                  referralData={{
                    scanType: submittedReferralInfo.scanType,
                    bodyPart: submittedReferralInfo.bodyPart || 'General',
                    contrastOption: submittedReferralInfo.contrastOption,
                    clinicalNote: submittedReferralInfo.clinicalNote || 'Standard clinical imaging evaluation.',
                    preferredCenter: submittedReferralInfo.facilityName,
                  }}
                  clinicianData={{
                    name: user.fullname,
                    specialty: user.specialty,
                    facility: user.practiceName,
                    email: user.email,
                    phone: user.phoneNumber,
                  }}
                  fileName={uploadedFile?.name}
                />
              </div>
            ) : (
              <div className="referrals-content-area">
                {/* Clean, High-Professionalism Referral Header */}
                <div className="toolbar-row referrals-main-toolbar">
                  <div className="toolbar-left-group">
                    <button
                      type="button"
                      className="toolbar-action-btn toolbar-icon-square"
                      title="Reload referrals"
                      aria-label="Reload referrals"
                      onClick={() => {
                        loadDoctorReferrals();
                        setTableSearch('');
                      }}
                    >
                      <RotateCw size={15} className={isLoadingReferrals ? 'spin-anim' : ''} />
                    </button>
                  </div>

                  <div className="toolbar-right">
                    <button
                      type="button"
                      className="toolbar-action-btn desktop-only-action"
                      title="Print referral directory"
                      onClick={() => window.print()}
                    >
                      <span>Print</span>
                      <Printer size={14} />
                    </button>

                    {/* Create Referral Trigger Button */}
                    <button
                      type="button"
                      className="btn-create-referral"
                      onClick={() => setModalStep('choose-type')}
                    >
                      <Plus size={15} />
                      <span>Create Referral</span>
                    </button>
                  </div>
                </div>

                <div className="referrals-body-padding">
                  {/* Real Typical Status Metric Cards Grid */}
                  <div className="referrals-metrics-cards" role="region" aria-label="Referral status summary">
                    <button
                      type="button"
                      className={`metric-stat-card ${activeStatusFilters.length === 0 ? 'active' : ''}`}
                      onClick={handleClearFilters}
                      title="Filter by All Referrals"
                    >
                      <div className="metric-card-top">
                        <span className="metric-card-label">All</span>
                        <span className="metric-card-indicator indicator-all" />
                      </div>
                      <div className="metric-card-bottom">
                        <span className="metric-card-val">{totalKpi}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`metric-stat-card ${activeStatusFilters.includes('Submitted') ? 'active' : ''}`}
                      onClick={() => toggleStatusFilter('Submitted')}
                      title="Filter by Submitted"
                    >
                      <div className="metric-card-top">
                        <div className="metric-card-label-group">
                          <span className="metric-card-dot dot-submitted" />
                          <span className="metric-card-label">Submitted</span>
                        </div>
                      </div>
                      <div className="metric-card-bottom">
                        <span className="metric-card-val">{submittedKpi}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`metric-stat-card ${activeStatusFilters.includes('Booking in Progress') ? 'active' : ''}`}
                      onClick={() => toggleStatusFilter('Booking in Progress')}
                      title="Filter by In Progress"
                    >
                      <div className="metric-card-top">
                        <div className="metric-card-label-group">
                          <span className="metric-card-dot dot-progress" />
                          <span className="metric-card-label">In Progress</span>
                        </div>
                      </div>
                      <div className="metric-card-bottom">
                        <span className="metric-card-val">{bookingKpi}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`metric-stat-card ${activeStatusFilters.includes('Confirmed') ? 'active' : ''}`}
                      onClick={() => toggleStatusFilter('Confirmed')}
                      title="Filter by Confirmed"
                    >
                      <div className="metric-card-top">
                        <div className="metric-card-label-group">
                          <span className="metric-card-dot dot-confirmed" />
                          <span className="metric-card-label">Confirmed</span>
                        </div>
                      </div>
                      <div className="metric-card-bottom">
                        <span className="metric-card-val">{confirmedKpi}</span>
                      </div>
                    </button>
                  </div>

                  {/* Search & Filter Container */}
                  <div className="referrals-filter-panel" ref={filterDropdownRef}>
                    <div className="filter-panel-top">
                      <div className="filter-search-container">
                        <Search size={16} className="filter-search-icon" />
                        <input
                          type="text"
                          placeholder="Search by referral ID or patient name..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          className="filter-search-input"
                        />
                        {tableSearch && (
                          <button
                            type="button"
                            className="filter-search-clear-btn"
                            onClick={() => setTableSearch('')}
                            aria-label="Clear search"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="filter-status-dropdown-wrapper desktop-only-action">
                        <button
                          type="button"
                          className="filter-status-trigger-btn"
                          onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                        >
                          <SlidersHorizontal size={14} />
                          <span>Status Filter</span>
                          <ChevronDown size={14} />
                        </button>

                        {isStatusFilterOpen && (
                          <div className="filter-status-dropdown-menu">
                            {ALL_STATUS_OPTIONS.map((status) => {
                              const isChecked = activeStatusFilters.includes(status);
                              return (
                                <div
                                  key={status}
                                  className="filter-status-option"
                                  onClick={() => toggleStatusFilter(status)}
                                >
                                  <div className={`filter-checkbox ${isChecked ? 'checked' : ''}`}>
                                    {isChecked && <Check size={12} />}
                                  </div>
                                  <span>{status}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active filters row */}
                    {activeStatusFilters.length > 0 && (
                      <div className="filter-panel-active-row">
                        <span className="active-filter-label">
                          {activeStatusFilters.length} filter{activeStatusFilters.length === 1 ? '' : 's'} active:
                        </span>

                        {activeStatusFilters.map((status) => (
                          <span key={status} className="active-filter-pill">
                            {status}
                            <button
                              type="button"
                              onClick={() => handleRemoveStatusFilter(status)}
                              aria-label={`Remove ${status} filter`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}

                        <button
                          type="button"
                          className="filter-clear-link"
                          onClick={handleClearFilters}
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Referrals Data Table (Desktop Only) */}
                  <div className="referrals-table-card referrals-desktop-only">
                    <table className="referrals-table">
                      <thead>
                        <tr>
                          <th>REFERRAL ID</th>
                          <th>PATIENT NAME</th>
                          <th>SERVICE</th>
                          <th>PROVIDER</th>
                          <th>STATUS</th>
                          <th>CREATED DATE</th>
                          <th className="th-actions">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingReferrals && allCombinedReferrals.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '64px 20px', color: '#64748B' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <RotateCw size={26} className="spin-anim" color="#0D9488" />
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                                  Loading referrals...
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : allCombinedReferrals.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '64px 20px', color: '#64748B' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <ClipboardList size={36} color="#94A3B8" />
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                                  No referrals created yet
                                </span>
                                <span style={{ fontSize: '13px', color: '#64748B', maxWidth: '340px', lineHeight: 1.5 }}>
                                  When you create a referral, it will be securely saved to your database and payment instructions will be emailed to your patient.
                                </span>
                                <button
                                  type="button"
                                  className="btn-create-referral"
                                  style={{ marginTop: '10px' }}
                                  onClick={() => setModalStep('choose-type')}
                                >
                                  Create First Referral
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : filteredReferrals.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                              No referrals found matching your search or filter.
                            </td>
                          </tr>
                        ) : (
                          filteredReferrals.map((ref) => {
                            const statusClass = getStatusClass(ref.status);
                            const isDraft = ref.isDraft && ref.draft;

                            return (
                              <tr
                                key={isDraft ? `draft-${ref.draft!.id}` : ref.id}
                                className={isDraft ? 'row-is-draft' : 'row-normal-referral'}
                              >
                                <td className="referral-id-cell">
                                  {isDraft ? (
                                    <div className="draft-id-container">
                                      <span className="draft-badge-pill">
                                        <FileEdit size={11} />
                                        <span>DRAFT</span>
                                      </span>
                                      <span className="draft-id-tag">{ref.id}</span>
                                    </div>
                                  ) : (
                                    ref.id
                                  )}
                                </td>

                                <td className="patient-name-cell">
                                  {isDraft ? (
                                    <div className="draft-patient-cell">
                                      <span className="draft-patient-name">{ref.patientName}</span>
                                      <span className="draft-step-hint">
                                        {ref.draft!.step === 'scan-details' ? 'Step 2: Scan details pending' : 'Step 1: Patient info pending'}
                                      </span>
                                    </div>
                                  ) : (
                                    ref.patientName
                                  )}
                                </td>

                                <td className="service-cell">
                                  {ref.service || ref.specialty || 'Diagnostic Scan'}
                                </td>

                                <td className={isDraft || ref.provider === 'Not selected' || ref.hospital === 'Not selected' ? 'provider-muted' : 'provider-cell'}>
                                  {isDraft ? (
                                    <span className="draft-provider-badge">Pending center selection</span>
                                  ) : (
                                    ref.provider || ref.hospital || 'Not selected'
                                  )}
                                </td>

                                <td>
                                  <span className={`status-pill ${statusClass}`}>
                                    <span className="status-dot" />
                                    {ref.status}
                                  </span>
                                </td>

                                <td className="date-cell">
                                  {isDraft ? (
                                    <span className="draft-date-text">{ref.date}</span>
                                  ) : (
                                    ref.date
                                  )}
                                </td>

                                <td className="actions-cell">
                                  {isDraft ? (
                                    <div className="table-actions-group">
                                      <button
                                        type="button"
                                        className="btn-table-resume-draft"
                                        onClick={() => handleResumeDraft(ref.draft!)}
                                        title="Resume & complete referral"
                                      >
                                        <ArrowUpRight size={13} />
                                        <span>Resume</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-table-delete-draft"
                                        onClick={(e) => handleDeleteDraft(ref.draft!.id, e)}
                                        title="Discard this draft"
                                        aria-label="Discard draft"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="table-actions-group">
                                      <button
                                        type="button"
                                        className="btn-table-view-referral"
                                        onClick={() => {
                                          setSubmittedReferralInfo({
                                            id: ref.id,
                                            patientName: ref.patientName,
                                            scanType: ref.service || ref.specialty || 'Diagnostic Scan',
                                            bodyPart: ref.bodyPart || 'General',
                                            contrastOption: 'Without Contrast',
                                            facilityName: ref.provider || ref.hospital || 'ResQ Imaging Network',
                                            status: ref.status,
                                            referralLink: '',
                                            patientPhone: 'Confidential',
                                            patientEmail: 'patient@resq.health',
                                            patientGender: 'Verified',
                                            patientDob: 'Verified',
                                            clinicalNote: ref.clinicalNote || 'Standard clinical imaging referral documentation.',
                                          });
                                          setIsRequisitionModalOpen(true);
                                        }}
                                        title="View referral details"
                                      >
                                        <FileText size={12} />
                                        <span>View</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    {/* Table Footer & Pagination */}
                    <div className="referrals-table-footer">
                      <div className="footer-showing-text">
                        Showing {filteredReferrals.length > 0 ? 1 : 0} to {filteredReferrals.length} of {allCombinedReferrals.length} items
                        {savedDrafts.length > 0 && ` (${savedDrafts.length} draft${savedDrafts.length === 1 ? '' : 's'})`}
                      </div>

                      <div className="pagination-controls">
                        <button type="button" className="page-btn page-arrow-btn" aria-label="Previous page">
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
                          onClick={() => setCurrentPage(1)}
                        >
                          1
                        </button>
                        <button
                          type="button"
                          className={`page-btn ${currentPage === 2 ? 'active' : ''}`}
                          onClick={() => setCurrentPage(2)}
                        >
                          2
                        </button>
                        <button
                          type="button"
                          className={`page-btn ${currentPage === 3 ? 'active' : ''}`}
                          onClick={() => setCurrentPage(3)}
                        >
                          3
                        </button>
                        <button type="button" className="page-btn page-arrow-btn" aria-label="Next page">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Referrals Mobile Cards View (Mobile Only) */}
                  <div className="referrals-mobile-cards-view">
                    {isLoadingReferrals && referrals.length === 0 ? (
                      <div className="mobile-empty-referrals-card" style={{ padding: '56px 20px' }}>
                        <RotateCw size={26} className="spin-anim" color="#0D9488" />
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#475569', marginTop: '10px' }}>
                          Loading referrals...
                        </span>
                      </div>
                    ) : referrals.length === 0 ? (
                      <div className="mobile-empty-referrals-card">
                        <div className="mobile-empty-icon-circle">
                          <ClipboardList size={30} color="#0D9488" />
                        </div>
                        <h3 className="mobile-empty-title">No referrals yet</h3>
                        <p className="mobile-empty-desc">
                          Referrals you create will appear here in real-time, and diagnostic booking payment links will be emailed directly to your patient.
                        </p>
                        <button
                          type="button"
                          className="btn-create-referral mobile-empty-btn"
                          onClick={() => setModalStep('choose-type')}
                        >
                          <Plus size={16} />
                          <span>Create First Referral</span>
                        </button>
                      </div>
                    ) : filteredReferrals.length === 0 ? (
                      <div className="mobile-empty-filtered-card">
                        <Filter size={24} color="#94A3B8" />
                        <h4 className="mobile-empty-filtered-title">No matching referrals</h4>
                        <p className="mobile-empty-filtered-desc">
                          No referrals found matching "{tableSearch || activeStatusFilters.join(', ')}".
                        </p>
                        <button
                          type="button"
                          className="filter-clear-link"
                          onClick={handleClearFilters}
                        >
                          Reset Filters
                        </button>
                      </div>
                    ) : (
                      paginatedMobileReferrals.map((ref) => {
                        const statusClass = getStatusClass(ref.status);
                        const isDraft = ref.isDraft && ref.draft;

                        return (
                          <div
                            key={isDraft ? `m-draft-${ref.draft!.id}` : `m-${ref.id}`}
                            className={`mobile-referral-card ${isDraft ? 'mobile-draft-card' : ''}`}
                          >
                            <div className="mobile-ref-card-header">
                              <div className="mobile-ref-card-title-group">
                                <span className="mobile-ref-patient-name">{ref.patientName}</span>
                                {isDraft ? (
                                  <span className="draft-badge-pill">
                                    <FileEdit size={10} />
                                    <span>DRAFT</span>
                                  </span>
                                ) : (
                                  <span className="mobile-ref-id-badge">{ref.id}</span>
                                )}
                              </div>
                              <span className={`status-pill ${statusClass}`}>
                                <span className="status-dot" />
                                {ref.status}
                              </span>
                            </div>

                            <div className="mobile-ref-card-divider" />

                            <div className="mobile-ref-card-body">
                              <div className="mobile-ref-detail-item">
                                <span className="mobile-ref-detail-label">Service</span>
                                <span className="mobile-ref-detail-val service-highlight">
                                  {ref.service || ref.specialty || 'General Radiology'}
                                </span>
                              </div>

                              <div className="mobile-ref-detail-item">
                                <span className="mobile-ref-detail-label">Facility / Provider</span>
                                <div className="mobile-ref-facility-row">
                                  <Building2 size={13} className="text-secondary" />
                                  <span className={`mobile-ref-detail-val ${isDraft || ref.provider === 'Not selected' || ref.hospital === 'Not selected' ? 'provider-muted' : ''}`}>
                                    {isDraft ? 'Pending center selection' : (ref.provider || ref.hospital || 'Not selected')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mobile-ref-card-footer">
                              <div className="mobile-ref-date">
                                <Calendar size={12} className="text-secondary" />
                                <span>{ref.date}</span>
                              </div>
                              <span className="mobile-ref-status-hint">
                                {isDraft
                                  ? 'Draft (Pending submission)'
                                  : ref.status === 'Confirmed'
                                  ? 'Appointment Confirmed'
                                  : ref.status === 'Booking in Progress'
                                  ? 'Center Reviewing'
                                  : 'Payment Link Sent'}
                              </span>
                            </div>

                            {isDraft && (
                              <div className="mobile-draft-actions">
                                <button
                                  type="button"
                                  className="btn-mobile-resume-draft"
                                  onClick={() => handleResumeDraft(ref.draft!)}
                                >
                                  <ArrowUpRight size={14} />
                                  <span>Resume Draft</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-mobile-delete-draft"
                                  onClick={(e) => handleDeleteDraft(ref.draft!.id, e)}
                                  aria-label="Discard draft"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Mobile Pagination Controls (Strictly 5 per page) */}
                    {filteredReferrals.length > 0 && totalMobilePages > 1 ? (
                      <div className="mobile-referrals-pagination">
                        <div className="mobile-pagination-top-bar">
                          <span className="mobile-pagination-info">
                            Showing <strong>{mobileStartIndex + 1}–{Math.min(mobileEndIndex, filteredReferrals.length)}</strong> of <strong>{filteredReferrals.length}</strong> referrals
                          </span>
                          <span className="mobile-pagination-page-badge">
                            Page {safeMobilePage} of {totalMobilePages}
                          </span>
                        </div>

                        <div className="mobile-pagination-nav-row">
                          <button
                            type="button"
                            className="mobile-nav-arrow-btn prev-btn"
                            aria-label="Previous page"
                            disabled={safeMobilePage <= 1}
                            onClick={() => setMobileReferralPage((p) => Math.max(1, p - 1))}
                          >
                            <ChevronLeft size={16} />
                            <span>Prev</span>
                          </button>

                          <div className="mobile-page-numbers-group">
                            {(() => {
                              let pages: (number | string)[] = [];
                              if (totalMobilePages <= 5) {
                                pages = Array.from({ length: totalMobilePages }, (_, i) => i + 1);
                              } else if (safeMobilePage <= 3) {
                                pages = [1, 2, 3, '...', totalMobilePages];
                              } else if (safeMobilePage >= totalMobilePages - 2) {
                                pages = [1, '...', totalMobilePages - 2, totalMobilePages - 1, totalMobilePages];
                              } else {
                                pages = [1, '...', safeMobilePage, '...', totalMobilePages];
                              }

                              return pages.map((item, idx) => {
                                if (typeof item === 'string') {
                                  return (
                                    <span key={`dots-${idx}`} className="mobile-page-ellipsis">
                                      …
                                    </span>
                                  );
                                }
                                return (
                                  <button
                                    key={item}
                                    type="button"
                                    className={`mobile-number-btn ${safeMobilePage === item ? 'active' : ''}`}
                                    onClick={() => setMobileReferralPage(item)}
                                    aria-label={`Go to page ${item}`}
                                  >
                                    {item}
                                  </button>
                                );
                              });
                            })()}
                          </div>

                          <button
                            type="button"
                            className="mobile-nav-arrow-btn next-btn"
                            aria-label="Next page"
                            disabled={safeMobilePage >= totalMobilePages}
                            onClick={() => setMobileReferralPage((p) => Math.min(totalMobilePages, p + 1))}
                          >
                            <span>Next</span>
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    ) : filteredReferrals.length > 0 ? (
                      <div className="mobile-pagination-single-chip">
                        Showing all {filteredReferrals.length} referrals
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. CALENDAR TAB VIEW */}
        {activeTab === 'calendar' && (
          <div className="calendar-view-wrapper">
            <div className="calendar-page-layout">
              {/* Calendar Header Row */}
              <div className="calendar-top-header">
                <div className="calendar-header-title-group">
                  <div className="calendar-header-badge">
                    <Calendar size={13} />
                    <span>Clinical Schedule</span>
                  </div>
                  <h1 className="calendar-main-title">Diagnostic & Referral Calendar</h1>
                  <p className="calendar-main-subtitle">
                    Schedule and monitoring for patient imaging appointments, consultations, and diagnostic follow-ups.
                  </p>
                </div>
                <div className="calendar-header-actions">
                  <button
                    type="button"
                    className="btn-create-referral"
                    onClick={() => setModalStep('choose-type')}
                  >
                    <Plus size={16} />
                    <span>New Referral</span>
                  </button>
                </div>
              </div>

              {/* Minimalist Medical Metrics Ribbon - Clean, Low Color, High Legibility */}
              <div className="calendar-kpi-ribbon">
                <div
                  className={`calendar-kpi-chip ${calendarStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCalendarStatusFilter('all')}
                  role="button"
                  tabIndex={0}
                >
                  <span className="calendar-kpi-val">{referrals.length}</span>
                  <span className="calendar-kpi-lbl">Total Scheduled</span>
                </div>
                <div className="calendar-kpi-divider" />
                <div
                  className={`calendar-kpi-chip ${calendarStatusFilter === 'Confirmed' ? 'active' : ''}`}
                  onClick={() => setCalendarStatusFilter('Confirmed')}
                  role="button"
                  tabIndex={0}
                >
                  <span className="calendar-kpi-val">{confirmedKpi}</span>
                  <span className="calendar-kpi-lbl">Confirmed</span>
                </div>
                <div className="calendar-kpi-divider" />
                <div
                  className={`calendar-kpi-chip ${calendarStatusFilter === 'Booking in Progress' ? 'active' : ''}`}
                  onClick={() => setCalendarStatusFilter('Booking in Progress')}
                  role="button"
                  tabIndex={0}
                >
                  <span className="calendar-kpi-val">{bookingKpi + submittedKpi}</span>
                  <span className="calendar-kpi-lbl">In Progress</span>
                </div>
                <div className="calendar-kpi-divider" />
                <div
                  className="calendar-kpi-chip"
                  onClick={() => {
                    setActiveTab('patients');
                    setPatientTabFilter('drafts');
                  }}
                  role="button"
                  tabIndex={0}
                  title="View pending drafts in Patients Directory"
                >
                  <span className="calendar-kpi-val">{savedDrafts.length}</span>
                  <span className="calendar-kpi-lbl">Pending Drafts</span>
                </div>
              </div>

              {/* Navigation & Controls Toolbar */}
              <div className="calendar-nav-toolbar">
                <div className="calendar-nav-controls">
                  <div className="calendar-nav-cluster">
                    <button
                      type="button"
                      className="calendar-nav-arrow-btn"
                      onClick={handlePrevMonth}
                      title="Previous Month"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="calendar-current-month-display">
                      {calendarMonthLabel}
                    </span>
                    <button
                      type="button"
                      className="calendar-nav-arrow-btn"
                      onClick={handleNextMonth}
                      title="Next Month"
                      aria-label="Next Month"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      type="button"
                      className="calendar-today-btn"
                      onClick={handleToday}
                    >
                      Today
                    </button>
                  </div>

                  <div className="calendar-view-toggle">
                    <button
                      type="button"
                      className={`view-toggle-pill ${calendarViewMode === 'month' ? 'active' : ''}`}
                      onClick={() => setCalendarViewMode('month')}
                    >
                      <Grid size={14} />
                      <span>Month</span>
                    </button>
                    <button
                      type="button"
                      className={`view-toggle-pill ${calendarViewMode === 'agenda' ? 'active' : ''}`}
                      onClick={() => setCalendarViewMode('agenda')}
                    >
                      <List size={14} />
                      <span>Agenda</span>
                    </button>
                  </div>
                </div>

                <div className="calendar-controls-right">
                  <div className="calendar-filter-pills">
                    <button
                      type="button"
                      className={`filter-pill-btn ${calendarStatusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setCalendarStatusFilter('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`filter-pill-btn ${calendarStatusFilter === 'Confirmed' ? 'active' : ''}`}
                      onClick={() => setCalendarStatusFilter('Confirmed')}
                    >
                      Confirmed
                    </button>
                    <button
                      type="button"
                      className={`filter-pill-btn ${calendarStatusFilter === 'Booking in Progress' ? 'active' : ''}`}
                      onClick={() => setCalendarStatusFilter('Booking in Progress')}
                    >
                      In Progress
                    </button>
                  </div>

                  <div className="calendar-search-box">
                    <Search size={15} color="#64748B" />
                    <input
                      type="text"
                      value={calendarSearchQuery}
                      onChange={(e) => setCalendarSearchQuery(e.target.value)}
                      placeholder="Search patient, scan or center..."
                      className="calendar-search-input"
                    />
                    {calendarSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCalendarSearchQuery('')}
                        className="calendar-search-clear"
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Calendar View Body */}
              {calendarViewMode === 'month' ? (
                <div className="calendar-interactive-layout">
                  {/* Left Column: Month Calendar Grid */}
                  <div className="calendar-grid-card">
                    <div className="calendar-grid-weekdays">
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>

                    <div className="calendar-grid-days">
                      {calendarGridDays.map((item, idx) => {
                        const dayReferrals = getReferralsForDate(item.date);
                        const isToday = isSameCalendarDay(item.date, new Date());
                        const isSelected = isSameCalendarDay(item.date, selectedCalendarDate);

                        return (
                          <div
                            key={idx}
                            className={`calendar-day-cell ${item.isCurrentMonth ? 'in-month' : 'out-month'} ${
                              isToday ? 'is-today' : ''
                            } ${isSelected ? 'is-selected' : ''} ${
                              dayReferrals.length > 0 ? 'has-events' : ''
                            }`}
                            onClick={() => {
                              setSelectedCalendarDate(item.date);
                              if (!item.isCurrentMonth) {
                                setCalendarCurrentDate(new Date(item.date.getFullYear(), item.date.getMonth(), 1));
                              }
                            }}
                          >
                            <div className="day-cell-top">
                              <span className={`day-number-badge ${isToday ? 'today-badge' : ''}`}>
                                {item.dayNumber}
                              </span>
                              {dayReferrals.length > 0 && (
                                <span className="day-scan-count">
                                  {dayReferrals.length}
                                </span>
                              )}
                            </div>

                            <div className="day-events-list">
                              {dayReferrals.slice(0, 2).map((ref) => (
                                <div
                                  key={ref.id}
                                  className={`day-event-chip chip-${getStatusClass(ref.status)}`}
                                  title={`${ref.patientName} - ${ref.service} (${ref.provider})`}
                                >
                                  <span className="chip-time">{ref.service.split('-')[0].trim()}</span>
                                  <span className="chip-name">{ref.patientName.split(' ')[0]}</span>
                                </div>
                              ))}
                              {dayReferrals.length > 2 && (
                                <div className="day-more-chip">
                                  +{dayReferrals.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Selected Day Schedule Panel */}
                  <div className="calendar-day-detail-panel">
                    <div className="detail-panel-header">
                      <div>
                        <span className="detail-panel-date-tag">
                          {selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long' })}
                        </span>
                        <h3 className="detail-panel-date-heading">
                          {selectedCalendarDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </h3>
                      </div>
                      <span className="detail-panel-count-pill">
                        {selectedDateReferrals.length} {selectedDateReferrals.length === 1 ? 'Booking' : 'Bookings'}
                      </span>
                    </div>

                    <div className="detail-panel-body">
                      {selectedDateReferrals.length > 0 ? (
                        <>
                          <div className="selected-day-appointments-list">
                            {pagedSideReferrals.map((ref) => (
                              <div key={ref.id} className="appointment-card-item">
                                <div className="appointment-card-header">
                                  <div className="appointment-time-badge">
                                    <Clock size={13} />
                                    <span>10:00 AM</span>
                                  </div>
                                  <span className={`status-pill ${getStatusClass(ref.status)}`}>
                                    {ref.status}
                                  </span>
                                </div>

                                <div className="appointment-patient-row">
                                  <div className="patient-avatar-circle">
                                    {ref.patientName
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div className="patient-main-info">
                                    <h4 className="patient-name-title">{ref.patientName}</h4>
                                    <span className="patient-ref-id">{ref.id}</span>
                                  </div>
                                </div>

                                <div className="appointment-scan-meta">
                                  <div className="scan-meta-item">
                                    <Activity size={13} color="#0D9488" />
                                    <span className="scan-service-text">{ref.service}</span>
                                  </div>
                                  <div className="scan-meta-item">
                                    <Building2 size={13} color="#64748B" />
                                    <span className="scan-facility-text">{ref.provider}</span>
                                  </div>
                                </div>

                                {ref.clinicalNote && (
                                  <p className="appointment-note-snippet">
                                    "{ref.clinicalNote}"
                                  </p>
                                )}

                                <div className="appointment-card-actions">
                                  <button
                                    type="button"
                                    className="btn-appointment-requisition"
                                    onClick={() => setSelectedRequisitionReferral(ref)}
                                  >
                                    <FileText size={14} />
                                    <span>View Requisition</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Sidebar Booking List Pagination */}
                          <Pagination
                            currentPage={calendarSidePage}
                            totalPages={totalSidePages}
                            totalItems={totalSideItems}
                            pageSize={calendarSidePageSize}
                            onPageChange={setCalendarSidePage}
                            itemLabel="bookings"
                            className="calendar-sidebar-pagination"
                          />
                        </>
                      ) : (
                        <div className="detail-empty-day-state">
                          <div className="empty-day-icon-circle">
                            <Calendar size={26} color="#94A3B8" />
                          </div>
                          <h4 className="empty-day-title">No Scans Scheduled</h4>
                          <p className="empty-day-desc">
                            There are no appointments on {selectedCalendarDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                          </p>
                          <button
                            type="button"
                            className="btn-create-referral btn-small"
                            onClick={() => setModalStep('choose-type')}
                          >
                            <Plus size={14} />
                            <span>Schedule Scan</span>
                          </button>

                          {/* Upcoming Scans Highlight */}
                          <div className="upcoming-nearby-section">
                            <span className="upcoming-nearby-title">Upcoming Appointments</span>
                            <div className="upcoming-nearby-list">
                              {referrals.slice(0, 3).map((r) => (
                                <div
                                  key={r.id}
                                  className="upcoming-mini-row"
                                  onClick={() => setSelectedCalendarDate(parseReferralDate(r))}
                                >
                                  <div className="mini-row-date">
                                    <span>{r.date}</span>
                                  </div>
                                  <div className="mini-row-info">
                                    <strong>{r.patientName}</strong>
                                    <span>{r.service}</span>
                                  </div>
                                  <span className={`status-pill ${getStatusClass(r.status)} mini-pill`}>
                                    {r.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Agenda / List View */
                <div className="calendar-agenda-container">
                  <div className="agenda-list-table-card">
                    <table className="resq-table agenda-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Patient Details</th>
                          <th>Diagnostic Scan / Modality</th>
                          <th>Diagnostic Facility</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedCalendarAgendaReferrals.map((ref) => (
                          <tr key={ref.id} className="agenda-row">
                            <td>
                              <div className="agenda-date-cell">
                                <span className="agenda-date-bold">{ref.date}</span>
                                <span className="agenda-time-sub">10:00 AM</span>
                              </div>
                            </td>
                            <td>
                              <div className="agenda-patient-cell">
                                <div className="patient-avatar-small">
                                  {ref.patientName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <strong className="agenda-patient-name">{ref.patientName}</strong>
                                  <span className="agenda-id-sub">{ref.id}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="agenda-service-tag">{ref.service}</span>
                            </td>
                            <td>
                              <div className="agenda-facility-cell">
                                <Building2 size={13} color="#64748B" />
                                <span>{ref.provider}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${getStatusClass(ref.status)}`}>
                                {ref.status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-table-action"
                                onClick={() => setSelectedRequisitionReferral(ref)}
                                title="View Official Requisition Document"
                              >
                                <FileText size={14} />
                                <span>Requisition</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Agenda Mobile View (Cards) */}
                  <div className="agenda-mobile-cards">
                    {pagedCalendarAgendaReferrals.map((ref) => (
                      <div key={ref.id} className="agenda-mobile-card">
                        <div className="agenda-mobile-card-header">
                          <div className="agenda-mobile-date">
                            <Calendar size={13} color="#0D9488" />
                            <span>{ref.date} • 10:00 AM</span>
                          </div>
                          <span className={`status-pill ${getStatusClass(ref.status)}`}>
                            {ref.status}
                          </span>
                        </div>
                        <div className="agenda-mobile-patient">
                          <div className="patient-avatar-small">
                            {ref.patientName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="agenda-patient-name">{ref.patientName}</div>
                            <div className="agenda-id-sub">{ref.id}</div>
                          </div>
                        </div>
                        <div className="agenda-mobile-meta">
                          <div>
                            <strong>Scan:</strong> {ref.service}
                          </div>
                          <div>
                            <strong>Center:</strong> {ref.provider}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-appointment-requisition"
                          onClick={() => setSelectedRequisitionReferral(ref)}
                        >
                          <FileText size={14} />
                          <span>View Requisition</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Right-aligned Pagination */}
                  {filteredCalendarAgendaReferrals.length > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <Pagination
                        currentPage={calendarAgendaCurrentPage}
                        totalItems={filteredCalendarAgendaReferrals.length}
                        pageSize={calendarAgendaPageSize}
                        onPageChange={setCalendarAgendaCurrentPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. PATIENTS TAB VIEW */}
        {activeTab === 'patients' && (
          <div className="patients-view-wrapper">
            <div className="patients-page-layout">
              {/* Page Header */}
              <div className="patients-top-header">
                <div className="patients-header-title-group">
                  <div className="patients-header-badge">
                    <Users size={13} />
                    <span>Clinical Registry</span>
                  </div>
                  <h1 className="patients-main-title">Patients Directory</h1>
                  <p className="patients-main-subtitle">
                    Centralized directory of patient records, active diagnostic orders, and pending referral drafts.
                  </p>
                </div>
                <div className="patients-header-actions">
                  <button
                    type="button"
                    className="btn-create-referral"
                    onClick={() => setModalStep('choose-type')}
                  >
                    <Plus size={16} />
                    <span>New Referral</span>
                  </button>
                </div>
              </div>

              {/* Minimalist Summary KPIs */}
              <div className="patients-summary-bar">
                <button
                  type="button"
                  className={`patients-summary-stat ${patientTabFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPatientTabFilter('all')}
                >
                  <span className="summary-stat-val">{referredPatientsList.length + savedDrafts.length}</span>
                  <span className="summary-stat-label">Total Patients</span>
                </button>
                <div className="patients-summary-divider" />
                <button
                  type="button"
                  className={`patients-summary-stat ${patientTabFilter === 'referred' ? 'active' : ''}`}
                  onClick={() => setPatientTabFilter('referred')}
                >
                  <span className="summary-stat-val">{referredPatientsList.length}</span>
                  <span className="summary-stat-label">Referred Patients</span>
                </button>
                <div className="patients-summary-divider" />
                <button
                  type="button"
                  className={`patients-summary-stat ${patientTabFilter === 'drafts' ? 'active' : ''}`}
                  onClick={() => setPatientTabFilter('drafts')}
                >
                  <span className="summary-stat-val">{savedDrafts.length}</span>
                  <span className="summary-stat-label">Pending Drafts</span>
                </button>
              </div>

              {/* Search & Tabs Toolbar */}
              <div className="patients-toolbar-card">
                <div className="patients-tabs-row">
                  <button
                    type="button"
                    className={`patient-tab-btn ${patientTabFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPatientTabFilter('all')}
                  >
                    All ({referredPatientsList.length + savedDrafts.length})
                  </button>
                  <button
                    type="button"
                    className={`patient-tab-btn ${patientTabFilter === 'referred' ? 'active' : ''}`}
                    onClick={() => setPatientTabFilter('referred')}
                  >
                    Referred ({referredPatientsList.length})
                  </button>
                  <button
                    type="button"
                    className={`patient-tab-btn ${patientTabFilter === 'drafts' ? 'active' : ''}`}
                    onClick={() => setPatientTabFilter('drafts')}
                  >
                    Drafts ({savedDrafts.length})
                  </button>
                </div>

                <div className="patients-tools-row">
                  <div className="patients-search-input-wrap">
                    <Search size={15} color="#64748B" />
                    <input
                      type="text"
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      placeholder="Search patient, contact, scan..."
                      className="patients-search-input"
                    />
                    {patientSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPatientSearchQuery('')}
                        className="patients-search-clear"
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="patients-view-toggle">
                    <button
                      type="button"
                      className={`view-toggle-pill ${patientViewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setPatientViewMode('table')}
                      title="Table View"
                    >
                      <List size={15} />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      className={`view-toggle-pill ${patientViewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setPatientViewMode('cards')}
                      title="Cards View"
                    >
                      <Grid size={15} />
                      <span>Cards</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table View (Default Desktop) */}
              {patientViewMode === 'table' ? (
                <div className="patients-table-container">
                  <div className="patients-table-card">
                    <table className="resq-table patients-main-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Contact</th>
                          <th>Type & Status</th>
                          <th>Scan / Indication</th>
                          <th>Facility</th>
                          <th>Last Activity</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPatientItems.map((item) => {
                          if (item.kind === 'draft') {
                            const draft = item.draft;
                            return (
                              <tr key={draft.id} className="patient-table-row">
                                <td>
                                  <div className="patient-table-cell-user">
                                    <div className="patient-avatar-subtle">
                                      {(draft.formData.fullName || 'UC')
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                    <div>
                                      <strong className="table-patient-name">
                                        {draft.formData.fullName || 'Unnamed Client'}
                                      </strong>
                                      <span className="table-sub-info">
                                        {draft.formData.gender || 'Not specified'} • {draft.formData.dob || 'DOB on file'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="table-contact-cell">
                                    <span>{draft.formData.email || '—'}</span>
                                    <span className="table-sub-info">{draft.formData.phone || '—'}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="patient-status-pill pill-draft">
                                    Draft • {draft.step === 'patient-info' ? 'Step 1/4' : 'Step 2/4'}
                                  </span>
                                </td>
                                <td>
                                  <div className="table-scan-cell">
                                    <span className="table-service-name">
                                      {draft.formData.scanType || 'Diagnostic Scan'}
                                      {draft.formData.bodyPart ? ` (${draft.formData.bodyPart})` : ''}
                                    </span>
                                    {draft.formData.clinicalNote && (
                                      <span className="table-note-preview" title={draft.formData.clinicalNote}>
                                        {draft.formData.clinicalNote}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className="table-facility-muted">Pending selection</span>
                                </td>
                                <td>
                                  <span className="table-date-text">{draft.savedAtDisplay || 'Recent'}</span>
                                </td>
                                <td>
                                  <div className="table-actions-cell" style={{ justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      className="btn-table-action btn-resume"
                                      onClick={() => handleResumeDraft(draft)}
                                      title="Resume Referral"
                                    >
                                      <ArrowRight size={13} />
                                      <span>Resume</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-table-action-icon"
                                      onClick={(e) => handleDeleteDraft(draft.id, e)}
                                      title="Delete Draft"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          const patient = item.patient;
                          const latest = patient.latestReferral;
                          return (
                            <tr key={patient.patientName} className="patient-table-row">
                              <td>
                                <div className="patient-table-cell-user">
                                  <div className="patient-avatar-subtle">
                                    {patient.patientName
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <strong className="table-patient-name">{patient.patientName}</strong>
                                    <span className="table-sub-info">
                                      {patient.gender || 'Patient'} • {patient.dob || 'DOB on file'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="table-contact-cell">
                                  <span>{patient.email || '—'}</span>
                                  <span className="table-sub-info">{patient.phone || '—'}</span>
                                </div>
                              </td>
                              <td>
                                {latest && (
                                  <span className={`status-pill ${getStatusClass(latest.status)}`}>
                                    {latest.status}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="table-scan-cell">
                                  <span className="table-service-name">{latest?.service || 'Consultation'}</span>
                                  {latest?.clinicalNote && (
                                    <span className="table-note-preview" title={latest.clinicalNote}>
                                      {latest.clinicalNote}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className="table-facility-name">{latest?.provider || 'Network Facility'}</span>
                              </td>
                              <td>
                                <span className="table-date-text">{latest?.date || 'Recent'}</span>
                              </td>
                              <td>
                                <div className="table-actions-cell" style={{ justifyContent: 'flex-end' }}>
                                  {latest && (
                                    <button
                                      type="button"
                                      className="btn-table-action"
                                      onClick={() => setSelectedRequisitionReferral(latest)}
                                      title="View Requisition Document"
                                    >
                                      <FileText size={13} />
                                      <span>Requisition</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-table-action btn-refer-again"
                                    onClick={() =>
                                      handleNewReferralForPatient({
                                        name: patient.patientName,
                                        email: patient.email,
                                        phone: patient.phone,
                                        gender: patient.gender,
                                        dob: patient.dob,
                                        address: patient.address,
                                      })
                                    }
                                    title="New Referral for Patient"
                                  >
                                    <Plus size={13} />
                                    <span>Refer</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Right-aligned Pagination for Table View */}
                  {allVisiblePatientItems.length > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <Pagination
                        currentPage={patientCurrentPage}
                        totalItems={allVisiblePatientItems.length}
                        pageSize={patientPageSize}
                        onPageChange={setPatientCurrentPage}
                      />
                    </div>
                  )}

                  {/* Empty state for table */}
                  {allVisiblePatientItems.length === 0 && (
                    <div className="patients-global-empty-state">
                      <Users size={36} color="#94A3B8" />
                      <h3>No records match your criteria</h3>
                      <p>Try searching for another name or reset your filter.</p>
                      <button
                        type="button"
                        className="btn-create-referral btn-small"
                        onClick={() => {
                          setPatientSearchQuery('');
                          setPatientTabFilter('all');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Cards View */
                <div className="patients-cards-layout">
                  {pagedPatientItems.length > 0 && (
                    <div className="patients-card-group">
                      <div className="patients-grid-cards">
                        {pagedPatientItems.map((item) => {
                          if (item.kind === 'draft') {
                            const draft = item.draft;
                            const stepName =
                              draft.step === 'patient-info' ? 'Step 1 of 4' : 'Step 2 of 4';
                            const stepPercent = draft.step === 'patient-info' ? '25%' : '50%';
                            const clientName = draft.formData.fullName || 'Unnamed Client';
                            const scanType = draft.formData.scanType || 'Diagnostic Scan (Unspecified)';
                            const bodyPart = draft.formData.bodyPart || '';

                            return (
                              <div key={draft.id} className="patient-card-box">
                                <div className="patient-card-top">
                                  <div className="patient-card-identity">
                                    <div className="patient-avatar-subtle">
                                      {clientName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                    <div>
                                      <h4 className="patient-card-name">{clientName}</h4>
                                      <span className="patient-card-sub">
                                        {draft.formData.gender || 'Not specified'} • {draft.formData.dob || 'DOB on file'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="patient-status-pill pill-draft">
                                    Draft
                                  </span>
                                </div>

                                <div className="patient-card-details">
                                  <div className="patient-detail-row">
                                    <Activity size={14} color="#0D9488" />
                                    <span className="font-medium text-slate-800">
                                      {scanType}{bodyPart ? ` • ${bodyPart}` : ''}
                                    </span>
                                  </div>
                                  {(draft.formData.email || draft.formData.phone) && (
                                    <div className="patient-detail-row text-muted">
                                      <Mail size={13} />
                                      <span>{draft.formData.email || draft.formData.phone}</span>
                                    </div>
                                  )}
                                  <div className="draft-progress-strip">
                                    <div className="draft-progress-meta">
                                      <span>{stepName}</span>
                                      <span>{stepPercent} complete</span>
                                    </div>
                                    <div className="draft-progress-bar-bg">
                                      <div className="draft-progress-bar-val" style={{ width: stepPercent }} />
                                    </div>
                                  </div>
                                </div>

                                <div className="patient-card-footer">
                                  <button
                                    type="button"
                                    className="btn-resume-draft-primary"
                                    onClick={() => handleResumeDraft(draft)}
                                  >
                                    <span>Resume Referral</span>
                                    <ArrowRight size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-delete-draft-icon"
                                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                                    title="Discard this draft"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          const patient = item.patient;
                          const initials = patient.patientName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase();
                          const latest = patient.latestReferral;

                          return (
                            <div key={patient.patientName} className="patient-card-box">
                              <div className="patient-card-top">
                                <div className="patient-card-identity">
                                  <div className="patient-avatar-subtle">
                                    {initials}
                                  </div>
                                  <div>
                                    <h4 className="patient-card-name">{patient.patientName}</h4>
                                    <span className="patient-card-sub">
                                      {patient.gender !== 'Not specified' ? patient.gender : 'Patient'} • {patient.dob !== 'Not specified' ? patient.dob : 'DOB on file'}
                                    </span>
                                  </div>
                                </div>
                                {latest && (
                                  <span className={`status-pill ${getStatusClass(latest.status)}`}>
                                    {latest.status}
                                  </span>
                                )}
                              </div>

                              <div className="patient-card-details">
                                <div className="patient-detail-row">
                                  <Activity size={14} color="#0D9488" />
                                  <span className="font-medium text-slate-800">{latest?.service || 'Consultation'}</span>
                                </div>
                                <div className="patient-detail-row text-muted">
                                  <Building2 size={13} />
                                  <span>{latest?.provider || 'Diagnostic Facility'}</span>
                                </div>
                                <div className="patient-detail-row text-muted">
                                  <Clock size={13} />
                                  <span>{latest?.date || 'Recent'}</span>
                                </div>
                              </div>

                              <div className="patient-card-footer">
                                {latest && (
                                  <button
                                    type="button"
                                    className="btn-patient-view-requisition"
                                    onClick={() => setSelectedRequisitionReferral(latest)}
                                  >
                                    <FileText size={14} />
                                    <span>Requisition</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn-patient-new-referral"
                                  onClick={() =>
                                    handleNewReferralForPatient({
                                      name: patient.patientName,
                                      email: patient.email,
                                      phone: patient.phone,
                                      gender: patient.gender,
                                      dob: patient.dob,
                                      address: patient.address,
                                    })
                                  }
                                >
                                  <Plus size={14} />
                                  <span>Refer Again</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right-aligned Pagination for Cards View */}
                      {allVisiblePatientItems.length > 0 && (
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                          <Pagination
                            currentPage={patientCurrentPage}
                            totalItems={allVisiblePatientItems.length}
                            pageSize={patientPageSize}
                            onPageChange={setPatientCurrentPage}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty state for cards */}
                  {allVisiblePatientItems.length === 0 && (
                    <div className="patients-global-empty-state">
                      <Users size={36} color="#94A3B8" />
                      <h3>No records match your criteria</h3>
                      <p>Try searching for another name or reset your filter.</p>
                      <button
                        type="button"
                        className="btn-create-referral btn-small"
                        onClick={() => {
                          setPatientSearchQuery('');
                          setPatientTabFilter('all');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. PAYMENTS TAB VIEW */}
        {activeTab === 'payments' && (
          <PaymentsView
            user={user}
            onAddToast={onAddToast}
            onOpenNewReferral={() => {
              setActiveTab('referrals');
              setModalStep('choose-type');
            }}
          />
        )}

        {/* 6. REPORTS TAB VIEW */}
        {activeTab === 'reports' && (
          <ReportsView
            user={user}
            onAddToast={onAddToast}
          />
        )}

        {/* OTHER TABS FALLBACK */}
        {activeTab !== 'overview' && activeTab !== 'referrals' && activeTab !== 'calendar' && activeTab !== 'patients' && activeTab !== 'payments' && activeTab !== 'reports' && (
          <div className="clinician-body">
            <div className="empty-referral-state">
              <h2 className="empty-state-heading" style={{ textTransform: 'capitalize' }}>
                {activeTab} Module
              </h2>
              <p className="empty-state-desc">
                This section is configured and ready for service connection.
              </p>
              <button
                type="button"
                className="btn-create-referral"
                onClick={() => handleTabChange('referrals')}
              >
                Go to Referrals
              </button>
            </div>
          </div>
        )}

        {/* Mobile Quick Action Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            className={`mobile-bottom-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-item ${activeTab === 'referrals' ? 'active' : ''}`}
            onClick={() => handleTabChange('referrals')}
          >
            <ClipboardList size={20} />
            <span>Referrals</span>
          </button>
          <button
            type="button"
            className="mobile-bottom-create-btn"
            onClick={() => {
              handleTabChange('referrals');
              setModalStep('choose-type');
            }}
            title="Create Referral"
            aria-label="Create Referral"
          >
            <Plus size={22} />
          </button>
          <button
            type="button"
            className={`mobile-bottom-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => handleTabChange('support')}
          >
            <Headphones size={20} />
            <span>Support</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* ======================================================================
          END-TO-END MODAL FLOW (WITH BLURRED OVERLAY)
          ====================================================================== */}

      {/* MODAL 0: CHOOSE PATIENT TYPE (EXISTING PATIENT VS NEW PATIENT OR RESUME DRAFT) */}
      {modalStep === 'choose-type' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-card-resq referral-type-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="resq-modal-header-redesigned referral-type-modal-header">
              <div className="referral-type-header-row">
                <div className="modal-header-headline-block">
                  <h3 className="modal-headline-title">Create Referral</h3>
                  <p className="modal-headline-subtitle">
                    Choose how you would like to begin or continue your referral.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-pink-btn"
                  onClick={closeModal}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Single Sleek, Non-Clumsy Saved Drafts Bar */}
            {savedDrafts.length > 0 && (
              <div className="saved-drafts-sleek-bar">
                <div className="drafts-sleek-left">
                  <div className="drafts-sleek-icon">
                    <FolderClock size={16} />
                  </div>
                  <div className="drafts-sleek-info">
                    <div className="drafts-sleek-title-row">
                      <span className="drafts-sleek-title">Saved Referral Drafts</span>
                      <span className="drafts-sleek-badge">{savedDrafts.length} saved</span>
                    </div>
                    <span className="drafts-sleek-recent">
                      Recent: <strong>{savedDrafts[0].formData.fullName || 'Unnamed Patient'}</strong> • {savedDrafts[0].formData.scanType || 'Scan order'} ({savedDrafts[0].savedAtDisplay})
                    </span>
                  </div>
                </div>

                <div className="drafts-sleek-actions">
                  <button
                    type="button"
                    className="btn-drafts-resume-pill"
                    onClick={() => handleResumeDraft(savedDrafts[0])}
                    title="Quick resume most recent draft"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    className="btn-drafts-view-all-pill"
                    onClick={() => setModalStep('choose-draft')}
                    title="View and select from all saved drafts"
                  >
                    <span>Show all ({savedDrafts.length})</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            <div className="referral-type-modal-container">
              {/* Option 1: Existing Patient */}
              <button
                type="button"
                className="referral-type-option option-existing"
                onClick={() => handleSelectType('existing')}
              >
                <h4 className="type-title">Existing Patient</h4>
                <p className="type-desc">
                  Streamline the booking process by selecting from patients you have previously managed.
                </p>
              </button>

              {/* Option 2: New Patient */}
              <button
                type="button"
                className="referral-type-option option-new"
                onClick={() => handleSelectType('new')}
              >
                <h4 className="type-title">New Patient</h4>
                <p className="type-desc">
                  Select this option to input details for a new patient and set up their first appointment.
                </p>
              </button>
            </div>

            {/* Mobile-Friendly Dismissal Bar */}
            <div className="referral-modal-mobile-bottom-actions">
              <button
                type="button"
                className="btn-referral-cancel-mobile"
                onClick={closeModal}
              >
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED MODAL: CHOOSE FROM SAVED DRAFTS (CLICK TO SHOW ALL & SELECT WHO YOU WANT) */}
      {modalStep === 'choose-draft' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-card-resq saved-drafts-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="resq-modal-header-redesigned">
              <div className="modal-header-top-nav">
                <button
                  type="button"
                  className="modal-nav-back-pill"
                  onClick={handleModalBack}
                  title="Back to referral options"
                >
                  <ArrowLeft size={14} />
                  <span>Back to options</span>
                </button>
                <span className="drafts-count-badge" style={{ fontSize: '12px', padding: '3px 10px' }}>
                  {savedDrafts.length} saved drafts
                </span>
                <button
                  type="button"
                  className="modal-close-pink-btn"
                  onClick={closeModal}
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="modal-header-headline-block">
                <h3 className="modal-headline-title">Saved Referral Drafts</h3>
                <p className="modal-headline-subtitle">
                  Click any draft to select and resume the referral, or remove drafts you no longer need.
                </p>
              </div>
            </div>

            {/* Search bar */}
            <div className="draft-search-box-large">
              <Search size={16} className="draft-search-icon" />
              <input
                type="text"
                placeholder="Search by patient name, scan modality, body part, or date..."
                value={draftSearchQuery}
                onChange={(e) => setDraftSearchQuery(e.target.value)}
                className="draft-search-input-large"
                autoFocus
              />
              {draftSearchQuery && (
                <button
                  type="button"
                  className="draft-search-clear-btn"
                  onClick={() => setDraftSearchQuery('')}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Drafts count / filter summary */}
            <div className="drafts-filter-summary-bar">
              <span className="drafts-filter-summary-text">
                {draftSearchQuery
                  ? `Found ${filteredDrafts.length} of ${savedDrafts.length} saved drafts`
                  : `All Saved Drafts (${savedDrafts.length})`}
              </span>
              {draftSearchQuery && (
                <button
                  type="button"
                  className="btn-clear-filter-link"
                  onClick={() => setDraftSearchQuery('')}
                >
                  Show all
                </button>
              )}
            </div>

            {/* Drafts List */}
            <div className="drafts-modal-scroll-list">
              {filteredDrafts.length === 0 ? (
                <div className="drafts-empty-full-state">
                  <div className="empty-drafts-icon-wrap">
                    <FolderClock size={36} color="#94A3B8" />
                  </div>
                  <h4 style={{ margin: '12px 0 4px', color: '#06202E', fontSize: '15px' }}>
                    {draftSearchQuery ? 'No matching drafts found' : 'No saved drafts remaining'}
                  </h4>
                  <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '13px' }}>
                    {draftSearchQuery
                      ? `No drafts match "${draftSearchQuery}". Try searching another name or scan type.`
                      : 'All drafts have been completed or removed.'}
                  </p>
                  {draftSearchQuery ? (
                    <button
                      type="button"
                      className="btn-clear-search-action"
                      onClick={() => setDraftSearchQuery('')}
                    >
                      Clear search filter
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-resq-primary"
                      onClick={() => handleSelectType('new')}
                    >
                      Start a new referral
                    </button>
                  )}
                </div>
              ) : (
                filteredDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="draft-card-full-row"
                    onClick={() => handleResumeDraft(draft)}
                    title={`Click to select ${draft.formData.fullName || 'this patient'} and resume`}
                  >
                    <div className="draft-card-left">
                      <div className="draft-avatar-circle-lg">
                        {getInitial(draft.formData.fullName, draft.formData.email)}
                      </div>
                      <div className="draft-details-col">
                        <div className="draft-details-top">
                          <h4 className="draft-name-heading">
                            {draft.formData.fullName || 'Unnamed Patient Referral'}
                          </h4>
                          <span className="draft-step-pill">
                            {draft.step === 'scan-details' ? 'Step 2: Scan Details' : 'Step 1: Patient Info'}
                          </span>
                          <span className="draft-workflow-pill">
                            {draft.workflowType === 'existing' ? 'Existing Patient' : 'New Patient'}
                          </span>
                        </div>

                        <div className="draft-details-meta">
                          <span className="draft-scan-badge">
                            {draft.formData.scanType || 'Scan'}
                            {draft.formData.bodyPart ? ` • ${draft.formData.bodyPart}` : ''}
                          </span>
                          {draft.formData.email && (
                            <>
                              <span className="draft-dot">•</span>
                              <span className="draft-contact-text">{draft.formData.email}</span>
                            </>
                          )}
                          {draft.formData.phone && (
                            <>
                              <span className="draft-dot">•</span>
                              <span className="draft-contact-text">{draft.formData.phone}</span>
                            </>
                          )}
                        </div>

                        {draft.formData.clinicalNote && (
                          <div className="draft-note-snippet">
                            <span className="draft-note-label">Clinical Indication:</span> {draft.formData.clinicalNote}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="draft-card-right" onClick={(e) => e.stopPropagation()}>
                      <div className="draft-timestamp-col">
                        <span className="draft-time-saved">
                          <Clock size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                          {draft.savedAtDisplay}
                        </span>
                      </div>
                      <div className="draft-actions-group">
                        <button
                          type="button"
                          className="btn-select-draft-action"
                          onClick={() => handleResumeDraft(draft)}
                          title="Select and resume draft"
                        >
                          <span>Select & Resume</span>
                          <ArrowRight size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-delete-draft-action"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          title="Delete draft"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="resq-modal-footer-between" style={{ marginTop: '22px' }}>
              <button
                type="button"
                className="btn-resq-back"
                onClick={handleModalBack}
                title="Back to referral options"
              >
                <ArrowLeft size={15} />
                <span>Back to options</span>
              </button>
              <button
                type="button"
                className="btn-resq-fresh-referral"
                onClick={() => handleSelectType('new')}
                title="Start a fresh referral"
              >
                <Plus size={15} />
                <span>Start fresh referral instead</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CHOOSE AN EXISTING PATIENT */}
      {modalStep === 'choose-existing' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card-resq" onClick={(e) => e.stopPropagation()}>
            <div className="resq-modal-header-redesigned">
              <div className="modal-header-top-nav">
                <button
                  type="button"
                  className="modal-nav-back-pill"
                  onClick={handleModalBack}
                  title="Back to referral options"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <div className="modal-step-badge-indicator">
                  <span className="step-number-badge">Step 1 of 3</span>
                  <span className="step-pct-pill">Patient Select</span>
                </div>
                <button
                  type="button"
                  className="modal-close-pink-btn"
                  onClick={closeModal}
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="modal-header-headline-block">
                <h3 className="modal-headline-title">Choose an Existing Patient</h3>
                <p className="modal-headline-subtitle">
                  Select an existing patient you have previously managed to auto-fill their details.
                </p>
              </div>
            </div>

            {/* Stepper Progress Bar (Step 1: Patient Selection) */}
            <ReferralProgressBar currentStep={1} onStepClick={handleStepJump} />

            {/* Search bar */}
            <div className="existing-search-box">
              <Search size={18} className="existing-search-icon" />
              <input
                type="text"
                placeholder="Search by name or email"
                value={existingSearchQuery}
                onChange={(e) => setExistingSearchQuery(e.target.value)}
                className="existing-search-input"
                autoFocus
              />
            </div>

            {/* Dashed patient list table */}
            <div className="existing-patient-table-card">
              <div className="patient-table-header">
                <span className="th-name">Name</span>
                <span className="th-created">Created</span>
              </div>

              {filteredExistingPatients.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#586A73', fontSize: '13.5px' }}>
                  No existing patients found matching "{existingSearchQuery}"
                </div>
              ) : (
                filteredExistingPatients.map((p) => {
                  const isSelected = selectedPatientId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`patient-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectExistingPatient(p)}
                    >
                      <div className="patient-item-left">
                        <div className="patient-avatar-ao">
                          {p.initials}
                        </div>
                        <div className="patient-name-email">
                          <span className="patient-row-name">{p.name}</span>
                          <span className="patient-row-email">{p.email}</span>
                        </div>
                      </div>

                      <div className="patient-item-right">
                        <div className="patient-created-rel">{p.createdRelative}</div>
                        <div className="patient-created-date">{p.createdDate}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Back button */}
            <div className="resq-modal-footer-between" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="btn-resq-back"
                onClick={handleModalBack}
              >
                <ArrowLeft size={15} />
                <span>Back to Options</span>
              </button>
              <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                Select a patient to proceed to Scan Details
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PATIENT INFORMATION (PAGE 1 OF 2 - Images 4 & earlier) */}
      {modalStep === 'patient-info' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card-resq" onClick={(e) => e.stopPropagation()}>
            <div className="resq-modal-header-redesigned">
              <div className="modal-header-top-nav">
                <button
                  type="button"
                  className="modal-nav-back-pill"
                  onClick={handleModalBack}
                  title="Back to referral options"
                >
                  <ArrowLeft size={14} />
                  <span>Back to options</span>
                </button>

                <div className="modal-step-badge-indicator">
                  <span className="step-number-badge">Step 1 of 3</span>
                  <span className="step-pct-pill">33% Completed</span>
                </div>

                <button
                  type="button"
                  className="modal-close-pink-btn"
                  onClick={closeModal}
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="modal-header-headline-block">
                <h3 className="modal-headline-title">Patient Information</h3>
                <p className="modal-headline-subtitle">
                  These personal details will be used for the clinical referral sent to the diagnostic center.
                </p>
              </div>
            </div>

            {/* Stepper Progress Bar (Step 1: Patient Information) */}
            <ReferralProgressBar currentStep={1} onStepClick={handleStepJump} />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (patientWorkflowType === 'new' && !existingPatientFound) {
                  setFormData((prev) => ({
                    ...prev,
                    fullName: newUserForm.fullName.trim(),
                    gender: newUserForm.gender || 'Male',
                    dob: newUserForm.dob.trim(),
                    email: newUserForm.email.trim(),
                    phone: newUserForm.phone.trim(),
                    address: newUserForm.address.trim(),
                  }));
                }
                setModalStep('scan-details');
              }}
            >
              {patientWorkflowType === 'new' ? (
                <>
                  {/* Accordion 1: Existing Users */}
                  <div className="patient-accordion-item">
                    <div
                      className="patient-accordion-header"
                      onClick={() => setIsExistingAccordionOpen(!isExistingAccordionOpen)}
                    >
                      <span className="patient-accordion-pill">Existing Users</span>
                      <span className="patient-accordion-chevron">
                        {isExistingAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                    <p className="patient-accordion-subtext">
                      Search database to auto-fill user's personal information
                    </p>

                    {isExistingAccordionOpen && (
                      <div className="patient-accordion-content">
                        <div className="resq-form-group" style={{ marginBottom: existingPatientFound ? '14px' : 0 }}>
                          <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                            Email Address
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="email"
                              placeholder="e.g. 1ieuj83trq@yzcalo.com"
                              value={existingUserLookupEmail}
                              onChange={(e) => handleExistingEmailLookup(e.target.value)}
                              onBlur={(e) => handleExistingEmailLookup(e.target.value)}
                              className="resq-input-boxed"
                              style={{ paddingRight: existingUserLookupEmail ? '36px' : '14px' }}
                            />
                            {existingUserLookupEmail && (
                              <button
                                type="button"
                                onClick={handleClearExistingLookup}
                                style={{
                                  position: 'absolute',
                                  right: '10px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#94A3B8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '4px',
                                }}
                                title="Clear search"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                          {isLookingUpPatient && (
                            <p style={{ fontSize: '12px', color: '#4F46E5', marginTop: '6px', fontWeight: 500 }}>
                              🔍 Searching database for registered patient...
                            </p>
                          )}
                          {patientLookupStatus && !existingPatientFound && (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#F8FAFC',
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                              }}
                            >
                              <span>ℹ</span>
                              <span>{patientLookupStatus.message}</span>
                            </div>
                          )}
                        </div>

                        {/* AUTO-POPULATED EXISTING PATIENT DETAILS (In Existing Users Section Only) */}
                        {existingPatientFound && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '16px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '14px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingBottom: '12px',
                                borderBottom: '1px solid #E2E8F0',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#0F766E',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                  }}
                                >
                                  {getInitial(formData.fullName, formData.email)}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                                      {formData.fullName}
                                    </h4>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: '9999px',
                                        backgroundColor: '#ECFDF5',
                                        color: '#059669',
                                        border: '1px solid #A7F3D0',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <span>✓</span> ResQ Registered Patient
                                    </span>
                                  </div>
                                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                                    Verified patient details auto-populated from ResQ database
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleClearExistingLookup}
                                style={{
                                  background: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  color: '#64748B',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                              >
                                Clear
                              </button>
                            </div>

                            {/* Full Name */}
                            <div className="resq-form-group" style={{ marginBottom: 0 }}>
                              <label className="resq-form-label" style={{ fontSize: '12px', fontWeight: 500 }}>
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={formData.fullName}
                                readOnly={isFieldAutoPopulated('fullName')}
                                disabled={isFieldAutoPopulated('fullName')}
                                tabIndex={isFieldAutoPopulated('fullName') ? -1 : undefined}
                                onChange={(e) => {
                                  if (!isFieldAutoPopulated('fullName')) {
                                    setFormData({ ...formData, fullName: e.target.value });
                                  }
                                }}
                                className={`resq-input-boxed ${isFieldAutoPopulated('fullName') ? 'resq-field-immutable' : ''}`}
                                style={isFieldAutoPopulated('fullName') ? undefined : { backgroundColor: '#FFFFFF' }}
                                required
                              />
                            </div>

                            {/* Gender & Date of Birth */}
                            <div className="resq-form-row-2col">
                              <div className="resq-form-group" style={{ marginBottom: 0 }}>
                                <label className="resq-form-label" style={{ fontSize: '12px', fontWeight: 500 }}>
                                  Gender
                                </label>
                                <div className={`resq-input-wrapper ${isFieldAutoPopulated('gender') ? 'is-immutable' : ''}`}>
                                  <select
                                    value={formData.gender}
                                    disabled={isFieldAutoPopulated('gender')}
                                    tabIndex={isFieldAutoPopulated('gender') ? -1 : undefined}
                                    onChange={(e) => {
                                      if (!isFieldAutoPopulated('gender')) {
                                        setFormData({ ...formData, gender: e.target.value });
                                      }
                                    }}
                                    className={`resq-select-boxed ${isFieldAutoPopulated('gender') ? 'resq-field-immutable' : ''}`}
                                    style={isFieldAutoPopulated('gender') ? undefined : { backgroundColor: '#FFFFFF' }}
                                  >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                  </select>
                                  <ChevronsUpDown size={15} className="resq-select-chevron" />
                                </div>
                              </div>

                              <div className="resq-form-group" style={{ marginBottom: 0 }}>
                                <label className="resq-form-label" style={{ fontSize: '12px', fontWeight: 500 }}>
                                  Date of Birth
                                </label>
                                <div className={`resq-input-wrapper ${isFieldAutoPopulated('dob') ? 'is-immutable' : ''}`}>
                                  <input
                                    type="text"
                                    value={formData.dob}
                                    readOnly={isFieldAutoPopulated('dob')}
                                    disabled={isFieldAutoPopulated('dob')}
                                    tabIndex={isFieldAutoPopulated('dob') ? -1 : undefined}
                                    onChange={(e) => {
                                      if (!isFieldAutoPopulated('dob')) {
                                        setFormData({ ...formData, dob: e.target.value });
                                      }
                                    }}
                                    className={`resq-input-boxed ${isFieldAutoPopulated('dob') ? 'resq-field-immutable' : ''}`}
                                    style={isFieldAutoPopulated('dob') ? undefined : { backgroundColor: '#FFFFFF' }}
                                  />
                                  <Calendar size={16} className="resq-date-icon" />
                                </div>
                              </div>
                            </div>

                            {/* Email & Phone */}
                            <div className="resq-form-row-2col">
                              <div className="resq-form-group" style={{ marginBottom: 0 }}>
                                <label className="resq-form-label" style={{ fontSize: '12px', fontWeight: 500 }}>
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  value={formData.email}
                                  readOnly={isFieldAutoPopulated('email')}
                                  disabled={isFieldAutoPopulated('email')}
                                  tabIndex={isFieldAutoPopulated('email') ? -1 : undefined}
                                  onChange={(e) => {
                                    if (!isFieldAutoPopulated('email')) {
                                      setFormData({ ...formData, email: e.target.value });
                                    }
                                  }}
                                  className={`resq-input-boxed ${isFieldAutoPopulated('email') ? 'resq-field-immutable' : ''}`}
                                  style={isFieldAutoPopulated('email') ? undefined : { backgroundColor: '#FFFFFF' }}
                                />
                              </div>

                              <div className="resq-form-group" style={{ marginBottom: 0 }}>
                                <label className="resq-form-label" style={{ fontSize: '12px', fontWeight: 500 }}>
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  value={formData.phone}
                                  readOnly={isFieldAutoPopulated('phone')}
                                  disabled={isFieldAutoPopulated('phone')}
                                  tabIndex={isFieldAutoPopulated('phone') ? -1 : undefined}
                                  onChange={(e) => {
                                    if (!isFieldAutoPopulated('phone')) {
                                      setFormData({ ...formData, phone: e.target.value });
                                    }
                                  }}
                                  className={`resq-input-boxed ${isFieldAutoPopulated('phone') ? 'resq-field-immutable' : ''}`}
                                  style={isFieldAutoPopulated('phone') ? undefined : { backgroundColor: '#FFFFFF' }}
                                />
                              </div>
                            </div>

                            {/* Address */}
                            <div className="resq-form-group" style={{ marginBottom: 0 }}>
                              <label className="resq-form-label" style={{ fontSize: '12px', fontWeight: 500 }}>
                                Residential Address
                              </label>
                              <div className="new-user-textarea-wrapper">
                                <textarea
                                  maxLength={240}
                                  value={formData.address}
                                  readOnly={isFieldAutoPopulated('address')}
                                  disabled={isFieldAutoPopulated('address')}
                                  tabIndex={isFieldAutoPopulated('address') ? -1 : undefined}
                                  onChange={(e) => {
                                    if (!isFieldAutoPopulated('address')) {
                                      setFormData({ ...formData, address: e.target.value });
                                    }
                                  }}
                                  className={`new-user-textarea ${isFieldAutoPopulated('address') ? 'resq-field-immutable' : ''}`}
                                  style={{
                                    ...(isFieldAutoPopulated('address') ? {} : { backgroundColor: '#FFFFFF' }),
                                    resize: isFieldAutoPopulated('address') ? 'none' : 'vertical',
                                  }}
                                />
                                <span className="new-user-char-count" style={isFieldAutoPopulated('address') ? { color: '#94A3B8' } : undefined}>
                                  {formData.address.length}/240
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Accordion 2: New User */}
                  <div className="patient-accordion-item">
                    <div
                      className="patient-accordion-header"
                      onClick={() => setIsNewUserAccordionOpen(!isNewUserAccordionOpen)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="patient-accordion-pill">New User</span>
                        {existingPatientFound && (
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                            (Optional — using existing user above)
                          </span>
                        )}
                      </div>
                      <span className="patient-accordion-chevron">
                        {isNewUserAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                    <p className="patient-accordion-subtext">
                      New referring patient that are not ResQ users
                    </p>

                    {isNewUserAccordionOpen && (
                      <div className="patient-accordion-content">
                        {/* Full Name */}
                        <div className="resq-form-group">
                          <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                            Full Name
                          </label>
                          <input
                            type="text"
                            placeholder="Enter Full Name"
                            value={newUserForm.fullName}
                            onChange={(e) => {
                              if (existingPatientFound) setExistingPatientFound(false);
                              setNewUserForm((prev) => ({ ...prev, fullName: e.target.value }));
                            }}
                            className="resq-input-boxed"
                            required={isNewUserAccordionOpen && !existingPatientFound}
                          />
                        </div>

                        {/* Gender & Date of Birth */}
                        <div className="resq-form-row-2col">
                          <div className="resq-form-group" style={{ marginBottom: 0 }}>
                            <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                              Gender
                            </label>
                            <div className="resq-input-wrapper">
                              <select
                                value={newUserForm.gender}
                                onChange={(e) => {
                                  if (existingPatientFound) setExistingPatientFound(false);
                                  setNewUserForm((prev) => ({ ...prev, gender: e.target.value }));
                                }}
                                className="resq-select-boxed"
                              >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                              <ChevronsUpDown size={15} className="resq-select-chevron" />
                            </div>
                          </div>

                          <div className="resq-form-group" style={{ marginBottom: 0 }}>
                            <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                              Date of Birth
                            </label>
                            <div className="resq-input-wrapper">
                              <input
                                type="text"
                                placeholder="00/00/0000"
                                value={newUserForm.dob}
                                onChange={(e) => {
                                  if (existingPatientFound) setExistingPatientFound(false);
                                  setNewUserForm((prev) => ({ ...prev, dob: e.target.value }));
                                }}
                                className="resq-input-boxed"
                              />
                              <Calendar size={16} className="resq-date-icon" />
                            </div>
                          </div>
                        </div>

                        {/* Email & Phone Number */}
                        <div className="resq-form-row-2col">
                          <div className="resq-form-group" style={{ marginBottom: 0 }}>
                            <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                              Email
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. newpatient@mail.com"
                              value={newUserForm.email}
                              onChange={(e) => {
                                if (existingPatientFound) setExistingPatientFound(false);
                                setNewUserForm((prev) => ({ ...prev, email: e.target.value }));
                              }}
                              className="resq-input-boxed"
                            />
                          </div>

                          <div className="resq-form-group" style={{ marginBottom: 0 }}>
                            <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              placeholder="0801 234 5678"
                              value={newUserForm.phone}
                              onChange={(e) => {
                                if (existingPatientFound) setExistingPatientFound(false);
                                setNewUserForm((prev) => ({ ...prev, phone: e.target.value }));
                              }}
                              className="resq-input-boxed"
                            />
                          </div>
                        </div>

                        {/* Address */}
                        <div className="resq-form-group">
                          <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                            Address
                          </label>
                          <div className="new-user-textarea-wrapper">
                            <textarea
                              maxLength={240}
                              placeholder="Input text field here (optional)"
                              value={newUserForm.address}
                              onChange={(e) => {
                                if (existingPatientFound) setExistingPatientFound(false);
                                setNewUserForm((prev) => ({ ...prev, address: e.target.value }));
                              }}
                              className="new-user-textarea"
                            />
                            <span className="new-user-char-count">
                              {newUserForm.address.length}/240
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer buttons with Back, Save Draft, and Proceed */}
                  <div className="resq-modal-footer-between">
                    <div className="footer-left-actions">
                      <button
                        type="button"
                        className="btn-resq-back"
                        onClick={handleModalBack}
                      >
                        <ArrowLeft size={15} />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        className="btn-resq-save-draft"
                        onClick={handleSaveDraft}
                        title="Save referral draft"
                      >
                        <Bookmark size={15} />
                        <span>Save draft</span>
                      </button>
                      {activeDraftId && (
                        <button
                          type="button"
                          className="btn-resq-delete-draft"
                          onClick={() => {
                            handleDeleteDraft(activeDraftId);
                            closeModal();
                          }}
                          title="Delete referral draft"
                        >
                          <Trash2 size={15} />
                          <span>Delete draft</span>
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="btn-resq-proceed"
                      disabled={existingPatientFound ? !formData.fullName.trim() : !newUserForm.fullName.trim()}
                    >
                      <span>Next: Scan Details</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </>
              ) : (
                /* Existing Patient Workflow Form */
                <>
                  {/* Full Name */}
                  <div className="resq-form-group">
                    <label className="resq-form-label">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Anthony Odafe"
                      value={formData.fullName}
                      readOnly={isFieldAutoPopulated('fullName')}
                      disabled={isFieldAutoPopulated('fullName')}
                      tabIndex={isFieldAutoPopulated('fullName') ? -1 : undefined}
                      onChange={(e) => {
                        if (!isFieldAutoPopulated('fullName')) {
                          setFormData({ ...formData, fullName: e.target.value });
                        }
                      }}
                      className={`resq-input-boxed ${isFieldAutoPopulated('fullName') ? 'resq-field-immutable' : ''}`}
                    />
                  </div>

                  {/* Gender & Date of Birth */}
                  <div className="resq-form-row-2col">
                    <div className="resq-form-group" style={{ marginBottom: 0 }}>
                      <label className="resq-form-label">Gender</label>
                      <div className={`resq-input-wrapper ${isFieldAutoPopulated('gender') ? 'is-immutable' : ''}`}>
                        <select
                          value={formData.gender}
                          disabled={isFieldAutoPopulated('gender')}
                          tabIndex={isFieldAutoPopulated('gender') ? -1 : undefined}
                          onChange={(e) => {
                            if (!isFieldAutoPopulated('gender')) {
                              setFormData({ ...formData, gender: e.target.value });
                            }
                          }}
                          className={`resq-select-boxed ${isFieldAutoPopulated('gender') ? 'resq-field-immutable' : ''}`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronsUpDown size={16} className="resq-select-chevron" />
                      </div>
                    </div>

                    <div className="resq-form-group" style={{ marginBottom: 0 }}>
                      <label className="resq-form-label">Date of Birth</label>
                      <div className={`resq-input-wrapper ${isFieldAutoPopulated('dob') ? 'is-immutable' : ''}`}>
                        <input
                          type="text"
                          placeholder="10/01/1980"
                          value={formData.dob}
                          readOnly={isFieldAutoPopulated('dob')}
                          disabled={isFieldAutoPopulated('dob')}
                          tabIndex={isFieldAutoPopulated('dob') ? -1 : undefined}
                          onChange={(e) => {
                            if (!isFieldAutoPopulated('dob')) {
                              setFormData({ ...formData, dob: e.target.value });
                            }
                          }}
                          className={`resq-input-boxed ${isFieldAutoPopulated('dob') ? 'resq-field-immutable' : ''}`}
                        />
                        <Calendar size={18} className="resq-date-icon" />
                      </div>
                    </div>
                  </div>

                  {/* Email & Phone Number */}
                  <div className="resq-form-row-2col">
                    <div className="resq-form-group" style={{ marginBottom: 0 }}>
                      <label className="resq-form-label">Email</label>
                      <input
                        type="email"
                        placeholder="yourname@mail.com"
                        value={formData.email}
                        readOnly={isFieldAutoPopulated('email')}
                        disabled={isFieldAutoPopulated('email')}
                        tabIndex={isFieldAutoPopulated('email') ? -1 : undefined}
                        onChange={(e) => {
                          if (!isFieldAutoPopulated('email')) {
                            setFormData({ ...formData, email: e.target.value });
                          }
                        }}
                        className={`resq-input-boxed ${isFieldAutoPopulated('email') ? 'resq-field-immutable' : ''}`}
                      />
                    </div>

                    <div className="resq-form-group" style={{ marginBottom: 0 }}>
                      <label className="resq-form-label">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="0801 234 5678"
                        value={formData.phone}
                        readOnly={isFieldAutoPopulated('phone')}
                        disabled={isFieldAutoPopulated('phone')}
                        tabIndex={isFieldAutoPopulated('phone') ? -1 : undefined}
                        onChange={(e) => {
                          if (!isFieldAutoPopulated('phone')) {
                            setFormData({ ...formData, phone: e.target.value });
                          }
                        }}
                        className={`resq-input-boxed ${isFieldAutoPopulated('phone') ? 'resq-field-immutable' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="resq-form-group">
                    <label className="resq-form-label">Address</label>
                    <input
                      type="text"
                      placeholder="Letmauck Cantoment, Mokola, Ibadan"
                      value={formData.address}
                      readOnly={isFieldAutoPopulated('address')}
                      disabled={isFieldAutoPopulated('address')}
                      tabIndex={isFieldAutoPopulated('address') ? -1 : undefined}
                      onChange={(e) => {
                        if (!isFieldAutoPopulated('address')) {
                          setFormData({ ...formData, address: e.target.value });
                        }
                      }}
                      className={`resq-input-boxed ${isFieldAutoPopulated('address') ? 'resq-field-immutable' : ''}`}
                    />
                  </div>

                  {/* Footer buttons */}
                  <div className="resq-modal-footer-between">
                    <div className="footer-left-actions">
                      <button
                        type="button"
                        className="btn-resq-back"
                        onClick={handleModalBack}
                      >
                        <ArrowLeft size={15} />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        className="btn-resq-save-draft"
                        onClick={handleSaveDraft}
                        title="Save referral draft"
                      >
                        <Bookmark size={15} />
                        <span>Save draft</span>
                      </button>
                      {activeDraftId && (
                        <button
                          type="button"
                          className="btn-resq-delete-draft"
                          onClick={() => {
                            handleDeleteDraft(activeDraftId);
                            closeModal();
                          }}
                          title="Delete referral draft"
                        >
                          <Trash2 size={15} />
                          <span>Delete draft</span>
                        </button>
                      )}
                    </div>
                    <button type="submit" className="btn-resq-proceed">
                      <span>Next: Scan Details</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SCAN DETAILS (PAGE 2 OF 2 - Images 5 & earlier) */}
      {modalStep === 'scan-details' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card-resq" onClick={(e) => e.stopPropagation()}>
            <div className="resq-modal-header-redesigned">
              <div className="modal-header-top-nav">
                <button
                  type="button"
                  className="modal-nav-back-pill"
                  onClick={handleModalBack}
                  title="Back to Step 1: Patient Information"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Step 1</span>
                </button>

                <div className="modal-step-badge-indicator">
                  <span className="step-number-badge">Step 2 of 3</span>
                  <span className="step-pct-pill">66% Completed</span>
                </div>

                <button
                  type="button"
                  className="modal-close-pink-btn"
                  onClick={closeModal}
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="modal-header-headline-block">
                <h3 className="modal-headline-title">Scan Details</h3>
                <p className="modal-headline-subtitle">
                  Specify the imaging modality, anatomical region, and relevant clinical indications.
                </p>
              </div>
            </div>

            {/* Stepper Progress Bar (Step 2: Scan Details) */}
            <ReferralProgressBar currentStep={2} onStepClick={handleStepJump} />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const errors: { scanType?: string; bodyPart?: string; contrastOption?: string } = {};
                if (!formData.scanType?.trim()) {
                  errors.scanType = 'Scan type is required to proceed';
                }
                if (!formData.bodyPart?.trim()) {
                  errors.bodyPart = 'Body part is required to proceed';
                }
                if (!formData.contrastOption?.trim()) {
                  errors.contrastOption = 'Contrast option is required to proceed';
                }
                if (Object.keys(errors).length > 0) {
                  setScanErrors(errors);
                  return;
                }
                setScanErrors({});
                if (patientWorkflowType === 'new') {
                  closeModal();
                  setDashboardView('referral-review');
                } else {
                  setModalStep('scan-location');
                }
              }}
            >
              {Object.keys(scanErrors).length > 0 && (
                <div className="resq-scan-validation-alert">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>Please fill in all required fields (Scan Type, Body Part, and Contrast) before proceeding.</span>
                </div>
              )}

              {/* Scan Type */}
              <div className="resq-form-group">
                <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                  Scan Type <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="resq-input-wrapper">
                  <select
                    value={formData.scanType}
                    onChange={(e) => {
                      setFormData({ ...formData, scanType: e.target.value });
                      if (scanErrors.scanType) setScanErrors((prev) => ({ ...prev, scanType: '' }));
                    }}
                    className={`resq-select-boxed ${scanErrors.scanType ? 'is-error' : ''}`}
                  >
                    <option value="">Select scan type</option>
                    {catalogScanTypes.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronsUpDown size={15} className="resq-select-chevron" />
                </div>
                {scanErrors.scanType && (
                  <p className="resq-field-error-msg">
                    <AlertCircle size={12} />
                    <span>{scanErrors.scanType}</span>
                  </p>
                )}
              </div>

              {/* Body Part (Searchable Combobox) */}
              <div className="resq-form-group">
                <SearchableSelect
                  id="referral-modal-body-part"
                  label="Body Part"
                  labelClassName="resq-form-label"
                  required
                  error={scanErrors.bodyPart}
                  options={catalogBodyParts}
                  value={formData.bodyPart}
                  onChange={(val) => {
                    setFormData({ ...formData, bodyPart: val });
                    if (scanErrors.bodyPart) setScanErrors((prev) => ({ ...prev, bodyPart: '' }));
                  }}
                  placeholder="Select or search body part (e.g. Brain, Chest, Femur)..."
                  hint="Search and select from 67 anatomical targets"
                />
              </div>

              {/* Contrast Selection */}
              <div className="resq-form-group">
                <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                  Contrast Selection <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="resq-input-wrapper">
                  <select
                    value={formData.contrastOption || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, contrastOption: e.target.value });
                      if (scanErrors.contrastOption) setScanErrors((prev) => ({ ...prev, contrastOption: '' }));
                    }}
                    className={`resq-select-boxed ${scanErrors.contrastOption ? 'is-error' : ''}`}
                  >
                    <option value="">Select contrast option</option>
                    {catalogContrastOptions.map((co) => (
                      <option key={co} value={co}>
                        {co}
                      </option>
                    ))}
                  </select>
                  <ChevronsUpDown size={15} className="resq-select-chevron" />
                </div>
                {scanErrors.contrastOption && (
                  <p className="resq-field-error-msg">
                    <AlertCircle size={12} />
                    <span>{scanErrors.contrastOption}</span>
                  </p>
                )}
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
                  Select contrast protocol (with contrast, without contrast, or not specified)
                </p>
              </div>

              {/* Clinical Note */}
              <div className="resq-form-group">
                <div className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                  <span>Clinical Note</span>
                </div>
                <div className="new-user-textarea-wrapper">
                  <textarea
                    maxLength={2000}
                    placeholder="Input text field here (optional)"
                    value={formData.clinicalNote}
                    onChange={(e) => setFormData({ ...formData, clinicalNote: e.target.value })}
                    className="new-user-textarea"
                    style={{ minHeight: '90px' }}
                  />
                  <span className="new-user-char-count">
                    {formData.clinicalNote.length}/2000
                  </span>
                </div>
              </div>

              {/* File Upload Area matching Image 5 */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />

              <div
                className="new-user-upload-box"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText size={22} className="new-user-upload-icon" />
                <span className="new-user-upload-main">Click to upload</span>
                <span className="new-user-upload-hint">Supported formats: PDF, JPG, PNG</span>
                <span className="new-user-upload-hint">max 10MB</span>

                {uploadedFile && (
                  <div
                    className="resq-uploaded-file-card"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="resq-uploaded-file-name" title={uploadedFile.name}>
                      {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      className="resq-uploaded-file-remove"
                      onClick={() => setUploadedFile(null)}
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {patientWorkflowType === 'new' ? (
                /* New User footer actions with Save Draft option */
                <div className="resq-modal-footer-between">
                  <div className="footer-left-actions">
                    <button
                      type="button"
                      className="btn-resq-back"
                      onClick={handleModalBack}
                    >
                      <ArrowLeft size={15} />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      className="btn-resq-save-draft"
                      onClick={handleSaveDraft}
                      title="Save referral draft"
                    >
                      <Bookmark size={15} />
                      <span>Save draft</span>
                    </button>
                    {activeDraftId && (
                      <button
                        type="button"
                        className="btn-resq-delete-draft"
                        onClick={() => {
                          handleDeleteDraft(activeDraftId);
                          closeModal();
                        }}
                        title="Delete referral draft"
                      >
                        <Trash2 size={15} />
                        <span>Delete draft</span>
                      </button>
                    )}
                  </div>
                  <button type="submit" className="btn-resq-proceed">
                    <span>Next: Scan Location</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                /* Existing Patient footer actions with draft options */
                <div className="resq-modal-footer-between">
                  <div className="footer-left-actions">
                    <button
                      type="button"
                      className="btn-resq-back"
                      onClick={handleModalBack}
                    >
                      <ArrowLeft size={15} />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      className="btn-resq-save-draft"
                      onClick={handleSaveDraft}
                      title="Save referral draft"
                    >
                      <Bookmark size={15} />
                      <span>Save draft</span>
                    </button>
                    {activeDraftId && (
                      <button
                        type="button"
                        className="btn-resq-delete-draft"
                        onClick={() => {
                          handleDeleteDraft(activeDraftId);
                          closeModal();
                        }}
                        title="Delete referral draft"
                      >
                        <Trash2 size={15} />
                        <span>Delete draft</span>
                      </button>
                    )}
                  </div>
                  <button type="submit" className="btn-resq-proceed">
                    <span>Next: Scan Location</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: WHERE SHOULD THE PATIENT HAVE THE SCAN? (STEP 3 OF 3 REDESIGNED) */}
      {modalStep === 'scan-location' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card-resq scan-location-card-redesigned" onClick={(e) => e.stopPropagation()}>
            <div className="resq-modal-header-redesigned">
              <div className="modal-header-top-nav">
                <button
                  type="button"
                  className="modal-nav-back-pill"
                  onClick={handleModalBack}
                  title="Back to Step 2: Scan Details"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Step 2</span>
                </button>

                <div className="modal-step-badge-indicator">
                  <span className="step-number-badge">Step 3 of 3</span>
                  <span className="step-pct-pill">100% Completed</span>
                </div>

                <button
                  type="button"
                  className="modal-close-pink-btn"
                  onClick={closeModal}
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="modal-header-headline-block">
                <h3 className="modal-headline-title">Scan Location & Routing</h3>
                <p className="modal-headline-subtitle">
                  Choose whether to select an accredited imaging provider now or allow the patient to self-schedule.
                </p>
              </div>
            </div>

            {/* Stepper Progress Bar (Step 3: Scan Location) */}
            <ReferralProgressBar currentStep={3} onStepClick={handleStepJump} />

            {/* Patient & Scan Quick Summary Strip */}
            <div className="scan-location-summary-strip">
              <div className="summary-strip-left">
                <div className="summary-avatar-circle">
                  {getInitial(formData.fullName, formData.email)}
                </div>
                <div className="summary-text-col">
                  <div className="summary-patient-name-row">
                    <span className="summary-patient-name">{formData.fullName || 'Anthony Odafe'}</span>
                  </div>
                  <div className="summary-scan-pill-row">
                    <span className="summary-scan-pill">
                      {formData.scanType || 'MRI Scan'}{formData.bodyPart ? ` • ${formData.bodyPart}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="scan-location-headline-box">
              <h3 className="scan-location-headline">Where should the patient have the scan?</h3>
              <p className="scan-location-subheadline">
                Choose how this diagnostic referral should be scheduled and fulfilled.
              </p>
            </div>

            {/* Redesigned Option Cards */}
            <div className="location-options-container">
              {/* Option 1: Select a provider */}
              <div
                className={`location-card-modern ${scanLocationMode === 'provider' ? 'selected' : ''}`}
                onClick={() => setScanLocationMode('provider')}
                role="radio"
                aria-checked={scanLocationMode === 'provider'}
              >
                <div className="location-card-top">
                  <div className="location-card-icon-title">
                    <div className="location-card-icon-box provider-icon">
                      <Building2 size={20} />
                    </div>
                    <div className="location-card-text-block">
                      <div className="location-card-header-row">
                        <h4 className="location-card-heading">Select a provider</h4>
                        <span className="location-badge-pill clinician-badge">
                          <Check size={11} className="badge-check-icon" />
                          Clinician Choice
                        </span>
                      </div>
                      <p className="location-card-sub">
                        I want to choose a specific diagnostic clinic for this patient.
                      </p>
                    </div>
                  </div>

                  <div className="custom-radio-modern">
                    {scanLocationMode === 'provider' && <span className="custom-radio-modern-dot" />}
                  </div>
                </div>

                <div className="location-card-perks">
                  <div className="perk-item">
                    <Check size={14} className="perk-check-icon" />
                    <span>Compare vetted centers, diagnostic equipment, and live available slots</span>
                  </div>
                  <div className="perk-item">
                    <Check size={14} className="perk-check-icon" />
                    <span>Instant booking with transparent pricing & confirmed appointment time</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Let the patient choose (Upcoming - Non-clickable) */}
              <div
                className="location-card-modern upcoming-card"
                role="region"
                aria-disabled="true"
                tabIndex={-1}
              >
                <div className="location-card-top">
                  <div className="location-card-icon-title">
                    <div className="location-card-icon-box patient-icon" style={{ opacity: 0.75 }}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 className="location-card-heading" style={{ color: '#475569' }}>Let the patient choose</h4>
                        <span className="location-badge-pill patient-badge">Patient Scheduling</span>
                        <span className="location-badge-pill upcoming-badge">Upcoming</span>
                      </div>
                      <p className="location-card-sub" style={{ color: '#94A3B8' }}>
                        Patient will choose from suitable diagnostic centers near them.
                      </p>
                    </div>
                  </div>

                  <div className="upcoming-status-chip">
                    <span>Coming Soon</span>
                  </div>
                </div>

                <div className="location-card-perks" style={{ opacity: 0.75 }}>
                  <div className="perk-item">
                    <Check size={14} className="perk-check-icon" />
                    <span>Secure referral link sent via SMS, email & WhatsApp directly to patient</span>
                  </div>
                  <div className="perk-item">
                    <Check size={14} className="perk-check-icon" />
                    <span>Patient selects center according to their budget, proximity & schedule</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Back, Save Draft, and Proceed */}
            <div className="resq-modal-footer-between" style={{ marginTop: '22px' }}>
              <div className="footer-left-actions">
                <button
                  type="button"
                  className="btn-resq-back"
                  onClick={handleModalBack}
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="btn-resq-save-draft"
                  onClick={handleSaveDraft}
                  title="Save referral draft"
                >
                  <Bookmark size={15} />
                  <span>Save draft</span>
                </button>
                {activeDraftId && (
                  <button
                    type="button"
                    className="btn-resq-delete-draft"
                    onClick={() => {
                      handleDeleteDraft(activeDraftId);
                      closeModal();
                    }}
                    title="Delete referral draft"
                  >
                    <Trash2 size={15} />
                    <span>Delete draft</span>
                  </button>
                )}
              </div>

              {scanLocationMode === 'provider' ? (
                <button
                  type="button"
                  className="btn-proceed-black"
                  onClick={handleProceedScanLocation}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Proceed</span>
                  <ArrowRight size={15} />
                </button>
              ) : scanLocationMode === 'patient-choice' ? (
                <button
                  type="button"
                  className="btn-proceed-black"
                  onClick={handleProceedScanLocation}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Complete & Send Referral Link</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="btn-proceed-disabled"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>Select an option to proceed</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: EDIT CLINICIAN PROFILE (EMAIL STRICTLY LOCKED & READ-ONLY)
          ====================================================================== */}
      {isProfileModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProfileModalOpen(false)}>
          <div
            className="modal-card-resq edit-profile-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="edit-profile-modal-header">
              <div className="edit-profile-header-text">
                <span className="edit-profile-pill-badge">Clinician Account</span>
                <h3 className="edit-profile-title">
                  Clinician Profile
                </h3>
                <p className="edit-profile-desc">
                  View and update your practice information and professional credentials.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-pink-btn"
                onClick={() => setIsProfileModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* EMAIL FIELD - READ-ONLY & VERIFIED */}
              <div className="resq-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="resq-form-label" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                    Email Address
                  </label>
                  <span className="verified-tag">
                    <ShieldCheck size={11} /> Verified
                  </span>
                </div>
                <div className="locked-email-box" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' }}>
                  <div className="locked-email-left">
                    <Mail size={16} color="#64748B" />
                    <span style={{ color: '#64748B' }}>{displayEmail}</span>
                  </div>
                  <ShieldCheck size={16} color="#059669" />
                </div>
                <p style={{ margin: '5px 0 0', fontSize: '11.5px', color: '#64748B' }}>
                  Primary verified email associated with your ResQ account.
                </p>
              </div>

              {/* FULL NAME */}
              <div className="resq-form-group">
                <label className="resq-form-label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#E11D48' }}>*</span>
                </label>
                <input
                  type="text"
                  value={profileFormData.fullname}
                  onChange={(e) => setProfileFormData({ ...profileFormData, fullname: e.target.value })}
                  placeholder="e.g. Dr. John Doe"
                  required
                  className="resq-input-boxed"
                />
              </div>

              {/* SPECIALTY & LICENSE NUMBER */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div className="resq-form-group">
                  <label className="resq-form-label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Specialty / Designation
                  </label>
                  <input
                    type="text"
                    value={profileFormData.specialty}
                    onChange={(e) => setProfileFormData({ ...profileFormData, specialty: e.target.value })}
                    placeholder="e.g. Consultant Radiologist"
                    className="resq-input-boxed"
                  />
                </div>

                <div className="resq-form-group">
                  <label className="resq-form-label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Medical License (MDCN)
                  </label>
                  <input
                    type="text"
                    value={profileFormData.licenseNumber}
                    onChange={(e) => setProfileFormData({ ...profileFormData, licenseNumber: e.target.value })}
                    placeholder="e.g. MDCN-REG-847291"
                    className="resq-input-boxed"
                  />
                </div>
              </div>

              {/* PHONE NUMBER & PRACTICE NAME */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div className="resq-form-group">
                  <label className="resq-form-label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileFormData.phoneNumber}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phoneNumber: e.target.value })}
                    placeholder="e.g. +234 802 345 6789"
                    className="resq-input-boxed"
                  />
                </div>

                <div className="resq-form-group">
                  <label className="resq-form-label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Practice / Clinic Name
                  </label>
                  <input
                    type="text"
                    value={profileFormData.practiceName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, practiceName: e.target.value })}
                    placeholder="e.g. ResQ Medical Center"
                    className="resq-input-boxed"
                  />
                </div>
              </div>

              {/* PRACTICE ADDRESS */}
              <div className="resq-form-group">
                <label className="resq-form-label" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Practice Address
                </label>
                <textarea
                  value={profileFormData.practiceAddress}
                  onChange={(e) => setProfileFormData({ ...profileFormData, practiceAddress: e.target.value })}
                  placeholder="e.g. 15 Victoria Island, Lagos"
                  rows={2}
                  className="resq-input-boxed"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* MODAL ACTIONS */}
              <div className="clinician-profile-modal-actions">
                <button
                  type="button"
                  className="btn-clinician-profile-cancel"
                  onClick={() => setIsProfileModalOpen(false)}
                  disabled={isSavingProfile}
                  title="Cancel editing profile"
                >
                  <X size={15} />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="btn-proceed-black btn-profile-save"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <>
                      <RotateCw size={15} className="spinner-icon" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================================
          MODAL: CONFIRM SIGN OUT
          ====================================================================== */}
      {isSignOutModalOpen && (
        <div
          className="modal-backdrop signout-modal-backdrop"
          onClick={() => setIsSignOutModalOpen(false)}
          role="presentation"
        >
          <div
            className="modal-card-resq signout-confirm-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-modal-title"
          >
            <div className="signout-modal-header">
              <div className="signout-modal-icon-badge">
                <LogOut size={22} />
              </div>
              <button
                type="button"
                className="modal-close-pink-btn"
                onClick={() => setIsSignOutModalOpen(false)}
                title="Cancel and close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="signout-modal-body">
              <h3 id="signout-modal-title" className="signout-modal-title">
                Sign Out of ResQ?
              </h3>
              <p className="signout-modal-desc">
                Are you sure you want to end your session? You will need to sign in again to access your clinician dashboard and manage patient referrals.
              </p>
            </div>

            <div className="signout-modal-actions">
              <button
                type="button"
                className="btn-signout-cancel"
                onClick={() => setIsSignOutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-signout-confirm"
                onClick={() => {
                  setIsSignOutModalOpen(false);
                  onSignOut();
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Requisition Document Modal for Any Referral */}
      {selectedRequisitionReferral && (
        <RequisitionDocumentModal
          isOpen={Boolean(selectedRequisitionReferral)}
          onClose={() => setSelectedRequisitionReferral(null)}
          patientData={{
            fullName: selectedRequisitionReferral.patientName,
            email:
              selectedRequisitionReferral.draft?.formData.email ||
              existingPatients.find(
                (p) => p.name.toLowerCase() === selectedRequisitionReferral.patientName.toLowerCase()
              )?.email ||
              'patient@healthmail.com',
            phone:
              selectedRequisitionReferral.draft?.formData.phone ||
              existingPatients.find(
                (p) => p.name.toLowerCase() === selectedRequisitionReferral.patientName.toLowerCase()
              )?.phone ||
              '+234 800 123 4567',
            gender:
              selectedRequisitionReferral.draft?.formData.gender ||
              existingPatients.find(
                (p) => p.name.toLowerCase() === selectedRequisitionReferral.patientName.toLowerCase()
              )?.gender ||
              'Not specified',
            dob:
              selectedRequisitionReferral.draft?.formData.dob ||
              existingPatients.find(
                (p) => p.name.toLowerCase() === selectedRequisitionReferral.patientName.toLowerCase()
              )?.dob ||
              'Not specified',
            address:
              selectedRequisitionReferral.draft?.formData.address ||
              existingPatients.find(
                (p) => p.name.toLowerCase() === selectedRequisitionReferral.patientName.toLowerCase()
              )?.address ||
              'Lagos, Nigeria',
          }}
          referralData={{
            scanType:
              selectedRequisitionReferral.specialty ||
              selectedRequisitionReferral.service.split('-')[0].trim() ||
              'Diagnostic Imaging',
            bodyPart:
              selectedRequisitionReferral.bodyPart ||
              selectedRequisitionReferral.service.split('-')[1]?.trim() ||
              'General',
            clinicalNote:
              selectedRequisitionReferral.clinicalNote ||
              'Standard diagnostic imaging evaluation and clinical requisition order.',
            preferredCenter:
              selectedRequisitionReferral.provider ||
              selectedRequisitionReferral.hospital ||
              'ResQ Diagnostic Facility',
          }}
          clinicianData={{
            name: user.fullname,
            specialty: user.specialty,
            facility: user.practiceName,
            email: user.email,
            phone: user.phoneNumber,
          }}
        />
      )}
    </div>
  );
};

export default ReferralDashboard;
