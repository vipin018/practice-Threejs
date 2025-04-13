import { Canvas } from '@react-three/fiber'
import React from 'react'
import {Environment } from '@react-three/drei'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import Cube from './Cube'
import Footer from './Footer'
import Navbar from './Navbar'
const App = () => {
  return (
    <>
     <Navbar/>
      <Canvas
        className="w-full h-full"
        camera={{position:[0,0,5], fov:70}}
      >
        <Cube />
        <Environment preset="city" />
        <EffectComposer>
          <Bloom intensity={0.05} />
          <ToneMapping />
        </EffectComposer>
      </Canvas>
     <Footer />
    </>
  )
}

export default App