'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSubmenu = (title: string) => {
    setOpenMenus((prevOpenMenus) =>
      prevOpenMenus.includes(title)
        ? prevOpenMenus.filter((item) => item !== title)
        : [...prevOpenMenus, title]
    );
  };

  return (
    <div className="min-h-screen max-w-screen flex flex-col bg-white text-gray-600">
      <Header />

      <div className="flex flex-1 h-full">
        <aside
          ref={sidebarRef}
          className={cn(
            'hidden border-r transition-all duration-300 ease-in-out bg-white',
            isExpanded ? 'w-64' : 'w-[54px]',
            'md:block'
          )}
        >
          <Sidebar
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            openMenus={openMenus}
            toggleSubmenu={toggleSubmenu}
          />
        </aside>

        <main className="flex-1 p-6 min-h-full bg-white">{children}</main>
      </div>
    </div>
  );
}
