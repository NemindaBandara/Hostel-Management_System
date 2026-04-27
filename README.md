# Hostel Management System

A modern, full-stack solution for efficiently managing student hostels, room allocations, and maintenance requests.

## 🚀 Overview

The **Hostel Management System** is designed to streamline the administrative tasks of university hostels. It provides a robust platform for administrators to design hostel layouts, manage student records, and handle automated room allocations, while offering students a seamless portal to view their assignments and report maintenance issues.

## ✨ Key Features

### 🏢 Administrator Portal
- **Hostel Designer**: Create dynamic hostel layouts with custom floors, rooms, and common areas.
- **Smart Allocation**: Automated student-to-room allocation based on faculty and gender requirements.
- **Student Management**: Comprehensive database of students with filtering by faculty and year.
- **Maintenance Tracking**: Real-time dashboard for managing and resolving student-reported issues.
- **Data Export**: Export student lists and maintenance reports to CSV for administrative use.

### 🎓 Student Portal
- **Personal Dashboard**: View assigned hostel and room details.
- **Maintenance Reporting**: Easily submit and track the status of maintenance requests.
- **Profile Management**: Secure account management and password updates.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State/Data**: Axios, Headless UI

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Security**: JWT (JSON Web Tokens), Bcryptjs

## 📁 Project Structure

```bash
hostel-management-system/
├── frontend/               # Next.js frontend application
│   ├── app/                # App router (Admin & Student routes)
│   ├── components/         # Reusable UI components
│   └── lib/                # Utility functions and API configuration
├── backend/                # Express backend API
│   ├── controllers/        # Business logic for routes
│   ├── models/             # Mongoose schemas (Student, Hostel, Room, etc.)
│   ├── routes/             # API endpoint definitions
│   └── middleware/         # Auth and error handling middleware
└── README.md
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your credentials:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 License
This project is licensed under the ISC License.
