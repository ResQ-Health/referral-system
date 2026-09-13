import React, { useState, useMemo } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Users,
  Store,
  FileText,
  Layers,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  Calendar as CalendarIcon,
  Sunrise,
  Sun,
  Moon,
  AlertCircle,
  Eye,
  Stethoscope,
  Building2,
  Mail,
  Phone,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { RequisitionDocumentModal } from './RequisitionDocumentModal';

export interface Facility {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewsCount: number;
  price: number;
  slotsAvailable: number;
  image: string;
}

export const SCAN_TYPES = [
  'CT Scan (Computed Tomography)',
  'MRI Scan (Magnetic Resonance Imaging)',
  'Ultrasound (US)',
  'X-Ray',
  'Mammography',
  'Fluoroscopy',
  'Nuclear Medicine',
  'PET/CT Scan',
];

export const CONTRAST_OPTIONS = [
  'With Contrast',
  'Without Contrast',
  'Not Specified',
];

export const BODY_PARTS = [
  'Abdomen',
  'Abdomen & Pelvis',
  'Abdominal Wall',
  'Aorta',
  'Ankle',
  'Arm / Upper Extremity',
  'Axilla',
  'Brain',
  'Breast',
  'Chest',
  'Clavicle',
  'Coccyx / Sacrum',
  'Colon',
  'Coronary Arteries',
  'Elbow',
  'Esophagus',
  'Eye',
  'Face',
  'Facial Bones',
  'Femur',
  'Fingers',
  'Foot',
  'Forearm',
  'Gallbladder / Hepatobiliary System',
  'Hand',
  'Head',
  'Heel / Calcaneus',
  'Hip',
  'Humerus',
  'Inguinal Canal',
  'Jaw / Mandible',
  'Kidney',
  'Knee',
  'Liver',
  'Liver & Spleen',
  'Lower Extremity / Leg',
  'Lumbar Plexus',
  'Lumbar Spine',
  'Mastoids',
  'Neck',
  'Neck Soft Tissue',
  'Nasal Bones',
  'Orbit / Skull',
  'Parathyroid',
  'Pelvis',
  'Ribs',
  'Renal System',
  'Sacroiliac Joints',
  'Scapula',
  'Shoulder',
  'Sinuses',
  'Skull',
  'Small Bowel',
  'Soft Tissue',
  'Spine',
  'Sternum',
  'Sternoclavicular Joint',
  'Stomach / Upper GI Tract',
  'Testicles',
  'Temporomandibular Joint (TMJ)',
  'Thoracic Spine',
  'Thyroid',
  'Tibia / Fibula',
  'Toes',
  'Urological System',
  'Whole Body',
  'Wrist',
];

export const SAMPLE_FACILITIES: Facility[] = [
  {
    id: 'fac-1',
    name: 'Phoebe Medical Center',
    address: '24 Adeola Odeku Street, VI Lagos',
    rating: 4.8,
    reviewsCount: 60,
    price: 32500,
    slotsAvailable: 4,
    image: '/phoebe_center.jpg',
  },
  {
    id: 'fac-2',
    name: 'St. Nicholas Diagnostic Centre',
    address: 'Plot 12 Bodija Road, Ibadan',
    rating: 4.7,
    reviewsCount: 48,
    price: 35000,
    slotsAvailable: 6,
    image: '/st_nicholas_center.jpg',
  },
  {
    id: 'fac-3',
    name: 'Clinix Healthcare Imaging',
    address: '57 Campbell Street, Lagos Island',
    rating: 4.6,
    reviewsCount: 82,
    price: 29500,
    slotsAvailable: 5,
    image: '/clinix_center.jpg',
  },
  {
    id: 'fac-4',
    name: 'EchoScan Diagnostics Lekki',
    address: 'Admiralty Way, Lekki Phase 1, Lagos',
    rating: 4.9,
    reviewsCount: 114,
    price: 38000,
    slotsAvailable: 3,
    image: '/st_nicholas_center.jpg',
  },
  {
    id: 'fac-5',
    name: 'Union Diagnostics & Clinical Services',
    address: '293B Akin Olugbade St, VI Lagos',
    rating: 4.5,
    reviewsCount: 73,
    price: 31000,
    slotsAvailable: 7,
    image: '/clinix_center.jpg',
  },
  {
    id: 'fac-6',
    name: 'Reddington Diagnostic Centre',
    address: '39 Isaac John Street, GRA Ikeja',
    rating: 4.8,
    reviewsCount: 95,
    price: 42000,
    slotsAvailable: 4,
    image: '/phoebe_center.jpg',
  },
];

export interface FacilityMarketplaceProps {
  user: {
    fullname?: string;
    email?: string;
    specialty?: string;
    licenseNumber?: string;
    practiceName?: string;
    phoneNumber?: string;
    photoURL?: string;
  };
  referralData: {
    fullName: string;
    email?: string;
    phone?: string;
    gender?: string;
    dob?: string;
    address?: string;
    scanType: string;
    bodyPart: string;
    contrastOption?: string;
    clinicalNote: string;
  };
  onSelectBooking: (facility: Facility, slot: { date: string; time: string; display: string }) => void;
  onBackToDashboard: () => void;
  onUpdateReferralData: (updated: Partial<FacilityMarketplaceProps['referralData']>) => void;
}

interface FacilitySlotItem {
  time: string;
  hour: number;
  minute: number;
  period: 'Morning' | 'Afternoon' | 'Evening';
}

