import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, OrbitControls } from '@react-three/drei';
import { Shield } from 'lucide-react';

function InteractivePrahariMesh({ mousePos }) {
  const meshRef = useRef();
  const innerRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.25;
      meshRef.current.rotation.y += delta * 0.35;
      
      // Subtle reaction to mouse position
      meshRef.current.rotation.y += (mousePos.x * 0.5 - meshRef.current.rotation.y) * 0.05;
      meshRef.current.rotation.x += (-mousePos.y * 0.5 - meshRef.current.rotation.x) * 0.05;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.4;
      innerRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group>
      {/* Outer Distorted Protective Shell */}
      <Sphere ref={meshRef} args={[1.3, 64, 64]} scale={1.2}>
        <MeshDistortMaterial
          color="#2E74B5"
          attach="material"
          distort={0.35}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
          emissive="#1F3864"
          emissiveIntensity={0.6}
        />
      </Sphere>

      {/* Outer Tech Wireframe Cage */}
      <mesh rotation={[0.4, 0.2, 0]}>
        <icosahedronGeometry args={[1.7, 2]} />
        <meshStandardMaterial
          color="#00B4D8"
          wireframe
          transparent
          opacity={0.35}
          emissive="#00B4D8"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Inner Energy Core */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#00B4D8"
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}

function FallbackFallbackGraphic() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-primary-navy via-accent-blue to-cyan-glow p-1 animate-pulse-glow shadow-glow-cyan">
        <div className="w-full h-full rounded-full bg-navy-dark flex items-center justify-center border border-cyan-glow/40">
          <Shield className="w-20 h-20 text-cyan-glow animate-float-slow" />
        </div>
      </div>
    </div>
  );
}

export default function Hero3DCanvas() {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
      }
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setMousePos({ x, y });
  };

  if (!hasWebGL) {
    return <FallbackFallbackGraphic />;
  }

  return (
    <div 
      className="w-full h-[360px] sm:h-[440px] lg:h-[500px] relative cursor-grab active:cursor-grabbing"
      onPointerMove={handlePointerMove}
    >
      <Suspense fallback={<FallbackFallbackGraphic />}>
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 45 }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -5]} intensity={1.2} color="#00B4D8" />
          <pointLight position={[0, 5, 0]} intensity={1.0} color="#2E74B5" />

          <Float speed={1.8} rotationIntensity={0.6} floatIntensity={0.8}>
            <InteractivePrahariMesh mousePos={mousePos} />
          </Float>

          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 2.3}
          />
        </Canvas>
      </Suspense>

      {/* Ambient background glow ring */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-glow/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
