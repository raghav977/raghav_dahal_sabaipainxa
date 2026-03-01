import { Sidebar } from "lucide-react";

export default function Layout({children}) {

    const menuItems = [
        { name: "निबेदन", link: "/nepali-template/nibedan" },
        { name: "पत्र", link: "/nepali-template/letter" },
        { name: "सि.बि", link: "/nepali-template/cv" }
    ];
  return (
    <div className='flex'>
        <aside className='w-64 bg-white h-screen shadow-md'>
            <div className='p-4 border-b'>
                <h2 className='text-xl font-bold'>नेपाली टेम्प्लेटहरू</h2>
            </div>
            <nav className='mt-4'>
                <ul>
                    {menuItems.map((item) => (
                        <li key={item.name} className='border-b'>
                            <a href={item.link} className='block px-4 py-2 hover:bg-gray-100'>
                                {item.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
      <main className='flex-1 p-4'>
        {children}
      </main>
    </div>
  )
}