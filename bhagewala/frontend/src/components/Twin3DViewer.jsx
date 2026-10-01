import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Rotate3d, Play, Pause, Flame, Droplet, Eye, Sparkles, 
  Compass, Layers, Sliders, Activity, RotateCcw, Check, X,
  Maximize2, Minimize2, RefreshCw
} from 'lucide-react';
import { TWIN_CONSTANTS } from '../constants/twinConstants';
import { 
  calculateViscosity, 
  getFluidPhysicalState, 
  calculateSteamChamberRadius 
} from '../utils/physics';

// 6 Direct 1-Click Camera Perspectives (No clumsy cursor dragging required)
const CAMERA_VIEWS = [
  { id: 'full', label: 'Full System View', icon: Compass, pos: [32, 8, 28], target: [2, -4.5, 0], desc: 'Macro view of surface facilities and downhole reservoir' },
  { id: 'surface', label: 'Surface & Pumpjack', icon: Activity, pos: [14, 7, 16], target: [2, 2.2, 0], desc: 'Sucker Rod Pump, wellhead & 3-phase separator' },
  { id: 'reservoir', label: 'Subsurface (1,050m)', icon: Layers, pos: [18, -8, 18], target: [5, -10.5, 0], desc: 'Jodhpur heavy oil pay zone & perforations' },
  { id: 'steam', label: 'Steam Chamber', icon: Flame, pos: [11, -9.5, 11], target: [5, -10.5, 0], desc: 'Cyclic steam stimulation thermal plume' },
  { id: 'topdown', label: 'Top-Down Plan', icon: Eye, pos: [5, 38, 0.1], target: [5, 0, 0], desc: 'Bird\'s-eye plan view of surface wellpad' },
  { id: 'profile', label: 'Side Cutaway', icon: Rotate3d, pos: [44, -3, 0], target: [3, -4.5, 0], desc: 'Orthogonal geological section to 1,200m' },
];