const ALL_FACILITY_SLOTS: FacilitySlotItem[] = [
  // Morning (8:30 AM - 11:30 AM)
  { time: '08:30 AM', hour: 8, minute: 30, period: 'Morning' },
  { time: '09:15 AM', hour: 9, minute: 15, period: 'Morning' },
  { time: '10:00 AM', hour: 10, minute: 0, period: 'Morning' },
  { time: '10:45 AM', hour: 10, minute: 45, period: 'Morning' },
  { time: '11:30 AM', hour: 11, minute: 30, period: 'Morning' },
  // Afternoon (1:00 PM - 4:00 PM)
  { time: '01:00 PM', hour: 13, minute: 0, period: 'Afternoon' },
  { time: '01:45 PM', hour: 13, minute: 45, period: 'Afternoon' },
  { time: '02:30 PM', hour: 14, minute: 30, period: 'Afternoon' },
  { time: '03:15 PM', hour: 15, minute: 15, period: 'Afternoon' },
  { time: '04:00 PM', hour: 16, minute: 0, period: 'Afternoon' },
  // Evening (5:00 PM - 6:30 PM)
  { time: '05:00 PM', hour: 17, minute: 0, period: 'Evening' },
  { time: '05:45 PM', hour: 17, minute: 45, period: 'Evening' },
  { time: '06:30 PM', hour: 18, minute: 30, period: 'Evening' },
];

