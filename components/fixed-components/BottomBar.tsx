'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, House, CirclePlus, Send, User } from 'lucide-react'

function BottomBar() {
    const path = usePathname();

    if (path.startsWith('/login') || path.startsWith('/verify') || path.startsWith('/register')) return null;

    return (
        <div className='fixed bottom-0 w-full bg-white shadow-md'>
            <ul className='flex justify-around px-5 py-2 w-full'>
                {[
                    { route: '/', icon: <House />, label: 'Home' },
                    { route: '/explore', icon: <Compass />, label: 'Explore' },
                    { route: '/post', icon: <CirclePlus />, label: 'Post' },
                    { route: '/message', icon: <Send />, label: 'Messages' },
                    { route: '/profile', icon: <User />, label: 'Profile' }
                ].map(({ route, icon, label }) => (
                    <li key={route}>
                        <Link 
                            href={route} 
                            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                                path === route ? 'bg-black text-white' : 'text-gray-700'
                            }`}
                        >
                            {icon}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default BottomBar;
