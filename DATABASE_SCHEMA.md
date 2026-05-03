# Palugada Supabase Database Schema

## Overview
The Palugada application uses Supabase (PostgreSQL) with the following 12 main tables. This document outlines the complete schema structure, field definitions, and relationships.

---

## 1. **users** - User Accounts & Authentication
**Purpose:** Store user authentication and account information

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid/string | Primary key - User ID | Format: `google-{sub}` or `user-{timestamp}` |
| email | string | Email address (unique) | Required for login |
| password | string | Password (hashed) | Only for non-OAuth users |
| name | string | Full name | |
| nik | string | National ID number | Indonesian ID (KTP) |
| phone | string | Phone number | |
| address | string | Physical address | |
| role | string | User role | `admin` or `member` |
| status | string | Account status | `active`, `pending_profile`, `rejected` |
| google_id | string | Google OAuth ID | For Google login integration |
| is_2fa_enabled | boolean | Two-factor auth enabled | Uses Google Authenticator |
| two_factor_secret | string | TOTP secret key | For Google Authenticator setup |
| selfie_url | string | Selfie photo URL | KYC verification |
| ktp_url | string | KTP/ID photo URL | KYC verification |
| job_title | string | Employment title | Onboarding data |
| salary_range | string | Salary bracket | Onboarding data |
| emergency_contact_name | string | Emergency contact name | |
| emergency_contact_phone | string | Emergency contact phone | |
| total_savings | decimal | Total member savings | Cumulative savings |
| total_shu | decimal | Total SHU (profit share) | Indonesian cooperative share |
| last_updated_date | timestamp | Last profile update | |
| created_at | timestamp | Account creation timestamp | |

**Indexes:** email, role, status
**Relations:** 1 user → 1 member (for members only)

---

## 2. **members** - Member Information
**Purpose:** Cooperative member profiles (extended user data)

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid/string | Primary key - Member ID | Same as user ID |
| name | string | Member name | |
| email | string | Email address | |
| nik | string | National ID number | |
| phone | string | Phone number | |
| address | string | Physical address | |
| type | string | Member type | `Reguler`, `Luar Biasa`, etc. |
| status | string | Member status | `Pending`, `Aktif`, `Ditolak`, `Resigned` |
| join_date | date | Date member joined cooperative | YYYY-MM-DD format |
| company_code | string | Company/cooperative code | Default: `PALUGADA` |
| system_status | integer | System status flag | 1 = active, 0 = inactive |
| is_deleted | integer | Soft delete flag | 1 = deleted, 0 = active |
| created_by | string | Creator user ID | Typically `system` or admin ID |
| created_date | timestamp | Record creation timestamp | |
| last_updated_by | string | Last modifier user ID | |
| last_updated_date | timestamp | Last modification timestamp | |
| selfie_url | string | Selfie photo URL | KYC verification |
| ktp_url | string | KTP photo URL | KYC verification |
| job_title | string | Employment title | |
| salary_range | string | Salary bracket | |
| emergency_contact_name | string | Emergency contact name | |
| emergency_contact_phone | string | Emergency contact phone | |
| total_savings | decimal | Total member savings | |
| total_shu | decimal | Total SHU (profit share) | |

**Indexes:** id, email, status, join_date
**Relations:** 1 member → 1 user (inverse relation)

---

## 3. **audit_logs** - Audit Trail
**Purpose:** Track all administrative actions for compliance

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid | Primary key | Auto-generated |
| user_id | uuid/string | User who performed action | Foreign key to users.id |
| action | string | Action type | `LOGIN`, `CREATE_LOAN`, `APPROVE_MEMBER`, etc. |
| entity_type | string | Type of entity affected | `USER`, `MEMBER`, `LOAN`, `TRANSACTION` |
| entity_id | string | ID of affected entity | |
| details | jsonb/text | Additional action details | JSON object with action-specific data |
| created_at | timestamp | Timestamp of action | |

**Indexes:** user_id, entity_type, created_at
**Relations:** Many audit_logs → 1 user

---

## 4. **notifications** - User Notifications
**Purpose:** System notifications for users (member approvals, loan updates, etc.)

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid | Primary key | Auto-generated |
| user_id | uuid/string | Recipient user ID | Foreign key to users.id |
| title | string | Notification title | |
| message | string | Notification message | |
| type | string | Notification type | `info`, `success`, `warning`, `error` |
| link | string | Action link | Link to relevant page (e.g., `/approvals`) |
| is_read | boolean | Read status | Default: false |
| created_at | timestamp | Timestamp | |

**Indexes:** user_id, is_read, created_at
**Relations:** Many notifications → 1 user

