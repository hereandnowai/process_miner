
import React from 'react';
import { APP_NAME, COMPANY_LOGO_URL } from '../constants';
import { InformationCircleIcon, CommandLineIcon, AcademicCapIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 glassmorphism animate-fadeIn">
      <div className="text-center mb-10">
        <img src={COMPANY_LOGO_URL} alt="Company Logo" className="h-20 w-auto mx-auto mb-4" />
        <h2 className="text-4xl font-bold text-white mb-2">{APP_NAME}</h2>
        <p className="text-lg text-brand-gold">
          Intelligent Process Mining & Optimization Platform
        </p>
      </div>

      <section className="mb-8">
        <h3 className="text-2xl font-semibold text-white mb-3 flex items-center">
          <InformationCircleIcon className="h-7 w-7 mr-2 text-brand-teal" />
          About The Application
        </h3>
        <p className="text-gray-300 leading-relaxed">
          This application leverages cutting-edge AI, powered by Google's Gemini models, to provide deep insights into your business processes. 
          Upload your process event logs (CSV or JSON) and unlock a suite of tools including an interactive dashboard, an AI-powered chat assistant for natural language queries, and a comprehensive process analyzer.
          Our goal is to help you identify bottlenecks, detect anomalies, ensure compliance, and discover opportunities for efficiency and improvement.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-2xl font-semibold text-white mb-3 flex items-center">
          <CommandLineIcon className="h-7 w-7 mr-2 text-brand-teal" />
          Core Features
        </h3>
        <ul className="list-disc list-inside text-gray-300 space-y-2 pl-4">
          <li><strong>Dashboard Interface:</strong> Real-time KPIs, quick navigation, and an alert center for process deviations.</li>
          <li><strong>AI Chat Assistant:</strong> Voice-enabled (browser permitting) interface for contextual process mining queries using natural language.</li>
          <li><strong>Process Analyzer:</strong> Interactive visualizations (placeholders for dynamic maps), AI-generated summaries including bottleneck analysis, compliance checks, and improvement scoring.</li>
          <li><strong>Data Integration:</strong> Easy CSV/JSON data upload with auto-parsing.</li>
          <li><strong>Output Options:</strong> Export process data as JSON. PDF report generation (via browser print).</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h3 className="text-2xl font-semibold text-white mb-3 flex items-center">
          <AcademicCapIcon className="h-7 w-7 mr-2 text-brand-teal" />
          Technology Stack
        </h3>
        <ul className="list-disc list-inside text-gray-300 space-y-2 pl-4">
          <li><strong>Frontend:</strong> React 18 with TypeScript</li>
          <li><strong>Styling:</strong> Tailwind CSS for a modern, responsive UI</li>
          <li><strong>AI Engine:</strong> Google Gemini API for pattern recognition, natural language processing, and insights generation.</li>
          <li><strong>Charts/Visualizations:</strong> Placeholders for future integration with libraries like Recharts or D3.js.</li>
          <li><strong>Speech Capabilities:</strong> Browser's Web Speech API (SpeechRecognition & SpeechSynthesis).</li>
        </ul>
         <p className="text-sm text-gray-400 mt-3">
          Note: ERP connectors (SAP, Oracle, ServiceNow) and real-time collaboration features (Firestore) mentioned in initial concepts are planned for future development phases and require backend infrastructure.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-semibold text-white mb-3 flex items-center">
          <ShieldCheckIcon className="h-7 w-7 mr-2 text-brand-teal" />
          Accessibility & UI/UX
        </h3>
        <p className="text-gray-300 leading-relaxed mb-2">
          We are committed to providing an accessible and user-friendly experience. This application aims to adhere to WCAG 2.1 guidelines through:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-1 pl-4">
          <li>Semantic HTML structure.</li>
          <li>Keyboard navigability.</li>
          <li>Sufficient color contrast (ongoing effort).</li>
          <li>ARIA attributes where appropriate for screen reader support.</li>
        </ul>
        <p className="text-gray-300 leading-relaxed mt-2">
          The UI features a modern glassmorphism design for visual appeal and clarity.
        </p>
      </section>

      <div className="mt-10 text-center text-sm text-gray-400">
        <p>Developed by the Here and Now AI Research Institute.</p>
        <p>For support or inquiries, please contact us through official channels.</p>
      </div>
    </div>
  );
};

export default AboutPage;
    