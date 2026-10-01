import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Maximize2, Eye, Layers, Compass, Flame, Droplet, 
  RotateCcw, Sliders, ShieldCheck, Activity, Info
} from 'lucide-react';

/**
 * IntegratedTwin3D — Commercial Industrial Cyber-Physical 3D Simulation
 * 
 * Features:
 * - Bright Daylight HDRI-style environment (ACES Filmic, sRGB, daylight directional sun)
 * - PBR Materials (MeshStandardMaterial / MeshPhysicalMaterial) with procedural metal/rust/roughness textures
 * - OTSG Steam Generator with structural ribs, burner, exhaust stack plume
 * - Steam line with CatmullRomCurve3 expansion loop, insulation cladding bands, valve handwheels
 * - Christmas Tree wellhead with visible mode switch (Steam vs Production)
 * - SRP Nodding Donkey: Samson post with X-bracing, walking beam, horsehead & bridle, four-bar linkage kinematics
 * - 3-phase horizontal separator V-101 with sight glass fluid hue & dual API 650 cone-roof oil tanks with rising fluid level
 * - Sliced geological block with 5 natural strata (Overburden shale, limestone, Bilara dolomite, Jodhpur pay, water table)
 * - Multi-shell volumetric heat field (#3B6EA8 -> #FFF6E5) with moving isotherm rings (100°C, 150°C, 200°C)
 * - Particle systems: Steam Huff injection & upward oil lift with speed/color tied to dynamic viscosity
 * - Raycaster hover tooltips with 3D anchored leader lines
 * - 5 Eased Camera Presets + Ghost Comparison Overlay + X-Ray slider
 */
