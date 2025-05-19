import HeroSection from "@/components/home/hero-section"
import FeaturesSection from "@/components/home/features-section"
import Navbar from "@/components/home/navbar"
import Footer from "@/components/home/footer"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function Home() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <HeroSection />
          <FeaturesSection />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
