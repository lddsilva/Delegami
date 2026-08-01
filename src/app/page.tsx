import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { Problem } from '@/components/problem'
import { HowItWorks } from '@/components/how-it-works'
import { AppScreens } from '@/components/app-screens'
import { Deliverables } from '@/components/deliverables'
import { NotIncluded } from '@/components/not-included'
import { FreeOffer } from '@/components/free-offer'
import { Pricing } from '@/components/pricing'
import { CaseStudy } from '@/components/case-study'
import { Channel } from '@/components/channel'
import { Faq } from '@/components/faq'
import { Footer } from '@/components/footer'
import { WhatsappFab } from '@/components/whatsapp-fab'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <AppScreens />
        <Deliverables />
        <NotIncluded />
        <FreeOffer />
        <Pricing />
        <CaseStudy />
        <Channel />
        <Faq />
      </main>
      <Footer />
      <WhatsappFab />
    </>
  )
}
