import { Html, useProgress } from '@react-three/drei'

function Loader() {
    const { progress } = useProgress()
    return (
        <Html center>
            <div className="text-white text-xl font-bold">
                Loading... {progress.toFixed(0)}%
            </div>
        </Html>
    )
}

export default Loader;