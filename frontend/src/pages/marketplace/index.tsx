import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Explore from './Explore';
import PropertyPage from './PropertyPage';
import Capture from './Capture';
import AiAssistantWidget from '../../components/AiAssistantWidget';
import {
  AboutPage,
  ContactPage,
  CareersPage,
  TermsPage,
  PrivacyPage,
  NotFoundPage
} from './InfoPages';

export default function Marketplace() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Explore />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/property/:id" element={<PropertyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <AiAssistantWidget />
    </>
  );
}
