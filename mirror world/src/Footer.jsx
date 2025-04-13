import React from 'react'

const Footer = () => {
  return (
    <>
    <div id='footer' className='z-10 absolute bottom-0 left-0 w-[25%] px-20 py-10'>
        <h2 className=" text-2xl font-bold">Let's build the future of <span className=" text-5xl">Design.</span></h2>
      </div>
      <button id='button' className=' absolute bottom-10 left-1/2 -translate-x-1/2 bg-transparent text-white px-4 py-2 rounded-md border-2 border-white animate-pulse hover:bg-white hover:text-black transition-all duration-500'>Explore Now</button>
      </>
  )
}

export default Footer