import Link from 'next/link'
import React from 'react'

export default function Navbar() {
  return (
    <div className="flex justify-between items-center p-3  navbar w-full px-8 border-b text-black">
        <div>
          <p className="uppercase leading-none font-bold italic text-md sm:text-md md:text-lg lg:text-xl">axon</p>
        </div>
        <div>
          <Link href='/signup'>Signup</Link>
        </div>
    </div>
  )
}
