# ResQ Healthcare — REST API Documentation

Official REST API documentation for the **ResQ Healthcare Clinician Referral & Diagnostic Platform**.

---

## 1. Overview & Base URL

The ResQ backend is built on **Node.js**, **Express**, **MongoDB Atlas**, **JWT Authentication**, and **Nodemailer SMTP**.

- **Base URL (Local Development)**: `http://localhost:6000/api`
- **Default Port**: `6000`
- **Content-Type**: `application/json`
- **Authentication Scheme**: `Bearer <JWT_TOKEN>` in the `Authorization` header.

---

## 2. Authentication & Authorization Standards

### Token Verification
Protected routes expect a standard Bearer token:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Role-Based Access Control (RBAC)
- **Portal Exclusivity**: The clinician portal strictly requires `user_type === 'Clinician'`. Accounts registered as `Patient` or `DiagnosticProvider` will receive `403 Forbidden` if attempting to log in or access clinician endpoints.
- **Email Immutability**: A registered user's `email` is their primary identifier and cannot be modified via profile update endpoints.

### Standard Response Structure

#### Success Response
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Detailed error explanation"
}
```

---

## 3. Endpoints Reference

### Table of Endpoints

| Category | Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/health` | Public | Service health & timestamp |
| **Auth** | `POST` | `/auth/register` | Public | Clinician registration & 6-digit OTP dispatch |
| **Auth** | `POST` | `/auth/verify-code` | Public | Verify 6-digit OTP & issue JWT token |
| **Auth** | `POST` | `/auth/resend-code` | Public | Resend 6-digit OTP email |
| **Auth** | `POST` | `/auth/login` | Public | Clinician email/password sign-in |
| **Auth** | `POST` | `/auth/google` | Public | Google OAuth login & profile sync |
| **Auth** | `GET` | `/auth/me` | Bearer | Get current authenticated clinician profile |
| **Auth** | `PUT` | `/auth/profile` | Bearer | Update clinician profile (email locked) |
| **Catalog** | `GET` | `/clinical/catalog` | Public | Get 8 scan types, 67 body parts, contrast options |
| **Catalog** | `POST` | `/clinical/seed` | Bearer | Seed or re-seed clinical catalog |
| **Patients** | `GET` | `/patients/lookup` | Bearer | Real-time existing patient search by email |
| **Patients** | `GET` | `/patients` | Bearer | List all registered patient profiles |
| **Referrals**| `POST` | `/referrals` | Bearer | Create referral & send patient email |
| **Referrals**| `GET` | `/referrals` | Bearer | List referrals (filterable by doctorEmail) |
| **Referrals**| `GET` | `/referrals/:id` | Public | Get single referral details by ID (Patient Link) |
| **Referrals**| `POST` | `/referrals/:id/pay` | Public | Process patient booking payment (Patient Link) |

---

## 4. System & Health Check

### `GET /api/health`
Returns the operational health status and server environment.

#### Request Example
```bash
curl -X GET http://localhost:6000/api/health
```

#### Response (`200 OK`)
```json
{
  "status": "online",
  "service": "ResQ Healthcare Authentication & Clinical Server",
  "environment": "development",
  "timestamp": "2026-09-12T21:57:08.339Z"
}
```

---

## 5. Authentication Endpoints

### `POST /api/auth/register`
Registers a new Clinician account and sends a 6-digit verification code to their email.

#### Request Body
```json
{
  "email": "doctor@hospital.org",
  "password": "SecurePassword123",
  "fullname": "Dr. Sarah Jenkins",
  "licenseNumber": "MDCN-REG-847291",
  "phoneNumber": "+234 802 345 6789",
  "specialty": "Consultant Radiologist",
  "practiceName": "Lagos University Teaching Hospital",
  "practiceAddress": "Idi-Araba, Surulere, Lagos"
}
```

#### Response (`201 Created` / `200 OK`)
```json
{
  "success": true,
  "message": "Registration successful. A 6-digit code was sent to doctor@hospital.org",
  "email": "doctor@hospital.org"
}
```

---

### `POST /api/auth/verify-code`
Validates the 6-digit OTP sent to the user's email, marks the user as verified, and returns a JWT access token.

#### Request Body
```json
{
  "email": "doctor@hospital.org",
  "code": "773931"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Email verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_8fa910bc",
    "email": "doctor@hospital.org",
    "user_type": "Clinician",
    "fullname": "Dr. Sarah Jenkins",
    "specialty": "Consultant Radiologist",
    "licenseNumber": "MDCN-REG-847291",
    "practiceName": "Lagos University Teaching Hospital",
    "isVerified": true,
    "email_verified": true
  }
}
```

