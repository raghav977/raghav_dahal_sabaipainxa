import { Button } from '@/components/ui/button';
import { FaTools, FaShieldAlt, FaUsers, FaHeadset } from 'react-icons/fa';

export default function AboutKaamcha() {
  const features = [
    {
      icon: <FaTools className="h-6 w-6 text-green-500" />,
      title: 'Easy Booking & Quick Matching',
      description: 'Find and book services in minutes with our smart matching system.',
    },
    {
      icon: <FaShieldAlt className="h-6 w-6 text-green-500" />,
      title: 'Secure Payments & Transparent Pricing',
      description: 'Pay securely through our platform with no hidden fees.',
    },
    {
      icon: <FaUsers className="h-6 w-6 text-green-500" />,
      title: 'Verified & Trusted Professionals',
      description: 'All our service providers are vetted for quality and reliability.',
    },
    {
      icon: <FaHeadset className="h-6 w-6 text-green-500" />,
      title: '24/7 Customer Support',
      description: 'Our team is always here to help you with any questions or issues.',
    },
  ];

  return (
    <section className="py-20 bg-gray-50 w-full">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-playfair font-bold text-gray-800 mb-4">
            About Kaam-Chaa
          </h2>
          <p className="text-gray-600 font-ibm mb-8 leading-relaxed">
            Kaam-Chaa is your trusted platform for connecting with skilled
            service providers in your area. Whether you need help with
            household repairs, cleaning, caregiving, or professional services,
            we make it easy to find reliable experts.
          </p>
          <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-[4px]">
            Learn More About Us
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-[4px] border border-gray-200"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-[4px] bg-green-100 mb-4 mx-auto">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}