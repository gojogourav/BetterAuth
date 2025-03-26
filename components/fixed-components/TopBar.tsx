'use client'
import { usePathname } from 'next/navigation'
import React from 'react'
import image from '@/public/image.png'
import Image from 'next/image';
function TopBar() {
    const path = usePathname();
    // if(path!=='/') return;
  return (
    <div className=' top-0 py-2 left-0  flex items-center font-bold text-xl px-5 space-x-2 bg-white  w-full  '>
                   <Image className='select-none justify-self-center flex content-center' src={image} height={50} width={50} alt='icon'/>
        <div>
            TopBar
        </div>
    </div>
  )
}

export default TopBar