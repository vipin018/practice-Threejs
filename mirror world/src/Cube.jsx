import {React,useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import * as THREE from 'three'

const Cube = () => {

    // texture on the cube
    

    // animation of cube sin
    const ref = useRef()
    useFrame((_, delta) => {
        ref.current.rotation.y += delta * 0.5
    })

    return (
        <mesh
            ref={ref}
            scale={3}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial
                transmission={1}         // lets light pass through
                roughness={0}            // clear glass
                thickness={2}            // depth of glass
                metalness={0.1}
                reflectivity={1}
                clearcoat={1}
                clearcoatRoughness={0}
                color="#ffffff"
                opacity={0.5}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

export default Cube