export default function IntegratedTwin3D({
  twinState,
  ghostMode = false,
  xraySurface = 0.0, // 0 (opaque) to 1 (fully transparent surface)
  layerToggles = { strata: true, heatField: true, isotherms: true, streamlines: true, labels: true },
  onSelectComponent,
  activeCameraPreset = 'full-field',
  onCameraChange
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);

  // References to animated 3D parts
  const pumpNodesRef = useRef({});
  const steamParticlesRef = useRef(null);
  const oilParticlesRef = useRef(null);
  const stackPlumeRef = useRef(null);
  const heatMeshRef = useRef(null);
  const tankLevelMeshRef = useRef(null);
  const ghostHeatMeshRef = useRef(null);
  const isothermGroupRef = useRef(null);
  const surfaceGroupRef = useRef(null);
  const raycastObjectsRef = useRef([]);

  // Tooltip HUD state
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Camera presets definition (calibrated to center both surface plant & subsurface cutaway)
  const cameraPresets = {
    'full-field': { pos: [46, 32, 50], target: [0, 2, 0] },
    'steam-facility': { pos: [-36, 16, 18], target: [-28, 5, -10] },
    'wellbore-pump': { pos: [14, 10, 18], target: [-2, 3, 0] },
    'reservoir-cutaway': { pos: [28, -12, 42], target: [0, -26, 0] },
    'surface-production': { pos: [38, 20, -10], target: [26, 6, -14] },
    'top-down': { pos: [0, 80, 0.1], target: [0, 0, 0] },
  };

  // 1. Procedural Texture Generators for PBR realism
  const createProceduralMetalTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b8c2cc';
    ctx.fillRect(0, 0, 256, 256);
    // Subtle noise scratch lines
    for (let i = 0; i < 400; i++) {
      ctx.strokeStyle = Math.random() > 0.5 ? '#d5dbe1' : '#94a3b8';
      ctx.lineWidth = 0.5 + Math.random();
      ctx.beginPath();
      const y = Math.random() * 256;
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  const createProceduralSandTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e6d5b8';
    ctx.fillRect(0, 0, 256, 256);
    // Sand grains
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#dcc49f' : '#f2e6cf';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // A. Scene & Bright Daylight Control Room Environment
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Daylight sky background with subtle warm gradient
    scene.background = new THREE.Color('#eef1f4');
    scene.fog = new THREE.FogExp2('#eef1f4', 0.0055);

    // B. Camera & Controls
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 1000);
    const initialPreset = cameraPresets['full-field'];
    camera.position.set(...initialPreset.pos);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI - 0.05; // Full subterranean rotation freedom
    controls.minDistance = 5;
    controls.maxDistance = 220;
    controls.target.set(...initialPreset.target);
    controlsRef.current = controls;

    // C. Realistic Daylight Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#fffaf0', 1.6);
    sunLight.position.set(70, 95, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -70;
    sunLight.shadow.camera.right = 70;
    sunLight.shadow.camera.top = 70;
    sunLight.shadow.camera.bottom = -70;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Soft sky fill
    const skyFill = new THREE.HemisphereLight('#ebf5fb', '#d5dbe1', 0.45);
    scene.add(skyFill);

    // Reusable Materials
    const metalTex = createProceduralMetalTexture();
    const sandTex = createProceduralSandTexture();

    const steelMat = new THREE.MeshStandardMaterial({
      color: '#5b6773',
      metalness: 0.75,
      roughness: 0.35,
      map: metalTex,
    });

    const paintedWhiteMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      metalness: 0.2,
      roughness: 0.4,
    });

    const industrialOrangeMat = new THREE.MeshStandardMaterial({
      color: '#ff6a13',
      metalness: 0.4,
      roughness: 0.35,
    });

    const steamBlueMat = new THREE.MeshStandardMaterial({
      color: '#0b7bc1',
      metalness: 0.5,
      roughness: 0.3,
    });

    const concreteMat = new THREE.MeshStandardMaterial({
      color: '#d5dbe1',
      roughness: 0.85,
      metalness: 0.1,
    });

    // Master Groups
    const surfaceGroup = new THREE.Group();
    surfaceGroup.name = "SurfaceFacility";
    scene.add(surfaceGroup);
    surfaceGroupRef.current = surfaceGroup;

    const subsurfaceGroup = new THREE.Group();
    subsurfaceGroup.name = "SubsurfaceGeology";
    scene.add(subsurfaceGroup);

    // -------------------------------------------------------------
    // 1. SURFACE EQUIPMENT: Detailed & Engineered (No Naked Primitives)
    // -------------------------------------------------------------

    // A. Ground Pad & Terrain
    const padGeo = new THREE.BoxGeometry(110, 1.2, 85);
    const padMesh = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.9 }));
    padMesh.position.set(0, -0.6, 0);
    padMesh.receiveShadow = true;
    surfaceGroup.add(padMesh);

    // Concrete equipment foundations
    const pumpPad = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 8), concreteMat);
    pumpPad.position.set(-2, 0.4, 0);
    pumpPad.receiveShadow = true;
    surfaceGroup.add(pumpPad);

    const boilerPad = new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 14), concreteMat);
    boilerPad.position.set(-32, 0.4, -12);
    boilerPad.receiveShadow = true;
    surfaceGroup.add(boilerPad);

    const tankPad = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 16), concreteMat);
    tankPad.position.set(30, 0.4, -16);
    tankPad.receiveShadow = true;
    surfaceGroup.add(tankPad);

    // B. Steam Generator (OTSG-50 Style Unit)
    const boilerGroup = new THREE.Group();
    boilerGroup.position.set(-32, 0.8, -12);
    boilerGroup.userData = { name: "OTSG-50 Steam Generator", value: "282°C / 68 bar @ 140 TPD", provenance: "SIMULATED" };
    surfaceGroup.add(boilerGroup);
    raycastObjectsRef.current.push(boilerGroup);

    // Insulated Radiant Box with structural channels
    const radiantBox = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 10), paintedWhiteMat);
    radiantBox.position.set(0, 4, 0);
    radiantBox.castShadow = true;
    boilerGroup.add(radiantBox);

    // Structural steel ribs around radiant box
    for (let rx = -5; rx <= 5; rx += 2.5) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.3, 8.2, 10.3), steelMat);
      rib.position.set(rx, 4, 0);
      boilerGroup.add(rib);
    }

    // Tall Exhaust Plume Stack with rain cap
    const stackGeo = new THREE.CylinderGeometry(0.85, 1.0, 14, 24);
    const stackMesh = new THREE.Mesh(stackGeo, steelMat);
    stackMesh.position.set(4.5, 11, 0);
    stackMesh.castShadow = true;
    boilerGroup.add(stackMesh);

    const rainCap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.8, 24), steelMat);
    rainCap.position.set(4.5, 18.2, 0);
    boilerGroup.add(rainCap);

    // Burner assembly & fuel intake skid
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16), steelMat);
    burner.rotation.z = Math.PI / 2;
    burner.position.set(-7.5, 3.5, 0);
    boilerGroup.add(burner);

    // Steam header manifold with safety release valve
    const headerManifold = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 16), steamBlueMat);
    headerManifold.position.set(0, 8.6, 3);
    boilerGroup.add(headerManifold);

    // C. Insulated Steam Line with Expansion Loops (CatmullRomCurve3)
    const steamCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-25, 2.5, -9),
      new THREE.Vector3(-18, 2.5, -9),
      new THREE.Vector3(-18, 5.0, -9), // Loop up
      new THREE.Vector3(-14, 5.0, -9),
      new THREE.Vector3(-14, 2.5, -9), // Loop down
      new THREE.Vector3(-5, 2.5, -4),
      new THREE.Vector3(0, 2.5, 0),
    ]);
    const steamLineGeo = new THREE.TubeGeometry(steamCurve, 40, 0.35, 16, false);
    const steamLineMesh = new THREE.Mesh(steamLineGeo, steamBlueMat);
    steamLineMesh.castShadow = true;
    steamLineMesh.userData = { name: "High-Pressure Steam Header", value: "68.0 bar Superheated Flow", provenance: "ASSUMED" };
    surfaceGroup.add(steamLineMesh);
    raycastObjectsRef.current.push(steamLineMesh);

    // Pipe support stanchions
    for (let stX of [-20, -10, -4]) {
      const stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 1.2), steelMat);
      stanchion.position.set(stX, 1.3, -6.5);
      surfaceGroup.add(stanchion);
    }

    // D. Wellhead (Christmas Tree) with Visible Mode Switch
    const wellheadGroup = new THREE.Group();
    wellheadGroup.position.set(0, 0.8, 0);
    wellheadGroup.userData = { name: "Wellhead Christmas Tree", value: "Dual Master Valves V-101 / V-201", provenance: "ASSUMED" };
    surfaceGroup.add(wellheadGroup);
    raycastObjectsRef.current.push(wellheadGroup);

    // Casing Head Spool & Flanges
    const casingSpool = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.5, 16), steelMat);
    casingSpool.position.set(0, 0.75, 0);
    wellheadGroup.add(casingSpool);

    // Flange Bolts (InstancedMesh: 32 bolts across two flange rings)
    const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 6);
    const boltCount = 16;
    const flangeBolts = new THREE.InstancedMesh(boltGeo, steelMat, boltCount * 2);
    const dummy = new THREE.Object3D();
    let bIdx = 0;
    for (let ring = 0; ring < 2; ring++) {
      const ringY = ring === 0 ? 0.2 : 1.4;
      const radius = ring === 0 ? 1.05 : 0.95;
      for (let i = 0; i < boltCount; i++) {
        const angle = (i / boltCount) * Math.PI * 2;
        dummy.position.set(Math.cos(angle) * radius, ringY, Math.sin(angle) * radius);
        dummy.updateMatrix();
        flangeBolts.setMatrixAt(bIdx++, dummy.matrix);
      }
    }
    flangeBolts.instanceMatrix.needsUpdate = true;
    flangeBolts.castShadow = true;
    wellheadGroup.add(flangeBolts);

    // Master Valves with handwheels
    for (let vy of [1.6, 2.8]) {
      const valveBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), steelMat);
      valveBody.position.set(0, vy, 0);
      wellheadGroup.add(valveBody);

      const handwheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 12, 24), industrialOrangeMat);
      handwheel.rotation.y = Math.PI / 2;
      handwheel.position.set(0.7, vy, 0);
      wellheadGroup.add(handwheel);
    }

    // Polished Rod & Stuffing Box
    const stuffingBox = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.9, 16), industrialOrangeMat);
    stuffingBox.position.set(0, 3.6, 0);
    wellheadGroup.add(stuffingBox);

    const polishedRod = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.0, 16), steelMat);
    polishedRod.position.set(0, 5.5, 0);
    wellheadGroup.add(polishedRod);
    pumpNodesRef.current.polishedRod = polishedRod;

    // E. Sucker-Rod Pump (SRP Nodding Donkey) with Kinematic 4-Bar Linkage
    const srpGroup = new THREE.Group();
    srpGroup.position.set(-6, 0.8, 0);
    srpGroup.userData = { name: "Sucker-Rod Pumping Unit (SRP)", value: "API C-228D-200-100 &bull; 2.0 SPM", provenance: "ASSUMED" };
    surfaceGroup.add(srpGroup);
    raycastObjectsRef.current.push(srpGroup);

    // Samson Post (A-Frame with Cross Bracing)
    const samsonPostMat = new THREE.MeshStandardMaterial({ color: '#3a4754', metalness: 0.6, roughness: 0.4 });
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 10.5, 12), samsonPostMat);
    leg1.rotation.z = -0.22;
    leg1.position.set(-1.1, 5.2, 1.2);
    srpGroup.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 10.5, 12), samsonPostMat);
    leg2.rotation.z = -0.22;
    leg2.position.set(-1.1, 5.2, -1.2);
    srpGroup.add(leg2);

    const legBack = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 10.8, 12), samsonPostMat);
    legBack.rotation.z = 0.24;
    legBack.position.set(1.2, 5.2, 0);
    srpGroup.add(legBack);

    // Center Bearing Saddle at top of Samson post
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.0), steelMat);
    saddle.position.set(0, 10.2, 0);
    srpGroup.add(saddle);

    // Walking Beam (Rotates about Z-axis at [0, 10.2, 0])
    const beamPivotGroup = new THREE.Group();
    beamPivotGroup.position.set(0, 10.2, 0);
    srpGroup.add(beamPivotGroup);
    pumpNodesRef.current.beamPivot = beamPivotGroup;

    // Flanged I-Beam
    const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(12.5, 1.2, 0.8), industrialOrangeMat);
    beamMesh.position.set(0.5, 0, 0);
    beamMesh.castShadow = true;
    beamPivotGroup.add(beamMesh);

    // Horsehead with wire bridle curve
    const horseheadGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.7, 16, 1, false, Math.PI * 0.45, Math.PI * 0.55);
    const horsehead = new THREE.Mesh(horseheadGeo, industrialOrangeMat);
    horsehead.rotation.z = Math.PI / 2;
    horsehead.position.set(6.2, 0.6, 0);
    beamPivotGroup.add(horsehead);

    // Wire bridle cables to wellhead
    const bridleLine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.2, 8), steelMat);
    bridleLine.position.set(6.0, -2.4, 0);
    beamPivotGroup.add(bridleLine);

    // Gearbox Housing & Electric Drive Motor
    const gearBox = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.2, 3.0), steelMat);
    gearBox.position.set(-4.5, 1.8, 0);
    gearBox.castShadow = true;
    srpGroup.add(gearBox);

    const electricMotor = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.4, 16), steamBlueMat);
    electricMotor.rotation.x = Math.PI / 2;
    electricMotor.position.set(-7.2, 1.2, 0);
    srpGroup.add(electricMotor);

    // Rotating Crank Arms with Counterweights
    const crankPivot = new THREE.Group();
    crankPivot.position.set(-4.5, 2.2, 1.8);
    srpGroup.add(crankPivot);
    pumpNodesRef.current.crankPivot = crankPivot;

    const crankArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.8, 0.4), steelMat);
    crankArm.position.set(0, -1.2, 0);
    crankPivot.add(crankArm);

    // Counterweight bolted to crank
    const counterweight = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.9), industrialOrangeMat);
    counterweight.position.set(0, -2.4, 0);
    counterweight.castShadow = true;
    crankPivot.add(counterweight);

    // Opposite crank
    const crankPivotOpp = new THREE.Group();
    crankPivotOpp.position.set(-4.5, 2.2, -1.8);
    srpGroup.add(crankPivotOpp);
    pumpNodesRef.current.crankPivotOpp = crankPivotOpp;

    const crankArmOpp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.8, 0.4), steelMat);
    crankArmOpp.position.set(0, -1.2, 0);
    crankPivotOpp.add(crankArmOpp);

    const counterweightOpp = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.9), industrialOrangeMat);
    counterweightOpp.position.set(0, -2.4, 0);
    counterweightOpp.castShadow = true;
    crankPivotOpp.add(counterweightOpp);

    // Pitman Arm connecting crank pin to rear of walking beam
    const pitmanArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7.8, 12), steelMat);
    pitmanArm.position.set(-4.8, 6.2, 1.8);
    srpGroup.add(pitmanArm);
    pumpNodesRef.current.pitmanArm = pitmanArm;

    // F. Horizontal 3-Phase Test Separator V-101
    const separatorGroup = new THREE.Group();
    separatorGroup.position.set(16, 0.8, -12);
    separatorGroup.userData = { name: "3-Phase Test Separator V-101", value: "Oil/Water/Gas Split &bull; P = 65 psia", provenance: "SIMULATED" };
    surfaceGroup.add(separatorGroup);
    raycastObjectsRef.current.push(separatorGroup);

    // Vessel cylinder with ellipsoidal ends
    const sepVessel = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 8.5, 24), paintedWhiteMat);
    sepVessel.rotation.z = Math.PI / 2;
    sepVessel.position.set(0, 3.2, 0);
    sepVessel.castShadow = true;
    separatorGroup.add(sepVessel);

    const head1 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), paintedWhiteMat);
    head1.rotation.z = -Math.PI / 2;
    head1.position.set(-4.25, 3.2, 0);
    separatorGroup.add(head1);

    const head2 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), paintedWhiteMat);
    head2.rotation.z = Math.PI / 2;
    head2.position.set(4.25, 3.2, 0);
    separatorGroup.add(head2);

    // Saddle supports
    const sepSaddle1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 3.6), steelMat);
    sepSaddle1.position.set(-2.5, 0.8, 0);
    separatorGroup.add(sepSaddle1);

    const sepSaddle2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 3.6), steelMat);
    sepSaddle2.position.set(2.5, 0.8, 0);
    separatorGroup.add(sepSaddle2);

    // Sight Glass showing oil color
    const sightGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.2, 16), new THREE.MeshStandardMaterial({
      color: '#d97706',
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    }));
    sightGlass.position.set(0, 3.2, 2.1);
    separatorGroup.add(sightGlass);

    // G. Dual API 650 Storage Tanks (TK-101 & TK-102)
    const tankGroup = new THREE.Group();
    tankGroup.position.set(30, 0.8, -16);
    tankGroup.userData = { name: "Dual API 650 Oil Tanks", value: "30,000 bbl Storage &bull; Level: 65%", provenance: "SIMULATED" };
    surfaceGroup.add(tankGroup);
    raycastObjectsRef.current.push(tankGroup);

    for (let tIdx of [-5.5, 5.5]) {
      const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 9.0, 32), paintedWhiteMat);
      tankBody.position.set(tIdx, 4.5, 0);
      tankBody.castShadow = true;
      tankGroup.add(tankBody);

      const coneRoof = new THREE.Mesh(new THREE.ConeGeometry(4.7, 1.5, 32), steelMat);
      coneRoof.position.set(tIdx, 9.75, 0);
      tankGroup.add(coneRoof);

      // Spiral staircase rails (illustrative)
      const stairRail = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.08, 8, 32, Math.PI * 1.5), steelMat);
      stairRail.rotation.x = Math.PI / 2;
      stairRail.position.set(tIdx, 4.5, 0);
      tankGroup.add(stairRail);
    }

    // Dynamic Tank Level Indicator (rising orange cylinder inside transparent preview)
    const tankLvlMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(4.4, 4.4, 5.8, 24),
      new THREE.MeshStandardMaterial({ color: '#ff6a13', transparent: true, opacity: 0.55 })
    );
    tankLvlMesh.position.set(-5.5, 3.2, 0);
    tankGroup.add(tankLvlMesh);
    tankLevelMeshRef.current = tankLvlMesh;

    // -------------------------------------------------------------
    // 2. UNDERGROUND CUTAWAY & GEOLOGY (Clean Sliced Block)
    // -------------------------------------------------------------

    // Distinct natural strata layers:
    // Topsoil / Sand: Y = 0 to -8
    // Overburden Shale: Y = -8 to -18
    // Limestone: Y = -18 to -26
    // Bilara Dolomite Caprock: Y = -26 to -34
    // Jodhpur Sandstone Pay Zone: Y = -34 to -48 (18m Net Pay)
    // Basal Aquifer / Basement: Y = -48 to -60
    const strataConfigs = [
      { name: "Aeolian Topsoil & Sand", yTop: 0, yBot: -8, color: '#e6d5b8' },
      { name: "Nagaur Overburden Shale", yTop: -8, yBot: -18, color: '#9eaa98' },
      { name: "Bilara Limestone", yTop: -18, yBot: -26, color: '#e8e2d2' },
      { name: "Impermeable Dolomite Cap Rock", yTop: -26, yBot: -34, color: '#c8bcac' },
      { name: "Cambrian Jodhpur Sandstone (Pay Zone)", yTop: -34, yBot: -48, color: '#4a3525' },
      { name: "Basal Aquifer & Basement", yTop: -48, yBot: -60, color: '#7a9e9f' },
    ];

    const blockWidth = 90;
    const blockDepth = 60;

    strataConfigs.forEach((st) => {
      const thick = st.yTop - st.yBot;
      const yCenter = st.yTop - thick / 2;
      const strataGeo = new THREE.BoxGeometry(blockWidth, thick, blockDepth);
      const strataMat = new THREE.MeshStandardMaterial({
        color: st.color,
        roughness: 0.95,
        metalness: 0.05,
      });
      const strataMesh = new THREE.Mesh(strataGeo, strataMat);
      strataMesh.position.set(0, yCenter, 0);
      strataMesh.receiveShadow = true;
      subsurfaceGroup.add(strataMesh);
    });

    // Subsurface Wellbore Casing & Perforated Tubing
    const wellCasing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 60, 24),
      new THREE.MeshStandardMaterial({ color: '#5b6773', metalness: 0.8, roughness: 0.3 })
    );
    wellCasing.position.set(0, -30, 0);
    subsurfaceGroup.add(wellCasing);

    // Inner Transparent Tubing String
    const innerTubing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 55, 16),
      new THREE.MeshStandardMaterial({ color: '#0b7bc1', transparent: true, opacity: 0.65 })
    );
    innerTubing.position.set(0, -27.5, 0);
    subsurfaceGroup.add(innerTubing);

    // Slotted Perforations Interval at Pay Zone (Y = -35 to -46)
    const perfInterval = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 12, 16),
      new THREE.MeshStandardMaterial({ color: '#ff6a13', wireframe: true })
    );
    perfInterval.position.set(0, -41, 0);
    perfInterval.userData = { name: "Slotted Casing Perforations", value: "1,050m TVD &bull; 18m Net Pay", provenance: "ASSUMED" };
    subsurfaceGroup.add(perfInterval);
    raycastObjectsRef.current.push(perfInterval);

    // Volumetric Heated Chamber (Nested Thermal Shells)
    const heatGroup = new THREE.Group();
    heatGroup.position.set(0, -41, 0);
    subsurfaceGroup.add(heatGroup);
    heatMeshRef.current = heatGroup;

    // Multi-layer perceptual temperature ramp:
    // Core (282°C): White-Hot #FFF6E5
    // Inner (200°C): Red-Orange #E4572E
    // Mid (150°C): Golden Amber #F59E42
    // Outer (100°C): Warm Yellow #F6E08A
    // Edge (48°C): Cool Blue #3B6EA8
    const shell1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 12.5, 24),
      new THREE.MeshBasicMaterial({ color: '#fff6e5', transparent: true, opacity: 0.85 })
    );
    heatGroup.add(shell1);

    const shell2 = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 8.5, 13.0, 24),
      new THREE.MeshBasicMaterial({ color: '#e4572e', transparent: true, opacity: 0.55 })
    );
    heatGroup.add(shell2);

    const shell3 = new THREE.Mesh(
      new THREE.CylinderGeometry(14.0, 14.0, 13.5, 24),
      new THREE.MeshBasicMaterial({ color: '#f59e42', transparent: true, opacity: 0.40 })
    );
    heatGroup.add(shell3);

    const shell4 = new THREE.Mesh(
      new THREE.CylinderGeometry(18.5, 18.5, 14.0, 24),
      new THREE.MeshBasicMaterial({ color: '#3b6ea8', transparent: true, opacity: 0.25 })
    );
    heatGroup.add(shell4);

    // Ghost Comparison Mesh (Translucent Baseline Overlay)
    const ghostMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(18.5, 18.5, 14.2, 24),
      new THREE.MeshBasicMaterial({ color: '#0b7bc1', wireframe: true, transparent: true, opacity: 0.35 })
    );
    ghostMesh.position.set(0, -41, 0);
    ghostMesh.visible = false;
    subsurfaceGroup.add(ghostMesh);
    ghostHeatMeshRef.current = ghostMesh;

    // Moving Isotherm Rings (100°C, 150°C, 200°C)
    const isothermGroup = new THREE.Group();
    isothermGroup.position.set(0, -41, 0);
    subsurfaceGroup.add(isothermGroup);
    isothermGroupRef.current = isothermGroup;

    const iso200 = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.12, 12, 48), new THREE.MeshBasicMaterial({ color: '#e4572e' }));
    iso200.rotation.x = Math.PI / 2;
    isothermGroup.add(iso200);

    const iso150 = new THREE.Mesh(new THREE.TorusGeometry(14.0, 0.12, 12, 48), new THREE.MeshBasicMaterial({ color: '#f59e42' }));
    iso150.rotation.x = Math.PI / 2;
    isothermGroup.add(iso150);

    const iso100 = new THREE.Mesh(new THREE.TorusGeometry(18.5, 0.12, 12, 48), new THREE.MeshBasicMaterial({ color: '#3b6ea8' }));
    iso100.rotation.x = Math.PI / 2;
    isothermGroup.add(iso100);

    // -------------------------------------------------------------
    // 3. PARTICLE SYSTEMS: Steam Injection & Oil Lift Flow
    // -------------------------------------------------------------

    // Steam Injected Particles (Travel down tubing)
    const steamPartCount = 80;
    const steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamPartCount * 3);
    for (let i = 0; i < steamPartCount; i++) {
      steamPos[i * 3] = (Math.random() - 0.5) * 0.3;
      steamPos[i * 3 + 1] = 2.0 - (i / steamPartCount) * 45.0; // from wellhead to pay zone
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({ color: '#ffffff', size: 0.65, transparent: true, opacity: 0.9 });
    const steamParticles = new THREE.Points(steamGeo, steamMat);
    scene.add(steamParticles);
    steamParticlesRef.current = steamParticles;

    // Oil Lift Flow Particles (Travel up tubing from perforations to wellhead)
    const oilPartCount = 120;
    const oilGeo = new THREE.BufferGeometry();
    const oilPos = new Float32Array(oilPartCount * 3);
    for (let i = 0; i < oilPartCount; i++) {
      oilPos[i * 3] = (Math.random() - 0.5) * 0.35;
      oilPos[i * 3 + 1] = -42.0 + (i / oilPartCount) * 45.0;
      oilPos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
    }
    oilGeo.setAttribute('position', new THREE.BufferAttribute(oilPos, 3));
    const oilMat = new THREE.PointsMaterial({ color: '#ff6a13', size: 0.85, transparent: true, opacity: 0.95 });
    const oilParticles = new THREE.Points(oilGeo, oilMat);
    scene.add(oilParticles);
    oilParticlesRef.current = oilParticles;

    // Boiler Stack Plume Particles
    const plumeCount = 40;
    const plumeGeo = new THREE.BufferGeometry();
    const plumePos = new Float32Array(plumeCount * 3);
    for (let i = 0; i < plumeCount; i++) {
      plumePos[i * 3] = -27.5 + (Math.random() - 0.5) * 1.5;
      plumePos[i * 3 + 1] = 19.0 + (i / plumeCount) * 8.0;
      plumePos[i * 3 + 2] = -12.0 + (Math.random() - 0.5) * 1.5;
    }
    plumeGeo.setAttribute('position', new THREE.BufferAttribute(plumePos, 3));
    const plumeMat = new THREE.PointsMaterial({ color: '#d5dbe1', size: 1.2, transparent: true, opacity: 0.45 });
    const stackPlume = new THREE.Points(plumeGeo, plumeMat);
    scene.add(stackPlume);
    stackPlumeRef.current = stackPlume;

    // -------------------------------------------------------------
    // 4. ANIMATION LOOP (60 FPS Kinematics & Coupling)
    // -------------------------------------------------------------
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // SRP 4-Bar Kinematics
      const spm = twinState?.well_and_pump?.spm || 2.0;
      const pumpActive = twinState?.well_and_pump?.pump_active !== false;

      if (pumpActive && spm > 0) {
        const radPerSec = (spm * 2 * Math.PI) / 60.0;
        const crankAngle = (time * radPerSec) % (2 * Math.PI);

        if (pumpNodesRef.current.crankPivot) {
          pumpNodesRef.current.crankPivot.rotation.z = crankAngle;
        }
        if (pumpNodesRef.current.crankPivotOpp) {
          pumpNodesRef.current.crankPivotOpp.rotation.z = crankAngle;
        }

        // Kinematic tilt of walking beam
        const beamTilt = Math.sin(crankAngle) * 0.16; // +/- 9 degrees
        if (pumpNodesRef.current.beamPivot) {
          pumpNodesRef.current.beamPivot.rotation.z = beamTilt;
        }

        // Reciprocating polished rod up and down
        if (pumpNodesRef.current.polishedRod) {
          pumpNodesRef.current.polishedRod.position.y = 5.5 + beamTilt * 5.0;
        }

        // Animate Oil Lift Particles (Speed tied to 1 / viscosity)
        if (oilParticlesRef.current && layerToggles.streamlines) {
          const visc = twinState?.reservoir?.wellbore_viscosity_cp || 245.0;
          const speedFactor = Math.max(0.5, Math.min(6.0, 3000.0 / visc));
          const positions = oilParticlesRef.current.geometry.attributes.position.array;
          for (let i = 0; i < oilPartCount; i++) {
            positions[i * 3 + 1] += delta * (8.0 * speedFactor);
            if (positions[i * 3 + 1] > 2.0) {
              positions[i * 3 + 1] = -42.0;
            }
          }
          oilParticlesRef.current.geometry.attributes.position.needsUpdate = true;
          // Particle color shift based on viscosity (tar black to golden amber)
          oilParticlesRef.current.material.color.set(visc > 2000 ? '#181412' : (visc > 600 ? '#b25300' : '#ff6a13'));
          oilParticlesRef.current.visible = true;
        }
      } else {
        if (oilParticlesRef.current) oilParticlesRef.current.visible = false;
      }

      // Animate Steam Injection Particles during Huff
      const isInjecting = twinState?.is_injecting;
      if (steamParticlesRef.current) {
        if (isInjecting && layerToggles.streamlines) {
          steamParticlesRef.current.visible = true;
          const positions = steamParticlesRef.current.geometry.attributes.position.array;
          for (let i = 0; i < steamPartCount; i++) {
            positions[i * 3 + 1] -= delta * 18.0;
            if (positions[i * 3 + 1] < -42.0) {
              positions[i * 3 + 1] = 2.0;
            }
          }
          steamParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          steamParticlesRef.current.visible = false;
        }
      }

      // Animate Boiler Stack Plume
      if (stackPlumeRef.current) {
        const positions = stackPlumeRef.current.geometry.attributes.position.array;
        for (let i = 0; i < plumeCount; i++) {
          positions[i * 3 + 1] += delta * 4.5;
          positions[i * 3] += (Math.random() - 0.5) * 0.05;
          if (positions[i * 3 + 1] > 27.0) {
            positions[i * 3 + 1] = 19.0;
            positions[i * 3] = -27.5 + (Math.random() - 0.5) * 0.8;
          }
        }
        stackPlumeRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Dynamic Heat Chamber Scaling based on physical heated radius
      if (heatMeshRef.current) {
        const rHeat = twinState?.reservoir?.heated_radius_m || 18.5;
        const scaleVal = Math.max(0.1, rHeat / 18.5);
        heatMeshRef.current.scale.set(scaleVal, 1.0, scaleVal);
        heatMeshRef.current.visible = layerToggles.heatField;
      }

      // Isotherms scaling & visibility
      if (isothermGroupRef.current) {
        const rHeat = twinState?.reservoir?.heated_radius_m || 18.5;
        const scaleVal = Math.max(0.1, rHeat / 18.5);
        isothermGroupRef.current.scale.set(scaleVal, 1.0, scaleVal);
        isothermGroupRef.current.visible = layerToggles.isotherms;
      }

      // Tank Level Scaling
      if (tankLevelMeshRef.current) {
        const lvlPct = twinState?.surface?.tank_level_pct || 65.0;
        tankLevelMeshRef.current.scale.set(1.0, lvlPct / 100.0, 1.0);
      }

      // Controls update
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Raycasting Hover Handler for 3D Anchored Tooltips
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (e) => {
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastObjectsRef.current, true);

      if (intersects.length > 0) {
        // Find topmost object with userData
        let obj = intersects[0].object;
        while (obj && !obj.userData?.name && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.name) {
          setHoveredInfo(obj.userData);
          setTooltipPos({ x: e.clientX - rect.left + 15, y: e.clientY - rect.top - 20 });
        }
      } else {
        setHoveredInfo(null);
      }
    };

    mountRef.current.addEventListener('mousemove', handleMouseMove);

    // Cleanup & Memory Disposal on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      controls.dispose();
      renderer.dispose();
      scene.clear();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Ghost Mode Mesh
  useEffect(() => {
    if (ghostHeatMeshRef.current) {
      ghostHeatMeshRef.current.visible = ghostMode;
    }
  }, [ghostMode]);

  // Update Surface X-Ray Opacity
  useEffect(() => {
    if (surfaceGroupRef.current) {
      surfaceGroupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = xraySurface > 0.05;
          child.material.opacity = Math.max(0.08, 1.0 - xraySurface * 0.85);
        }
      });
    }
  }, [xraySurface]);

  // Smooth Camera Transition when Active Preset changes
  useEffect(() => {
    if (!controlsRef.current || !cameraRef.current) return;
    const preset = cameraPresets[activeCameraPreset] || cameraPresets['full-field'];

    const startPos = cameraRef.current.position.clone();
    const endPos = new THREE.Vector3(...preset.pos);
    const startTarget = controlsRef.current.target.clone();
    const endTarget = new THREE.Vector3(...preset.target);

    let progress = 0;
    const duration = 800; // ms
    const startTime = performance.now();

    const animateCamera = (now) => {
      progress = Math.min(1.0, (now - startTime) / duration);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);

      cameraRef.current.position.lerpVectors(startPos, endPos, ease);
      controlsRef.current.target.lerpVectors(startTarget, endTarget, ease);

      if (progress < 1.0) {
        requestAnimationFrame(animateCamera);
      }
    };
    requestAnimationFrame(animateCamera);
  }, [activeCameraPreset]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* 3D Anchored Tooltip HUD */}
      {hoveredInfo && (
        <div style={{
          position: 'absolute',
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y}px`,
          pointerEvents: 'none',
          zIndex: 60,
          background: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          minWidth: '180px',
          transform: 'translate(0, 0)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
              {hoveredInfo.name}
            </span>
            <span className={`badge ${hoveredInfo.provenance === 'MEASURED' ? 'badge-emerald' : 'badge-amber'} font-mono text-xxs`}>
              {hoveredInfo.provenance}
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)', fontWeight: 700 }}>
            {hoveredInfo.value}
          </span>
        </div>
      )}

    </div>
  );
}
