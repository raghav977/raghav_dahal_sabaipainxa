import { Footer } from "react-day-picker";
import HeaderNavbar from "../landingpagecomponents/components/HeaderNavbar";
import HomeServicesContent from "./components/HomeServicesContent";

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Home Services | UPAAYAX",
  description: "Find local service providers for all your home needs.",
};

export default function HomeServicesPage() {
  return (
    <>
      <HeaderNavbar />

      <div className="max-w-7xl mx-auto p-4 mt-18">
        <HomeServicesContent />
      </div>
      <Footer/>
    </>
  );
}