export default function Twin3DViewer({ 
  twinState, 
  activeSimulationStage = 0, 
  onStageChange = null,
  isHero = true,
  onParameterChange = null
}) {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [activePreset, setActivePreset] = useState('full');
  
  // Fullscreen view mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Automated CSS Simulation runner state
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [simDay, setSimDay] = useState(1);

  // Clean popover toggles (avoids perpetual floating clutter)
  const [layersOpen, setLayersOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  // Real-time Physics driving the 3D scene
  const [formationTemp, setFormationTemp] = useState(195.0);
  const [steamRateTpd, setSteamRateTpd] = useState(TWIN_CONSTANTS.steam.injection_rate_tpd);
  const [soakDays, setSoakDays] = useState(TWIN_CONSTANTS.steam.soak_days);
  const [pumpSpm, setPumpSpm] = useState(TWIN_CONSTANTS.well.nominal_spm);

  // Active Cycle Phase: 0 = Huff (Injection), 1 = Soak, 2 = Puff (Production)
  const [cyclePhase, setCyclePhase] = useState(activeSimulationStage <= 1 ? activeSimulationStage : 2);

  // Layer Visibility States
  const [layers, setLayers] = useState({
    geology: true,
    wellbore: true,
    fluids: true,
    thermal: true,
    surface: true,
    wireframe: false,
  });

  // Selected Equipment Inspector HUD
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [hoverTooltip, setHoverTooltip] = useState(null);

  // Scene references
  const sceneStateRef = useRef({});

  // Synchronize when activeSimulationStage prop changes externally
  useEffect(() => {
    const phase = activeSimulationStage === 0 ? 0 : activeSimulationStage === 1 ? 1 : 2;
    setCyclePhase(phase);
    if (activeSimulationStage === 0) {
      setFormationTemp(65.0);
    } else if (activeSimulationStage === 1) {
      setFormationTemp(195.0);
    } else {
      setFormationTemp(165.0);
    }
  }, [activeSimulationStage]);

  // Derived fluid physical state
  const fluidState = getFluidPhysicalState(formationTemp);
  const chamberRadius = calculateSteamChamberRadius(steamRateTpd * 34.3, soakDays);

  // Toggle Layer
  const toggleLayer = (layerKey) => {
    setLayers(prev => {
      const next = { ...prev, [layerKey]: !prev[layerKey] };
      const groups = sceneStateRef.current.groups;
      if (groups) {
        if (layerKey === 'geology' && groups.geology) groups.geology.visible = next.geology;
        if (layerKey === 'wellbore' && groups.wellbore) groups.wellbore.visible = next.wellbore;
        if (layerKey === 'fluids' && groups.fluids) groups.fluids.visible = next.fluids;
        if (layerKey === 'thermal' && groups.thermal) groups.thermal.visible = next.thermal;
        if (layerKey === 'surface' && groups.surface) groups.surface.visible = next.surface;
        if (layerKey === 'wireframe' && sceneStateRef.current.materials) {
          sceneStateRef.current.materials.forEach(m => {
            if (m.wireframe !== undefined) m.wireframe = next.wireframe;
          });
        }
      }
      return next;
    });
  };

  // Direct 1-Click Camera View Selection (Smooth Glide Transition)
  const applyCameraView = useCallback((presetId) => {
    setActivePreset(presetId);
    const camera = sceneStateRef.current.camera;
    const controls = sceneStateRef.current.controls;
    if (!camera || !controls) return;
    const view = CAMERA_VIEWS.find(v => v.id === presetId) || CAMERA_VIEWS[0];

    sceneStateRef.current.targetPos = new THREE.Vector3(...view.pos);
    sceneStateRef.current.targetLookAt = new THREE.Vector3(...view.target);
  }, []);

  // Automated CSS Simulation Runner (Huff -> Soak -> Puff 28-day cycle)
  useEffect(() => {
    if (!isAutoSimulating) return;

    const interval = setInterval(() => {
      setSimDay(prev => {
        const nextDay = prev >= 28 ? 1 : prev + 1;

        if (nextDay <= 7) {
          // Phase 0: Huff (Steam Injection)
          setCyclePhase(0);
          const t = 65 + (nextDay / 7) * 130;
          setFormationTemp(Math.round(t));
          if (onStageChange) onStageChange(0);
        } else if (nextDay <= 13) {
          // Phase 1: Soak (Thermal Diffusion)
          setCyclePhase(1);
          setFormationTemp(195.0);
          if (onStageChange) onStageChange(1);
        } else {
          // Phase 2: Puff (Production)
          setCyclePhase(2);
          const t = 195 - ((nextDay - 13) / 15) * 45;
          setFormationTemp(Math.round(t));
          if (onStageChange) onStageChange(3);
        }

        return nextDay;
      });
    }, 900 / simSpeed);

    return () => clearInterval(interval);
  }, [isAutoSimulating, simSpeed, onStageChange]);

  const toggleSimulation = () => {
    if (isAutoSimulating) {
      setIsAutoSimulating(false);
    } else {
      setIsPlaying(true);
      setIsAutoSimulating(true);
    }
  };

  const resetSimulationCycle = () => {
    setIsAutoSimulating(false);
    setSimDay(1);
    setCyclePhase(0);
    setFormationTemp(65.0);
    applyCameraView('full');
    if (onStageChange) onStageChange(0);
  };

  // Fullscreen keyboard & scroll management
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 80);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 980;
    const height = isFullscreen 
      ? window.innerHeight - 110 
      : (isHero ? Math.max(580, Math.round(window.innerHeight * 0.68)) : 460);

    // 1. Scene, Camera, Light-Colored Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    scene.fog = new THREE.FogExp2(0xf0f4f8, 0.007);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(32, 8, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. High-Precision OrbitControls (Rock-steady horizon, zero clumsy rolling)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI - 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 160;
    controls.target.set(2, -4.5, 0);

    const materials = [];
    const geometries = [];

    // 3. High-Tech Industrial Daylight Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.0);
    keyLight.position.set(35, 50, 25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const skyFill = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 0.7);
    scene.add(skyFill);

    const steamLight = new THREE.PointLight(0x0284c7, 3.2, 32);
    steamLight.position.set(5.0, -9.5, 0);
    scene.add(steamLight);

    const oilLight = new THREE.PointLight(0xd97706, 3.0, 26);
    oilLight.position.set(5.0, -8.5, 1);
    scene.add(oilLight);

    // Master World Group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const geologyGroup = new THREE.Group();
    const wellboreGroup = new THREE.Group();
    const fluidsGroup = new THREE.Group();
    const thermalGroup = new THREE.Group();
    const surfaceGroup = new THREE.Group();

    worldGroup.add(geologyGroup);
    worldGroup.add(wellboreGroup);
    worldGroup.add(fluidsGroup);
    worldGroup.add(thermalGroup);
    worldGroup.add(surfaceGroup);

    const clickableObjects = [];
    const hoverableObjects = [];

    const registerInteractive = (mesh, data) => {
      mesh.userData = data;
      clickableObjects.push(mesh);
      hoverableObjects.push(mesh);
    };

    // =========================================================================
    // 4. SURFACE OILFIELD & GATHERING FACILITIES
    // =========================================================================
    const groundGeo = new THREE.CylinderGeometry(22, 22, 0.8, 48);
    geometries.push(groundGeo);
    // Rajasthan Bikaner-Nagaur basin natural desert terrain
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xdfd7c8, roughness: 0.92, metalness: 0.05 });
    materials.push(groundMat);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = 0.4;
    groundMesh.receiveShadow = true;
    surfaceGroup.add(groundMesh);

    const padGeo = new THREE.BoxGeometry(26, 0.15, 19);
    geometries.push(padGeo);
    // Engineered concrete well pad
    const padMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.8, metalness: 0.15 });
    materials.push(padMat);
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(4, 0.82, 0);
    padMesh.receiveShadow = true;
    surfaceGroup.add(padMesh);

    // SUCKER ROD PUMP (SRP NODDING DONKEY)
    const pumpRig = new THREE.Group();
    pumpRig.position.set(0, 0.9, 0);
    surfaceGroup.add(pumpRig);

    const skidGeo = new THREE.BoxGeometry(9.6, 0.35, 3.4);
    geometries.push(skidGeo);
    const skidMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 });
    materials.push(skidMat);
    const skid = new THREE.Mesh(skidGeo, skidMat);
    skid.position.set(0, 0.18, 0);
    skid.receiveShadow = true;
    skid.castShadow = true;
    pumpRig.add(skid);

    const motorGeo = new THREE.BoxGeometry(1.8, 1.4, 1.6);
    geometries.push(motorGeo);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
    materials.push(motorMat);
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(-3.4, 1.05, 0);
    motor.castShadow = true;
    pumpRig.add(motor);

    const legGeo = new THREE.CylinderGeometry(0.14, 0.18, 5.2, 12);
    geometries.push(legGeo);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
    materials.push(legMat);

    [
      { pos: [-1.0, 2.7, 1.1], rot: [0.15, 0, -0.15] },
      { pos: [-1.0, 2.7, -1.1], rot: [-0.15, 0, -0.15] },
      { pos: [1.0, 2.7, 1.1], rot: [0.15, 0, 0.15] },
      { pos: [1.0, 2.7, -1.1], rot: [-0.15, 0, 0.15] },
    ].forEach(({ pos, rot }) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...pos);
      leg.rotation.set(...rot);
      leg.castShadow = true;
      pumpRig.add(leg);
    });

    const saddleGeo = new THREE.CylinderGeometry(0.4, 0.4, 2.0, 16);
    geometries.push(saddleGeo);
    saddleGeo.rotateX(Math.PI / 2);
    const saddleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 });
    materials.push(saddleMat);
    const saddle = new THREE.Mesh(saddleGeo, saddleMat);
    saddle.position.set(0, 5.2, 0);
    pumpRig.add(saddle);

    const beamAssembly = new THREE.Group();
    beamAssembly.position.set(0, 5.2, 0);
    pumpRig.add(beamAssembly);

    const beamGeo = new THREE.BoxGeometry(8.2, 0.72, 0.65);
    geometries.push(beamGeo);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0xe27d11, metalness: 0.7, roughness: 0.3 });
    materials.push(beamMat);
    const walkingBeam = new THREE.Mesh(beamGeo, beamMat);
    walkingBeam.castShadow = true;
    beamAssembly.add(walkingBeam);

    const horseheadShape = new THREE.Shape();
    horseheadShape.moveTo(0, 0);
    horseheadShape.quadraticCurveTo(1.8, 1.0, 2.2, -2.1);
    horseheadShape.lineTo(1.5, -2.1);
    horseheadShape.quadraticCurveTo(1.2, 0.4, 0, -0.4);
    horseheadShape.closePath();

    const horseheadGeo = new THREE.ExtrudeGeometry(horseheadShape, { depth: 0.7, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.05, bevelThickness: 0.05 });
    geometries.push(horseheadGeo);
    horseheadGeo.center();
    const horseheadMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.3 });
    materials.push(horseheadMat);
    const horsehead = new THREE.Mesh(horseheadGeo, horseheadMat);
    horsehead.position.set(4.1, 0.35, 0);
    horsehead.castShadow = true;
    beamAssembly.add(horsehead);

    const cableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });
    materials.push(cableMat);
    const cableGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.8, 8);
    geometries.push(cableGeo);
    const cable1 = new THREE.Mesh(cableGeo, cableMat);
    cable1.position.set(5.0, 0.0, 0.22);
    pumpRig.add(cable1);

    const cable2 = new THREE.Mesh(cableGeo, cableMat);
    cable2.position.set(5.0, 0.0, -0.22);
    pumpRig.add(cable2);

    const carrierBarGeo = new THREE.BoxGeometry(0.2, 0.15, 0.7);
    geometries.push(carrierBarGeo);
    const carrierBar = new THREE.Mesh(carrierBarGeo, cableMat);
    carrierBar.position.set(5.0, -1.3, 0);
    pumpRig.add(carrierBar);

    const polishedRodGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.0, 16);
    geometries.push(polishedRodGeo);
    const polishedRodMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.05 });
    materials.push(polishedRodMat);
    const polishedRod = new THREE.Mesh(polishedRodGeo, polishedRodMat);
    polishedRod.position.set(5.0, 1.2, 0);
    polishedRod.castShadow = true;
    pumpRig.add(polishedRod);

    const crankGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.4, 24);
    geometries.push(crankGeo);
    crankGeo.rotateX(Math.PI / 2);
    const crankMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    materials.push(crankMat);
    const crankWheel = new THREE.Mesh(crankGeo, crankMat);
    crankWheel.position.set(-3.4, 2.0, 0);
    pumpRig.add(crankWheel);

    const counterweightGeo = new THREE.BoxGeometry(0.9, 1.6, 0.5);
    geometries.push(counterweightGeo);
    const counterweightMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    materials.push(counterweightMat);
    const counterweight = new THREE.Mesh(counterweightGeo, counterweightMat);
    counterweight.position.set(0, 0.7, 0);
    crankWheel.add(counterweight);

    const pitmanGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.8, 12);
    geometries.push(pitmanGeo);
    const pitmanMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85 });
    materials.push(pitmanMat);
    const pitmanArm = new THREE.Mesh(pitmanGeo, pitmanMat);
    pitmanArm.position.set(-3.7, 3.6, 0);
    pumpRig.add(pitmanArm);

    registerInteractive(walkingBeam, {
      title: "Sucker Rod Pump (SRP) Nodding Donkey",
      type: "Mechanical Artificial Lift",
      tag: TWIN_CONSTANTS.well.pump_api_spec,
      tooltip: `Depth: Surface | Speed: ${pumpSpm.toFixed(1)} SPM | Rod Load: ${TWIN_CONSTANTS.well.rod_peak_load_lbs} lbs`,
      stats: [
        { label: "Pumping Speed", val: `${pumpSpm.toFixed(1)} SPM` },
        { label: "Polished Rod Stroke", val: `${TWIN_CONSTANTS.well.stroke_length_in} in (${TWIN_CONSTANTS.well.stroke_length_m} m)` },
        { label: "Peak Polished Rod Load", val: `${TWIN_CONSTANTS.well.rod_peak_load_lbs.toLocaleString()} lbs` },
        { label: "Electric Motor Power", val: `${TWIN_CONSTANTS.well.surface_motor_kw} kW (VFD Driven)` },
        { label: "Barrel Fillage", val: `${TWIN_CONSTANTS.well.barrel_fillage_pct}% (Fluid Pound Free)` },
        { label: "Structural Rating", val: `${TWIN_CONSTANTS.well.rod_rating_lbs.toLocaleString()} lbs` },
      ]
    });

    // WELLHEAD & FLOWLINES
    const wellheadGroup = new THREE.Group();
    wellheadGroup.position.set(5.0, 0.8, 0);
    surfaceGroup.add(wellheadGroup);

    const spoolGeo = new THREE.CylinderGeometry(0.55, 0.65, 1.6, 16);
    geometries.push(spoolGeo);
    const wellheadMat = new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.85, roughness: 0.2 });
    materials.push(wellheadMat);
    const wellheadSpool = new THREE.Mesh(spoolGeo, wellheadMat);
    wellheadSpool.position.y = 0.8;
    wellheadGroup.add(wellheadSpool);

    registerInteractive(wellheadSpool, {
      title: "Wellhead Christmas Tree (BW-01)",
      type: "Surface Wellhead Equipment",
      tag: "5,000 PSI Flanged API 6A",
      tooltip: `Depth: 0m | Wellhead Pressure: ${TWIN_CONSTANTS.well.flowing_wellhead_pressure_psia} psia | Temp: 62°C`,
      stats: [
        { label: "Flowing Tubing Pressure", val: `${TWIN_CONSTANTS.well.flowing_wellhead_pressure_psia} psia` },
        { label: "Casing Annulus Pressure", val: `${TWIN_CONSTANTS.well.casing_pressure_psia} psia` },
        { label: "Water Cut (BSW)", val: `${TWIN_CONSTANTS.well.bsw_water_cut_pct}%` },
        { label: "Solution Gas Rate", val: `${TWIN_CONSTANTS.well.gas_rate_mcfd} MCFD` },
        { label: "Stuffing Box Temp", val: "62.4 °C" },
        { label: "Choke Orifice", val: "48 / 64 in" },
      ]
    });

    const flowlineGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 12);
    geometries.push(flowlineGeo);
    flowlineGeo.rotateZ(Math.PI / 2);
    const flowlineMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });
    materials.push(flowlineMat);
    const flowline = new THREE.Mesh(flowlineGeo, flowlineMat);
    flowline.position.set(7.5, 1.4, 0);
    surfaceGroup.add(flowline);

    // 3-Phase Separator
    const separatorGeo = new THREE.CylinderGeometry(1.1, 1.1, 3.6, 24);
    geometries.push(separatorGeo);
    separatorGeo.rotateZ(Math.PI / 2);
    const separatorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.25 });
    materials.push(separatorMat);
    const separator = new THREE.Mesh(separatorGeo, separatorMat);
    separator.position.set(11.5, 1.8, 0);
    separator.castShadow = true;
    surfaceGroup.add(separator);

    registerInteractive(separator, {
      title: "Horizontal 3-Phase Production Separator",
      type: "Surface Fluid Processing",
      tag: TWIN_CONSTANTS.surface.separator_model,
      tooltip: `Pressure: ${TWIN_CONSTANTS.surface.separator_pressure_psia} psia | Retention: ${TWIN_CONSTANTS.surface.separator_retention_min} min`,
      stats: [
        { label: "Operating Pressure", val: `${TWIN_CONSTANTS.surface.separator_pressure_psia} psia` },
        { label: "Retention Time", val: `${TWIN_CONSTANTS.surface.separator_retention_min} minutes` },
        { label: "Solution Gas Flashing", val: `${TWIN_CONSTANTS.well.gas_rate_mcfd} MCFD` },
        { label: "Produced Water Knockout", val: `${TWIN_CONSTANTS.well.water_rate_bwpd} BWPD` },
        { label: "Clean Heavy Crude Rate", val: `${TWIN_CONSTANTS.well.current_oil_rate_bopd} BOPD` },
        { label: "Demulsifier Injection", val: "Continuous Nominal" },
      ]
    });

    // Storage Tank Battery (Solar reflective white desert standard)
    const tankGeo = new THREE.CylinderGeometry(2.4, 2.4, 4.5, 32);
    geometries.push(tankGeo);
    const tankRoofGeo = new THREE.ConeGeometry(2.5, 0.6, 32);
    geometries.push(tankRoofGeo);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.35, roughness: 0.3 });
    materials.push(tankMat);

    const tank1 = new THREE.Mesh(tankGeo, tankMat);
    tank1.position.set(12.0, 3.1, -5.5);
    tank1.castShadow = true;
    surfaceGroup.add(tank1);

    const roof1 = new THREE.Mesh(tankRoofGeo, tankMat);
    roof1.position.set(12.0, 5.65, -5.5);
    surfaceGroup.add(roof1);

    // Heated Liquid Level Cylinder inside Tank 1
    const oilLevelGeo = new THREE.CylinderGeometry(2.35, 2.35, 2.8, 32);
    geometries.push(oilLevelGeo);
    const oilLevelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, transparent: true, opacity: 0.85 });
    materials.push(oilLevelMat);
    const oilLevelMesh = new THREE.Mesh(oilLevelGeo, oilLevelMat);
    oilLevelMesh.position.set(12.0, 2.2, -5.5);
    surfaceGroup.add(oilLevelMesh);

    registerInteractive(tank1, {
      title: "API 650 Heavy Crude Storage Tank Battery",
      type: "Field Storage Facility",
      tag: TWIN_CONSTANTS.surface.storage_tank_spec,
      tooltip: `Storage: ${TWIN_CONSTANTS.surface.tank_capacity_bbl} bbl | Level: ${TWIN_CONSTANTS.surface.tank_current_level_pct}% | Temp: ${TWIN_CONSTANTS.surface.tank_storage_temp_c}°C`,
      stats: [
        { label: "Nominal Tank Capacity", val: `${TWIN_CONSTANTS.surface.tank_capacity_bbl.toLocaleString()} Barrels` },
        { label: "Current Liquid Level", val: `${TWIN_CONSTANTS.surface.tank_current_level_pct}%` },
        { label: "Crude Gravity", val: `${TWIN_CONSTANTS.reservoir.oil_api_gravity}° API` },
        { label: "Heated Tank Temperature", val: `${TWIN_CONSTANTS.surface.tank_storage_temp_c} °C` },
        { label: "Bottom BS&W", val: "0.8 %" },
        { label: "Dispatch Specification", val: "Sales Quality Certified" },
      ]
    });

    // Steam Boiler Plant (OTS-50)
    const boilerGeo = new THREE.BoxGeometry(3.2, 2.4, 2.2);
    geometries.push(boilerGeo);
    const boilerMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, metalness: 0.5, roughness: 0.3 });
    materials.push(boilerMat);
    const boiler = new THREE.Mesh(boilerGeo, boilerMat);
    boiler.position.set(-8.0, 2.0, -4.0);
    boiler.castShadow = true;
    surfaceGroup.add(boiler);

    const steamPipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 13.5, 12);
    geometries.push(steamPipeGeo);
    steamPipeGeo.rotateZ(Math.PI / 2);
    const steamPipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.75 });
    materials.push(steamPipeMat);
    const steamPipe = new THREE.Mesh(steamPipeGeo, steamPipeMat);
    steamPipe.position.set(-1.5, 1.8, -1.8);
    surfaceGroup.add(steamPipe);

    registerInteractive(boiler, {
      title: "Cyclic Steam Stimulation Boiler Plant",
      type: "Superheated Steam Generator",
      tag: TWIN_CONSTANTS.steam.boiler_model,
      tooltip: `Steam Rate: ${steamRateTpd} TPD | Temp: ${TWIN_CONSTANTS.steam.steam_temperature_c}°C | Pressure: ${TWIN_CONSTANTS.steam.steam_pressure_bar} bar`,
      stats: [
        { label: "Injection Rate", val: `${steamRateTpd.toFixed(0)} TPD` },
        { label: "Superheated Temp", val: `${TWIN_CONSTANTS.steam.steam_temperature_c} °C` },
        { label: "Steam Pressure", val: `${TWIN_CONSTANTS.steam.steam_pressure_bar} bar` },
        { label: "Steam Quality", val: `${TWIN_CONSTANTS.steam.steam_quality_pct}% (Dry Saturated)` },
        { label: "Cumulative Injected", val: `${TWIN_CONSTANTS.steam.cumulative_injected_tonnes.toLocaleString()} Tonnes` },
        { label: "Thermal Chamber Radius", val: `${chamberRadius} meters` },
      ]
    });

    // =========================================================================
    // 5. UNDERGROUND GEOLOGICAL CUTAWAY & DOME STRATA
    // =========================================================================
    const createCurvedStrata = (topY, bottomY, color, roughness, metalness, name, depthRange) => {
      const shape = new THREE.Shape();
      const w = 22;
      shape.moveTo(-w / 2, bottomY);
      shape.lineTo(w / 2, bottomY);
      shape.lineTo(w / 2, topY - 0.5);
      shape.quadraticCurveTo(0, topY + 0.7, -w / 2, topY - 0.5);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: 16, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.1, bevelThickness: 0.1 });
      geometries.push(geo);
      geo.center();
      const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      registerInteractive(mesh, {
        title: name,
        type: "Geological Formation",
        tag: depthRange,
        tooltip: `${name} | ${depthRange}`,
        stats: [
          { label: "Formation Name", val: name },
          { label: "Depth Interval", val: depthRange },
          { label: "Basin Context", val: TWIN_CONSTANTS.well.basin },
        ]
      });
      return mesh;
    };

    // Distinct geological lithology layers calibrated for light-mode simulation
    const sandMesh = createCurvedStrata(0.4, -2.0, 0xd8c8b4, 0.9, 0.05, "Surface Alluvial Sandstone", "0 – 50m Depth");
    geologyGroup.add(sandMesh);

    const shaleMesh = createCurvedStrata(-2.0, -5.5, 0xb0bec5, 0.85, 0.1, "Alluvial Shales & Siltstones", "50 – 450m Depth");
    geologyGroup.add(shaleMesh);

    const caprockMesh = createCurvedStrata(-5.5, -8.0, 0xc9d1d9, 0.7, 0.15, TWIN_CONSTANTS.reservoir.caprock_name, "450 – 850m Depth");
    geologyGroup.add(caprockMesh);

    const reservoirMesh = createCurvedStrata(-8.0, -14.0, 0x9a6538, 0.85, 0.2, TWIN_CONSTANTS.reservoir.formation_name, `1,050m TVD (${TWIN_CONSTANTS.reservoir.net_pay_thickness_m}m Net Pay)`);
    geologyGroup.add(reservoirMesh);

    const basementMesh = createCurvedStrata(-14.0, -17.0, 0x788896, 0.88, 0.25, "Basal Granitic Basement Rock", "1,200m+ Depth");
    geologyGroup.add(basementMesh);

    // =========================================================================
    // 6. VERTICAL WELLBORE CASING & TUBING
    // =========================================================================
    const casingGeo = new THREE.CylinderGeometry(0.42, 0.42, 15.5, 24);
    geometries.push(casingGeo);
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 0.45,
    });
    materials.push(casingMat);
    const casing = new THREE.Mesh(casingGeo, casingMat);
    casing.position.set(5.0, -7.0, 0);
    wellboreGroup.add(casing);

    const tubingGeo = new THREE.CylinderGeometry(0.25, 0.25, 15.2, 16);
    geometries.push(tubingGeo);
    const tubingMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.45,
    });
    materials.push(tubingMat);
    const tubing = new THREE.Mesh(tubingGeo, tubingMat);
    tubing.position.set(5.0, -7.0, 0);
    wellboreGroup.add(tubing);

    // Glowing Perforations at 1,050m Depth
    const perfGroup = new THREE.Group();
    perfGroup.position.set(5.0, -10.5, 0);
    wellboreGroup.add(perfGroup);

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const slotGeo = new THREE.BoxGeometry(0.12, 0.3, 0.08);
      geometries.push(slotGeo);
      const slotMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.set(Math.cos(angle) * 0.42, (i % 5) * 0.35 - 0.7, Math.sin(angle) * 0.42);
      slot.lookAt(5.0 + slot.position.x * 2, slot.position.y, slot.position.z * 2);
      perfGroup.add(slot);
    }

    // =========================================================================
    // 7. STEAM CHAMBER & VOLUMETRIC THERMAL PLUME
    // =========================================================================
    const steamGroup = new THREE.Group();
    steamGroup.position.set(5.0, -10.5, 0);
    thermalGroup.add(steamGroup);

    const smokePuffCount = 55;
    const smokePuffs = [];
    const puffGeo = new THREE.SphereGeometry(1, 14, 10);
    geometries.push(puffGeo);

    for (let i = 0; i < smokePuffCount; i++) {
      const puffMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.35,
        roughness: 0.4,
      });
      materials.push(puffMat);
      const puff = new THREE.Mesh(puffGeo, puffMat);

      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * (chamberRadius * 0.22);
      puff.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 2.6,
        Math.sin(angle) * radius
      );
      const s = 0.5 + Math.random() * 1.3;
      puff.scale.set(s, s * 0.75, s);
      steamGroup.add(puff);

      smokePuffs.push({
        mesh: puff,
        baseScale: s,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        pulseSpeed: 1.5 + Math.random() * 2.0,
      });
    }

    // Downward Steam Vapor Injection
    const vaporCount = 90;
    const vaporGeo = new THREE.BufferGeometry();
    const vaporPos = new Float32Array(vaporCount * 3);
    const vaporVel = [];

    for (let i = 0; i < vaporCount; i++) {
      vaporPos[i * 3] = 5.0 + (Math.random() - 0.5) * 0.35;
      vaporPos[i * 3 + 1] = 0.5 - Math.random() * 11.0;
      vaporPos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
      vaporVel.push(0.09 + Math.random() * 0.12);
    }
    vaporGeo.setAttribute('position', new THREE.BufferAttribute(vaporPos, 3));
    geometries.push(vaporGeo);
    const vaporMat = new THREE.PointsMaterial({ color: 0x0284c7, size: 0.22, transparent: true, opacity: 0.85 });
    materials.push(vaporMat);
    const vaporPoints = new THREE.Points(vaporGeo, vaporMat);
    thermalGroup.add(vaporPoints);

    // =========================================================================
    // 8. CRUDE OIL EXTRACTION STREAMS (PHYSICS TIED)
    // =========================================================================
    const oilStreamCount = 120;
    const oilGeo = new THREE.BufferGeometry();
    const oilPos = new Float32Array(oilStreamCount * 3);
    const oilVel = [];

    for (let i = 0; i < oilStreamCount; i++) {
      oilPos[i * 3] = 5.0 + (Math.random() - 0.5) * 0.16;
      oilPos[i * 3 + 1] = -14.5 + (i / oilStreamCount) * 15.8;
      oilPos[i * 3 + 2] = (Math.random() - 0.5) * 0.16;
      oilVel.push(0.06 + Math.random() * 0.08);
    }
    oilGeo.setAttribute('position', new THREE.BufferAttribute(oilPos, 3));
    geometries.push(oilGeo);
    const oilMat = new THREE.PointsMaterial({ color: fluidState.threeColorHex, size: 0.32, transparent: true, opacity: 0.95 });
    materials.push(oilMat);
    const oilPoints = new THREE.Points(oilGeo, oilMat);
    fluidsGroup.add(oilPoints);

    // Radial Pore Inflow
    const inflowCount = 65;
    const inflowGeo = new THREE.BufferGeometry();
    const inflowPos = new Float32Array(inflowCount * 3);
    const inflowDist = [];

    for (let i = 0; i < inflowCount; i++) {
      const angle = (i / inflowCount) * Math.PI * 2;
      const dist = 0.8 + Math.random() * 4.2;
      inflowPos[i * 3] = 5.0 + Math.cos(angle) * dist;
      inflowPos[i * 3 + 1] = -10.5 + (Math.random() - 0.5) * 2.0;
      inflowPos[i * 3 + 2] = Math.sin(angle) * dist;
      inflowDist.push({ angle, dist, speed: 0.018 + Math.random() * 0.025 });
    }
    inflowGeo.setAttribute('position', new THREE.BufferAttribute(inflowPos, 3));
    geometries.push(inflowGeo);
    const inflowMat = new THREE.PointsMaterial({ color: fluidState.threeColorHex, size: 0.28, transparent: true, opacity: 0.9 });
    materials.push(inflowMat);
    const inflowPoints = new THREE.Points(inflowGeo, inflowMat);
    fluidsGroup.add(inflowPoints);

    // Surface Flowline Fluid Stream
    const surfaceFluidCount = 40;
    const surfaceFluidGeo = new THREE.BufferGeometry();
    const surfaceFluidPos = new Float32Array(surfaceFluidCount * 3);
    const surfaceFluidProg = [];

    for (let i = 0; i < surfaceFluidCount; i++) {
      surfaceFluidPos[i * 3] = 5.0 + (i / surfaceFluidCount) * 8.0;
      surfaceFluidPos[i * 3 + 1] = 1.4;
      surfaceFluidPos[i * 3 + 2] = 0;
      surfaceFluidProg.push((i / surfaceFluidCount));
    }
    surfaceFluidGeo.setAttribute('position', new THREE.BufferAttribute(surfaceFluidPos, 3));
    geometries.push(surfaceFluidGeo);
    const surfaceFluidMat = new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.24, transparent: true, opacity: 0.95 });
    materials.push(surfaceFluidMat);
    const surfaceFluidPoints = new THREE.Points(surfaceFluidGeo, surfaceFluidMat);
    fluidsGroup.add(surfaceFluidPoints);

    // Save state refs
    sceneStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      worldGroup,
      groups: {
        geology: geologyGroup,
        wellbore: wellboreGroup,
        fluids: fluidsGroup,
        thermal: thermalGroup,
        surface: surfaceGroup,
      },
      materials,
      geometries,
      beamAssembly,
      crankWheel,
      polishedRod,
      carrierBar,
      cable1,
      cable2,
      pitmanArm,
      smokePuffs,
      vaporPoints,
      vaporVel,
      oilPoints,
      oilVel,
      oilMat,
      inflowPoints,
      inflowDist,
      inflowMat,
      surfaceFluidPoints,
      surfaceFluidProg,
      steamLight,
      oilLight,
      oilLevelMesh,
      targetPos: null,
      targetLookAt: null,
    };

    // Hover Raycasting for tooltip identification
    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(hoverableObjects, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.tooltip && hit.parent) {
          hit = hit.parent;
        }
        if (hit && hit.userData?.tooltip) {
          setHoverTooltip({
            text: hit.userData.tooltip,
            x: e.clientX - rect.left + 15,
            y: e.clientY - rect.top + 15,
          });
        } else {
          setHoverTooltip(null);
        }
      } else {
        setHoverTooltip(null);
      }
    };

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(clickableObjects, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.title && hit.parent) {
          hit = hit.parent;
        }
        if (hit && hit.userData?.title) {
          setSelectedEquipment(hit.userData);
        }
      }
    };

    const domElement = renderer.domElement;
    window.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('click', onClick);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime() * simSpeed;

      // Smooth camera gliding to selected direct view
      if (sceneStateRef.current.targetPos) {
        camera.position.lerp(sceneStateRef.current.targetPos, 0.07);
        if (sceneStateRef.current.targetLookAt) {
          controls.target.lerp(sceneStateRef.current.targetLookAt, 0.07);
        }
        if (camera.position.distanceTo(sceneStateRef.current.targetPos) < 0.15) {
          sceneStateRef.current.targetPos = null;
        }
      }

      controls.update();

      if (isPlaying) {
        // SRP Nodding Donkey stroke kinematics
        const theta = elapsed * pumpSpm * (Math.PI / 30);
        const beamAngle = Math.sin(theta) * 0.18;

        beamAssembly.rotation.z = beamAngle;
        crankWheel.rotation.z = -theta;

        pitmanArm.position.x = -3.4 + Math.sin(theta) * 0.7;
        pitmanArm.position.y = 3.5 + Math.cos(theta) * 0.55;
        pitmanArm.rotation.z = Math.sin(theta) * 0.22;

        const strokeY = 1.2 - beamAngle * 4.4;
        polishedRod.position.y = strokeY;
        carrierBar.position.y = strokeY - 2.5;
        cable1.position.y = strokeY + 1.2;
        cable2.position.y = strokeY + 1.2;

        // Billowing thermal smoke puffs
        smokePuffs.forEach((puff, idx) => {
          puff.mesh.rotation.y += puff.rotSpeed;
          const pulse = Math.sin(elapsed * puff.pulseSpeed + idx) * 0.18;
          const s = puff.baseScale + pulse;
          puff.mesh.scale.set(s, s * 0.75, s);

          if (cyclePhase === 0) {
            // Huff (Injection)
            puff.mesh.material.color.setHex(0x0284c7);
            puff.mesh.material.emissive.setHex(0x38bdf8);
            puff.mesh.material.opacity = 0.45;
          } else if (cyclePhase === 1) {
            // Soak
            puff.mesh.material.color.setHex(0xd946ef);
            puff.mesh.material.emissive.setHex(0xf43f5e);
            puff.mesh.material.opacity = 0.5;
          } else {
            // Production
            puff.mesh.material.color.setHex(fluidState.threeColorHex);
            puff.mesh.material.emissive.setHex(fluidState.threeColorHex);
            puff.mesh.material.opacity = 0.4;
          }
        });

        // Downward injected steam vapor
        const vPos = vaporPoints.geometry.attributes.position.array;
        for (let i = 0; i < vaporCount; i++) {
          vPos[i * 3 + 1] -= vaporVel[i] * simSpeed;
          if (vPos[i * 3 + 1] < -11.0) {
            vPos[i * 3 + 1] = 0.5;
            vPos[i * 3] = 5.0 + (Math.random() - 0.5) * 0.35;
            vPos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
          }
        }
        vaporPoints.geometry.attributes.position.needsUpdate = true;

        // Upward oil stream (Velocity tied to mobility & viscosity)
        const oPos = oilPoints.geometry.attributes.position.array;
        const velocityMultiplier = fluidState.particleSpeedFactor * (pumpSpm / 2.0);

        for (let i = 0; i < oilStreamCount; i++) {
          oPos[i * 3 + 1] += oilVel[i] * velocityMultiplier * simSpeed;
          if (oPos[i * 3 + 1] > 1.4) {
            oPos[i * 3 + 1] = -14.0;
            oPos[i * 3] = 5.0 + (Math.random() - 0.5) * 0.16;
            oPos[i * 3 + 2] = (Math.random() - 0.5) * 0.16;
          }
        }
        oilPoints.geometry.attributes.position.needsUpdate = true;

        // Radial pore inflow
        const inPos = inflowPoints.geometry.attributes.position.array;
        for (let i = 0; i < inflowCount; i++) {
          const item = inflowDist[i];
          item.dist -= item.speed * velocityMultiplier * simSpeed;
          if (item.dist < 0.45) item.dist = 4.2;
          inPos[i * 3] = 5.0 + Math.cos(item.angle) * item.dist;
          inPos[i * 3 + 2] = Math.sin(item.angle) * item.dist;
        }
        inflowPoints.geometry.attributes.position.needsUpdate = true;

        // Surface flowline
        const sfPos = surfaceFluidPoints.geometry.attributes.position.array;
        for (let i = 0; i < surfaceFluidCount; i++) {
          surfaceFluidProg[i] += 0.008 * (pumpSpm / 2.0) * simSpeed;
          if (surfaceFluidProg[i] > 1.0) surfaceFluidProg[i] = 0.0;
          const prog = surfaceFluidProg[i];
          if (prog < 0.7) {
            sfPos[i * 3] = 5.0 + (prog / 0.7) * 6.5;
            sfPos[i * 3 + 2] = 0;
          } else {
            sfPos[i * 3] = 11.5 + ((prog - 0.7) / 0.3) * 0.5;
            sfPos[i * 3 + 2] = -((prog - 0.7) / 0.3) * 5.0;
          }
        }
        surfaceFluidPoints.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 980;
      const newH = isFullscreen 
        ? window.innerHeight - 110 
        : (isHero ? Math.max(580, Math.round(window.innerHeight * 0.68)) : 460);
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP DISPOSAL
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      domElement.removeEventListener('click', onClick);

      controls.dispose();
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      renderer.dispose();
    };
  }, [formationTemp, steamRateTpd, soakDays, pumpSpm, cyclePhase, isHero, isFullscreen, simSpeed, chamberRadius, fluidState.particleSpeedFactor, fluidState.threeColorHex]);

  // Handle parameter slider change with optional parent notification
  const handleTempChange = (v) => {
    setFormationTemp(v);
    if (onParameterChange) onParameterChange({ formationTemp: v, pumpSpm, steamRateTpd, soakDays });
  };

  const handleSpmChange = (v) => {
    setPumpSpm(v);
    if (onParameterChange) onParameterChange({ formationTemp, pumpSpm: v, steamRateTpd, soakDays });
  };

  return (
    <div className={`twin-3d-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* 1. Header Toolbar */}
      <div className="twin-3d-header">
        <div className="flex-center gap-2">
          <span className="icon-badge bg-amber-100 text-amber-700">
            <Rotate3d size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold flex-center gap-2" style={{ color: 'var(--text-main, #0f172a)' }}>
              Well-to-Surface 3D Digital Twin Hero
              <span className="badge badge-amber font-mono text-xxs">Three.js WebGL (60 FPS)</span>
            </h3>
            <span className="text-xs text-dim font-mono">
              Live SRP Nodding Donkey &bull; Cambrian Anticlinal Dome Strata &bull; Dynamic CSS Thermal Front
            </span>
          </div>
        </div>

        {/* Central Simulation Controls */}
        <div className="flex-center gap-2 flex-wrap">
          {/* Main Simulation Action Button */}
          <button 
            className={`btn-sim-run ${isAutoSimulating ? 'simulating' : ''}`}
            onClick={toggleSimulation}
            title={isAutoSimulating ? "Pause dynamic simulation" : "Run automated 28-day CSS steam-to-oil cycle simulation"}
          >
            {isAutoSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isAutoSimulating ? 'Simulating Cycle...' : 'Run Simulation'}</span>
          </button>

          {isAutoSimulating && (
            <span className="badge badge-amber font-mono text-xs">
              Cycle Day {simDay} / 28
            </span>
          )}

          {/* Phase Timeline Scrubber (Huff -> Soak -> Puff) */}
          <div className="flex-center gap-1 bg-input p-1" style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button 
              className={`btn-pill ${cyclePhase === 0 ? 'active' : ''}`}
              onClick={() => { setCyclePhase(0); setFormationTemp(65.0); if (onStageChange) onStageChange(0); }}
              title="Phase 1: High Pressure Steam Injection"
            >
              <Flame size={12} />
              <span>1. Huff (Steam)</span>
            </button>
            <button 
              className={`btn-pill ${cyclePhase === 1 ? 'active' : ''}`}
              onClick={() => { setCyclePhase(1); setFormationTemp(195.0); if (onStageChange) onStageChange(1); }}
              title="Phase 2: Thermal Soaking & Viscosity Collapse"
            >
              <Sparkles size={12} />
              <span>2. Soak (Diffusion)</span>
            </button>
            <button 
              className={`btn-pill ${cyclePhase === 2 ? 'active' : ''}`}
              onClick={() => { setCyclePhase(2); setFormationTemp(165.0); if (onStageChange) onStageChange(3); }}
              title="Phase 3: Sucker Rod Pump Oil Production"
            >
              <Droplet size={12} />
              <span>3. Puff (Production)</span>
            </button>
          </div>
        </div>

        {/* Right utility buttons: Reset & Fullscreen */}
        <div className="flex-center gap-1.5">
          <button 
            className="btn btn-secondary text-xs py-1 px-2.5"
            onClick={() => { applyCameraView('full'); resetSimulationCycle(); }}
            title="Reset View and Parameters"
          >
            <RefreshCw size={13} />
            <span>Reset View</span>
          </button>
          <button 
            className="btn btn-secondary text-xs py-1 px-2.5"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen Mode (Esc)" : "Expand Simulation to Full Screen"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Full Screen"}</span>
          </button>
        </div>
      </div>

      {/* 2. Direct Camera Views Toolbar — 1-Click Instant Direct Perspectives */}
      <div className="twin-views-toolbar">
        <div className="flex-center gap-1.5 flex-wrap">
          <span className="text-xxs font-mono font-bold text-dim uppercase tracking-wider flex-center gap-1 mr-1">
            <Eye size={12} className="text-amber" />
            Views:
          </span>
          {CAMERA_VIEWS.map(v => {
            const Icon = v.icon;
            const isActive = activePreset === v.id;
            return (
              <button
                key={v.id}
                className={`btn-view-preset ${isActive ? 'active' : ''}`}
                onClick={() => applyCameraView(v.id)}
                title={v.desc}
              >
                <Icon size={13} />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overlay Popover Toggles */}
        <div className="flex-center gap-2">
          <button 
            className={`btn-pill text-xs ${controlsOpen ? 'active' : ''}`}
            onClick={() => setControlsOpen(!controlsOpen)}
            title="Open or close real-time reservoir temperature and SRP speed sliders"
          >
            <Sliders size={13} />
            <span>Physics Controls</span>
          </button>
          <button 
            className={`btn-pill text-xs ${layersOpen ? 'active' : ''}`}
            onClick={() => setLayersOpen(!layersOpen)}
            title="Toggle visibility of geological strata and surface facilities"
          >
            <Layers size={13} />
            <span>Layers ({Object.values(layers).filter(Boolean).length}/6)</span>
          </button>
        </div>
      </div>

      {/* 3. Main Viewport Mount with Unobstructed 3D Canvas */}
      <div 
        className="twin-3d-viewport-wrapper" 
        style={{ 
          height: isFullscreen ? 'calc(100vh - 120px)' : (isHero ? '68vh' : '480px'), 
          minHeight: isFullscreen ? 'calc(100vh - 120px)' : '580px' 
        }}
      >
        <div ref={mountRef} className="twin-3d-canvas-mount" />

        {/* Floating Hover Tooltip */}
        {hoverTooltip && (
          <div style={{
            position: 'absolute',
            left: `${hoverTooltip.x}px`,
            top: `${hoverTooltip.y}px`,
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid var(--border-metallic)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-main, #0f172a)',
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          }}>
            {hoverTooltip.text}
          </div>
        )}

        {/* Real-time Physics Sliders Popover (Cleanly toggleable, no screen blocking) */}
        {controlsOpen && (
          <div className="hud-physics-popover">
            {/* Temperature Slider */}
            <div style={{ width: '160px' }}>
              <div className="flex-center justify-between text-xxs font-mono text-dim mb-1">
                <span>Formation Temp:</span>
                <strong className="text-rose">{formationTemp.toFixed(0)}°C</strong>
              </div>
              <input 
                type="range"
                min="48"
                max="240"
                step="1"
                value={formationTemp}
                onChange={(e) => handleTempChange(parseFloat(e.target.value))}
                className="control-slider"
              />
              <div className="flex-center justify-between text-xxs font-mono text-dim">
                <span>48°C (Tar)</span>
                <span>240°C</span>
              </div>
            </div>

            {/* Viscosity Readout */}
            <div style={{ width: '140px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
              <span className="text-xxs font-mono text-dim block">Oil Viscosity:</span>
              <span className="text-sm font-mono font-bold text-amber block my-0.5">
                {fluidState.viscosityCp.toLocaleString()} cP
              </span>
              <span className="text-xxs font-mono text-emerald block">
                -{fluidState.viscosityDropPct}% collapse
              </span>
            </div>

            {/* Pumping Speed Slider */}
            <div style={{ width: '150px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
              <div className="flex-center justify-between text-xxs font-mono text-dim mb-1">
                <span>SRP Speed:</span>
                <strong className="text-amber">{pumpSpm.toFixed(1)} SPM</strong>
              </div>
              <input 
                type="range"
                min="1.0"
                max="4.0"
                step="0.1"
                value={pumpSpm}
                onChange={(e) => handleSpmChange(parseFloat(e.target.value))}
                className="control-slider"
              />
              <div className="flex-center justify-between text-xxs font-mono text-dim">
                <span>1.0 SPM</span>
                <span>4.0 SPM</span>
              </div>
            </div>
            
            <button 
              className="icon-btn text-dim hover:text-main"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setControlsOpen(false)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Layer Visibility Popover (Cleanly toggleable, no screen blocking) */}
        {layersOpen && (
          <div className="hud-layer-popover">
            <div className="flex-center justify-between text-xxs font-mono font-bold text-dim mb-1 pb-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span>ACTIVE LAYERS</span>
              <button className="icon-btn text-dim hover:text-main" onClick={() => setLayersOpen(false)}>
                <X size={12} />
              </button>
            </div>
            <button className={`layer-toggle-btn ${layers.geology ? 'on' : ''}`} onClick={() => toggleLayer('geology')}>
              <span>Geology Strata</span>
              {layers.geology ? <Check size={12} /> : <X size={12} />}
            </button>
            <button className={`layer-toggle-btn ${layers.wellbore ? 'on' : ''}`} onClick={() => toggleLayer('wellbore')}>
              <span>Wellbore Casing</span>
              {layers.wellbore ? <Check size={12} /> : <X size={12} />}
            </button>
            <button className={`layer-toggle-btn ${layers.fluids ? 'on' : ''}`} onClick={() => toggleLayer('fluids')}>
              <span>Fluid Streams</span>
              {layers.fluids ? <Check size={12} /> : <X size={12} />}
            </button>
            <button className={`layer-toggle-btn ${layers.thermal ? 'on' : ''}`} onClick={() => toggleLayer('thermal')}>
              <span>Steam & Heat</span>
              {layers.thermal ? <Check size={12} /> : <X size={12} />}
            </button>
            <button className={`layer-toggle-btn ${layers.surface ? 'on' : ''}`} onClick={() => toggleLayer('surface')}>
              <span>Surface Facilities</span>
              {layers.surface ? <Check size={12} /> : <X size={12} />}
            </button>
            <button className={`layer-toggle-btn ${layers.wireframe ? 'on' : ''}`} onClick={() => toggleLayer('wireframe')}>
              <span>Wireframe Mode</span>
              {layers.wireframe ? <Check size={12} /> : <X size={12} />}
            </button>
          </div>
        )}

        {/* Selected Equipment Inspector HUD Modal */}
        {selectedEquipment && (
          <div className="equipment-inspector-hud">
            <div className="inspector-header">
              <div>
                <h4 className="inspector-title">{selectedEquipment.title}</h4>
                <span className="text-xxs font-mono text-cyan">{selectedEquipment.tag}</span>
              </div>
              <button 
                className="icon-btn text-dim hover:text-main"
                onClick={() => setSelectedEquipment(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="inspector-stats-grid">
              {selectedEquipment.stats.map((st, i) => (
                <div key={i} className="stat-item">
                  <span className="stat-label">{st.label}</span>
                  <span className="stat-val">{st.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Transport Footer Bar */}
      <div className="twin-3d-footer-bar">
        <div className="transport-controls">
          <button 
            className="btn btn-primary text-xs"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause Kinematics' : 'Resume Simulation'}</span>
          </button>

          <div className="speed-selector-group">
            {[0.5, 1.0, 2.0, 4.0].map(s => (
              <button 
                key={s} 
                className={`speed-btn ${simSpeed === s ? 'active' : ''}`}
                onClick={() => setSimSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Technical Legend */}
        <div className="twin-legend-row">
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: fluidState.colorHex }} />
            <span>Heavy Crude ({fluidState.viscosityCp.toLocaleString()} cP &bull; {fluidState.stateLabel})</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-steam" />
            <span>Steam ({TWIN_CONSTANTS.steam.steam_temperature_c}°C @ {TWIN_CONSTANTS.steam.steam_pressure_bar} bar)</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-heat" />
            <span>Thermal Front ({chamberRadius}m Chamber)</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-sandstone" />
            <span>Jodhpur Sandstone ({TWIN_CONSTANTS.reservoir.top_depth_m}m TVD)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