---

### `POST /api/auth/resend-code`
Dispatches a new 6-digit verification code to the registered email address.

#### Request Body
```json
{
  "email": "doctor@hospital.org"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "A new verification code has been dispatched to doctor@hospital.org"
}
```

---

### `POST /api/auth/login`
Authenticates a clinician using email and password.

#### Request Body
```json
{
  "email": "doctor@hospital.org",
  "password": "SecurePassword123"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_8fa910bc",
    "email": "doctor@hospital.org",
    "user_type": "Clinician",
    "fullname": "Dr. Sarah Jenkins",
    "specialty": "Consultant Radiologist",
    "licenseNumber": "MDCN-REG-847291",
    "practiceName": "Lagos University Teaching Hospital",
    "isVerified": true
  }
}
```

#### Error Response (`403 Forbidden` - Role Guard)
```json
{
  "success": false,
  "message": "Access denied. This portal is exclusively for Clinicians. Your account is registered as a Patient."
}
```

---

### `POST /api/auth/google`
Synchronizes Google OAuth logins and verifies clinician eligibility.

#### Request Body
```json
{
  "email": "doctor.google@gmail.com",
  "fullname": "Dr. Google Practitioner"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_73ba82cf",
    "email": "doctor.google@gmail.com",
    "user_type": "Clinician",
    "fullname": "Dr. Google Practitioner",
    "specialty": "Medical Specialist",
    "isVerified": true
  }
}
```

---

### `GET /api/auth/me`
Fetches the currently authenticated clinician's profile.

#### Headers
```http
Authorization: Bearer <JWT_TOKEN>
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "_id": "670c5e7b23a9d1...",
    "email": "doctor@hospital.org",
    "user_type": "Clinician",
    "fullname": "Dr. Sarah Jenkins",
    "specialty": "Consultant Radiologist",
    "licenseNumber": "MDCN-REG-847291",
    "phoneNumber": "+234 802 345 6789",
    "practiceName": "Lagos University Teaching Hospital",
    "practiceAddress": "Idi-Araba, Surulere, Lagos",
    "isVerified": true
  }
}
```

---

### `PUT /api/auth/profile`
Updates clinician credentials and practice information.

> [!IMPORTANT]
> **Email Immutability**: The user's registered email address **cannot** be modified through this endpoint. Any `email` field passed in the payload will be ignored to maintain security and authentication integrity.

#### Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Request Body
```json
{
  "fullname": "Dr. Sarah Jenkins, MD, FWACS",
  "specialty": "Consultant Radiologist & Neuroimaging Specialist",
  "licenseNumber": "MDCN-REG-847291",
  "phoneNumber": "+234 809 111 2233",
  "practiceName": "ResQ Advanced Imaging Institute",
  "practiceAddress": "Plot 12, Victoria Island, Lagos"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Clinician profile updated successfully",
  "user": {
    "id": "usr_8fa910bc",
    "email": "doctor@hospital.org",
    "user_type": "Clinician",
    "fullname": "Dr. Sarah Jenkins, MD, FWACS",
    "specialty": "Consultant Radiologist & Neuroimaging Specialist",
    "licenseNumber": "MDCN-REG-847291",
    "phoneNumber": "+234 809 111 2233",
    "practiceName": "ResQ Advanced Imaging Institute",
    "practiceAddress": "Plot 12, Victoria Island, Lagos",
    "isVerified": true
  }
}
```

---

## 6. Clinical Catalog Endpoints

### `GET /api/clinical/catalog`
Fetches all clinical imaging catalog parameters seeded in MongoDB without duplicates:
- **8 Scan Types**: Computed Tomography (CT), Magnetic Resonance Imaging (MRI), Ultrasound, X-Ray, Mammography, Fluoroscopy, Nuclear Medicine, PET/CT Scan.
- **67 Body Parts**: Complete anatomical catalog grouped by clinical target.
- **4 Contrast Enhancement Protocols**: Without Contrast, Not Specified, With Contrast (IV), With & Without Contrast.

