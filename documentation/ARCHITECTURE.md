# Power2Inspire Event CRM App - Architecture Documentation

**Document Version:** 1.0  
**Date:** 2026-02-06  
**Compliance:** IEC 62304 Software Development Lifecycle Principles

## 1. System Architecture Overview

The application follows a **Clean Architecture** pattern with clear separation of concerns, enabling testability, maintainability, and scalability.

### 1.1 Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│  (UI Widgets, State Management, View Models)        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Application Layer                       │
│  (Use Cases, Business Logic, Validation)            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Domain Layer                            │
│  (Entities, Value Objects, Repository Interfaces)   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Infrastructure Layer                    │
│  (Database, API Clients, File System, Sync Engine)  │
└─────────────────────────────────────────────────────┘
```

## 2. Technology Stack

### 2.1 Core Framework
- **Flutter SDK:** 3.32.0+ (Dart 3.8.0+)
- **Target Platforms:** Android (API 21+), iOS (12+)

### 2.2 State Management
- **Riverpod 2.x:** Dependency injection and state management
- **Freezed:** Immutable data classes with code generation
- **Hooks:** Simplified widget lifecycle management

### 2.3 Local Data Persistence
- **Drift (formerly Moor):** Type-safe SQLite database layer
- **SQLite:** Local database engine
- **Shared Preferences:** Simple key-value storage for settings

### 2.4 API Integration
- **Dio:** HTTP client with interceptors and retry logic
- **Retrofit:** Type-safe REST API client generation
- **JSON Serializable:** JSON serialization/deserialization

### 2.5 File Operations
- **CSV:** CSV file generation for reports
- **Path Provider:** Access to device file system
- **Google Drive API:** Cloud backup integration

### 2.6 UI/UX
- **Material Design 3:** Modern, accessible UI components
- **Responsive Framework:** Adaptive layouts for tablets/phones
- **Flutter Accessibility:** Screen reader and assistive technology support

## 3. Project Structure

```
software/flutter/event_crm_app/
├── lib/
│   ├── main.dart                          # App entry point
│   ├── core/                              # Core utilities
│   │   ├── constants/                     # App-wide constants
│   │   ├── errors/                        # Error handling
│   │   ├── network/                       # Network utilities
│   │   └── utils/                         # Helper functions
│   ├── features/                          # Feature modules
│   │   ├── event/                         # Event management
│   │   │   ├── data/                      # Data sources, repositories
│   │   │   ├── domain/                    # Entities, use cases
│   │   │   └── presentation/              # UI, view models
│   │   ├── registration/                  # Attendee/volunteer registration
│   │   ├── attendance/                    # Check-in/check-out tracking
│   │   ├── reporting/                     # CSV export and reports
│   │   └── sync/                          # Data synchronization
│   ├── shared/                            # Shared components
│   │   ├── widgets/                       # Reusable UI components
│   │   ├── models/                        # Shared data models
│   │   └── providers/                     # Shared Riverpod providers
│   └── config/                            # App configuration
│       ├── theme/                         # App theming
│       ├── routes/                        # Navigation
│       └── env/                           # Environment variables
├── test/                                  # Unit and widget tests
├── integration_test/                      # Integration tests
└── assets/                                # Images, fonts, etc.
```

## 4. Data Flow

### 4.1 Offline-First Operation
1. User interacts with UI (Presentation Layer)
2. UI triggers Use Case (Application Layer)
3. Use Case validates and processes business logic
4. Repository saves to local SQLite database (Infrastructure Layer)
5. Sync status marked as "pending"

### 4.2 Synchronization Flow
1. User initiates sync (manual trigger)
2. Sync Engine queries pending records from database
3. API Client sends data to external systems (Airtable, Mailchimp, Google Drive)
4. On success: Update sync status to "synced"
5. On failure: Log error, mark for retry, notify user

## 5. Database Schema (SQLite)

### 5.1 Events Table
```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    modified_at TEXT NOT NULL
);
```

### 5.2 Registrations Table
```sql
CREATE TABLE registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    organization TEXT,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL,
    marketing_consent INTEGER DEFAULT 0,
    photo_consent INTEGER DEFAULT 0,
    checkin_time TEXT,
    checkout_time TEXT,
    sync_status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    modified_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id)
);
```

### 5.3 Sync Logs Table
```sql
CREATE TABLE sync_logs (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    sync_target TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    timestamp TEXT NOT NULL
);
```

## 6. Security Considerations

- **Data Encryption:** SQLite database encryption using sqlcipher
- **API Keys:** Stored in environment variables, never in source code
- **HTTPS Only:** All API communications over TLS 1.2+
- **Input Validation:** Sanitize all user inputs
- **GDPR Compliance:** Respect consent flags, support data deletion

## 7. Accessibility Features

- **Touch Targets:** Minimum 48x48 dp (72x72 dp preferred for tablets)
- **Contrast Ratio:** WCAG AA compliance (4.5:1 for text)
- **Font Scaling:** Support system font size preferences
- **Screen Readers:** Semantic labels for all interactive elements
- **Focus Management:** Logical tab order for keyboard navigation

## 8. Testing Strategy

- **Unit Tests:** Business logic, use cases, utilities (>80% coverage)
- **Widget Tests:** UI components in isolation
- **Integration Tests:** End-to-end user flows
- **Accessibility Tests:** Screen reader compatibility, contrast checks
- **Performance Tests:** Database query benchmarks, UI responsiveness

## 9. Deployment

- **Android:** Google Play Store (internal testing → production)
- **iOS:** Apple App Store (TestFlight → production)
- **CI/CD:** GitHub Actions for automated testing and builds
- **Version Control:** Git with semantic versioning (MAJOR.MINOR.PATCH)

