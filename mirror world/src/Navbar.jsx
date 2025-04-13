import React from 'react'

const Navbar = () => {
    return (
        <nav className="absolute top-0 left-0 w-full px-15 py-8 flex justify-between text-white z-10 font-sans">
            <h2 className="text-xl "><span className=" text-3xl font-bold">Design</span> World</h2>
            <div className="space-x-6">
                <a href="#" className="hover:underline">Home</a>
                <a href="#" className="hover:underline">Portfolio</a>
                <a href="#" className="hover:underline">Contact</a>
            </div>
        </nav>
    )
}

export default Navbar