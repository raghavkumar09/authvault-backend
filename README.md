# 🛡️ AuthVault Backend

AuthVault is a production-grade authentication and user management system built with Node.js, Express, and MySQL. It provides a robust API for secure user authentication, role-based access control, and seamless integrations.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

---

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with Access & Refresh tokens.
- **Google OAuth**: One-click login with Google integration.
- **User Management**: Complete CRUD operations for users and profiles.
- **Email System**: Automated verification emails and password reset links via Nodemailer.
- **Cloud Storage**: Profile image uploads integrated with Cloudinary.
- **Security**: Rate limiting, Helmet security headers, and input validation (Joi/Express-validator).
- **Caching**: Redis integration for high-performance session and data caching.
- **Logging**: Comprehensive logging with Winston and Morgan.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL (Sequelize ORM)
- **Cache**: Redis
- **Auth**: Passport.js (Google), JWT, BcryptJS
- **Storage**: Cloudinary, Multer
- **Email**: Nodemailer (SMTP)
- **Validation**: Joi, Express Validator

---

## 🚦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MySQL](https://www.mysql.com/)
- [Redis](https://redis.io/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd authvault-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your credentials:
   - Database connection (MySQL)
   - JWT Secrets (Minimum 32 characters)
   - Email SMTP details (e.g., Gmail App Password)
   - Cloudinary API keys
   - Google OAuth credentials

4. **Run Migrations**
   The application uses Sequelize. Ensure your MySQL server is running and the database specified in `.env` exists. Tables will be auto-synced on start.

5. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

---

## 📂 Project Structure

```text
src/
├── config/         # Database, Redis, Passport, and Cloudinary configs
├── controllers/    # Request handlers
├── middleware/     # Auth, Error, and Rate limiters
├── models/         # Sequelize models
├── routes/         # Express routes
├── services/       # Business logic (Email, Storage, etc.)
├── utils/          # Helper functions
└── server.js       # Entry point
```

---

## 🛡️ Security Features

- **JWT Secrets**: Strong encryption for session tokens.
- **Password Hashing**: Bcryptjs with salt rounds.
- **CORS**: Configured for specific client origins.
- **Rate Limiting**: Protects against Brute-force attacks.
- **Helmet**: Secures Express apps by setting various HTTP headers.

---

## 🔐 Admin Access

To test the administrative features, you can use the following default credentials (Note: Ensure the user exists in your database with the `admin` role):

- **Email**: `admin@authvault.com`
- **Password**: `Admin@123`

### How to promote a user to Admin:
If you have already registered a user and want to make them an admin, run the following SQL command in your database:
```sql
UPDATE users SET role = 'admin', is_email_verified = 1 WHERE email = 'admin@authvault.com';
```
