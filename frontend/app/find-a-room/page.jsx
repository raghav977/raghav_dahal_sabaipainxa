import HeaderNavbar from "../landingpagecomponents/components/HeaderNavbar";
import RoomList from "./components/room";
import RoomContent from "./components/RoomContent";
export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Find a Room | UPAAYAX",
  description: "Find the perfect room for your stay.",
};

export default function FindARoomPage() {
  return (
    <>
      <HeaderNavbar />

      <div className="max-w-7xl mx-auto p-4 mt-18">
        <RoomContent />
      </div>
    </>
  );
}