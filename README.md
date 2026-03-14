````markdown
# SafeCloak — Smart Locker System

A full-stack smart locker rental system where users can choose **specific boxes** (for example, `A-1`) at physical terminal locations.

---

## 🏗️ Project Structure

```text
safeclock/
├── backend/                  # Spring Boot 3 + MySQL
├── frontend/                 # React + Vite
└── logo.png
````

---

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs at: `http://localhost:8080`

### Demo Seed Data

The backend creates demo data automatically:

* **Admin**

  * Phone: `0000000000`
  * Password: `admin123`
* **Terminals**

  * 2 terminals
  * 20 boxes each
  * Location: **Koramangala Mall**

---

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔐 Authentication

| Role  | Phone        | Credentials          |
| ----- | ------------ | -------------------- |
| Admin | `0000000000` | Password: `admin123` |
| User  | Any phone    | OTP-based login      |

---

## 📡 Key API Endpoints

| Method | Path                             | Description                             |
| ------ | -------------------------------- | --------------------------------------- |
| POST   | `/api/auth/send-otp`             | Send OTP (returns OTP in demo mode)     |
| POST   | `/api/auth/verify-otp`           | Verify OTP and get JWT                  |
| POST   | `/api/auth/admin-login`          | Admin password login                    |
| GET    | `/api/user/terminals`            | List active terminals                   |
| GET    | `/api/user/terminals/{id}/boxes` | Get box layout                          |
| POST   | `/api/user/allocate`             | Reserve a **specific box** with DB lock |
| POST   | `/api/user/boxes/{id}/open`      | Simulate box open                       |
| POST   | `/api/user/orders/{id}/complete` | Complete pickup                         |

---

## ⚙️ Configuration

### Twilio Configuration

Add the following to:

`safeclock/backend/src/main/resources/application.yml`

```yaml
twilio:
  account-sid: ${TWILIO_ACCOUNT_SID:paste_twilio_here}
  auth-token: ${TWILIO_AUTH_TOKEN:paste_twilio_here}
  phone-number: ${TWILIO_PHONE_NUMBER:paste_twilio_here}
```

---

## 🗄️ Database Configuration

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/safeclock?createDatabaseIfNotExist=true
    username: root
    password: password
```

---

## ✨ Key Features

* **Specific Box Selection**
  Users can view a **5×4 visual grid** and choose exact boxes such as `A-1`, `B-3`, and more.

* **Concurrency Control**
  Uses **`SELECT FOR UPDATE` pessimistic locking** to prevent double-booking.

* **OTP Authentication**
  Supports **6-digit OTP login** with **5-minute expiry**. In demo mode, OTP is logged to the console.

* **Admin Dashboard**
  Includes full CRUD support for:

  * Sites
  * Terminals
  * Box generation
  * Pricing
  * Orders

* **Box Access Simulation**
  Provides mock **open/close hardware command simulation** for demo purposes.

---

## ✅ Tech Stack

### Backend

* Spring Boot 3
* MySQL
* JWT Authentication

### Frontend

* React
* Vite

---

## 📌 Notes

* Users can reserve **specific lockers**, not just any available box.
* OTP is mocked for demo/testing unless Twilio credentials are configured.
* The system is designed for locker terminals deployed at physical locations.
