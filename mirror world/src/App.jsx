import { Canvas } from '@react-three/fiber'
import React from 'react'
import Cube from './Cube'
import Footer from './Footer'
import Navbar from './Navbar'
import Text from './Text'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { Suspense } from 'react'
import Loader from './Loader'
const App = () => {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Loader />}>
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 0, 5], fov: 70 }}
      >
        <Cube />
        <ambientLight intensity={5} />
        <directionalLight position={[1, 2, 3]} intensity={1.5} color={"lightseagreen"} />
        <directionalLight position={[-1, 2, 3]} intensity={1.5} color={"seagreen"} />
        <EffectComposer>
          <Bloom intensity={0.05} />
          <ToneMapping />
        </EffectComposer>
      </Canvas>
      </Suspense>
      {/* This will render behind the Cube */}
      <Text />
      
      <Footer />
    </>
  )
}

export default App
