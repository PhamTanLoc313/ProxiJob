import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BentoGrid from './components/BentoGrid';
import Workflow from './components/Workflow';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import PlexusBackground from './components/PlexusBackground';

export default function App() {
  return (
    <div className="min-h-screen bg-transparent font-hanken text-brand-text flex flex-col relative">
      {/* Immersive Tech Plexus Canvas Background */}
      <PlexusBackground />

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Bento Grid Features Section */}
      <BentoGrid />

      {/* Workflow Section */}
      <Workflow />

      {/* Pricing / Subscriptions Section */}
      <Pricing />

      {/* Testimonials / Social Proof Section */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
