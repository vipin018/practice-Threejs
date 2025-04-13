import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
const Cube = () => {

    const [ready, setReady] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setReady(true)
    }, 3000) // 3 second delay
  }, [])

  if (!ready) return null

    const { viewport } = useThree()

    const scale = viewport.width < 6 ? 2 : 3 // screen chhoti toh chhota cube
  // Create video element
  const [video] = useState(() => {
    const vid = document.createElement('video')
    vid.src = '/texture/texture.mp4' // Path to your video
    vid.loop = true
    vid.muted = true
    vid.play() // Start playing immediately
    return vid
  })

  // Use the video texture
  const texture = new THREE.VideoTexture(video)

  const ref = useRef()

  // Rotation animation
  useFrame((state, delta) => {
    ref.current.rotation.y += Math.sin(delta * 2) * 0.1
    // ref.current.rotation.x += Math.cos(delta * 2) * 0.02
  })

  return (
    <mesh ref={ref} position={[0,0,0]} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial
        transmission={1}         // lets light pass through
        roughness={1}            // clear glass
        thickness={10}            // depth of glass
        metalness={0.1}
        reflectivity={1}
        clearcoat={1}
        clearcoatRoughness={0}
        color="#ffffff"
        opacity={1}
        transparent
        side={THREE.DoubleSide}
        map={texture}            // Apply the video texture to the material
      />
    </mesh>
  )
}

export default Cube