export const FacilityMarketplace: React.FC<FacilityMarketplaceProps> = ({
  user,
  referralData,
  onSelectBooking,
  onBackToDashboard,
  onUpdateReferralData,
}) => {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(SAMPLE_FACILITIES[0]);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  // Dynamic Date & Time State
  const now = useMemo(() => new Date(), []);
  const todayStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    [now]
  );

  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // If evening past 18:30, start with tomorrow
    if (now.getHours() > 18 || (now.getHours() === 18 && now.getMinutes() >= 30)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return now;
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM');

  // Active sub-tab in top navbar: 'referral' (Referral Summary) vs 'marketplace' (Select a provider)
  const [activeMarketTab, setActiveMarketTab] = useState<'referral' | 'marketplace'>('referral');
  const [providerName, setProviderName] = useState('Phoebe Medical Center');
  const [estimatedPriceText, setEstimatedPriceText] = useState('₦30,000.00 - ₦35,000.00');

  // Filter states
  const [scanFilter, setScanFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const doctorDisplayName = user.fullname?.trim() || 'Enaikele Omoh Kelvin';
  const doctorName = doctorDisplayName.toLowerCase().startsWith('dr.')
    ? doctorDisplayName
    : `Dr. ${doctorDisplayName}`;
  const doctorSpecialty = user.specialty?.trim() || 'Consultant Specialist';
  const doctorLicense = user.licenseNumber?.trim() || 'MDCN-REG-847291';
  const doctorFacility = user.practiceName?.trim() || 'ResQ Medical Center';
  const doctorInitial = (doctorDisplayName.toLowerCase().startsWith('dr.')
    ? doctorDisplayName.substring(3).trim()
    : doctorDisplayName
  ).charAt(0).toUpperCase() || 'E';
  const doctorEmail = user.email || 'dr.kelvin@resqhealth.com';
  const doctorPhone = user.phoneNumber || '+234 802 345 6789';
  const [copiedLicense, setCopiedLicense] = useState(false);

  const handleCopyLicense = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(doctorLicense);
    }
    setCopiedLicense(true);
    setTimeout(() => setCopiedLicense(false), 2000);
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isSelectedDateToday = isSameDay(selectedDate, now);

  const tomorrowDate = useMemo(() => {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return t;
  }, [now]);

  const isSelectedDateTomorrow = isSameDay(selectedDate, tomorrowDate);

  // Month navigation guards: cannot go to past months
  const canGoPrevMonth =
    viewDate.getFullYear() > now.getFullYear() ||
    (viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() > now.getMonth());

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDaysCount - i,
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
        isSelected: false,
        dateObj: new Date(year, month - 1, prevMonthDaysCount - i),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isPast = dateObj.getTime() < todayStart.getTime();
      const isToday = isSameDay(dateObj, now);
      const isSelected = isSameDay(dateObj, selectedDate);

      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        isPast,
        isToday,
        isSelected,
        dateObj,
      });
    }

    // Next month padding to complete week grid
    const totalCells = days.length;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({
        dayNumber: n,
        isCurrentMonth: false,
        isPast: false,
        isToday: false,
        isSelected: false,
        dateObj: new Date(year, month + 1, n),
      });
    }

    return days;
  }, [viewDate, selectedDate, todayStart, now]);

  // Slots availability calculation
  const currentSlots = useMemo(() => {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return ALL_FACILITY_SLOTS.map((slot) => {
      // Check if slot time on today is already in the past
      const isPastTime =
        isSelectedDateToday &&
        (slot.hour < currentHour || (slot.hour === currentHour && slot.minute <= currentMinute));

      // Deterministic booked slots for realistic healthcare capacity
      const isSunday = selectedDate.getDay() === 0;
      const seed = (selectedDate.getDate() * 7 + slot.hour * 3) % 11;
      const isSimulatedBooked = !isPastTime && (isSunday || seed === 3 || seed === 8);

      const isAvailable = !isPastTime && !isSimulatedBooked;

      return {
        ...slot,
        isPastTime,
        isBooked: isSimulatedBooked,
        isAvailable,
      };
    });
  }, [selectedDate, isSelectedDateToday, now]);

  const availableSlotsCount = currentSlots.filter((s) => s.isAvailable).length;
  const allTodaySlotsPassed = isSelectedDateToday && availableSlotsCount === 0;

  const handleDaySelect = (dayDate: Date) => {
    if (dayDate.getTime() < todayStart.getTime()) return; // Cannot select past dates
    setSelectedDate(dayDate);

    // Pick first available slot on new date if current slot is past or booked
    const isNewToday = isSameDay(dayDate, now);
    const firstAvail = ALL_FACILITY_SLOTS.find((s) => {
      const isPast =
        isNewToday &&
        (s.hour < now.getHours() ||
          (s.hour === now.getHours() && s.minute <= now.getMinutes()));
      const isSun = dayDate.getDay() === 0;
      const seed = (dayDate.getDate() * 7 + s.hour * 3) % 11;
      const isBooked = !isPast && (isSun || seed === 3 || seed === 8);
      return !isPast && !isBooked;
    });

    if (firstAvail) {
      setSelectedTimeSlot(firstAvail.time);
    } else {
      setSelectedTimeSlot('');
    }
  };

  const handleQuickChipSelect = (daysOffset: number) => {
    const target = new Date(now);
    target.setDate(target.getDate() + daysOffset);
    setSelectedDate(target);
    setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));

    const isTargetToday = daysOffset === 0;
    const firstAvail = ALL_FACILITY_SLOTS.find((s) => {
      const isPast =
        isTargetToday &&
        (s.hour < now.getHours() ||
          (s.hour === now.getHours() && s.minute <= now.getMinutes()));
      const isSun = target.getDay() === 0;
      const seed = (target.getDate() * 7 + s.hour * 3) % 11;
      const isBooked = !isPast && (isSun || seed === 3 || seed === 8);
      return !isPast && !isBooked;
    });

    if (firstAvail) {
      setSelectedTimeSlot(firstAvail.time);
    } else {
      setSelectedTimeSlot('');
    }
  };

  const handleOpenSlotModal = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsSlotModalOpen(true);
  };

  const formattedDayTitle = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedDayDisplay = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleProceedToSummary = () => {
    if (!selectedFacility || !selectedTimeSlot) return;
    const slotObj = {
      date: formattedDayDisplay,
      time: selectedTimeSlot,
      display: `${formattedDayDisplay} at ${selectedTimeSlot}`,
    };
    setIsSlotModalOpen(false);
    onSelectBooking(selectedFacility, slotObj);
  };

  // Filter facilities
  const filteredFacilities = SAMPLE_FACILITIES.filter((f) => {
    const matchesScan = !scanFilter || referralData.scanType.toLowerCase().includes(scanFilter.toLowerCase());
    const matchesLoc = !locationFilter || f.address.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesScan && matchesLoc && matchesSearch;
  });

  return (
    <div className="marketplace-layout">
      {/* Redesigned Executive Top Header */}
      <header className="marketplace-navbar">
        <div className="marketplace-nav-left">
          <button
            type="button"
            onClick={() => {
              if (activeMarketTab === 'marketplace') {
                setActiveMarketTab('referral');
              } else {
                onBackToDashboard();
              }
            }}
            className="btn-back-clean"
            title={activeMarketTab === 'marketplace' ? 'Back to Referral Summary' : 'Back to Dashboard'}
          >
            <ArrowLeft size={16} />
          </button>
          <div
            className="marketplace-brand-wrap"
            onClick={onBackToDashboard}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <img src="/logo.png" alt="ResQ" className="resq-sidebar-logo" />
            <span className="resq-brand-text-lg">ResQ</span>
          </div>
          <div className="marketplace-nav-divider-v" />
          <span className="marketplace-flow-badge">Clinical Referral</span>
        </div>

        <div className="marketplace-nav-center">
          <nav className="marketplace-stepper-pills">
            <button
              type="button"
              className={`market-nav-step-pill ${activeMarketTab === 'referral' ? 'active' : 'completed'}`}
              onClick={() => setActiveMarketTab('referral')}
              title="Step 1: Referral Summary"
            >
              <span className="step-pill-number">{activeMarketTab === 'marketplace' ? '✓' : '1'}</span>
              <span className="step-pill-text">Summary</span>
            </button>
            <div className={`market-stepper-line ${activeMarketTab === 'marketplace' ? 'active' : ''}`} />
            <button
              type="button"
              className={`market-nav-step-pill ${activeMarketTab === 'marketplace' ? 'active' : ''}`}
              onClick={() => {
                setActiveMarketTab('marketplace');
                setIsSlotModalOpen(false);
              }}
              title="Step 2: Select Provider"
            >
              <span className="step-pill-number">2</span>
              <span className="step-pill-text">Provider</span>
            </button>
            <div className="market-stepper-line" />
            <button
              type="button"
              className="market-nav-step-pill disabled"
              title="Step 3: Booking Summary (Select a slot to proceed)"
            >
              <span className="step-pill-number">3</span>
              <span className="step-pill-text">Booking</span>
            </button>
          </nav>
        </div>

        <div className="marketplace-nav-right">
          <div className="marketplace-doctor-pill">
            <div className="doctor-avatar-circle">
              {doctorInitial}
            </div>
            <div className="doctor-pill-info">
              <div className="doctor-pill-name-row">
                <span className="doctor-pill-name">{doctorName}</span>
                <span className="doctor-verified-dot" title="Authenticated Clinician" />
              </div>
              <span className="doctor-pill-specialty">{doctorSpecialty}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Conditional between Referral Summary and Marketplace */}
      {activeMarketTab === 'referral' ? (
        <div className="referral-page-summary-wrapper">
          {/* Top Title & Status Banner */}
          <div className="referral-summary-header-banner">
            <div className="summary-banner-top-row">
              <button
                type="button"
                className="modal-nav-back-pill"
                onClick={onBackToDashboard}
                title="Back to referrals dashboard"
              >
                <ArrowLeft size={14} />
                <span>Back to Dashboard</span>
              </button>

              <div className="summary-status-pill">
                <CheckCircle2 size={13} className="text-emerald" />
                <span>Ready for Facility Selection</span>
              </div>
            </div>

            <div className="summary-banner-title-block">
              <h1 className="referral-page-summary-title">Referral Summary & Clinical Review</h1>
              <p className="referral-page-summary-subtitle">
                Verify and customize patient demographics, diagnostic scan modality, and clinical indications before choosing an accredited diagnostic center.
              </p>
            </div>
          </div>

          {/* 1. Patient Demographics Card */}
          <div className="referral-summary-card-executive">
            <div className="referral-card-section-header">
              <div className="section-header-title-group">
                <div className="section-icon-badge">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="referral-card-section-label">Patient Information</h3>
                  <p className="referral-card-section-desc">Personal details used for clinical identity verification and diagnostic reporting.</p>
                </div>
              </div>
              <span className="editable-status-tag">
                <Edit3 size={12} /> Editable
              </span>
            </div>

            <div className="referral-card-inputs-grid">
              <div className="referral-input-unit">
                <label className="referral-unit-label">Patient Full Name</label>
                <input
                  type="text"
                  value={referralData.fullName || ''}
                  onChange={(e) => onUpdateReferralData({ fullName: e.target.value })}
                  className="referral-unit-input"
                  placeholder="e.g. Anthony Odafe"
                />
              </div>

              <div className="referral-input-unit">
                <label className="referral-unit-label">Email Address</label>
                <input
                  type="email"
                  value={referralData.email || 'patient@healthmail.com'}
                  onChange={(e) => onUpdateReferralData({ email: e.target.value })}
                  className="referral-unit-input"
                  placeholder="e.g. patient@healthmail.com"
                />
              </div>

              <div className="referral-input-unit">
                <label className="referral-unit-label">Phone Number</label>
                <input
                  type="tel"
                  value={referralData.phone || '0801 234 5678'}
                  onChange={(e) => onUpdateReferralData({ phone: e.target.value })}
                  className="referral-unit-input"
                  placeholder="e.g. 0801 234 5678"
                />
              </div>

              <div className="referral-input-unit">
                <label className="referral-unit-label">Gender</label>
                <select
                  value={referralData.gender || 'Male'}
                  onChange={(e) => onUpdateReferralData({ gender: e.target.value })}
                  className="referral-unit-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="referral-input-unit">
                <label className="referral-unit-label">Date of Birth</label>
                <input
                  type="text"
                  value={referralData.dob || '14/05/1990'}
                  onChange={(e) => onUpdateReferralData({ dob: e.target.value })}
                  className="referral-unit-input"
                  placeholder="DD/MM/YYYY"
                />
              </div>

              <div className="referral-input-unit">
                <label className="referral-unit-label">Residential Address</label>
                <input
                  type="text"
                  value={referralData.address || 'Victoria Island, Lagos'}
                  onChange={(e) => onUpdateReferralData({ address: e.target.value })}
                  className="referral-unit-input"
                  placeholder="e.g. Victoria Island, Lagos"
                />
              </div>
            </div>
          </div>

          {/* 2. Diagnostic Protocol Card */}
          <div className="referral-summary-card-executive">
            <div className="referral-card-section-header">
              <div className="section-header-title-group">
                <div className="section-icon-badge">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="referral-card-section-label">Diagnostic Scan & Clinical Indication</h3>
                  <p className="referral-card-section-desc">Imaging modality, target anatomical region, and clinical instructions for the radiologist.</p>
                </div>
              </div>
              <span className="editable-status-tag">
                <Edit3 size={12} /> Dropdowns Active
              </span>
            </div>

            <div className="referral-card-inputs-grid">
              <div className="referral-input-unit">
                <label className="referral-unit-label">Scan Type *</label>
                <select
                  value={referralData.scanType || 'MRI Scan (Magnetic Resonance Imaging)'}
                  onChange={(e) => onUpdateReferralData({ scanType: e.target.value })}
                  className="referral-unit-input referral-unit-select"
                >
                  {SCAN_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="referral-input-unit">
                <label className="referral-unit-label">Body Part *</label>
                <select
                  value={referralData.bodyPart || 'Brain'}
                  onChange={(e) => onUpdateReferralData({ bodyPart: e.target.value })}
                  className="referral-unit-input referral-unit-select"
                >
                  {BODY_PARTS.map((bp) => (
                    <option key={bp} value={bp}>
                      {bp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="referral-input-unit">
                <label className="referral-unit-label">Preferred Diagnostic Center</label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="referral-unit-input"
                />
              </div>

              <div className="referral-input-unit">
                <label className="referral-unit-label">Estimated Price Range</label>
                <input
                  type="text"
                  value={estimatedPriceText}
                  onChange={(e) => setEstimatedPriceText(e.target.value)}
                  className="referral-unit-input"
                />
              </div>
            </div>

            <div className="referral-input-unit" style={{ marginTop: '16px' }}>
              <label className="referral-unit-label">Clinical Indication & Notes</label>
              <textarea
                value={referralData.clinicalNote}
                onChange={(e) => onUpdateReferralData({ clinicalNote: e.target.value })}
                className="referral-unit-textarea"
                rows={3}
                placeholder="Clinical indications and history..."
              />
            </div>
          </div>

          {/* 3. Ordering Clinician & Attached Requisition Document Card (Executive Redesign) */}
          <div className="referral-summary-card-executive clinician-auth-card-wrapper">
            {/* Card Header */}
            <div className="referral-card-section-header">
              <div className="section-header-title-group">
                <div className="section-icon-badge badge-teal-gradient">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="referral-card-section-label">Referring Clinician Authorization</h3>
                  <p className="referral-card-section-desc">
                    Official clinical practitioner authorization, verified medical credentials, and digital attestation.
                  </p>
                </div>
              </div>
              <span className="summary-status-pill pill-active-verified" style={{ margin: 0 }}>
                <CheckCircle2 size={13} className="text-emerald" />
                <span>MDCN Licensed & Verified</span>
              </span>
            </div>

            {/* Clinician Accreditation & Details Panel */}
            <div className="clinician-auth-credentials-panel">
              <div className="clinician-auth-profile-left">
                <div className="clinician-auth-avatar-wrap">
                  <div className="clinician-avatar-badge-large">
                    {doctorInitial}
                  </div>
                  <span className="auth-avatar-status-badge" title="Active MDCN Registration">
                    <CheckCircle2 size={12} />
                  </span>
                </div>

                <div className="clinician-auth-identity">
                  <div className="clinician-auth-name-row">
                    <h4 className="clinician-full-name">{doctorName}</h4>
                    <span className="clinician-cadre-tag">Registered Medical Practitioner</span>
                  </div>

                  <div className="clinician-meta-chips-row">
                    <span className="clinician-specialty-pill">
                      <Stethoscope size={13} />
                      {doctorSpecialty}
                    </span>
                    <span className="clinician-facility-pill">
                      <Building2 size={13} />
                      {doctorFacility}
                    </span>
                  </div>

                  <div className="clinician-contact-sub-row">
                    <span className="clinician-contact-item">
                      <Mail size={12} />
                      {doctorEmail}
                    </span>
                    <span className="clinician-contact-item">
                      <Phone size={12} />
                      {doctorPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Regulatory / MDCN License Card */}
              <div className="clinician-auth-license-box">
                <span className="auth-license-header-label">REGULATORY ACCREDITATION</span>
                <div className="auth-license-body">
                  <div className="auth-license-code-wrap">
                    <span className="auth-license-number font-mono">{doctorLicense}</span>
                    <button
                      type="button"
                      className="btn-copy-license-sm"
                      onClick={handleCopyLicense}
                      title="Copy MDCN License Number"
                    >
                      {copiedLicense ? <CheckCheck size={12} className="text-emerald" /> : <Copy size={12} />}
                      <span>{copiedLicense ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span className="auth-badge-verified">ACTIVE</span>
                  </div>
                  <span className="auth-license-board">Medical and Dental Council of Nigeria (MDCN)</span>
                  <span className="auth-license-prescribing">Full Specialist Prescribing & Referral Authority</span>
                </div>
              </div>
            </div>

            {/* Legal Attestation & Electronic Seal Box */}
            <div className="clinician-attestation-block">
              <div className="attestation-text-side">
                <span className="attestation-statement-label">CLINICAL ATTESTATION & LEGAL DISCLOSURE</span>
                <p className="attestation-statement-quote">
                  “I, {doctorName}, certify under professional standards that I am a registered medical practitioner. The requested examination is medically justified by clinical evaluation, and appropriate radiation and contrast safety parameters have been evaluated.”
                </p>
              </div>

              <div className="attestation-signature-side">
                <div className="attestation-signature-stamp">
                  <span className="signature-doctor-handwriting">{doctorName}</span>
                  <div className="signature-meta-row">
                    <span className="signature-timestamp">Digitally Signed on ResQ</span>
                    <span className="signature-security-hash">AUTH: {doctorLicense.replace(/[^a-zA-Z0-9]/g, '')}-SEC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Requisition Document Card (Modern Executive Layout - De-cluttered & Multi-Tier) */}
            <div className="requisition-doc-executive-card">
              {/* Tier 1: Category Label & Status Pill */}
              <div className="req-doc-top-bar">
                <div className="req-doc-category-badge">
                  <FileText size={13} />
                  <span>Diagnostic Requisition Order</span>
                </div>
                <div className="req-doc-bound-pill">
                  <CheckCircle2 size={12} />
                  <span>Bound to Referral</span>
                </div>
              </div>

              {/* Tier 2: Document File Info */}
              <div className="req-doc-content-body">
                <div className="req-doc-pdf-icon-badge">
                  <FileText size={22} />
                  <span className="pdf-tag">PDF</span>
                </div>
                <div className="req-doc-info-col">
                  <div className="req-doc-filename-large">Clinical_Requisition_Order.pdf</div>
                  <div className="req-doc-meta-pills">
                    <span className="req-doc-sub-tag">1.2 MB</span>
                    <span className="req-doc-dot">•</span>
                    <span className="req-doc-sub-tag">1-Page Standard A4</span>
                    <span className="req-doc-dot">•</span>
                    <span className="req-doc-sub-tag">Digitally Sealed</span>
                  </div>
                </div>
              </div>

              {/* Tier 3: Action & Verification */}
              <div className="req-doc-action-strip">
                <button
                  type="button"
                  className="btn-view-requisition-action"
                  onClick={() => setIsRequisitionModalOpen(true)}
                  title="Click to view and preview Clinical_Requisition_Order.pdf"
                >
                  <Eye size={15} />
                  <span>View Requisition Order</span>
                </button>

                <div className="req-doc-security-footer">
                  <div className="req-doc-sec-item">
                    <CheckCircle2 size={12} className="text-emerald" />
                    <span>MDCN Registration Validated</span>
                  </div>
                  <div className="req-doc-sec-bullet">•</div>
                  <div className="req-doc-sec-item">
                    <CheckCircle2 size={12} className="text-emerald" />
                    <span>PACS Dispatch Authorized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Action Row: Back & Proceed to Book */}
          <div className="referral-summary-book-row">
            <button
              type="button"
              className="btn-resq-back"
              onClick={onBackToDashboard}
            >
              <ArrowLeft size={15} />
              <span>Back to Dashboard</span>
            </button>

            <button
              type="button"
              className="btn-proceed-to-book-resq"
              onClick={() => {
                setActiveMarketTab('marketplace');
                setIsSlotModalOpen(false);
              }}
              title="Proceed to facility selection"
            >
              <span>Proceed to Book (Select Facility)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Marketplace Body: Sidebar + Facility Cards Grid */
        <div className="marketplace-body">
          {/* Mobile Drawer Backdrop */}
          {isMobileSummaryOpen && (
            <div
              className="marketplace-mobile-backdrop"
              onClick={() => setIsMobileSummaryOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Left Sidebar: Desktop Persistent / Mobile Slide-Over Drawer */}
          <aside className={`referral-summary-sidebar ${isMobileSummaryOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="#0D9488" />
                <h3 className="sidebar-section-title" style={{ margin: 0 }}>Referral Summary</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-sidebar-back-referral"
                  onClick={() => setActiveMarketTab('referral')}
                  title="Edit full referral summary"
                >
                  <Edit3 size={12} />
                  <span>Full Review</span>
                </button>
                <button
                  type="button"
                  className="btn-sidebar-close-mobile"
                  onClick={() => setIsMobileSummaryOpen(false)}
                  aria-label="Close summary"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Patient Name */}
            <div className="summary-field-group">
              <label className="summary-field-label">Patient Name</label>
              <input
                type="text"
                value={referralData.fullName || ''}
                onChange={(e) => onUpdateReferralData({ fullName: e.target.value })}
                className="summary-field-input"
                placeholder="Patient Full Name"
              />
            </div>

            {/* Scan Type (DROPDOWN) */}
            <div className="summary-field-group">
              <label className="summary-field-label">Scan Type</label>
              <select
                value={referralData.scanType || 'MRI'}
                onChange={(e) => onUpdateReferralData({ scanType: e.target.value })}
                className="summary-field-input summary-field-select"
              >
                {SCAN_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Body Part (DROPDOWN) */}
            <div className="summary-field-group">
              <label className="summary-field-label">Body Part</label>
              <select
                value={referralData.bodyPart || 'Brain MRI'}
                onChange={(e) => onUpdateReferralData({ bodyPart: e.target.value })}
                className="summary-field-input summary-field-select"
              >
                {BODY_PARTS.map((bp) => (
                  <option key={bp} value={bp}>
                    {bp}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Price */}
            <div className="summary-field-group">
              <label className="summary-field-label">Estimated Price</label>
              <input
                type="text"
                value={estimatedPriceText}
                onChange={(e) => setEstimatedPriceText(e.target.value)}
                className="summary-field-input"
                placeholder="Estimated Price Range"
              />
            </div>

            {/* Clinical Note */}
            <div className="summary-field-group">
              <label className="summary-field-label">Clinical Note</label>
              <textarea
                value={referralData.clinicalNote}
                onChange={(e) => onUpdateReferralData({ clinicalNote: e.target.value })}
                className="summary-field-textarea"
                placeholder="Clinical instructions or patient symptoms..."
                rows={3}
              />
            </div>

            {/* Referring Clinician at bottom */}
            <div className="summary-clinician-card">
              <span className="clinician-section-subtitle">Referring Clinician</span>
              <div className="clinician-profile-row">
                <div className="clinician-avatar-badge">
                  {doctorInitial}
                </div>
                <div className="clinician-names-col">
                  <span className="clinician-primary-name">{doctorName}</span>
                  <span className="clinician-sub-specialty">{doctorSpecialty}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-sidebar-switch-referral"
              onClick={() => setActiveMarketTab('referral')}
            >
              <ArrowLeft size={13} />
              <span>Back to Full Referral Summary</span>
            </button>
          </aside>

          {/* Right Main Area: Facility Grid & Filters */}
          <main className="marketplace-content">
            {/* Mobile Sticky Quick Summary Bar */}
            <div className="marketplace-mobile-quickbar">
              <button
                type="button"
                className="btn-mobile-toggle-summary"
                onClick={() => setIsMobileSummaryOpen(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={15} color="#0D9488" />
                  <span className="mobile-summary-text">
                    Order: <strong>{referralData.fullName || 'Patient'}</strong> ({referralData.bodyPart || 'Scan'})
                  </span>
                </div>
                <span className="mobile-summary-pill-btn">View Summary ⚙</span>
              </button>
            </div>

            {/* Top breadcrumb & header */}
            <div className="marketplace-header-row">
              <div>
                <button
                  type="button"
                  className="modal-nav-back-pill"
                  onClick={() => setActiveMarketTab('referral')}
                  style={{ marginBottom: '10px' }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Referral Summary</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <h1 className="marketplace-heading">Select an Accredited Diagnostic Center</h1>
                  <button
                    type="button"
                    className="btn-market-reset-all"
                    onClick={() => {
                      setScanFilter('');
                      setLocationFilter('');
                      setSearchQuery('');
                    }}
                    title="Reset all filters"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Click any facility card below to view available appointment slots and pick a date & time.
                </p>
              </div>

              {/* Filter Bar */}
              <div className="marketplace-filters-bar">
                <select
                  className="market-filter-select"
                  value={scanFilter}
                  onChange={(e) => setScanFilter(e.target.value)}
                >
                  <option value="">All Scans</option>
                  {SCAN_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  className="market-filter-select"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="">All Locations</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Ikeja">Ikeja</option>
                  <option value="Lekki">Lekki</option>
                  <option value="Ibadan">Ibadan</option>
                </select>

                <input
                  type="text"
                  placeholder="Search centers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="market-search-input"
                />
              </div>
            </div>

            {/* Facilities Grid */}
            <div className="facility-cards-grid">
              {filteredFacilities.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <Store size={36} color="#94A3B8" style={{ marginBottom: '12px' }} />
                  <h3 style={{ margin: '0 0 6px', color: '#06202E' }}>No diagnostic centers match your filters</h3>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Try resetting the search or selecting a different location.</p>
                </div>
              ) : (
                filteredFacilities.map((facility) => (
                  <div
                    key={facility.id}
                    className={`facility-card interactive-facility-card ${selectedFacility?.id === facility.id ? 'facility-card-selected' : ''}`}
                    onClick={() => handleOpenSlotModal(facility)}
                    title={`Click to select ${facility.name} and choose appointment date/time`}
                  >
                    <div className="facility-image-wrapper">
                      <img src={facility.image} alt={facility.name} className="facility-card-img" />
                      <span className="facility-slots-chip">
                        <Clock size={12} /> {facility.slotsAvailable} slots available
                      </span>
                    </div>

                    <div className="facility-card-details">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 className="facility-title">{facility.name}</h3>
                      </div>

                      <div className="facility-address-row">
                        <MapPin size={13} className="text-secondary" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span className="facility-address-text">{facility.address}</span>
                      </div>

                      <div className="facility-rating-row">
                        <span className="rating-score">{facility.rating}</span>
                        <div className="rating-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className="star-filled"
                              fill="#F59E0B"
                              color="#F59E0B"
                            />
                          ))}
                        </div>
                        <span className="rating-count">({facility.reviewsCount})</span>
                      </div>

                      <div className="facility-card-bottom">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Standard Scan Fee</span>
                          <span className="facility-price-tag">
                            ₦{facility.price.toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-book-facility"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSlotModal(facility);
                          }}
                        >
                          <span>Select & Book</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      )}

      {/* ======================================================================
          FACILITY BOOKING MODAL WITH CALENDAR & TIME SLOTS
          ====================================================================== */}
      {isSlotModalOpen && selectedFacility && (
        <div className="modal-backdrop" onClick={() => setIsSlotModalOpen(false)}>
          <div
            className="modal-card-resq facility-booking-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Redesigned Modal Header with Back to Facilities navigation */}
            <div className="resq-modal-header-redesigned" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
              <div className="modal-header-top-nav">
                <button
                  type="button"
                  className="modal-nav-back-pill"
                  onClick={() => setIsSlotModalOpen(false)}
                  title="Back to facilities list"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Facilities</span>
                </button>

                <span className="facility-modal-pill-tag">
                  <Store size={12} />
                  {selectedFacility.name}
                </span>

                <button
                  type="button"
                  className="modal-close-pink-btn"
                  onClick={() => setIsSlotModalOpen(false)}
                  title="Close"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="modal-header-headline-block">
                <h2 className="modal-headline-title">Pick Appointment Date & Time</h2>
                <p className="modal-headline-subtitle">
                  {selectedFacility.name} • {selectedFacility.address}
                </p>
              </div>
            </div>

            {/* Quick Date Selector Chips */}
            <div className="quick-date-chips-wrap">
              <span className="quick-date-label">Quick Pick:</span>
              <button
                type="button"
                className={`btn-quick-date-chip ${isSelectedDateToday ? 'active' : ''}`}
                onClick={() => handleQuickChipSelect(0)}
              >
                <Clock size={12} />
                <span>Today</span>
              </button>
              <button
                type="button"
                className={`btn-quick-date-chip ${isSelectedDateTomorrow ? 'active' : ''}`}
                onClick={() => handleQuickChipSelect(1)}
              >
                <CalendarIcon size={12} />
                <span>Tomorrow</span>
              </button>
              <button
                type="button"
                className={`btn-quick-date-chip ${
                  isSameDay(
                    selectedDate,
                    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)
                  )
                    ? 'active'
                    : ''
                }`}
                onClick={() => handleQuickChipSelect(2)}
              >
                <span>+2 Days</span>
              </button>
              <button
                type="button"
                className={`btn-quick-date-chip ${
                  isSameDay(
                    selectedDate,
                    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3)
                  )
                    ? 'active'
                    : ''
                }`}
                onClick={() => handleQuickChipSelect(3)}
              >
                <span>+3 Days</span>
              </button>
            </div>

            {/* 2-Column Body: Calendar on Left, Slots on Right */}
            <div className="facility-modal-2col">
              {/* Left Column: Calendar */}
              <div className="modal-calendar-col">
                <div className="calendar-month-header">
                  <span className="calendar-month-label">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <div className="calendar-arrow-btns">
                    <button
                      type="button"
                      className="cal-arrow-btn"
                      onClick={handlePrevMonth}
                      disabled={!canGoPrevMonth}
                      title={canGoPrevMonth ? 'Previous month' : 'Cannot view past months'}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      className="cal-arrow-btn"
                      onClick={handleNextMonth}
                      title="Next month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="calendar-weekdays-row">
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                  <span>Su</span>
                </div>

                <div className="calendar-days-grid">
                  {calendarDays.map((day, idx) => (
                    <button
                      key={`cal-day-${idx}-${day.dayNumber}`}
                      type="button"
                      disabled={day.isPast || !day.isCurrentMonth}
                      onClick={() => day.dateObj && handleDaySelect(day.dateObj)}
                      className={`cal-day-cell ${day.isPast ? 'disabled-past' : ''} ${
                        day.isToday ? 'is-today' : ''
                      } ${day.isSelected ? 'selected-day' : ''} ${
                        !day.isCurrentMonth ? 'other-month' : ''
                      }`}
                      title={
                        day.isPast
                          ? 'Past date is unavailable'
                          : day.isToday
                          ? 'Today'
                          : `Select ${day.dayNumber}`
                      }
                    >
                      {day.dayNumber}
                    </button>
                  ))}
                </div>

                <div className="calendar-legend-box">
                  <div className="legend-item">
                    <span className="legend-dot active" />
                    <span>Selected</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot available" />
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot past" />
                    <span>Past / Disabled</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Time Slots */}
              <div className="modal-slots-col">
                {/* Selected Day Header Banner */}
                <div className="slots-selected-day-banner">
                  <div className="slots-banner-left">
                    <div className="slots-calendar-icon-badge">
                      <CalendarIcon size={16} />
                    </div>
                    <div>
                      <h4 className="slots-banner-title">
                        {formattedDayTitle}
                        <span
                          className={`slots-relative-tag ${
                            isSelectedDateToday
                              ? 'today'
                              : isSelectedDateTomorrow
                              ? 'tomorrow'
                              : 'upcoming'
                          }`}
                        >
                          {isSelectedDateToday
                            ? 'TODAY'
                            : isSelectedDateTomorrow
                            ? 'TOMORROW'
                            : selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </h4>
                    </div>
                  </div>
                  <span className="slots-count-pill">
                    {availableSlotsCount} {availableSlotsCount === 1 ? 'slot' : 'slots'} available
                  </span>
                </div>

                {/* All Today Slots Passed Notice */}
                {allTodaySlotsPassed && (
                  <div className="today-all-past-alert">
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>All appointment slots for today have already passed. Please select tomorrow or an upcoming date.</span>
                  </div>
                )}

                {/* Morning Slots */}
                <div className="slots-period-section">
                  <div className="slot-period-header">
                    <Sunrise size={14} />
                    <span>Morning (08:30 AM - 11:30 AM)</span>
                  </div>
                  <div className="slots-period-grid">
                    {currentSlots
                      .filter((s) => s.period === 'Morning')
                      .map((slot) => {
                        const isSelected = selectedTimeSlot === slot.time;
                        return (
                          <button
                            key={`morning-${slot.time}`}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedTimeSlot(slot.time)}
                            className={`btn-slot-card ${isSelected ? 'selected' : ''} ${
                              slot.isPastTime ? 'disabled-past' : ''
                            } ${slot.isBooked ? 'disabled-booked' : ''} ${
                              slot.isAvailable ? 'available' : ''
                            }`}
                            title={
                              slot.isPastTime
                                ? 'Time has already passed today'
                                : slot.isBooked
                                ? 'Slot is fully booked'
                                : `Select ${slot.time}`
                            }
                          >
                            <span className="slot-card-time">{slot.time}</span>
                            <span
                              className={`slot-card-status ${
                                isSelected
                                  ? 'selected'
                                  : slot.isPastTime
                                  ? 'past'
                                  : slot.isBooked
                                  ? 'booked'
                                  : 'available'
                              }`}
                            >
                              {isSelected
                                ? 'Selected'
                                : slot.isPastTime
                                ? 'Past'
                                : slot.isBooked
                                ? 'Booked'
                                : 'Available'}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Afternoon Slots */}
                <div className="slots-period-section">
                  <div className="slot-period-header">
                    <Sun size={14} />
                    <span>Afternoon (01:00 PM - 04:00 PM)</span>
                  </div>
                  <div className="slots-period-grid">
                    {currentSlots
                      .filter((s) => s.period === 'Afternoon')
                      .map((slot) => {
                        const isSelected = selectedTimeSlot === slot.time;
                        return (
                          <button
                            key={`afternoon-${slot.time}`}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedTimeSlot(slot.time)}
                            className={`btn-slot-card ${isSelected ? 'selected' : ''} ${
                              slot.isPastTime ? 'disabled-past' : ''
                            } ${slot.isBooked ? 'disabled-booked' : ''} ${
                              slot.isAvailable ? 'available' : ''
                            }`}
                            title={
                              slot.isPastTime
                                ? 'Time has already passed today'
                                : slot.isBooked
                                ? 'Slot is fully booked'
                                : `Select ${slot.time}`
                            }
                          >
                            <span className="slot-card-time">{slot.time}</span>
                            <span
                              className={`slot-card-status ${
                                isSelected
                                  ? 'selected'
                                  : slot.isPastTime
                                  ? 'past'
                                  : slot.isBooked
                                  ? 'booked'
                                  : 'available'
                              }`}
                            >
                              {isSelected
                                ? 'Selected'
                                : slot.isPastTime
                                ? 'Past'
                                : slot.isBooked
                                ? 'Booked'
                                : 'Available'}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Evening Slots */}
                <div className="slots-period-section">
                  <div className="slot-period-header">
                    <Moon size={14} />
                    <span>Evening (05:00 PM - 06:30 PM)</span>
                  </div>
                  <div className="slots-period-grid">
                    {currentSlots
                      .filter((s) => s.period === 'Evening')
                      .map((slot) => {
                        const isSelected = selectedTimeSlot === slot.time;
                        return (
                          <button
                            key={`evening-${slot.time}`}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedTimeSlot(slot.time)}
                            className={`btn-slot-card ${isSelected ? 'selected' : ''} ${
                              slot.isPastTime ? 'disabled-past' : ''
                            } ${slot.isBooked ? 'disabled-booked' : ''} ${
                              slot.isAvailable ? 'available' : ''
                            }`}
                            title={
                              slot.isPastTime
                                ? 'Time has already passed today'
                                : slot.isBooked
                                ? 'Slot is fully booked'
                                : `Select ${slot.time}`
                            }
                          >
                            <span className="slot-card-time">{slot.time}</span>
                            <span
                              className={`slot-card-status ${
                                isSelected
                                  ? 'selected'
                                  : slot.isPastTime
                                  ? 'past'
                                  : slot.isBooked
                                  ? 'booked'
                                  : 'available'
                              }`}
                            >
                              {isSelected
                                ? 'Selected'
                                : slot.isPastTime
                                ? 'Past'
                                : slot.isBooked
                                ? 'Booked'
                                : 'Available'}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Selection Summary Callout */}
                {selectedTimeSlot ? (
                  <div className="slot-selection-summary-card active">
                    <div className="summary-card-left">
                      <CheckCircle2 size={18} className="summary-card-icon" />
                      <div>
                        <h5 className="summary-card-title">
                          {formattedDayDisplay} at {selectedTimeSlot}
                        </h5>
                        <p className="summary-card-sub">
                          {selectedFacility.name} • {referralData.scanType || 'Diagnostic Scan'} Requisition
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0A7E64' }}>Selected</span>
                  </div>
                ) : (
                  <div className="slot-selection-summary-card empty">
                    <div className="summary-card-left">
                      <Clock size={16} color="#94A3B8" />
                      <div>
                        <h5 className="summary-card-title" style={{ color: '#475569' }}>
                          No time slot selected
                        </h5>
                        <p className="summary-card-sub">Please select an available appointment time slot above.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer Buttons */}
                <div className="slot-modal-footer-row">
                  <button
                    type="button"
                    className="btn-resq-back"
                    onClick={() => setIsSlotModalOpen(false)}
                  >
                    <ArrowLeft size={14} />
                    <span>Change Facility</span>
                  </button>

                  <button
                    type="button"
                    className="btn-proceed-summary"
                    disabled={!selectedTimeSlot}
                    onClick={handleProceedToSummary}
                  >
                    <span>Confirm Slot & Continue</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requisition Order Document Preview Modal */}
      <RequisitionDocumentModal
        isOpen={isRequisitionModalOpen}
        onClose={() => setIsRequisitionModalOpen(false)}
        patientData={{
          fullName: referralData.fullName || 'Fatima Lawal',
          dob: referralData.dob || '14/05/1991',
          gender: referralData.gender || 'Female',
          phone: referralData.phone || '+234 803 123 4567',
          email: referralData.email || 'fatima.lawal@example.com',
          address: referralData.address || 'Victoria Island, Lagos',
        }}
        referralData={{
          scanType: referralData.scanType || 'MRI',
          bodyPart: referralData.bodyPart || 'Brain MRI',
          contrastOption: referralData.contrastOption || 'Not Specified',
          clinicalNote: referralData.clinicalNote,
          preferredCenter: providerName,
        }}
        clinicianData={{
          name: doctorName,
          specialty: doctorSpecialty,
          license: doctorLicense,
          facility: doctorFacility,
        }}
        fileName="Clinical_Requisition_Order.pdf"
      />
    </div>
  );
};