---

## 5. **transactions** - Financial Transactions
**Purpose:** Record all member financial activities (deposits, withdrawals, savings)

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid | Primary key | Auto-generated |
| member_id | uuid/string | Member ID | Foreign key to members.id |
| type | string | Transaction type | `Deposit`, `Withdrawal`, `Transfer` |
| category | string | Transaction category | `Savings`, `Loan`, `SHU` |
| amount | decimal | Transaction amount | In Rupiah |
| description | string | Transaction description | |
| status | string | Transaction status | `pending`, `success`, `failed` |
| created_at | timestamp | Transaction timestamp | |

**Indexes:** member_id, type, category, created_at
**Relations:** Many transactions → 1 member

---

## 6. **loans** - Loan Records
**Purpose:** Track all loans issued to members

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid/string | Primary key - Loan ID | Format: `LN-{timestamp}` |
| member_id | uuid/string | Member ID (borrower) | Foreign key to members.id |
| member_name | string | Member name (denormalized) | Copy of member.name |
| amount | decimal | Loan principal amount | In Rupiah |
| duration | integer | Loan duration in months | |
| purpose | string | Loan purpose | |
| status | string | Loan status | `pending`, `approved`, `rejected`, `paid_off` |
| date | date | Loan issuance date | |
| interest_rate | decimal | Monthly interest rate | Percentage (e.g., 1.5) |
| total_interest | decimal | Total interest amount | |
| total_repayment | decimal | Principal + interest | Total to be repaid |
| remaining_balance | decimal | Outstanding balance | Initially = total_repayment |
| paid_amount | decimal | Amount paid so far | Cumulative payments |
| company_code | string | Company code | Default: `PALUGADA` |
| system_status | integer | System status flag | 1 = active, 0 = inactive |
| is_deleted | integer | Soft delete flag | |
| created_by | string | Creator user ID | |
| created_date | timestamp | Record creation timestamp | |
| last_updated_by | string | Last modifier user ID | |
| last_updated_date | timestamp | Last modification timestamp | |

**Indexes:** member_id, status, created_date
**Relations:** 1 loan → 1 member; 1 loan → Many loan_schedules; 1 loan → Many loan_repayments

---

## 7. **loan_schedules** - Loan Payment Schedules
**Purpose:** Monthly/periodic payment schedule for each loan

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | string | Primary key | Format: `SCH-{loanId}-{installmentNumber}` |
| loan_id | string | Loan ID | Foreign key to loans.id |
| member_id | uuid/string | Member ID | Foreign key to members.id |
| installment_number | integer | Payment installment #1, #2, etc. | |
| due_date | date | Payment due date | |
| amount_due | decimal | Amount due for this period | |
| paid_date | date | Actual payment date | NULL if unpaid |
| status | string | Payment status | `Unpaid`, `Paid`, `Overdue` |
| company_code | string | Company code | Default: `PALUGADA` |
| is_deleted | integer | Soft delete flag | |
| created_by | string | Creator | |
| created_date | timestamp | Creation timestamp | |
| last_updated_by | string | Last modifier | |
| last_updated_date | timestamp | Last modification timestamp | |

**Indexes:** loan_id, member_id, due_date, status
**Relations:** Many loan_schedules → 1 loan

---

## 8. **loan_repayments** - Loan Repayment Records
**Purpose:** Individual repayment transactions against loans

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | string | Primary key | Format: `REP-{timestamp}-{random}` |
| loan_id | string | Loan ID | Foreign key to loans.id |
| schedule_id | string | Associated schedule ID | Optional foreign key |
| amount_paid | decimal | Amount paid in this transaction | |
| payment_date | date | Payment date | |
| status | string | Payment status | `completed`, `pending`, `failed` |
| company_code | string | Company code | Default: `PALUGADA` |
| created_by | string | Creator | |
| created_date | timestamp | Creation timestamp | |
| last_updated_by | string | Last modifier | |
| last_updated_date | timestamp | Last modification timestamp | |

**Indexes:** loan_id, payment_date, status
**Relations:** Many loan_repayments → 1 loan; Many → 1 loan_schedules

---

## 9. **savings** - Member Savings (Legacy)
**Purpose:** Historical savings records (being superseded by transactions table)

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid/string | Primary key | |
| member_id | uuid/string | Member ID | Foreign key to members.id |
| member_name | string | Member name (denormalized) | |
| amount | decimal | Savings amount | |
| type | string | Savings type | `Pokok`, `Wajib`, `Sukarela` (Indonesian: Mandatory, Voluntary) |
| date | date | Savings transaction date | |
| company_code | string | Company code | Default: `PALUGADA` |
| status | integer | Status flag | 1 = active, 0 = inactive |
| is_deleted | integer | Soft delete flag | |
| created_by | string | Creator | |
| created_date | timestamp | Creation timestamp | |
| last_updated_by | string | Last modifier | |
| last_updated_date | timestamp | Last modification timestamp | |

