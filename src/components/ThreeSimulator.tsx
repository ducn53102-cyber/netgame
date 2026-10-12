import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { soundController } from '../utils/sound';
import { ScriptConfig } from '../data/csharpScripts';
import { CustomerSatisfactionBreakdown } from './SatisfactionDashboard';
import {
  Monitor,
  Smartphone,
  Laptop,
  RotateCcw,
  Sparkles,
  Users,
  Cpu,
  Layers,
  X,
  UserCheck,
  Smile,
  Wifi,
  Wind,
  Coffee,
  Shirt,
  Shield,
  Eye,
  Camera,
  Building2,
  ShoppingBag,
  Package,
  Hammer,
} from 'lucide-react';
import {
  HardwareItemDefinition,
  InventoryBackpackItem,
  PlacedFurnitureItem,
  HARDWARE_CATALOG,
  DESK_SNAP_SLOTS,
  DeskSlotName,
  HardwareCategory,
} from '../data/hardwareCatalog';
import { HardwareShopModal } from './HardwareShopModal';
import { BackpackModal } from './BackpackModal';

export interface StationUpgradeState {
  id: number;
  name: string;
  position: THREE.Vector3;
  sitPoint: THREE.Vector3;
  isOccupied: boolean;
  timeRemaining: number;
  currentCustomerType: string;
  currentCustomerId?: number;
  totalEarnedFromStation: number;
  // Upgrade levels (1 -> 5)
  monitorLevel: number;
  gpuLevel: number;
  ramLevel: number;
  // Three.js meshes
  stationGroup?: THREE.Group;
  screenMesh?: THREE.Mesh;
  monitorFrameMesh?: THREE.Mesh;
  screenLight?: THREE.PointLight;
  pcCaseLedMesh?: THREE.Mesh;
  screenOnMat?: THREE.Material;
  screenOffMat?: THREE.Material;
  screenWingMeshes?: THREE.Mesh[];
  // Chair & Seating Transform Data (NPC Customer Alignment)
  attachedChairInstanceId?: string;
  chairPosition?: THREE.Vector3;
  chairHeight?: number;
  chairRotationY?: number;
  deskFacingRotationY?: number;
  parentDeskId?: string;
}

export interface FingerJointGroup {
  mcp: THREE.Group;
  pip: THREE.Group;
  dip: THREE.Group;
  nail?: THREE.Mesh;
}

export interface HandLimbRig {
  wrist: THREE.Group;
  palm: THREE.Mesh;
  thumb: FingerJointGroup;
  index: FingerJointGroup;
  middle: FingerJointGroup;
  ring: FingerJointGroup;
  pinky: FingerJointGroup;
}

export interface CustomerBodyLimbs {
  rootGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  faceGroup?: THREE.Group;
  leftEye?: THREE.Mesh;
  rightEye?: THREE.Mesh;
  leftEyelid?: THREE.Mesh;
  rightEyelid?: THREE.Mesh;
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftHandRig?: HandLimbRig;
  rightHandRig?: HandLimbRig;
  leftHip: THREE.Group;
  rightHip: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  capsuleCollider?: THREE.Mesh;
  walkCycle: number;
  type: 'HocSinh' | 'GameThu' | 'VIP';
  fidgetTimer?: number;
  fidgetType?: 'none' | 'rubFace' | 'stretchFingers' | 'sipDrink' | 'adjustPosture';
  fidgetProgress?: number;
  lastBlink?: number;
  isBlinking?: boolean;
  mixer?: THREE.AnimationMixer;
  actions?: {
    idle?: THREE.AnimationAction;
    sitting?: THREE.AnimationAction;
    walking?: THREE.AnimationAction;
  };
  currentActionName?: 'Idle' | 'Sitting' | 'Walking';
}

export interface CustomerSimEntity {
  id: number;
  type: 'HocSinh' | 'GameThu' | 'VIP';
  name: string;
  color: number;
  hours: number;
  pricePerHour: number;
  position: THREE.Vector3;
  targetStationId: number | null;
  state: 'walking' | 'playing' | 'waiting' | 'leaving';
  mesh?: THREE.Group;
  bodyLimbs?: CustomerBodyLimbs;
  isTrigger?: boolean;
  mixer?: THREE.AnimationMixer;
  actions?: {
    idle?: THREE.AnimationAction;
    sitting?: THREE.AnimationAction;
    walking?: THREE.AnimationAction;
  };
  outfitName?: string;
  outfitDetails?: string;
  queueSlotIndex?: number;
  waitTimeSeconds: number;
  // Satisfaction breakdown
  baseScore: number;
  computerQualityScore: number;
  priceScore: number;
  waitTimePenalty: number;
  internetBonus: number;
  acBonus: number;
  foodBonus: number;
  finalScore: number;
  tier: 'VeryHappy' | 'Happy' | 'Normal' | 'Unhappy' | 'VeryUnhappy';
  emoji: string;
  tierLabel: string;
  stars: number;
  returnChance: number;
  // Food & Beverage (F&B) Delivery System
  needsFoodOrDrink?: boolean;
  foodRequestTimer?: number;
  orderedItemName?: string;
  foodOrderPrice?: number;
  exitWaypoint?: number;
  exitDirection?: number;
}

export type ActiveInteractionType =
  | { type: 'fridge'; text: string; subText?: string }
  | { type: 'serve'; customerId: number; stationId: number; stationName: string; text: string; subText?: string }
  | { type: 'needs_food_hint'; customerId: number; stationId: number; stationName: string; text: string; subText?: string }
  | { type: 'station_upgrade'; stationId: number; distance: number; text: string; subText?: string }
  | { type: 'property_purchase'; propertyId: string; propertyName: string; price: number; text: string; subText?: string }
  | { type: 'vip_door'; text: string; subText?: string }
  | { type: 'hardware_store'; text: string; subText?: string }
  | { type: 'pickup_furniture'; instanceId: string; itemName: string; text: string; subText?: string }
  | null;

export interface ConsoleLogEntry {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
}

export interface PropertyState {
  id: string;
  name: string;
  price: number;
  isPurchased: boolean;
  signGroup?: THREE.Group;
  doorPivot?: THREE.Group;
  interiorLights?: THREE.Light[];
  lockedColliderName: string;
  signPosition: THREE.Vector3;
}

interface FloatingPopup {
  id: number;
  text: string;
  x: number;
  y: number;
  opacity: number;
  color?: string;
}

interface ThreeSimulatorProps {
  config: ScriptConfig;
  onMoneyEarned?: (amount: number) => void;
  onSatisfactionUpdated?: (customers: CustomerSatisfactionBreakdown[], reviews: CustomerSatisfactionBreakdown[]) => void;
}

export const ThreeSimulator: React.FC<ThreeSimulatorProps> = ({
  config,
  onMoneyEarned,
  onSatisfactionUpdated,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [totalMoney, setTotalMoney] = useState<number>(65000);
  const totalMoneyRef = useRef<number>(65000);
  totalMoneyRef.current = totalMoney;
  const [isMobileMode, setIsMobileMode] = useState<boolean>(false);
  const [activeStationPrompt, setActiveStationPrompt] = useState<{
    stationId: number;
    distance: number;
  } | null>(null);
  // F&B Food & Beverage Delivery System States
  const [isCarryingFood, setIsCarryingFood] = useState<boolean>(false);
  const isCarryingFoodRef = useRef<boolean>(false);
  // PC Hardware Store Carry & Deliver Upgrade System
  const [isCarryingPCBox, setIsCarryingPCBox] = useState<boolean>(false);
  const isCarryingPCBoxRef = useRef<boolean>(false);
  const carryingPCBoxMeshRef = useRef<THREE.Group | null>(null);
  const carsListRef = useRef<{ mesh: THREE.Group; speed: number; laneZ: number }[]>([]);
  const lastCarHitTimeRef = useRef<number>(0);
  const [activeInteraction, setActiveInteraction] = useState<ActiveInteractionType>(null);
  const activeInteractionRef = useRef<ActiveInteractionType>(null);

  // Hardware Shop, Backpack Inventory & Free-Form Build Mode States (Internet Cafe Simulator)
  const [isHardwareShopOpen, setIsHardwareShopOpen] = useState<boolean>(false);
  const [isBackpackOpen, setIsBackpackOpen] = useState<boolean>(false);
  const [backpack, setBackpack] = useState<InventoryBackpackItem[]>(() => [
    // Pre-populate with initial starter equipment so the player can test Build Mode immediately
    {
      instanceId: 'starter_desk_01',
      itemDefId: 'desk_t2',
      item: HARDWARE_CATALOG.find(i => i.id === 'desk_t2')!,
      acquiredAt: Date.now() - 10000,
    },
    {
      instanceId: 'starter_chair_01',
      itemDefId: 'chair_t2',
      item: HARDWARE_CATALOG.find(i => i.id === 'chair_t2')!,
      acquiredAt: Date.now() - 9000,
    },
    {
      instanceId: 'starter_mon_01',
      itemDefId: 'mon_t2',
      item: HARDWARE_CATALOG.find(i => i.id === 'mon_t2')!,
      acquiredAt: Date.now() - 8000,
    },
    {
      instanceId: 'starter_pc_01',
      itemDefId: 'pc_t2',
      item: HARDWARE_CATALOG.find(i => i.id === 'pc_t2')!,
      acquiredAt: Date.now() - 7000,
    },
    {
      instanceId: 'starter_kb_01',
      itemDefId: 'kb_t2',
      item: HARDWARE_CATALOG.find(i => i.id === 'kb_t2')!,
      acquiredAt: Date.now() - 6000,
    },
    {
      instanceId: 'starter_mouse_01',
      itemDefId: 'mouse_t2',
      item: HARDWARE_CATALOG.find(i => i.id === 'mouse_t2')!,
      acquiredAt: Date.now() - 5000,
    },
    {
      instanceId: 'starter_headset_01',
      itemDefId: 'hs_t2',
      item: HARDWARE_CATALOG.find(i => i.id === 'hs_t2')!,
      acquiredAt: Date.now() - 4000,
    },
  ]);
  const backpackRef = useRef<InventoryBackpackItem[]>(backpack);
  backpackRef.current = backpack;

  // Build Mode Active Item & Hologram Refs
  const [buildModeItem, setBuildModeItem] = useState<InventoryBackpackItem | null>(null);
  const buildModeItemRef = useRef<InventoryBackpackItem | null>(null);
  buildModeItemRef.current = buildModeItem;

  const ghostMeshRef = useRef<THREE.Group | null>(null);
  const isGhostValidRef = useRef<boolean>(true);
  const ghostMaterialsRef = useRef<{ green: THREE.MeshBasicMaterial; red: THREE.MeshBasicMaterial } | null>(null);
  const ghostRotationYRef = useRef<number>(0); // Scroll wheel rotation angle (radians)

  // Active snapped desk slot reference
  const activeSnappedSlotRef = useRef<{
    deskId: string;
    slotName: DeskSlotName;
    worldPos: THREE.Vector3;
    worldRotY: number;
  } | null>(null);

  // Active targeted placed furniture for [F] Raycast pickup
  const activePickupFurnitureRef = useRef<{ instanceId: string; itemName: string } | null>(null);

  // Placed Furniture Meshes & Desks Registry (For Auto-Snap Slots and Complete PC Set Check)
  const placedFurnitureRef = useRef<PlacedFurnitureItem[]>([]);
  const placedFurnitureGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const placedFurnitureCollidersRef = useRef<Map<string, THREE.Box3>>(new Map());
  const placedDesksRegistryRef = useRef<Map<string, {
    deskId: string;
    group: THREE.Group;
    deskItem: HardwareItemDefinition;
    center: THREE.Vector3;
    rotationY: number;
    topY: number;
    box: THREE.Box3;
    size: THREE.Vector3;
    isReadyForCustomer: boolean;
    slots: {
      Monitor: PlacedFurnitureItem | null;
      Keyboard: PlacedFurnitureItem | null;
      Mouse: PlacedFurnitureItem | null;
      PCCase: PlacedFurnitureItem | null;
      Headset: PlacedFurnitureItem | null;
      Chair: PlacedFurnitureItem | null;
    };
    holograms: {
      Monitor?: THREE.Group;
      Keyboard?: THREE.Group;
      Mouse?: THREE.Group;
      PCCase?: THREE.Group;
      Headset?: THREE.Group;
      Chair?: THREE.Group;
    };
    checkmarkMesh?: THREE.Group;
    checkmarkTimeoutId?: any;
    stationId?: number;
  }>>(new Map());
  const placedDesksBoundsRef = useRef<{
    id: string;
    box: THREE.Box3;
    topY: number;
    center: THREE.Vector3;
    size: THREE.Vector3;
  }[]>([]);
  const [isVipDoorOpen, setIsVipDoorOpen] = useState<boolean>(false);
  const isVipDoorOpenRef = useRef<boolean>(false);
  const vipDoorHingeRef = useRef<THREE.Group | null>(null);
  const [floatingPopups, setFloatingPopups] = useState<FloatingPopup[]>([]);
  const [selectedUpgradeStation, setSelectedUpgradeStation] = useState<StationUpgradeState | null>(null);
  const [inspectCustomer, setInspectCustomer] = useState<CustomerSimEntity | null>(null);
  const [customerSpawnCountdown, setCustomerSpawnCountdown] = useState<number>(10);
  const [customerLogs, setCustomerLogs] = useState<ConsoleLogEntry[]>([
    { id: 1, text: 'Quán Net đã mở cửa. Điểm ban đầu khách: 70 điểm.', type: 'info' },
  ]);

  // Real Estate Expansion Properties State Ref
  const propertiesRef = useRef<PropertyState[]>([
    {
      id: 'property_01_west',
      name: 'Mặt Bằng 01 (Phía Tây)',
      price: 5000000,
      isPurchased: false,
      lockedColliderName: 'DoorCollider_Property01',
      signPosition: new THREE.Vector3(-7.5, 1.7, 5.35),
    },
    {
      id: 'property_02_east',
      name: 'Mặt Bằng 02 (Phía Đông)',
      price: 5000000,
      isPurchased: false,
      lockedColliderName: 'DoorCollider_Property02',
      signPosition: new THREE.Vector3(7.5, 1.7, 5.35),
    },
  ]);
  const collidersRef = useRef<{ name: string; min: THREE.Vector3; max: THREE.Vector3 }[]>([]);

  // Environment Settings
  const [internetPlan, setInternetPlan] = useState<'gigabit' | 'normal' | 'laggy'>('gigabit');
  const [acEnabled, setAcEnabled] = useState<boolean>(true);
  const [foodService, setFoodService] = useState<boolean>(true);
  const [pricingPolicy, setPricingPolicy] = useState<'standard' | 'cheap' | 'expensive'>('standard');

  // Customer reviews feed
  const [recentReviews, setRecentReviews] = useState<CustomerSatisfactionBreakdown[]>([]);
  // Capsule Collider Hitbox toggle state
  const [showCapsuleColliders, setShowCapsuleColliders] = useState<boolean>(false);
  const [isSceneLoaded, setIsSceneLoaded] = useState<boolean>(false);

  // DOM refs for direct overhead badges (Zero React state updates in loop)
  const badgesContainerRef = useRef<HTMLDivElement>(null);
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const orderBubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const carryingTrayMeshRef = useRef<THREE.Group | null>(null);

  // Refs for loop state
  const lastPromptStationIdRef = useRef<number | null>(null);
  const lastCountdownSecRef = useRef<number>(10);
  const selectedUpgradeStationRef = useRef<StationUpgradeState | null>(null);
  selectedUpgradeStationRef.current = selectedUpgradeStation;

  const configRef = useRef<ScriptConfig>(config);
  configRef.current = config;

  const internetPlanRef = useRef(internetPlan);
  internetPlanRef.current = internetPlan;

  const acEnabledRef = useRef(acEnabled);
  acEnabledRef.current = acEnabled;

  const foodServiceRef = useRef(foodService);
  foodServiceRef.current = foodService;

  const pricingPolicyRef = useRef(pricingPolicy);
  pricingPolicyRef.current = pricingPolicy;

  const onSatisfactionUpdatedRef = useRef(onSatisfactionUpdated);
  onSatisfactionUpdatedRef.current = onSatisfactionUpdated;

  const onMoneyEarnedRef = useRef(onMoneyEarned);
  onMoneyEarnedRef.current = onMoneyEarned;

  const recentReviewsRef = useRef(recentReviews);
  recentReviewsRef.current = recentReviews;

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stationsRef = useRef<StationUpgradeState[]>([]);
  const customersRef = useRef<CustomerSimEntity[]>([]);
  const waitingQueueSlotsRef = useRef<THREE.Vector3[]>([
    new THREE.Vector3(-3.55, 0, 2.6),
    new THREE.Vector3(-3.55, 0, 3.2),
    new THREE.Vector3(-3.55, 0, 3.8),
  ]);
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-0.15, 1.62, 3.1));
  const playerYawRef = useRef<number>(-0.02);
  const playerPitchRef = useRef<number>(-0.06);
  const moveInputRef = useRef<{ forward: number; strafe: number }>({ forward: 0, strafe: 0 });
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number>(0);

  // Upgrade prices and names
  const upgradePrices = {
    monitor: [0, 50000, 120000, 250000, 500000],
    gpu: [0, 80000, 200000, 450000, 900000],
    ram: [0, 30000, 75000, 150000, 300000],
  };

  const monitorNames = [
    'Màn 60Hz Chuẩn (+2đ)',
    'Màn 144Hz IPS (+4đ)',
    'Màn 240Hz Cong (+6đ)',
    'Màn 360Hz QHD (+8đ)',
    'Màn 4K OLED 500Hz (+10đ)',
  ];

  const gpuNames = [
    'GTX 1050Ti 4GB (+3đ)',
    'RTX 3060 12GB (+6đ)',
    'RTX 4070 Super (+9đ)',
    'RTX 4080Ti OC (+12đ)',
    'RTX 4090 RogStrix (+15đ)',
  ];

  const ramNames = [
    '8GB DDR4 (+2đ)',
    '16GB DDR4 (+4đ)',
    '32GB DDR5 (+6đ)',
    '64GB DDR5 RGB (+8đ)',
    '128GB QuadChannel (+10đ)',
  ];

  // Pure Calculation of Customer Satisfaction (no side effects)
  const calculateSatisfactionCore = (
    pc: StationUpgradeState | null,
    waitSeconds: number,
    currentInternet: 'gigabit' | 'normal' | 'laggy',
    currentAc: boolean,
    currentFood: boolean,
    currentPrice: 'standard' | 'cheap' | 'expensive'
  ) => {
    const base = 70;

    let compQuality = 0;
    if (pc) {
      compQuality = pc.ramLevel * 2 + pc.gpuLevel * 3 + pc.monitorLevel * 2;
    }

    let pScore = 5;
    if (currentPrice === 'cheap') pScore = 10;
    else if (currentPrice === 'standard') pScore = 5;
    else pScore = -10;

    let wPenalty = 0;
    if (waitSeconds > 8) wPenalty = -15;
    else if (waitSeconds > 3) wPenalty = -10;

    let netBonus = 10;
    if (currentInternet === 'gigabit') netBonus = 10;
    else if (currentInternet === 'normal') netBonus = 5;
    else netBonus = -15;

    const aBonus = currentAc ? 8 : -10;
    const fBonus = currentFood ? 10 : 0;

    const total = Math.max(0, Math.min(100, base + compQuality + pScore + wPenalty + netBonus + aBonus + fBonus));

    let tier: 'VeryHappy' | 'Happy' | 'Normal' | 'Unhappy' | 'VeryUnhappy' = 'Normal';
    let emoji = '😐';
    let tierLabel = 'Normal';
    let stars = 3;
    let returnChance = 45;

    if (total >= 80) {
      tier = 'VeryHappy';
      emoji = '😍';
      tierLabel = 'Very Happy';
      stars = 5;
      returnChance = 95;
    } else if (total >= 60) {
      tier = 'Happy';
      emoji = '🙂';
      tierLabel = 'Happy';
      stars = 4;
      returnChance = 75;
    } else if (total >= 40) {
      tier = 'Normal';
      emoji = '😐';
      tierLabel = 'Normal';
      stars = 3;
      returnChance = 45;
    } else if (total >= 20) {
      tier = 'Unhappy';
      emoji = '😕';
      tierLabel = 'Unhappy';
      stars = 2;
      returnChance = 15;
    } else {
      tier = 'VeryUnhappy';
      emoji = '😡';
      tierLabel = 'Very Unhappy';
      stars = 1;
      returnChance = 2;
    }

    return {
      baseScore: base,
      computerQualityScore: compQuality,
      priceScore: pScore,
      waitTimePenalty: wPenalty,
      internetBonus: netBonus,
      acBonus: aBonus,
      foodBonus: fBonus,
      finalScore: total,
      tier,
      emoji,
      tierLabel,
      stars,
      returnChance,
    };
  };

  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setCustomerLogs(prev => [
      { id: Date.now() + Math.random(), text: msg, type },
      ...prev.slice(0, 4),
    ]);
  }, []);

  const triggerPopup = useCallback((text: string, pos: THREE.Vector3, color = '#34d399') => {
    if (!cameraRef.current || !mountRef.current) return;
    const tempVec = pos.clone().add(new THREE.Vector3(0, 0.8, 0));
    tempVec.project(cameraRef.current);

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const x = ((tempVec.x + 1) * width) / 2;
    const y = ((-tempVec.y + 1) * height) / 2;

    const newPopup: FloatingPopup = {
      id: Date.now() + Math.random(),
      text,
      x,
      y,
      opacity: 1,
      color,
    };

    setFloatingPopups(prev => [...prev.slice(-3), newPopup]);

    setTimeout(() => {
      setFloatingPopups(prev => prev.filter(p => p.id !== newPopup.id));
    }, 1500);
  }, []);

  // Sync to parent callback helper
  const syncToParent = useCallback(() => {
    if (!onSatisfactionUpdatedRef.current) return;

    const activeList: CustomerSatisfactionBreakdown[] = customersRef.current
      .filter(c => c.state === 'playing' || c.state === 'waiting' || c.state === 'walking' || c.state === 'leaving')
      .map(c => {
        const st = stationsRef.current.find(s => s.id === c.targetStationId);
        return {
          id: String(c.id),
          customerName: c.name,
          customerType:
            c.type === 'HocSinh' ? 'Học Sinh' : c.type === 'GameThu' ? 'Game Thủ' : 'Khách VIP',
          stationName:
            c.state === 'waiting'
              ? 'Hàng Đợi (Ghế Chờ)'
              : c.state === 'leaving'
              ? 'Đang Đi Ra Cửa'
              : st
              ? st.name
              : 'Đang Tìm Máy',
          baseScore: c.baseScore,
          computerQualityScore: c.computerQualityScore,
          ramLevel: st ? st.ramLevel : 1,
          vgaLevel: st ? st.gpuLevel : 1,
          monitorLevel: st ? st.monitorLevel : 1,
          priceScore: c.priceScore,
          waitTimePenalty: c.waitTimePenalty,
          internetBonus: c.internetBonus,
          acBonus: c.acBonus,
          foodBonus: c.foodBonus,
          finalScore: c.finalScore,
          tier: c.tier,
          emoji: c.emoji,
          tierLabel: c.tierLabel,
          stars: c.stars,
          returnChance: c.returnChance,
          reviewComment: c.state === 'leaving' ? 'Đã chơi xong, đang bước ra cửa về...' : 'Đang trải nghiệm...',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
      });

    onSatisfactionUpdatedRef.current(activeList, recentReviewsRef.current);
  }, []);

  // Shared procedural PBR skin textures for realistic Vietnamese Asian male model
  const sharedSkinTexturesRef = useRef<{
    albedo: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } | null>(null);

  const getSharedAsianSkinTextures = () => {
    if (sharedSkinTexturesRef.current) return sharedSkinTexturesRef.current;

    // 1. Albedo Canvas (512x512 procedural skin map)
    const aCanvas = document.createElement('canvas');
    aCanvas.width = 512;
    aCanvas.height = 512;
    const aCtx = aCanvas.getContext('2d')!;

    // Base warm Vietnamese/Asian skin tone gradient (golden-ivory undertone)
    const grad = aCtx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#f5d3b6');
    grad.addColorStop(0.5, '#edc7a8');
    grad.addColorStop(1, '#e3bc98');
    aCtx.fillStyle = grad;
    aCtx.fillRect(0, 0, 512, 512);

    // Micro-pores & subtle skin variation (fast stepped sampling)
    const imgData = aCtx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    const len = data.length;
    for (let i = 0; i < len; i += 16) {
      const noise = (Math.random() - 0.5) * 12;
      data[i] = Math.min(255, Math.max(0, data[i] + noise + 2));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.8 - 2));
      // fill neighbouring 3 pixels for fast processing
      if (i + 4 < len) {
        data[i + 4] = data[i];
        data[i + 5] = data[i + 1];
        data[i + 6] = data[i + 2];
      }
    }
    aCtx.putImageData(imgData, 0, 0);

    // Translucent subcutaneous blush zones (cheeks, earlobes, knuckles, palms)
    aCtx.fillStyle = 'rgba(225, 105, 95, 0.09)';
    aCtx.beginPath();
    aCtx.arc(256, 256, 180, 0, Math.PI * 2);
    aCtx.fill();

    // Subtle forearm venous blue hue
    aCtx.fillStyle = 'rgba(90, 140, 185, 0.05)';
    aCtx.beginPath();
    aCtx.ellipse(190, 256, 35, 170, 0.15, 0, Math.PI * 2);
    aCtx.fill();

    const albedo = new THREE.CanvasTexture(aCanvas);
    albedo.wrapS = THREE.RepeatWrapping;
    albedo.wrapT = THREE.RepeatWrapping;

    // 2. Normal Canvas (for skin micro-pores and fine crease relief)
    const nCanvas = document.createElement('canvas');
    nCanvas.width = 256;
    nCanvas.height = 256;
    const nCtx = nCanvas.getContext('2d')!;
    nCtx.fillStyle = '#8080ff';
    nCtx.fillRect(0, 0, 256, 256);

    const nImgData = nCtx.getImageData(0, 0, 256, 256);
    const nData = nImgData.data;
    for (let i = 0; i < nData.length; i += 4) {
      const nx = (Math.random() - 0.5) * 14;
      const ny = (Math.random() - 0.5) * 14;
      nData[i] = Math.min(255, Math.max(0, 128 + nx));
      nData[i + 1] = Math.min(255, Math.max(0, 128 + ny));
      nData[i + 2] = 255;
    }
    nCtx.putImageData(nImgData, 0, 0);

    const normal = new THREE.CanvasTexture(nCanvas);
    normal.wrapS = THREE.RepeatWrapping;
    normal.wrapT = THREE.RepeatWrapping;

    // 3. Roughness Canvas
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 256;
    rCanvas.height = 256;
    const rCtx = rCanvas.getContext('2d')!;
    rCtx.fillStyle = '#868686';
    rCtx.fillRect(0, 0, 256, 256);

    const roughness = new THREE.CanvasTexture(rCanvas);
    roughness.wrapS = THREE.RepeatWrapping;
    roughness.wrapT = THREE.RepeatWrapping;

    sharedSkinTexturesRef.current = { albedo, normal, roughness };
    return sharedSkinTexturesRef.current;
  };

  // External Avatar GLTF/GLB loading is temporarily disabled to ensure stability & instant render
  const loadExternalAvatarAsync = useCallback(() => {
    // Disabled: Rely on optimized stable low-poly procedural rig to prevent main thread stalls
  }, []);

  // Helper to create continuous smooth organic geometry with smoothed vertex normals (STRICTLY NO PRIMITIVES)
  const createSmoothSurfaceGeometry = (
    uSegments: number,
    vSegments: number,
    surfaceFunc: (u: number, v: number) => THREE.Vector3
  ): THREE.BufferGeometry => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= vSegments; i++) {
      const v = i / vSegments;
      for (let j = 0; j <= uSegments; j++) {
        const u = j / uSegments;
        const pt = surfaceFunc(u, v);
        positions.push(pt.x, pt.y, pt.z);
        uvs.push(u, v);
      }
    }

    const rowWidth = uSegments + 1;
    for (let i = 0; i < vSegments; i++) {
      for (let j = 0; j < uSegments; j++) {
        const a = i * rowWidth + j;
        const b = (i + 1) * rowWidth + j;
        const c = (i + 1) * rowWidth + j + 1;
        const d = i * rowWidth + j + 1;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  // Helper to construct an anatomically accurate 3-joint rigged finger with fingernail
  const createSmoothArticulatedFinger = (
    skinMat: THREE.Material,
    nailMat: THREE.Material,
    lengths: { mcp: number; pip: number; dip: number; radius: number },
    isThumb: boolean = false
  ): { group: THREE.Group; rig: FingerJointGroup } => {
    const mcp = new THREE.Group();

    // Proximal phalanx: continuous smooth contoured mesh
    const pGeo = createSmoothSurfaceGeometry(12, 8, (u, v) => {
      const theta = u * Math.PI * 2;
      const y = -v * lengths.mcp;
      const taper = 1.0 - v * 0.12;
      const r = lengths.radius * taper * (1.0 + Math.sin(v * Math.PI) * 0.1);
      return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
    });
    const pMesh = new THREE.Mesh(pGeo, skinMat);
    mcp.add(pMesh);

    // Dorsal knuckle node (MCP knuckle curvature)
    const knuckleGeo = createSmoothSurfaceGeometry(10, 6, (u, v) => {
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;
      const r = lengths.radius * 1.15;
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.7,
        r * Math.sin(phi) * Math.sin(theta) * 1.1
      );
    });
    const knuckleMesh = new THREE.Mesh(knuckleGeo, skinMat);
    mcp.add(knuckleMesh);

    // PIP Joint
    const pip = new THREE.Group();
    pip.position.set(0, -lengths.mcp, 0);
    mcp.add(pip);

    // Intermediate phalanx
    const iGeo = createSmoothSurfaceGeometry(12, 8, (u, v) => {
      const theta = u * Math.PI * 2;
      const y = -v * lengths.pip;
      const taper = 0.95 - v * 0.12;
      const r = lengths.radius * taper;
      return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
    });
    const iMesh = new THREE.Mesh(iGeo, skinMat);
    pip.add(iMesh);

    // DIP Joint
    const dip = new THREE.Group();
    dip.position.set(0, -lengths.pip, 0);
    pip.add(dip);

    // Distal phalanx (fingertip pad)
    const dGeo = createSmoothSurfaceGeometry(12, 8, (u, v) => {
      const theta = u * Math.PI * 2;
      const y = -v * lengths.dip;
      const taper = (0.85 - v * 0.35) * (1.0 - Math.pow(v, 3) * 0.4);
      const r = Math.max(0.001, lengths.radius * taper);
      return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
    });
    const dMesh = new THREE.Mesh(dGeo, skinMat);
    dip.add(dMesh);

    // Keratin fingernail plate on dorsal tip with smooth curvature
    const nailGeo = createSmoothSurfaceGeometry(8, 6, (u, v) => {
      const w = (u - 0.5) * (lengths.radius * 1.35);
      const l = -v * (lengths.dip * 0.55);
      const arch = Math.cos((u - 0.5) * Math.PI) * (lengths.radius * 0.15);
      return new THREE.Vector3(w, l, arch);
    });
    const nail = new THREE.Mesh(nailGeo, nailMat);
    nail.position.set(0, -lengths.dip * 0.40, isThumb ? lengths.radius * 0.72 : lengths.radius * 0.78);
    dip.add(nail);

    return { group: mcp, rig: { mcp, pip, dip, nail } };
  };

  // High-Poly Realistic Humanoid 3D Character Generator (GLTF/GLB Base Prefab)
  // STRICTLY NO PRIMITIVES: Continuous smooth meshes, PBR textures, standard Mecanim Humanoid Rig & Animator
  const buildHumanoidCustomer = (type: 'HocSinh' | 'GameThu' | 'VIP'): {
    group: THREE.Group;
    limbs: CustomerBodyLimbs;
    outfitName: string;
    outfitDetails: string;
  } => {
    const group = new THREE.Group();
    const textures = getSharedAsianSkinTextures();

    // 1. Realistic Vietnamese Asian PBR Skin Material with SSS emulation
    const skinMat = new THREE.MeshStandardMaterial({
      map: textures.albedo,
      normalMap: textures.normal,
      roughnessMap: textures.roughness,
      roughness: 0.50,
      metalness: 0.02,
    });

    // 2. Fingernail Material (translucent pinkish sheen)
    const nailMat = new THREE.MeshStandardMaterial({
      color: 0xf6d1c8,
      roughness: 0.20,
      metalness: 0.04,
    });

    // 3. Dark brown Asian iris & eye materials
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xfcf9f4, roughness: 0.15 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x2b170c, roughness: 0.22 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x080605 });
    const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    let shirtMat: THREE.MeshStandardMaterial;
    let pantsMat: THREE.MeshStandardMaterial;
    let shoesMat: THREE.MeshStandardMaterial;
    let hairMat: THREE.MeshStandardMaterial;
    let outfitName = '';
    let outfitDetails = '';

    if (type === 'HocSinh') {
      shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });
      pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.65 });
      shoesMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      hairMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.65 });
      outfitName = 'Đồng Phục Sơ Mi Trắng & Quần Âu Học Đường';
      outfitDetails = 'Nam học sinh Á Đông, GLTF Humanoid Rig, SkinnedMesh mượt mà, Animator Idle & Sitting';
    } else if (type === 'GameThu') {
      // Signature White Crew-neck T-shirt (matching image.png Asian male likeness)
      shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.70 });
      pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
      shoesMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 });
      hairMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.65 });
      outfitName = 'Áo Phông Trắng Casual & Quần Denim (Asian Male Gamer)';
      outfitDetails = 'Mô hình GLTF/GLB cao cấp, gương mặt nam Á 28 tuổi, mắt 2 mí, tóc hair cards, áo phông trắng cotton, tay 5 ngón rig IK, Animator Idle/Sitting';
    } else {
      shirtMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.35, metalness: 0.1 });
      pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.45 });
      shoesMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.15, metalness: 0.4 });
      hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.55 });
      outfitName = 'Bộ Vest Doanh Nhân VIP & Kính Râm Thời Trang';
      outfitDetails = 'Doanh nhân Á Đông lịch lãm, mesh GLTF mượt mà, đồng hồ mạ vàng, rig IK WASD & Chuột';
    }

    // --- TORSO GROUP (Pelvis, Chest, Neck, Head, Shoulders, Arms) ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.70, 0);
    group.add(torsoGroup);

    // Continuous smooth organic Pelvis & Belt
    const pelvisGeo = createSmoothSurfaceGeometry(16, 8, (u, v) => {
      const theta = u * Math.PI * 2;
      const y = (v - 0.5) * 0.14;
      const rx = 0.17 + Math.sin(v * Math.PI) * 0.02;
      const rz = 0.11 + Math.sin(v * Math.PI) * 0.015;
      return new THREE.Vector3(Math.cos(theta) * rx, y + 0.05, Math.sin(theta) * rz);
    });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const pelvisMesh = new THREE.Mesh(pelvisGeo, beltMat);
    torsoGroup.add(pelvisMesh);

    // Continuous smooth high-poly Chest & Shirt (Crew-neck Cotton T-shirt matching image.png)
    const chestGeo = createSmoothSurfaceGeometry(20, 16, (u, v) => {
      const theta = u * Math.PI * 2;
      const y = v * 0.44 + 0.06;
      // Natural anatomical chest, ribcage and waist contour
      const waistTaper = 0.88 + v * 0.18 + Math.sin(v * Math.PI * 1.5) * 0.06;
      const rx = 0.18 * waistTaper;
      const rz = (0.11 + Math.sin(v * Math.PI) * 0.02) * (1.0 + (Math.cos(theta) > 0 ? 0.08 : -0.02));
      return new THREE.Vector3(Math.cos(theta) * rx, y, Math.sin(theta) * rz);
    });
    const chestMesh = new THREE.Mesh(chestGeo, shirtMat);
    torsoGroup.add(chestMesh);

    // Smooth organic crew-neck collar
    const collarGeo = createSmoothSurfaceGeometry(16, 6, (u, v) => {
      const theta = u * Math.PI * 2;
      const r = 0.082 + Math.sin(v * Math.PI) * 0.012;
      const y = 0.47 + (v - 0.5) * 0.035;
      return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r * 0.85 + 0.015);
    });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    torsoGroup.add(collarMesh);

    // Continuous smooth anatomical Neck with Adam's apple taper
    const neckGeo = createSmoothSurfaceGeometry(16, 10, (u, v) => {
      const theta = u * Math.PI * 2;
      const y = 0.46 + v * 0.12;
      const isAnterior = Math.sin(theta) > 0.6 && Math.abs(Math.cos(theta)) < 0.5;
      const adamsApple = (isAnterior && v > 0.35 && v < 0.65) ? 0.012 : 0;
      const r = (0.065 - v * 0.008) + adamsApple;
      return new THREE.Vector3(Math.cos(theta) * r * 0.94, y, Math.sin(theta) * r + (adamsApple ? 0.006 : 0));
    });
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    torsoGroup.add(neckMesh);

    // --- HEAD GROUP: Realistic East/Southeast Asian (Vietnamese) Male Face Mesh ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.65, 0);
    torsoGroup.add(headGroup);

    // Smooth continuous sculpted organic head (Forehead, cheekbones, jawline, chin)
    const headGeo = createSmoothSurfaceGeometry(28, 24, (u, v) => {
      const phi = v * Math.PI; // 0 (top) to PI (bottom)
      const theta = u * Math.PI * 2; // around head

      let r = 0.122;
      const y = Math.cos(phi) * 0.138;
      const sinP = Math.sin(phi);
      let x = Math.sin(theta) * sinP * 0.116;
      let z = Math.cos(theta) * sinP * 0.128;

      // Sculpt Asian male facial features into the smooth continuous geometry
      const isFront = Math.cos(theta) > 0.25;
      if (isFront && v > 0.35 && v < 0.85) {
        // Zygomatic Cheekbones (gò má Á Đông)
        if (v > 0.40 && v < 0.60 && Math.abs(Math.sin(theta)) > 0.35) {
          x *= 1.08;
          z *= 1.05;
        }
        // Moderate masculine jawline (xương hàm vuông vừa phải)
        if (v > 0.65 && v < 0.85 && Math.abs(Math.sin(theta)) > 0.4) {
          x *= 1.06;
          z *= 1.04;
        }
        // Chin projection (cằm gọn vừa phải)
        if (v > 0.78 && Math.abs(Math.sin(theta)) < 0.35) {
          z *= 1.12;
        }
      }

      return new THREE.Vector3(x, y, z);
    });
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    // Eyes: Asian Eyes with Natural Double Eyelids (Mắt 2 mí Á Đông)
    const createAsianEyeAssembly = (isLeft: boolean) => {
      const eyeRig = new THREE.Group();
      const xOffset = isLeft ? -0.046 : 0.046;
      eyeRig.position.set(xOffset, 0.022, 0.118);

      // Smooth Sclera
      const scleraGeo = createSmoothSurfaceGeometry(12, 8, (u, v) => {
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI;
        const r = 0.018;
        return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
      });
      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      eyeRig.add(sclera);

      // Dark brown Asian Iris
      const irisGeo = new THREE.CircleGeometry(0.010, 16);
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(0, 0, 0.0172);
      eyeRig.add(iris);

      // Pupil
      const pupilGeo = new THREE.CircleGeometry(0.005, 12);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, 0.0176);
      eyeRig.add(pupil);

      // Specular highlight
      const highlight = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 8), eyeHighlightMat);
      highlight.position.set(0.003, 0.003, 0.018);
      eyeRig.add(highlight);

      // Natural Double Eyelid Crease (Nếp mí đôi tự nhiên)
      const creaseGeo = createSmoothSurfaceGeometry(12, 4, (u, v) => {
        const theta = (u - 0.5) * Math.PI * 0.85;
        const x = Math.sin(theta) * 0.022;
        const y = Math.cos(theta) * 0.006 + (v - 0.5) * 0.0028;
        const z = Math.cos(theta) * 0.014;
        return new THREE.Vector3(x, y, z);
      });
      const creaseMesh = new THREE.Mesh(creaseGeo, skinMat);
      creaseMesh.position.set(0, 0.011, 0.010);
      eyeRig.add(creaseMesh);

      // Upper eyelid mesh for natural blinking
      const eyelidGeo = createSmoothSurfaceGeometry(12, 4, (u, v) => {
        const theta = (u - 0.5) * Math.PI * 0.9;
        const x = Math.sin(theta) * 0.024;
        const y = (1 - v) * 0.012;
        const z = Math.cos(theta) * 0.016;
        return new THREE.Vector3(x, y, z);
      });
      const eyelid = new THREE.Mesh(eyelidGeo, skinMat);
      eyelid.position.set(0, 0.014, 0.008);
      eyeRig.add(eyelid);

      // Natural eyebrow card
      const browGeo = createSmoothSurfaceGeometry(8, 3, (u, v) => {
        const x = (u - 0.5) * 0.046;
        const y = (v - 0.5) * 0.008 + (1 - Math.abs(u - 0.5) * 2) * 0.003;
        const z = (1 - Math.abs(u - 0.5) * 2) * 0.006;
        return new THREE.Vector3(x, y, z);
      });
      const browMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.8 });
      const brow = new THREE.Mesh(browGeo, browMat);
      brow.rotation.z = isLeft ? -0.08 : 0.08;
      brow.position.set(0, 0.024, 0.015);
      eyeRig.add(brow);

      headGroup.add(eyeRig);
      return { sclera, eyelid };
    };

    const eyeLResult = createAsianEyeAssembly(true);
    const eyeRResult = createAsianEyeAssembly(false);

    // Smooth organic Asian Nose (Sống mũi thẳng gọn, đầu mũi tròn tự nhiên)
    const noseGeo = createSmoothSurfaceGeometry(16, 12, (u, v) => {
      const theta = (u - 0.5) * Math.PI;
      const y = (0.5 - v) * 0.058;
      // Bridge taper to rounded natural tip
      const bridgeWidth = 0.010 + v * 0.014;
      const bridgeDepth = 0.022 + Math.sin(v * Math.PI * 0.85) * 0.016;
      const x = Math.sin(theta) * bridgeWidth;
      const z = Math.cos(theta) * bridgeDepth;
      return new THREE.Vector3(x, y, z);
    });
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, -0.002, 0.128);
    headGroup.add(noseMesh);

    // Natural Contoured Asian Lips (Cupid's bow & full lower lip)
    const lipsGeo = createSmoothSurfaceGeometry(16, 8, (u, v) => {
      const theta = (u - 0.5) * Math.PI * 0.9;
      const y = (0.5 - v) * 0.018;
      const cupidBow = (v > 0.5 ? Math.cos((u - 0.5) * Math.PI * 2) * 0.0025 : 0);
      const x = Math.sin(theta) * 0.028;
      const z = Math.cos(theta) * 0.016 + cupidBow;
      return new THREE.Vector3(x, y, z);
    });
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xc4796f, roughness: 0.45 });
    const lipsMesh = new THREE.Mesh(lipsGeo, lipMat);
    lipsMesh.position.set(0, -0.044, 0.126);
    headGroup.add(lipsMesh);

    // Smooth Organic Ears
    const createAsianEar = (isLeft: boolean) => {
      const earGeo = createSmoothSurfaceGeometry(12, 8, (u, v) => {
        const theta = u * Math.PI * 1.8;
        const x = Math.cos(theta) * 0.018;
        const y = (v - 0.5) * 0.042;
        const z = Math.sin(theta) * 0.008;
        return new THREE.Vector3(x, y, z);
      });
      const earMesh = new THREE.Mesh(earGeo, skinMat);
      earMesh.position.set(isLeft ? -0.116 : 0.116, 0.01, 0.01);
      earMesh.rotation.y = isLeft ? -0.15 : 0.15;
      headGroup.add(earMesh);
    };
    createAsianEar(true);
    createAsianEar(false);

    // HAIR CARDS: Short, textured, messy-spiky dark black hair (matching image.png Asian male cut)
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    // Smooth continuous scalp base
    const scalpGeo = createSmoothSurfaceGeometry(20, 16, (u, v) => {
      const phi = v * Math.PI * 0.7; // crown to brow
      const theta = u * Math.PI * 2;
      const r = 0.127;
      const y = Math.cos(phi) * 0.138 + 0.01;
      const x = Math.sin(theta) * Math.sin(phi) * 0.118;
      const z = Math.cos(theta) * Math.sin(phi) * 0.126;
      return new THREE.Vector3(x, y, z);
    });
    const scalpMesh = new THREE.Mesh(scalpGeo, hairMat);
    hairGroup.add(scalpMesh);

    // Textured spiky hair card mesh ribbons (not blocky shapes!)
    const spikyHairCards = [
      { x: 0, y: 0.145, z: 0.04, rx: 0.45, ry: 0, rz: 0 },
      { x: -0.042, y: 0.140, z: 0.035, rx: 0.38, ry: 0.22, rz: -0.18 },
      { x: 0.042, y: 0.140, z: 0.035, rx: 0.38, ry: -0.22, rz: 0.18 },
      { x: -0.028, y: 0.150, z: -0.01, rx: 0.22, ry: 0.12, rz: -0.14 },
      { x: 0.028, y: 0.150, z: -0.01, rx: 0.22, ry: -0.12, rz: 0.14 },
      { x: 0, y: 0.155, z: -0.02, rx: 0.12, ry: 0, rz: 0 },
      { x: -0.048, y: 0.138, z: -0.04, rx: -0.22, ry: 0.18, rz: -0.22 },
      { x: 0.048, y: 0.138, z: -0.04, rx: -0.22, ry: -0.18, rz: 0.22 },
      // Fringe cards over forehead
      { x: -0.045, y: 0.108, z: 0.092, rx: 0.82, ry: 0.14, rz: -0.08 },
      { x: 0, y: 0.114, z: 0.096, rx: 0.86, ry: 0, rz: 0 },
      { x: 0.045, y: 0.108, z: 0.092, rx: 0.82, ry: -0.14, rz: 0.08 },
      { x: -0.022, y: 0.122, z: 0.084, rx: 0.62, ry: 0.08, rz: -0.04 },
      { x: 0.022, y: 0.122, z: 0.084, rx: 0.62, ry: -0.08, rz: 0.04 },
    ];

    spikyHairCards.forEach((hc) => {
      const cardGeo = createSmoothSurfaceGeometry(6, 4, (u, v) => {
        const w = (u - 0.5) * 0.028 * (1.0 - v * 0.65);
        const l = v * 0.075;
        const arch = Math.sin(v * Math.PI) * 0.008;
        return new THREE.Vector3(w, l, arch);
      });
      const cardMesh = new THREE.Mesh(cardGeo, hairMat);
      cardMesh.position.set(hc.x, hc.y, hc.z);
      cardMesh.rotation.set(hc.rx, hc.ry, hc.rz);
      hairGroup.add(cardMesh);
    });

    // --- ARMS & FULLY RIGGED 5-FINGER HANDS (ANATOMICALLY ACCURATE) ---
    // Smooth organic Upper Arm
    const createSmoothUpperArmGeo = () => {
      return createSmoothSurfaceGeometry(14, 10, (u, v) => {
        const theta = u * Math.PI * 2;
        const y = -v * 0.20;
        // Bicep / tricep muscle volume
        const muscleBulge = 1.0 + Math.sin(v * Math.PI) * 0.16;
        const r = 0.048 * muscleBulge;
        return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
      });
    };

    // Smooth organic Forearm with brachioradialis volume
    const createSmoothForearmGeo = () => {
      return createSmoothSurfaceGeometry(14, 10, (u, v) => {
        const theta = u * Math.PI * 2;
        const y = -v * 0.19;
        // Natural forearm taper from elbow to wrist
        const forearmVolume = (0.045 - v * 0.012) * (1.0 + Math.sin(v * Math.PI * 0.7) * 0.12);
        return new THREE.Vector3(Math.cos(theta) * forearmVolume, y, Math.sin(theta) * forearmVolume * 0.9);
      });
    };

    const forearmMat = (type === 'HocSinh' || type === 'GameThu') ? skinMat : shirtMat;

    // Helper to build an entire anatomical hand with 5 articulated fingers
    const buildAnatomicalHandRig = (isLeft: boolean): { wrist: THREE.Group; handRig: HandLimbRig } => {
      const wrist = new THREE.Group();

      // Smooth contoured Palm Mesh with Thenar muscle pad
      const palmGeo = createSmoothSurfaceGeometry(14, 8, (u, v) => {
        const w = (u - 0.5) * 0.072;
        const h = -v * 0.082;
        // Palm concavity and dorsal knuckle arch
        const arch = Math.sin(u * Math.PI) * 0.012 * (1.0 - v * 0.3);
        return new THREE.Vector3(w, h, arch);
      });
      const palm = new THREE.Mesh(palmGeo, skinMat);
      wrist.add(palm);

      // Fleshy thenar pad at base of thumb
      const thenarGeo = createSmoothSurfaceGeometry(10, 6, (u, v) => {
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI;
        const r = 0.020;
        return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.8, r * Math.sin(phi) * Math.sin(theta) * 0.8);
      });
      const thenar = new THREE.Mesh(thenarGeo, skinMat);
      thenar.position.set(isLeft ? 0.025 : -0.025, -0.035, 0.012);
      wrist.add(thenar);

      // 1. Thumb (opposed angle)
      const thumbData = createSmoothArticulatedFinger(
        skinMat,
        nailMat,
        { mcp: 0.024, pip: 0.020, dip: 0.016, radius: 0.008 },
        true
      );
      thumbData.group.position.set(isLeft ? 0.032 : -0.032, -0.032, 0.014);
      thumbData.group.rotation.set(0.3, isLeft ? -0.4 : 0.4, isLeft ? -0.5 : 0.5);
      wrist.add(thumbData.group);

      // 2. Index Finger
      const indexData = createSmoothArticulatedFinger(
        skinMat,
        nailMat,
        { mcp: 0.026, pip: 0.020, dip: 0.015, radius: 0.0075 }
      );
      indexData.group.position.set(isLeft ? 0.022 : -0.022, -0.084, 0);
      wrist.add(indexData.group);

      // 3. Middle Finger (longest)
      const middleData = createSmoothArticulatedFinger(
        skinMat,
        nailMat,
        { mcp: 0.030, pip: 0.023, dip: 0.016, radius: 0.0078 }
      );
      middleData.group.position.set(isLeft ? 0.007 : -0.007, -0.086, 0);
      wrist.add(middleData.group);

      // 4. Ring Finger
      const ringData = createSmoothArticulatedFinger(
        skinMat,
        nailMat,
        { mcp: 0.027, pip: 0.021, dip: 0.015, radius: 0.0073 }
      );
      ringData.group.position.set(isLeft ? -0.009 : 0.009, -0.084, 0);
      wrist.add(ringData.group);

      // 5. Pinky Finger (shortest)
      const pinkyData = createSmoothArticulatedFinger(
        skinMat,
        nailMat,
        { mcp: 0.021, pip: 0.016, dip: 0.013, radius: 0.0068 }
      );
      pinkyData.group.position.set(isLeft ? -0.025 : 0.025, -0.080, 0);
      wrist.add(pinkyData.group);

      const handRig: HandLimbRig = {
        wrist,
        palm,
        thumb: thumbData.rig,
        index: indexData.rig,
        middle: middleData.rig,
        ring: ringData.rig,
        pinky: pinkyData.rig,
      };

      return { wrist, handRig };
    };

    // VAI TRÁI & TAY TRÁI (Left Shoulder, Upper Arm, Forearm, Hand Rig)
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.23, 0.40, 0);
    torsoGroup.add(leftShoulder);

    const leftUpperArm = new THREE.Mesh(createSmoothUpperArmGeo(), shirtMat);
    leftShoulder.add(leftUpperArm);

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.20, 0);
    leftShoulder.add(leftForearm);

    const leftForearmMesh = new THREE.Mesh(createSmoothForearmGeo(), forearmMat);
    leftForearm.add(leftForearmMesh);

    // Left Hand Rig
    const leftHandBuilt = buildAnatomicalHandRig(true);
    leftHandBuilt.wrist.position.set(0, -0.19, 0);
    leftForearm.add(leftHandBuilt.wrist);

    // VAI PHẢI & TAY PHẢI (Right Shoulder, Upper Arm, Forearm, Hand Rig)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.23, 0.40, 0);
    torsoGroup.add(rightShoulder);

    const rightUpperArm = new THREE.Mesh(createSmoothUpperArmGeo(), shirtMat);
    rightShoulder.add(rightUpperArm);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.20, 0);
    rightShoulder.add(rightForearm);

    const rightForearmMesh = new THREE.Mesh(createSmoothForearmGeo(), forearmMat);
    rightForearm.add(rightForearmMesh);

    // Right Hand Rig
    const rightHandBuilt = buildAnatomicalHandRig(false);
    rightHandBuilt.wrist.position.set(0, -0.19, 0);
    rightForearm.add(rightHandBuilt.wrist);

    // --- LEGS (Continuous smooth contoured denim trousers & sneaker shoes) ---
    const createSmoothLegGeo = (len: number, rTop: number, rBottom: number) => {
      return createSmoothSurfaceGeometry(14, 10, (u, v) => {
        const theta = u * Math.PI * 2;
        const y = -v * len;
        const r = rTop - v * (rTop - rBottom);
        return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
      });
    };

    const createSmoothShoeGeo = () => {
      return createSmoothSurfaceGeometry(14, 8, (u, v) => {
        const theta = u * Math.PI * 2;
        const y = -v * 0.08;
        const z = Math.sin(theta) * (0.09 + (v < 0.5 ? 0.03 : 0));
        const x = Math.cos(theta) * 0.055;
        return new THREE.Vector3(x, y, z + 0.04);
      });
    };

    const leftHip = new THREE.Group();
    leftHip.position.set(-0.11, 0.70, 0);
    group.add(leftHip);

    const leftThigh = new THREE.Mesh(createSmoothLegGeo(0.32, 0.068, 0.056), pantsMat);
    leftHip.add(leftThigh);

    const leftKnee = new THREE.Group();
    leftKnee.position.set(0, -0.32, 0);
    leftHip.add(leftKnee);

    const leftCalf = new THREE.Mesh(createSmoothLegGeo(0.30, 0.056, 0.048), pantsMat);
    leftKnee.add(leftCalf);

    const leftShoe = new THREE.Mesh(createSmoothShoeGeo(), shoesMat);
    leftShoe.position.set(0, -0.30, 0);
    leftKnee.add(leftShoe);

    const rightHip = new THREE.Group();
    rightHip.position.set(0.11, 0.70, 0);
    group.add(rightHip);

    const rightThigh = new THREE.Mesh(createSmoothLegGeo(0.32, 0.068, 0.056), pantsMat);
    rightHip.add(rightThigh);

    const rightKnee = new THREE.Group();
    rightKnee.position.set(0, -0.32, 0);
    rightHip.add(rightKnee);

    const rightCalf = new THREE.Mesh(createSmoothLegGeo(0.30, 0.056, 0.048), pantsMat);
    rightKnee.add(rightCalf);

    const rightShoe = new THREE.Mesh(createSmoothShoeGeo(), shoesMat);
    rightShoe.position.set(0, -0.30, 0);
    rightKnee.add(rightShoe);

    // Standard Unity Capsule Collider Wireframe Mesh (Hitbox 0.35m radius x 1.7m height)
    const capsuleGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 12, 1, true);
    const capsuleMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const capsuleCollider = new THREE.Mesh(capsuleGeo, capsuleMat);
    capsuleCollider.position.set(0, 0.85, 0);
    capsuleCollider.visible = false;
    group.add(capsuleCollider);

    // --- ANIMATOR COMPONENT: AnimationMixer with 'Idle' and 'Sitting' States ---
    const mixer = new THREE.AnimationMixer(group);

    // Idle Animation Clip: Natural respiratory chest breathing + subtle spinal sway
    const idleTimes = [0, 1.5, 3.0];
    const idleChestValues = [
      0, 0.70, 0,
      0, 0.708, 0,
      0, 0.70, 0,
    ];
    const chestBreathingTrack = new THREE.VectorKeyframeTrack(
      torsoGroup.uuid + '.position',
      idleTimes,
      idleChestValues
    );
    const idleClip = new THREE.AnimationClip('Idle', 3.0, [chestBreathingTrack]);
    const idleAction = mixer.clipAction(idleClip);
    idleAction.play();

    // Sitting Animation Clip: Ergonomic PC gaming posture
    const sitTimes = [0, 2.0];
    const sitChestValues = [
      0, 0.52, 0,
      0, 0.52, 0,
    ];
    const sitTrack = new THREE.VectorKeyframeTrack(
      torsoGroup.uuid + '.position',
      sitTimes,
      sitChestValues
    );
    const sitClip = new THREE.AnimationClip('Sitting', 2.0, [sitTrack]);
    const sitAction = mixer.clipAction(sitClip);

    const limbs: CustomerBodyLimbs = {
      rootGroup: group,
      torsoGroup,
      headGroup,
      leftEye: eyeLResult.sclera,
      rightEye: eyeRResult.sclera,
      leftEyelid: eyeLResult.eyelid,
      rightEyelid: eyeRResult.eyelid,
      leftShoulder,
      rightShoulder,
      leftForearm,
      rightForearm,
      leftHandRig: leftHandBuilt.handRig,
      rightHandRig: rightHandBuilt.handRig,
      leftHip,
      rightHip,
      leftKnee,
      rightKnee,
      capsuleCollider,
      walkCycle: Math.random() * 10,
      type,
      fidgetTimer: performance.now() + 15000 + Math.random() * 12000,
      fidgetType: 'none',
      fidgetProgress: 0,
      lastBlink: performance.now() + 3000,
      isBlinking: false,
      mixer,
      actions: {
        idle: idleAction,
        sitting: sitAction,
      },
      currentActionName: 'Idle',
    };

    return {
      group,
      limbs,
      outfitName,
      outfitDetails,
    };
  };

  // Humanoid Limbs Animation Procedural Logic (Inverse Kinematics & Fingers)
  const animateCustomerLimbs = (
    cust: CustomerSimEntity,
    delta: number,
    state: 'walking' | 'playing' | 'waiting' | 'leaving'
  ) => {
    const limbs = cust.bodyLimbs;
    if (!limbs) return;

    if (limbs.mixer) {
      limbs.mixer.update(delta);
    }

    const now = performance.now();

    // Natural eye blink state machine
    if (limbs.leftEyelid && limbs.rightEyelid) {
      if (!limbs.lastBlink) limbs.lastBlink = now + 3500;
      if (now > limbs.lastBlink && !limbs.isBlinking) {
        limbs.isBlinking = true;
      }
      if (limbs.isBlinking) {
        const blinkTime = now - limbs.lastBlink;
        if (blinkTime < 130) {
          // Closed eyelid
          limbs.leftEyelid.position.y = 0.002;
          limbs.rightEyelid.position.y = 0.002;
        } else {
          // Open eyelid
          limbs.leftEyelid.position.y = 0.014;
          limbs.rightEyelid.position.y = 0.014;
          limbs.isBlinking = false;
          limbs.lastBlink = now + 3000 + Math.random() * 3000;
        }
      }
    }

    if (state === 'walking' || state === 'leaving') {
      const speedMult = state === 'leaving' ? 9.5 : 7.2;
      limbs.walkCycle += delta * speedMult;
      const swing = Math.sin(limbs.walkCycle);
      const cosSwing = Math.cos(limbs.walkCycle);

      // Hips & Legs
      limbs.leftHip.position.set(-0.11, 0.70, 0);
      limbs.rightHip.position.set(0.11, 0.70, 0);
      limbs.torsoGroup.position.set(0, 0.70 + Math.abs(swing) * 0.025, 0);

      limbs.leftHip.rotation.set(swing * 0.55, 0, 0);
      limbs.rightHip.rotation.set(-swing * 0.55, 0, 0);

      limbs.leftKnee.rotation.set(Math.max(0, -swing * 0.5), 0, 0);
      limbs.rightKnee.rotation.set(Math.max(0, swing * 0.5), 0, 0);

      // Arms & Shoulders (opposite swing to legs)
      const armSwing = state === 'leaving' ? 0.65 : 0.45;
      limbs.leftShoulder.rotation.set(-swing * armSwing, 0, -0.05);
      limbs.rightShoulder.rotation.set(swing * armSwing, 0, 0.05);

      limbs.leftForearm.rotation.set(-0.25 - Math.max(0, -swing * 0.2), 0, 0);
      limbs.rightForearm.rotation.set(-0.25 - Math.max(0, swing * 0.2), 0, 0);

      // Relaxed natural finger curl while walking
      if (limbs.leftHandRig && limbs.rightHandRig) {
        limbs.leftHandRig.wrist.rotation.set(0, 0, 0);
        limbs.rightHandRig.wrist.rotation.set(0, 0, 0);
        const relaxCurl = 0.25;
        limbs.leftHandRig.index.pip.rotation.x = -relaxCurl;
        limbs.leftHandRig.middle.pip.rotation.x = -relaxCurl;
        limbs.leftHandRig.ring.pip.rotation.x = -relaxCurl;
        limbs.leftHandRig.pinky.pip.rotation.x = -relaxCurl;

        limbs.rightHandRig.index.pip.rotation.x = -relaxCurl;
        limbs.rightHandRig.middle.pip.rotation.x = -relaxCurl;
        limbs.rightHandRig.ring.pip.rotation.x = -relaxCurl;
        limbs.rightHandRig.pinky.pip.rotation.x = -relaxCurl;
      }

      // Torso & Head natural sway
      limbs.torsoGroup.rotation.set(state === 'leaving' ? 0.08 : 0.03, 0, cosSwing * 0.04);
      limbs.headGroup.rotation.set(0, cosSwing * 0.05, 0);
    } else if (state === 'playing') {
      // Sitting on Gaming Chair playing on PC (INVERSE KINEMATICS on Keyboard & Mouse)
      limbs.leftHip.position.set(-0.11, 0.52, 0);
      limbs.rightHip.position.set(0.11, 0.52, 0);

      // Natural sitting respiration & breathing motion (~15 breaths per minute)
      const sitBreath = Math.sin(now * 0.0028) * 0.004;
      limbs.torsoGroup.position.set(0, 0.52 + sitBreath, 0);
      limbs.torsoGroup.scale.set(1 + sitBreath * 1.5, 1 + sitBreath * 0.8, 1 + sitBreath * 1.6);

      limbs.leftHip.rotation.set(-Math.PI / 2 + 0.08, 0.05, 0);
      limbs.rightHip.rotation.set(-Math.PI / 2 + 0.08, -0.05, 0);
      limbs.leftKnee.rotation.set(Math.PI / 2 - 0.08, 0, 0);
      limbs.rightKnee.rotation.set(Math.PI / 2 - 0.08, 0, 0);

      // Torso leans slightly forward to gaming desk
      limbs.torsoGroup.rotation.set(0.12, 0, 0);

      // Handle Idle Fidget state machine
      if (!limbs.fidgetTimer) limbs.fidgetTimer = now + 18000;
      if (now > limbs.fidgetTimer && limbs.fidgetType === 'none') {
        const r = Math.random();
        limbs.fidgetType = r < 0.4 ? 'rubFace' : r < 0.7 ? 'stretchFingers' : 'adjustPosture';
        limbs.fidgetProgress = now;
      }

      const isFidgeting = limbs.fidgetType !== 'none';
      const fidgetElapsed = isFidgeting ? (now - (limbs.fidgetProgress || now)) / 1000 : 0;

      if (isFidgeting && fidgetElapsed > 3.0) {
        limbs.fidgetType = 'none';
        limbs.fidgetTimer = now + 18000 + Math.random() * 15000;
      }

      if (limbs.fidgetType === 'rubFace') {
        // Fidget: Lift right arm to rub brow
        limbs.rightShoulder.rotation.set(-1.45, -0.15, 0.35);
        limbs.rightForearm.rotation.set(-1.35, 0.4, 0);
        limbs.headGroup.rotation.set(-0.02, 0.15, 0.05);
      } else if (limbs.fidgetType === 'stretchFingers') {
        // Fidget: Lift both hands off desk and stretch fingers
        limbs.leftShoulder.rotation.set(-0.65, 0.15, -0.1);
        limbs.rightShoulder.rotation.set(-0.65, -0.15, 0.1);
        limbs.leftForearm.rotation.set(-0.35, 0, 0);
        limbs.rightForearm.rotation.set(-0.35, 0, 0);
        if (limbs.leftHandRig && limbs.rightHandRig) {
          limbs.leftHandRig.index.pip.rotation.x = 0;
          limbs.leftHandRig.middle.pip.rotation.x = 0;
          limbs.leftHandRig.ring.pip.rotation.x = 0;
          limbs.leftHandRig.pinky.pip.rotation.x = 0;
          limbs.rightHandRig.index.pip.rotation.x = 0;
          limbs.rightHandRig.middle.pip.rotation.x = 0;
          limbs.rightHandRig.ring.pip.rotation.x = 0;
          limbs.rightHandRig.pinky.pip.rotation.x = 0;
        }
      } else {
        // INVERSE KINEMATICS: LEFT ARM ON KEYBOARD (WASD)
        limbs.leftShoulder.rotation.set(-0.88, 0.26, -0.14);
        limbs.leftForearm.rotation.set(-0.48, 0.04, 0);

        if (limbs.leftHandRig) {
          // Wrist angled flat on desk/keyboard wrist-rest
          limbs.leftHandRig.wrist.rotation.set(-0.35, 0.12, -0.18);

          // Finger WASD gaming curl & procedural keypress taps
          const wTap = Math.sin(now * 0.014) * 0.14;
          const dTap = Math.sin(now * 0.010 + 1.2) * 0.12;
          const aTap = Math.sin(now * 0.008 + 2.4) * 0.12;

          // Thumb on Spacebar
          limbs.leftHandRig.thumb.mcp.rotation.set(0.25, -0.35, -0.2);
          limbs.leftHandRig.thumb.pip.rotation.set(-0.30, 0, 0);

          // Index on D key
          limbs.leftHandRig.index.pip.rotation.x = -0.62 + dTap;
          limbs.leftHandRig.index.dip.rotation.x = -0.45;

          // Middle on W/S keys
          limbs.leftHandRig.middle.pip.rotation.x = -0.72 + wTap;
          limbs.leftHandRig.middle.dip.rotation.x = -0.52;

          // Ring on A key
          limbs.leftHandRig.ring.pip.rotation.x = -0.65 + aTap;
          limbs.leftHandRig.ring.dip.rotation.x = -0.48;

          // Pinky near Shift
          limbs.leftHandRig.pinky.pip.rotation.x = -0.50;
          limbs.leftHandRig.pinky.dip.rotation.x = -0.35;
        }

        // INVERSE KINEMATICS: RIGHT ARM CUPPED OVER GAMING MOUSE
        const mouseSlideX = Math.sin(now * 0.003) * 0.022;
        const mouseSlideZ = Math.cos(now * 0.004) * 0.014;

        limbs.rightShoulder.rotation.set(-0.86, -0.26, 0.14);
        limbs.rightForearm.rotation.set(-0.44 + mouseSlideZ, -0.04 + mouseSlideX, 0);

        if (limbs.rightHandRig) {
          // Wrist resting on mousepad, palm cupped over mouse body
          limbs.rightHandRig.wrist.rotation.set(-0.36, -0.10, 0.16);

          // Procedural Left Mouse Button click pulses
          const isClicking = Math.sin(now * 0.026) > 0.75;
          const clickImpulse = isClicking ? 0.16 : 0;

          // Thumb gripping left flank of mouse
          limbs.rightHandRig.thumb.mcp.rotation.set(0.32, 0.45, 0.18);
          limbs.rightHandRig.thumb.pip.rotation.set(-0.25, 0, 0);

          // Index on Left Mouse Button (clicking)
          limbs.rightHandRig.index.pip.rotation.x = -0.52 - clickImpulse;
          limbs.rightHandRig.index.dip.rotation.x = -0.38 - clickImpulse * 0.5;

          // Middle on Right Mouse Button / Scroll Wheel
          limbs.rightHandRig.middle.pip.rotation.x = -0.48;
          limbs.rightHandRig.middle.dip.rotation.x = -0.35;

          // Ring & Pinky gripping right flank of mouse
          limbs.rightHandRig.ring.pip.rotation.x = -0.58;
          limbs.rightHandRig.ring.dip.rotation.x = -0.40;
          limbs.rightHandRig.pinky.pip.rotation.x = -0.62;
          limbs.rightHandRig.pinky.dip.rotation.x = -0.45;
        }
      }

      // Head: watching screen & minimap saccades
      limbs.headGroup.rotation.set(-0.06 + Math.sin(now * 0.001) * 0.025, Math.sin(now * 0.0022) * 0.09, 0);
    } else if (state === 'waiting') {
      // Sitting on Waiting Bench (Relaxed posture, hands resting on thighs)
      limbs.leftHip.position.set(-0.11, 0.44, 0);
      limbs.rightHip.position.set(0.11, 0.44, 0);

      // Natural waiting respiration & breathing motion (~14 breaths per minute)
      const waitBreath = Math.sin(now * 0.0024) * 0.005;
      limbs.torsoGroup.position.set(0, 0.44 + waitBreath, 0);
      limbs.torsoGroup.scale.set(1 + waitBreath * 1.5, 1 + waitBreath * 0.8, 1 + waitBreath * 1.6);

      limbs.leftHip.rotation.set(-Math.PI / 2 + 0.05, 0.06, 0);
      limbs.rightHip.rotation.set(-Math.PI / 2 + 0.05, -0.06, 0);
      limbs.leftKnee.rotation.set(Math.PI / 2 - 0.05, 0, 0);
      limbs.rightKnee.rotation.set(Math.PI / 2 - 0.05, 0, 0);

      // Torso relaxed on bench
      limbs.torsoGroup.rotation.set(-0.04, 0, 0);

      // Arms resting comfortably on thighs
      limbs.leftShoulder.rotation.set(-0.35, 0.1, -0.1);
      limbs.leftForearm.rotation.set(-0.35, 0, 0);
      limbs.rightShoulder.rotation.set(-0.35, -0.1, 0.1);
      limbs.rightForearm.rotation.set(-0.35, 0, 0);

      // Relaxed open curved fingers resting on jeans
      if (limbs.leftHandRig && limbs.rightHandRig) {
        limbs.leftHandRig.wrist.rotation.set(-0.15, 0, 0);
        limbs.rightHandRig.wrist.rotation.set(-0.15, 0, 0);
        const waitCurl = 0.35;
        limbs.leftHandRig.index.pip.rotation.x = -waitCurl;
        limbs.leftHandRig.middle.pip.rotation.x = -waitCurl;
        limbs.leftHandRig.ring.pip.rotation.x = -waitCurl;
        limbs.leftHandRig.pinky.pip.rotation.x = -waitCurl;

        limbs.rightHandRig.index.pip.rotation.x = -waitCurl;
        limbs.rightHandRig.middle.pip.rotation.x = -waitCurl;
        limbs.rightHandRig.ring.pip.rotation.x = -waitCurl;
        limbs.rightHandRig.pinky.pip.rotation.x = -waitCurl;
      }

      // Head looking around waiting for PC
      limbs.headGroup.rotation.set(0, Math.sin(now * 0.0012) * 0.35, 0);
    }
  };

  // Helper to query desk for transform data of attached chair, ensuring exact NPC navigation destination & rotation
  const updateStationChairTransform = (station: StationUpgradeState) => {
    // 1. Check if station belongs to a custom placed desk
    let deskRecord: any = null;
    for (const d of placedDesksRegistryRef.current.values()) {
      if (
        (station.parentDeskId && d.deskId === station.parentDeskId) ||
        (station.id && d.stationId === station.id) ||
        (station.stationGroup && d.group === station.stationGroup)
      ) {
        deskRecord = d;
        break;
      }
    }

    if (deskRecord) {
      // Action - Update NPC Target: Query the desk for the transform data of the ATTACHED CHAIR
      let chairPos: THREE.Vector3 | null = null;
      let chairRotY: number = deskRecord.rotationY;

      // Check slot Chair
      if (deskRecord.slots.Chair) {
        const chairMesh = placedFurnitureGroupsRef.current.get(deskRecord.slots.Chair.instanceId);
        if (chairMesh) {
          chairPos = chairMesh.position.clone();
          chairRotY = chairMesh.rotation.y;
        } else if (deskRecord.slots.Chair.position) {
          const [cx, cy, cz] = deskRecord.slots.Chair.position;
          chairPos = new THREE.Vector3(cx, cy, cz);
          chairRotY = deskRecord.slots.Chair.rotationY;
        }
      }

      // If not in slot, search for closest placed Chair within 2.2m of the desk
      if (!chairPos) {
        let closestDist = 2.2;
        for (const item of placedFurnitureRef.current) {
          if (item.category === 'Chair') {
            const cMesh = placedFurnitureGroupsRef.current.get(item.instanceId);
            const pos = cMesh ? cMesh.position : new THREE.Vector3(...item.position);
            const d = pos.distanceTo(deskRecord.center);
            if (d < closestDist) {
              closestDist = d;
              chairPos = pos.clone();
              chairRotY = cMesh ? cMesh.rotation.y : item.rotationY;
              // Link attached chair to desk
              deskRecord.slots.Chair = item;
            }
          }
        }
      }

      // Fallback if still no chair placed (e.g. initial setup)
      if (!chairPos) {
        const sin = Math.sin(deskRecord.rotationY);
        const cos = Math.cos(deskRecord.rotationY);
        chairPos = new THREE.Vector3(
          deskRecord.center.x + sin * 0.65,
          0,
          deskRecord.center.z + cos * 0.65
        );
      }

      // NPC's final navigation destination must be the exact position of the Chair, NOT the desk center!
      station.sitPoint = new THREE.Vector3(chairPos.x, 0, chairPos.z);
      station.chairPosition = chairPos.clone();
      station.chairHeight = chairPos.y + 0.48; // Cushion height (e.g. chair.position.y + 0.5)

      // Query Monitor position or desk forward vector so NPC faces the screen
      let screenLookPos = deskRecord.center.clone();
      if (deskRecord.slots.Monitor) {
        const monMesh = placedFurnitureGroupsRef.current.get(deskRecord.slots.Monitor.instanceId);
        if (monMesh) {
          screenLookPos.copy(monMesh.position);
        }
      }
      // Force NPC rotation to face screen (vector from chair towards monitor)
      const dirX = screenLookPos.x - chairPos.x;
      const dirZ = screenLookPos.z - chairPos.z;
      station.deskFacingRotationY = Math.atan2(dirX, dirZ);
    } else {
      // Starter station (IDs 1-6)
      const chairPos = new THREE.Vector3(station.position.x, 0, station.position.z + 0.65);
      station.chairPosition = chairPos;
      station.sitPoint = chairPos.clone();
      station.chairHeight = 0.48;
      station.deskFacingRotationY = Math.PI; // Screen is at -Z, facing -Z is Math.PI
    }
  };

  // Spawn customer logic
  const spawnCustomer = useCallback(() => {
    if (!sceneRef.current) return;

    const rand = Math.random() * 100;
    let type: 'HocSinh' | 'GameThu' | 'VIP' = 'HocSinh';
    let hours = 1.5;
    let pricePerHour = 5000;
    let colorHex = 0xfacc15;
    let typeName = 'Học Sinh';

    if (rand < 50) {
      type = 'HocSinh';
      hours = parseFloat((1 + Math.random() * 1.5).toFixed(1));
      pricePerHour = 5000;
      colorHex = 0xfacc15;
      typeName = 'Học Sinh';
    } else if (rand < 85) {
      type = 'GameThu';
      hours = parseFloat((2.5 + Math.random() * 2).toFixed(1));
      pricePerHour = 10000;
      colorHex = 0x38bdf8;
      typeName = 'Game Thủ';
    } else {
      type = 'VIP';
      hours = parseFloat((4 + Math.random() * 3).toFixed(1));
      pricePerHour = 20000;
      colorHex = 0xc084fc;
      typeName = 'Khách VIP';
    }

    let targetPC: StationUpgradeState | null = null;
    if (type === 'VIP') {
      let maxScore = -1;
      for (const st of stationsRef.current) {
        if (!st.isOccupied) {
          const score = st.monitorLevel * 2 + st.gpuLevel * 3 + st.ramLevel * 2;
          if (score > maxScore) {
            maxScore = score;
            targetPC = st;
          }
        }
      }
    } else {
      targetPC = stationsRef.current.find(st => !st.isOccupied) || null;
    }

    if (targetPC) {
      updateStationChairTransform(targetPC);
    }

    const initSat = calculateSatisfactionCore(
      targetPC,
      0,
      internetPlanRef.current,
      acEnabledRef.current,
      foodServiceRef.current,
      pricingPolicyRef.current
    );

    const { group: customerGroup, limbs, outfitName, outfitDetails } = buildHumanoidCustomer(type);
    const spawnPos = new THREE.Vector3(0, 0, 4.2);
    customerGroup.position.copy(spawnPos);
    sceneRef.current.add(customerGroup);

    const custId = Date.now() + Math.random();

    const newCust: CustomerSimEntity = {
      id: custId,
      type,
      name: typeName,
      color: colorHex,
      hours,
      pricePerHour,
      position: spawnPos.clone(),
      targetStationId: targetPC ? targetPC.id : null,
      state: targetPC ? 'walking' : 'waiting',
      mesh: customerGroup,
      bodyLimbs: limbs,
      mixer: limbs.mixer,
      actions: limbs.actions,
      outfitName,
      outfitDetails,
      waitTimeSeconds: 0,
      needsFoodOrDrink: false,
      foodRequestTimer: 18 + Math.random() * 25,
      orderedItemName: 'Mì tôm & Nước ngọt',
      foodOrderPrice: 15000,
      ...initSat,
    };

    if (targetPC) {
      targetPC.isOccupied = true;
      targetPC.currentCustomerId = custId;
      addLog(`[Cửa] 1 ${typeName} bước vào & chọn ${targetPC.name} (${initSat.emoji} ${initSat.finalScore}đ)`);
    } else {
      const currentWaitingCount = customersRef.current.filter(c => c.state === 'waiting').length;
      if (currentWaitingCount < waitingQueueSlotsRef.current.length) {
        newCust.state = 'waiting';
        newCust.queueSlotIndex = currentWaitingCount;
        const waitingSlot = waitingQueueSlotsRef.current[currentWaitingCount];
        customerGroup.position.copy(waitingSlot);
        customerGroup.rotation.set(0, Math.PI / 2, 0);
        animateCustomerLimbs(newCust, 0, 'waiting');

        addLog(`[Hàng Đợi] Hết máy! 1 ${typeName} vào ghế chờ (${initSat.emoji} 70đ)`);
        triggerPopup('Vào hàng đợi...', waitingSlot, '#f59e0b');
      } else {
        newCust.state = 'leaving';
        addLog(`[Cửa] Quán & hàng đợi đã đầy! 1 ${typeName} quay lưng bước ra cửa (😡)`);
        triggerPopup('Quán đầy rồi! 😡', spawnPos, '#f43f5e');
        if (newCust.mesh) {
          newCust.mesh.lookAt(0, 0, 4.8);
        }
        animateCustomerLimbs(newCust, 0, 'leaving');
      }
    }

    customersRef.current.push(newCust);
    syncToParent();
  }, [addLog, triggerPopup, syncToParent]);

  // Environment Toggles (Updates customer scores immediately)
  const updateEnvironment = (type: 'internet' | 'ac' | 'food' | 'price') => {
    let nextInternet = internetPlan;
    let nextAc = acEnabled;
    let nextFood = foodService;
    let nextPrice = pricingPolicy;

    if (type === 'internet') {
      nextInternet = internetPlan === 'gigabit' ? 'normal' : internetPlan === 'normal' ? 'laggy' : 'gigabit';
      setInternetPlan(nextInternet);
      triggerPopup(
        nextInternet === 'gigabit' ? 'Mạng 1Gbps: +10đ' : nextInternet === 'normal' ? 'Mạng Thường: +5đ' : 'Mạng Lag: -15đ!',
        playerPosRef.current,
        nextInternet === 'laggy' ? '#f43f5e' : '#38bdf8'
      );
    } else if (type === 'ac') {
      nextAc = !acEnabled;
      setAcEnabled(nextAc);
      triggerPopup(nextAc ? 'Bật điều hòa 22°C: +8đ' : 'Tắt điều hòa (Nóng): -10đ', playerPosRef.current, nextAc ? '#14b8a6' : '#f43f5e');
    } else if (type === 'food') {
      nextFood = !foodService;
      setFoodService(nextFood);
      triggerPopup(nextFood ? 'Phục vụ đồ ăn/nước: +10đ' : 'Ngừng phục vụ đồ ăn: 0đ', playerPosRef.current, '#f59e0b');
    } else if (type === 'price') {
      nextPrice = pricingPolicy === 'standard' ? 'cheap' : pricingPolicy === 'cheap' ? 'expensive' : 'standard';
      setPricingPolicy(nextPrice);
      triggerPopup(
        nextPrice === 'cheap' ? 'Giá Rẻ: +10đ' : nextPrice === 'standard' ? 'Giá Chuẩn: +5đ' : 'Giá Đắt: -10đ',
        playerPosRef.current,
        nextPrice === 'expensive' ? '#f43f5e' : '#10b981'
      );
    }

    // Recalculate all active customers with new values
    for (const cust of customersRef.current) {
      const pc = stationsRef.current.find(s => s.id === cust.targetStationId) || null;
      const sat = calculateSatisfactionCore(pc, cust.waitTimeSeconds, nextInternet, nextAc, nextFood, nextPrice);
      Object.assign(cust, sat);
    }
    syncToParent();
  };

  // Upgrade handler (Requires isCarryingPCBox == true)
  const handleUpgrade = (component: 'monitor' | 'gpu' | 'ram') => {
    if (!selectedUpgradeStation) return;
    const st = stationsRef.current.find(s => s.id === selectedUpgradeStation.id);
    if (!st) return;

    if (!isCarryingPCBoxRef.current) {
      addLog('Không thể nâng cấp! Cần qua đường đến Cửa Hàng PC Hardware mua hộp linh kiện trước.', 'error');
      triggerPopup('Cần mua linh kiện ở shop đối diện! 📦', playerPosRef.current, '#ef4444');
      soundController.playPowerSwitch(false);
      return;
    }

    let currentLvl = 1;

    if (component === 'monitor') {
      currentLvl = st.monitorLevel;
      if (currentLvl >= 5) {
        addLog('Màn hình đã đạt cấp tối đa (MAX)!', 'info');
        return;
      }
      st.monitorLevel++;
      if (st.monitorFrameMesh) {
        const scaleX = 1.0 + (st.monitorLevel - 1) * 0.18;
        st.monitorFrameMesh.scale.set(scaleX, 1, 1);
      }
      if (st.screenMesh) {
        const scaleX = 1.0 + (st.monitorLevel - 1) * 0.18;
        st.screenMesh.scale.set(scaleX, 1, 1);
      }
    } else if (component === 'gpu') {
      currentLvl = st.gpuLevel;
      if (currentLvl >= 5) {
        addLog('Card đồ họa đã đạt cấp tối đa (MAX)!', 'info');
        return;
      }
      st.gpuLevel++;
      if (st.pcCaseLedMesh) {
        const ledMat = st.pcCaseLedMesh.material as THREE.MeshStandardMaterial;
        if (ledMat) {
          const colors = [0x06b6d4, 0x3b82f6, 0xa855f7, 0xec4899, 0xf59e0b];
          ledMat.emissive = new THREE.Color(colors[st.gpuLevel - 1]);
          ledMat.emissiveIntensity = 2.5;
        }
      }
    } else if (component === 'ram') {
      currentLvl = st.ramLevel;
      if (currentLvl >= 5) {
        addLog('RAM đã đạt cấp tối đa (MAX)!', 'info');
        return;
      }
      st.ramLevel++;
    }

    soundController.playPowerSwitch(true);

    const qualityPoints = st.ramLevel * 2 + st.gpuLevel * 3 + st.monitorLevel * 2;
    triggerPopup(`Nâng cấp! Chất lượng máy: +${qualityPoints}đ 🎉`, st.position, '#38bdf8');
    addLog(`Đã nâng cấp ${component.toUpperCase()} cho ${st.name}! Điểm máy: +${qualityPoints}đ`);

    const currentCust = customersRef.current.find(c => c.targetStationId === st.id);
    if (currentCust) {
      const sat = calculateSatisfactionCore(
        st,
        currentCust.waitTimeSeconds,
        internetPlanRef.current,
        acEnabledRef.current,
        foodServiceRef.current,
        pricingPolicyRef.current
      );
      Object.assign(currentCust, sat);
      triggerPopup(`Hài lòng tăng: ${sat.emoji} ${sat.finalScore}đ`, st.position, '#10b981');
    }

    isCarryingPCBoxRef.current = false;
    setIsCarryingPCBox(false);
    addLog('Nâng cấp máy tính thành công!', 'success');
    setSelectedUpgradeStation({ ...st });
    syncToParent();
  };

  // F&B Food & Beverage Delivery System Interaction Handler ([E] Key / Click)
  const handleInteract = () => {
    const currentInteraction = activeInteractionRef.current;
    if (!currentInteraction) return;

    if (currentInteraction.type === 'fridge') {
      if (!isCarryingFoodRef.current) {
        setIsCarryingFood(true);
        isCarryingFoodRef.current = true;
        soundController.playCashChime();
        triggerPopup('Chuẩn bị khay Đồ Ăn/Uống! 🍜🥤', playerPosRef.current, '#38bdf8');
        addLog('[Tủ Mát] Đã chuẩn bị đồ ăn & nước ngọt! Sẵn sàng phục vụ.');
      }
    } else if (currentInteraction.type === 'serve') {
      if (isCarryingFoodRef.current) {
        setIsCarryingFood(false);
        isCarryingFoodRef.current = false;

        const cust = customersRef.current.find(c => c.id === currentInteraction.customerId);
        const st = stationsRef.current.find(s => s.id === currentInteraction.stationId);

        if (cust) {
          cust.needsFoodOrDrink = false;
          cust.foodRequestTimer = 25 + Math.random() * 20; // reset food timer
          cust.foodBonus = (cust.foodBonus || 0) + 5;
          cust.finalScore = Math.min(100, cust.finalScore + 5);

          if (cust.finalScore >= 80) {
            cust.tier = 'VeryHappy'; cust.emoji = '😍'; cust.stars = 5; cust.tierLabel = 'Very Happy';
          } else if (cust.finalScore >= 60) {
            cust.tier = 'Happy'; cust.emoji = '🙂'; cust.stars = 4; cust.tierLabel = 'Happy';
          }
        }

        // Economy & Game Loop resolution:
        // Automatically add +15.000 VNĐ to MONEYMANAGER total funds
        setTotalMoney(m => m + 15000);
        if (onMoneyEarnedRef.current) onMoneyEarnedRef.current(15000);

        // Add +5 to Customer Satisfaction score
        // Log to console: "[Máy {ID}] Phục vụ thành công! Thu +15.000đ"
        addLog(`[${currentInteraction.stationName}] Phục vụ thành công! Thu +15.000đ`);
        triggerPopup(`[${currentInteraction.stationName}] Phục vụ thành công! Thu +15.000đ (+5đ hài lòng) 🍜🥤`, st ? st.position : playerPosRef.current, '#10b981');
        soundController.playCashChime();
        syncToParent();
      }
    } else if (currentInteraction.type === 'pickup_furniture') {
      handlePickupFurniture(currentInteraction.instanceId);
    } else if (currentInteraction.type === 'hardware_store') {
      // 2. Hardware Store UI & Backpack System:
      // Shop UI: When the player presses [E] at the Hardware store counter, open a 2D Shop Menu
      setIsHardwareShopOpen(true);
      soundController.playCashChime();
      addLog('Đã mở Cửa Hàng PC HARDWARE & UPGRADES (7 Danh Mục x 5 Tiers).', 'info');
    } else if (currentInteraction.type === 'station_upgrade') {
      const st = stationsRef.current.find(s => s.id === currentInteraction.stationId);
      if (!st) return;

      if (!isCarryingPCBoxRef.current) {
        addLog('Không thể nâng cấp! Cần qua đường đến Cửa Hàng PC Hardware mua hộp linh kiện trước.', 'error');
        triggerPopup('Cần mua linh kiện ở shop đối diện! 📦', playerPosRef.current, '#ef4444');
        soundController.playPowerSwitch(false);
        return;
      }

      // Player approaches PC desk with isCarryingPCBox == true and presses [E] to upgrade it!
      let compToUpgrade: 'gpu' | 'monitor' | 'ram' = 'gpu';
      if (st.gpuLevel <= st.monitorLevel && st.gpuLevel <= st.ramLevel && st.gpuLevel < 5) {
        compToUpgrade = 'gpu';
      } else if (st.monitorLevel <= st.ramLevel && st.monitorLevel < 5) {
        compToUpgrade = 'monitor';
      } else if (st.ramLevel < 5) {
        compToUpgrade = 'ram';
      } else if (st.gpuLevel < 5) {
        compToUpgrade = 'gpu';
      } else if (st.monitorLevel < 5) {
        compToUpgrade = 'monitor';
      }

      if (st.gpuLevel >= 5 && st.monitorLevel >= 5 && st.ramLevel >= 5) {
        addLog(`${st.name} đã đạt cấu hình tối đa (MAX) cho tất cả linh kiện!`, 'info');
        triggerPopup(`${st.name} đã MAX cấu hình! ⭐`, st.position, '#f59e0b');
        return;
      }

      if (compToUpgrade === 'gpu') {
        st.gpuLevel++;
        if (st.pcCaseLedMesh) {
          const ledMat = st.pcCaseLedMesh.material as THREE.MeshStandardMaterial;
          if (ledMat) {
            const colors = [0x06b6d4, 0x3b82f6, 0xa855f7, 0xec4899, 0xf59e0b];
            ledMat.emissive = new THREE.Color(colors[st.gpuLevel - 1]);
            ledMat.emissiveIntensity = 2.5;
          }
        }
      } else if (compToUpgrade === 'monitor') {
        st.monitorLevel++;
        if (st.monitorFrameMesh) {
          const scaleX = 1.0 + (st.monitorLevel - 1) * 0.18;
          st.monitorFrameMesh.scale.set(scaleX, 1, 1);
        }
        if (st.screenMesh) {
          const scaleX = 1.0 + (st.monitorLevel - 1) * 0.18;
          st.screenMesh.scale.set(scaleX, 1, 1);
        }
      } else {
        st.ramLevel++;
      }

      soundController.playPowerSwitch(true);

      const qualityPoints = st.ramLevel * 2 + st.gpuLevel * 3 + st.monitorLevel * 2;
      triggerPopup(`Nâng cấp! Chất lượng máy: +${qualityPoints}đ 🎉`, st.position, '#38bdf8');
      addLog(`Đã nâng cấp ${compToUpgrade.toUpperCase()} cho ${st.name}! Điểm máy: +${qualityPoints}đ`);

      const currentCust = customersRef.current.find(c => c.targetStationId === st.id);
      if (currentCust) {
        const sat = calculateSatisfactionCore(
          st,
          currentCust.waitTimeSeconds,
          internetPlanRef.current,
          acEnabledRef.current,
          foodServiceRef.current,
          pricingPolicyRef.current
        );
        Object.assign(currentCust, sat);
        triggerPopup(`Hài lòng tăng: ${sat.emoji} ${sat.finalScore}đ`, st.position, '#10b981');
      }

      isCarryingPCBoxRef.current = false;
      setIsCarryingPCBox(false);
      addLog('Nâng cấp máy tính thành công!', 'success');
      triggerPopup('Nâng cấp máy tính thành công! 🚀', playerPosRef.current, '#10b981');
      syncToParent();
    } else if (currentInteraction.type === 'property_purchase') {
      const prop = propertiesRef.current.find(p => p.id === currentInteraction.propertyId);
      if (!prop || prop.isPurchased) return;

      const currentFunds = totalMoneyRef.current;
      if (currentFunds < 5000000) {
        // Condition Check: Check existing MONEYMANAGER script. If totalFunds < 5000000, show a red warning in bottom-left console
        addLog('Không đủ tiền! Cần 5.000.000 VNĐ để mua mặt bằng.', 'error');
        triggerPopup('Không đủ tiền! Cần 5.000.000 VNĐ', playerPosRef.current, '#ef4444');
        soundController.playPowerSwitch(false);
      } else {
        // Success State: If totalFunds >= 5000000, deduct exactly 5,000,000 VNĐ
        setTotalMoney(m => m - 5000000);
        if (onMoneyEarnedRef.current) onMoneyEarnedRef.current(-5000000);

        // Unlocking the Property:
        prop.isPurchased = true;

        // 1. Destroy or disable the 'FOR SALE' sign
        if (prop.signGroup) {
          prop.signGroup.visible = false;
        }

        // 2. Disable the invisible wall/locked door collider so player can walk inside
        collidersRef.current = collidersRef.current.filter(c => c.name !== prop.lockedColliderName);

        // 3. Open door (swing 90 degrees)
        if (prop.doorPivot) {
          prop.doorPivot.rotation.y = -Math.PI / 2;
        }

        // 4. Turn on the interior lights of the newly purchased building
        if (prop.interiorLights) {
          prop.interiorLights.forEach(l => {
            l.intensity = 1.3;
            l.visible = true;
          });
        }

        // 5. Log a green success message in the bottom-left queue console
        addLog('Chúc mừng! Đã mở khóa mặt bằng mới.', 'success');
        triggerPopup('Chúc mừng! Đã mở khóa mặt bằng mới! 🎉', playerPosRef.current, '#10b981');
        soundController.playCashChime();
        syncToParent();
      }
    } else if (currentInteraction.type === 'vip_door') {
      const nextOpen = !isVipDoorOpenRef.current;
      isVipDoorOpenRef.current = nextOpen;
      setIsVipDoorOpen(nextOpen);
      soundController.playPowerSwitch(nextOpen);
      if (nextOpen) {
        addLog('🚪 [VIP ZONE] Đã đẩy mở cửa phòng VIP (10 PCs Đấu Giải).', 'success');
        triggerPopup('🚪 Đã mở cửa VIP ZONE!', playerPosRef.current, '#f59e0b');
      } else {
        addLog('🚪 [VIP ZONE] Đã đóng cửa phòng VIP.');
        triggerPopup('🚪 Đã đóng cửa phòng VIP', playerPosRef.current, '#94a3b8');
      }
      const updatedInteraction: ActiveInteractionType = {
        type: 'vip_door',
        text: nextOpen ? `[${configRef.current.interactKey}] Đóng cửa phòng VIP` : `[${configRef.current.interactKey}] Đẩy cửa phòng VIP`,
        subText: 'Phòng VIP Cyber Gaming • 10 Máy Đấu Giải Đỉnh Cao',
      };
      activeInteractionRef.current = updatedInteraction;
      setActiveInteraction(updatedInteraction);
      syncToParent();
    }
  };

  // THREE.JS SCENE INITIALIZATION (Strictly empty dependency array [])
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    scene.fog = new THREE.Fog(0x111827, 18, 48);
    sceneRef.current = scene;

    // Wide-angle panoramic perspective camera (FOV 72) with optimized depth buffer precision (camera.near = 0.05)
    const camera = new THREE.PerspectiveCamera(72, width / height, 0.05, 50);
    camera.near = 0.05;
    camera.far = 50;
    camera.updateProjectionMatrix();
    camera.position.copy(playerPosRef.current);
    cameraRef.current = camera;

    // First-Person Food & Beverage Holding Tray (attached to camera)
    const carryingTrayGroup = new THREE.Group();
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.25 });
    const trayMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.22), trayMat);
    carryingTrayGroup.add(trayMesh);

    // Instant noodle cup (Hảo Hảo pink/red bowl)
    const bowlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.075, 16), new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.4 }));
    bowlMesh.position.set(-0.07, 0.045, 0);
    carryingTrayGroup.add(bowlMesh);

    // Soda can (Sting Dâu Red)
    const canMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 }));
    canMesh.position.set(0.075, 0.065, 0);
    carryingTrayGroup.add(canMesh);

    carryingTrayGroup.position.set(0.18, -0.22, -0.42);
    carryingTrayGroup.rotation.set(0.15, -0.12, 0.05);
    carryingTrayGroup.visible = false;
    carryingTrayMeshRef.current = carryingTrayGroup;
    camera.add(carryingTrayGroup);

    // First-Person PC Hardware Parts Box (attached to camera for visual carry & deliver feedback)
    const carryingPCBoxGroup = new THREE.Group();
    const pcBoxBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.26, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xb58957, roughness: 0.85, metalness: 0.05 })
    );
    carryingPCBoxGroup.add(pcBoxBody);

    // Box brown packing tape
    const pcBoxTape = new THREE.Mesh(
      new THREE.BoxGeometry(0.385, 0.035, 0.285),
      new THREE.MeshStandardMaterial({ color: 0x85582a, roughness: 0.7 })
    );
    pcBoxTape.position.set(0, 0.125, 0);
    carryingPCBoxGroup.add(pcBoxTape);

    // Neon graphics card brand label sticker
    const pcBoxSticker = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.15),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    pcBoxSticker.position.set(0, 0.02, 0.142);
    carryingPCBoxGroup.add(pcBoxSticker);

    carryingPCBoxGroup.position.set(0.18, -0.24, -0.42);
    carryingPCBoxGroup.rotation.set(0.12, -0.15, 0.08);
    carryingPCBoxGroup.visible = false;
    carryingPCBoxMeshRef.current = carryingPCBoxGroup;
    camera.add(carryingPCBoxGroup);

    scene.add(camera);

    // Unity HDRP Style Renderer Settings (Optimized for Web Performance & Low Memory)
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'default',
      precision: 'mediump',
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    // Disable expensive shadow maps to prevent GPU stalls and browser crash
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- CINEMATIC ATMOSPHERIC LIGHTING ---
    // 1. Global Ambient Light (dark grey/blueish, intensity: 0.9)
    const globalAmbient = new THREE.AmbientLight(0x788ba3, 0.9);
    scene.add(globalAmbient);

    // 2. ONE Single Main Directional Light for the entire scene (Optimal 60 FPS performance)
    const mainDirLight = new THREE.DirectionalLight(0xdfe7f2, 0.95);
    mainDirLight.position.set(3, 10, 2);
    mainDirLight.target.position.set(0, 0, 0);
    mainDirLight.castShadow = false; // Prevent heavy shadow map recalculations
    scene.add(mainDirLight);
    scene.add(mainDirLight.target);

    // 3. Subtle Hemisphere Light for environmental fill
    const hemiLight = new THREE.HemisphereLight(0x8fa3bf, 0x334155, 0.45);
    scene.add(hemiLight);

    // Parallel Dual Neon Ceiling Strips (Straight down the central aisle)
    // Left: Electric Cyan/Blue neon strip (MeshBasicMaterial is self-luminous with ZERO dynamic light overhead)
    const neonBlueGeo = new THREE.CylinderGeometry(0.03, 0.03, 10.5, 12);
    const neonBlueMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonBlueStrip = new THREE.Mesh(neonBlueGeo, neonBlueMat);
    neonBlueStrip.rotation.x = Math.PI / 2;
    neonBlueStrip.position.set(-0.6, 3.65, -0.25);
    scene.add(neonBlueStrip);

    // Right: Ultraviolet Purple/Magenta neon strip
    const neonPurpleGeo = new THREE.CylinderGeometry(0.03, 0.03, 10.5, 12);
    const neonPurpleMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
    const neonPurpleStrip = new THREE.Mesh(neonPurpleGeo, neonPurpleMat);
    neonPurpleStrip.rotation.x = Math.PI / 2;
    neonPurpleStrip.position.set(0.6, 3.65, -0.25);
    scene.add(neonPurpleStrip);

    // --- REALISTIC POLISHED TILED / EPOXY GAMING FLOOR (Visible dark-grey PBR) ---
    const createFloorCanvasTexture = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 1024;
      const ctx = c.getContext('2d');
      if (ctx) {
        // Dark polished charcoal base tile (NOT pure black)
        ctx.fillStyle = '#222b38';
        ctx.fillRect(0, 0, 1024, 1024);

        // Large 4x4 tile grid with distinct slate/charcoal tones & subtle wear
        const tileSize = 256;
        for (let tx = 0; tx < 1024; tx += tileSize) {
          for (let ty = 0; ty < 1024; ty += tileSize) {
            const isAlt = ((tx / tileSize + ty / tileSize) % 2 === 0);
            ctx.fillStyle = isAlt ? '#273242' : '#2f3b4e';
            ctx.fillRect(tx + 2, ty + 2, tileSize - 4, tileSize - 4);

            // Subtle epoxy sheen gradient
            const grad = ctx.createLinearGradient(tx, ty, tx + tileSize, ty + tileSize);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
            ctx.fillStyle = grad;
            ctx.fillRect(tx + 3, ty + 3, tileSize - 6, tileSize - 6);

            // Subtle inner tile bevel highlight
            ctx.strokeStyle = '#3e4d66';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx + 4, ty + 4, tileSize - 8, tileSize - 8);

            // Grout lines (Crisp dark seams)
            ctx.strokeStyle = '#151c26';
            ctx.lineWidth = 4;
            ctx.strokeRect(tx, ty, tileSize, tileSize);

            // Natural wear & fine scuff marks
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tx + 30, ty + 45);
            ctx.lineTo(tx + 85, ty + 65);
            ctx.moveTo(tx + 120, ty + 160);
            ctx.lineTo(tx + 175, ty + 180);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.moveTo(tx + 50, ty + 110);
            ctx.lineTo(tx + 110, ty + 130);
            ctx.stroke();
          }
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 4);
      return tex;
    };

    const floorTex = createFloorCanvasTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.24,
      metalness: 0.22,
      color: 0xffffff,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -0.5);
    scene.add(floor);

    // Cable Management Covers / Wire Paths (Nẹp dây điện sàn) running parallel to desks
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x222a38, roughness: 0.6, metalness: 0.2 });
    const cableCoverL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.024, 11), cableMat);
    cableCoverL.position.set(-1.35, 0.012, -0.5);
    scene.add(cableCoverL);

    const cableCoverR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.024, 11), cableMat);
    cableCoverR.position.set(1.35, 0.012, -0.5);
    scene.add(cableCoverR);

    // Lateral branch wire covers under desks
    for (const bz of [-2.4, -0.5, 1.4]) {
      const branchL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.08), cableMat);
      branchL.position.set(-1.75, 0.01, bz);
      scene.add(branchL);

      const branchR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.08), cableMat);
      branchR.position.set(1.75, 0.01, bz);
      scene.add(branchR);
    }

    // --- INDUSTRIAL DARK CEILING & ARCHITECTURE ---
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e2736, roughness: 0.8 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.8, -0.5);
    scene.add(ceiling);

    // Exposed structural steel I-beams running across ceiling
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.4 });
    const beamPositionsZ = [-4.8, -2.5, 0.0, 2.5, 4.8];
    for (const bz of beamPositionsZ) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.18, 0.22), beamMat);
      beam.position.set(0, 3.71, bz);
      scene.add(beam);
    }

    // Exposed longitudinal industrial ventilation pipes / spiral ducts
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.28 });
    const ductL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 12, 16), ductMat);
    ductL.rotation.x = Math.PI / 2;
    ductL.position.set(-1.6, 3.45, -0.5);
    scene.add(ductL);

    const ductR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 12, 16), ductMat);
    ductR.rotation.x = Math.PI / 2;
    ductR.position.set(1.6, 3.45, -0.5);
    scene.add(ductR);

    // AC Units (Commercial suspended ceiling units)
    const acMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.5 });
    const acLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    [-1.8, 1.8].forEach(acX => {
      const acUnit = new THREE.Group();
      acUnit.position.set(acX, 3.48, -0.5);

      const acBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.7), acMat);
      acUnit.add(acBody);

      const acGrill = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.5), new THREE.MeshStandardMaterial({ color: 0x090d16 }));
      acGrill.position.set(0, -0.12, 0);
      acUnit.add(acGrill);

      const acLed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), acLedMat);
      acLed.position.set(0.5, -0.1, 0.3);
      acUnit.add(acLed);

      scene.add(acUnit);
    });

    // Spinning Industrial Ceiling Fans along Central Aisle
    const ceilingFansList: THREE.Group[] = [];
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x222a38, metalness: 0.8, roughness: 0.3 });
    [-2.8, 0.0, 2.8].forEach(fz => {
      const fanGroup = new THREE.Group();
      fanGroup.position.set(0, 3.52, fz);

      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), fanMat);
      rod.position.set(0, 0.15, 0);
      fanGroup.add(rod);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), fanMat);
      fanGroup.add(hub);

      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.015, 0.14), fanMat);
        blade.position.set(0.48, 0, 0);
        blade.rotation.x = 0.12;
        const bladeArm = new THREE.Group();
        bladeArm.rotation.y = (b * Math.PI) / 2;
        bladeArm.add(blade);
        fanGroup.add(bladeArm);
      }

      scene.add(fanGroup);
      ceilingFansList.push(fanGroup);
    });

    // --- LEFT WALL: ACOUSTIC SOUNDPROOFING PANELS & VERTICAL NEON STRIPS ---
    const leftWallGroup = new THREE.Group();
    leftWallGroup.position.set(-4.18, 1.9, -0.5);

    // Visible dark-grey acoustic soundproofing base wall texture
    const createAcousticWallTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#262f3f';
        ctx.fillRect(0, 0, 512, 512);

        // Acoustic dampening micro-perforations
        ctx.fillStyle = '#1c2432';
        for (let x = 0; x < 512; x += 16) {
          for (let y = 0; y < 512; y += 16) {
            ctx.beginPath();
            ctx.arc(x + 8, y + 8, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Vertical acoustic fabric seams
        ctx.strokeStyle = '#18202d';
        ctx.lineWidth = 2;
        for (let x = 0; x < 512; x += 128) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 512);
          ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 2);
      return tex;
    };

    const acousticWallTex = createAcousticWallTexture();
    const wallAcousticMat = new THREE.MeshStandardMaterial({
      map: acousticWallTex,
      color: 0xffffff,
      roughness: 0.75,
      side: THREE.DoubleSide,
    });
    const leftWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.2), wallAcousticMat);
    leftWallMesh.rotation.y = Math.PI / 2;
    leftWallGroup.add(leftWallMesh);

    // Vertical slatted acoustic soundproofing panels & Inset vertical neon strips
    const slatMat = new THREE.MeshStandardMaterial({ color: 0x333f54, roughness: 0.65 });
    const neonVerticalColors = [0x00f0ff, 0xd946ef, 0x00f0ff, 0xd946ef, 0x00f0ff];

    for (let pIdx = 0; pIdx < 5; pIdx++) {
      const pZ = -4.2 + pIdx * 2.1;

      // Acoustic slatted panel box
      const panelMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.4, 1.6), slatMat);
      panelMesh.position.set(0.03, 0, pZ);
      leftWallGroup.add(panelMesh);

      // Inset vertical LED strip light between panels (Emissive/Basic styling, zero dynamic light)
      const vNeonMat = new THREE.MeshBasicMaterial({ color: neonVerticalColors[pIdx] });
      const vNeonMesh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.2, 0.04), vNeonMat);
      vNeonMesh.position.set(0.07, 0, pZ + 0.95);
      leftWallGroup.add(vNeonMesh);
    }

    // Industrial Conduits & Electrical Wall Boxes on Left Wall
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.3 });
    const conduitL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 14, 8), conduitMat);
    conduitL1.rotation.x = Math.PI / 2;
    conduitL1.position.set(0.06, -0.65, 0);
    leftWallGroup.add(conduitL1);

    const conduitL2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 14, 8), conduitMat);
    conduitL2.rotation.x = Math.PI / 2;
    conduitL2.position.set(0.06, 0.25, 0);
    leftWallGroup.add(conduitL2);

    // Wall-mounted double electrical sockets & light switches
    const outletMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    [-2.2, 0.5, 3.0].forEach(oz => {
      const outletBox = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.14), outletMat);
      outletBox.position.set(0.07, -0.65, oz);
      leftWallGroup.add(outletBox);

      // Small vertical conduit drop
      const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), conduitMat);
      drop.position.set(0.06, -0.9, oz);
      leftWallGroup.add(drop);
    });

    scene.add(leftWallGroup);

    // --- FRAMED ESPORTS POSTERS ON LEFT WALL (League of Legends, Valorant, etc.) ---
    const createEsportsPoster = (
      game: 'lol' | 'lol2' | 'valorant' | 'csgo',
      pos: THREE.Vector3
    ) => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 384;
      pCanvas.height = 512;
      const ctx = pCanvas.getContext('2d');
      if (ctx) {
        if (game === 'lol') {
          // League of Legends poster (Akali / KDA dark blue & gold theme)
          ctx.fillStyle = '#091428';
          ctx.fillRect(0, 0, 384, 512);

          // Golden crest border
          ctx.strokeStyle = '#c89b3c';
          ctx.lineWidth = 8;
          ctx.strokeRect(12, 12, 360, 488);

          // Mystic champion art background
          const grad = ctx.createLinearGradient(0, 0, 384, 512);
          grad.addColorStop(0, '#0a323c');
          grad.addColorStop(0.5, '#005a82');
          grad.addColorStop(1, '#091428');
          ctx.fillStyle = grad;
          ctx.fillRect(24, 24, 336, 464);

          // Champion silhouette / stylized emblem
          ctx.fillStyle = '#c8aa6e';
          ctx.beginPath();
          ctx.arc(192, 190, 75, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#091428';
          ctx.font = 'black 54px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('L', 192, 210);

          ctx.fillStyle = '#f0e6d2';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('LEAGUE OF', 192, 320);
          ctx.fillStyle = '#c89b3c';
          ctx.font = 'bold 32px sans-serif';
          ctx.fillText('LEGENDS', 192, 360);

          ctx.fillStyle = '#0ac8b9';
          ctx.font = 'bold 15px monospace';
          ctx.fillText('WORLDS CHAMPIONSHIP', 192, 420);
        } else if (game === 'lol2') {
          // Action Esports Champion poster
          ctx.fillStyle = '#0b0e1b';
          ctx.fillRect(0, 0, 384, 512);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 6;
          ctx.strokeRect(10, 10, 364, 492);

          ctx.fillStyle = '#0284c7';
          ctx.fillRect(20, 20, 344, 280);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('T1 FAKER', 192, 160);
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('4X WORLD CHAMPION', 192, 200);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText('IMMORTAL DEMON KING', 192, 360);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '16px monospace';
          ctx.fillText('ESPORTS HALL OF FAME', 192, 410);
        } else if (game === 'valorant') {
          // Valorant Poster (Red & Dark Violet theme)
          ctx.fillStyle = '#0f141f';
          ctx.fillRect(0, 0, 384, 512);

          ctx.fillStyle = '#ff4655';
          ctx.fillRect(0, 0, 384, 90);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'black 42px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('VALORANT', 192, 62);

          // Agent artwork area
          ctx.fillStyle = '#1f2738';
          ctx.fillRect(24, 110, 336, 250);

          ctx.fillStyle = '#ff4655';
          ctx.beginPath();
          ctx.moveTo(192, 130);
          ctx.lineTo(260, 280);
          ctx.lineTo(124, 280);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ece8e1';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('DEFY THE LIMITS', 192, 400);

          ctx.fillStyle = '#ff4655';
          ctx.font = 'bold 16px monospace';
          ctx.fillText('VCT PACIFIC LEAGUE', 192, 445);
        } else {
          // CS:GO Major poster
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, 0, 384, 512);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 6;
          ctx.strokeRect(10, 10, 364, 492);

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('COUNTER-STRIKE', 192, 70);

          ctx.fillStyle = '#374151';
          ctx.fillRect(24, 110, 336, 250);
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 48px sans-serif';
          ctx.fillText('MAJOR', 192, 250);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('GLOBAL ESPORTS TOUR', 192, 410);
        }
      }
      const pTex = new THREE.CanvasTexture(pCanvas);
      const posterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.15, 1.55),
        new THREE.MeshBasicMaterial({
          map: pTex,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        })
      );
      posterMesh.position.set(pos.x, pos.y, pos.z);
      posterMesh.rotation.y = Math.PI / 2;

      // Heavy dark acrylic outer frame with distinct depth offset
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 1.62, 1.22),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 })
      );
      frameMesh.position.set(pos.x - 0.04, pos.y, pos.z);

      // Spotlight fixture mounted above poster
      const spotHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.045, 0.14, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
      );
      spotHousing.position.set(pos.x + 0.16, pos.y + 0.95, pos.z);
      spotHousing.rotation.z = Math.PI / 4;
      scene.add(spotHousing);

      scene.add(frameMesh);
      scene.add(posterMesh);
    };

    // Hang Large Framed Esports Posters on Left Wall with physical offset from wall
    createEsportsPoster('lol', new THREE.Vector3(-4.05, 2.25, 0.6));
    createEsportsPoster('lol2', new THREE.Vector3(-4.05, 2.25, -1.0));
    createEsportsPoster('valorant', new THREE.Vector3(-4.05, 2.25, -2.6));
    createEsportsPoster('csgo', new THREE.Vector3(-4.05, 2.25, -4.2));

    // --- 'HÀNG ĐỢI (WAITING)' ZONE ON LEFT WALL IN FOREGROUND ---
    // 1. Illuminated Wall Signboard: "HÀNG ĐỢI (WAITING)"
    const waitingSignCanvas = document.createElement('canvas');
    waitingSignCanvas.width = 512;
    waitingSignCanvas.height = 140;
    const wsCtx = waitingSignCanvas.getContext('2d');
    if (wsCtx) {
      wsCtx.fillStyle = '#0a1324';
      wsCtx.fillRect(0, 0, 512, 140);

      // Glowing gold/cyan border
      wsCtx.strokeStyle = '#00f0ff';
      wsCtx.lineWidth = 6;
      wsCtx.strokeRect(6, 6, 500, 128);

      wsCtx.fillStyle = '#f59e0b';
      wsCtx.font = 'bold 38px sans-serif';
      wsCtx.textAlign = 'center';
      wsCtx.fillText('HÀNG ĐỢI (WAITING)', 256, 82);
    }
    const waitingSignTex = new THREE.CanvasTexture(waitingSignCanvas);
    const waitingSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.44),
      new THREE.MeshBasicMaterial({
        map: waitingSignTex,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );
    waitingSignMesh.position.set(-4.05, 1.85, 3.1);
    waitingSignMesh.rotation.y = Math.PI / 2;
    scene.add(waitingSignMesh);

    const waitingSignBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.50, 1.66),
      new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.85 })
    );
    waitingSignBox.position.set(-4.10, 1.85, 3.1);
    scene.add(waitingSignBox);

    // Small framed team photo / queue guidelines next to signboard
    const photoCanvas = document.createElement('canvas');
    photoCanvas.width = 128;
    photoCanvas.height = 140;
    const phCtx = photoCanvas.getContext('2d');
    if (phCtx) {
      phCtx.fillStyle = '#1e293b';
      phCtx.fillRect(0, 0, 128, 140);
      phCtx.fillStyle = '#f59e0b';
      phCtx.font = 'bold 16px sans-serif';
      phCtx.textAlign = 'center';
      phCtx.fillText('VIP QUEUE', 64, 40);
      phCtx.fillStyle = '#38bdf8';
      phCtx.fillText('1-6 SLOTS', 64, 80);
    }
    const photoTex = new THREE.CanvasTexture(photoCanvas);
    const photoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.44),
      new THREE.MeshBasicMaterial({
        map: photoTex,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );
    photoMesh.position.set(-4.05, 1.85, 4.25);
    photoMesh.rotation.y = Math.PI / 2;
    scene.add(photoMesh);

    // 2. Connected Dark Metallic/Plastic Waiting Chairs with Chrome Frame
    const waitingChairsGroup = new THREE.Group();
    waitingChairsGroup.position.set(-3.55, 0, 3.2);

    // Long horizontal chrome support beam
    const chromeBeamMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    const chairBeam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.1), chromeBeamMat);
    chairBeam.position.set(0, 0.38, 0);
    waitingChairsGroup.add(chairBeam);

    // Two Chrome Steel Upright Legs with Floor Footings
    [-0.8, 0.8].forEach(legZ => {
      const legPost = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 8), chromeBeamMat);
      legPost.position.set(0, 0.19, legZ);
      waitingChairsGroup.add(legPost);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.06), chromeBeamMat);
      foot.position.set(0, 0.01, legZ);
      waitingChairsGroup.add(foot);
    });

    // 4 Connected Dark Sculpted Waiting Bucket Seats
    const seatShellMat = new THREE.MeshStandardMaterial({ color: 0x111726, roughness: 0.45, metalness: 0.2 });
    const seatZPositions = [-0.75, -0.25, 0.25, 0.75];
    seatZPositions.forEach(sZ => {
      // Seat cushion (horizontal bucket pan)
      const seatPan = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.40), seatShellMat);
      seatPan.position.set(0, 0.42, sZ);
      waitingChairsGroup.add(seatPan);

      // Backrest (vertical contoured back)
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.40), seatShellMat);
      seatBack.position.set(-0.19, 0.65, sZ);
      seatBack.rotation.z = -0.08;
      waitingChairsGroup.add(seatBack);

      // Chrome side armrest loop
      const armLoop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 16, Math.PI), chromeBeamMat);
      armLoop.rotation.y = Math.PI / 2;
      armLoop.position.set(0, 0.54, sZ + 0.21);
      waitingChairsGroup.add(armLoop);
    });

    scene.add(waitingChairsGroup);

    // --- RIGHT WALL: INDUSTRIAL CONCRETE STRUCTURE, BEAMS & 'NỘI QUY HOẠT ĐỘNG' ---
    const rightWallGroup = new THREE.Group();
    rightWallGroup.position.set(4.18, 1.9, -0.5);

    // Visible concrete industrial base wall texture
    const createConcreteWallTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, 0, 512, 512);

        // Concrete texture variations
        for (let i = 0; i < 400; i++) {
          const rx = (i * 37) % 512;
          const ry = (i * 73) % 512;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
          ctx.beginPath();
          ctx.arc(rx, ry, 3 + (i % 6), 0, Math.PI * 2);
          ctx.fill();
        }

        // Formwork panel seams
        ctx.strokeStyle = '#1e2634';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 512, 256);
        ctx.strokeRect(0, 256, 512, 256);

        // Formwork tie-holes
        [64, 448].forEach(hx => {
          [64, 192, 320, 448].forEach(hy => {
            ctx.fillStyle = '#171e29';
            ctx.beginPath();
            ctx.arc(hx, hy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3e4b5e';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });
        });
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 2);
      return tex;
    };

    const concreteWallTex = createConcreteWallTexture();
    const wallConcreteMat = new THREE.MeshStandardMaterial({
      map: concreteWallTex,
      color: 0xffffff,
      roughness: 0.82,
    });
    const rightWallMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.2), wallConcreteMat);
    rightWallMesh.rotation.y = -Math.PI / 2;
    rightWallGroup.add(rightWallMesh);

    // Structural vertical pillars / steel columns along right wall
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x242e3f, metalness: 0.6, roughness: 0.4 });
    [-4.5, -1.8, 1.2, 4.2].forEach(pZ => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.2, 0.25), pillarMat);
      pillar.position.set(-0.08, 0, pZ);
      rightWallGroup.add(pillar);
    });

    // Silver metal conduit pipes running horizontally along right wall
    const conduitR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 14, 8), conduitMat);
    conduitR1.rotation.x = Math.PI / 2;
    conduitR1.position.set(-0.06, -0.65, 0);
    rightWallGroup.add(conduitR1);

    const conduitR2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 14, 8), conduitMat);
    conduitR2.rotation.x = Math.PI / 2;
    conduitR2.position.set(-0.06, 0.35, 0);
    rightWallGroup.add(conduitR2);

    // Wall-mounted Electrical Breaker Box (Tủ điện kỹ thuật) on right wall
    const breakerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.65, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    );
    breakerBox.position.set(-0.06, 0.2, 1.2);
    rightWallGroup.add(breakerBox);

    // Electrical junction switches
    [-2.8, -0.5, 3.2].forEach(rz => {
      const jBox = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.12), outletMat);
      jBox.position.set(-0.06, -0.65, rz);
      rightWallGroup.add(jBox);
    });

    scene.add(rightWallGroup);

    // Large Framed 'NỘI QUY HOẠT ĐỘNG' (Rules & Regulations) Board (Matching image.png!)
    const ruleCanvas = document.createElement('canvas');
    ruleCanvas.width = 512;
    ruleCanvas.height = 768;
    const rCtx = ruleCanvas.getContext('2d');
    if (rCtx) {
      rCtx.fillStyle = '#080c16';
      rCtx.fillRect(0, 0, 512, 768);

      // Gold ornamental double border
      rCtx.strokeStyle = '#f59e0b';
      rCtx.lineWidth = 8;
      rCtx.strokeRect(14, 14, 484, 740);
      rCtx.lineWidth = 3;
      rCtx.strokeRect(22, 22, 468, 724);

      // Header: NỘI QUY HOẠT ĐỘNG
      rCtx.fillStyle = '#f59e0b';
      rCtx.font = 'bold 36px sans-serif';
      rCtx.textAlign = 'center';
      rCtx.fillText('NỘI QUY HOẠT ĐỘNG', 256, 80);
      rCtx.fillStyle = '#38bdf8';
      rCtx.font = 'bold 20px sans-serif';
      rCtx.fillText('CYBER GAME VIETNAM • ESPORTS', 256, 120);

      // Rules lines
      rCtx.textAlign = 'left';
      rCtx.fillStyle = '#ffffff';
      rCtx.font = 'bold 18px sans-serif';
      const vietnameseRules = [
        '1. Giữ gìn vệ sinh và trật tự chung trong phòng máy.',
        '2. Tuyệt đối không hút thuốc lá, thuốc lá điện tử.',
        '3. Không văng tục, chửi thề, đập phá phím chuột máy tính.',
        '4. Nạp tiền giờ chơi tại quầy thu ngân trước khi sử dụng.',
        '5. Tự bảo quản tư trang, xe cộ và tài sản cá nhân.',
        '6. Vui lòng thanh toán đồ ăn nước uống khi gọi món.',
        '7. Nghiêm cấm sử dụng phần mềm gian lận (Hack/Cheat).',
        '8. Mọi thắc mắc về sự cố máy vui lòng báo nhân viên.',
      ];
      vietnameseRules.forEach((rule, idx) => {
        rCtx.fillText(rule, 36, 185 + idx * 56);
      });

      rCtx.textAlign = 'center';
      rCtx.fillStyle = '#f59e0b';
      rCtx.font = 'bold 18px sans-serif';
      rCtx.fillText('CHÚC QUÝ KHÁCH LEO RANK CHIẾN THẮNG!', 256, 680);
    }
    const ruleTex = new THREE.CanvasTexture(ruleCanvas);
    const ruleBoardMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.85),
      new THREE.MeshBasicMaterial({
        map: ruleTex,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );
    // Physically offset 14cm from right wall (x=4.18) and strictly in front of frame face
    ruleBoardMesh.position.set(4.04, 2.15, 3.1);
    ruleBoardMesh.rotation.y = -Math.PI / 2;
    scene.add(ruleBoardMesh);

    // Gold & dark framed border box with clear physical depth offset
    const ruleFrameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 1.92, 1.42),
      new THREE.MeshStandardMaterial({ color: 0x1e150a, metalness: 0.8, roughness: 0.3 })
    );
    ruleFrameMesh.position.set(4.10, 2.15, 3.1);
    scene.add(ruleFrameMesh);

    // Framed Esports Tournament Posters on Right Wall (CS:GO, Valorant, Dota 2)
    const createRightPoster = (title: string, sub: string, color: string, pZ: number) => {
      const rpCanvas = document.createElement('canvas');
      rpCanvas.width = 256;
      rpCanvas.height = 384;
      const ctx = rpCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(0, 0, 256, 384);
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, 240, 368);

        ctx.fillStyle = color;
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, 128, 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(sub, 128, 100);

        ctx.fillStyle = color;
        ctx.fillRect(40, 130, 176, 120);
        ctx.fillStyle = '#0a0f1d';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('PRO LEAGUE', 128, 195);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText('SEASON 2026', 128, 310);
      }
      const rpTex = new THREE.CanvasTexture(rpCanvas);
      const rpMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 1.5),
        new THREE.MeshBasicMaterial({
          map: rpTex,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        })
      );
      // Strictly separated from frame and wall
      rpMesh.position.set(4.04, 2.2, pZ);
      rpMesh.rotation.y = -Math.PI / 2;

      const rpFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 1.56, 1.06),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.85 })
      );
      rpFrame.position.set(4.10, 2.2, pZ);

      scene.add(rpFrame);
      scene.add(rpMesh);
    };

    createRightPoster('CS:GO MAJOR', 'GLOBAL ESPORTS', '#ec4899', -1.2);
    createRightPoster('VALORANT MASTERS', 'CHAMPIONS TOUR', '#38bdf8', -2.8);
    createRightPoster('DOTA 2', 'THE INTERNATIONAL', '#a855f7', -4.2);

    // --- BACK WALL & SERVICE COUNTER (Quầy Thu Ngân, Kệ Mì Tôm, Tủ Mát Nước Ngọt) ---
    // 1. Back Wall Structure (Covers main hall from x = -1.0 to x = +4.25; VIP room opens leftward)
    const backWallGroup = new THREE.Group();
    backWallGroup.position.set(0, 1.9, -6.1);

    const createBackWallTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#263042';
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = '#1a2230';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 256, 512);
        ctx.strokeRect(256, 0, 256, 512);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 1.5);
      return tex;
    };
    const backWallTex = createBackWallTexture();
    // Back wall for main hall spans width 5.30 centered at x = 1.60 (from x = -1.05 to x = +4.25)
    const backWallMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.30, 4.2),
      new THREE.MeshStandardMaterial({ map: backWallTex, color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide })
    );
    backWallMesh.position.set(1.60, 0, 0);
    backWallGroup.add(backWallMesh);

    // Illuminated Neon Center Signboard above Service Counter (centered around x = 1.80)
    const cyberSignCanvas = document.createElement('canvas');
    cyberSignCanvas.width = 768;
    cyberSignCanvas.height = 180;
    const csCtx = cyberSignCanvas.getContext('2d');
    if (csCtx) {
      csCtx.fillStyle = '#0a1222';
      csCtx.fillRect(0, 0, 768, 180);

      csCtx.strokeStyle = '#00f0ff';
      csCtx.lineWidth = 6;
      csCtx.strokeRect(8, 8, 752, 164);

      csCtx.fillStyle = '#00f0ff';
      csCtx.font = 'bold 44px sans-serif';
      csCtx.textAlign = 'center';
      csCtx.fillText('CYBER GAME • ESPORTS ARENA', 384, 80);

      csCtx.fillStyle = '#f59e0b';
      csCtx.font = 'bold 22px sans-serif';
      csCtx.fillText('VIETNAM GAMING CENTER • HIGH SPEED FIBER 10Gbps', 384, 130);
    }
    const cyberSignTex = new THREE.CanvasTexture(cyberSignCanvas);
    const cyberSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.82),
      new THREE.MeshBasicMaterial({
        map: cyberSignTex,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );
    cyberSignMesh.position.set(1.80, 1.25, 0.08);
    backWallGroup.add(cyberSignMesh);

    // Cyber sign mesh is self-illuminated via MeshBasicMaterial
    scene.add(backWallGroup);

    // 2. Far End Service Counter (Quầy Thu Ngân) - Sized neatly in main hall nook, forward along Z
    // Clear 0.9m+ physical gap between back of checkout counter and beverage fridge
    const counterGroup = new THREE.Group();
    counterGroup.position.set(1.8, 0, -3.9);

    // Counter Base (Dark walnut front with bevel)
    const counterBaseMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.55 });
    const counterBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.02, 0.8), counterBaseMat);
    counterBase.position.set(0, 0.51, 0);
    counterGroup.add(counterBase);

    // Polished Black Quartz Countertop
    const counterTopMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.35 });
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.88), counterTopMat);
    counterTop.position.set(0, 1.04, 0);
    counterGroup.add(counterTop);

    // Cyan LED Underglow Strip along bottom of counter
    const counterLed = new THREE.Mesh(
      new THREE.BoxGeometry(1.78, 0.02, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    counterLed.position.set(0, 0.02, 0.41);
    counterGroup.add(counterLed);

    // POS Cashier Computer Monitor & Customer Display
    const posScreenCanvas = document.createElement('canvas');
    posScreenCanvas.width = 256;
    posScreenCanvas.height = 180;
    const posCtx = posScreenCanvas.getContext('2d');
    if (posCtx) {
      posCtx.fillStyle = '#0f172a';
      posCtx.fillRect(0, 0, 256, 180);
      posCtx.fillStyle = '#38bdf8';
      posCtx.font = 'bold 20px sans-serif';
      posCtx.textAlign = 'center';
      posCtx.fillText('QUẦY THU NGÂN', 128, 45);
      posCtx.fillStyle = '#10b981';
      posCtx.font = 'bold 16px monospace';
      posCtx.fillText('HỆ THỐNG SẴN SÀNG', 128, 85);
      posCtx.fillStyle = '#f59e0b';
      posCtx.fillText('NẠP GIỜ / GỌI MÓN', 128, 130);
    }
    const posTex = new THREE.CanvasTexture(posScreenCanvas);
    const posBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.40, 0.28, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x090d16 })
    );
    posBack.position.set(0.2, 1.25, 0.12);
    counterGroup.add(posBack);

    const posMonitor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.26),
      new THREE.MeshBasicMaterial({
        map: posTex,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );
    posMonitor.position.set(0.2, 1.25, 0.15);
    counterGroup.add(posMonitor);

    // VietQR Payment Stand (Mã QR thanh toán Momo / Ngân hàng)
    const qrStandCanvas = document.createElement('canvas');
    qrStandCanvas.width = 128;
    qrStandCanvas.height = 160;
    const qrCtx = qrStandCanvas.getContext('2d');
    if (qrCtx) {
      qrCtx.fillStyle = '#ffffff';
      qrCtx.fillRect(0, 0, 128, 160);
      qrCtx.fillStyle = '#ec4899';
      qrCtx.fillRect(0, 0, 128, 32);
      qrCtx.fillStyle = '#ffffff';
      qrCtx.font = 'bold 12px sans-serif';
      qrCtx.textAlign = 'center';
      qrCtx.fillText('VIETQR / MOMO', 64, 22);

      // Fake QR pattern
      qrCtx.fillStyle = '#000000';
      qrCtx.fillRect(24, 45, 80, 80);
      qrCtx.fillStyle = '#ffffff';
      qrCtx.fillRect(36, 57, 56, 56);
      qrCtx.fillStyle = '#000000';
      qrCtx.fillRect(48, 69, 32, 32);

      qrCtx.font = 'bold 10px sans-serif';
      qrCtx.fillText('QUÉT MÃ NẠP TIỀN', 64, 145);
    }
    const qrTex = new THREE.CanvasTexture(qrStandCanvas);
    const qrStand = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.22),
      new THREE.MeshBasicMaterial({
        map: qrTex,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );
    qrStand.position.set(-0.55, 1.20, 0.28);
    qrStand.rotation.x = -0.15;
    counterGroup.add(qrStand);

    scene.add(counterGroup);

    // 3. Wooden Snack & Instant Noodle Shelves (Kệ Mì Tôm & Bánh Snack) - Mounted along Left Acoustic Wall (Clearing VIP Passageway)
    const snackShelvesGroup = new THREE.Group();
    snackShelvesGroup.position.set(-3.95, 0, -1.8);
    snackShelvesGroup.rotation.y = Math.PI / 2;

    const shelfWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.65 });
    const shelfSideL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.4), shelfWoodMat);
    shelfSideL.position.set(-0.8, 1.1, 0);
    snackShelvesGroup.add(shelfSideL);

    const shelfSideR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.4), shelfWoodMat);
    shelfSideR.position.set(0.8, 1.1, 0);
    snackShelvesGroup.add(shelfSideR);

    // 4 Horizontal Shelves
    [0.45, 0.95, 1.45, 1.95].forEach((sy, tierIdx) => {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.04, 0.38), shelfWoodMat);
      plank.position.set(0, sy, 0);
      snackShelvesGroup.add(plank);

      // Stock items on shelves
      if (tierIdx === 0 || tierIdx === 1) {
        // Instant Noodle Cups (Hảo Hảo, Omachi, Indomie, Cung Đình)
        const noodleColors = [0xef4444, 0xf97316, 0xec4899, 0x10b981, 0xeab308];
        for (let nx = -0.65; nx <= 0.65; nx += 0.22) {
          const nCupMat = new THREE.MeshStandardMaterial({
            color: noodleColors[Math.floor(Math.abs(nx * 10)) % noodleColors.length],
            roughness: 0.4,
          });
          const nCup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.12, 12), nCupMat);
          nCup.position.set(nx, sy + 0.08, 0.05);
          snackShelvesGroup.add(nCup);

          const nCup2 = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.12, 12), nCupMat);
          nCup2.position.set(nx, sy + 0.08, -0.07);
          snackShelvesGroup.add(nCup2);
        }
      } else {
        // Snack Bags (Oishi, Lay's, Bim Bim)
        const snackColors = [0xfacc15, 0xef4444, 0x3b82f6, 0x10b981];
        for (let sx = -0.62; sx <= 0.62; sx += 0.25) {
          const sBagMat = new THREE.MeshStandardMaterial({
            color: snackColors[Math.floor(Math.abs(sx * 8)) % snackColors.length],
            roughness: 0.35,
          });
          const sBag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.06), sBagMat);
          sBag.position.set(sx, sy + 0.11, 0.02);
          sBag.rotation.x = -0.15;
          snackShelvesGroup.add(sBag);
        }
      }
    });

    // Stainless Steel Hot Water Dispenser (Bình đun nước sôi pha mì tôm) - Next to snack shelf along left wall
    const dispenserGroup = new THREE.Group();
    dispenserGroup.position.set(-3.95, 1.05, -0.6);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
    const dispBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 16), steelMat);
    dispBody.position.set(0, 0.21, 0);
    dispenserGroup.add(dispBody);

    const redFaucet = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    redFaucet.position.set(-0.04, 0.12, 0.15);
    dispenserGroup.add(redFaucet);

    const blueFaucet = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.05), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    blueFaucet.position.set(0.04, 0.12, 0.15);
    dispenserGroup.add(blueFaucet);

    scene.add(dispenserGroup);
    scene.add(snackShelvesGroup);

    // =========================================================================
    // 3B. CLEAN RECTANGULAR VIP ROOM ARCHITECTURE (10 ULTRA TOURNAMENT PCs)
    // Strictly Outer-Only Perimeter Walls: Width 5.80m (x in [-5.90, -0.10]), Depth 9.40m (z in [-4.80, -14.20])
    // Zero internal divider walls, mesh plates, or metallic rails!
    // Open 2.5m central walking aisle down the middle (x from -4.25 to -1.75)
    // =========================================================================
    const vipRoomGroup = new THREE.Group();

    // 1. DoubleSide Dark Acoustic Soundproof Outer Boundary Walls ONLY
    const vipWallMat = new THREE.MeshStandardMaterial({
      color: 0x141b26,
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    // Outer Left Boundary Wall (at x = -5.90, running from z = -4.80 to -14.20, length 9.40m)
    const vipLeftWall = new THREE.Mesh(new THREE.PlaneGeometry(9.40, 3.8), vipWallMat);
    vipLeftWall.rotation.y = Math.PI / 2;
    vipLeftWall.position.set(-5.90, 1.9, -9.50);
    vipRoomGroup.add(vipLeftWall);

    // Outer Right Boundary Wall (at x = -0.10, running from z = -4.80 to -14.20, length 9.40m)
    const vipRightWall = new THREE.Mesh(new THREE.PlaneGeometry(9.40, 3.8), vipWallMat);
    vipRightWall.rotation.y = Math.PI / 2;
    vipRightWall.position.set(-0.10, 1.9, -9.50);
    vipRoomGroup.add(vipRightWall);

    // Outer Back Boundary Wall (at z = -14.20, running from x = -5.90 to -0.10, width 5.80m)
    const vipBackWall = new THREE.Mesh(new THREE.PlaneGeometry(5.80, 3.8), vipWallMat);
    vipBackWall.position.set(-3.00, 1.9, -14.20);
    vipRoomGroup.add(vipBackWall);

    // Outer Front Boundary Wall (at z = -4.80, width 5.80m with 1.8m central doorway from x = -3.90 to -2.10)
    // Left front segment: x from -5.90 to -3.90 (width 2.00, center x = -4.90)
    const vipFrontLeft = new THREE.Mesh(new THREE.PlaneGeometry(2.00, 3.8), vipWallMat);
    vipFrontLeft.position.set(-4.90, 1.9, -4.80);
    vipRoomGroup.add(vipFrontLeft);

    // Right front segment: x from -2.10 to -0.10 (width 2.00, center x = -1.10)
    const vipFrontRight = new THREE.Mesh(new THREE.PlaneGeometry(2.00, 3.8), vipWallMat);
    vipFrontRight.position.set(-1.10, 1.9, -4.80);
    vipRoomGroup.add(vipFrontRight);

    // Front lintel above doorway: x from -3.90 to -2.10 (width 1.80, height 1.30, y from 2.50 to 3.80, center x = -3.00, y = 3.15)
    const vipFrontLintel = new THREE.Mesh(new THREE.PlaneGeometry(1.80, 1.30), vipWallMat);
    vipFrontLintel.position.set(-3.00, 3.15, -4.80);
    vipRoomGroup.add(vipFrontLintel);

    // Dark Titanium Door Jamb Frame around 1.8m wide doorway
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.92, roughness: 0.18 });
    const vipDoorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.08, 0.08), frameMat);
    vipDoorFrameTop.position.set(-3.00, 2.50, -4.80);
    vipRoomGroup.add(vipDoorFrameTop);

    const vipDoorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), frameMat);
    vipDoorFrameL.position.set(-3.90, 1.25, -4.80);
    vipRoomGroup.add(vipDoorFrameL);

    const vipDoorFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.08), frameMat);
    vipDoorFrameR.position.set(-2.10, 1.25, -4.80);
    vipRoomGroup.add(vipDoorFrameR);

    // Polished Dark VIP Floor with Gold LED Tile Grid (width 5.80m, depth 9.40m)
    const createVipFloorTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#070b12';
        ctx.fillRect(0, 0, 512, 512);

        // Gold carbon & dark slate luxury floor tile grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        for (let x = 0; x <= 512; x += 128) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 512);
          ctx.stroke();
        }
        for (let y = 0; y <= 512; y += 128) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(512, y);
          ctx.stroke();
        }

        // Gold accent inlay highlights
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
        ctx.lineWidth = 2;
        for (let x = 128; x <= 384; x += 128) {
          for (let y = 128; y <= 384; y += 128) {
            ctx.strokeRect(x - 20, y - 20, 40, 40);
          }
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 8);
      return tex;
    };

    const vipFloorMat = new THREE.MeshStandardMaterial({
      map: createVipFloorTexture(),
      roughness: 0.18,
      metalness: 0.45,
    });
    const vipFloor = new THREE.Mesh(new THREE.PlaneGeometry(5.80, 9.40), vipFloorMat);
    vipFloor.rotation.x = -Math.PI / 2;
    vipFloor.position.set(-3.00, 0.012, -9.50);
    vipRoomGroup.add(vipFloor);

    // VIP Ceiling with acoustic black panels (5.80m x 9.40m)
    const vipCeiling = new THREE.Mesh(new THREE.PlaneGeometry(5.80, 9.40), vipWallMat);
    vipCeiling.rotation.x = Math.PI / 2;
    vipCeiling.position.set(-3.00, 3.80, -9.50);
    vipRoomGroup.add(vipCeiling);

    // Triple Gold & Cyan Neon Ceiling Strips
    const vipGoldNeonMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const vipCyanNeonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const vipNeonL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 9.0, 8), vipCyanNeonMat);
    vipNeonL.rotation.x = Math.PI / 2;
    vipNeonL.position.set(-4.50, 3.75, -9.50);
    vipRoomGroup.add(vipNeonL);

    const vipNeonC = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 9.0, 8), vipGoldNeonMat);
    vipNeonC.rotation.x = Math.PI / 2;
    vipNeonC.position.set(-3.00, 3.75, -9.50);
    vipRoomGroup.add(vipNeonC);

    const vipNeonR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 9.0, 8), vipCyanNeonMat);
    vipNeonR.rotation.x = Math.PI / 2;
    vipNeonR.position.set(-1.50, 3.75, -9.50);
    vipRoomGroup.add(vipNeonR);

    // Glowing Neon Sign: 'VIP ZONE' on Outer Partition Wall (Centered above 1.8m doorway at x = -3.00)
    const vipSignCanvas = document.createElement('canvas');
    vipSignCanvas.width = 512;
    vipSignCanvas.height = 140;
    const vsCtx = vipSignCanvas.getContext('2d');
    if (vsCtx) {
      vsCtx.fillStyle = '#080d16';
      vsCtx.fillRect(0, 0, 512, 140);
      vsCtx.strokeStyle = '#f59e0b';
      vsCtx.lineWidth = 6;
      vsCtx.strokeRect(6, 6, 500, 128);

      vsCtx.fillStyle = '#fbbf24';
      vsCtx.font = '900 44px sans-serif';
      vsCtx.textAlign = 'center';
      vsCtx.fillText('⚡ VIP ZONE ⚡', 256, 56);

      vsCtx.fillStyle = '#06b6d4';
      vsCtx.font = 'bold 21px monospace';
      vsCtx.fillText('ESPORTS TOURNAMENT ARENA • 10 ULTRA PCs', 256, 94);

      vsCtx.fillStyle = '#22c55e';
      vsCtx.font = 'bold 18px sans-serif';
      vsCtx.fillText('[E] ĐẨY CỬA PHÒNG VIP', 256, 123);
    }
    const vipSignTex = new THREE.CanvasTexture(vipSignCanvas);
    const vipSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.62),
      new THREE.MeshBasicMaterial({ map: vipSignTex, side: THREE.DoubleSide })
    );
    vipSignMesh.position.set(-3.00, 3.10, -4.75);
    vipRoomGroup.add(vipSignMesh);

    // Interactive Pushable Door (Hinge Pivot on left jamb at x = -3.90, z = -4.80)
    // 1.8m wide doorway: door swings inward smoothly by 90 degrees on [E]
    const vipDoorPivot = new THREE.Group();
    vipDoorPivot.position.set(-3.90, 0, -4.80);
    vipDoorHingeRef.current = vipDoorPivot;

    const vipDoorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.88,
      roughness: 0.22,
      side: THREE.DoubleSide,
    });
    const vipDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.80, 2.46, 0.05), vipDoorMat);
    vipDoorMesh.position.set(0.90, 1.23, 0); // Offset by half width (+0.90)
    vipDoorPivot.add(vipDoorMesh);

    // Tempered tinted gold glass panel in door
    const vipGlassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      roughness: 0.08,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    const vipDoorGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.7), vipGlassMat);
    vipDoorGlass.position.set(0.90, 1.28, 0.03);
    vipDoorPivot.add(vipDoorGlass);

    // Gold vertical tubular push handles
    const vipHandleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
    const vipHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8), vipHandleMat);
    vipHandle.position.set(1.66, 1.18, 0.04);
    vipDoorPivot.add(vipHandle);

    const vipHandleIn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8), vipHandleMat);
    vipHandleIn.position.set(1.66, 1.18, -0.04);
    vipDoorPivot.add(vipHandleIn);

    scene.add(vipDoorPivot);

    // Large Tournament Championship Billboard on VIP Back Wall (z = -14.15)
    const vipBackBannerCanvas = document.createElement('canvas');
    vipBackBannerCanvas.width = 1024;
    vipBackBannerCanvas.height = 320;
    const vbbCtx = vipBackBannerCanvas.getContext('2d');
    if (vbbCtx) {
      vbbCtx.fillStyle = '#060a12';
      vbbCtx.fillRect(0, 0, 1024, 320);
      vbbCtx.strokeStyle = '#f59e0b';
      vbbCtx.lineWidth = 8;
      vbbCtx.strokeRect(12, 12, 1000, 296);

      vbbCtx.fillStyle = '#f59e0b';
      vbbCtx.font = 'bold 52px sans-serif';
      vbbCtx.textAlign = 'center';
      vbbCtx.fillText('⚡ ROG TOURNAMENT ARENA ⚡', 512, 95);

      vbbCtx.fillStyle = '#06b6d4';
      vbbCtx.font = 'bold 36px monospace';
      vbbCtx.fillText('VIETNAM NATIONAL ESPORTS CHAMPIONSHIP', 512, 170);

      vbbCtx.fillStyle = '#10b981';
      vbbCtx.font = 'bold 30px monospace';
      vbbCtx.fillText('10 BATTLESTATIONS • 360Hz TOURNAMENT RIGS • FIBER 10Gbps', 512, 245);
    }
    const vipBackBannerTex = new THREE.CanvasTexture(vipBackBannerCanvas);
    const vipBackBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 1.25),
      new THREE.MeshBasicMaterial({ map: vipBackBannerTex, side: THREE.DoubleSide })
    );
    vipBackBanner.position.set(-3.00, 1.50, -14.15);
    vipRoomGroup.add(vipBackBanner);

    // 2. SINGLE WALL-MOUNTED AIR CONDITIONER (BoxGeometry) HIGH UP AT y = 2.5 ON BACK WALL
    // Obstacle-free open air mesh vent, digital temperature display, and faint blue/green indicator light
    const vipAcGroup = new THREE.Group();
    vipAcGroup.position.set(-3.00, 2.50, -14.05);

    // Main AC rectangular body (BoxGeometry)
    const acBodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28, metalness: 0.08 });
    const acBody = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.42, 0.28), acBodyMat);
    vipAcGroup.add(acBody);

    // Open obstacle-free air intake grille on top
    const acGrilleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.45 });
    const acGrille = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.02, 0.22), acGrilleMat);
    acGrille.position.set(0, 0.21, 0);
    vipAcGroup.add(acGrille);

    // Open, obstacle-free air mesh & discharge flap angled downward
    const acFlapMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, side: THREE.DoubleSide });
    const acFlap = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.16), acFlapMat);
    acFlap.position.set(0, -0.16, 0.15);
    acFlap.rotation.x = 0.45;
    vipAcGroup.add(acFlap);

    // Faint blue/green indicator light (Cyan/Green LED)
    const vipAcLedMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const acIndicatorLight = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), vipAcLedMat);
    acIndicatorLight.position.set(0.60, -0.10, 0.145);
    vipAcGroup.add(acIndicatorLight);

    // Subtle faint cyan glow around indicator
    const acPointLight = new THREE.PointLight(0x06b6d4, 0.45, 2.0);
    acPointLight.position.set(0.60, -0.10, 0.22);
    vipAcGroup.add(acPointLight);

    // Digital temperature LED display (16°C Inverter Turbo)
    const acDisplayCanvas = document.createElement('canvas');
    acDisplayCanvas.width = 128;
    acDisplayCanvas.height = 64;
    const adCtx = acDisplayCanvas.getContext('2d');
    if (adCtx) {
      adCtx.fillStyle = '#0f172a';
      adCtx.fillRect(0, 0, 128, 64);
      adCtx.fillStyle = '#22c55e';
      adCtx.font = 'bold 36px monospace';
      adCtx.textAlign = 'center';
      adCtx.fillText('16°C', 64, 46);
    }
    const acDisplayTex = new THREE.CanvasTexture(adCtx ? acDisplayCanvas : document.createElement('canvas'));
    const acDisplayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), new THREE.MeshBasicMaterial({ map: acDisplayTex }));
    acDisplayMesh.position.set(0.38, 0.02, 0.145);
    vipAcGroup.add(acDisplayMesh);

    vipRoomGroup.add(vipAcGroup);

    // =========================================================================
    // 5. 12 HIGH-END VIP GAMING PC SETUPS & SOLID LUXURY GAMING CHAIRS
    // 2 Spacious Rows of 6 Battlestations facing the 1.4m central tournament aisle:
    // Left Row (6 PCs): x_desk = -4.50, facing +X (towards center aisle)
    // Right Row (6 PCs): x_desk = -1.60, facing -X (towards center aisle)
    // Walkable entrance foyer inside door: z in [-4.80, -6.20] (1.4m clear vestibule)
    // Z positions: [-6.6, -7.9, -9.2, -10.5, -11.8, -13.1] (1.3m pitch between stations)
    // Every desk has an instantiated Luxury Gold & Black Gaming Chair at floor height (y=0)
    // =========================================================================

    // Shared Materials for High-End VIP Battlestations & Chairs
    const createCarbonFiberDeskTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#111620';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#1c2433';
        for (let x = 0; x < 256; x += 16) {
          for (let y = 0; y < 256; y += 16) {
            if ((x / 16 + y / 16) % 2 === 0) {
              ctx.fillRect(x, y, 16, 16);
            }
          }
        }
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 248);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    };

    const vipDeskTopMat = new THREE.MeshStandardMaterial({
      map: createCarbonFiberDeskTexture(),
      roughness: 0.28,
      metalness: 0.4,
    });
    const vipDeskLegMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 });
    const vipMousePadMat = new THREE.MeshStandardMaterial({ color: 0x0b1320, roughness: 0.7 });
    const vipKbdMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 });
    const vipMonFrameMat = new THREE.MeshStandardMaterial({ color: 0x070b12, metalness: 0.92, roughness: 0.15 });
    const vipMonStandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const vipScreenMatCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const vipScreenMatGold = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const vipPcCaseMat = new THREE.MeshStandardMaterial({ color: 0x0a0f18, metalness: 0.92, roughness: 0.18 });
    const vipPcGlassMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.3,
      depthWrite: false,
    });
    const vipFanCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const vipFanGoldMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Premium Gold & Black Gaming Chair Materials
    const chairBlackLeatherMat = new THREE.MeshStandardMaterial({ color: 0x0a0f18, roughness: 0.4, metalness: 0.2 });
    const chairGoldLeatherMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.65 });
    const chairMetalMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 });
    const chairChromePistonMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });

    const createVipGamingChair = (chairX: number, chairZ: number, isLeft: boolean) => {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(chairX, 0, chairZ);
      // Left row chair faces desk at left (-X): rotY = Math.PI / 2 (90 degrees)
      // Right row chair faces desk at right (+X): rotY = -Math.PI / 2 (-90 degrees)
      chairGroup.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;

      // 1. 5-Star Spider Base & Caster Wheels at Floor
      const baseHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), chairMetalMat);
      baseHub.position.set(0, 0.06, 0);
      chairGroup.add(baseHub);

      for (let w = 0; w < 5; w++) {
        const angle = (w * Math.PI * 2) / 5;
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.04), chairMetalMat);
        leg.position.set(Math.cos(angle) * 0.13, 0.055, Math.sin(angle) * 0.13);
        leg.rotation.y = -angle;
        chairGroup.add(leg);

        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8), chairMetalMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(Math.cos(angle) * 0.24, 0.025, Math.sin(angle) * 0.24);
        chairGroup.add(wheel);
      }

      // 2. Heavy Chrome Hydraulic Gas-Lift Piston
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.32, 12), chairChromePistonMat);
      piston.position.set(0, 0.22, 0);
      chairGroup.add(piston);

      // 3. Contoured Luxury Seat Cushion (Black Center + Gold Racing Bolsters)
      const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.44), chairBlackLeatherMat);
      seatCushion.position.set(0, 0.44, 0);
      chairGroup.add(seatCushion);

      // Gold racing side wings on seat
      const seatWingL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.44), chairGoldLeatherMat);
      seatWingL.position.set(-0.21, 0.47, 0);
      seatWingL.rotation.z = -0.18;
      chairGroup.add(seatWingL);

      const seatWingR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.44), chairGoldLeatherMat);
      seatWingR.position.set(0.21, 0.47, 0);
      seatWingR.rotation.z = 0.18;
      chairGroup.add(seatWingR);

      // 4. Ergonomic High Backrest with Gold Racing Wings
      const backrestGroup = new THREE.Group();
      backrestGroup.position.set(0, 0.48, 0.19);
      backrestGroup.rotation.x = 0.06;

      const backrestCenter = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.07), chairBlackLeatherMat);
      backrestCenter.position.set(0, 0.36, 0);
      backrestGroup.add(backrestCenter);

      // Gold shoulder & spine racing bolster wings
      const backWingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.66, 0.07), chairGoldLeatherMat);
      backWingL.position.set(-0.21, 0.34, 0.02);
      backWingL.rotation.y = -0.25;
      backrestGroup.add(backWingL);

      const backWingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.66, 0.07), chairGoldLeatherMat);
      backWingR.position.set(0.21, 0.34, 0.02);
      backWingR.rotation.y = 0.25;
      backrestGroup.add(backWingR);

      // Gold Neck Pillow / Headrest with VIP embroidery
      const neckPillow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.07), chairGoldLeatherMat);
      neckPillow.position.set(0, 0.65, 0.04);
      backrestGroup.add(neckPillow);

      // Gold Lumbar Support Cushion
      const lumbarPillow = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.15, 0.06), chairGoldLeatherMat);
      lumbarPillow.position.set(0, 0.14, 0.04);
      backrestGroup.add(lumbarPillow);

      chairGroup.add(backrestGroup);

      // 5. 3D Adjustable Armrests with Gold Accent Caps
      [-0.25, 0.25].forEach(armX => {
        const armPole = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.04), chairMetalMat);
        armPole.position.set(armX, 0.54, 0);
        chairGroup.add(armPole);

        const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.22), chairBlackLeatherMat);
        armPad.position.set(armX, 0.66, -0.02);
        chairGroup.add(armPad);

        const armGoldCap = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.008, 0.06), chairGoldLeatherMat);
        armGoldCap.position.set(armX, 0.675, -0.02);
        chairGroup.add(armGoldCap);
      });

      return chairGroup;
    };

    // Exactly 5 Setups per side (10 VIP PCs in total) spaced 1.5m apart
    const vipZPositions = [-6.50, -8.00, -9.50, -11.00, -12.50];

    for (let i = 0; i < 10; i++) {
      const isLeft = i < 5;
      const slot = i % 5;
      const zPos = vipZPositions[slot];
      const deskX = isLeft ? -5.40 : -0.60;
      const facingSign = isLeft ? 1 : -1; // Direction towards central aisle

      const stGroup = new THREE.Group();

      // 1. Grounded Carbon-Fiber Battlestation Desk (Grounded flush at y = 0)
      const deskMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.055, 0.95), vipDeskTopMat);
      deskMesh.position.set(deskX, 0.745, zPos);
      stGroup.add(deskMesh);

      // Heavy steel pedestal legs grounded at y = 0 (height 0.72, center 0.36)
      const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.82), vipDeskLegMat);
      legMesh.position.set(deskX, 0.36, zPos);
      stGroup.add(legMesh);

      // Extended esports speed mousepad on desk surface
      const mousePad = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.008, 0.75), vipMousePadMat);
      mousePad.position.set(deskX + facingSign * 0.12, 0.776, zPos);
      stGroup.add(mousePad);

      // RGB Mechanical Keyboard & Esports Mouse
      const kbd = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.44), vipKbdMat);
      kbd.position.set(deskX + facingSign * 0.08, 0.786, zPos);
      stGroup.add(kbd);

      const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.024, 0.06), vipDeskLegMat);
      mouse.position.set(deskX + facingSign * 0.08, 0.786, zPos + 0.28);
      stGroup.add(mouse);

      // 2. High-End Curved Ultrawide Monitor (21:9 Curved Display)
      // Rotated to face the chair and central aisle directly
      const monX = isLeft ? -5.48 : -0.52;
      const monRotY = isLeft ? Math.PI / 2 : -Math.PI / 2;

      const monGroup = new THREE.Group();
      monGroup.position.set(monX, 1.15, zPos);
      monGroup.rotation.y = monRotY;

      // Heavy metal monitor stand & arm grounded on desk surface
      const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.20), vipMonStandMat);
      standBase.position.set(0, -0.37, 0);
      monGroup.add(standBase);

      const standPole = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.04), vipMonStandMat);
      standPole.position.set(0, -0.19, -0.06);
      monGroup.add(standPole);

      // Curved Ultrawide Bezel Frame (Center + Angled Wings)
      const frameCenter = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.03), vipMonFrameMat);
      monGroup.add(frameCenter);

      const frameWingL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.03), vipMonFrameMat);
      frameWingL.position.set(-0.35, 0, 0.04);
      frameWingL.rotation.y = 0.28;
      monGroup.add(frameWingL);

      const frameWingR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.03), vipMonFrameMat);
      frameWingR.position.set(0.35, 0, 0.04);
      frameWingR.rotation.y = -0.28;
      monGroup.add(frameWingR);

      // Emissive High-Refresh Curved Screen (Alternating Glowing Cyan and Gold)
      const screenMat = i % 2 === 0 ? vipScreenMatCyan : vipScreenMatGold;
      const screenCenter = new THREE.Mesh(new THREE.PlaneGeometry(0.50, 0.35), screenMat);
      screenCenter.position.set(0, 0, 0.018);
      monGroup.add(screenCenter);

      const screenWingL = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.35), screenMat);
      screenWingL.position.set(-0.35, 0, 0.056);
      screenWingL.rotation.y = 0.28;
      monGroup.add(screenWingL);

      const screenWingR = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.35), screenMat);
      screenWingR.position.set(0.35, 0, 0.056);
      screenWingR.rotation.y = -0.28;
      monGroup.add(screenWingR);

      stGroup.add(monGroup);

      // 3. Custom VIP Gaming PC Case with Transparent Glass & Glowing RGB Fans
      const pcX = isLeft ? -5.46 : -0.54;
      const pcZ = zPos + 0.32;
      const pcGroup = new THREE.Group();
      pcGroup.position.set(pcX, 1.01, pcZ);
      pcGroup.rotation.y = monRotY;

      // Dark aluminum chassis
      const pcBody = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.22), vipPcCaseMat);
      pcGroup.add(pcBody);

      // Tempered transparent glass panel facing the user
      const pcGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.44), vipPcGlassMat);
      pcGlass.position.set(0, 0, 0.115);
      pcGroup.add(pcGlass);

      // Glowing RGB Cooling Fans inside the case (Cyan & Gold)
      const fan1 = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 8, 16), vipFanCyanMat);
      fan1.position.set(-0.08, 0.10, 0.05);
      pcGroup.add(fan1);

      const fan2 = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 8, 16), vipFanGoldMat);
      fan2.position.set(-0.08, -0.10, 0.05);
      pcGroup.add(fan2);

      stGroup.add(pcGroup);

      vipRoomGroup.add(stGroup);

      // 4. INSTANTIATE PREMIUM BLACK & GOLD GAMING CHAIR
      // Offset 0.9m from desk into the central aisle:
      // Left row chair: x = -4.50 (rotated 90 deg / Math.PI / 2 to face desk)
      // Right row chair: x = -1.50 (rotated -90 deg / -Math.PI / 2 to face desk)
      // Grounded flush at y = 0
      const chairX = isLeft ? -4.50 : -1.50;
      const chair = createVipGamingChair(chairX, zPos, isLeft);
      vipRoomGroup.add(chair);
    }

    scene.add(vipRoomGroup);

    // 4. Brightly Lit Glass-Door Beverage Refrigerator (Tủ Mát Nước Ngọt & Đồ Ăn)
    // Placed neatly against back wall at x = 3.2, z = -5.6, with a clear 0.9m+ physical gap to the checkout counter
    const coolerGroup = new THREE.Group();
    coolerGroup.position.set(3.2, 0, -5.6);

    // Refrigerator Outer Shell (Hollow Open Cabinet so interior is 100% visible)
    const coolerShellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const coolerInnerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.2, roughness: 0.25 });

    // Back Panel
    const coolerBack = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.3, 0.05), coolerInnerMat);
    coolerBack.position.set(0, 1.15, -0.34);
    coolerGroup.add(coolerBack);

    // Left Side Panel
    const coolerSideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.3, 0.72), coolerShellMat);
    coolerSideL.position.set(-0.65, 1.15, 0);
    coolerGroup.add(coolerSideL);

    // Right Side Panel
    const coolerSideR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.3, 0.72), coolerShellMat);
    coolerSideR.position.set(0.65, 1.15, 0);
    coolerGroup.add(coolerSideR);

    // Bottom Base
    const coolerBase = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.22, 0.72), coolerShellMat);
    coolerBase.position.set(0, 0.11, 0);
    coolerGroup.add(coolerBase);

    // Top Header Canopy
    const coolerTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.32, 0.72), coolerShellMat);
    coolerTop.position.set(0, 2.14, 0);
    coolerGroup.add(coolerTop);

    // Top Illuminated Header (Light box)
    const coolerHeaderCanvas = document.createElement('canvas');
    coolerHeaderCanvas.width = 384;
    coolerHeaderCanvas.height = 96;
    const chCtx = coolerHeaderCanvas.getContext('2d');
    if (chCtx) {
      chCtx.fillStyle = '#0284c7';
      chCtx.fillRect(0, 0, 384, 96);
      chCtx.fillStyle = '#ffffff';
      chCtx.font = 'bold 26px sans-serif';
      chCtx.textAlign = 'center';
      chCtx.fillText('BEVERAGES & ENERGY', 192, 45);
      chCtx.fillStyle = '#f59e0b';
      chCtx.font = 'bold 18px monospace';
      chCtx.fillText('ICE COLD • STING • MONSTER', 192, 75);
    }
    const coolerHeaderTex = new THREE.CanvasTexture(coolerHeaderCanvas);
    const coolerHeader = new THREE.Mesh(
      new THREE.PlaneGeometry(1.28, 0.28),
      new THREE.MeshBasicMaterial({ map: coolerHeaderTex })
    );
    coolerHeader.position.set(0, 2.12, 0.365);
    coolerGroup.add(coolerHeader);

    // Front Face Transparent Glass Material (Optimized: depthWrite = false, Standard Material)
    const coolerGlassMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.22,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false,
    });
    const coolerGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 1.76), coolerGlassMat);
    coolerGlass.position.set(0, 1.10, 0.365);
    coolerGlass.castShadow = false;
    coolerGlass.receiveShadow = false;
    coolerGroup.add(coolerGlass);

    // Inner White/Blue Emissive LED Strip Lighting (Emissive with zero dynamic light cost)
    const coolerBlueLedMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.5,
    });
    const coolerWhiteLedMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.0,
    });

    // Vertical left & right LED strips inside fridge door frame
    const ledStripL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.7, 0.02), coolerBlueLedMat);
    ledStripL.position.set(-0.58, 1.10, 0.32);
    coolerGroup.add(ledStripL);

    const ledStripR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.7, 0.02), coolerBlueLedMat);
    ledStripR.position.set(0.58, 1.10, 0.32);
    coolerGroup.add(ledStripR);

    // Top horizontal cool white LED strip
    const ledStripTop = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.02, 0.02), coolerWhiteLedMat);
    ledStripTop.position.set(0, 1.94, 0.32);
    coolerGroup.add(ledStripTop);

    // Chrome Door Pull Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
    const coolerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8), handleMat);
    coolerHandle.position.set(-0.52, 1.1, 0.39);
    coolerGroup.add(coolerHandle);

    // Wire Shelves inside Refrigerator
    [0.42, 0.82, 1.22, 1.62].forEach((dy) => {
      const wireShelf = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.02, 0.58), steelMat);
      wireShelf.position.set(0, dy, 0);
      wireShelf.castShadow = false;
      wireShelf.receiveShadow = false;
      coolerGroup.add(wireShelf);

      const shelfTrimLed = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.012, 0.015), coolerBlueLedMat);
      shelfTrimLed.position.set(0, dy, 0.29);
      coolerGroup.add(shelfTrimLed);
    });

    // InstancedMesh for Beverage Cans & Snack Packs inside Cooler (1 Draw Call each)
    const canGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 8);
    const canMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 });
    const instancedCoolerCans = new THREE.InstancedMesh(canGeo, canMat, 36);
    instancedCoolerCans.castShadow = false;
    instancedCoolerCans.receiveShadow = false;

    const canDummy = new THREE.Object3D();
    let canIdx = 0;
    const canColors = [0xef4444, 0xeab308, 0x10b981, 0x3b82f6, 0x0284c7];
    [1.22, 1.62].forEach((dy) => {
      for (let rx = -0.48; rx <= 0.48; rx += 0.16) {
        if (canIdx < 36) {
          canDummy.position.set(rx, dy + 0.09, 0.18);
          canDummy.updateMatrix();
          instancedCoolerCans.setMatrixAt(canIdx, canDummy.matrix);
          const cColor = new THREE.Color(canColors[canIdx % canColors.length]);
          instancedCoolerCans.setColorAt(canIdx, cColor);
          canIdx++;
        }
        if (canIdx < 36) {
          canDummy.position.set(rx, dy + 0.09, 0.02);
          canDummy.updateMatrix();
          instancedCoolerCans.setMatrixAt(canIdx, canDummy.matrix);
          const cColor = new THREE.Color(canColors[(canIdx + 2) % canColors.length]);
          instancedCoolerCans.setColorAt(canIdx, cColor);
          canIdx++;
        }
      }
    });
    instancedCoolerCans.instanceMatrix.needsUpdate = true;
    if (instancedCoolerCans.instanceColor) instancedCoolerCans.instanceColor.needsUpdate = true;
    coolerGroup.add(instancedCoolerCans);

    const coolerBoxGeo = new THREE.BoxGeometry(0.12, 0.13, 0.14);
    const coolerBoxMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 });
    const instancedCoolerBoxes = new THREE.InstancedMesh(coolerBoxGeo, coolerBoxMat, 20);
    instancedCoolerBoxes.castShadow = false;
    instancedCoolerBoxes.receiveShadow = false;

    const boxDummy = new THREE.Object3D();
    let boxIdx = 0;
    const boxColors = [0xec4899, 0x1e293b, 0x10b981, 0xf59e0b];
    // Shelf 2 & bottom shelf
    [0.82, 0.42].forEach((dy) => {
      for (let rx = -0.46; rx <= 0.46; rx += 0.18) {
        if (boxIdx < 20) {
          boxDummy.position.set(rx, dy + 0.075, 0.14);
          boxDummy.updateMatrix();
          instancedCoolerBoxes.setMatrixAt(boxIdx, boxDummy.matrix);
          instancedCoolerBoxes.setColorAt(boxIdx, new THREE.Color(boxColors[boxIdx % boxColors.length]));
          boxIdx++;
        }
      }
    });
    instancedCoolerBoxes.instanceMatrix.needsUpdate = true;
    if (instancedCoolerBoxes.instanceColor) instancedCoolerBoxes.instanceColor.needsUpdate = true;
    coolerGroup.add(instancedCoolerBoxes);

    scene.add(coolerGroup);

    // Glowing Floor Decal in front of Refrigerator: [TỦ MÁT F&B • [E] LẤY ĐỒ ĂN]
    const fridgeBeaconCanvas = document.createElement('canvas');
    fridgeBeaconCanvas.width = 256;
    fridgeBeaconCanvas.height = 128;
    const fbCtx = fridgeBeaconCanvas.getContext('2d');
    if (fbCtx) {
      fbCtx.fillStyle = '#0284c7';
      fbCtx.fillRect(0, 0, 256, 128);
      fbCtx.fillStyle = '#ffffff';
      fbCtx.font = 'bold 24px sans-serif';
      fbCtx.textAlign = 'center';
      fbCtx.fillText('TỦ MÁT F&B', 128, 48);
      fbCtx.fillStyle = '#fef08a';
      fbCtx.font = 'bold 18px monospace';
      fbCtx.fillText('[E] LẤY ĐỒ ĂN/UỐNG', 128, 88);
    }
    const fridgeBeaconTex = new THREE.CanvasTexture(fridgeBeaconCanvas);
    const fridgeBeacon = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.6),
      new THREE.MeshBasicMaterial({ map: fridgeBeaconTex, transparent: true, opacity: 0.85 })
    );
    fridgeBeacon.rotation.x = -Math.PI / 2;
    fridgeBeacon.position.set(2.8, 0.02, -4.72);
    scene.add(fridgeBeacon);

    // =========================================================================
    // 5. OPEN FRONT ENTRANCE & STREET EXPANSION WITH REAL ESTATE STOREFRONTS
    // =========================================================================

    // A. Cyber Cafe Open Entrance Wall (z = 5.05)
    // Left front wall segment (x from -4.25 to -1.15)
    const frontWallMat = new THREE.MeshStandardMaterial({ color: 0x222a38, roughness: 0.82, side: THREE.DoubleSide });
    const frontWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 4.2), frontWallMat);
    frontWallLeft.position.set(-2.7, 1.9, 5.05);
    frontWallLeft.rotation.y = Math.PI;
    scene.add(frontWallLeft);

    // Right front wall segment (x from 1.15 to 4.25)
    const frontWallRight = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 4.2), frontWallMat);
    frontWallRight.position.set(2.7, 1.9, 5.05);
    frontWallRight.rotation.y = Math.PI;
    scene.add(frontWallRight);

    // Top lintel above door (from y = 2.6 to 4.2, width 2.3)
    const frontWallLintel = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.4), frontWallMat);
    frontWallLintel.position.set(0, 3.3, 5.05);
    frontWallLintel.rotation.y = Math.PI;
    scene.add(frontWallLintel);

    // Aluminum portal frame around open entrance doorway
    const portalTrimMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    const portalTopTrim = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.12), portalTrimMat);
    portalTopTrim.position.set(0, 2.6, 5.05);
    scene.add(portalTopTrim);

    const portalLeftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.12), portalTrimMat);
    portalLeftPillar.position.set(-1.15, 1.3, 5.05);
    scene.add(portalLeftPillar);

    const portalRightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.12), portalTrimMat);
    portalRightPillar.position.set(1.15, 1.3, 5.05);
    scene.add(portalRightPillar);

    // Retracted glass sliding entrance doors (open at sides)
    const doorGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35, roughness: 0.1 });
    const doorGlassLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.5), doorGlassMat);
    doorGlassLeft.position.set(-1.4, 1.25, 5.02);
    doorGlassLeft.rotation.y = Math.PI;
    scene.add(doorGlassLeft);

    const doorGlassRight = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.5), doorGlassMat);
    doorGlassRight.position.set(1.4, 1.25, 5.02);
    doorGlassRight.rotation.y = Math.PI;
    scene.add(doorGlassRight);

    // Inside Sign: Neon Green "LỐI RA / EXIT"
    const exitCanvas = document.createElement('canvas');
    exitCanvas.width = 256;
    exitCanvas.height = 96;
    const exCtx = exitCanvas.getContext('2d');
    if (exCtx) {
      exCtx.fillStyle = '#064e3b';
      exCtx.fillRect(0, 0, 256, 96);
      exCtx.strokeStyle = '#22c55e';
      exCtx.lineWidth = 4;
      exCtx.strokeRect(4, 4, 248, 88);
      exCtx.fillStyle = '#22c55e';
      exCtx.font = 'bold 30px sans-serif';
      exCtx.textAlign = 'center';
      exCtx.fillText('LỐI RA • EXIT', 128, 58);
    }
    const exitTex = new THREE.CanvasTexture(exitCanvas);
    const exitSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.32),
      new THREE.MeshBasicMaterial({ map: exitTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    );
    exitSign.position.set(0, 2.75, 4.98);
    exitSign.rotation.y = Math.PI;
    scene.add(exitSign);

    const exitLight = new THREE.PointLight(0x22c55e, 0.9, 3.2);
    exitLight.position.set(0, 2.75, 4.8);
    scene.add(exitLight);

    // Outside Facade Sign facing street (at z = 5.15)
    const marqueeCanvas = document.createElement('canvas');
    marqueeCanvas.width = 512;
    marqueeCanvas.height = 128;
    const mqCtx = marqueeCanvas.getContext('2d');
    if (mqCtx) {
      mqCtx.fillStyle = '#0f172a';
      mqCtx.fillRect(0, 0, 512, 128);
      mqCtx.strokeStyle = '#38bdf8';
      mqCtx.lineWidth = 6;
      mqCtx.strokeRect(6, 6, 500, 116);
      mqCtx.fillStyle = '#38bdf8';
      mqCtx.font = 'bold 36px sans-serif';
      mqCtx.textAlign = 'center';
      mqCtx.fillText('⚡ CYBER CAFE GAMING ⚡', 256, 55);
      mqCtx.fillStyle = '#facc15';
      mqCtx.font = 'bold 22px monospace';
      mqCtx.fillText('NET TYCOON • CHÀO MỪNG QUÝ KHÁCH', 256, 95);
    }
    const marqueeTex = new THREE.CanvasTexture(marqueeCanvas);
    const marqueeSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.7),
      new THREE.MeshBasicMaterial({ map: marqueeTex })
    );
    marqueeSign.position.set(0, 3.4, 5.12);
    scene.add(marqueeSign);

    const marqueeLight = new THREE.PointLight(0x38bdf8, 1.2, 5.0);
    marqueeLight.position.set(0, 3.4, 5.35);
    scene.add(marqueeLight);

    // Welcome floor mat threshold
    const welcomeMat = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.9 })
    );
    welcomeMat.rotation.x = -Math.PI / 2;
    welcomeMat.position.set(0, 0.015, 5.0);
    scene.add(welcomeMat);

    // B. Exterior Street Environment (Directly outside cafe)
    // 1. Paved Sidewalk (Vỉa hè)
    const sidewalkCanvas = document.createElement('canvas');
    sidewalkCanvas.width = 512;
    sidewalkCanvas.height = 512;
    const sCtx = sidewalkCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#94a3b8';
      sCtx.fillRect(0, 0, 512, 512);
      sCtx.strokeStyle = '#64748b';
      sCtx.lineWidth = 3;
      for (let i = 0; i <= 512; i += 64) {
        sCtx.beginPath(); sCtx.moveTo(i, 0); sCtx.lineTo(i, 512); sCtx.stroke();
        sCtx.beginPath(); sCtx.moveTo(0, i); sCtx.lineTo(512, i); sCtx.stroke();
      }
      // Yellow tactile edge line
      sCtx.fillStyle = '#eab308';
      sCtx.fillRect(0, 480, 512, 32);
    }
    const sidewalkTex = new THREE.CanvasTexture(sidewalkCanvas);
    sidewalkTex.wrapS = THREE.RepeatWrapping;
    sidewalkTex.wrapT = THREE.RepeatWrapping;
    sidewalkTex.repeat.set(12, 2);

    const sidewalkMat = new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.82 });
    const sidewalkMesh = new THREE.Mesh(new THREE.PlaneGeometry(44, 6.0), sidewalkMat);
    sidewalkMesh.rotation.x = -Math.PI / 2;
    sidewalkMesh.position.set(0, 0.01, 8.0);
    scene.add(sidewalkMesh);

    // Concrete curb stone step (Bó vỉa hè)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const curbMesh = new THREE.Mesh(new THREE.BoxGeometry(44, 0.22, 0.35), curbMat);
    curbMesh.position.set(0, 0.0, 11.02);
    scene.add(curbMesh);

    // 2. Main Asphalt Road (Lòng đường chính)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.92, metalness: 0.05 });
    const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 14.0), roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, -0.11, 18.0);
    scene.add(roadMesh);

    // White dashed centerline on the road
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    for (let rx = -24; rx <= 24; rx += 4.0) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.22), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(rx, -0.10, 18.0);
      scene.add(dash);
    }

    // Continuous road edge lines
    const edgeLine1 = new THREE.Mesh(new THREE.PlaneGeometry(50, 0.18), lineMat);
    edgeLine1.rotation.x = -Math.PI / 2;
    edgeLine1.position.set(0, -0.10, 11.6);
    scene.add(edgeLine1);

    const edgeLine2 = new THREE.Mesh(new THREE.PlaneGeometry(50, 0.18), lineMat);
    edgeLine2.rotation.x = -Math.PI / 2;
    edgeLine2.position.set(0, -0.10, 24.4);
    scene.add(edgeLine2);

    // Yellow zebra pedestrian crossing in front of Cyber Cafe
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let rx = -2.2; rx <= 2.2; rx += 0.8) {
      const zebraStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 12.0), zebraMat);
      zebraStripe.rotation.x = -Math.PI / 2;
      zebraStripe.position.set(rx, -0.09, 18.0);
      scene.add(zebraStripe);
    }

    // Far sidewalk across the street
    const farSidewalk = new THREE.Mesh(new THREE.PlaneGeometry(50, 4.0), sidewalkMat);
    farSidewalk.rotation.x = -Math.PI / 2;
    farSidewalk.position.set(0, 0.01, 27.0);
    scene.add(farSidewalk);

    // Procedural Low-Poly Animated Vehicles on Road (Continuous Moving Traffic System)
    carsListRef.current = [];
    const createLowPolyCar = (posX: number, posZ: number, rotY: number, bodyColor: number, speed: number) => {
      const carGroup = new THREE.Group();
      carGroup.position.set(posX, 0.22, posZ);
      carGroup.rotation.y = rotY;

      // 1. Car body chassis (BoxGeometry)
      const carMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.4, roughness: 0.35 });
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.65, 1.7), carMat);
      carBody.position.set(0, 0.25, 0);
      carGroup.add(carBody);

      // 2. Smaller BoxGeometry for cabin & windows
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.15, metalness: 0.8 });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.58, 1.45), cabinMat);
      cabin.position.set(-0.2, 0.78, 0);
      carGroup.add(cabin);

      // Windshield glass plane
      const winMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.5 });
      const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.48), winMat);
      windshield.position.set(0.76, 0.78, 0);
      windshield.rotation.y = Math.PI / 2;
      windshield.rotation.z = -0.32;
      carGroup.add(windshield);

      // 3. 4 CylinderGeometry Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
      const wheelOffsets = [
        { x: 1.1, z: 0.85 },
        { x: 1.1, z: -0.85 },
        { x: -1.1, z: 0.85 },
        { x: -1.1, z: -0.85 },
      ];
      wheelOffsets.forEach(wo => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wo.x, 0.08, wo.z);
        carGroup.add(wheel);
      });

      // 4. Headlights & Taillights
      const headLedMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const tailLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.25), headLedMat);
      hlL.position.set(1.81, 0.26, 0.55);
      carGroup.add(hlL);

      const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.25), headLedMat);
      hlR.position.set(1.81, 0.26, -0.55);
      carGroup.add(hlR);

      const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.25), tailLedMat);
      tlL.position.set(-1.81, 0.32, 0.55);
      carGroup.add(tlL);

      const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.25), tailLedMat);
      tlR.position.set(-1.81, 0.32, -0.55);
      carGroup.add(tlR);

      scene.add(carGroup);
      carsListRef.current.push({ mesh: carGroup, speed, laneZ: posZ });
      return carGroup;
    };

    // Continuous Traffic Fleet across 2 Lanes:
    // Lane 1 (near side, z = 14.8, heading right rotY = 0, speed > 0):
    createLowPolyCar(-35.0, 14.8, 0, 0xef4444, 14.0); // Red sedan
    createLowPolyCar(-12.0, 14.8, 0, 0xf8fafc, 13.0); // White SUV
    createLowPolyCar(12.0, 14.8, 0, 0xeab308, 15.0);  // Yellow Taxi
    createLowPolyCar(34.0, 14.8, 0, 0xf97316, 14.5);  // Orange sports coupe

    // Lane 2 (far side, z = 21.2, heading left rotY = Math.PI, speed < 0):
    createLowPolyCar(38.0, 21.2, Math.PI, 0x2563eb, -15.0);  // Blue sedan
    createLowPolyCar(15.0, 21.2, Math.PI, 0x06b6d4, -14.0);  // Cyan compact
    createLowPolyCar(-10.0, 21.2, Math.PI, 0xa855f7, -15.5); // Purple coupe
    createLowPolyCar(-32.0, 21.2, Math.PI, 0x10b981, -13.5); // Green hatchback

    // Distant urban city buildings / cyberpunk skyline silhouette (excluding center bx = 0)
    const buildMatDark = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
    const winMatLite = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    [-18, -9, 9, 18].forEach((bx, idx) => {
      const bHeight = 12 + ((idx * 3) % 8);
      const bWidth = 7.5;
      const bDepth = 6.0;
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), buildMatDark);
      bMesh.position.set(bx, bHeight / 2 - 0.1, 32.0);
      scene.add(bMesh);

      // Distant window facade
      const winFace = new THREE.Mesh(new THREE.PlaneGeometry(bWidth * 0.8, bHeight * 0.6), winMatLite);
      winFace.position.set(bx, bHeight * 0.45, 28.9);
      winFace.rotation.y = Math.PI;
      scene.add(winFace);
    });

    // =========================================================================
    // 2. PC HARDWARE & UPGRADES STORE (Across the Street, centered at x = 0, z in [28.8, 35.2])
    // =========================================================================
    const hwStoreGroup = new THREE.Group();

    // Store Floor (High-tech dark tiled flooring)
    const hwFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.3,
    });
    const hwFloor = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 6.4), hwFloorMat);
    hwFloor.rotation.x = -Math.PI / 2;
    hwFloor.position.set(0, 0.02, 32.0);
    hwStoreGroup.add(hwFloor);

    // Store Walls Material
    const hwWallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.2 });
    const hwAccentMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    // Left Wall
    const hwLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 6.4), hwWallMat);
    hwLeftWall.position.set(-4.0, 2.3, 32.0);
    hwStoreGroup.add(hwLeftWall);

    // Right Wall
    const hwRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 6.4), hwWallMat);
    hwRightWall.position.set(4.0, 2.3, 32.0);
    hwStoreGroup.add(hwRightWall);

    // Back Wall
    const hwBackWall = new THREE.Mesh(new THREE.BoxGeometry(8.3, 4.6, 0.3), hwWallMat);
    hwBackWall.position.set(0, 2.3, 35.2);
    hwStoreGroup.add(hwBackWall);

    // Ceiling / Roof
    const hwCeiling = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.3, 6.4), hwAccentMat);
    hwCeiling.position.set(0, 4.6, 32.0);
    hwStoreGroup.add(hwCeiling);

    // Front Facade (Wide Open Entrance between x = -2.0 and +2.0)
    // Left front wall
    const hwFrontLeft = new THREE.Mesh(new THREE.BoxGeometry(1.9, 4.6, 0.3), hwWallMat);
    hwFrontLeft.position.set(-2.95, 2.3, 28.8);
    hwStoreGroup.add(hwFrontLeft);

    // Right front wall
    const hwFrontRight = new THREE.Mesh(new THREE.BoxGeometry(1.9, 4.6, 0.3), hwWallMat);
    hwFrontRight.position.set(2.95, 2.3, 28.8);
    hwStoreGroup.add(hwFrontRight);

    // Header beam above open doorway (height 3.2m clearance)
    const hwHeader = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 0.35), hwAccentMat);
    hwHeader.position.set(0, 3.9, 28.8);
    hwStoreGroup.add(hwHeader);

    // -------------------------------------------------------------------------
    // BRIGHT GLOWING NEON SIGN: 'PC HARDWARE & UPGRADES'
    // -------------------------------------------------------------------------
    const hwSignCanvas = document.createElement('canvas');
    hwSignCanvas.width = 1024;
    hwSignCanvas.height = 256;
    const hwSignCtx = hwSignCanvas.getContext('2d');
    if (hwSignCtx) {
      // Dark tech gradient background
      const grad = hwSignCtx.createLinearGradient(0, 0, 1024, 0);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      hwSignCtx.fillStyle = grad;
      hwSignCtx.fillRect(0, 0, 1024, 256);

      // Neon glowing border
      hwSignCtx.strokeStyle = '#06b6d4';
      hwSignCtx.lineWidth = 8;
      hwSignCtx.strokeRect(10, 10, 1004, 236);

      // Main glowing title 'PC HARDWARE & UPGRADES'
      hwSignCtx.shadowColor = '#00f0ff';
      hwSignCtx.shadowBlur = 26;
      hwSignCtx.fillStyle = '#38bdf8';
      hwSignCtx.font = '900 64px system-ui, -apple-system, sans-serif';
      hwSignCtx.textAlign = 'center';
      hwSignCtx.textBaseline = 'middle';
      hwSignCtx.fillText('PC HARDWARE & UPGRADES', 512, 100);

      // Inner text shine
      hwSignCtx.shadowBlur = 10;
      hwSignCtx.fillStyle = '#ffffff';
      hwSignCtx.fillText('PC HARDWARE & UPGRADES', 512, 100);

      // Subtitle
      hwSignCtx.shadowColor = '#f59e0b';
      hwSignCtx.shadowBlur = 14;
      hwSignCtx.fillStyle = '#fbbf24';
      hwSignCtx.font = '700 28px monospace';
      hwSignCtx.fillText('RTX 5090 • CORE i9 • DDR5 • THÙNG LINH KIỆN NÂNG CẤP', 512, 185);
    }
    const signTexture = new THREE.CanvasTexture(hwSignCanvas);
    const signBoardMat = new THREE.MeshBasicMaterial({ map: signTexture });
    const signBoardMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.35), signBoardMat);
    signBoardMesh.position.set(0, 4.3, 28.6);
    hwStoreGroup.add(signBoardMesh);

    // Glowing Neon Tube Rails (Top & Bottom of sign)
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const neonTop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 6.7, 12), neonCyanMat);
    neonTop.rotation.z = Math.PI / 2;
    neonTop.position.set(0, 5.0, 28.58);
    hwStoreGroup.add(neonTop);

    const neonBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 6.7, 12), neonAmberMat);
    neonBottom.rotation.z = Math.PI / 2;
    neonBottom.position.set(0, 3.6, 28.58);
    hwStoreGroup.add(neonBottom);

    // Store Interior Atmospheric Lighting (Cyan/Warm Fill)
    const hwStoreLight1 = new THREE.PointLight(0x38bdf8, 1.8, 12);
    hwStoreLight1.position.set(0, 3.8, 32.0);
    hwStoreGroup.add(hwStoreLight1);

    const hwStoreLight2 = new THREE.PointLight(0xfef08a, 1.2, 8);
    hwStoreLight2.position.set(0, 3.2, 30.5);
    hwStoreGroup.add(hwStoreLight2);

    // -------------------------------------------------------------------------
    // SHOP COUNTER (At z = 32.5, width 3.2m, height 1.05m)
    // -------------------------------------------------------------------------
    const hwCounterGroup = new THREE.Group();
    hwCounterGroup.position.set(0, 0, 32.5);

    // Main Counter Body
    const hwCounterBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5 });
    const hwCounterBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.05, 0.85), hwCounterBodyMat);
    hwCounterBody.position.set(0, 0.525, 0);
    hwCounterGroup.add(hwCounterBody);

    // Sleek Countertop
    const hwCounterTopMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 });
    const hwCounterTop = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.06, 0.95), hwCounterTopMat);
    hwCounterTop.position.set(0, 1.06, 0);
    hwCounterGroup.add(hwCounterTop);

    // Glowing Cyan LED Strip along front face of counter
    const hwCounterLed = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.04, 0.04), neonCyanMat);
    hwCounterLed.position.set(0, 0.95, -0.44);
    hwCounterGroup.add(hwCounterLed);

    // POS Cash Register / Terminal on counter
    const posMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const posBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.35), posMat);
    posBase.position.set(0.9, 1.15, 0);
    hwCounterGroup.add(posBase);

    const posScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.24, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    posScreen.position.set(0.9, 1.32, -0.05);
    posScreen.rotation.x = -0.25;
    hwCounterGroup.add(posScreen);

    // Display Box (GPU Graphics Card Box) on counter
    const gpuDisplayMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 }); // Nvidia green
    const gpuDisplayBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.18), gpuDisplayMat);
    gpuDisplayBox.position.set(-0.7, 1.22, 0);
    gpuDisplayBox.rotation.y = 0.3;
    hwCounterGroup.add(gpuDisplayBox);

    // Cardboard Parts Box Sample on counter
    const sampleBoxMat = new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.8 });
    const sampleBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.3), sampleBoxMat);
    sampleBox.position.set(-0.05, 1.18, 0.05);
    hwCounterGroup.add(sampleBox);

    hwStoreGroup.add(hwCounterGroup);

    // Stylized Shopkeeper NPC behind counter
    const shopkeeperGroup = new THREE.Group();
    shopkeeperGroup.position.set(0, 0, 33.7);

    // Body / Polo Shirt
    const skBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.26, 0.85, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 })
    );
    skBody.position.set(0, 1.1, 0);
    shopkeeperGroup.add(skBody);

    // Head
    const skHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 })
    );
    skHead.position.set(0, 1.68, 0);
    shopkeeperGroup.add(skHead);

    // Cap / Headset
    const skCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.08, 14),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
    );
    skCap.position.set(0, 1.84, 0);
    shopkeeperGroup.add(skCap);

    hwStoreGroup.add(shopkeeperGroup);

    // -------------------------------------------------------------------------
    // SHELVES DISPLAYING CARDBOARD BOXES (PC Parts)
    // -------------------------------------------------------------------------
    const shelfFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const shelfBoardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const boxCardboardMat = new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.85 });
    const boxGpuMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4 }); // Dark green GPU box
    const boxMotherboardMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.4 }); // Dark red MB box
    const boxCpuMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 }); // Intel blue CPU box

    const createShelfUnit = (shelfX: number, shelfZ: number, rotY: number) => {
      const shelfGroup = new THREE.Group();
      shelfGroup.position.set(shelfX, 0, shelfZ);
      shelfGroup.rotation.y = rotY;

      // Vertical 4 Upright Pillars
      const pGeo = new THREE.BoxGeometry(0.06, 3.2, 0.06);
      [
        { x: -1.4, z: -0.35 },
        { x: 1.4, z: -0.35 },
        { x: -1.4, z: 0.35 },
        { x: 1.4, z: 0.35 },
      ].forEach(p => {
        const pillar = new THREE.Mesh(pGeo, shelfFrameMat);
        pillar.position.set(p.x, 1.6, p.z);
        shelfGroup.add(pillar);
      });

      // 4 Tiered Shelves (Planks) at y = 0.5, 1.2, 1.9, 2.6
      const plankGeo = new THREE.BoxGeometry(2.9, 0.05, 0.75);
      [0.5, 1.2, 1.9, 2.6].forEach(plankY => {
        const plank = new THREE.Mesh(plankGeo, shelfBoardMat);
        plank.position.set(0, plankY, 0);
        shelfGroup.add(plank);

        // Procedural Cardboard Boxes on each tier (representing PC parts)
        const boxOffsets = [-1.0, -0.4, 0.2, 0.85];
        boxOffsets.forEach((bX, bIdx) => {
          const mat =
            (plankY > 2.0 && bIdx % 2 === 0) ? boxGpuMat :
            (plankY > 1.5 && bIdx % 2 === 1) ? boxMotherboardMat :
            (bIdx === 1) ? boxCpuMat : boxCardboardMat;
          const bW = 0.42 + (bIdx % 2) * 0.1;
          const bH = 0.28 + ((bIdx + Math.round(plankY)) % 2) * 0.08;
          const bD = 0.45;
          const pBox = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mat);
          pBox.position.set(bX, plankY + bH / 2 + 0.025, (bIdx % 2 === 0 ? 0.05 : -0.05));
          shelfGroup.add(pBox);
        });
      });

      return shelfGroup;
    };

    // Left wall shelves (x = -3.4, z = 32.0, facing center +X)
    const leftShelves = createShelfUnit(-3.4, 32.0, Math.PI / 2);
    hwStoreGroup.add(leftShelves);

    // Right wall shelves (x = 3.4, z = 32.0, facing center -X)
    const rightShelves = createShelfUnit(3.4, 32.0, -Math.PI / 2);
    hwStoreGroup.add(rightShelves);

    scene.add(hwStoreGroup);

    // 3. Streetlights with Street Lamps & PointLights
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xfff3b0, emissiveIntensity: 2.2 });
    const streetLightPositions = [-13.0, -6.5, 0.0, 6.5, 13.0];

    streetLightPositions.forEach(slX => {
      const slGroup = new THREE.Group();
      slGroup.position.set(slX, 0, 10.5);

      // Vertical steel pole (height 5.2m)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.2, 12), poleMat);
      pole.position.set(0, 2.6, 0);
      slGroup.add(pole);

      // Curved arm reaching towards road
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.2), poleMat);
      arm.position.set(0, 5.15, 0.5);
      slGroup.add(arm);

      // Lamp fixture head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.5), lampHeadMat);
      head.position.set(0, 5.1, 1.0);
      slGroup.add(head);

      // Warm PointLight
      const sLight = new THREE.PointLight(0xffeedd, 1.4, 15.0, 1.6);
      sLight.position.set(0, 4.8, 1.0);
      slGroup.add(sLight);

      scene.add(slGroup);
    });

    // 4. Skybox & Day/Night Directional Light
    const skyGeo = new THREE.SphereGeometry(95, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x070b19, side: THREE.BackSide });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    const dirMoonLight = new THREE.DirectionalLight(0xdbeafe, 1.1);
    dirMoonLight.position.set(12, 28, 18);
    scene.add(dirMoonLight);

    const outdoorAmbient = new THREE.AmbientLight(0x283548, 0.65);
    scene.add(outdoorAmbient);

    // C. Adjacent Empty Buildings (Left & Right Storefronts)
    // =======================================================
    // 1. LEFT BUILDING: Mặt Bằng 01 (Storefront A at x in [-12.75, -4.25])
    const storeMat = new THREE.MeshStandardMaterial({ color: 0x1e2532, roughness: 0.85, side: THREE.DoubleSide });
    const storeGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x64748b, transparent: true, opacity: 0.4, roughness: 0.1 });

    // Left building shell
    const prop01Group = new THREE.Group();
    prop01Group.position.set(-8.5, 0, -0.4);

    // Floor of Property 01
    const p1Floor = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 11.0), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }));
    p1Floor.rotation.x = -Math.PI / 2;
    p1Floor.position.set(0, 0.01, 0);
    prop01Group.add(p1Floor);

    // Left outer wall
    const p1LeftWall = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 4.2), storeMat);
    p1LeftWall.position.set(-4.25, 2.1, 0);
    p1LeftWall.rotation.y = Math.PI / 2;
    prop01Group.add(p1LeftWall);

    // Back wall
    const p1BackWall = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.2), storeMat);
    p1BackWall.position.set(0, 2.1, -5.5);
    prop01Group.add(p1BackWall);

    // Ceiling
    const p1Ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 11.0), storeMat);
    p1Ceiling.rotation.x = Math.PI / 2;
    p1Ceiling.position.set(0, 4.2, 0);
    prop01Group.add(p1Ceiling);

    // Front facade wall with display window (at local z = 5.45 => world z = 5.05)
    const p1FrontLeft = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.2), storeMat);
    p1FrontLeft.position.set(-2.75, 2.1, 5.45);
    p1FrontLeft.rotation.y = Math.PI;
    prop01Group.add(p1FrontLeft);

    const p1FrontRight = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.2), storeMat);
    p1FrontRight.position.set(2.75, 2.1, 5.45);
    p1FrontRight.rotation.y = Math.PI;
    prop01Group.add(p1FrontRight);

    const p1FrontLintel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.4), storeMat);
    p1FrontLintel.position.set(0, 3.5, 5.45);
    p1FrontLintel.rotation.y = Math.PI;
    prop01Group.add(p1FrontLintel);

    // Display glass windows on facade
    const p1DisplayWin1 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), storeGlassMat);
    p1DisplayWin1.position.set(-2.75, 1.6, 5.43);
    p1DisplayWin1.rotation.y = Math.PI;
    prop01Group.add(p1DisplayWin1);

    const p1DisplayWin2 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), storeGlassMat);
    p1DisplayWin2.position.set(2.75, 1.6, 5.43);
    p1DisplayWin2.rotation.y = Math.PI;
    prop01Group.add(p1DisplayWin2);

    // Storefront header signboard
    const p1HeaderCanvas = document.createElement('canvas');
    p1HeaderCanvas.width = 512;
    p1HeaderCanvas.height = 96;
    const p1HCtx = p1HeaderCanvas.getContext('2d');
    if (p1HCtx) {
      p1HCtx.fillStyle = '#1e1b4b';
      p1HCtx.fillRect(0, 0, 512, 96);
      p1HCtx.strokeStyle = '#f59e0b';
      p1HCtx.lineWidth = 4;
      p1HCtx.strokeRect(4, 4, 504, 88);
      p1HCtx.fillStyle = '#f59e0b';
      p1HCtx.font = 'bold 28px sans-serif';
      p1HCtx.textAlign = 'center';
      p1HCtx.fillText('MẶT BẰNG 01 • PHÍA TÂY', 256, 42);
      p1HCtx.fillStyle = '#fef08a';
      p1HCtx.font = 'bold 20px monospace';
      p1HCtx.fillText('KHU VIP GAMING • 5.000.000 VNĐ', 256, 75);
    }
    const p1HeaderTex = new THREE.CanvasTexture(p1HeaderCanvas);
    const p1HeaderSign = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 0.7), new THREE.MeshBasicMaterial({ map: p1HeaderTex }));
    p1HeaderSign.position.set(0, 3.65, 5.48);
    prop01Group.add(p1HeaderSign);

    // Door Pivot & Closed Door
    const prop01DoorPivot = new THREE.Group();
    prop01DoorPivot.position.set(1.0, 0, 5.45);
    const prop01DoorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 })
    );
    prop01DoorMesh.position.set(-1.0, 1.3, 0);
    // Closed glass window in door
    const p1DoorGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), storeGlassMat);
    p1DoorGlass.position.set(-1.0, 1.4, 0.05);
    prop01DoorPivot.add(prop01DoorMesh);
    prop01DoorPivot.add(p1DoorGlass);
    prop01Group.add(prop01DoorPivot);

    // 4 Interior Lights of Property 01 (Initially dark/turned OFF)
    const p1Light1 = new THREE.PointLight(0xffedd5, 0, 12);
    p1Light1.position.set(-2.0, 3.2, 1.5);
    p1Light1.visible = false;
    prop01Group.add(p1Light1);

    const p1Light2 = new THREE.PointLight(0xffedd5, 0, 12);
    p1Light2.position.set(2.0, 3.2, 1.5);
    p1Light2.visible = false;
    prop01Group.add(p1Light2);

    const p1Light3 = new THREE.PointLight(0xffedd5, 0, 12);
    p1Light3.position.set(-2.0, 3.2, -2.5);
    p1Light3.visible = false;
    prop01Group.add(p1Light3);

    const p1Light4 = new THREE.PointLight(0xffedd5, 0, 12);
    p1Light4.position.set(2.0, 3.2, -2.5);
    p1Light4.visible = false;
    prop01Group.add(p1Light4);

    scene.add(prop01Group);

    // 'FOR SALE' (BÁN MẶT BẰNG) 3D Holographic Board 01
    const prop01SignGroup = new THREE.Group();
    prop01SignGroup.position.set(-7.5, 1.7, 5.38);

    const sign01Canvas = document.createElement('canvas');
    sign01Canvas.width = 512;
    sign01Canvas.height = 340;
    const s01Ctx = sign01Canvas.getContext('2d');
    if (s01Ctx) {
      s01Ctx.fillStyle = '#0f172a';
      s01Ctx.fillRect(0, 0, 512, 340);
      s01Ctx.strokeStyle = '#f59e0b';
      s01Ctx.lineWidth = 8;
      s01Ctx.strokeRect(8, 8, 496, 324);

      s01Ctx.fillStyle = '#b45309';
      s01Ctx.fillRect(16, 16, 480, 56);
      s01Ctx.fillStyle = '#ffffff';
      s01Ctx.font = 'bold 32px sans-serif';
      s01Ctx.textAlign = 'center';
      s01Ctx.fillText('🏢 BÁN MẶT BẰNG 01', 256, 56);

      s01Ctx.fillStyle = '#ef4444';
      s01Ctx.font = '900 48px sans-serif';
      s01Ctx.fillText('FOR SALE', 256, 135);

      s01Ctx.fillStyle = '#f59e0b';
      s01Ctx.font = 'bold 36px monospace';
      s01Ctx.fillText('GIÁ: 5.000.000 VNĐ', 256, 195);

      s01Ctx.fillStyle = '#22c55e';
      s01Ctx.font = 'bold 26px sans-serif';
      s01Ctx.fillText('[E] Mua Mặt Bằng Mở Rộng', 256, 255);

      s01Ctx.fillStyle = '#94a3b8';
      s01Ctx.font = '18px sans-serif';
      s01Ctx.fillText('Không gian 85m² • Mở khóa cửa & Dỡ bỏ rào', 256, 298);
    }
    const sign01Tex = new THREE.CanvasTexture(sign01Canvas);
    const sign01Board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.25),
      new THREE.MeshBasicMaterial({ map: sign01Tex })
    );
    prop01SignGroup.add(sign01Board);

    const sign01Frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.35, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.5 })
    );
    sign01Frame.position.set(0, 0, -0.05);
    prop01SignGroup.add(sign01Frame);

    const sign01Light = new THREE.PointLight(0xf59e0b, 1.3, 4.5);
    sign01Light.position.set(0, 0, 0.4);
    prop01SignGroup.add(sign01Light);

    scene.add(prop01SignGroup);

    // Store references into propertiesRef
    propertiesRef.current[0].signGroup = prop01SignGroup;
    propertiesRef.current[0].doorPivot = prop01DoorPivot;
    propertiesRef.current[0].interiorLights = [p1Light1, p1Light2, p1Light3, p1Light4];

    // 2. RIGHT BUILDING: Mặt Bằng 02 (Storefront B at x in [4.25, 12.75])
    const prop02Group = new THREE.Group();
    prop02Group.position.set(8.5, 0, -0.4);

    // Floor of Property 02
    const p2Floor = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 11.0), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }));
    p2Floor.rotation.x = -Math.PI / 2;
    p2Floor.position.set(0, 0.01, 0);
    prop02Group.add(p2Floor);

    // Right outer wall
    const p2RightWall = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 4.2), storeMat);
    p2RightWall.position.set(4.25, 2.1, 0);
    p2RightWall.rotation.y = -Math.PI / 2;
    prop02Group.add(p2RightWall);

    // Back wall
    const p2BackWall = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.2), storeMat);
    p2BackWall.position.set(0, 2.1, -5.5);
    prop02Group.add(p2BackWall);

    // Ceiling
    const p2Ceiling = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 11.0), storeMat);
    p2Ceiling.rotation.x = Math.PI / 2;
    p2Ceiling.position.set(0, 4.2, 0);
    prop02Group.add(p2Ceiling);

    // Front facade wall with display window
    const p2FrontLeft = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.2), storeMat);
    p2FrontLeft.position.set(-2.75, 2.1, 5.45);
    p2FrontLeft.rotation.y = Math.PI;
    prop02Group.add(p2FrontLeft);

    const p2FrontRight = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.2), storeMat);
    p2FrontRight.position.set(2.75, 2.1, 5.45);
    p2FrontRight.rotation.y = Math.PI;
    prop02Group.add(p2FrontRight);

    const p2FrontLintel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.4), storeMat);
    p2FrontLintel.position.set(0, 3.5, 5.45);
    p2FrontLintel.rotation.y = Math.PI;
    prop02Group.add(p2FrontLintel);

    const p2DisplayWin1 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), storeGlassMat);
    p2DisplayWin1.position.set(-2.75, 1.6, 5.43);
    p2DisplayWin1.rotation.y = Math.PI;
    prop02Group.add(p2DisplayWin1);

    const p2DisplayWin2 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), storeGlassMat);
    p2DisplayWin2.position.set(2.75, 1.6, 5.43);
    p2DisplayWin2.rotation.y = Math.PI;
    prop02Group.add(p2DisplayWin2);

    // Storefront header signboard
    const p2HeaderCanvas = document.createElement('canvas');
    p2HeaderCanvas.width = 512;
    p2HeaderCanvas.height = 96;
    const p2HCtx = p2HeaderCanvas.getContext('2d');
    if (p2HCtx) {
      p2HCtx.fillStyle = '#042f2e';
      p2HCtx.fillRect(0, 0, 512, 96);
      p2HCtx.strokeStyle = '#06b6d4';
      p2HCtx.lineWidth = 4;
      p2HCtx.strokeRect(4, 4, 504, 88);
      p2HCtx.fillStyle = '#06b6d4';
      p2HCtx.font = 'bold 28px sans-serif';
      p2HCtx.textAlign = 'center';
      p2HCtx.fillText('MẶT BẰNG 02 • PHÍA ĐÔNG', 256, 42);
      p2HCtx.fillStyle = '#67e8f9';
      p2HCtx.font = 'bold 20px monospace';
      p2HCtx.fillText('KHU ĐẤU GIẢI ESPORTS • 5.000.000 VNĐ', 256, 75);
    }
    const p2HeaderTex = new THREE.CanvasTexture(p2HeaderCanvas);
    const p2HeaderSign = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 0.7), new THREE.MeshBasicMaterial({ map: p2HeaderTex }));
    p2HeaderSign.position.set(0, 3.65, 5.48);
    prop02Group.add(p2HeaderSign);

    // Door Pivot & Closed Door
    const prop02DoorPivot = new THREE.Group();
    prop02DoorPivot.position.set(-1.0, 0, 5.45);
    const prop02DoorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 })
    );
    prop02DoorMesh.position.set(1.0, 1.3, 0);
    const p2DoorGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), storeGlassMat);
    p2DoorGlass.position.set(1.0, 1.4, 0.05);
    prop02DoorPivot.add(prop02DoorMesh);
    prop02DoorPivot.add(p2DoorGlass);
    prop02Group.add(prop02DoorPivot);

    // 4 Interior Lights of Property 02 (Initially dark/turned OFF)
    const p2Light1 = new THREE.PointLight(0xe0f2fe, 0, 12);
    p2Light1.position.set(-2.0, 3.2, 1.5);
    p2Light1.visible = false;
    prop02Group.add(p2Light1);

    const p2Light2 = new THREE.PointLight(0xe0f2fe, 0, 12);
    p2Light2.position.set(2.0, 3.2, 1.5);
    p2Light2.visible = false;
    prop02Group.add(p2Light2);

    const p2Light3 = new THREE.PointLight(0xe0f2fe, 0, 12);
    p2Light3.position.set(-2.0, 3.2, -2.5);
    p2Light3.visible = false;
    prop02Group.add(p2Light3);

    const p2Light4 = new THREE.PointLight(0xe0f2fe, 0, 12);
    p2Light4.position.set(2.0, 3.2, -2.5);
    p2Light4.visible = false;
    prop02Group.add(p2Light4);

    scene.add(prop02Group);

    // 'FOR SALE' (BÁN MẶT BẰNG) 3D Holographic Board 02
    const prop02SignGroup = new THREE.Group();
    prop02SignGroup.position.set(7.5, 1.7, 5.38);

    const sign02Canvas = document.createElement('canvas');
    sign02Canvas.width = 512;
    sign02Canvas.height = 340;
    const s02Ctx = sign02Canvas.getContext('2d');
    if (s02Ctx) {
      s02Ctx.fillStyle = '#0f172a';
      s02Ctx.fillRect(0, 0, 512, 340);
      s02Ctx.strokeStyle = '#06b6d4';
      s02Ctx.lineWidth = 8;
      s02Ctx.strokeRect(8, 8, 496, 324);

      s02Ctx.fillStyle = '#0e7490';
      s02Ctx.fillRect(16, 16, 480, 56);
      s02Ctx.fillStyle = '#ffffff';
      s02Ctx.font = 'bold 32px sans-serif';
      s02Ctx.textAlign = 'center';
      s02Ctx.fillText('🏢 BÁN MẶT BẰNG 02', 256, 56);

      s02Ctx.fillStyle = '#38bdf8';
      s02Ctx.font = '900 48px sans-serif';
      s02Ctx.fillText('FOR SALE', 256, 135);

      s02Ctx.fillStyle = '#f59e0b';
      s02Ctx.font = 'bold 36px monospace';
      s02Ctx.fillText('GIÁ: 5.000.000 VNĐ', 256, 195);

      s02Ctx.fillStyle = '#22c55e';
      s02Ctx.font = 'bold 26px sans-serif';
      s02Ctx.fillText('[E] Mua Mặt Bằng Mở Rộng', 256, 255);

      s02Ctx.fillStyle = '#94a3b8';
      s02Ctx.font = '18px sans-serif';
      s02Ctx.fillText('Không gian 85m² • Mở khóa cửa & Dỡ bỏ rào', 256, 298);
    }
    const sign02Tex = new THREE.CanvasTexture(sign02Canvas);
    const sign02Board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.25),
      new THREE.MeshBasicMaterial({ map: sign02Tex })
    );
    prop02SignGroup.add(sign02Board);

    const sign02Frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.35, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.5 })
    );
    sign02Frame.position.set(0, 0, -0.05);
    prop02SignGroup.add(sign02Frame);

    const sign02Light = new THREE.PointLight(0x06b6d4, 1.3, 4.5);
    sign02Light.position.set(0, 0, 0.4);
    prop02SignGroup.add(sign02Light);

    scene.add(prop02SignGroup);

    // Store references into propertiesRef
    propertiesRef.current[1].signGroup = prop02SignGroup;
    propertiesRef.current[1].doorPivot = prop02DoorPivot;
    propertiesRef.current[1].interiorLights = [p2Light1, p2Light2, p2Light3, p2Light4];

    // --- GAME SCREEN MATERIALS ---
    const createScreenCanvas = (stationId: number) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 320;
      const ctx = c.getContext('2d');
      if (ctx) {
        // Dark cyberpunk battlefield scene
        ctx.fillStyle = '#090d18';
        ctx.fillRect(0, 0, 512, 320);

        // Top match HUD
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 0, 512, 42);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`CYBER STRIKE ONLINE • MÁY 0${stationId}`, 20, 28);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('RANK: THÁCH ĐẤU • 240 FPS', 320, 28);

        // Minimap radar in top-right
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(440, 110, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Crosshair reticle
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(256, 160, 16, 0, Math.PI * 2);
        ctx.moveTo(256, 135); ctx.lineTo(256, 185);
        ctx.moveTo(231, 160); ctx.lineTo(281, 160);
        ctx.stroke();

        // Bottom Combat HUD (Health & Ammo)
        ctx.fillStyle = '#10b981';
        ctx.fillRect(40, 260, 160, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('100 HP | 100 AP', 50, 278);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('30 / 90 [AK-47]', 340, 280);
      }
      return c;
    };

    const screenOffMat = new THREE.MeshStandardMaterial({ color: 0x05070d, roughness: 0.1 });

    // --- HIGH-END 3D BATTLESTATION BUILDER ---
    // Curved monitors, RGB PC cases, Mechanical keyboards, Desk mats, Ergonomic gaming chairs
    const buildStation = (id: number, name: string, posX: number, posZ: number): StationUpgradeState => {
      const group = new THREE.Group();
      group.position.set(posX, 0, posZ);

      // 1. Sleek Modern Gaming Desk (Carbon-fiber top & Red LED trim)
      const deskTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.05, 0.88),
        new THREE.MeshStandardMaterial({ color: 0x161e2e, roughness: 0.35 })
      );
      deskTop.position.set(0, 0.75, 0);
      group.add(deskTop);

      // Front red LED edge trim on desk
      const deskLed = new THREE.Mesh(
        new THREE.BoxGeometry(1.58, 0.015, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      deskLed.position.set(0, 0.75, 0.44);
      group.add(deskLed);

      // Angled black powder-coated steel legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8, roughness: 0.3 });
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.75), legMat);
      legL.position.set(-0.72, 0.375, 0);
      group.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.75), legMat);
      legR.position.set(0.72, 0.375, 0);
      group.add(legR);

      // 2. Large Red-and-Black Desk Mat
      const matMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const deskMatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.006, 0.44), matMat);
      deskMatMesh.position.set(0, 0.778, 0.05);
      group.add(deskMatMesh);

      const matBorder = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 0.004, 0.45),
        new THREE.MeshBasicMaterial({ color: 0xdc2626 })
      );
      matBorder.position.set(0, 0.776, 0.05);
      group.add(matBorder);

      // 3. Mechanical Keyboard with RGB Backlighting
      const kbdGroup = new THREE.Group();
      kbdGroup.position.set(-0.06, 0.785, 0.05);

      const kbdBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.015, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.7 })
      );
      kbdGroup.add(kbdBase);

      const kbdKeys = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.012, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
      );
      kbdKeys.position.set(0, 0.01, 0);
      kbdGroup.add(kbdKeys);

      const kbdRgb = new THREE.Mesh(
        new THREE.BoxGeometry(0.43, 0.005, 0.13),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      kbdRgb.position.set(0, 0.006, 0);
      kbdGroup.add(kbdRgb);
      group.add(kbdGroup);

      // 4. Ergonomic Gaming Mouse with RGB Scroll Wheel
      const mouseMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.024, 0.11),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.3 })
      );
      mouseMesh.position.set(0.28, 0.792, 0.05);
      group.add(mouseMesh);

      const mouseLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.008, 0.03),
        new THREE.MeshBasicMaterial({ color: 0xd946ef })
      );
      mouseLed.position.set(0.28, 0.804, 0.04);
      group.add(mouseLed);

      // 5. Gaming Headset resting on Stand
      const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8), legMat);
      standPole.position.set(-0.62, 0.94, -0.15);
      group.add(standPole);

      const headsetBand = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      headsetBand.rotation.x = Math.PI;
      headsetBand.position.set(-0.62, 1.08, -0.15);
      group.add(headsetBand);

      // 6. Large Curved Gaming Monitor
      const monitorGroup = new THREE.Group();
      monitorGroup.position.set(0, 1.15, -0.22);

      // V-shaped Metal Gaming Stand & Neck
      const standV = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.22), legMat);
      standV.position.set(0, -0.37, 0.06);
      monitorGroup.add(standV);

      const standNeck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.05), legMat);
      standNeck.position.set(0, -0.18, 0);
      monitorGroup.add(standNeck);

      // Curved Screen Multi-Segment Frame
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.85, roughness: 0.2 });
      const centerFrame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.52, 0.03), frameMat);
      monitorGroup.add(centerFrame);

      const leftFrameWing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.03), frameMat);
      leftFrameWing.position.set(-0.36, 0, 0.03);
      leftFrameWing.rotation.y = 0.22;
      monitorGroup.add(leftFrameWing);

      const rightFrameWing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.03), frameMat);
      rightFrameWing.position.set(0.36, 0, 0.03);
      rightFrameWing.rotation.y = -0.22;
      monitorGroup.add(rightFrameWing);

      // Curved Screen Displays
      const sCanvas = createScreenCanvas(id);
      const sTex = new THREE.CanvasTexture(sCanvas);
      const screenOnMat = new THREE.MeshBasicMaterial({ map: sTex });

      const centerScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.48), screenOffMat);
      centerScreen.position.set(0, 0, 0.016);
      monitorGroup.add(centerScreen);

      const leftScreenWing = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.48), screenOffMat);
      leftScreenWing.position.set(-0.35, 0, 0.046);
      leftScreenWing.rotation.y = 0.22;
      monitorGroup.add(leftScreenWing);

      const rightScreenWing = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.48), screenOffMat);
      rightScreenWing.position.set(0.35, 0, 0.046);
      rightScreenWing.rotation.y = -0.22;
      monitorGroup.add(rightScreenWing);

      // Ambient screen glow light
      const screenLight = new THREE.PointLight(0x00f0ff, 0, 3.8);
      screenLight.position.set(0, 0, 0.3);
      monitorGroup.add(screenLight);

      group.add(monitorGroup);

      // 7. High-End Gaming PC Case (Transparent glass side panel & Glowing RGB fans & GPU)
      const pcGroup = new THREE.Group();
      pcGroup.position.set(0.62, 1.02, 0);

      // PC Chassis Frame
      const pcChassis = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.52, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.85, roughness: 0.2 })
      );
      pcGroup.add(pcChassis);

      // Left Transparent Tempered Glass Panel
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.32,
        roughness: 0.05,
        metalness: 0.1,
      });
      const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.48, 0.46), glassMat);
      glassPanel.position.set(-0.126, 0, 0);
      pcGroup.add(glassPanel);

      // 3 Front RGB Intake Fans (Vertical trio of glowing rings matching image.png)
      const fanRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const fanInnerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      for (let f = 0; f < 3; f++) {
        const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.014, 8, 20), fanRingMat);
        fanRing.position.set(0, -0.15 + f * 0.15, 0.252);
        pcGroup.add(fanRing);

        const fanCenter = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), fanInnerMat);
        fanCenter.position.set(0, -0.15 + f * 0.15, 0.252);
        pcGroup.add(fanCenter);
      }

      // Internal GPU (Graphics Card with glowing GEFORCE RTX side logo)
      const gpuBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.28), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
      gpuBody.position.set(-0.04, -0.05, 0);
      pcGroup.add(gpuBody);

      const gpuLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.025, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.5 })
      );
      gpuLed.position.set(-0.08, -0.05, 0);
      pcGroup.add(gpuLed);

      // Dual RGB RAM Sticks
      const ramLed1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.06, 0.012), new THREE.MeshBasicMaterial({ color: 0xd946ef }));
      ramLed1.position.set(-0.04, 0.14, -0.06);
      pcGroup.add(ramLed1);

      const ramLed2 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.06, 0.012), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      ramLed2.position.set(-0.04, 0.14, -0.03);
      pcGroup.add(ramLed2);

      // AIO Liquid CPU Cooler Ring & Sleeved Tubing
      const aioRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 16), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      aioRing.rotation.y = Math.PI / 2;
      aioRing.position.set(-0.06, 0.08, -0.1);
      pcGroup.add(aioRing);

      group.add(pcGroup);

      // 8. Ergonomic High-Back Gaming Chair (Red & Black Racing Bucket Seat)
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 0.65);

      // 5-Star Spider Base at Floor & Caster Wheels
      const spiderMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 });
      const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 8), spiderMat);
      chairBase.position.set(0, 0.06, 0);
      chairGroup.add(chairBase);

      const chairPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8), spiderMat);
      chairPiston.position.set(0, 0.25, 0);
      chairGroup.add(chairPiston);

      // Bucket Seat Cushion (Black Center, Red Wings)
      const seatMatBlack = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 });
      const seatMatRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });

      const seatCenter = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.46), seatMatBlack);
      seatCenter.position.set(0, 0.46, 0);
      chairGroup.add(seatCenter);

      const seatWingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.46), seatMatRed);
      seatWingL.position.set(-0.22, 0.49, 0);
      seatWingL.rotation.z = -0.15;
      chairGroup.add(seatWingL);

      const seatWingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.46), seatMatRed);
      seatWingR.position.set(0.22, 0.49, 0);
      seatWingR.rotation.z = 0.15;
      chairGroup.add(seatWingR);

      // Racing High Backrest with Shoulders & Harness Cutouts
      const backGroup = new THREE.Group();
      backGroup.position.set(0, 0.52, 0.20);
      backGroup.rotation.x = 0.08;

      const backCenter = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.07), seatMatBlack);
      backCenter.position.set(0, 0.36, 0);
      backGroup.add(backCenter);

      const backWingL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.65, 0.07), seatMatRed);
      backWingL.position.set(-0.21, 0.34, 0.02);
      backWingL.rotation.y = -0.25;
      backGroup.add(backWingL);

      const backWingR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.65, 0.07), seatMatRed);
      backWingR.position.set(0.21, 0.34, 0.02);
      backWingR.rotation.y = 0.25;
      backGroup.add(backWingR);

      // Red Neck Pillow at Headrest
      const neckPillow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.07), seatMatRed);
      neckPillow.position.set(0, 0.64, 0.04);
      backGroup.add(neckPillow);

      // Red Lumbar Cushion
      const lumbarPillow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.06), seatMatRed);
      lumbarPillow.position.set(0, 0.12, 0.04);
      backGroup.add(lumbarPillow);

      chairGroup.add(backGroup);

      // 3D Padded Armrests
      [-0.24, 0.24].forEach(armX => {
        const armPole = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.04), spiderMat);
        armPole.position.set(armX, 0.55, 0);
        chairGroup.add(armPole);

        const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.24), seatMatBlack);
        armPad.position.set(armX, 0.66, 0.02);
        chairGroup.add(armPad);
      });

      group.add(chairGroup);
      scene.add(group);

      return {
        id,
        name,
        position: new THREE.Vector3(posX, 1.0, posZ),
        sitPoint: new THREE.Vector3(posX, 0, posZ + 0.65),
        isOccupied: false,
        timeRemaining: 0,
        currentCustomerType: '',
        totalEarnedFromStation: 0,
        monitorLevel: 1,
        gpuLevel: 1,
        ramLevel: 1,
        stationGroup: group,
        screenMesh: centerScreen,
        monitorFrameMesh: centerFrame,
        screenLight: screenLight,
        pcCaseLedMesh: gpuLed,
        screenOnMat: screenOnMat,
        screenOffMat: screenOffMat,
        screenWingMeshes: [leftScreenWing, rightScreenWing],
      };
    };

    // SYMMETRICAL TWO-ROW CYBER LAYOUT WITH CLEAR CENTRAL AISLE
    // Left Row: 3 Battlestations (x = -2.2)
    // Right Row: 3 Battlestations (x = +2.2)
    stationsRef.current = [
      buildStation(1, 'Máy 01', -2.2, -2.4),
      buildStation(2, 'Máy 02', -2.2, -0.5),
      buildStation(3, 'Máy 03', -2.2, 1.4),
      buildStation(4, 'Máy 04', 2.2, -2.4),
      buildStation(5, 'Máy 05', 2.2, -0.5),
      buildStation(6, 'Máy 06', 2.2, 1.4),
    ];

    // --- OBJECT COLLIDERS & RIGIDBODY HITBOX SYSTEM ---
    // Precise bounding box colliders for walls, service counter, rule board, snack shelves, cooler, stations, and street properties
    const colliders: { name: string; min: THREE.Vector3; max: THREE.Vector3 }[] = [
      // 1. Boundary Walls Cyber Cafe (Corridor x in [-1.1, 1.1] is OPEN for walking outside)
      { name: 'LeftWall', min: new THREE.Vector3(-5.0, 0, -4.8), max: new THREE.Vector3(-4.10, 4.0, 5.2) },
      { name: 'RightWall', min: new THREE.Vector3(3.85, 0, -6.5), max: new THREE.Vector3(5.0, 4.0, 5.2) },
      { name: 'RuleBoardBuffer', min: new THREE.Vector3(3.70, 0, 2.05), max: new THREE.Vector3(4.30, 4.0, 4.15) },
      { name: 'BackWall_Main', min: new THREE.Vector3(-1.10, 0, -6.5), max: new THREE.Vector3(4.5, 4.0, -5.9) },
      { name: 'FrontEntranceWall_Left', min: new THREE.Vector3(-4.5, 0, 4.85), max: new THREE.Vector3(-1.1, 4.0, 5.25) },
      { name: 'FrontEntranceWall_Right', min: new THREE.Vector3(1.1, 0, 4.85), max: new THREE.Vector3(4.5, 4.0, 5.25) },

      // 1B. REBUILT VIP Room Outer Perimeter & Door Colliders (Width 5.80m, Depth 9.40m)
      { name: 'VipFrontLeft', min: new THREE.Vector3(-5.95, 0, -4.95), max: new THREE.Vector3(-3.90, 4.0, -4.65) },
      { name: 'VipFrontRight', min: new THREE.Vector3(-2.10, 0, -4.95), max: new THREE.Vector3(-0.05, 4.0, -4.65) },
      { name: 'VipDoorCollider', min: new THREE.Vector3(-3.92, 0, -4.95), max: new THREE.Vector3(-2.08, 3.0, -4.65) },
      { name: 'VipRightWall', min: new THREE.Vector3(-0.15, 0, -14.3), max: new THREE.Vector3(0.05, 4.0, -4.75) },
      { name: 'VipLeftWall', min: new THREE.Vector3(-5.95, 0, -14.3), max: new THREE.Vector3(-5.75, 4.0, -4.75) },
      { name: 'VipBackWall', min: new THREE.Vector3(-5.95, 0, -14.35), max: new THREE.Vector3(-0.05, 4.0, -14.05) },
      // 10 Non-overlapping BoxColliders on Desks & CapsuleColliders on Chairs (5 Left, 5 Right)
      // Left Row Desks & Chairs (x_desk = -5.40, x_chair = -4.50, spacing 1.5m)
      { name: 'VipDesk_L_0', min: new THREE.Vector3(-5.85, 0, -7.00), max: new THREE.Vector3(-4.95, 1.6, -6.00) },
      { name: 'VipChair_L_0', min: new THREE.Vector3(-4.80, 0, -6.85), max: new THREE.Vector3(-4.20, 1.4, -6.15) },
      { name: 'VipDesk_L_1', min: new THREE.Vector3(-5.85, 0, -8.50), max: new THREE.Vector3(-4.95, 1.6, -7.50) },
      { name: 'VipChair_L_1', min: new THREE.Vector3(-4.80, 0, -8.35), max: new THREE.Vector3(-4.20, 1.4, -7.65) },
      { name: 'VipDesk_L_2', min: new THREE.Vector3(-5.85, 0, -10.00), max: new THREE.Vector3(-4.95, 1.6, -9.00) },
      { name: 'VipChair_L_2', min: new THREE.Vector3(-4.80, 0, -9.85), max: new THREE.Vector3(-4.20, 1.4, -9.15) },
      { name: 'VipDesk_L_3', min: new THREE.Vector3(-5.85, 0, -11.50), max: new THREE.Vector3(-4.95, 1.6, -10.50) },
      { name: 'VipChair_L_3', min: new THREE.Vector3(-4.80, 0, -11.35), max: new THREE.Vector3(-4.20, 1.4, -10.65) },
      { name: 'VipDesk_L_4', min: new THREE.Vector3(-5.85, 0, -13.00), max: new THREE.Vector3(-4.95, 1.6, -12.00) },
      { name: 'VipChair_L_4', min: new THREE.Vector3(-4.80, 0, -12.85), max: new THREE.Vector3(-4.20, 1.4, -12.15) },
      // Right Row Desks & Chairs (x_desk = -0.60, x_chair = -1.50, spacing 1.5m)
      { name: 'VipDesk_R_0', min: new THREE.Vector3(-1.05, 0, -7.00), max: new THREE.Vector3(-0.15, 1.6, -6.00) },
      { name: 'VipChair_R_0', min: new THREE.Vector3(-1.80, 0, -6.85), max: new THREE.Vector3(-1.20, 1.4, -6.15) },
      { name: 'VipDesk_R_1', min: new THREE.Vector3(-1.05, 0, -8.50), max: new THREE.Vector3(-0.15, 1.6, -7.50) },
      { name: 'VipChair_R_1', min: new THREE.Vector3(-1.80, 0, -8.35), max: new THREE.Vector3(-1.20, 1.4, -7.65) },
      { name: 'VipDesk_R_2', min: new THREE.Vector3(-1.05, 0, -10.00), max: new THREE.Vector3(-0.15, 1.6, -9.00) },
      { name: 'VipChair_R_2', min: new THREE.Vector3(-1.80, 0, -9.85), max: new THREE.Vector3(-1.20, 1.4, -9.15) },
      { name: 'VipDesk_R_3', min: new THREE.Vector3(-1.05, 0, -11.50), max: new THREE.Vector3(-0.15, 1.6, -10.50) },
      { name: 'VipChair_R_3', min: new THREE.Vector3(-1.80, 0, -11.35), max: new THREE.Vector3(-1.20, 1.4, -10.65) },
      { name: 'VipDesk_R_4', min: new THREE.Vector3(-1.05, 0, -13.00), max: new THREE.Vector3(-0.15, 1.6, -12.00) },
      { name: 'VipChair_R_4', min: new THREE.Vector3(-1.80, 0, -12.85), max: new THREE.Vector3(-1.20, 1.4, -12.15) },

      // 2. Far End Service Area Colliders (Service Counter forward along Z with 0.9m+ gap to fridge)
      { name: 'ServiceCounter', min: new THREE.Vector3(0.80, 0, -4.40), max: new THREE.Vector3(2.80, 1.4, -3.40) },
      { name: 'SnackShelves', min: new THREE.Vector3(-4.18, 0, -2.6), max: new THREE.Vector3(-3.70, 2.5, -1.0) },
      { name: 'BeverageCooler', min: new THREE.Vector3(2.45, 0, -6.05), max: new THREE.Vector3(3.95, 2.5, -5.15) },

      // 3. Waiting Area
      { name: 'WaitingChairs', min: new THREE.Vector3(-3.95, 0, 2.0), max: new THREE.Vector3(-3.15, 1.2, 4.4) },

      // 4. Battlestations - Left Row (Máy 01, 02, 03)
      { name: 'Station01', min: new THREE.Vector3(-3.05, 0, -2.95), max: new THREE.Vector3(-1.35, 1.8, -1.55) },
      { name: 'Station02', min: new THREE.Vector3(-3.05, 0, -1.05), max: new THREE.Vector3(-1.35, 1.8, 0.35) },
      { name: 'Station03', min: new THREE.Vector3(-3.05, 0, 0.85), max: new THREE.Vector3(-1.35, 1.8, 2.25) },

      // 5. Battlestations - Right Row (Máy 04, 05, 06)
      { name: 'Station04', min: new THREE.Vector3(1.35, 0, -2.95), max: new THREE.Vector3(3.05, 1.8, -1.55) },
      { name: 'Station05', min: new THREE.Vector3(1.35, 0, -1.05), max: new THREE.Vector3(3.05, 1.8, 0.35) },
      { name: 'Station06', min: new THREE.Vector3(1.35, 0, 0.85), max: new THREE.Vector3(3.05, 1.8, 2.25) },

      // 6. Property 01 (Left Storefront) Locked Door & Walls
      { name: 'DoorCollider_Property01', min: new THREE.Vector3(-8.8, 0, 4.85), max: new THREE.Vector3(-6.2, 4.0, 5.35) },
      { name: 'Wall_Property01_OuterLeft', min: new THREE.Vector3(-13.5, 0, -6.5), max: new THREE.Vector3(-12.5, 4.0, 5.5) },
      { name: 'Wall_Property01_Back', min: new THREE.Vector3(-13.5, 0, -6.5), max: new THREE.Vector3(-4.18, 4.0, -5.7) },
      { name: 'Wall_Property01_FrontLeft', min: new THREE.Vector3(-13.5, 0, 4.85), max: new THREE.Vector3(-8.8, 4.0, 5.25) },
      { name: 'Wall_Property01_FrontRight', min: new THREE.Vector3(-6.2, 0, 4.85), max: new THREE.Vector3(-3.8, 4.0, 5.25) },

      // 7. Property 02 (Right Storefront) Locked Door & Walls
      { name: 'DoorCollider_Property02', min: new THREE.Vector3(6.2, 0, 4.85), max: new THREE.Vector3(8.8, 4.0, 5.35) },
      { name: 'Wall_Property02_OuterRight', min: new THREE.Vector3(12.5, 0, -6.5), max: new THREE.Vector3(13.5, 4.0, 5.5) },
      { name: 'Wall_Property02_Back', min: new THREE.Vector3(3.8, 0, -6.5), max: new THREE.Vector3(13.5, 4.0, -5.7) },
      { name: 'Wall_Property02_FrontLeft', min: new THREE.Vector3(3.8, 0, 4.85), max: new THREE.Vector3(6.2, 4.0, 5.25) },
      { name: 'Wall_Property02_FrontRight', min: new THREE.Vector3(8.8, 0, 4.85), max: new THREE.Vector3(13.5, 4.0, 5.25) },

      // 8. Exterior Street Boundaries & Hardware Store (Allows crossing road and entering Hardware Store)
      { name: 'StreetLeftWall', min: new THREE.Vector3(-22.0, 0, 4.8), max: new THREE.Vector3(-18.5, 4.0, 35.5) },
      { name: 'StreetRightWall', min: new THREE.Vector3(18.5, 0, 4.8), max: new THREE.Vector3(22.0, 4.0, 35.5) },
      { name: 'FarSidewalkLeftBuilding', min: new THREE.Vector3(-25.0, 0, 28.5), max: new THREE.Vector3(-4.0, 5.0, 35.5) },
      { name: 'FarSidewalkRightBuilding', min: new THREE.Vector3(4.0, 0, 28.5), max: new THREE.Vector3(25.0, 5.0, 35.5) },

      // PC Hardware Store Interior Colliders
      { name: 'HardwareStore_LeftWall', min: new THREE.Vector3(-4.2, 0, 28.5), max: new THREE.Vector3(-3.8, 5.0, 35.5) },
      { name: 'HardwareStore_RightWall', min: new THREE.Vector3(3.8, 0, 28.5), max: new THREE.Vector3(4.2, 5.0, 35.5) },
      { name: 'HardwareStore_BackWall', min: new THREE.Vector3(-4.2, 0, 34.9), max: new THREE.Vector3(4.2, 5.0, 35.5) },
      { name: 'HardwareStore_Counter', min: new THREE.Vector3(-1.7, 0, 32.1), max: new THREE.Vector3(1.7, 1.4, 33.2) },
      { name: 'HardwareStore_LeftShelves', min: new THREE.Vector3(-3.9, 0, 30.5), max: new THREE.Vector3(-2.8, 3.0, 34.2) },
      { name: 'HardwareStore_RightShelves', min: new THREE.Vector3(2.8, 0, 30.5), max: new THREE.Vector3(3.9, 3.0, 34.2) },
    ];

    collidersRef.current = colliders;

    // Player Capsule / Cylinder Hitbox Radius (28cm buffer prevents any near-plane clipping)
    const PLAYER_HITBOX_RADIUS = 0.28;

    const resolvePlayerCollision = (currentPos: THREE.Vector3): THREE.Vector3 => {
      let x = currentPos.x;
      let z = currentPos.z;

      for (let iter = 0; iter < 3; iter++) {
        for (const col of collidersRef.current) {
          // If VIP door is opened, player can pass through smoothly!
          if (col.name === 'VipDoorCollider' && isVipDoorOpenRef.current) {
            continue;
          }

          const closestX = Math.max(col.min.x, Math.min(x, col.max.x));
          const closestZ = Math.max(col.min.z, Math.min(z, col.max.z));

          const dx = x - closestX;
          const dz = z - closestZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < PLAYER_HITBOX_RADIUS * PLAYER_HITBOX_RADIUS) {
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const overlap = PLAYER_HITBOX_RADIUS - dist;
              x += (dx / dist) * overlap;
              z += (dz / dist) * overlap;
            } else {
              // Deep inside: push out along nearest collider face
              const dLeft = Math.abs(x - col.min.x);
              const dRight = Math.abs(col.max.x - x);
              const dNear = Math.abs(z - col.min.z);
              const dFar = Math.abs(col.max.z - z);
              const minD = Math.min(dLeft, dRight, dNear, dFar);
              if (minD === dLeft) x = col.min.x - PLAYER_HITBOX_RADIUS;
              else if (minD === dRight) x = col.max.x + PLAYER_HITBOX_RADIUS;
              else if (minD === dNear) z = col.min.z - PLAYER_HITBOX_RADIUS;
              else z = col.max.z + PLAYER_HITBOX_RADIUS;
            }
          }
        }
      }

      // World safety bounds
      x = Math.max(-17.0, Math.min(17.0, x));
      const minZ = (x >= -5.85 && x <= -0.15) ? -14.1 : -5.8;
      // Allow player to cross street (z up to 28.2) and enter Hardware Store (x in [-3.8, 3.8], z up to 34.5)
      const maxZ = (x >= -3.8 && x <= 3.8) ? 34.5 : 28.2;
      z = Math.max(minZ, Math.min(maxZ, z));

      return new THREE.Vector3(x, currentPos.y, z);
    };

    let lastTime = performance.now();
    let spawnTimer = 0;

    const animate = (currentTime: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Animate Industrial Ceiling Fans
      for (const fan of ceilingFansList) {
        fan.rotation.y += delta * 2.6;
      }

      // 1. Move Player throughout the Cyber Game Hall with Rigidbody/Capsule Collision
      const speed = 2.8;
      const move = moveInputRef.current;
      if (move.forward !== 0 || move.strafe !== 0) {
        const sin = Math.sin(playerYawRef.current);
        const cos = Math.cos(playerYawRef.current);
        const dirX = -sin * move.forward + cos * move.strafe;
        const dirZ = -cos * move.forward - sin * move.strafe;
        const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
        if (len > 0.001) {
          const stepX = (dirX / len) * speed * delta;
          const stepZ = (dirZ / len) * speed * delta;

          // Continuous sliding collision resolution (Decomposed X and Z steps)
          let currentPos = playerPosRef.current.clone();

          // Step X & resolve
          currentPos.x += stepX;
          currentPos = resolvePlayerCollision(currentPos);

          // Step Z & resolve
          currentPos.z += stepZ;
          currentPos = resolvePlayerCollision(currentPos);

          playerPosRef.current.copy(currentPos);
        }
      }

      if (cameraRef.current) {
        cameraRef.current.position.copy(playerPosRef.current);
        const euler = new THREE.Euler(playerPitchRef.current, playerYawRef.current, 0, 'YXZ');
        cameraRef.current.quaternion.setFromEuler(euler);
      }

      // 2. Waiting Queue
      for (const waitingCust of customersRef.current) {
        if (waitingCust.state === 'waiting') {
          waitingCust.waitTimeSeconds += delta;

          if (waitingCust.waitTimeSeconds > 3 && waitingCust.waitTimePenalty === 0) {
            waitingCust.waitTimePenalty = -10;
            const updated = calculateSatisfactionCore(
              null,
              waitingCust.waitTimeSeconds,
              internetPlanRef.current,
              acEnabledRef.current,
              foodServiceRef.current,
              pricingPolicyRef.current
            );
            Object.assign(waitingCust, updated);
            triggerPopup(`Chờ lâu: ${waitingCust.waitTimePenalty}đ!`, waitingCust.mesh?.position || playerPosRef.current, '#f43f5e');
          }

          const freePC = stationsRef.current.find(s => !s.isOccupied);
          if (freePC) {
            updateStationChairTransform(freePC);
            freePC.isOccupied = true;
            freePC.currentCustomerId = waitingCust.id;
            waitingCust.targetStationId = freePC.id;
            waitingCust.state = 'walking';

            addLog(`[Hàng Đợi] ${freePC.name} đã trống! 1 ${waitingCust.name} bước vào máy.`);
            triggerPopup('Có máy trống rồi!', waitingCust.mesh?.position || playerPosRef.current, '#38bdf8');
          } else if (waitingCust.waitTimeSeconds > 18) {
            waitingCust.state = 'leaving';
            waitingCust.finalScore = Math.max(5, waitingCust.finalScore - 30);
            waitingCust.emoji = '😡';
            waitingCust.tierLabel = 'Very Unhappy';
            waitingCust.stars = 1;
            waitingCust.returnChance = 2;

            if (waitingCust.mesh) {
              // Đứng dậy từ ghế chờ bước ra lối đi và xoay mặt ra cửa
              waitingCust.mesh.position.set(-2.0, 0, 3.2);
              waitingCust.mesh.lookAt(0, 0, 4.8);
            }
            animateCustomerLimbs(waitingCust, 0, 'leaving');

            addLog(`[Hàng Đợi] Chờ quá 18s! 1 ${waitingCust.name} bực tức đứng dậy bỏ về (😡 1 sao)`);
            triggerPopup('Chờ lâu quá! Bỏ về! 😡', waitingCust.mesh?.position || playerPosRef.current, '#f43f5e');
            syncToParent();
          }
        }
      }

      // 3. Customer movement, leaving & limb procedural animations
      for (const cust of [...customersRef.current]) {
        animateCustomerLimbs(cust, delta, cust.state);

        if (cust.state === 'leaving' && cust.mesh) {
          if (cust.exitWaypoint === undefined) {
            cust.exitWaypoint = 1;
            cust.exitDirection = Math.random() > 0.5 ? 1 : -1;
          }

          if (cust.exitWaypoint === 1) {
            // Waypoint 1: Walk to Front Door (0, 0, 4.8)
            const exitDoor = new THREE.Vector3(0, 0, 4.8);
            const dir = exitDoor.clone().sub(cust.mesh.position);
            if (dir.length() > 0.35 && cust.mesh.position.z < 4.65) {
              dir.normalize();
              cust.mesh.position.add(dir.multiplyScalar(delta * 2.2));
              cust.mesh.lookAt(exitDoor.x, cust.mesh.position.y, exitDoor.z);
            } else {
              cust.exitWaypoint = 2; // Step onto outer sidewalk
            }
          } else if (cust.exitWaypoint === 2) {
            // Waypoint 2: Walk out onto Sidewalk (0, 0, 7.5)
            const sidewalkPoint = new THREE.Vector3(0, 0, 7.5);
            const dir = sidewalkPoint.clone().sub(cust.mesh.position);
            if (dir.length() > 0.35) {
              dir.normalize();
              cust.mesh.position.add(dir.multiplyScalar(delta * 2.2));
              cust.mesh.lookAt(sidewalkPoint.x, cust.mesh.position.y, sidewalkPoint.z);
            } else {
              cust.exitWaypoint = 3; // Choose direction (Far Left or Far Right down street)
            }
          } else {
            // Waypoint 3: Randomly walk down the street (left or right along sidewalk)
            const targetX = (cust.exitDirection || 1) * 26.0;
            const streetPoint = new THREE.Vector3(targetX, 0, 7.5);
            const dir = streetPoint.clone().sub(cust.mesh.position);
            dir.normalize();
            cust.mesh.position.add(dir.multiplyScalar(delta * 2.0));
            cust.mesh.lookAt(streetPoint.x, cust.mesh.position.y, streetPoint.z);

            // Only destroy() NPC after reaching end of street, out of player's view
            if (Math.abs(cust.mesh.position.x) > 21.0) {
              if (sceneRef.current && cust.mesh) {
                sceneRef.current.remove(cust.mesh);
              }
              customersRef.current = customersRef.current.filter(c => c.id !== cust.id);
              syncToParent();
            }
          }
        }

        if (cust.state === 'walking' && cust.targetStationId) {
          const st = stationsRef.current.find(s => s.id === cust.targetStationId);
          if (st && cust.mesh) {
            updateStationChairTransform(st);
            const target = st.sitPoint; // Exact ground navigation destination of attached chair
            const dir = target.clone().sub(cust.mesh.position);
            dir.y = 0;
            const dist = dir.length();

            if (dist > 0.12) {
              dir.normalize();
              cust.mesh.position.add(dir.multiplyScalar(delta * 2.2));
              cust.mesh.lookAt(target.x, cust.mesh.position.y, target.z);
            } else {
              cust.state = 'playing';
              cust.needsFoodOrDrink = false;
              cust.foodRequestTimer = 5 + Math.random() * 8; // Food request triggers 5-13s into playing
              cust.orderedItemName = 'Nước/Mì (+15k)';
              cust.foodOrderPrice = 15000;
              cust.mesh.visible = true;

              // Action - Update NPC Target: Exact position of the attached chair, NOT desk center
              const chairPos = st.chairPosition || st.sitPoint;
              const chairBaseY = chairPos.y || 0;
              cust.mesh.position.set(chairPos.x, chairBaseY, chairPos.z);

              // Action - Force Rotation: Force NPC transform.rotation.y to face the exact same direction as Monitor / Desk forward vector
              const facingRot = st.deskFacingRotationY !== undefined ? st.deskFacingRotationY : Math.PI;
              cust.mesh.rotation.set(0, facingRot, 0);

              // Disable NPC Collision: Briefly disable / set CapsuleCollider to isTrigger = true so they don't get pushed out of chair by desk collider
              cust.isTrigger = true;
              if (cust.bodyLimbs?.capsuleCollider) {
                cust.bodyLimbs.capsuleCollider.userData.isTrigger = true;
                if ((cust.bodyLimbs.capsuleCollider.material as THREE.MeshBasicMaterial).color) {
                  (cust.bodyLimbs.capsuleCollider.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
                }
              }

              animateCustomerLimbs(cust, 0, 'playing');

              const satResult = calculateSatisfactionCore(
                st,
                cust.waitTimeSeconds,
                internetPlanRef.current,
                acEnabledRef.current,
                foodServiceRef.current,
                pricingPolicyRef.current
              );
              Object.assign(cust, satResult);

              const earnings = Math.round(cust.hours * cust.pricePerHour);
              st.timeRemaining = cust.hours * 8;
              st.currentCustomerType = cust.name;
              st.totalEarnedFromStation += earnings;

              if (st.screenMesh && st.screenOnMat) st.screenMesh.material = st.screenOnMat;
              if (st.screenWingMeshes && st.screenOnMat) {
                st.screenWingMeshes.forEach(w => { w.material = st.screenOnMat!; });
              }
              if (st.screenLight) st.screenLight.intensity = 1.6;

              setTotalMoney(m => m + earnings);
              if (onMoneyEarnedRef.current) onMoneyEarnedRef.current(earnings);
              soundController.playCashChime();
              triggerPopup(`+${earnings.toLocaleString('vi-VN')} đ • ${satResult.emoji} ${satResult.finalScore}đ`, st.position);
              addLog(`[${st.name}] ${cust.name} bắt đầu chơi! Điểm hài lòng: ${satResult.emoji} ${satResult.finalScore}đ (${satResult.stars}⭐)`);
              syncToParent();
            }
          }
        }

        if (cust.state === 'playing' && cust.targetStationId) {
          const st = stationsRef.current.find(s => s.id === cust.targetStationId);
          if (st && cust.mesh) {
            const chairPos = st.chairPosition || st.sitPoint;
            const chairBaseY = chairPos.y || 0;
            cust.mesh.position.set(chairPos.x, chairBaseY, chairPos.z);
            const facingRot = st.deskFacingRotationY !== undefined ? st.deskFacingRotationY : Math.PI;
            cust.mesh.rotation.set(0, facingRot, 0);
          }
        }
      }

      // 4. Station countdown & Customer F&B Logic
      for (const st of stationsRef.current) {
        if (st.isOccupied && st.timeRemaining > 0) {
          const speedMultiplier = 1.0 + (st.ramLevel - 1) * 0.2;
          st.timeRemaining -= delta * speedMultiplier;

          // Customer F&B Request Timer
          const custPlaying = customersRef.current.find(c => c.targetStationId === st.id && c.state === 'playing');
          if (custPlaying) {
            if (!custPlaying.needsFoodOrDrink && custPlaying.foodRequestTimer !== undefined) {
              custPlaying.foodRequestTimer -= delta;
              if (custPlaying.foodRequestTimer <= 0) {
                custPlaying.needsFoodOrDrink = true;
                addLog(`[${st.name}] Khách gọi đồ ăn/thức uống!`);
                triggerPopup(`[${st.name}] Khách gọi: Nước/Mì (+15k)! 🍜🥤`, st.position, '#f59e0b');
              }
            }
          }

          if (st.timeRemaining <= 0) {
            st.isOccupied = false;
            st.timeRemaining = 0;
            st.currentCustomerType = '';
            if (st.screenMesh && st.screenOffMat) st.screenMesh.material = st.screenOffMat;
            if (st.screenWingMeshes && st.screenOffMat) {
              st.screenWingMeshes.forEach(w => { w.material = st.screenOffMat!; });
            }
            if (st.screenLight) st.screenLight.intensity = 0;

            const cust = customersRef.current.find(c => c.targetStationId === st.id);
            if (cust) {
              let reviewText = 'Quán chơi mượt, mạng nhanh, điều hòa lạnh toát!';
              if (cust.finalScore >= 80) {
                reviewText = 'Máy cấu hình cực khủng, combat không tụt fps! Sẽ quay lại thường xuyên.';
              } else if (cust.finalScore >= 60) {
                reviewText = 'Quán ổn áp, chơi game mượt, giá cả hợp lý.';
              } else if (cust.finalScore >= 40) {
                reviewText = 'Tạm được, máy hơi bình thường, cần nâng cấp thêm VGA.';
              } else {
                reviewText = 'Mạng hơi lag, phải chờ đợi lâu, không hài lòng!';
              }

              const newReview: CustomerSatisfactionBreakdown = {
                id: String(Date.now() + Math.random()),
                customerName: cust.name,
                customerType: cust.type === 'HocSinh' ? 'Học Sinh' : cust.type === 'GameThu' ? 'Game Thủ' : 'Khách VIP',
                stationName: st.name,
                baseScore: cust.baseScore,
                computerQualityScore: cust.computerQualityScore,
                ramLevel: st.ramLevel,
                vgaLevel: st.gpuLevel,
                monitorLevel: st.monitorLevel,
                priceScore: cust.priceScore,
                waitTimePenalty: cust.waitTimePenalty,
                internetBonus: cust.internetBonus,
                acBonus: cust.acBonus,
                foodBonus: cust.foodBonus,
                finalScore: cust.finalScore,
                tier: cust.tier,
                emoji: cust.emoji,
                tierLabel: cust.tierLabel,
                stars: cust.stars,
                returnChance: cust.returnChance,
                reviewComment: reviewText,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              };

              setRecentReviews(prev => [newReview, ...prev.slice(0, 9)]);
              recentReviewsRef.current = [newReview, ...recentReviewsRef.current.slice(0, 9)];
              triggerPopup(`${cust.emoji} Đánh giá ${cust.stars}⭐: ${cust.finalScore}đ!`, st.position, '#f59e0b');
              addLog(`[${st.name}] ${cust.name} chơi xong (${cust.emoji} ${cust.stars}⭐), đứng lên đi ra cửa về.`);

              // Khách đứng lên khỏi ghế và bắt đầu đi ra cửa!
              cust.state = 'leaving';
              cust.targetStationId = null;

              // Restore collision when standing up:
              cust.isTrigger = false;
              if (cust.bodyLimbs?.capsuleCollider) {
                cust.bodyLimbs.capsuleCollider.userData.isTrigger = false;
                if ((cust.bodyLimbs.capsuleCollider.material as THREE.MeshBasicMaterial).color) {
                  (cust.bodyLimbs.capsuleCollider.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
                }
              }

              if (cust.mesh) {
                // Đứng dậy, lùi ra khỏi bàn ghế vào lối đi trung tâm
                const aisleX = st.position.x > 0 ? 0.4 : -0.4;
                cust.mesh.position.set(aisleX, 0, st.position.z + 0.95);
                // Xoay mặt hướng thẳng ra cửa chính
                cust.mesh.lookAt(0, 0, 4.8);
              }
              animateCustomerLimbs(cust, 0, 'leaving');
              syncToParent();
            }
          }
        }
      }

      // 5. Update direct DOM Badges (Zero setState in loop)
      if (carryingTrayMeshRef.current) {
        carryingTrayMeshRef.current.visible = isCarryingFoodRef.current;
      }
      if (carryingPCBoxMeshRef.current) {
        carryingPCBoxMeshRef.current.visible = isCarryingPCBoxRef.current;
      }

      if (cameraRef.current && mountRef.current) {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;

        const activeEntities = customersRef.current.filter(
          c => c.mesh && (c.state === 'playing' || c.state === 'waiting' || c.state === 'walking' || c.state === 'leaving')
        );

        for (let i = 0; i < 6; i++) {
          const el = badgeRefs.current[i];
          if (!el) continue;

          const cust = activeEntities[i];
          if (cust && cust.mesh) {
            const headY = cust.state === 'playing' || cust.state === 'waiting' ? 1.55 : 1.82;
            const headPos = cust.mesh.position.clone().add(new THREE.Vector3(0, headY, 0));
            headPos.project(cameraRef.current);

            const isVisible = headPos.z < 1 && headPos.z > -1;
            if (isVisible) {
              const x = ((headPos.x + 1) * w) / 2;
              const y = ((-headPos.y + 1) * h) / 2;

              el.style.display = 'flex';
              el.style.left = `${x}px`;
              el.style.top = `${y}px`;

              const emojiEl = el.querySelector('.badge-emoji');
              if (emojiEl) emojiEl.textContent = cust.emoji;

              const scoreEl = el.querySelector('.badge-score');
              if (scoreEl) scoreEl.textContent = `${cust.finalScore}đ`;

              const starsEl = el.querySelector('.badge-stars');
              if (starsEl) starsEl.textContent = '★'.repeat(cust.stars);

              const waitEl = el.querySelector('.badge-wait') as HTMLElement;
              if (waitEl) {
                if (cust.state === 'waiting') {
                  waitEl.style.display = 'inline-block';
                  waitEl.textContent = 'Đang chờ';
                  waitEl.className = 'badge-wait text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-semibold';
                } else if (cust.state === 'leaving') {
                  waitEl.style.display = 'inline-block';
                  waitEl.textContent = 'Đi về 🚪';
                  waitEl.className = 'badge-wait text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded font-semibold';
                } else {
                  waitEl.style.display = 'none';
                }
              }
            } else {
              el.style.display = 'none';
            }
          } else {
            el.style.display = 'none';
          }
        }

        // Project 2D Floating Billboard Bubbles for customers in NeedsFoodOrDrink state
        for (let i = 0; i < 6; i++) {
          const bubbleEl = orderBubbleRefs.current[i];
          if (!bubbleEl) continue;

          const st = stationsRef.current[i];
          if (!st || !st.isOccupied) {
            bubbleEl.style.display = 'none';
            continue;
          }

          const custPlaying = customersRef.current.find(c => c.targetStationId === st.id && c.state === 'playing');
          if (custPlaying && custPlaying.needsFoodOrDrink) {
            const bubbleWorldPos = st.position.clone().add(new THREE.Vector3(0, 1.48, 0));
            bubbleWorldPos.project(cameraRef.current);

            const isVisible = bubbleWorldPos.z < 1 && bubbleWorldPos.z > -1;
            if (isVisible) {
              const x = ((bubbleWorldPos.x + 1) * w) / 2;
              const y = ((-bubbleWorldPos.y + 1) * h) / 2;
              bubbleEl.style.display = 'flex';
              bubbleEl.style.left = `${x}px`;
              bubbleEl.style.top = `${y}px`;
            } else {
              bubbleEl.style.display = 'none';
            }
          } else {
            bubbleEl.style.display = 'none';
          }
        }
      }

      // 6. Spawn Countdown (Updates state only when integer second changes)
      spawnTimer += delta;
      const remainingSec = Math.max(0, Math.ceil(10 - (spawnTimer % 10)));
      if (remainingSec !== lastCountdownSecRef.current) {
        lastCountdownSecRef.current = remainingSec;
        setCustomerSpawnCountdown(remainingSec);
      }

      if (spawnTimer >= 10) {
        spawnTimer -= 10;
        spawnCustomer();
      }

      // Continuous Traffic Simulation & Looping Traffic
      for (const car of carsListRef.current) {
        car.mesh.position.x += car.speed * delta;
        if (car.speed > 0 && car.mesh.position.x > 50) {
          car.mesh.position.x = -50;
        } else if (car.speed < 0 && car.mesh.position.x < -50) {
          car.mesh.position.x = 50;
        }
      }

      // Player Collision (Frogger Mechanic):
      // Distance check between Player and moving cars (< 2.0)
      const nowMs = performance.now();
      if (nowMs - lastCarHitTimeRef.current > 1800) {
        for (const car of carsListRef.current) {
          const distToCar = playerPosRef.current.distanceTo(car.mesh.position);
          if (distToCar < 2.0) {
            lastCarHitTimeRef.current = nowMs;
            // Teleport player immediately back to Cyber Cafe sidewalk
            playerPosRef.current.set(0, 1.6, 8.5);
            if (cameraRef.current) {
              cameraRef.current.position.copy(playerPosRef.current);
            }
            addLog('Bị xe tông! Hãy cẩn thận khi qua đường!', 'error');
            triggerPopup('Bị xe tông! Hãy cẩn thận khi qua đường! 💥🚗', new THREE.Vector3(0, 1.6, 8.5), '#ef4444');
            soundController.playPowerSwitch(false);
            break;
          }
        }
      }

      // 6.6. Build Mode & Free Placement Logic (Internet Cafe Simulator Architecture):
      // When in Build Mode, create a 'Ghost' mesh that follows player's crosshair via Raycasting
      const activeBuild = buildModeItemRef.current;
      const ghost = ghostMeshRef.current;
      if (activeBuild && ghost && cameraRef.current) {
        // Raycast from camera center forward
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);

        const camPos = cameraRef.current.position;
        const camDir = new THREE.Vector3();
        cameraRef.current.getWorldDirection(camDir);

        let isValidSurface = false;
        const targetPos = new THREE.Vector3();
        let targetRotY = playerYawRef.current + ghostRotationYRef.current;
        const itemCat = activeBuild.item.category;
        const [bx, by, bz] = activeBuild.item.boxDimensions;

        if (itemCat === 'Desk') {
          // Desk ghosts raycast and snap to Floor (y = 0)
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hitPoint = new THREE.Vector3();
          const ray = new THREE.Ray(camPos, camDir);
          const hasHit = ray.intersectPlane(groundPlane, hitPoint);

          if (hasHit && camPos.distanceTo(hitPoint) <= 8.0 && hitPoint.z < 26.0 && hitPoint.z > -16.0) {
            targetPos.copy(hitPoint);
            targetPos.y = 0;
            isValidSurface = true;
          } else {
            targetPos.copy(camPos).add(camDir.clone().multiplyScalar(3.0));
            targetPos.y = 0;
            isValidSurface = true;
          }
          targetRotY = playerYawRef.current + ghostRotationYRef.current;
          activeSnappedSlotRef.current = null;
        } else {
          // PC Components (Monitor, Keyboard, Mouse, PCCase, Headset, Chair):
          // Auto-Snap Slot System: Snapping strictly to the predefined slot of that component on placed Desks!
          let closestDesk: {
            deskId: string;
            group: THREE.Group;
            center: THREE.Vector3;
            rotationY: number;
            topY: number;
            slots: Record<string, PlacedFurnitureItem | null>;
          } | null = null;
          let minDeskDist = 999;

          // Find closest placed custom desk within reach (<= 4.2m)
          for (const d of Array.from(placedDesksRegistryRef.current.values())) {
            const dist = playerPosRef.current.distanceTo(d.center);
            if (dist <= 4.2 && dist < minDeskDist) {
              minDeskDist = dist;
              closestDesk = d;
            }
          }

          if (closestDesk) {
            const slotDef = DESK_SNAP_SLOTS.find(s => s.category === itemCat);
            if (slotDef) {
              const cos = Math.cos(closestDesk.rotationY);
              const sin = Math.sin(closestDesk.rotationY);
              const [rx, ry, rz] = slotDef.relativePos;
              const slotWorldPos = new THREE.Vector3(
                closestDesk.center.x + (rx * cos + rz * sin),
                closestDesk.topY + ry,
                closestDesk.center.z + (-rx * sin + rz * cos)
              );
              const slotWorldRotY = closestDesk.rotationY + slotDef.relativeRotY + ghostRotationYRef.current;

              // Force ghost mesh to snap directly into this slot position and rotation!
              targetPos.copy(slotWorldPos);
              targetRotY = slotWorldRotY;

              // Check if slot is already occupied
              const isSlotOccupied = !!closestDesk.slots[slotDef.name];
              if (isSlotOccupied) {
                isValidSurface = false; // Occupied -> Red!
                activeSnappedSlotRef.current = null;
              } else {
                isValidSurface = true; // Free -> Green!
                activeSnappedSlotRef.current = {
                  deskId: closestDesk.deskId,
                  slotName: slotDef.name,
                  worldPos: slotWorldPos,
                  worldRotY: slotWorldRotY,
                };
              }
            } else {
              targetPos.copy(camPos).add(camDir.clone().multiplyScalar(2.5));
              isValidSurface = false;
              activeSnappedSlotRef.current = null;
            }
          } else {
            // If Chair and not near a desk, allow free placement on floor
            if (itemCat === 'Chair') {
              const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
              const hitPoint = new THREE.Vector3();
              const ray = new THREE.Ray(camPos, camDir);
              const hasHit = ray.intersectPlane(groundPlane, hitPoint);
              if (hasHit && camPos.distanceTo(hitPoint) <= 6.0) {
                targetPos.copy(hitPoint);
                targetPos.y = 0;
                isValidSurface = true;
              } else {
                targetPos.copy(camPos).add(camDir.clone().multiplyScalar(2.5));
                targetPos.y = 0;
                isValidSurface = true;
              }
              targetRotY = playerYawRef.current + ghostRotationYRef.current;
              activeSnappedSlotRef.current = null;
            } else {
              // Monitor, Keyboard, Mouse, PCCase, Headset MUST snap to a Desk!
              targetPos.copy(camPos).add(camDir.clone().multiplyScalar(2.0));
              targetRotY = playerYawRef.current + ghostRotationYRef.current;
              isValidSurface = false; // Red!
              activeSnappedSlotRef.current = null;
            }
          }
        }

        // Position & Rotate ghost hologram
        ghost.position.lerp(targetPos, 0.45);
        ghost.rotation.y = targetRotY;

        // 4. Collision Validation (Red/Green Hologram):
        const ghostBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(ghost.position.x, ghost.position.y + by / 2, ghost.position.z),
          new THREE.Vector3(bx * 0.85, by * 0.85, bz * 0.85)
        );

        let hasCollision = false;
        // When snapping to a desk slot, ignore collision with that desk itself
        for (const col of collidersRef.current) {
          const colBox = new THREE.Box3(col.min, col.max);
          if (ghostBox.intersectsBox(colBox)) {
            if (activeSnappedSlotRef.current && col.name.includes(`CustomDesk_${activeSnappedSlotRef.current.deskId}`)) {
              // Accessory on its snapped desk is valid!
            } else {
              hasCollision = true;
              break;
            }
          }
        }

        const isValid = isValidSurface && !hasCollision;
        isGhostValidRef.current = isValid;

        const targetColor = isValid ? 0x00ff00 : 0xff0000;
        ghost.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof THREE.MeshBasicMaterial) {
              child.material.color.setHex(targetColor);
              child.material.transparent = true;
              child.material.opacity = 0.55;
            } else {
              child.material = new THREE.MeshBasicMaterial({
                color: targetColor,
                transparent: true,
                opacity: 0.55,
                wireframe: false,
              });
            }
          }
        });
      }

      // Animate active Desk completion checkmarks (Pulsing & Rotating)
      placedDesksRegistryRef.current.forEach((d) => {
        if (d.checkmarkMesh && d.isReadyForCustomer) {
          d.checkmarkMesh.rotation.y += delta * 1.6;
          d.checkmarkMesh.position.y = d.topY + 1.15 + Math.sin(currentTime * 0.005) * 0.04;
        }
      });

      // 7. Distance & Interaction Target Detection (Fridge, NeedsFoodOrDrink Customer, Station Upgrade)
      const FRIDGE_POSITION = new THREE.Vector3(3.2, 1.0, -5.1);
      const distToFridge = playerPosRef.current.distanceTo(FRIDGE_POSITION);

      let newInteraction: ActiveInteractionType = null;

      // A. Check if player is near any customer who needs food/drink
      let customerNeedingFood: { cust: CustomerSimEntity; st: StationUpgradeState } | null = null;
      let minFoodDist = 2.4;

      for (const st of stationsRef.current) {
        if (st.isOccupied) {
          const cust = customersRef.current.find(c => c.targetStationId === st.id && c.state === 'playing');
          if (cust && cust.needsFoodOrDrink) {
            const d = playerPosRef.current.distanceTo(st.sitPoint || st.position);
            if (d <= minFoodDist) {
              minFoodDist = d;
              customerNeedingFood = { cust, st };
            }
          }
        }
      }

      // 0. Check Property Purchasing ('FOR SALE' 3D Signs)
      let propertyInteraction: ActiveInteractionType = null;
      const cam = cameraRef.current;
      if (cam) {
        const camDir = new THREE.Vector3();
        cam.getWorldDirection(camDir);

        for (const prop of propertiesRef.current) {
          if (!prop.isPurchased) {
            const dist = playerPosRef.current.distanceTo(prop.signPosition);
            if (dist <= 3.8) {
              const toSign = prop.signPosition.clone().sub(playerPosRef.current).normalize();
              const dot = camDir.dot(toSign);
              if (dot > 0.35 || dist <= 2.0) {
                propertyInteraction = {
                  type: 'property_purchase',
                  propertyId: prop.id,
                  propertyName: prop.name,
                  price: prop.price,
                  text: `[${configRef.current.interactKey}] Mua mặt bằng mở rộng - Giá: 5.000.000 VNĐ`,
                  subText: `${prop.name} • Dỡ bỏ rào cản & mở khóa không gian mới`,
                };
                break;
              }
            }
          }
        }
      }

      // Gentle floating animation for FOR SALE signs
      for (const prop of propertiesRef.current) {
        if (!prop.isPurchased && prop.signGroup) {
          prop.signGroup.position.y = 1.7 + Math.sin(currentTime * 0.003) * 0.04;
        }
      }

      // Smoothly animate VIP Door Hinge rotation (Pushes open to Math.PI / 2)
      if (vipDoorHingeRef.current) {
        const targetDoorAngle = isVipDoorOpenRef.current ? Math.PI / 2 : 0;
        vipDoorHingeRef.current.rotation.y += (targetDoorAngle - vipDoorHingeRef.current.rotation.y) * Math.min(1, delta * 5.0);
      }

      // Check VIP Door proximity trigger ([E] Đẩy cửa phòng VIP / [E] Đóng cửa phòng VIP)
      let vipDoorInteraction: ActiveInteractionType = null;
      const VIP_DOOR_POS = new THREE.Vector3(-3.00, 1.0, -4.8);
      const distToVipDoor = playerPosRef.current.distanceTo(VIP_DOOR_POS);
      if (distToVipDoor <= 2.6) {
        vipDoorInteraction = {
          type: 'vip_door',
          text: isVipDoorOpenRef.current ? `[${configRef.current.interactKey}] Đóng cửa phòng VIP` : `[${configRef.current.interactKey}] Đẩy cửa phòng VIP`,
          subText: 'Phòng VIP Cyber Gaming • 10 Máy Đấu Giải Đỉnh Cao',
        };
      }

      // Check Hardware Store Counter proximity trigger ([E] Mua Hộp Linh Kiện PC)
      let hardwareStoreInteraction: ActiveInteractionType = null;
      const HARDWARE_COUNTER_POS = new THREE.Vector3(0, 1.0, 31.8);
      const distToHardwareCounter = playerPosRef.current.distanceTo(HARDWARE_COUNTER_POS);
      if (distToHardwareCounter <= 2.4) {
        hardwareStoreInteraction = {
          type: 'hardware_store',
          text: `[${configRef.current.interactKey}] Cửa Hàng PC Hardware & Bàn Ghế`,
          subText: 'Mở Menu Shop 7 Linh Kiện & 5 Tiers • Mua đồ vào Balo [B]',
        };
      }

      // Check Raycast for Placed Furniture Pickup ([F] Key):
      let pickupFurnitureInteraction: ActiveInteractionType = null;
      if (!activeBuild && cameraRef.current) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
        raycaster.far = 3.6;

        const testGroups: THREE.Object3D[] = [];
        placedFurnitureGroupsRef.current.forEach((grp) => {
          testGroups.push(grp);
        });

        const hits = raycaster.intersectObjects(testGroups, true);
        if (hits.length > 0) {
          let obj: THREE.Object3D | null = hits[0].object;
          while (obj && !obj.userData?.instanceId && obj.parent) {
            obj = obj.parent;
          }
          if (obj && obj.userData?.instanceId) {
            const instId = obj.userData.instanceId;
            const itemName = obj.userData.itemName || 'Linh Kiện';
            pickupFurnitureInteraction = {
              type: 'pickup_furniture',
              instanceId: instId,
              itemName: itemName,
              text: `[F] Thu hồi: ${itemName}`,
              subText: 'Nhấn [F] để tháo gỡ và cất lại vào Balo [B]',
            };
            activePickupFurnitureRef.current = { instanceId: instId, itemName };
          }
        }
      }
      if (!pickupFurnitureInteraction) {
        activePickupFurnitureRef.current = null;
      }

      if (vipDoorInteraction) {
        newInteraction = vipDoorInteraction;
      } else if (hardwareStoreInteraction) {
        newInteraction = hardwareStoreInteraction;
      } else if (pickupFurnitureInteraction) {
        newInteraction = pickupFurnitureInteraction;
      } else if (propertyInteraction) {
        newInteraction = propertyInteraction;
      } else if (customerNeedingFood) {
        if (isCarryingFoodRef.current) {
          newInteraction = {
            type: 'serve',
            customerId: customerNeedingFood.cust.id,
            stationId: customerNeedingFood.st.id,
            stationName: customerNeedingFood.st.name,
            text: `[${configRef.current.interactKey}] Phục vụ ${customerNeedingFood.st.name}`,
            subText: 'Giao khay đồ ăn/uống (+15.000 VNĐ & +5đ hài lòng)',
          };
        } else {
          newInteraction = {
            type: 'needs_food_hint',
            customerId: customerNeedingFood.cust.id,
            stationId: customerNeedingFood.st.id,
            stationName: customerNeedingFood.st.name,
            text: `Khách ${customerNeedingFood.st.name} đang gọi Nước/Mì!`,
            subText: `Lại Tủ Mát [${configRef.current.interactKey}] để chuẩn bị đồ ăn trước`,
          };
        }
      } else if (distToFridge <= 2.2) {
        if (!isCarryingFoodRef.current) {
          newInteraction = {
            type: 'fridge',
            text: `[${configRef.current.interactKey}] Chuẩn bị đồ ăn/uống`,
            subText: 'Tủ Mát BEVERAGES & ENERGY (Nhận khay mì cay & nước ngọt)',
          };
        } else {
          newInteraction = {
            type: 'fridge',
            text: 'Đang bưng đồ ăn/uống 🍜🥤',
            subText: 'Mang đến bàn khách đang gọi món để phục vụ [E]',
          };
        }
      } else {
        // Check closest station for upgrade (< configRef.current.interactDistance)
        let closestStation: StationUpgradeState | null = null;
        let minDistance = configRef.current.interactDistance;

        for (const st of stationsRef.current) {
          const dist = playerPosRef.current.distanceTo(st.position);
          if (dist <= minDistance) {
            minDistance = dist;
            closestStation = st;
          }
        }

        if (closestStation) {
          if (isCarryingPCBoxRef.current) {
            newInteraction = {
              type: 'station_upgrade',
              stationId: closestStation.id,
              distance: parseFloat(minDistance.toFixed(2)),
              text: `[${configRef.current.interactKey}] Lắp Đặt Nâng Cấp ${closestStation.name} 📦`,
              subText: 'Đang mang hộp linh kiện PC • Nhấn [E] để nâng cấp máy tính',
            };
          } else {
            newInteraction = {
              type: 'station_upgrade',
              stationId: closestStation.id,
              distance: parseFloat(minDistance.toFixed(2)),
              text: `[${configRef.current.interactKey}] Nâng Cấp ${closestStation.name} (Cần Hộp Linh Kiện)`,
              subText: 'Cần qua đường sang Cửa Hàng PC Hardware mua linh kiện (5.000.000 VNĐ)',
            };
          }
        }
      }

      // Update state if interaction target changed
      const lastInteract = activeInteractionRef.current;
      const hasChanged =
        (!lastInteract && !!newInteraction) ||
        (!!lastInteract && !newInteraction) ||
        (lastInteract && newInteraction && (
          lastInteract.type !== newInteraction.type ||
          ('stationId' in lastInteract && 'stationId' in newInteraction && lastInteract.stationId !== newInteraction.stationId) ||
          ('propertyId' in lastInteract && 'propertyId' in newInteraction && lastInteract.propertyId !== newInteraction.propertyId) ||
          ('subText' in lastInteract && 'subText' in newInteraction && lastInteract.subText !== newInteraction.subText)
        ));

      if (hasChanged) {
        activeInteractionRef.current = newInteraction;
        setActiveInteraction(newInteraction);
        if (newInteraction && newInteraction.type === 'station_upgrade') {
          setActiveStationPrompt({
            stationId: newInteraction.stationId,
            distance: newInteraction.distance,
          });
        } else {
          setActiveStationPrompt(null);
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
    setIsSceneLoaded(true);

    // Asynchronously kick off GLTF model loading without blocking main thread
    loadExternalAvatarAsync();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      // Comprehensive Three.js scene & resource disposal for React StrictMode
      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
        sceneRef.current.clear();
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []); // Strictly empty dependency array

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          moveInputRef.current.forward = 1;
          break;
        case 's':
        case 'arrowdown':
          moveInputRef.current.forward = -1;
          break;
        case 'a':
        case 'arrowleft':
          moveInputRef.current.strafe = -1;
          break;
        case 'd':
        case 'arrowright':
          moveInputRef.current.strafe = 1;
          break;
        case 'b':
          e.preventDefault();
          setIsBackpackOpen(prev => !prev);
          break;
        case 'f':
          e.preventDefault();
          if (activePickupFurnitureRef.current) {
            handlePickupFurniture(activePickupFurnitureRef.current.instanceId);
          }
          break;
        case 'r':
          if (buildModeItemRef.current) {
            e.preventDefault();
            const step = Math.PI / 4;
            ghostRotationYRef.current = (ghostRotationYRef.current + step) % (Math.PI * 2);
            triggerPopup(`🔄 Xoay: ${Math.round((ghostRotationYRef.current * 180) / Math.PI)}°`, playerPosRef.current, '#c084fc');
          }
          break;
        case configRef.current.interactKey.toLowerCase():
          e.preventDefault();
          if (buildModeItemRef.current) {
            // In Build Mode, pressing [E] finalizes placement
            handleFinalizeBuildPlacement();
          } else if (selectedUpgradeStationRef.current) {
            setSelectedUpgradeStation(null);
          } else {
            handleInteract();
          }
          break;
        case 'escape':
          if (buildModeItemRef.current) {
            cancelBuildMode();
          }
          setIsHardwareShopOpen(false);
          setIsBackpackOpen(false);
          setSelectedUpgradeStation(null);
          setInspectCustomer(null);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 's':
        case 'arrowup':
        case 'arrowdown':
          moveInputRef.current.forward = 0;
          break;
        case 'a':
        case 'd':
        case 'arrowleft':
        case 'arrowright':
          moveInputRef.current.strafe = 0;
          break;
      }
    };

    // Item Rotation (Scroll Wheel): scrolling Mouse Wheel (Up/Down) rotates Ghost mesh around Y-axis
    const handleWheel = (e: WheelEvent) => {
      if (buildModeItemRef.current) {
        e.preventDefault();
        const step = Math.PI / 4; // 45 degrees
        if (e.deltaY > 0) {
          ghostRotationYRef.current = (ghostRotationYRef.current + step) % (Math.PI * 2);
        } else {
          ghostRotationYRef.current = (ghostRotationYRef.current - step + Math.PI * 2) % (Math.PI * 2);
        }
        triggerPopup(`🔄 Xoay: ${Math.round((ghostRotationYRef.current * 180) / Math.PI)}°`, playerPosRef.current, '#c084fc');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []); // Strictly empty dependency array

  // Build Mode Hologram & Solid Furniture Creation Helpers
  const createItemMeshGroup = (item: HardwareItemDefinition, isGhost: boolean): THREE.Group => {
    const group = new THREE.Group();
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });

    const getMaterial = (baseColor: string | number, emissiveColor?: string | number) => {
      if (isGhost) {
        return isGhostValidRef.current ? greenMat : redMat;
      }
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.35,
        metalness: 0.5,
        emissive: emissiveColor || 0x000000,
        emissiveIntensity: emissiveColor ? 1.5 : 0,
      });
    };

    const [bx, by, bz] = item.boxDimensions;

    switch (item.category) {
      case 'Desk': {
        // Table top
        const topGeo = new THREE.BoxGeometry(bx, 0.05, bz);
        const topMesh = new THREE.Mesh(topGeo, getMaterial(item.primaryColor));
        topMesh.position.y = by - 0.025;
        topMesh.castShadow = !isGhost;
        topMesh.receiveShadow = !isGhost;
        group.add(topMesh);

        // LED Neon Edge Strip for T3, T4, T5
        if (item.tier >= 3 && item.accentColor) {
          const edgeGeo = new THREE.BoxGeometry(bx + 0.02, 0.015, bz + 0.02);
          const edgeMesh = new THREE.Mesh(edgeGeo, getMaterial(item.accentColor, item.glowColor || item.accentColor));
          edgeMesh.position.y = by - 0.04;
          group.add(edgeMesh);
        }

        // 4 Legs
        const legRadius = 0.035;
        const legHeight = by - 0.05;
        const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 12);
        const legMat = getMaterial(0x1e293b);

        const legOffsets = [
          [-bx / 2 + 0.08, -bz / 2 + 0.08],
          [bx / 2 - 0.08, -bz / 2 + 0.08],
          [-bx / 2 + 0.08, bz / 2 - 0.08],
          [bx / 2 - 0.08, bz / 2 - 0.08],
        ];

        legOffsets.forEach(([ox, oz]) => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(ox, legHeight / 2, oz);
          leg.castShadow = !isGhost;
          group.add(leg);
        });
        break;
      }

      case 'Chair': {
        // Seat cushion
        const seatGeo = new THREE.BoxGeometry(bx * 0.85, 0.08, bz * 0.85);
        const seatMesh = new THREE.Mesh(seatGeo, getMaterial(item.primaryColor));
        seatMesh.position.y = 0.45;
        group.add(seatMesh);

        // Backrest
        const backHeight = by - 0.45;
        const backGeo = new THREE.BoxGeometry(bx * 0.8, backHeight, 0.08);
        const backMesh = new THREE.Mesh(backGeo, getMaterial(item.accentColor));
        backMesh.position.set(0, 0.45 + backHeight / 2, -bz * 0.35);
        group.add(backMesh);

        // Headrest / Wings for T3, T4, T5
        if (item.tier >= 3) {
          const headGeo = new THREE.BoxGeometry(bx * 0.5, 0.16, 0.1);
          const headMesh = new THREE.Mesh(headGeo, getMaterial(item.glowColor || item.accentColor));
          headMesh.position.set(0, by - 0.1, -bz * 0.35);
          group.add(headMesh);
        }

        // Piston & Star Base
        const pistonGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12);
        const pistonMesh = new THREE.Mesh(pistonGeo, getMaterial(0x334155));
        pistonMesh.position.y = 0.225;
        group.add(pistonMesh);

        // 5 Wheels base
        const baseGeo = new THREE.CylinderGeometry(bx * 0.45, bx * 0.45, 0.04, 8);
        const baseMesh = new THREE.Mesh(baseGeo, getMaterial(0x0f172a));
        baseMesh.position.y = 0.04;
        group.add(baseMesh);
        break;
      }

      case 'Monitor': {
        // Stand base
        const baseGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.02, 16);
        const baseMesh = new THREE.Mesh(baseGeo, getMaterial(0x1e293b));
        baseMesh.position.y = 0.01;
        group.add(baseMesh);

        // Stand pole
        const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12);
        const poleMesh = new THREE.Mesh(poleGeo, getMaterial(0x334155));
        poleMesh.position.y = 0.11;
        group.add(poleMesh);

        // Screen bezel & panel
        const screenGeo = new THREE.BoxGeometry(bx, by - 0.12, 0.03);
        const screenMesh = new THREE.Mesh(screenGeo, getMaterial(item.primaryColor));
        screenMesh.position.set(0, 0.12 + (by - 0.12) / 2, 0);
        group.add(screenMesh);

        // Display panel glow
        const dispGeo = new THREE.PlaneGeometry(bx * 0.94, (by - 0.12) * 0.9);
        const dispMat = isGhost
          ? (isGhostValidRef.current ? greenMat : redMat)
          : new THREE.MeshBasicMaterial({ color: item.glowColor || 0x06b6d4 });
        const dispMesh = new THREE.Mesh(dispGeo, dispMat);
        dispMesh.position.set(0, 0.12 + (by - 0.12) / 2, 0.018);
        group.add(dispMesh);
        break;
      }

      case 'PCCase': {
        // Main tower body
        const caseGeo = new THREE.BoxGeometry(bx, by, bz);
        const caseMesh = new THREE.Mesh(caseGeo, getMaterial(item.primaryColor));
        caseMesh.position.y = by / 2;
        group.add(caseMesh);

        // Glass side panel
        const glassGeo = new THREE.PlaneGeometry(bz * 0.85, by * 0.85);
        const glassMat = isGhost
          ? (isGhostValidRef.current ? greenMat : redMat)
          : new THREE.MeshStandardMaterial({
              color: 0x111827,
              transparent: true,
              opacity: 0.6,
              roughness: 0.1,
            });
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        glassMesh.position.set(bx / 2 + 0.002, by / 2, 0);
        glassMesh.rotation.y = Math.PI / 2;
        group.add(glassMesh);

        // ARGB Front LED Bars
        if (item.accentColor) {
          const ledGeo = new THREE.BoxGeometry(bx * 0.8, 0.02, 0.01);
          const ledMesh = new THREE.Mesh(ledGeo, getMaterial(item.accentColor, item.glowColor || item.accentColor));
          ledMesh.position.set(0, by * 0.7, bz / 2 + 0.002);
          group.add(ledMesh);
        }
        break;
      }

      case 'Keyboard': {
        const kbGeo = new THREE.BoxGeometry(bx, by, bz);
        const kbMesh = new THREE.Mesh(kbGeo, getMaterial(item.primaryColor));
        kbMesh.position.y = by / 2;
        group.add(kbMesh);

        // Keycaps surface
        const keysGeo = new THREE.BoxGeometry(bx * 0.92, 0.015, bz * 0.85);
        const keysMesh = new THREE.Mesh(keysGeo, getMaterial(item.accentColor, item.glowColor));
        keysMesh.position.y = by + 0.005;
        group.add(keysMesh);
        break;
      }

      case 'Mouse': {
        const mouseGeo = new THREE.BoxGeometry(bx, by, bz);
        const mouseMesh = new THREE.Mesh(mouseGeo, getMaterial(item.primaryColor));
        mouseMesh.position.y = by / 2;
        group.add(mouseMesh);

        // Mousepad underneath
        const padGeo = new THREE.BoxGeometry(bx * 2.8, 0.005, bz * 2.2);
        const padMesh = new THREE.Mesh(padGeo, getMaterial(0x0f172a, item.accentColor));
        padMesh.position.y = 0.002;
        group.add(padMesh);
        break;
      }

      case 'Headset': {
        // Headband arch
        const bandGeo = new THREE.TorusGeometry(bx * 0.42, 0.015, 8, 24, Math.PI);
        const bandMesh = new THREE.Mesh(bandGeo, getMaterial(item.primaryColor));
        bandMesh.position.set(0, by * 0.7, 0);
        bandMesh.rotation.z = Math.PI;
        group.add(bandMesh);

        // 2 Ear cups
        const cupGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16);
        [-bx * 0.42, bx * 0.42].forEach(ox => {
          const cup = new THREE.Mesh(cupGeo, getMaterial(item.accentColor, item.glowColor));
          cup.position.set(ox, by * 0.4, 0);
          cup.rotation.z = Math.PI / 2;
          group.add(cup);
        });
        break;
      }
    }

    return group;
  };

  // Create faint transparent wireframe holograms for bare desk slots to guide the player
  const createSlotGuideHologram = (_slotName: DeskSlotName, category: HardwareCategory): THREE.Group => {
    const group = new THREE.Group();
    const holoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.32,
      wireframe: true,
    });

    switch (category) {
      case 'Monitor': {
        const scr = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.03), holoMat);
        scr.position.y = 0.28;
        group.add(scr);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8), holoMat);
        pole.position.y = 0.09;
        group.add(pole);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.015, 12), holoMat);
        base.position.y = 0.008;
        group.add(base);
        break;
      }
      case 'Keyboard': {
        const kb = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.15), holoMat);
        kb.position.y = 0.01;
        group.add(kb);
        break;
      }
      case 'Mouse': {
        const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.13), holoMat);
        mouse.position.y = 0.015;
        group.add(mouse);
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.005, 0.22), holoMat);
        pad.position.y = 0.002;
        group.add(pad);
        break;
      }
      case 'PCCase': {
        const pc = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.42), holoMat);
        pc.position.y = 0.22;
        group.add(pc);
        break;
      }
      case 'Headset': {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 16, Math.PI), holoMat);
        arch.position.y = 0.12;
        arch.rotation.z = Math.PI;
        group.add(arch);
        break;
      }
      case 'Chair': {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), holoMat);
        seat.position.y = 0.45;
        group.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.06), holoMat);
        back.position.set(0, 0.74, -0.2);
        group.add(back);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), holoMat);
        pole.position.y = 0.225;
        group.add(pole);
        break;
      }
    }
    return group;
  };

  // Show floating 3D Green Checkmark UI Icon above completed desk (temporary: 2.5s)
  const showDeskCompletionCheckmark = (deskRecord: {
    deskId: string;
    center: THREE.Vector3;
    topY: number;
    checkmarkMesh?: THREE.Group;
    checkmarkTimeoutId?: any;
  }) => {
    // Clear any previous timer or existing mesh
    if (deskRecord.checkmarkTimeoutId) {
      clearTimeout(deskRecord.checkmarkTimeoutId);
      deskRecord.checkmarkTimeoutId = undefined;
    }
    if (deskRecord.checkmarkMesh && sceneRef.current) {
      sceneRef.current.remove(deskRecord.checkmarkMesh);
      deskRecord.checkmarkMesh = undefined;
    }

    const checkmarkGroup = new THREE.Group();

    // Glowing outer ring
    const ringGeo = new THREE.TorusGeometry(0.26, 0.025, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    checkmarkGroup.add(ringMesh);

    // Center circular badge
    const discGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24);
    const discMat = new THREE.MeshBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.9 });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.rotation.x = Math.PI / 2;
    checkmarkGroup.add(discMesh);

    // White Checkmark limbs '✓'
    const armMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.035), armMat);
    arm1.position.set(-0.06, -0.04, 0.02);
    arm1.rotation.z = -Math.PI / 4;
    checkmarkGroup.add(arm1);

    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.035), armMat);
    arm2.position.set(0.05, 0.03, 0.02);
    arm2.rotation.z = Math.PI / 4;
    checkmarkGroup.add(arm2);

    checkmarkGroup.position.set(deskRecord.center.x, deskRecord.topY + 1.15, deskRecord.center.z);
    sceneRef.current?.add(checkmarkGroup);
    deskRecord.checkmarkMesh = checkmarkGroup;

    // Action: Wrap display logic in a timer. Show for 2.5s, then automatically destroy / hide!
    deskRecord.checkmarkTimeoutId = setTimeout(() => {
      if (deskRecord.checkmarkMesh) {
        deskRecord.checkmarkMesh.visible = false;
        if (sceneRef.current) {
          sceneRef.current.remove(deskRecord.checkmarkMesh);
        }
        deskRecord.checkmarkMesh = undefined;
      }
      deskRecord.checkmarkTimeoutId = undefined;
    }, 2500);
  };

  // Register newly completed desk into active stations so NPC customers can pathfind to it
  const registerDeskAsCustomerStation = (deskRecord: {
    deskId: string;
    group: THREE.Group;
    center: THREE.Vector3;
    rotationY: number;
    slots: {
      Monitor: PlacedFurnitureItem | null;
      Keyboard: PlacedFurnitureItem | null;
      Mouse: PlacedFurnitureItem | null;
      PCCase: PlacedFurnitureItem | null;
      Chair: PlacedFurnitureItem | null;
    };
    stationId?: number;
  }) => {
    const stationId = 100 + stationsRef.current.length;
    deskRecord.stationId = stationId;

    const pcTier = deskRecord.slots.PCCase?.tier || 2;
    const monTier = deskRecord.slots.Monitor?.tier || 2;
    const chairTier = deskRecord.slots.Chair?.tier || 2;

    const newStation: StationUpgradeState = {
      id: stationId,
      name: `Bàn PC Custom #${stationId - 99} (${deskRecord.slots.PCCase?.item.tierName || 'Gaming'})`,
      isOccupied: false,
      timeRemaining: 0,
      position: deskRecord.center.clone(),
      sitPoint: deskRecord.center.clone(),
      gpuLevel: pcTier,
      ramLevel: pcTier,
      monitorLevel: monTier,
      currentCustomerType: '',
      totalEarnedFromStation: 0,
      stationGroup: deskRecord.group,
      screenMesh: undefined,
      screenLight: undefined,
      pcCaseLedMesh: undefined,
      parentDeskId: deskRecord.deskId,
    };

    // Query attached chair and calculate exact sitPoint, cushion height, and screen facing rotation
    updateStationChairTransform(newStation);
    stationsRef.current.push(newStation);
  };

  // Raycast Pickup ([F] Key): Tháo gỡ vật phẩm và cất lại vào Balo
  const handlePickupFurniture = (instanceId: string) => {
    const itemIndex = placedFurnitureRef.current.findIndex(p => p.instanceId === instanceId);
    if (itemIndex === -1) return;
    const placedItem = placedFurnitureRef.current[itemIndex];

    // If picking up a Desk:
    if (placedItem.category === 'Desk') {
      const deskRecord = placedDesksRegistryRef.current.get(instanceId);
      if (deskRecord) {
        // 1. Return any accessories attached to this desk back to backpack
        const slotKeys: DeskSlotName[] = ['Monitor', 'Keyboard', 'Mouse', 'PCCase', 'Headset', 'Chair'];
        slotKeys.forEach(sName => {
          const attached = deskRecord.slots[sName];
          if (attached) {
            const attMesh = placedFurnitureGroupsRef.current.get(attached.instanceId);
            if (attMesh && sceneRef.current) {
              sceneRef.current.remove(attMesh);
            }
            placedFurnitureGroupsRef.current.delete(attached.instanceId);
            placedFurnitureCollidersRef.current.delete(attached.instanceId);
            placedFurnitureRef.current = placedFurnitureRef.current.filter(p => p.instanceId !== attached.instanceId);

            const recoveredAtt: InventoryBackpackItem = {
              instanceId: `bp_${Date.now()}_${Math.random()}`,
              itemDefId: attached.itemDefId,
              item: attached.item,
              acquiredAt: Date.now(),
            };
            backpackRef.current = [...backpackRef.current, recoveredAtt];
          }
        });

        // 2. Remove holograms from scene
        Object.values(deskRecord.holograms).forEach(holo => {
          if (holo && sceneRef.current) sceneRef.current.remove(holo);
        });

        // 3. Remove checkmark
        if (deskRecord.checkmarkTimeoutId) {
          clearTimeout(deskRecord.checkmarkTimeoutId);
          deskRecord.checkmarkTimeoutId = undefined;
        }
        if (deskRecord.checkmarkMesh && sceneRef.current) {
          sceneRef.current.remove(deskRecord.checkmarkMesh);
          deskRecord.checkmarkMesh = undefined;
        }

        // 4. Remove active customer station if registered
        if (deskRecord.stationId) {
          stationsRef.current = stationsRef.current.filter(s => s.id !== deskRecord.stationId);
        }

        // 5. Remove collider and boundary references
        collidersRef.current = collidersRef.current.filter(c => c.name !== `CustomDesk_${instanceId}`);
        placedDesksBoundsRef.current = placedDesksBoundsRef.current.filter(d => d.id !== instanceId);
        placedDesksRegistryRef.current.delete(instanceId);
      }
    } else {
      // If picking up an accessory placed in a Desk slot
      if (placedItem.parentDeskId && placedItem.slotType) {
        const parentDesk = placedDesksRegistryRef.current.get(placedItem.parentDeskId);
        if (parentDesk) {
          parentDesk.slots[placedItem.slotType] = null;
          // Re-show faint guide hologram for this empty slot!
          if (parentDesk.holograms[placedItem.slotType]) {
            parentDesk.holograms[placedItem.slotType]!.visible = true;
          }
          // If desk was ready for customer, mark false and hide checkmark
          if (parentDesk.isReadyForCustomer) {
            parentDesk.isReadyForCustomer = false;
            if (parentDesk.checkmarkTimeoutId) {
              clearTimeout(parentDesk.checkmarkTimeoutId);
              parentDesk.checkmarkTimeoutId = undefined;
            }
            if (parentDesk.checkmarkMesh && sceneRef.current) {
              sceneRef.current.remove(parentDesk.checkmarkMesh);
              parentDesk.checkmarkMesh = undefined;
            }
            if (parentDesk.stationId) {
              stationsRef.current = stationsRef.current.filter(s => s.id !== parentDesk.stationId);
            }
            triggerPopup('⚠️ Bàn máy bị tháo linh kiện! Tạm ngừng nhận khách.', parentDesk.center, '#ef4444');
            addLog(`[Cyber Setup] Đã tháo ${placedItem.item.name}! Bàn máy tạm dừng đón khách vì chưa đủ 5 món.`, 'info');
          }
        }
      }
    }

    // Remove the 3D solid mesh from scene
    const solidMesh = placedFurnitureGroupsRef.current.get(instanceId);
    if (solidMesh && sceneRef.current) {
      sceneRef.current.remove(solidMesh);
    }
    placedFurnitureGroupsRef.current.delete(instanceId);
    placedFurnitureCollidersRef.current.delete(instanceId);
    placedFurnitureRef.current = placedFurnitureRef.current.filter(p => p.instanceId !== instanceId);

    // Push item back to Backpack array
    const recoveredItem: InventoryBackpackItem = {
      instanceId: `bp_${Date.now()}_${Math.random()}`,
      itemDefId: placedItem.itemDefId,
      item: placedItem.item,
      acquiredAt: Date.now(),
    };
    const updatedBackpack = [...backpackRef.current, recoveredItem];
    backpackRef.current = updatedBackpack;
    setBackpack(updatedBackpack);

    // Audio chime & notification popup
    soundController.playCashChime();
    triggerPopup(`📦 Đã thu hồi: ${placedItem.item.name}! (Cất vào Balo)`, playerPosRef.current, '#38bdf8');
    addLog(`[Thu Hồi - Phím F] Đã thu hồi ${placedItem.item.name} về Balo [B].`, 'success');
    activePickupFurnitureRef.current = null;
  };

  // Enter Build Mode from Backpack
  const enterBuildMode = (entry: InventoryBackpackItem) => {
    setIsBackpackOpen(false);
    setBuildModeItem(entry);
    buildModeItemRef.current = entry;
    ghostRotationYRef.current = 0; // Reset rotation offset

    // Remove old ghost if any
    if (ghostMeshRef.current && sceneRef.current) {
      sceneRef.current.remove(ghostMeshRef.current);
      ghostMeshRef.current = null;
    }

    if (!sceneRef.current) return;

    // Create ghost mesh
    const ghost = createItemMeshGroup(entry.item, true);
    ghostMeshRef.current = ghost;
    sceneRef.current.add(ghost);

    addLog(`Đã vào Chế Độ Đặt (Build Mode): ${entry.item.name}. Cuộn chuột/R để xoay, Chuột Trái/[E] để đặt!`, 'info');
    triggerPopup(`🔧 Bắt đầu đặt: ${entry.item.name} (Cuộn chuột/R để xoay)`, playerPosRef.current, '#38bdf8');
  };

  // Cancel Build Mode
  const cancelBuildMode = () => {
    if (ghostMeshRef.current && sceneRef.current) {
      sceneRef.current.remove(ghostMeshRef.current);
      ghostMeshRef.current = null;
    }
    setBuildModeItem(null);
    buildModeItemRef.current = null;
    activeSnappedSlotRef.current = null;
    addLog('Đã thoát Chế Độ Đặt (Build Mode).', 'info');
  };

  // Finalize placement (Left Click or [E])
  const handleFinalizeBuildPlacement = () => {
    const active = buildModeItemRef.current;
    const ghost = ghostMeshRef.current;
    if (!active || !ghost || !sceneRef.current) return;

    if (!isGhostValidRef.current) {
      addLog('Vị trí không hợp lệ! Đang bị va chạm hoặc khe cắm đã có linh kiện.', 'error');
      triggerPopup('Vị trí không hợp lệ! ❌', ghost.position, '#ef4444');
      soundController.playPowerSwitch(false);
      return;
    }

    // 1. Instantiate the real solid 3D object at exact Ghost position and rotation
    const solidMesh = createItemMeshGroup(active.item, false);
    solidMesh.position.copy(ghost.position);
    solidMesh.rotation.copy(ghost.rotation);
    sceneRef.current.add(solidMesh);

    const isDesk = active.item.category === 'Desk';
    const snapped = activeSnappedSlotRef.current;

    // 2. Save to placed items array
    const placedEntry: PlacedFurnitureItem = {
      instanceId: `placed_${Date.now()}_${Math.random()}`,
      itemDefId: active.itemDefId,
      category: active.item.category,
      tier: active.item.tier,
      position: [solidMesh.position.x, solidMesh.position.y, solidMesh.position.z],
      rotationY: solidMesh.rotation.y,
      item: active.item,
      parentDeskId: snapped ? snapped.deskId : undefined,
      slotType: snapped ? snapped.slotName : undefined,
    };

    // Assign BoxCollider and Raycast Interactable Layer metadata
    solidMesh.userData = {
      interactable: true,
      pickupable: true,
      instanceId: placedEntry.instanceId,
      itemName: active.item.name,
      category: active.item.category,
      tier: active.item.tier,
      parentDeskId: placedEntry.parentDeskId,
      slotType: placedEntry.slotType,
    };

    placedFurnitureRef.current.push(placedEntry);
    placedFurnitureGroupsRef.current.set(placedEntry.instanceId, solidMesh);
    placedFurnitureCollidersRef.current.set(placedEntry.instanceId, new THREE.Box3().setFromObject(solidMesh));

    // 3. Desk Auto-Snap Slots & Hardware Holograms Setup
    if (isDesk) {
      const box = new THREE.Box3().setFromObject(solidMesh);
      const size = new THREE.Vector3();
      box.getSize(size);
      const topY = solidMesh.position.y + active.item.boxDimensions[1];

      // Spawn faint guide holograms for the desk slots
      const hologramsMap: Record<string, THREE.Group> = {};
      DESK_SNAP_SLOTS.forEach(sDef => {
        const holo = createSlotGuideHologram(sDef.name, sDef.category);
        const cos = Math.cos(solidMesh.rotation.y);
        const sin = Math.sin(solidMesh.rotation.y);
        const [rx, ry, rz] = sDef.relativePos;
        const wX = solidMesh.position.x + (rx * cos + rz * sin);
        const wY = topY + ry;
        const wZ = solidMesh.position.z + (-rx * sin + rz * cos);
        holo.position.set(wX, wY, wZ);
        holo.rotation.y = solidMesh.rotation.y + sDef.relativeRotY;
        sceneRef.current?.add(holo);
        hologramsMap[sDef.name] = holo;
      });

      placedDesksRegistryRef.current.set(placedEntry.instanceId, {
        deskId: placedEntry.instanceId,
        group: solidMesh,
        deskItem: active.item,
        center: solidMesh.position.clone(),
        rotationY: solidMesh.rotation.y,
        topY: topY,
        box: box,
        size: size,
        isReadyForCustomer: false,
        slots: {
          Monitor: null,
          Keyboard: null,
          Mouse: null,
          PCCase: null,
          Headset: null,
          Chair: null,
        },
        holograms: hologramsMap,
      });

      placedDesksBoundsRef.current.push({
        id: placedEntry.instanceId,
        box,
        topY,
        center: solidMesh.position.clone(),
        size,
      });

      // Add physical collider to world
      collidersRef.current.push({
        name: `CustomDesk_${placedEntry.instanceId}`,
        min: new THREE.Vector3(
          solidMesh.position.x - active.item.boxDimensions[0] / 2,
          0,
          solidMesh.position.z - active.item.boxDimensions[2] / 2
        ),
        max: new THREE.Vector3(
          solidMesh.position.x + active.item.boxDimensions[0] / 2,
          active.item.boxDimensions[1],
          solidMesh.position.z + active.item.boxDimensions[2] / 2
        ),
      });

      addLog(`Đã lắp đặt Bàn Máy Tính! Hologram hướng dẫn 5 vị trí linh kiện đã kích hoạt.`, 'info');
    } else if (snapped) {
      // Snapped into a specific Desk Slot!
      const parentDesk = placedDesksRegistryRef.current.get(snapped.deskId);
      if (parentDesk) {
        parentDesk.slots[snapped.slotName] = placedEntry;

        // Hide corresponding hologram mesh
        if (parentDesk.holograms[snapped.slotName]) {
          parentDesk.holograms[snapped.slotName]!.visible = false;
        }

        // 'Ready to Play' Validation: Check if ALL 5 main slots are filled!
        const s = parentDesk.slots;
        const allFilled = !!(s.Monitor && s.Keyboard && s.Mouse && s.PCCase && s.Chair);

        if (allFilled && !parentDesk.isReadyForCustomer) {
          parentDesk.isReadyForCustomer = true;
          showDeskCompletionCheckmark(parentDesk);
          registerDeskAsCustomerStation(parentDesk);
          triggerPopup('🎉 BÀN MÁY ĐÃ HOÀN THIỆN 100%! Khách hàng có thể vào chơi! ✅🎮', parentDesk.center, '#10b981');
          addLog(`[Cyber Setup] Hoàn thiện trọn bộ 5/5 linh kiện trên bàn (${parentDesk.deskItem.name})! Đã sẵn sàng đón khách.`, 'success');
        } else {
          const missing: string[] = [];
          if (!s.Monitor) missing.push('Màn hình');
          if (!s.PCCase) missing.push('Case PC');
          if (!s.Keyboard) missing.push('Bàn phím');
          if (!s.Mouse) missing.push('Chuột');
          if (!s.Chair) missing.push('Ghế');
          if (missing.length > 0) {
            addLog(`Đã gắn ${active.item.name} vào bàn! Còn thiếu: ${missing.join(', ')} để đón khách.`, 'info');
          }
        }
      }
    } else if (active.item.category === 'Chair') {
      // If Chair was placed freely without snapping, check if there is an unequipped desk nearby (<= 2.2m)
      let nearbyDesk: any = null;
      let minDeskDist = 2.2;
      for (const d of placedDesksRegistryRef.current.values()) {
        if (!d.slots.Chair) {
          const dist = solidMesh.position.distanceTo(d.center);
          if (dist < minDeskDist) {
            minDeskDist = dist;
            nearbyDesk = d;
          }
        }
      }

      if (nearbyDesk) {
        placedEntry.parentDeskId = nearbyDesk.deskId;
        placedEntry.slotType = 'Chair';
        solidMesh.userData.parentDeskId = nearbyDesk.deskId;
        solidMesh.userData.slotType = 'Chair';
        nearbyDesk.slots.Chair = placedEntry;
        if (nearbyDesk.holograms.Chair) {
          nearbyDesk.holograms.Chair.visible = false;
        }

        const s = nearbyDesk.slots;
        const allFilled = !!(s.Monitor && s.Keyboard && s.Mouse && s.PCCase && s.Chair);
        if (allFilled && !nearbyDesk.isReadyForCustomer) {
          nearbyDesk.isReadyForCustomer = true;
          showDeskCompletionCheckmark(nearbyDesk);
          registerDeskAsCustomerStation(nearbyDesk);
          triggerPopup('🎉 BÀN MÁY ĐÃ HOÀN THIỆN 100%! Khách hàng có thể vào chơi! ✅🎮', nearbyDesk.center, '#10b981');
          addLog(`[Cyber Setup] Hoàn thiện trọn bộ 5/5 linh kiện trên bàn (${nearbyDesk.deskItem.name})! Đã sẵn sàng đón khách.`, 'success');
        }
      }
    }

    // 4. Remove the item from Backpack
    const remaining = backpackRef.current.filter(b => b.instanceId !== active.instanceId);
    setBackpack(remaining);
    backpackRef.current = remaining;

    soundController.playCashChime();
    addLog(`Đã lắp đặt thành công: ${active.item.name}!`, 'success');
    triggerPopup(`✅ Đã lắp đặt: ${active.item.name} 🔨`, solidMesh.position, '#10b981');

    // 5. Check if player has more of the same item in backpack
    const nextSame = remaining.find(b => b.itemDefId === active.itemDefId);
    if (nextSame) {
      setBuildModeItem(nextSame);
      buildModeItemRef.current = nextSame;
      if (ghostMeshRef.current && sceneRef.current) {
        sceneRef.current.remove(ghostMeshRef.current);
      }
      const newGhost = createItemMeshGroup(nextSame.item, true);
      ghostMeshRef.current = newGhost;
      sceneRef.current.add(newGhost);
      addLog(`Tiếp tục đặt món thứ 2 (${nextSame.item.name}) trong Balo...`, 'info');
    } else {
      cancelBuildMode();
    }
  };

  // Buy item from Hardware Store UI
  const handleBuyItemFromStore = (item: HardwareItemDefinition): boolean => {
    if (totalMoneyRef.current < item.price) {
      addLog(`Không đủ tiền! Cần ${item.price.toLocaleString('vi-VN')} VNĐ để mua ${item.name}.`, 'error');
      triggerPopup(`Không đủ tiền mua ${item.name}! ❌`, playerPosRef.current, '#ef4444');
      soundController.playPowerSwitch(false);
      return false;
    }

    // Deduct money
    setTotalMoney(m => m - item.price);
    if (onMoneyEarnedRef.current) onMoneyEarnedRef.current(-item.price);

    // Add to backpack
    const newEntry: InventoryBackpackItem = {
      instanceId: `bp_${Date.now()}_${Math.random()}`,
      itemDefId: item.id,
      item,
      acquiredAt: Date.now(),
    };
    setBackpack(prev => [...prev, newEntry]);
    backpackRef.current = [...backpackRef.current, newEntry];

    soundController.playCashChime();
    addLog(`Đã mua ${item.name} (-${item.price.toLocaleString('vi-VN')} VNĐ)! Đã cất vào Balo [B].`, 'success');
    triggerPopup(`🛍️ Đã mua ${item.name}! Nhấn [B] để xem Balo`, playerPosRef.current, '#10b981');
    return true;
  };

  // Pointer controls
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    playerYawRef.current -= dx * 0.0035;
    playerPitchRef.current -= dy * 0.0035;
    playerPitchRef.current = Math.max(-1.2, Math.min(1.2, playerPitchRef.current));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isPointerDownRef.current = false;
    // Check if it was a quick click without much dragging (e.g., < 8 pixels)
    const dist = Math.hypot(e.clientX - pointerStartPosRef.current.x, e.clientY - pointerStartPosRef.current.y);
    if (dist < 8) {
      if (buildModeItemRef.current) {
        // Left click in Build Mode finalizes placement!
        handleFinalizeBuildPlacement();
      }
    }
  };

  const handleBadgeSlotClick = (slotIdx: number) => {
    const activeEntities = customersRef.current.filter(
      c => c.mesh && (c.state === 'playing' || c.state === 'waiting' || c.state === 'walking')
    );
    const cust = activeEntities[slotIdx];
    if (cust) {
      setInspectCustomer({ ...cust });
    }
  };

  const openUpgradeModal = () => {
    if (activeStationPrompt) {
      const st = stationsRef.current.find(s => s.id === activeStationPrompt.stationId);
      if (st) setSelectedUpgradeStation({ ...st });
    }
  };

  const toggleCapsuleColliders = () => {
    setShowCapsuleColliders(prev => {
      const nextVal = !prev;
      customersRef.current.forEach(c => {
        if (c.bodyLimbs?.capsuleCollider) {
          c.bodyLimbs.capsuleCollider.visible = nextVal;
        }
      });
      return nextVal;
    });
  };

  const focusCameraOnCustomer = (cust: CustomerSimEntity) => {
    if (!cust.mesh) return;
    const targetX = cust.mesh.position.x;
    const targetZ = cust.state === 'playing' ? cust.mesh.position.z + 0.88 : cust.mesh.position.z + 1.15;
    playerPosRef.current.set(targetX, 1.12, targetZ);
    playerYawRef.current = Math.PI; // Face directly at customer
    playerPitchRef.current = -0.12;
    setInspectCustomer(null);
    triggerPopup('🔍 Đã Focus Cận Cảnh Khách Hàng 3D!', playerPosRef.current, '#a855f7');
  };

  return (
    <div className="relative w-full h-[620px] md:h-[680px] bg-slate-950 rounded-xl overflow-hidden select-none border border-slate-800 shadow-2xl">
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Instant Loading Fallback State */}
      {!isSceneLoaded && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-50">
          <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <div className="text-sm font-semibold text-slate-200">Đang khởi tạo không gian 3D Cyber Cafe...</div>
          <div className="text-xs text-slate-400">Tối ưu hóa tài nguyên &amp; Chống tràn bộ nhớ</div>
        </div>
      )}

      {/* OVERHEAD 3D CUSTOMER SATISFACTION BADGES & 2D FLOATING BILLBOARD ORDER BUBBLES */}
      <div ref={badgesContainerRef} className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {[0, 1, 2, 3, 4, 5].map(idx => (
          <div
            key={idx}
            ref={el => { badgeRefs.current[idx] = el; }}
            style={{ display: 'none', position: 'absolute' }}
            onClick={() => handleBadgeSlotClick(idx)}
            className="transform -translate-x-1/2 -translate-y-full pointer-events-auto bg-slate-950/90 border border-emerald-500/50 hover:border-emerald-400 hover:scale-110 active:scale-95 transition-transform text-white rounded-full px-2.5 py-1 shadow-xl flex items-center gap-1.5 cursor-pointer backdrop-blur-sm group select-none"
            title="Bấm để xem chi tiết cách tính điểm hài lòng"
          >
            <span className="badge-emoji text-base">😍</span>
            <span className="badge-score text-xs font-mono font-bold text-emerald-400">70đ</span>
            <span className="badge-stars text-[10px] text-amber-400 font-bold">★★★★★</span>
            <span className="badge-wait text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-semibold hidden">
              Đang chờ
            </span>
          </div>
        ))}

        {/* 2D FLOATING BILLBOARD CANVAS BUBBLES ABOVE PC (F&B NeedsFoodOrDrink) */}
        {[0, 1, 2, 3, 4, 5].map(idx => (
          <div
            key={`order-bubble-${idx}`}
            ref={el => { orderBubbleRefs.current[idx] = el; }}
            style={{ display: 'none', position: 'absolute' }}
            className="transform -translate-x-1/2 -translate-y-full pointer-events-none select-none z-30"
          >
            <div className="flex flex-col items-center animate-bounce">
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs md:text-sm px-3 py-1.5 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.8)] border-2 border-yellow-200 flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-base animate-pulse">🍜</span>
                <span className="tracking-wide">Nước/Mì (+15k)</span>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block ml-0.5" />
              </div>
              <div className="w-0 h-0 border-x-[7px] border-x-transparent border-t-[8px] border-t-orange-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cash / Notification Popups */}
      {floatingPopups.map(popup => (
        <div
          key={popup.id}
          className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full font-bold text-lg md:text-xl drop-shadow-md flex items-center gap-1 animate-bounce z-30"
          style={{
            left: `${popup.x}px`,
            top: `${popup.y}px`,
            color: popup.color || '#34d399',
            opacity: popup.opacity,
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{popup.text}</span>
        </div>
      ))}

      {/* Reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            activeStationPrompt
              ? 'bg-emerald-400 ring-4 ring-emerald-500/40 scale-150'
              : 'bg-white/60 ring-2 ring-black/40'
          }`}
        />
      </div>

      {/* TOP HUD: Money & Quick Spawn */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
        <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            đ
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Quỹ Quán (MoneyManager)
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {totalMoney.toLocaleString('vi-VN')} {config.currencySymbol}
            </div>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsBackpackOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95 border border-emerald-400/40"
            title="Mở Balo [Phím B] chứa linh kiện & bàn ghế đã mua"
          >
            <Package className="w-3.5 h-3.5 text-emerald-200" />
            <span>Balo [B] ({backpack.length})</span>
          </button>

          <button
            onClick={() => setIsHardwareShopOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95 border border-cyan-400/40"
            title="Mở Cửa Hàng PC Hardware & Nội Thất"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-cyan-200" />
            <span>Shop PC</span>
          </button>
          <button
            onClick={toggleCapsuleColliders}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              showCapsuleColliders
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Bật/Tắt hiển thị khung Capsule Collider Unity của khách hàng"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showCapsuleColliders ? 'Collider: BẬT' : 'Collider 3D'}</span>
          </button>

          <button
            onClick={spawnCustomer}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            title="Sinh ngay 1 khách hàng đến quán"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gọi Khách ({customerSpawnCountdown}s)</span>
          </button>

          <button
            onClick={() => {
              setTotalMoney(m => m + 5000000);
              addLog('Đã nạp +5.000.000 VNĐ vào Quỹ Quán (MoneyManager) để thử nghiệm mua mặt bằng!', 'success');
              soundController.playCashChime();
            }}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95 border border-amber-400/40"
            title="Thêm ngay 5.000.000 VNĐ vào Quỹ Quán để thử nghiệm mua mặt bằng"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-200" />
            <span>+5M VNĐ (Test Mua Đất)</span>
          </button>

          <button
            onClick={() => setIsMobileMode(!isMobileMode)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              isMobileMode
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isMobileMode ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
            <span>{isMobileMode ? 'Mobile' : 'PC'}</span>
          </button>

          <button
            onClick={() => { playerPosRef.current.set(0, 1.6, 2.7); }}
            className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Đặt lại vị trí nhân vật"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK ENVIRONMENT CONTROLS TOOLBAR */}
      <div className="absolute top-20 left-4 right-4 pointer-events-auto z-20 flex flex-wrap items-center gap-2">
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 flex flex-wrap items-center gap-1.5 text-xs shadow-lg">
          <div className="text-[10px] font-bold text-slate-400 uppercase px-2 flex items-center gap-1">
            <Smile className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tác Nhân Hài Lòng:</span>
          </div>

          <button
            onClick={() => updateEnvironment('internet')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              internetPlan === 'gigabit'
                ? 'bg-sky-600/80 text-white'
                : internetPlan === 'normal'
                ? 'bg-slate-800 text-slate-200'
                : 'bg-rose-900/80 text-rose-200'
            }`}
            title="Bấm để đổi gói cước mạng"
          >
            <Wifi className="w-3 h-3" />
            <span>Mạng: {internetPlan === 'gigabit' ? '1Gbps (+10)' : internetPlan === 'normal' ? 'Thường (+5)' : 'Lag (-15)'}</span>
          </button>

          <button
            onClick={() => updateEnvironment('ac')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              acEnabled ? 'bg-teal-600/80 text-white' : 'bg-slate-800 text-rose-300'
            }`}
            title="Bật/Tắt điều hòa nhiệt độ"
          >
            <Wind className="w-3 h-3" />
            <span>Điều Hòa: {acEnabled ? '22°C (+8)' : 'Tắt (-10)'}</span>
          </button>

          <button
            onClick={() => updateEnvironment('food')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              foodService ? 'bg-amber-600/80 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Bật/Tắt phục vụ mì cay & nước"
          >
            <Coffee className="w-3 h-3" />
            <span>Đồ Ăn: {foodService ? 'Có (+10)' : 'Không (0)'}</span>
          </button>

          <button
            onClick={() => updateEnvironment('price')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              pricingPolicy === 'cheap'
                ? 'bg-emerald-600/80 text-white'
                : pricingPolicy === 'standard'
                ? 'bg-slate-800 text-slate-200'
                : 'bg-rose-900/80 text-rose-200'
            }`}
            title="Đổi chính sách giá giờ chơi"
          >
            <span>Giá: {pricingPolicy === 'cheap' ? 'Rẻ (+10)' : pricingPolicy === 'standard' ? 'Chuẩn (+5)' : 'Đắt (-10)'}</span>
          </button>
        </div>
      </div>

      {/* RECENT CUSTOMER LOGS BADGE (Queue Console Bottom-Left) */}
      <div className="absolute bottom-16 left-4 hidden md:block max-w-sm pointer-events-none z-20">
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 space-y-1 shadow-2xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nhật Ký Cửa &amp; Hàng Đợi (WaitingQueue)</span>
          </div>
          {customerLogs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className={`text-[11px] truncate leading-relaxed ${
                log.type === 'error'
                  ? 'text-rose-400 font-bold bg-rose-950/40 px-1 rounded animate-pulse'
                  : log.type === 'success'
                  ? 'text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded'
                  : 'text-slate-300'
              }`}
            >
              {log.text}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER INTERACTION PROMPTS: Real Estate Property Purchase, F&B Delivery & Station Upgrade */}
      {activeInteraction && !selectedUpgradeStation && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
          {activeInteraction.type === 'property_purchase' ? (
            <button
              onClick={handleInteract}
              className="bg-amber-950/95 border-2 border-amber-400 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-[0_0_35px_rgba(245,158,11,0.6)] flex items-center gap-3.5 hover:scale-105 active:scale-95 transition-transform animate-pulse"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-2xl border border-amber-400/40">
                🏢
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-amber-400 flex items-center gap-2">
                  <span>{activeInteraction.propertyName}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/40">
                    BÁN MẶT BẰNG
                  </span>
                </div>
                <div className="text-sm md:text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-xs font-black">
                    [{config.interactKey}]
                  </span>
                  <span>Mua mặt bằng mở rộng - Giá: 5.000.000 VNĐ</span>
                </div>
              </div>
            </button>
          ) : activeInteraction.type === 'serve' ? (
            <button
              onClick={handleInteract}
              className="bg-emerald-950/95 border-2 border-emerald-400 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3.5 hover:scale-105 active:scale-95 transition-transform animate-pulse"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-2xl">
                🍲
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-emerald-400">
                  Khách Đang Chờ Món • {activeInteraction.stationName}
                </div>
                <div className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-mono text-xs font-black">
                    [{config.interactKey}]
                  </span>
                  <span>Phục vụ (Thu +15.000 VNĐ &bull; +5đ Hài Lòng)</span>
                </div>
              </div>
            </button>
          ) : activeInteraction.type === 'fridge' ? (
            <button
              onClick={handleInteract}
              className={`border-2 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-3.5 hover:scale-105 active:scale-95 transition-transform ${
                isCarryingFood
                  ? 'bg-amber-950/95 border-amber-400/80 text-amber-200'
                  : 'bg-sky-950/95 border-sky-400/80 text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.4)]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-2xl">
                🥤
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-sky-400">
                  Tủ Mát BEVERAGES &amp; ENERGY • F&amp;B System
                </div>
                <div className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  {!isCarryingFood ? (
                    <>
                      <span className="px-2 py-0.5 rounded bg-sky-500/30 text-sky-300 font-mono text-xs border border-sky-500/50">
                        [{config.interactKey}]
                      </span>
                      <span>Chuẩn bị đồ ăn/uống (Khay Mì &amp; Nước Ngọt)</span>
                    </>
                  ) : (
                    <span className="text-amber-300">Đang bưng khay đồ! Lại bàn khách gọi món để phục vụ [{config.interactKey}]</span>
                  )}
                </div>
              </div>
            </button>
          ) : activeInteraction.type === 'needs_food_hint' ? (
            <div className="bg-amber-950/95 border-2 border-amber-400/80 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-3.5 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                🍜
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-amber-400">
                  {activeInteraction.stationName} Đang Gọi Món!
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Khách gọi Nước/Mì! Hãy lại Tủ Mát [{config.interactKey}] để chuẩn bị đồ ăn</span>
                </div>
              </div>
            </div>
          ) : activeInteraction.type === 'vip_door' ? (
            <button
              onClick={handleInteract}
              className="bg-amber-950/95 border-2 border-amber-400 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-[0_0_35px_rgba(245,158,11,0.6)] flex items-center gap-3.5 hover:scale-105 active:scale-95 transition-transform animate-pulse"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-2xl border border-amber-400/40">
                🚪
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-amber-400 flex items-center gap-2">
                  <span>VIP ZONE • PHÒNG ĐẤU GIẢI</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/40">
                    12 MÁY GAMING
                  </span>
                </div>
                <div className="text-sm md:text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-xs font-black">
                    [{config.interactKey}]
                  </span>
                  <span>{isVipDoorOpen ? 'Đóng cửa phòng VIP' : 'Đẩy cửa phòng VIP'}</span>
                </div>
              </div>
            </button>
          ) : activeInteraction.type === 'hardware_store' ? (
            <button
              onClick={handleInteract}
              className="bg-cyan-950/95 border-2 border-cyan-400 text-cyan-100 shadow-[0_0_35px_rgba(6,182,212,0.6)] backdrop-blur-md rounded-2xl px-6 py-3.5 flex items-center gap-3.5 hover:scale-105 active:scale-95 transition-transform animate-pulse"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-2xl border border-cyan-400/40">
                ⚡
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-cyan-300 flex items-center gap-2">
                  <span>PC HARDWARE &amp; UPGRADES STORE</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/40">
                    7 LOẠI • 5 TIERS
                  </span>
                </div>
                <div className="text-sm md:text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono text-xs font-black">
                    [{config.interactKey}]
                  </span>
                  <span>Mở Menu Cửa Hàng Linh Kiện &amp; Bàn Ghế</span>
                </div>
              </div>
            </button>
          ) : activeInteraction.type === 'pickup_furniture' ? (
            <button
              onClick={handleInteract}
              className="bg-indigo-950/95 border-2 border-indigo-400 text-indigo-100 shadow-[0_0_35px_rgba(99,102,241,0.6)] backdrop-blur-md rounded-2xl px-6 py-3.5 flex items-center gap-3.5 hover:scale-105 active:scale-95 transition-transform animate-pulse"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-2xl border border-indigo-400/40">
                📦
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-indigo-300 flex items-center gap-2">
                  <span>THU HỒI VẬT PHẨM ĐÃ ĐẶT</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/40">
                    CẤT VÀO BALO [B]
                  </span>
                </div>
                <div className="text-sm md:text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded bg-indigo-400 text-slate-950 font-mono text-xs font-black">
                    [F]
                  </span>
                  <span>Tháo gỡ &amp; Cất vào Balo: {activeInteraction.itemName}</span>
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={handleInteract}
              className={`border-2 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-3.5 hover:scale-105 active:scale-95 transition-transform ${
                isCarryingPCBox
                  ? 'bg-emerald-950/95 border-emerald-400/90 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse'
                  : 'bg-slate-950/95 border-slate-700 text-slate-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isCarryingPCBox ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {isCarryingPCBox ? '📦' : <Cpu className="w-5 h-5" />}
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-emerald-400">
                  Bàn Máy 0{activeInteraction.stationId} • Cự ly: {activeInteraction.distance}m
                </div>
                <div className="text-sm md:text-base font-bold text-white flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-xs border border-slate-700">
                    [{config.interactKey}]
                  </span>
                  {isCarryingPCBox ? (
                    <span className="text-emerald-300">Lắp Đặt Nâng Cấp Linh Kiện [E] 🚀</span>
                  ) : (
                    <span>Nâng Cấp Máy (Cần qua shop đối diện mua linh kiện 📦)</span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* PLAYER CARRYING FOOD HUD BADGE (isCarryingFood = true) */}
      {isCarryingFood && (
        <div className="absolute bottom-6 right-4 z-30 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-3.5 py-2.5 rounded-2xl border-2 border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black/30 flex items-center justify-center text-xl animate-bounce">
              🍜
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Đang Bưng Đồ Ăn/Uống</span>
              </div>
              <div className="text-xs md:text-sm font-black text-white">
                Khay Mì Cay &amp; Sting Dâu (+15k)
              </div>
              <div className="text-[10px] text-amber-200">
                Tiến lại bàn khách gọi món &bull; Bấm [{config.interactKey}] Phục vụ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER CARRYING PC HARDWARE BOX HUD BADGE (isCarryingPCBox = true) */}
      {isCarryingPCBox && (
        <div className="absolute bottom-6 right-4 md:right-6 z-30 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white px-4 py-3 rounded-2xl border-2 border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.7)] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-black/40 border border-emerald-400/50 flex items-center justify-center text-2xl animate-bounce shadow-inner">
              📦
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                <span>ĐANG MANG HỘP LINH KIỆN PC</span>
              </div>
              <div className="text-xs font-semibold text-white">
                Mang về bàn máy tiệm net &amp; nhấn <span className="bg-white/20 px-1.5 py-0.5 rounded font-mono text-white font-bold">[{config.interactKey}]</span> để nâng cấp
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER SATISFACTION INSPECT MODAL */}
      {inspectCustomer && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{inspectCustomer.emoji}</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Chi Tiết Điểm Hài Lòng: {inspectCustomer.name}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {inspectCustomer.state === 'waiting' ? 'Đang trong hàng đợi' : 'Đang ngồi chơi máy tính'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectCustomer(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Điểm khởi điểm (Base):</span>
                <span className="text-white font-bold">{inspectCustomer.baseScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chất lượng máy (RAM, VGA, Màn):</span>
                <span className="text-sky-400 font-bold">+{inspectCustomer.computerQualityScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giá thuê máy:</span>
                <span className={inspectCustomer.priceScore >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {inspectCustomer.priceScore >= 0 ? `+${inspectCustomer.priceScore}` : inspectCustomer.priceScore}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian chờ (Queue):</span>
                <span className={inspectCustomer.waitTimePenalty < 0 ? 'text-rose-400 font-bold' : 'text-slate-500 font-bold'}>
                  {inspectCustomer.waitTimePenalty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chất lượng mạng Internet:</span>
                <span className={inspectCustomer.internetBonus >= 0 ? 'text-sky-400 font-bold' : 'text-rose-400 font-bold'}>
                  {inspectCustomer.internetBonus >= 0 ? `+${inspectCustomer.internetBonus}` : inspectCustomer.internetBonus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Điều hòa nhiệt độ:</span>
                <span className={inspectCustomer.acBonus >= 0 ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                  {inspectCustomer.acBonus >= 0 ? `+${inspectCustomer.acBonus}` : inspectCustomer.acBonus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Đồ ăn &amp; Nước:</span>
                <span className={inspectCustomer.foodBonus > 0 ? 'text-amber-400 font-bold' : 'text-slate-500 font-bold'}>
                  {inspectCustomer.foodBonus > 0 ? `+${inspectCustomer.foodBonus}` : '0'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold font-sans">
                <span className="text-white">TỔNG ĐIỂM:</span>
                <span className="text-emerald-400 font-mono text-base">{inspectCustomer.finalScore} / 100</span>
              </div>
            </div>

            {/* Customer Outfits & Realistic Asian Male 3D Humanoid Specs */}
            <div className="bg-slate-950/85 border border-purple-500/30 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{inspectCustomer.outfitName || 'Mô Hình Nam Á & Rigging IK'}</span>
                    <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                      GLTF/GLB PBR
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    ✓ Anti-Primitives: 100% Smooth Meshes &bull; Mecanim Humanoid Animator (Idle &bull; Sitting)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                  <div className="text-purple-400 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Gương Mặt Nam Á:</span>
                  </div>
                  <div className="text-slate-300">
                    28-32 tuổi, mắt 2 mí, sống mũi thẳng, cằm vuông vừa phải, da tán xạ SSS.
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                  <div className="text-sky-400 font-semibold flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>Tóc Hair Cards:</span>
                  </div>
                  <div className="text-slate-300">
                    Layer xước gai nhọn đen tự nhiên, đa tầng cards không bị khối hộp.
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                  <div className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    <span>Animator &amp; Khớp:</span>
                  </div>
                  <div className="text-slate-300">
                    Trạng thái Idle (thở phập phồng) &amp; Sitting (ngồi ghế PC), 5 ngón rig 3 đốt.
                  </div>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                  <div className="text-amber-400 font-semibold flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    <span>Inverse Kinematics:</span>
                  </div>
                  <div className="text-slate-300">
                    Tay trái đặt WASD gõ phím, tay phải ôm chuột gaming rê và click.
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 italic pt-1">
                * Trang phục: {inspectCustomer.outfitDetails}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Trạng thái: </span>
                <span className="font-bold text-white">{inspectCustomer.tierLabel}</span>
              </div>
              <div className="text-amber-400 font-bold">
                {'★'.repeat(inspectCustomer.stars)} ({inspectCustomer.stars} sao)
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => focusCameraOnCustomer(inspectCustomer)}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Soi Cận Cảnh 3D</span>
              </button>

              <button
                onClick={toggleCapsuleColliders}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>{showCapsuleColliders ? 'Ẩn Hitbox' : 'Hiện Hitbox'}</span>
              </button>
            </div>

            <button
              onClick={() => setInspectCustomer(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Đóng Chi Tiết
            </button>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL POPUP */}
      {selectedUpgradeStation && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs uppercase font-semibold text-emerald-400">
                  Hệ Thống Nâng Cấp Bàn Máy Tính (Cấp 1 &rarr; 5)
                </div>
                <h3 className="text-lg font-black text-white">
                  Cấu Hình &amp; Điểm Hài Lòng: {selectedUpgradeStation.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUpgradeStation(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Điểm Chất Lượng Máy: </span>
                <span className="text-sky-400 font-mono font-bold text-sm">
                  +{selectedUpgradeStation.ramLevel * 2 + selectedUpgradeStation.gpuLevel * 3 + selectedUpgradeStation.monitorLevel * 2} Điểm
                </span>
              </div>
              <div className="text-emerald-400 font-mono text-[11px]">
                RAM &times; 2 + VGA &times; 3 + Màn &times; 2
              </div>
            </div>

            <div className="space-y-3">
              {/* 1. MONITOR */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400">Màn Hình (Monitor Level {selectedUpgradeStation.monitorLevel}/5)</div>
                    <div className="text-sm font-bold text-white">
                      {monitorNames[selectedUpgradeStation.monitorLevel - 1]}
                    </div>
                    <div className="text-[11px] text-sky-400">
                      Điểm cộng hài lòng: +{selectedUpgradeStation.monitorLevel * 2} điểm
                    </div>
                  </div>
                </div>

                {selectedUpgradeStation.monitorLevel < 5 ? (
                  <button
                    onClick={() => handleUpgrade('monitor')}
                    disabled={totalMoney < upgradePrices.monitor[selectedUpgradeStation.monitorLevel]}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      totalMoney >= upgradePrices.monitor[selectedUpgradeStation.monitorLevel]
                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Lên Cấp {selectedUpgradeStation.monitorLevel + 1}
                    <div className="text-[10px] font-mono">
                      {upgradePrices.monitor[selectedUpgradeStation.monitorLevel].toLocaleString('vi-VN')} đ
                    </div>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                    MAX LEVEL
                  </span>
                )}
              </div>

              {/* 2. GPU */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400">Card Đồ Họa (GPU Level {selectedUpgradeStation.gpuLevel}/5)</div>
                    <div className="text-sm font-bold text-white">
                      {gpuNames[selectedUpgradeStation.gpuLevel - 1]}
                    </div>
                    <div className="text-[11px] text-purple-400">
                      Điểm cộng hài lòng: +{selectedUpgradeStation.gpuLevel * 3} điểm
                    </div>
                  </div>
                </div>

                {selectedUpgradeStation.gpuLevel < 5 ? (
                  <button
                    onClick={() => handleUpgrade('gpu')}
                    disabled={totalMoney < upgradePrices.gpu[selectedUpgradeStation.gpuLevel]}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      totalMoney >= upgradePrices.gpu[selectedUpgradeStation.gpuLevel]
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Lên Cấp {selectedUpgradeStation.gpuLevel + 1}
                    <div className="text-[10px] font-mono">
                      {upgradePrices.gpu[selectedUpgradeStation.gpuLevel].toLocaleString('vi-VN')} đ
                    </div>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                    MAX LEVEL
                  </span>
                )}
              </div>

              {/* 3. RAM */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400">Bộ Nhớ RAM (RAM Level {selectedUpgradeStation.ramLevel}/5)</div>
                    <div className="text-sm font-bold text-white">
                      {ramNames[selectedUpgradeStation.ramLevel - 1]}
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      Điểm cộng hài lòng: +{selectedUpgradeStation.ramLevel * 2} điểm
                    </div>
                  </div>
                </div>

                {selectedUpgradeStation.ramLevel < 5 ? (
                  <button
                    onClick={() => handleUpgrade('ram')}
                    disabled={totalMoney < upgradePrices.ram[selectedUpgradeStation.ramLevel]}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      totalMoney >= upgradePrices.ram[selectedUpgradeStation.ramLevel]
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Lên Cấp {selectedUpgradeStation.ramLevel + 1}
                    <div className="text-[10px] font-mono">
                      {upgradePrices.ram[selectedUpgradeStation.ramLevel].toLocaleString('vi-VN')} đ
                    </div>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                    MAX LEVEL
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUpgradeStation(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Đóng Menu [ESC]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile touch controls */}
      {isMobileMode && (
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between pointer-events-auto z-30">
          <div className="bg-slate-900/85 backdrop-blur-md p-2 rounded-2xl border border-slate-800 grid grid-cols-3 gap-1 w-32 h-32 touch-none">
            <div />
            <button
              onPointerDown={() => { moveInputRef.current.forward = 1; }}
              onPointerUp={() => { moveInputRef.current.forward = 0; }}
              className="bg-slate-800 active:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center text-xs"
            >
              ▲
            </button>
            <div />
            <button
              onPointerDown={() => { moveInputRef.current.strafe = -1; }}
              onPointerUp={() => { moveInputRef.current.strafe = 0; }}
              className="bg-slate-800 active:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center text-xs"
            >
              ◀
            </button>
            <div className="bg-slate-950/60 rounded-lg flex items-center justify-center text-[9px] text-slate-500">
              MOVE
            </div>
            <button
              onPointerDown={() => { moveInputRef.current.strafe = 1; }}
              onPointerUp={() => { moveInputRef.current.strafe = 0; }}
              className="bg-slate-800 active:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center text-xs"
            >
              ▶
            </button>
            <div />
            <button
              onPointerDown={() => { moveInputRef.current.forward = -1; }}
              onPointerUp={() => { moveInputRef.current.forward = 0; }}
              className="bg-slate-800 active:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center text-xs"
            >
              ▼
            </button>
            <div />
          </div>

          <button
            onClick={handleInteract}
            disabled={!activeInteraction}
            className={`w-20 h-20 rounded-full font-bold flex flex-col items-center justify-center shadow-2xl transition-all ${
              activeInteraction
                ? activeInteraction.type === 'property_purchase'
                  ? 'bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 text-white ring-4 ring-amber-400/80 scale-105 active:scale-95 animate-pulse'
                  : activeInteraction.type === 'serve'
                  ? 'bg-gradient-to-tr from-emerald-600 via-amber-500 to-emerald-400 text-white ring-4 ring-emerald-400/80 scale-105 active:scale-95 animate-pulse'
                  : activeInteraction.type === 'vip_door'
                  ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500 text-slate-950 ring-4 ring-amber-400/90 scale-105 active:scale-95'
                  : activeInteraction.type === 'fridge'
                  ? 'bg-gradient-to-tr from-sky-600 to-amber-500 text-white ring-4 ring-sky-400/80 scale-105 active:scale-95'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white ring-4 ring-emerald-400/50 scale-105 active:scale-95'
                : 'bg-slate-800/60 text-slate-500 opacity-50 cursor-not-allowed'
            }`}
          >
            {activeInteraction?.type === 'property_purchase' ? (
              <>
                <span className="text-xl mb-0.5">🏢</span>
                <span className="text-[10px] uppercase font-black">MUA ĐẤT</span>
              </>
            ) : activeInteraction?.type === 'serve' ? (
              <>
                <span className="text-xl mb-0.5">🍲</span>
                <span className="text-[10px] uppercase font-black">PHỤC VỤ</span>
              </>
            ) : activeInteraction?.type === 'vip_door' ? (
              <>
                <span className="text-xl mb-0.5">🚪</span>
                <span className="text-[10px] uppercase font-black">{isVipDoorOpen ? 'ĐÓNG CỬA' : 'ĐẨY CỬA'}</span>
              </>
            ) : activeInteraction?.type === 'fridge' ? (
              <>
                <span className="text-xl mb-0.5">🥤</span>
                <span className="text-[10px] uppercase font-black">LẤY ĐỒ</span>
              </>
            ) : (
              <>
                <Cpu className="w-6 h-6 mb-0.5" />
                <span className="text-[10px] uppercase">NÂNG CẤP</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* BUILD MODE ACTIVE OVERLAY BANNER */}
      {buildModeItem && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-in slide-in-from-top-2">
          <div className="bg-slate-950/95 border-2 border-emerald-400 rounded-2xl px-6 py-3.5 shadow-[0_0_35px_rgba(16,185,129,0.5)] backdrop-blur-md flex flex-wrap items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-2xl flex items-center justify-center border border-emerald-400/40 animate-bounce">
              {buildModeItem.item.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-emerald-300">
                  CHẾ ĐỘ ĐẶT TỰ DO (BUILD MODE)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  {buildModeItem.item.category} • Tier {buildModeItem.item.tier}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/40">
                  🔄 Xoay: {Math.round((ghostRotationYRef.current * 180) / Math.PI)}°
                </span>
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-3 mt-0.5">
                <span>{buildModeItem.item.name}</span>
                <span className="text-xs font-semibold text-sky-400">
                  {buildModeItem.item.category === 'Desk'
                    ? '📍 Snap Sàn Nhà (Tự sinh 5 Khe Cắm & Hologram)'
                    : activeSnappedSlotRef.current
                    ? `🎯 Đã khóa vào khe ${activeSnappedSlotRef.current.slotName}`
                    : '⚡ Tự Động Khóa Vào Khe Cắm Trên Bàn (Auto-Snap)'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <button
                onClick={() => {
                  ghostRotationYRef.current = (ghostRotationYRef.current + Math.PI / 4) % (Math.PI * 2);
                  triggerPopup(`🔄 Xoay: ${Math.round((ghostRotationYRef.current * 180) / Math.PI)}°`, playerPosRef.current, '#c084fc');
                }}
                className="px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                title="Cuộn Chuột (Mouse Wheel) hoặc bấm phím [R] để xoay"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xoay 45° [Cuộn/R]</span>
              </button>
              <button
                onClick={handleFinalizeBuildPlacement}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                title="Chuột Trái hoặc [E] để xác nhận đặt"
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Đặt [E / Click]</span>
              </button>
              <button
                onClick={cancelBuildMode}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-400 font-bold text-xs border border-slate-700 transition-all"
                title="Hủy Chế Độ Đặt [Esc]"
              >
                Hủy [Esc]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2D HARDWARE STORE UI OVERLAY */}
      <HardwareShopModal
        isOpen={isHardwareShopOpen}
        onClose={() => setIsHardwareShopOpen(false)}
        totalFunds={totalMoney}
        onBuyItem={handleBuyItemFromStore}
      />

      {/* 2D BACKPACK INVENTORY UI OVERLAY */}
      <BackpackModal
        isOpen={isBackpackOpen}
        onClose={() => setIsBackpackOpen(false)}
        backpack={backpack}
        onSelectItemForBuild={enterBuildMode}
        onDiscardItem={(id) => {
          setBackpack(b => b.filter(item => item.instanceId !== id));
          backpackRef.current = backpackRef.current.filter(item => item.instanceId !== id);
          addLog('Đã bỏ bớt 1 món khỏi Balo.', 'info');
        }}
      />

      {/* Bottom hint bar */}
      {!isMobileMode && (
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-400 pointer-events-none z-20">
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-3">
            <span>
              Di chuyển: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">W A S D</kbd>
            </span>
            <span>·</span>
            <span>
              Balo: <kbd className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold">[B]</kbd>
            </span>
            <span>·</span>
            <span>
              Tương tác / Quầy / Đặt đồ: bấm <kbd className="px-1.5 py-0.5 rounded bg-amber-900 text-amber-200 font-mono">[{config.interactKey}]</kbd>
            </span>
            <span>·</span>
            <span className="text-cyan-400 font-medium">
              ⚡ Shop Hardware 7 Loại x 5 Tiers &bull; Build Mode Internet Cafe Simulator
            </span>
          </div>
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80 text-emerald-400 font-mono">
            Hàng Đợi + F&amp;B + Base 70đ + Free Placement
          </div>
        </div>
      )}
    </div>
  );
};
