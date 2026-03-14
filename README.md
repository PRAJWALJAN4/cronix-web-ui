**SafeCloak — Smart Locker System**  
A full-stack smart locker rental system where users choose **specific boxes** (e.g. "A-1") at physical terminal locations.  
**🏗️ Project Structure**  
safeclock/  
 ├── backend/          # Spring Boot 3 + MySQLlite  
 ├── frontend/         # React + Vite  
 ├── docker-compose.yml  
 └── logo.png  
   
**🚀 Quick Start**  
**1. Start Backend**  
cd backend  
 mvn spring-boot:run  
   
Backend runs at: http://localhost:8080  
**Demo seed data created automatically:**  
- Admin: phone 0000000000, password admin123  
- 2 terminals with 20 boxes each at "Koramangala Mall"  
**2. Start Frontend**  
cd frontend  
 npm run dev  
   
Frontend runs at: http://localhost:5173  
**🔐 Authentication**  
| | | |  
|-|-|-|  
| **Role** | **Phone** | **Credentials** |   
| Admin | 0000000000 | password: admin123 |   
| User | any phone | OTP  |   
   
**📡 Key API Endpoints**  
| | | |  
|-|-|-|  
| **Method** | **Path** | **Description** |   
| POST | /api/auth/send-otp | Send OTP (returns OTP in demo mode) |   
| POST | /api/auth/verify-otp | Verify OTP & get JWT |   
| POST | /api/auth/admin-login | Admin password login |   
| GET | /api/user/terminals | List active terminals |   
| GET | /api/user/terminals/{id}/boxes | Get box layout |   
| POST | /api/user/allocate | **Reserve specific box** (with DB lock) |   
| POST | /api/user/boxes/{id}/open | Simulate box open |   
| POST | /api/user/orders/{id}/complete | Complete pickup |   
   
   
   
   
   
   
   
   
   
   
Add thes info:  
twilio:  
  account-sid: ${TWILIO_ACCOUNT_SID:paste_twilio_here}  
  auth-token: ${TWILIO_AUTH_TOKEN:paste_twilio_here}  
  phone-number: ${TWILIO_PHONE_NUMBER:paste_twilio_here}  
File path safeclock/backend/src/main/resources/application.yml  
**🗄️ Database Config**  
url: jdbc:mysql://localhost:3306/safeclock?createDatabaseIfNotExist=true  
 username: root  
 password: password  
   
**✨ Key Features**  
- **Specific Box Selection**: Users see a 5×4 visual grid and pick exact boxes (A-1, B-3, etc.)  
- **Concurrency Control**: SELECT FOR UPDATE pessimistic locking prevents double-booking  
- **OTP Authentication**: 6-digit OTP with 5-min expiry (mock SMS logs to console)  
- **Admin Dashboard**: Full CRUD for sites, terminals, box generation, pricing, orders  
- **Box Access Simulation**: Mock open/close hardware commands for demo  
