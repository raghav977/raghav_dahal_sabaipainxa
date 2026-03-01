'use client';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation'; 


// import { useDispatch, useSelector } from "react-redux";



import { fetchAllServicesName } from '@/app/redux/thunks/serviceThunks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Search,
  MapPin,
  DollarSign,
  FileText,
  X,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { TbBriefcaseFilled, TbAlertTriangleFilled } from "react-icons/tb";
import { FaBuilding } from "react-icons/fa6";
import { MdVerifiedUser } from "react-icons/md";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { IoTimeSharp } from "react-icons/io5";
import 'leaflet/dist/leaflet.css';
import EmergencyRequestModal from '@/app/landingpagecomponents/components/EmergencyRequestModal'


// Dynamic imports for react-leaflet (client-side only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
});
const useMapEvents = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMapEvents),
  { ssr: false }
);

const emergencyCategories = [
  'Plumbing',
  'Electrical',
  'Medical',
  'Security',
  'Other',
];

export default function HeroSection() {

    const router = useRouter(); // initialize router

  const dispatch = useDispatch();




  // Redux state
  const { list: services, loading } = useSelector(
    (state) => state.servicesReal.publicServicesNames
  );

  

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);

  // Emergency modal states
  const [openEmergencyModal, setOpenEmergencyModal] = useState(false);
  const [category, setCategory] = useState('');
  const [locationType, setLocationType] = useState('map');
  const [manualLocation, setManualLocation] = useState('');
  const [mapPin, setMapPin] = useState({ lat: null, lng: null });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [openMapModal, setOpenMapModal] = useState(false);

  // Fetch services on mount
  useEffect(() => {
    dispatch(fetchAllServicesName());
  }, [dispatch]);

  // Filter services based on search term
  useEffect(() => {
    if (searchTerm && services?.length) {
      const filtered = services.filter((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices([]);
    }
  }, [searchTerm, services]);

  // Get user's location
  useEffect(() => {
    if (!mapPin.lat && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // Map preview component
  const MapSelector = ({ onSelect }) => (
    <div
      className="relative h-32 w-full rounded-md overflow-hidden border mb-2 cursor-pointer group"
      onClick={() => setOpenMapModal(true)}
    >
      {MapContainer && TileLayer && Marker && (
        <MapContainer
          center={[mapPin.lat || 27.7172, mapPin.lng || 85.324]}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full pointer-events-none"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapPin.lat && <Marker position={[mapPin.lat, mapPin.lng]} />}
        </MapContainer>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        Click to expand map
      </div>
    </div>
  );

  // Expanded map modal
  const ExpandedMapSelector = ({ onSelect, mapPin }) => {
    const MapEvents = () => {
      useMapEvents({
        click(e) {
          onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
          setOpenMapModal(false);
        },
      });
      return null;
    };

    return (
      <div className="relative h-[400px] w-full rounded-md overflow-hidden border">
        {MapContainer && TileLayer && Marker && useMapEvents && (
          <MapContainer
            center={[mapPin.lat || 27.7172, mapPin.lng || 85.324]}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents />
            {mapPin.lat && <Marker position={[mapPin.lat, mapPin.lng]} />}
          </MapContainer>
        )}
        <p className="absolute bottom-1 left-1 bg-white/80 px-2 py-1 text-xs rounded">
          Click anywhere on the map to select location.
        </p>
      </div>
    );
  };

  const handleEmergencyService = () =>
    setOpenEmergencyModal(!openEmergencyModal);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(
      files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type,
      }))
    );
  };

  const handleSubmit = () => {
    setOpenEmergencyModal(false);
    setCategory('');
    setLocationType('map');
    setManualLocation('');
    setMapPin({ lat: null, lng: null });
    setMediaFiles([]);
    setDescription('');
    setPrice('');
  };

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-gray-900">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="hidden lg:block lg:absolute lg:inset-0 lg:w-full lg:h-full lg:object-cover lg:z-0 brightness-[.4]"
      >
        <source src="/bgvideo.mp4" type="video/mp4" />
      </video>
      <div className="hidden lg:block lg:absolute lg:inset-0 bg-gradient-to-t from-black/50 to-transparent lg:z-10" />
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
        <div className="max-w-3xl w-full sm:p-12 text-center">
          <Badge className="bg-green-100 text-green-800 font-medium tracking-wide px-4 py-1.5 rounded-full shadow-lg animate-fade-in-down">
            Connect. Work. Grow.
          </Badge>
          <h1 className="mt-4 text-4xl md:text-6xl font-playfair font-bold text-white leading-tight drop-shadow-xl">
            Find Your Perfect{' '}<br />
            <span className="bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
              Work Match
            </span>
          </h1>

          <p className="mt-4 text-white/80 text-md md:text-lg max-w-2xl mx-auto font-ibm">
            Whether you need household repairs, cleaning services, or professional
            help, <span className="font-semibold text-green-200">Upaayax</span>{' '}
            connects you with trusted local service providers.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto relative">
            <Input
              placeholder="Search for services like 'plumber', 'electrician'..."
              className="flex-1 bg-white/10 text-white border-white/30 rounded-full focus:ring-green-400 focus:border-green-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              className="bg-gradient-to-r cursor-pointer rounded-full from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-3 font-semibold text-white flex items-center gap-2 w-full sm:w-auto"
              onClick={() => {
                if (searchTerm) {
                  window.location.href = `/home-services?search=${encodeURIComponent(searchTerm)}`;
                }
              }}
            >
              <Search className="h-5 w-5" /> Find Services
            </Button>

            {/* Dropdown suggestions */}
            {searchTerm && filteredServices.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-gray-800 border border-gray-600 rounded max-h-60 overflow-auto z-50 text-white">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="p-2 cursor-pointer hover:bg-gray-700"
                    onClick={() => {
                      setSearchTerm(service.name);
                      window.location.href = `/home-services?search=${encodeURIComponent(service.name)}`;
                    }}
                  >
                    {service.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/home-services">
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 shadow-md flex items-center justify-center gap-2">
                <TbBriefcaseFilled className="h-5 w-5" /> Find Services
              </Button>
            </Link>
            <Link href="/find-a-room">
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 shadow-md flex items-center justify-center gap-2">
                <FaBuilding className="h-5 w-5" /> Find a Room
              </Button>
            </Link>
            {/* <Button
              onClick={handleEmergencyService}
              className="w-full bg-red-500/80 hover:bg-red-500 text-white px-6 py-3 shadow-md flex items-center justify-center gap-2"
            >
              <TbAlertTriangleFilled className="h-5 w-5" /> Emergency
            </Button> */}
          </div>

          {/* Features */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center text-white/70 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <RiVerifiedBadgeFill className="h-4 w-4 text-green-400" /> Verified Workers
            </div>
            <div className="flex items-center gap-2 font-medium">
              <MdVerifiedUser className="h-4 w-4 text-green-400" /> Secure Platform
            </div>
            <div className="flex items-center gap-2 font-medium">
              <IoTimeSharp className="h-4 w-4 text-green-400" /> Quick Matching
            </div>
          </div>
        </div>
      </div>
      
      <EmergencyRequestModal
        open={openEmergencyModal}
        onOpenChange={setOpenEmergencyModal}
        services={services}
        loading={loading}
        category={category}
        setCategory={setCategory}
        MapSelector={MapSelector}
        ExpandedMapSelector={ExpandedMapSelector}
        openMapModal={openMapModal}
        setOpenMapModal={setOpenMapModal}
        mapPin={mapPin}
        setMapPin={setMapPin}
        mediaFiles={mediaFiles}
        setMediaFiles={setMediaFiles}
        handleMediaUpload={handleMediaUpload}
        description={description}
        setDescription={setDescription}
        price={price}
        setPrice={setPrice}
        manualLocation={manualLocation}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