#### Request Example
```bash
curl -X GET http://localhost:6000/api/clinical/catalog
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "scanTypes": [
    "CT Scan (Computed Tomography)",
    "MRI Scan (Magnetic Resonance Imaging)",
    "Ultrasound (US)",
    "X-Ray",
    "Mammography",
    "Fluoroscopy",
    "Nuclear Medicine",
    "PET/CT Scan"
  ],
  "bodyParts": [
    "Abdomen",
    "Abdomen & Pelvis",
    "Abdominal Wall",
    "Aorta",
    "Ankle",
    "Arm / Upper Extremity",
    "Axilla",
    "Brain",
    "Breast",
    "Chest",
    "Clavicle",
    "Coccyx / Sacrum",
    "Colon",
    "Coronary Arteries",
    "Elbow",
    "Esophagus",
    "Eye",
    "Face",
    "Facial Bones",
    "Femur",
    "Fingers",
    "Foot",
    "Forearm",
    "Gallbladder / Hepatobiliary System",
    "Hand",
    "Head",
    "Heel / Calcaneus",
    "Hip",
    "Humerus",
    "Inguinal Canal",
    "Jaw / Mandible",
    "Kidney",
    "Knee",
    "Liver",
    "Liver & Spleen",
    "Lower Extremity / Leg",
    "Lumbar Plexus",
    "Lumbar Spine",
    "Mastoids",
    "Neck",
    "Neck Soft Tissue",
    "Nasal Bones",
    "Orbit / Skull",
    "Parathyroid",
    "Pelvis",
    "Ribs",
    "Renal System",
    "Sacroiliac Joints",
    "Scapula",
    "Shoulder",
    "Sinuses",
    "Skull",
    "Small Bowel",
    "Soft Tissue",
    "Spine",
    "Sternum",
    "Sternoclavicular Joint",
    "Stomach / Upper GI Tract",
    "Testicles",
    "Temporomandibular Joint (TMJ)",
    "Thoracic Spine",
    "Thyroid",
    "Tibia / Fibula",
    "Toes",
    "Urological System",
    "Whole Body",
    "Wrist"
  ],
  "contrastOptions": [
    "Not Specified",
    "Without Contrast",
    "With Contrast (IV)",
    "With & Without Contrast"
  ],
  "count": {
    "scanTypes": 8,
    "bodyParts": 67
  }
}
```

---

## 7. Patient Directory & Lookup Endpoints

### `GET /api/patients/lookup?email=...`
Searches MongoDB for registered ResQ patients by email. Used for live auto-fill in Step 1 of the referral workflow.

> [!NOTE]
> The auto-filled patient details are isolated inside the **Existing Users** accordion in the UI and do not populate or expand the New User section.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string | Yes | Email address of the patient to look up |

#### Request Example
```bash
curl -X GET "http://localhost:6000/api/patients/lookup?email=1ieuj83trq@yzcalo.com" \
  -H "Authorization: Bearer <CLINICIAN_JWT_TOKEN>"
```

#### Response (`200 OK` - Match Found)
```json
{
  "success": true,
  "found": true,
  "message": "Registered ResQ patient details loaded",
  "patient": {
    "id": "670c5e7b23a9d1...",
    "fullName": "Tunde Oladipo",
    "gender": "Male",
    "dob": "1990-05-14",
    "email": "1ieuj83trq@yzcalo.com",
    "phone": "+234 802 345 6789",
    "address": "15 Victoria Island, Lagos",
    "source": "mongodb"
  }
}
```

#### Response (`200 OK` - Not Found)
```json
{
  "success": true,
  "found": false,
  "message": "No registered patient found with this email"
}
```

---

### `GET /api/patients`
Retrieves a directory of all registered patients in the system with formatted initials, contact details, and registration dates.

#### Request Example
```bash
curl -X GET http://localhost:6000/api/patients \
  -H "Authorization: Bearer <CLINICIAN_JWT_TOKEN>"
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "patients": [
    {
      "id": "670c5e7b23a9d1...",
      "name": "Tunde Oladipo",
      "email": "1ieuj83trq@yzcalo.com",
      "gender": "Male",
      "dob": "1990-05-14",
      "phone": "+234 802 345 6789",
      "address": "15 Victoria Island, Lagos",
      "createdRelative": "2 hours ago",
      "createdDate": "Sep 12, 2026",
      "initials": "TO"
    }
  ]
}
```

---

## 8. Referrals & Requisitions Endpoints

### `POST /api/referrals`
Creates a medical referral in MongoDB and automatically dispatches a patient notification email with a secure checkout link.

