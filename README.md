# Easy Branding AI

**AI-Powered WhatsApp Automation for African Businesses**

A modern operational platform that helps South African SMEs capture leads, automate customer conversations, qualify prospects, and scale their business through WhatsApp.

---

## ✨ Key Features

- Real WhatsApp messaging via Twilio
- Live lead management dashboard
- Conversation workspace with status tracking
- Automated qualification flows
- Role-based access (User + Admin)
- Secure JWT authentication
- Clean, organic dark UI design

---

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Styling**: Custom organic theme (lime & emerald accents)
- **API Client**: Axios with interceptors
- **Backend**: Node.js / Express (separate repo)
- **Database**: MongoDB Atlas

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/Creations11/Easybranding.git
cd Easybranding

# Install dependencies
npm install

# Start development server
npm run dev

📍 Environment Variables
Create a .env file in the root:
envVITE_API_URL=https://equilibro-elite-loan-api.onrender.com/api

📁 Project Structure
textsrc/
├── api.js                    # Shared Axios setup + interceptors
├── components/
│   ├── Nav.jsx
│   └── ChatModal.jsx
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── AdminDashboard.jsx
└── App.jsx

🔑 Main Routes

/ — Homepage with Free Trial CTA
/login — User login
/register — Create account
/dashboard — Operations Center (Leads + Conversations)
/admin — Admin panel (protected)


🎯 Business Plans

14-Day Free Trial — Full access
WhatsApp Only — R399/month
Growth Plan — R799/month (Advanced automation)
Enterprise — Custom pricing & support


🔗 Backend Repository
equilibro-elite-loan-api

Built for African businesses • Focused on operational reliability