**Note:** This table is being replaced by the `transactions` table. New savings are recorded in `transactions` with category='Savings'.

---

## 10. **finance** - Finance Records
**Purpose:** General ledger entries for cooperative finances

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid/string | Primary key | Format: `FIN-{timestamp}` or `FIN-REP-{timestamp}` |
| type | string | Finance type | `Income`, `Expense` |
| category | string | Finance category | `Pembayaran Pinjaman`, `Savings`, etc. |
| amount | decimal | Amount | In Rupiah |
| description | string | Description | |
| date | date | Transaction date | |
| company_code | string | Company code | Default: `PALUGADA` |
| status | integer | Status flag | 1 = active, 0 = inactive |
| is_deleted | integer | Soft delete flag | |
| created_by | string | Creator | |
| created_date | timestamp | Creation timestamp | |
| last_updated_by | string | Last modifier | |
| last_updated_date | timestamp | Last modification timestamp | |

**Indexes:** type, category, date, created_date
**Relations:** Related to loans and member transactions

---

## 11. **reports_data** - Complaints/Reports
**Purpose:** Store member complaints and cooperative reports

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid/string | Primary key | |
| title | string | Report title | |
| category | string | Report category | |
| description | string | Detailed description | |
| location | string | Location (if applicable) | |
| images | jsonb/array | Image URLs | Array of uploaded images |
| status | string | Report status | `open`, `in_review`, `resolved`, `closed` |
| is_anonymous | boolean | Anonymous report flag | |
| user_id | uuid/string | Reporter user ID | Foreign key to users.id |
| user_name | string | Reporter name | |
| company_code | string | Company code | Default: `PALUGADA` |
| system_status | integer | System status flag | |
| is_deleted | integer | Soft delete flag | |
| created_by | string | Creator | |
| created_date | timestamp | Creation timestamp | |
| last_updated_by | string | Last modifier | |
| last_updated_date | timestamp | Last modification timestamp | |

**Indexes:** status, user_id, created_date
**Relations:** 1 report → Many report_responses

---

## 12. **report_responses** - Report Responses
**Purpose:** Responses and follow-ups to complaints/reports

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| id | uuid/string | Primary key | |
| report_id | string | Report ID | Foreign key to reports_data.id |
| message | string | Response message | |
| responder_id | uuid/string | Responder user ID | Foreign key to users.id |
| responder_name | string | Responder name | |
| responder_role | string | Responder role | `admin`, `supervisor`, etc. |
| company_code | string | Company code | Default: `PALUGADA` |
| status | integer | Status flag | 1 = active, 0 = inactive |
| is_deleted | integer | Soft delete flag | |
| created_by | string | Creator | |
| created_date | timestamp | Creation timestamp | |
| last_updated_by | string | Last modifier | |
| last_updated_date | timestamp | Last modification timestamp | |

**Indexes:** report_id, responder_id, created_date
**Relations:** Many report_responses → 1 report; Many → 1 user (responder)

---

## Entity-Relationship Diagram

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │◄─────────────────┐
│ email       │                   │ (1:1)
│ role        │                   │
│ ...         │                   │
└─────────────┘                   │
       ▲                          │
       │ (1:N)                    │
       │                     ┌──────────┐
       │          ┌─────────►│ members  │
       │          │(1:1)     ├──────────┤
┌──────┴──────────┤          │ id (PK)  │◄──────────┐ (1:N)
│ audit_logs      │          │ name     │           │
├─────────────────┤          │ status   │      ┌────┴──────────┐
│ id (PK)         │          │ ...      │      │ transactions  │
│ user_id (FK)    │          └──────────┘      ├───────────────┤
│ action          │                 ▲           │ id (PK)       │
│ ...             │          (1:N)  │           │ member_id(FK) │
└─────────────────┘                 │           │ type          │
                                    │           │ amount        │
       ┌─────────────────────────────┘           │ ...           │
       │ (1:N)                                   └───────────────┘
       │
