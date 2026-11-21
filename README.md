# 🍱 MealMitra – AI-Powered Surplus Food Rescue Platform

<p align="center">
  <strong>Turn Surplus Food into Shared Meals.</strong>
</p>

<p align="center">
  An AI-powered platform connecting food donors with NGOs to reduce food waste and help people in need.
</p>

## 🌐 Live Demo

**Website:** https://mealmitra-project.vercel.app/

## 📌 1. About the Project

MealMitra is an AI-powered surplus food rescue and donation coordination platform designed to connect restaurants, hotels, event organizers, and individuals with verified Non-Governmental Organizations (NGOs).

The platform helps donors share surplus food with NGOs that can collect and distribute it to people in need.

Its main purpose is to reduce food wastage, simplify food donation coordination, and support communities facing food insecurity.

## 🎯 2. Problem Statement

A significant amount of food is wasted by restaurants, hotels, events, and households, while many people struggle to access sufficient food.

There is a need for a platform that connects food donors with NGOs and makes the donation process easier, more organized, and transparent.

## 💡 3. Project Objectives

- Reduce surplus food wastage.
- Connect food donors with NGOs.
- Simplify the food donation process.
- Help NGOs discover available food donations.
- Provide transparent donation status tracking.
- Encourage responsible food sharing.

## ✨ 4. Main Features

### 👤 Donor Module
- Donor registration and login.
- Submit surplus food donation details.
- View donation status.
- Track donation history.
- Monitor donation activity through a dashboard.

### 🏢 NGO Module
- NGO registration and login.
- Organization profile management.
- NGO verification workflow.
- View available food donations.
- Accept available donations.
- Update donation status.
- View donation history.

### 🤖 AI Chatbot
- Integrated Groq-powered AI chatbot.
- Answers questions about food donations.
- Explains how the MealMitra platform works.
- Provides information about NGOs and food safety.
- Generates dynamic AI responses through an API.

### 📊 Impact Dashboard
- Displays donation-related statistics.
- Shows completed donations.
- Helps communicate the platform's social impact.

## 🔄 5. How MealMitra Works

1. **Donor Registration:** A restaurant, hotel, event organizer, or individual registers on the platform.
2. **Food Donation:** The donor submits surplus food details, quantity, location, and safe-consumption deadline.
3. **NGO Discovery:** Eligible verified NGOs can view available donations.
4. **Donation Acceptance:** One eligible NGO accepts the donation.
5. **Food Collection:** The NGO independently contacts the donor and collects the food.
6. **Food Distribution:** The NGO distributes the collected food to people in need.
7. **Status Update:** The NGO updates the donation status, and the donor can track its progress.

**Donation Status Flow:**

Pending → Accepted → Pickup in Progress → Delivered

Expired donations are marked separately when their safe-consumption deadline passes.

**Note:** MealMitra coordinates food donations. It does not provide delivery agents, transportation, or logistics services.

## 🛠️ 6. Technologies Used

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Development and build tool |
| Tailwind CSS | Website styling |
| Supabase | Backend services and authentication |
| PostgreSQL | Database |
| Groq API | AI chatbot integration |
| Vercel | Website deployment |
| GitHub | Source code management |

## 🧠 7. AI Tools Used

The following AI tools contributed to the development process:

**1. ChatGPT**
- Project planning and idea development.
- Initial project-building prompt creation.
- Prompt refinement and documentation.
- Technical guidance and debugging assistance.

**2. Google Gemini**
- Reviewing and improving the initial project prompt.
- Refining project requirements and development instructions.

**3. Bolt.new**
- AI-assisted website development.
- Frontend and backend code generation.
- Database and authentication integration.
- Chatbot integration and debugging.

## 🧩 8. Prompt Engineering Techniques

The project uses the following prompt engineering concepts:

- Role-based prompting.
- Context-based prompting.
- Step-by-step prompting.
- Structured prompting.
- Prompt refinement and optimization.
- Clear instructions and constraints.

The initial project prompt was structured using five compulsory components:

1. Role
2. Task
3. Context
4. Constraints
5. Output Format

## 📁 9. Project Structure

The project is organized into frontend components, pages, and backend functions.

```text
MealMitra/
│
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
│
├── supabase/
│   └── functions/
│       └── chat/
│
├── package.json
├── index.html
├── vite.config.ts
└── README.md
```

*Note: This is a simplified overview. Refer to the repository for the complete project structure.*

## ⚙️ 10. Installation and Setup

### Prerequisites
- Node.js
- npm
- Git

### Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### Navigate to the Project

```bash
cd MealMitra
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Configure the required Supabase frontend environment variables according to the project's Supabase client configuration.

Configure the Groq API key as a secure server-side secret for the chatbot Edge Function.

**Important:** Never expose API keys, service-role keys, or database passwords in frontend code or public repositories.

### Run the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### Build the Project

```bash
npm run build
```

## 🔐 11. Security

- Authentication for donors and NGOs.
- NGO verification before accepting donations.
- Secure server-side handling of the Groq API key.
- Database access controlled through appropriate permissions and policies.
- API secrets must not be committed to GitHub.

## 🚀 12. Deployment

MealMitra is deployed using Vercel.

**Live Website:** https://mealmitra-project.vercel.app/

The source code is maintained in GitHub, with Vercel connected to the repository for deployment.

## 🔮 13. Future Enhancements

- Improved donation matching.
- Email and notification alerts.
- Advanced impact analytics.
- Improved NGO verification.
- Enhanced donation discovery and filtering.

## ❤️ 14. Project Vision

MealMitra aims to make surplus food donation simple, accessible, and organized by connecting people who have extra food with organizations that can distribute it to people who need it.

**Reduce Food Waste. Share More Meals. Build a Better Tomorrow.**

---

**Project Name:** MealMitra  
**Project Category:** AI-Powered Web Application  
**Domain:** Food Rescue and Donation Coordination
