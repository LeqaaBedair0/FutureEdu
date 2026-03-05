# 🎓 FutureEdu - Smart School Management Platform

## 👨‍💻 Developed By
Leqaa Bedair GitHub: @LeqaaBedair0
Kareem Mohamed GitHub: @Kareemmohamed433

![FutureEdu Banner](https://via.placeholder.com/1000x400?text=FutureEdu+Smart+Platform)

FutureEdu is a comprehensive, microservices-based school management platform designed to automate administrative workflows. It features an AI-powered facial recognition system for seamless attendance tracking, dynamic ID card generation, and real-time financial analytics.

**[Live Demo](https://futureeduu.netlify.app/)** | **[Report Bug](https://github.com/LeqaaBedair0/FutureEdu/issues)**

## 🏗️ System Architecture

This project utilizes a modern microservices architecture to separate the frontend interface, the main business logic, and the heavy AI processing:

* **Frontend (UI/UX):** React.js (Deployed on Netlify), Handles the UI/UX and captures camera/barcode inputs.
* **Main API (Core Logic):** Java (Spring Boot), Acts as the central hub, managing business logic, financial calculations, and database routing.
* **AI Microservice (Face Recognition):** Python (Flask), A dedicated service handling heavy face-recognition computation to prevent main server memory overload.
* **Database:** MongoDB Atlas, flexible queries.

## 🚀 Key Features

### 👨‍🎓 Smart Student Management
- **Comprehensive Profiles:** Store and manage contact info, addresses, and academic histories.
- **Dynamic Search:** Instantly find students by name or unique system ID.
- **Parent Portal Readiness:** Structured data to bridge the communication gap between teachers and parents.

### 🤖 AI-Powered Attendance & ID System
- **Face Recognition:** Python-based AI microservice to seamlessly scan and verify student faces for touchless attendance.
- **Auto-Generated ID Cards:** Automatically creates unique ID cards with scannable barcodes.
- **Hardware Integration:** Use external scanners or the device camera to read barcodes and update attendance instantly.

### 💰 Financial & Analytics Dashboard
- **Teacher Earnings:** Calculate salaries and commissions based on collected student fees.
- **Performance Tracking:** Interactive Recharts visualizing student grades over time.
- **Attendance Overview:** Donut charts providing a quick health check on student presence.

  
## 💻 Tech Stack

**Frontend (`/frontend`)**
- React.js & React Router
- Recharts (Data Visualization)
- React-Barcode (ID Generation)
- Deployed on **Netlify**

**Main Backend (`/backend`)**
- Java & Spring Boot
- RESTful API Architecture
- Spring Data MongoDB

**AI Microservice (`/ai-engine`)**
- Python
- Face Recognition Models (OpenCV / AI Libraries)

**Database**
- MongoDB Atlas

## 🛠️ Local Setup

To run this microservices application locally, you will need to start all three servers:

### 1. Clone the repository
```bash
git clone [https://github.com/LeqaaBedair0/FutureEdu.git](https://github.com/LeqaaBedair0/FutureEdu.git)
cd FutureEdu

### 2. Start the Java Backend
```bash
cd backend-java
./mvnw spring-boot:run

### 3. Start the Python Flask AI Service
cd backend-ai
pip install -r requirements.txt
python app.py

### 4. Start the React Frontend**
cd frontend
npm install
npm start






