import { useState, useEffect, lazy, Suspense } from "react";
import { ArrowUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofBar from "@/components/SocialProofBar";
import ProblemSection from "@/components/ProblemSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import ComparisonSection from "@/components/ComparisonSection";
import TechStackSection from "@/components/TechStackSection";
import DeploymentCallout from "@/components/DeploymentCallout";
import TeamSection from "@/components/TeamSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AnimatedDivider from "@/components/AnimatedDivider";
import ParticleField from "@/components/ParticleField";
import ScrollProgress from "@/components/ScrollProgress";
import FloatingParallaxSVGs from "@/components/svg/FloatingParallaxSVGs";
import PageLoader from "@/components/PageLoader";
import NoiseOverlay from "@/components/NoiseOverlay";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the demo section
const DemoSection = lazy(() => import("@/components/demo/DemoSection"));

const DemoFallback = () => (
  <div className="py-[120px]">
    <div className="container mx-auto px-4 lg:px-8">
      <Skeleton className="h-8 w-64 mb-4 bg-secondary" />
      <Skeleton className="h-4 w-48 mb-10 bg-secondary" />
      <Skeleton className="h-[400px] w-full rounded-2xl bg-secondary" />
    </div>
  </div>
);

const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all duration-300"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
};

const Index = () => (
  <div className="min-h-screen bg-background relative" style={{ backgroundColor: '#04040f' }}>
    <PageLoader />
    <NoiseOverlay />
    <ParticleField />
    <FloatingParallaxSVGs />
    <ScrollProgress />
    
    <Navbar />
    <main className="relative z-10">
      <HeroSection />
      <div className="grid-background-wrapper">
        <SocialProofBar />
        <AnimatedDivider />
        <Suspense fallback={<DemoFallback />}>
          <DemoSection />
        </Suspense>
        <AnimatedDivider />
        <ProblemSection />
        <AnimatedDivider />
        <HowItWorksSection />
        <AnimatedDivider />
        <FeaturesSection />
        <AnimatedDivider />
        <ComparisonSection />
        <AnimatedDivider />
        <TechStackSection />
        <DeploymentCallout />
        <AnimatedDivider />
        <TeamSection />
        <AnimatedDivider />
        <FAQSection />
        <AnimatedDivider />
        <CTASection />
      </div>
    </main>
    <Footer />
    <BackToTop />
  </div>
);

export default Index;
