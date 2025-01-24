import Link from 'next/link'
import React from 'react'

export default function Navbar() {
  return (
    <div className="flex justify-between items-center p-3 text-white navbar w-full px-8">
        <div className="">
          <p className="uppercase leading-none font-bold italic text-md sm:text-md md:text-lg lg:text-xl logo">axon</p>
        </div>
        <div className='signupOptions'>
          <Link href='/signup'>Signup</Link>
        </div>
    </div>
  )
}
