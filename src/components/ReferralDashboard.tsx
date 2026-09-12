import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  Edit2,
  ShieldCheck,
  Mail,
  Phone,
  Award,
} from 'lucide-react';
import { FacilityMarketplace, SCAN_TYPES, BODY_PARTS, CONTRAST_OPTIONS } from './FacilityMarketplace';
import type { Facility } from './FacilityMarketplace';
import { BookingSummary } from './BookingSummary';
import { ReferralSuccess } from './ReferralSuccess';
import { ReferralReview } from './ReferralReview';
import { SearchableSelect } from './SearchableSelect';
import {
  apiGetClinicalCatalog,
  apiCreateReferral,
  apiGetReferrals,
  apiLookupPatient,
  apiGetPatients,
  apiUpdateProfile,
} from '../services/api';

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
}

export const INITIAL_REFERRALS: ReferralItem[] = [];

export const ALL_STATUS_OPTIONS: ReferralStatus[] = [
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
  // Initialize tab: Overview is the first tab unless user specifically visited /clinician/dashboard/referral/
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/referral')) {
      return 'referrals';
    }
    return 'overview';
  });

  useEffect(() => {
    if (activeTab === 'overview') {
      document.title = 'Overview | ResQ Healthcare';
    } else if (activeTab === 'referrals') {
      document.title = 'Referral Lists | ResQ Healthcare';
    } else if (activeTab === 'appointments') {
      document.title = 'Appointments | ResQ Healthcare';
    } else if (activeTab === 'patients') {
      document.title = 'Patients Directory | ResQ Healthcare';
    } else {
      document.title = 'Clinician Dashboard | ResQ Healthcare';
    }
  }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState('');
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isUserFiltered, setIsUserFiltered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

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

  // Modal navigation state: 'none' | 'choose-type' | 'choose-draft' | 'choose-existing' | 'patient-info' | 'scan-details' | 'scan-location'
  const [modalStep, setModalStep] = useState<'none' | 'choose-type' | 'choose-draft' | 'choose-existing' | 'patient-info' | 'scan-details' | 'scan-location'>('none');
  const [scanLocationMode, setScanLocationMode] = useState<'provider' | 'patient-choice' | null>(null);
  const [dashboardView, setDashboardView] = useState<'dashboard' | 'referral-review' | 'marketplace' | 'booking-summary' | 'submitted-success'>('dashboard');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string; display: string }>({
    date: 'Thu 20 February',
    time: '10:10 am',
    display: 'Thu 20 February at 10:10 am',
  });
  const [submittedReferralInfo, setSubmittedReferralInfo] = useState<{
    id: string;
    patientName: string;
    scanType: string;
    bodyPart?: string;
    facilityName: string;
    status: string;
    referralLink: string;
  }>({
    id: 'REF-20260123-00001',
    patientName: 'Anthony Odafe',
    scanType: 'MRI',
    bodyPart: 'Brain',
    facilityName: 'Phoebe Medical Center',
    status: 'Submitted',
    referralLink: 'resqhealth.africa/referral/REF-20260123-00',
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
      const res = await apiGetReferrals(user.email);
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
        setReferrals(mapped);
      }
    } catch (e: any) {
      console.warn('Could not load referrals from DB:', e.message);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  useEffect(() => {
    loadDoctorReferrals();
  }, [user.email]);

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
    contrastOption: 'Not Specified',
    clinicalNote: '',
  });

  const [patientWorkflowType, setPatientWorkflowType] = useState<'existing' | 'new'>('new');
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
          setFormData((prev) => ({
            ...prev,
            fullName: res.patient!.fullName,
            gender: res.patient!.gender || prev.gender,
            dob: res.patient!.dob || prev.dob,
            email: res.patient!.email || clean,
            phone: res.patient!.phone || prev.phone,
            address: res.patient!.address || prev.address,
          }));
          setExistingPatientFound(true);
          setIsNewUserAccordionOpen(false);
          setIsExistingAccordionOpen(true);
          setPatientLookupStatus({
            found: true,
            name: res.patient.fullName,
            message: `Auto-filled details for ${res.patient.fullName}`,
          });
          if (onAddToast) {
            onAddToast('success', 'User Found', `Auto-filled personal info for ${res.patient.fullName}`);
          }
        } else {
          setExistingPatientFound(false);
          setPatientLookupStatus({
            found: false,
            message: 'No existing ResQ patient profile found with this email.',
          });
        }
      } catch (err: any) {
        if (latestLookupEmailRef.current === clean) {
          setIsLookingUpPatient(false);
          setExistingPatientFound(false);
        }
      }
    }
  };

  const handleClearExistingLookup = () => {
    setExistingUserLookupEmail('');
    setPatientLookupStatus(null);
    setExistingPatientFound(false);
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
        closeModal();
      }
    };
    if (modalStep !== 'none') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalStep]);

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
    if (activeTab === 'referrals') {
      if (!window.location.pathname.includes('/clinician/dashboard/referral/')) {
        window.history.pushState(null, '', '/clinician/dashboard/referral/');
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

  const filteredReferrals = referrals.filter((item) => {
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      const matchId = item.id.toLowerCase().includes(q);
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

  const getStatusClass = (status: ReferralStatus | string): string => {
    switch (status) {
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

  const totalKpi = referrals.length;
  const submittedKpi = referrals.filter((r) => r.status === 'Submitted').length;
  const bookingKpi = referrals.filter((r) => r.status === 'Booking in Progress').length;
  const confirmedKpi = referrals.filter((r) => r.status === 'Confirmed' || r.status === 'Completed' || (r.status as string) === 'Paid').length;

  const closeModal = () => {
    setModalStep('none');
  };

  // Smooth back navigation between modals
  const handleModalBack = () => {
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

  // Direct step jump from progress bar
  const handleStepJump = (targetStep: 1 | 2 | 3) => {
    if (targetStep === 1) {
      setModalStep('patient-info');
    } else if (targetStep === 2) {
      setModalStep('scan-details');
    } else if (targetStep === 3) {
      setModalStep('scan-location');
    }
  };

  // 1. Choose Referral Type from Blurry Modal
  const handleSelectType = (type: 'existing' | 'new') => {
    setPatientWorkflowType(type);
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
        contrastOption: 'Not Specified',
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
        contrastOption: 'Not Specified',
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
    setFormData({
      fullName: patient.name,
      gender: patient.gender,
      dob: patient.dob,
      email: patient.email,
      phone: patient.phone,
      address: patient.address,
      scanType: '',
      bodyPart: '',
      contrastOption: 'Not Specified',
      clinicalNote: '',
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
    const pName = formData.fullName.trim();
    const newDraft: ReferralDraft = {
      id: draftId,
      savedAt: new Date().toISOString(),
      savedAtDisplay: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      step: modalStep === 'scan-details' ? 'scan-details' : 'patient-info',
      workflowType: patientWorkflowType,
      selectedPatientId,
      formData: { ...formData },
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
    setFormData({ contrastOption: 'Not Specified', ...draft.formData });
    setPatientWorkflowType(draft.workflowType);
    setSelectedPatientId(draft.selectedPatientId || null);
    if (draft.existingUserLookupEmail) {
      setExistingUserLookupEmail(draft.existingUserLookupEmail);
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

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const referralLink = `${origin}/patient/referral/${refId}`;

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
        } catch (e) {}
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

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const referralLink = `${origin}/patient/referral/${refId}`;

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
      } catch (e) {}
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
      {/* Left Sidebar */}
      <aside className="clinician-sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="RESQ" className="resq-sidebar-logo" />
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
                onClick={() => handleTabChange(item.id)}
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
            onClick={() => handleTabChange('support')}
          >
            <Headphones size={19} className="nav-icon" />
            <span className="nav-label">Support</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
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
              onClick={onSignOut}
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
          <h1 className="header-page-title">
            {activeTab === 'referrals' ? 'Referral Lists' : 'Overview'}
          </h1>

          <div className="header-search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
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
                    <span>View Referral Lists</span>
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
                <div className="profile-field-box locked-field-box">
                  <div className="profile-field-label">
                    <span>Email Address</span>
                    <span className="locked-tag">
                      <Lock size={11} /> Locked
                    </span>
                  </div>
                  <div className="profile-field-value text-locked">
                    <Mail size={15} className="field-icon" style={{ color: '#64748B' }} />
                    <span>{displayEmail}</span>
                  </div>
                  <span className="field-hint">Primary login identifier (cannot be changed)</span>
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
              <div className="clinician-body">
                <ReferralSuccess
                  referral={submittedReferralInfo}
                  onViewReferrals={() => {
                    setDashboardView('dashboard');
                    setActiveTab('referrals');
                  }}
                  onAddToast={onAddToast}
                />
              </div>
            ) : dashboardView === 'referral-review' ? (
              <div className="clinician-body">
                <ReferralReview
                  formData={formData}
                  user={user}
                  uploadedFileName={uploadedFile?.name}
                  onEditPersonalInfo={() => setModalStep('patient-info')}
                  onEditScanDetails={() => setModalStep('scan-details')}
                  onProceed={() => setModalStep('scan-location')}
                  onUpdateFormData={(updated) => setFormData((prev) => ({ ...prev, ...updated }))}
                  onProceedToBooking={() => setDashboardView('marketplace')}
                  onBackToDashboard={() => setDashboardView('dashboard')}
                />
              </div>
            ) : (
              <div className="referrals-content-area">
                {/* Action Toolbar Row */}
                <div className="toolbar-row">
                  <div className="toolbar-left">
                    <Users size={16} className="text-secondary" />
                    <span className="total-patients-count">
                      {referrals.length} Total referrals
                    </span>
                  </div>

                  <div className="toolbar-right">
                    <button
                      type="button"
                      className="toolbar-action-btn toolbar-icon-square"
                      title="Refresh"
                      onClick={() => {
                        loadDoctorReferrals();
                        setTableSearch('');
                      }}
                    >
                      <RotateCw size={14} className={isLoadingReferrals ? 'spin-anim' : ''} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-action-btn"
                      title="Print"
                      onClick={() => window.print()}
                    >
                      <span>Print</span>
                      <Printer size={14} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-action-btn"
                      onClick={() => setIsStatusFilterOpen((prev) => !prev)}
                    >
                      <span>Filter</span>
                      <Filter size={14} />
                    </button>

                    {/* Create Referral Trigger Button */}
                    <button
                      type="button"
                      className="btn-create-referral"
                      onClick={() => setModalStep('choose-type')}
                    >
                      Create referral
                    </button>
                  </div>
                </div>

                <div className="referrals-body-padding">
                  {/* KPI Cards Row */}
                  <div className="referrals-kpi-grid">
                    <div className="referrals-kpi-card">
                      <div className="kpi-title-row">
                        <span>Total Referrals</span>
                      </div>
                      <div className="kpi-number-value">{totalKpi}</div>
                    </div>

                    <div className="referrals-kpi-card">
                      <div className="kpi-title-row">
                        <span className="kpi-indicator-dot kpi-dot-submitted" />
                        <span>Submitted</span>
                      </div>
                      <div className="kpi-number-value">{submittedKpi}</div>
                    </div>

                    <div className="referrals-kpi-card">
                      <div className="kpi-title-row">
                        <span className="kpi-indicator-dot kpi-dot-progress" />
                        <span>Booking in progress</span>
                      </div>
                      <div className="kpi-number-value">{bookingKpi}</div>
                    </div>

                    <div className="referrals-kpi-card">
                      <div className="kpi-title-row">
                        <span className="kpi-indicator-dot kpi-dot-confirmed" />
                        <span>Confirmed</span>
                      </div>
                      <div className="kpi-number-value">{confirmedKpi}</div>
                    </div>
                  </div>

                  {/* Search & Filter Container */}
                  <div className="referrals-filter-panel" ref={filterDropdownRef}>
                    <div className="filter-panel-top">
                      <div className="filter-search-container">
                        <Search size={16} className="filter-search-icon" />
                        <input
                          type="text"
                          placeholder="Search by referral ID or patient name"
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          className="filter-search-input"
                        />
                      </div>

                      <div className="filter-status-dropdown-wrapper">
                        <button
                          type="button"
                          className="filter-status-trigger-btn"
                          onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                        >
                          <SlidersHorizontal size={14} />
                          <span>Filter by Status</span>
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
                      <>
                        <div className="filter-divider" />
                        <div className="filter-panel-active-row">
                          <span className="active-filter-label">
                            {activeStatusFilters.length} filter{activeStatusFilters.length === 1 ? '' : 's'} active
                          </span>

                          {activeStatusFilters.map((status) => (
                            <span key={status} className="active-filter-pill">
                              Status: {status}
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
                      </>
                    )}
                  </div>

                  {/* Referrals Data Table */}
                  <div className="referrals-table-card">
                    <table className="referrals-table">
                      <thead>
                        <tr>
                          <th>REFERRAL ID</th>
                          <th>PATIENT NAME</th>
                          <th>SERVICE</th>
                          <th>PROVIDER</th>
                          <th>STATUS</th>
                          <th>CREATED DATE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '64px 20px', color: '#64748B' }}>
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
                            <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                              No referrals found matching your search or filter.
                            </td>
                          </tr>
                        ) : (
                          filteredReferrals.map((ref) => {
                            const statusClass = getStatusClass(ref.status);
                            return (
                              <tr key={ref.id}>
                                <td className="referral-id-cell">{ref.id}</td>
                                <td className="patient-name-cell">{ref.patientName}</td>
                                <td className="service-cell">{ref.service || ref.specialty}</td>
                                <td className={ref.provider === 'Not selected' || ref.hospital === 'Not selected' ? 'provider-muted' : 'provider-cell'}>
                                  {ref.provider || ref.hospital || 'Not selected'}
                                </td>
                                <td>
                                  <span className={`status-pill ${statusClass}`}>
                                    <span className="status-dot" />
                                    {ref.status}
                                  </span>
                                </td>
                                <td className="date-cell">{ref.date}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    {/* Table Footer & Pagination */}
                    <div className="referrals-table-footer">
                      <div className="footer-showing-text">
                        Showing {filteredReferrals.length > 0 ? 1 : 0} to {filteredReferrals.length} of {referrals.length} referrals
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* OTHER TABS FALLBACK */}
        {activeTab !== 'overview' && activeTab !== 'referrals' && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#06202E' }}>
                  Create Referral
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#586A73' }}>
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

            {/* SAVED DRAFTS BANNER (Clean, high-visibility, 1-click 'Click to show all drafts') */}
            {savedDrafts.length > 0 && (
              <div className="saved-drafts-compact-banner">
                <div className="drafts-banner-left">
                  <div className="drafts-banner-icon-box">
                    <FolderClock size={20} />
                  </div>
                  <div>
                    <div className="drafts-banner-title-row">
                      <span className="drafts-banner-title">Saved Referral Drafts</span>
                      <span className="drafts-count-badge">{savedDrafts.length} saved</span>
                    </div>
                    <p className="drafts-banner-subtitle">
                      You have {savedDrafts.length} unfinished referral draft{savedDrafts.length > 1 ? 's' : ''}.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-show-all-drafts-cta"
                  onClick={() => setModalStep('choose-draft')}
                  title="Click to show all drafts and select who you want"
                >
                  <span>Click to show all drafts ({savedDrafts.length})</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* MOST RECENT DRAFT QUICK-RESUME CHIP */}
            {savedDrafts.length > 0 && (
              <div className="recent-draft-quick-chip">
                <div className="quick-chip-left">
                  <span className="quick-chip-label">Most recent:</span>
                  <span className="quick-chip-name">{savedDrafts[0].formData.fullName || 'Unnamed Patient'}</span>
                  <span className="quick-chip-scan">({savedDrafts[0].formData.scanType || 'Scan in progress'})</span>
                  <span className="quick-chip-time">• {savedDrafts[0].savedAtDisplay}</span>
                </div>
                <div className="quick-chip-actions">
                  <button
                    type="button"
                    className="btn-quick-resume"
                    onClick={() => handleResumeDraft(savedDrafts[0])}
                    title="Quick resume most recent draft"
                  >
                    Resume →
                  </button>
                </div>
              </div>
            )}

            <div className="referral-type-modal-container">
              {/* Option 1: Saved Drafts */}
              {savedDrafts.length > 0 && (
                <button
                  type="button"
                  className="referral-type-option option-saved-drafts"
                  onClick={() => setModalStep('choose-draft')}
                >
                  <div className="type-title-row">
                    <h4 className="type-title">Saved Drafts</h4>
                    <span className="type-badge-count">{savedDrafts.length}</span>
                  </div>
                  <p className="type-desc">
                    Click to show all saved drafts and select who you want to resume.
                  </p>
                </button>
              )}

              {/* Option 2: Existing Patient */}
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

              {/* Option 3: New Patient */}
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
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="resq-input-boxed"
                                style={{ backgroundColor: '#FFFFFF' }}
                                required
                              />
                            </div>

                            {/* Gender & Date of Birth */}
                            <div className="resq-form-row-2col">
                              <div className="resq-form-group" style={{ marginBottom: 0 }}>
                                <label className="resq-form-label" style={{ fontSize: '12px', fontWeight: 500 }}>
                                  Gender
                                </label>
                                <div className="resq-input-wrapper">
                                  <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="resq-select-boxed"
                                    style={{ backgroundColor: '#FFFFFF' }}
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
                                <div className="resq-input-wrapper">
                                  <input
                                    type="text"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    className="resq-input-boxed"
                                    style={{ backgroundColor: '#FFFFFF' }}
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
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className="resq-input-boxed"
                                  style={{ backgroundColor: '#FFFFFF' }}
                                />
                              </div>

                              <div className="resq-form-group" style={{ marginBottom: 0 }}>
                                <label className="resq-form-label" style={{ fontSize: '12px', fontWeight: 500 }}>
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  className="resq-input-boxed"
                                  style={{ backgroundColor: '#FFFFFF' }}
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
                                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                  className="new-user-textarea"
                                  style={{ backgroundColor: '#FFFFFF' }}
                                />
                                <span className="new-user-char-count">
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
                            value={existingPatientFound ? '' : formData.fullName}
                            onChange={(e) => {
                              if (existingPatientFound) setExistingPatientFound(false);
                              setFormData({ ...formData, fullName: e.target.value });
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
                                value={existingPatientFound ? '' : formData.gender}
                                onChange={(e) => {
                                  if (existingPatientFound) setExistingPatientFound(false);
                                  setFormData({ ...formData, gender: e.target.value });
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
                                value={existingPatientFound ? '' : formData.dob}
                                onChange={(e) => {
                                  if (existingPatientFound) setExistingPatientFound(false);
                                  setFormData({ ...formData, dob: e.target.value });
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
                              value={existingPatientFound ? '' : formData.email}
                              onChange={(e) => {
                                if (existingPatientFound) setExistingPatientFound(false);
                                setFormData({ ...formData, email: e.target.value });
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
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="new-user-textarea"
                            />
                            <span className="new-user-char-count">
                              {formData.address.length}/240
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
                      disabled={!formData.fullName.trim()}
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
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="resq-input-boxed"
                    />
                  </div>

                  {/* Gender & Date of Birth */}
                  <div className="resq-form-row-2col">
                    <div className="resq-form-group" style={{ marginBottom: 0 }}>
                      <label className="resq-form-label">Gender</label>
                      <div className="resq-input-wrapper">
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="resq-select-boxed"
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
                      <div className="resq-input-wrapper">
                        <input
                          type="text"
                          placeholder="10/01/1980"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="resq-input-boxed"
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="resq-input-boxed"
                      />
                    </div>

                    <div className="resq-form-group" style={{ marginBottom: 0 }}>
                      <label className="resq-form-label">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="0801 234 5678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="resq-input-boxed"
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
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="resq-input-boxed"
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
                if (patientWorkflowType === 'new') {
                  closeModal();
                  setDashboardView('referral-review');
                } else {
                  setModalStep('scan-location');
                }
              }}
            >
              {/* Scan Type */}
              <div className="resq-form-group">
                <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                  Scan Type
                </label>
                <div className="resq-input-wrapper">
                  <select
                    value={formData.scanType}
                    onChange={(e) => setFormData({ ...formData, scanType: e.target.value })}
                    className="resq-select-boxed"
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
              </div>

              {/* Body Part (Searchable Combobox) */}
              <div className="resq-form-group">
                <SearchableSelect
                  id="referral-modal-body-part"
                  label="Body Part"
                  labelClassName="resq-form-label"
                  options={catalogBodyParts}
                  value={formData.bodyPart}
                  onChange={(val) => setFormData({ ...formData, bodyPart: val })}
                  placeholder="Select or search body part (e.g. Brain, Chest, Femur)..."
                  hint="Search and select from 67 anatomical targets"
                />
              </div>

              {/* Contrast Selection */}
              <div className="resq-form-group">
                <label className="resq-form-label" style={{ fontSize: '12.5px', fontWeight: 500 }}>
                  Contrast Selection
                </label>
                <div className="resq-input-wrapper">
                  <select
                    value={formData.contrastOption || 'Not Specified'}
                    onChange={(e) => setFormData({ ...formData, contrastOption: e.target.value })}
                    className="resq-select-boxed"
                  >
                    {catalogContrastOptions.map((co) => (
                      <option key={co} value={co}>
                        {co}
                      </option>
                    ))}
                  </select>
                  <ChevronsUpDown size={15} className="resq-select-chevron" />
                </div>
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
                    <span className="summary-status-tag">Ready for Scheduling</span>
                  </div>
                  <div className="summary-scan-pill-row">
                    <span className="summary-scan-pill">
                      {formData.scanType || 'MRI Scan'}{formData.bodyPart ? ` • ${formData.bodyPart}` : ''}
                    </span>
                    <span className="summary-dot">•</span>
                    <span className="summary-clinician-note">
                      Clinician: {displayName.toLowerCase().startsWith('dr.') ? displayName : `Dr. ${displayName}`}
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
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 className="location-card-heading">Select a provider</h4>
                        <span className="location-badge-pill clinician-badge">Clinician Choice</span>
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

              {/* Option 2: Let the patient choose */}
              <div
                className={`location-card-modern ${scanLocationMode === 'patient-choice' ? 'selected' : ''}`}
                onClick={() => setScanLocationMode('patient-choice')}
                role="radio"
                aria-checked={scanLocationMode === 'patient-choice'}
              >
                <div className="location-card-top">
                  <div className="location-card-icon-title">
                    <div className="location-card-icon-box patient-icon">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 className="location-card-heading">Let the patient choose</h4>
                        <span className="location-badge-pill patient-badge">Self-Scheduling</span>
                      </div>
                      <p className="location-card-sub">
                        Patient will choose from suitable diagnostic centers near them.
                      </p>
                    </div>
                  </div>

                  <div className="custom-radio-modern">
                    {scanLocationMode === 'patient-choice' && <span className="custom-radio-modern-dot" />}
                  </div>
                </div>

                <div className="location-card-perks">
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
                  <span>Proceed to Facility Marketplace</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: '#06202E' }}>
                  Clinician Profile
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#586A73' }}>
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
              {/* LOCKED EMAIL FIELD - CANNOT BE EDITED */}
              <div className="resq-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="resq-form-label" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                    Email Address
                  </label>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#475569',
                      backgroundColor: '#E2E8F0',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Lock size={11} /> Locked / Cannot be modified
                  </span>
                </div>
                <div className="locked-email-box">
                  <div className="locked-email-left">
                    <Mail size={16} color="#64748B" />
                    <span>{displayEmail}</span>
                  </div>
                  <Lock size={15} color="#94A3B8" />
                </div>
                <p style={{ margin: '5px 0 0', fontSize: '11.5px', color: '#64748B' }}>
                  🔒 Your email address is your verified ResQ credential identifier and is strictly protected against alterations.
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="button"
                  className="btn-create-referral-cancel"
                  onClick={() => setIsProfileModalOpen(false)}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-proceed-black"
                  disabled={isSavingProfile}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
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
    </div>
  );
};

export default ReferralDashboard;