┌──────┴─────────┐
│notifications   │        ┌────────────────────────────────┐
├────────────────┤        │         loans                  │
│ id (PK)        │        ├────────────────────────────────┤
│ user_id (FK)   │◄──────►│ id (PK)                        │
│ title          │(1:N)   │ member_id (FK)                 │
│ message        │        │ amount                         │
│ is_read        │        │ duration, status               │
│ ...            │        │ remaining_balance              │
└────────────────┘        │ ...                            │
                          └────────────┬───────────────────┘
                                       │ (1:N)
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
            ┌───────▼────────┐ ┌──────▼─────────┐ ┌─────▼──────────┐
            │ loan_schedules │ │loan_repayments │ │ loan_payments  │
            ├────────────────┤ ├────────────────┤ └────────────────┘
            │ id (PK)        │ │ id (PK)        │
            │ loan_id (FK)   │ │ loan_id (FK)   │
            │ due_date       │ │ amount_paid    │
            │ status         │ │ status         │
            │ ...            │ │ ...            │
            └────────────────┘ └────────────────┘

┌──────────────────┐
│ finance          │
├──────────────────┤
│ id (PK)          │
│ type, category   │
│ amount, date     │
│ ...              │
└──────────────────┘

┌──────────────────┐      (1:N)       ┌──────────────┐
│ reports_data     │◄────────────────►│report_responses
├──────────────────┤                 ├──────────────┤
│ id (PK)          │                 │ id (PK)      │
│ user_id (FK)     │                 │ report_id(FK)│
│ title, status    │                 │ message      │
│ ...              │                 │ responder_id │
└──────────────────┘                 │ ...          │
                                     └──────────────┘

┌──────────────┐
│ savings      │ (Legacy - being replaced by transactions)
├──────────────┤
│ id (PK)      │
│ member_id(FK)│
│ amount, type │
│ ...          │
└──────────────┘
```

---

## Key Features & Data Flow

### Authentication Flow
1. **User Registration** → `users` table created, if member → `members` table created
2. **2FA Setup** → `two_factor_secret` stored in `users`
3. **Login** → Session established, `audit_logs` records login action

### Loan Management Flow
1. **Loan Request** → Record in `loans` table
2. **Loan Approval** → Update `loans.status` → `approved`
3. **Schedule Generation** → Create records in `loan_schedules`
4. **Payments** → Record in `loan_repayments`, update `loans.remaining_balance`
5. **Finance Entry** → Record in `finance` table

### Savings/Withdrawal Flow
1. **Member Deposit** → Record in `transactions` (category=Savings)
2. **Member Withdrawal Request** → Create withdrawal transaction (status=pending)
3. **Admin Approval** → Update transaction status → `success`, deduct from `members.total_savings`
4. **Finance Record** → Entry created in `finance` table

### Notifications Flow
1. **Action Triggered** → `audit_logs` entry + `notifications` created
2. **Examples:**
   - Member approval → notification to member
   - Loan request → notification to admins
   - Withdrawal request → notification to admins
   - Loan payment → notification to member

---

## Data Types Reference (Supabase PostgreSQL)

| PostgreSQL Type | Description |
|-----------------|-------------|
| uuid | Universally Unique Identifier |
| text/varchar | Variable-length text |
| integer | Whole numbers |
| decimal/numeric | Fixed-point numbers (for money) |
| boolean | True/False |
| date | YYYY-MM-DD |
| timestamp/timestamptz | Date and time with timezone |
| jsonb | JSON binary format |
| array | Array of values |

---

## Known Issues & Legacy Code

1. **Savings Table (Deprecated):** The `savings` table is being replaced by `transactions`. New code uses `transactions` with `category='Savings'`.

2. **Denormalization:** `loans` table includes `member_name` (denormalized) for performance. Keep in sync with `members.name`.

3. **Finance Table:** Serves as a general ledger. Overlaps with `transactions` table functionality.

4. **Soft Deletes:** Tables use `is_deleted = 0/1` flag instead of hard deletes for data preservation.

---

## Recommended Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Members  
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_join_date ON members(join_date);

-- Transactions
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Loans
CREATE INDEX idx_loans_member_id ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);

-- Loan Schedules
CREATE INDEX idx_loan_schedules_loan_id ON loan_schedules(loan_id);
CREATE INDEX idx_loan_schedules_due_date ON loan_schedules(due_date);

-- Reports
CREATE INDEX idx_reports_status ON reports_data(status);
CREATE INDEX idx_reports_user_id ON reports_data(user_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

---

## Summary

The Palugada database consists of **12 tables** organized into these functional areas:

- **Authentication:** users, audit_logs
- **Member Management:** members, notifications
- **Loans:** loans, loan_schedules, loan_repayments
- **Savings:** transactions, savings (legacy)
- **Finance:** finance
- **Reporting:** reports_data, report_responses

Total entities and relationships ensure comprehensive tracking of cooperative operations including member accounts, loans, savings, payments, and administrative activities.