#### Request Body
```json
{
  "doctorEmail": "doctor@hospital.org",
  "doctorName": "Dr. Sarah Jenkins",
  "doctorSpecialty": "Consultant Radiologist",
  "doctorPractice": "ResQ Medical Center",
  "patientName": "Tunde Oladipo",
  "patientEmail": "1ieuj83trq@yzcalo.com",
  "patientPhone": "+234 802 345 6789",
  "patientGender": "Male",
  "patientDob": "1990-05-14",
  "patientAddress": "15 Victoria Island, Lagos",
  "scanType": "MRI Scan (Magnetic Resonance Imaging)",
  "bodyPart": "Brain",
  "contrastOption": "With Contrast (IV)",
  "clinicalNote": "Patient presents with persistent severe unilateral cephalalgia and visual aura.",
  "priority": "Urgent",
  "facilityId": "fac-1",
  "facilityName": "Phoebe Diagnostic & Imaging Center",
  "facilityAddress": "24 Adeola Odeku, Victoria Island, Lagos",
  "facilityPrice": 85000,
  "slot": {
    "date": "Thu 20 February",
    "time": "10:10 am",
    "display": "Thu 20 February at 10:10 am"
  }
}
```

#### Request Example
```bash
curl -X POST http://localhost:6000/api/referrals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CLINICIAN_JWT_TOKEN>" \
  -d '{
    "patientName": "Tunde Oladipo",
    "patientEmail": "1ieuj83trq@yzcalo.com",
    "scanType": "MRI Scan (Magnetic Resonance Imaging)",
    "bodyPart": "Brain",
    "contrastOption": "With Contrast (IV)",
    "priority": "Urgent",
    "facilityName": "Phoebe Diagnostic & Imaging Center",
    "facilityPrice": 85000
  }'
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Referral created successfully and patient notified",
  "referral": {
    "_id": "670c79f12a...",
    "referralId": "REF-918234",
    "doctorEmail": "doctor@hospital.org",
    "patientName": "Tunde Oladipo",
    "patientEmail": "1ieuj83trq@yzcalo.com",
    "scanType": "MRI Scan (Magnetic Resonance Imaging)",
    "bodyPart": "Brain",
    "contrastOption": "With Contrast (IV)",
    "status": "Submitted",
    "paymentStatus": "Pending",
    "referralLink": "http://localhost:5173/patient/checkout/REF-918234",
    "createdAt": "2026-09-12T22:30:00.000Z"
  }
}
```

---

### `GET /api/referrals`
Retrieves referrals list. Optional query parameter `doctorEmail` filters requisitions created by that specific doctor.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `doctorEmail` | string | No | Filter referrals by the clinician's email address |

#### Request Example
```bash
curl -X GET "http://localhost:6000/api/referrals?doctorEmail=doctor@hospital.org" \
  -H "Authorization: Bearer <CLINICIAN_JWT_TOKEN>"
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "count": 1,
  "referrals": [
    {
      "id": "REF-918234",
      "referralId": "REF-918234",
      "doctorEmail": "doctor@hospital.org",
      "patientName": "Tunde Oladipo",
      "patientEmail": "1ieuj83trq@yzcalo.com",
      "scanType": "MRI Scan (Magnetic Resonance Imaging)",
      "bodyPart": "Brain",
      "contrastOption": "With Contrast (IV)",
      "status": "Submitted",
      "paymentStatus": "Pending",
      "createdAt": "2026-09-12T22:30:00.000Z"
    }
  ]
}
```

---

### `GET /api/referrals/:id`
Fetches complete details of a referral using either the human-readable `referralId` (e.g., `REF-918234`) or MongoDB `_id`.

#### Request Example
```bash
curl -X GET http://localhost:6000/api/referrals/REF-918234
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "referral": {
    "referralId": "REF-918234",
    "doctorEmail": "doctor@hospital.org",
    "doctorName": "Dr. Sarah Jenkins",
    "patientName": "Tunde Oladipo",
    "patientEmail": "1ieuj83trq@yzcalo.com",
    "scanType": "MRI Scan (Magnetic Resonance Imaging)",
    "bodyPart": "Brain",
    "contrastOption": "With Contrast (IV)",
    "facilityName": "Phoebe Diagnostic & Imaging Center",
    "facilityPrice": 85000,
    "status": "Submitted",
    "paymentStatus": "Pending"
  }
}
```

---

### `POST /api/referrals/:id/pay`
Processes patient checkout payment for an existing referral and updates status to `Confirmed`.

#### Request Body
```json
{
  "paymentMethod": "Debit / Credit Card",
  "reference": "TXN_987654321_RESQ"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Payment processed successfully. Appointment confirmed.",
  "referral": {
    "referralId": "REF-918234",
    "status": "Confirmed",
    "paymentStatus": "Paid",
    "paymentDetails": {
      "method": "Debit / Credit Card",
      "reference": "TXN_987654321_RESQ",
      "paidAt": "2026-09-12T22:45:00.000Z"
    }
  }
}
```
