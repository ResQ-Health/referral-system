import { useState, useEffect } from 'react';
import './App.css';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SignIn } from './components/SignIn';
import { Registration } from './components/Registration';
import type { RegistrationData } from './components/Registration';
import { CodeVerification } from './components/CodeVerification';
import { ReferralDashboard } from './components/ReferralDashboard';
import { PatientBookingPayment } from './components/PatientBookingPayment';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { signInWithGoogle, logout, auth, onAuthStateChanged } from './firebase';
import {
  apiRegister,
  apiVerifyCode,
  apiResendCode,
  apiLogin,
  apiGoogleSync,
} from './services/api';
import { scrollToTop } from './utils/scrollHelper';

export type ActiveScreen = 'signin' | 'registration' | 'verification' | 'dashboard' | 'patient-checkout';

export function App() {
  const [patientReferralId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/(?:patient\/referral|referral)\/([A-Za-z0-9_-]+)/);
      if (match && match[1]) return match[1];
      const params = new URLSearchParams(window.location.search);
      const qRef = params.get('referralId') || params.get('ref');
      if (qRef) return qRef;
    }
    return '';
  });

  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>(() => {
    if (typeof window !== 'undefined') {
      const isPatientReferral =
        window.location.pathname.includes('/patient/referral') ||
        window.location.pathname.includes('/referral/') ||
        window.location.search.includes('referralId=');
      if (isPatientReferral) {
        return 'patient-checkout';
      }
      if (window.location.pathname.includes('/clinician/dashboard')) {
        return 'dashboard';
      }
    }
    return 'signin';
  });

  // Always reset scroll to top when switching major screens
  useEffect(() => {
    scrollToTop();
  }, [currentScreen]);

  const [userEmail, setUserEmail] = useState<string>('');
  const [userData, setUserData] = useState<{
    email: string;
    fullname?: string;
    specialty?: string;
    licenseNumber?: string;
    phoneNumber?: string;
    practiceName?: string;
    isVerified?: boolean;
    photoURL?: string;
  }>({
    email: 'enaikeleomoh@gmail.com',
    fullname: 'Enaikele Omoh Kelvin',
    specialty: 'Consultant Specialist',
    practiceName: 'ResQ Medical Center',
    licenseNumber: 'MDCN-REG-847291',
    phoneNumber: '+234 802 345 6789',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Listen to Firebase Auth state for real Google user avatar & profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUserData((prev) => ({
          ...prev,
          email: fbUser.email || prev.email,
          fullname: fbUser.displayName || prev.fullname,
          photoURL: fbUser.photoURL || prev.photoURL,
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Check saved session in localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('resq_user');
      const savedToken = localStorage.getItem('resq_token');
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        if (parsed.user_type && parsed.user_type !== 'Clinician') {
          localStorage.removeItem('resq_user');
          localStorage.removeItem('resq_token');
          setCurrentScreen('signin');
          return;
        }
        if (parsed.fullname === 'Eunice Chisom') {
          parsed.fullname = 'Enaikele Omoh Kelvin';
        }
        setUserData(parsed);
        setUserEmail(parsed.email);
        setCurrentScreen('dashboard');
        if (!window.location.pathname.includes('/clinician/dashboard')) {
          window.history.pushState(null, '', '/clinician/dashboard/referral/');
        }
      }
    } catch (_) {}
  }, []);

  const navigateToScreen = (screen: ActiveScreen) => {
    setCurrentScreen(screen);
    if (screen === 'dashboard') {
      window.history.pushState(null, '', '/clinician/dashboard/referral/');
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  useEffect(() => {
    if (currentScreen === 'signin') {
      document.title = 'Sign In | ResQ Healthcare';
    } else if (currentScreen === 'registration') {
      document.title = 'Clinician Registration | ResQ Healthcare';
    } else if (currentScreen === 'verification') {
      document.title = 'Verify Email | ResQ Healthcare';
    } else if (currentScreen === 'dashboard') {
      document.title = 'Clinician Dashboard | ResQ Healthcare';
    } else if (currentScreen === 'patient-checkout') {
      document.title = 'Patient Referral & Booking | ResQ Healthcare';
    }
  }, [currentScreen]);

  const addToast = (type: 'success' | 'error', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [{ id, type, title, message }, ...prev.slice(0, 3)]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Sign In Handler
  const handleSignIn = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(email, password || 'password123');
      setIsLoading(false);

      if (res.requiresVerification) {
        setUserEmail(email);
        addToast('success', 'Verification Needed', 'Please enter the code sent to your email.');
        navigateToScreen('verification');
        return;
      }

      if (res.user && (res.user as any).user_type && (res.user as any).user_type !== 'Clinician') {
        addToast('error', 'Access Restricted', 'This portal is exclusively for Clinicians.');
        return;
      }

      const activeUser = res.user || {
        email,
        fullname: 'Enaikele Omoh Kelvin',
        specialty: 'Consultant Specialist',
        practiceName: 'ResQ Medical Center',
        licenseNumber: 'MDCN-REG-847291',
        phoneNumber: '+234 802 345 6789',
        isVerified: true,
      };

      setUserData(activeUser);
      setUserEmail(activeUser.email);
      if (res.token) localStorage.setItem('resq_token', res.token);
      localStorage.setItem('resq_user', JSON.stringify(activeUser));
      addToast('success', 'Welcome back!', `Signed in as ${activeUser.fullname || email}`);
      navigateToScreen('dashboard');
    } catch (err: any) {
      setIsLoading(false);
      addToast('error', 'Sign In Failed', err.message || 'Invalid email or password.');
    }
  };

  // 2. Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      const email = firebaseUser.email || '';
      const fullname = firebaseUser.displayName || 'Enaikele Omoh Kelvin';
      const photoURL = firebaseUser.photoURL || '';

      const res = await apiGoogleSync(email, fullname);
      setIsLoading(false);

      if (res.user && (res.user as any).user_type && (res.user as any).user_type !== 'Clinician') {
        addToast('error', 'Access Restricted', 'This portal is exclusively for Clinicians.');
        return;
      }

      const profile = {
        ...(res.user || {}),
        email,
        fullname,
        photoURL,
        specialty: res.user?.specialty || 'Specialist',
        licenseNumber: res.user?.licenseNumber || 'Verified Google Auth',
        practiceName: res.user?.practiceName || 'ResQ Health Network',
        isVerified: true,
      };

      setUserData(profile);
      setUserEmail(email);
      if (res.token) localStorage.setItem('resq_token', res.token);
      localStorage.setItem('resq_user', JSON.stringify(profile));

      addToast('success', 'Email verified!', 'Your email has been successfully verified. Welcome aboard!');
      navigateToScreen('dashboard');
    } catch (err: any) {
      setIsLoading(false);
      console.error('Google Sign In Error:', err);
      addToast(
        'error',
        'Google Sign In',
        err.message?.includes('popup-closed-by-user')
          ? 'Sign in popup was closed.'
          : err.message || 'Could not authenticate with Google.'
      );
    }
  };

  // 3. Registration Handler
  const handleRegistrationSubmit = async (data: RegistrationData) => {
    setIsLoading(true);
    try {
      await apiRegister(data);
      setIsLoading(false);

      setUserEmail(data.email);
      setUserData({
        email: data.email,
        fullname: data.fullname,
        licenseNumber: data.licenseNumber,
        phoneNumber: data.phoneNumber,
        specialty: data.specialty,
        practiceName: data.practiceName,
        isVerified: false,
      });

      addToast('success', 'Code Sent!', `A 6-digit verification code has been sent to ${data.email}`);
      navigateToScreen('verification');
    } catch (err: any) {
      setIsLoading(false);
      addToast('error', 'Registration Error', err.message || 'Unable to register account.');
    }
  };

  // 4. Verification Code Handler
  const handleVerifyCode = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await apiVerifyCode(userEmail, code);
      setIsLoading(false);

      if (res.success) {
        const verifiedUser = {
          ...userData,
          email: userEmail,
          isVerified: true,
          ...(res.user || {}),
        };

        setUserData(verifiedUser);
        if (res.token) localStorage.setItem('resq_token', res.token);
        localStorage.setItem('resq_user', JSON.stringify(verifiedUser));

        addToast(
          'success',
          'Email verified!',
          'Your email has been successfully verified. Welcome aboard!'
        );

        setTimeout(() => {
          navigateToScreen('dashboard');
        }, 600);
      }
    } catch (err: any) {
      setIsLoading(false);
      addToast(
        'error',
        'Verification failed!',
        "Couldn't verify your email. Click below to resend the link."
      );
    }
  };

  // 5. Resend Code Handler
  const handleResendCode = async () => {
    try {
      await apiResendCode(userEmail);
      addToast('success', 'New code sent!', `We have dispatched a new 6-digit code to ${userEmail}.`);
    } catch (err: any) {
      addToast('error', 'Resend Failed', 'Unable to send a new code. Please try again.');
    }
  };

  // 6. Sign Out
  const handleSignOut = async () => {
    try {
      await logout();
    } catch (_) {}
    localStorage.removeItem('resq_token');
    localStorage.removeItem('resq_user');
    setUserData({ email: '' });
    setUserEmail('');
    navigateToScreen('signin');
    addToast('success', 'Signed Out', 'You have been successfully signed out.');
  };

  // If on patient booking and payment screen, render PatientBookingPayment
  if (currentScreen === 'patient-checkout') {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <PatientBookingPayment
          referralId={patientReferralId}
          onBackToHome={() => {
            window.history.pushState(null, '', '/');
            setCurrentScreen('signin');
          }}
          onAddToast={addToast}
        />
      </>
    );
  }

  // If on clinician dashboard, render the full-page dashboard directly
  if (currentScreen === 'dashboard') {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <ReferralDashboard
          user={userData}
          onSignOut={handleSignOut}
          onAddToast={addToast}
          onUpdateUser={(updated) => setUserData((prev) => ({ ...prev, ...updated }))}
        />
      </>
    );
  }

  // Authentication screens (Sign In, Registration, Code Verification)
  return (
    <div className="app-wrapper">
      {/* Toast Overlay Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header with ResQ Logo and context navigation */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => navigateToScreen(screen)}
      />

      {/* Main Authentic Flow */}
      <main className="main-content">
        {currentScreen === 'signin' && (
          <SignIn
            onSignInSuccess={handleSignIn}
            onGoogleSignIn={handleGoogleSignIn}
            onNavigateToRegister={() => navigateToScreen('registration')}
            isLoading={isLoading}
          />
        )}

        {currentScreen === 'registration' && (
          <Registration
            onNext={handleRegistrationSubmit}
            isLoading={isLoading}
          />
        )}

        {currentScreen === 'verification' && (
          <CodeVerification
            email={userEmail || 'xyzdiagnosticcenter@gmail.com'}
            onVerified={handleVerifyCode}
            onResend={handleResendCode}
            isVerifying={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
