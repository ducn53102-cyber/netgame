/**
 * Hardware Shop Item & Placement Types
 * Internet Cafe Simulator Architecture
 * 7 Component Types x 5 Tiers
 */

export type HardwareCategory =
  | 'Monitor'
  | 'PCCase'
  | 'Mouse'
  | 'Keyboard'
  | 'Headset'
  | 'Desk'
  | 'Chair';

export type HardwareTier = 1 | 2 | 3 | 4 | 5;

export interface HardwareItemDefinition {
  id: string;
  name: string;
  category: HardwareCategory;
  tier: HardwareTier;
  tierName: string;
  price: number;
  description: string;
  specs: string;
  // Surface requirement for placement
  targetSurface: 'floor' | 'desk';
  // Visual colors and dimensions
  primaryColor: string;
  accentColor: string;
  glowColor?: string;
  icon: string;
  // Bounding box dimensions (width, height, depth) in Three.js units
  boxDimensions: [number, number, number];
}

export interface InventoryBackpackItem {
  instanceId: string;
  itemDefId: string;
  item: HardwareItemDefinition;
  acquiredAt: number;
}

export interface PlacedFurnitureItem {
  instanceId: string;
  itemDefId: string;
  category: HardwareCategory;
  tier: HardwareTier;
  position: [number, number, number];
  rotationY: number;
  item: HardwareItemDefinition;
  parentDeskId?: string;
  slotType?: 'Monitor' | 'Keyboard' | 'Mouse' | 'PCCase' | 'Headset' | 'Chair';
}

export type DeskSlotName = 'Monitor' | 'Keyboard' | 'Mouse' | 'PCCase' | 'Headset' | 'Chair';

export interface DeskSlotDefinition {
  name: DeskSlotName;
  category: HardwareCategory;
  relativePos: [number, number, number]; // [x, y, z] relative to desk top center
  relativeRotY: number;
  label: string;
}

export const DESK_SNAP_SLOTS: DeskSlotDefinition[] = [
  {
    name: 'Monitor',
    category: 'Monitor',
    relativePos: [0.0, 0.0, -0.15],
    relativeRotY: 0,
    label: 'Màn hình máy tính',
  },
  {
    name: 'Keyboard',
    category: 'Keyboard',
    relativePos: [-0.06, 0.0, 0.14],
    relativeRotY: 0,
    label: 'Bàn phím cơ',
  },
  {
    name: 'Mouse',
    category: 'Mouse',
    relativePos: [0.26, 0.0, 0.14],
    relativeRotY: 0,
    label: 'Chuột gaming & Lót chuột',
  },
  {
    name: 'PCCase',
    category: 'PCCase',
    relativePos: [0.46, 0.0, -0.06],
    relativeRotY: 0,
    label: 'Thùng máy PC Case',
  },
  {
    name: 'Headset',
    category: 'Headset',
    relativePos: [-0.42, 0.0, -0.06],
    relativeRotY: 0,
    label: 'Tai nghe gaming',
  },
  {
    name: 'Chair',
    category: 'Chair',
    relativePos: [0.0, -0.75, 0.65],
    relativeRotY: Math.PI,
    label: 'Ghế gaming',
  },
];

export interface PlacedDeskState {
  deskId: string;
  meshGroup: any; // THREE.Group
  deskItem: HardwareItemDefinition;
  center: [number, number, number];
  rotationY: number;
  topY: number;
  isReadyForCustomer: boolean;
  slots: Record<DeskSlotName, PlacedFurnitureItem | null>;
  hologramMeshes: Record<string, any>; // slot holograms
  stationId?: number; // connected cyber station id if active
}

export const TIER_NAMES: Record<HardwareTier, string> = {
  1: 'Standard (Cơ Bản)',
  2: 'Gaming (Game Thủ)',
  3: 'Mechanical / Pro (Cơ Học)',
  4: 'Premium (Cao Cấp)',
  5: 'Esports (Thi Đấu)',
};

export const HARDWARE_CATALOG: HardwareItemDefinition[] = [
  // 1. MONITOR (Màn hình - Đặt trên bàn)
  {
    id: 'mon_t1',
    name: 'Màn Hình Văn Phòng 21.5"',
    category: 'Monitor',
    tier: 1,
    tierName: TIER_NAMES[1],
    price: 1500000,
    description: 'Màn hình 60Hz cơ bản cho tác vụ văn phòng và lướt web.',
    specs: '21.5" • 60Hz • 1080p',
    targetSurface: 'desk',
    primaryColor: '#334155',
    accentColor: '#64748b',
    icon: '🖥️',
    boxDimensions: [0.55, 0.40, 0.15],
  },
  {
    id: 'mon_t2',
    name: 'Màn Hình Gaming 24" 144Hz',
    category: 'Monitor',
    tier: 2,
    tierName: TIER_NAMES[2],
    price: 3200000,
    description: 'Màn hình chiến game phổ biến, tần số quét 144Hz mượt mà.',
    specs: '24" • 144Hz • 1ms IPS',
    targetSurface: 'desk',
    primaryColor: '#0f172a',
    accentColor: '#06b6d4',
    glowColor: '#06b6d4',
    icon: '🖥️',
    boxDimensions: [0.60, 0.45, 0.18],
  },
  {
    id: 'mon_t3',
    name: 'Màn Hình Curved 27" 180Hz',
    category: 'Monitor',
    tier: 3,
    tierName: TIER_NAMES[3],
    price: 5500000,
    description: 'Màn cong viền mỏng độ sâu hình ảnh cao cho game thủ bắn súng.',
    specs: '27" Curved 1500R • 180Hz 2K',
    targetSurface: 'desk',
    primaryColor: '#1e1b4b',
    accentColor: '#8b5cf6',
    glowColor: '#8b5cf6',
    icon: '🖥️',
    boxDimensions: [0.68, 0.48, 0.20],
  },
  {
    id: 'mon_t4',
    name: 'Màn Hình OLED Fast-IPS 27" 240Hz',
    category: 'Monitor',
    tier: 4,
    tierName: TIER_NAMES[4],
    price: 9800000,
    description: 'Tấm nền OLED cao cấp, chuẩn màu đồ họa và phản hồi tức thì.',
    specs: '27" OLED • 240Hz • 0.03ms GtG',
    targetSurface: 'desk',
    primaryColor: '#18181b',
    accentColor: '#f59e0b',
    glowColor: '#f59e0b',
    icon: '🖥️',
    boxDimensions: [0.70, 0.50, 0.22],
  },
  {
    id: 'mon_t5',
    name: 'Màn Hình Esports ROG Swift 360Hz 32"',
    category: 'Monitor',
    tier: 5,
    tierName: TIER_NAMES[5],
    price: 18500000,
    description: 'Màn hình thi đấu chuyên nghiệp cấp độ giải đấu quốc tế hàng đầu.',
    specs: '32" UltraFast • 360Hz HDR600',
    targetSurface: 'desk',
    primaryColor: '#09090b',
    accentColor: '#ef4444',
    glowColor: '#ef4444',
    icon: '🖥️',
    boxDimensions: [0.76, 0.55, 0.25],
  },

  // 2. PC CASE (Thùng máy tính - Đặt trên bàn hoặc mặt bàn)
  {
    id: 'pc_t1',
    name: 'Case Văn Phòng Core i3',
    category: 'PCCase',
    tier: 1,
    tierName: TIER_NAMES[1],
    price: 3500000,
    description: 'Vỏ đen tiêu chuẩn, GPU onboard đáp ứng LOL & Fifa thấp.',
    specs: 'Core i3 • 8GB RAM • UHD Graphics',
    targetSurface: 'desk',
    primaryColor: '#1e293b',
    accentColor: '#475569',
    icon: '🖲️',
    boxDimensions: [0.22, 0.42, 0.45],
  },
  {
    id: 'pc_t2',
    name: 'Case Gaming GTX 1660 Super',
    category: 'PCCase',
    tier: 2,
    tierName: TIER_NAMES[2],
    price: 7500000,
    description: 'Cấu hình quốc dân phòng net, cân tốt Valorant, CS2 mượt mà.',
    specs: 'Core i5 • 16GB RAM • GTX 1660S',
    targetSurface: 'desk',
    primaryColor: '#0f172a',
    accentColor: '#10b981',
    glowColor: '#10b981',
    icon: '🖲️',
    boxDimensions: [0.24, 0.45, 0.48],
  },
  {
    id: 'pc_t3',
    name: 'Case Cyber RTX 3060 RGB',
    category: 'PCCase',
    tier: 3,
    tierName: TIER_NAMES[3],
    price: 13500000,
    description: 'Mặt kính cường lực, quạt ARGB rực rỡ và Ray Tracing đỉnh.',
    specs: 'Ryzen 5 • 32GB RGB • RTX 3060 12GB',
    targetSurface: 'desk',
    primaryColor: '#18181b',
    accentColor: '#06b6d4',
    glowColor: '#06b6d4',
    icon: '🖲️',
    boxDimensions: [0.25, 0.48, 0.50],
  },
  {
    id: 'pc_t4',
    name: 'Case Premium Tản Nhiệt Nước RTX 4070',
    category: 'PCCase',
    tier: 4,
    tierName: TIER_NAMES[4],
    price: 26000000,
    description: 'Tản nhiệt nước Custom Tube, quạt hiệu năng cao, max setting AAA.',
    specs: 'Core i7-14700 • 32GB DDR5 • RTX 4070 Ti',
    targetSurface: 'desk',
    primaryColor: '#09090b',
    accentColor: '#ec4899',
    glowColor: '#ec4899',
    icon: '🖲️',
    boxDimensions: [0.28, 0.52, 0.54],
  },
  {
    id: 'pc_t5',
    name: 'Super Rig Beast ROG RTX 4090 Esports',
    category: 'PCCase',
    tier: 5,
    tierName: TIER_NAMES[5],
    price: 65000000,
    description: 'Quái vật phần cứng tối thượng của cyber, thách thức mọi tựa game đồ họa 4K.',
    specs: 'Core i9-14900KS • 64GB DDR5 • RTX 4090 24GB Liquid',
    targetSurface: 'desk',
    primaryColor: '#000000',
    accentColor: '#ef4444',
    glowColor: '#ef4444',
    icon: '🖲️',
    boxDimensions: [0.32, 0.58, 0.60],
  },

  // 3. MOUSE (Chuột - Đặt trên bàn)
  {
    id: 'mouse_t1',
    name: 'Chuột Quang Văn Phòng Mitsumi',
    category: 'Mouse',
    tier: 1,
    tierName: TIER_NAMES[1],
    price: 80000,
    description: 'Chuột bi/quang cổ điển chống cháy giá rẻ.',
    specs: '1000 DPI • Cổng USB tiêu chuẩn',
    targetSurface: 'desk',
    primaryColor: '#334155',
    accentColor: '#64748b',
    icon: '🖱️',
    boxDimensions: [0.08, 0.04, 0.12],
  },
  {
    id: 'mouse_t2',
    name: 'Chuột Gaming Fuhlen G90',
    category: 'Mouse',
    tier: 2,
    tierName: TIER_NAMES[2],
    price: 350000,
    description: 'Công tắc quang học bất tử, form ôm tay cho game thủ.',
    specs: '2000 DPI • Quang học Magnet Switch',
    targetSurface: 'desk',
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    glowColor: '#3b82f6',
    icon: '🖱️',
    boxDimensions: [0.09, 0.045, 0.13],
  },
  {
    id: 'mouse_t3',
    name: 'Chuột Logitech G102 Lightsync',
    category: 'Mouse',
    tier: 3,
    tierName: TIER_NAMES[3],
    price: 490000,
    description: 'Huyền thoại cyber net, LED RGB sóng màu rực rỡ.',
    specs: '8000 DPI • RGB 16.8 triệu màu',
    targetSurface: 'desk',
    primaryColor: '#1e1b4b',
    accentColor: '#a855f7',
    glowColor: '#a855f7',
    icon: '🖱️',
    boxDimensions: [0.09, 0.045, 0.13],
  },
  {
    id: 'mouse_t4',
    name: 'Chuột Razer DeathAdder V3 Pro Wireless',
    category: 'Mouse',
    tier: 4,
    tierName: TIER_NAMES[4],
    price: 2500000,
    description: 'Không dây siêu nhẹ 63g, mắt đọc Focus Pro 30K quang học.',
    specs: 'HyperSpeed Wireless • 30000 DPI • 63g',
    targetSurface: 'desk',
    primaryColor: '#14532d',
    accentColor: '#22c55e',
    glowColor: '#22c55e',
    icon: '🖱️',
    boxDimensions: [0.095, 0.05, 0.14],
  },
  {
    id: 'mouse_t5',
    name: 'Chuột Esports Logitech G Pro X Superlight 2',
    category: 'Mouse',
    tier: 5,
    tierName: TIER_NAMES[5],
    price: 3800000,
    description: 'Chuột của các nhà vô địch CS2 và Valorant thế giới, 4000Hz polling rate.',
    specs: 'Hero 2 Sensor • 60g • 4K Polling Rate',
    targetSurface: 'desk',
    primaryColor: '#ef4444',
    accentColor: '#ffffff',
    glowColor: '#ef4444',
    icon: '🖱️',
    boxDimensions: [0.095, 0.05, 0.14],
  },

  // 4. KEYBOARD (Bàn phím - Đặt trên bàn)
  {
    id: 'kb_t1',
    name: 'Bàn Phím Giả Cơ Cao Su Dell',
    category: 'Keyboard',
    tier: 1,
    tierName: TIER_NAMES[1],
    price: 120000,
    description: 'Phím màng cao su gõ êm nhưng thiếu phản hồi nảy khi chơi game.',
    specs: 'Membrane • Fullsize 104 phím',
    targetSurface: 'desk',
    primaryColor: '#334155',
    accentColor: '#475569',
    icon: '⌨️',
    boxDimensions: [0.44, 0.04, 0.15],
  },
  {
    id: 'kb_t2',
    name: 'Bàn Phím Giả Cơ LED Rainbow DareU',
    category: 'Keyboard',
    tier: 2,
    tierName: TIER_NAMES[2],
    price: 320000,
    description: 'LED 7 màu cầu vồng, phím bấm nảy, độ bền phòng net.',
    specs: 'Semi-Mechanical • LED Rainbow',
    targetSurface: 'desk',
    primaryColor: '#1e293b',
    accentColor: '#06b6d4',
    glowColor: '#06b6d4',
    icon: '⌨️',
    boxDimensions: [0.45, 0.045, 0.16],
  },
  {
    id: 'kb_t3',
    name: 'Bàn Phím Cơ Blue Switch E-Dra EK387',
    category: 'Keyboard',
    tier: 3,
    tierName: TIER_NAMES[3],
    price: 650000,
    description: 'Switch cơ học Outemu Blue tiếng gõ lách cách đanh thép đã tai.',
    specs: 'Mechanical TKL • Blue Switch • RGB',
    targetSurface: 'desk',
    primaryColor: '#1e1b4b',
    accentColor: '#8b5cf6',
    glowColor: '#8b5cf6',
    icon: '⌨️',
    boxDimensions: [0.38, 0.05, 0.15],
  },
  {
    id: 'kb_t4',
    name: 'Bàn Phím Cơ Custom AKKO Mod007 Gasket',
    category: 'Keyboard',
    tier: 4,
    tierName: TIER_NAMES[4],
    price: 2900000,
    description: 'Khung nhôm CNC, cấu trúc Gasket Mount, âm thanh gõ trầm ấm mượt mà.',
    specs: 'CNC Aluminum • CS Piano Switch • PBT DoubleShot',
    targetSurface: 'desk',
    primaryColor: '#1c1917',
    accentColor: '#f59e0b',
    glowColor: '#f59e0b',
    icon: '⌨️',
    boxDimensions: [0.36, 0.055, 0.15],
  },
  {
    id: 'kb_t5',
    name: 'Bàn Phím Từ Tính Wooting 60HE Rapid Trigger',
    category: 'Keyboard',
    tier: 5,
    tierName: TIER_NAMES[5],
    price: 5200000,
    description: 'Switch từ Hall Effect, nhận phím tức thì 0.1mm, vũ khí hack tay pro player.',
    specs: 'Lekker Hall Effect • Rapid Trigger 0.1mm',
    targetSurface: 'desk',
    primaryColor: '#09090b',
    accentColor: '#ef4444',
    glowColor: '#ef4444',
    icon: '⌨️',
    boxDimensions: [0.32, 0.055, 0.14],
  },

  // 5. HEADSET (Tai nghe - Đặt trên bàn)
  {
    id: 'hs_t1',
    name: 'Tai Nghe Trâu Vàng Salar V38',
    category: 'Headset',
    tier: 1,
    tierName: TIER_NAMES[1],
    price: 90000,
    description: 'Huyền thoại net cỏ nồi đồng cối đá, dây bọc nhựa dẻo không đứt.',
    specs: 'Stereo 2.0 • Ốp tai cao su',
    targetSurface: 'desk',
    primaryColor: '#eab308',
    accentColor: '#78350f',
    icon: '🎧',
    boxDimensions: [0.18, 0.20, 0.14],
  },
  {
    id: 'hs_t2',
    name: 'Tai Nghe Gaming Rung 7.1 DareU EH722',
    category: 'Headset',
    tier: 2,
    tierName: TIER_NAMES[2],
    price: 390000,
    description: 'Ốp tai hình mắt kim cương LED đỏ, âm thanh giả lập 7.1 chân thực.',
    specs: 'Virtual 7.1 • Driver 50mm • LED Red',
    targetSurface: 'desk',
    primaryColor: '#7f1d1d',
    accentColor: '#ef4444',
    glowColor: '#ef4444',
    icon: '🎧',
    boxDimensions: [0.20, 0.22, 0.16],
  },
  {
    id: 'hs_t3',
    name: 'Tai Nghe Kingston HyperX Cloud II',
    category: 'Headset',
    tier: 3,
    tierName: TIER_NAMES[3],
    price: 1650000,
    description: 'Chuẩn mực tai nghe FPS, nghe rõ từng bước chân và tiếng thay đạn.',
    specs: 'Hardware 7.1 Box • Đệm mút hoạt tính Memory Foam',
    targetSurface: 'desk',
    primaryColor: '#0f172a',
    accentColor: '#dc2626',
    glowColor: '#dc2626',
    icon: '🎧',
    boxDimensions: [0.22, 0.23, 0.17],
  },
  {
    id: 'hs_t4',
    name: 'Tai Nghe SteelSeries Arctis Nova 7 Wireless',
    category: 'Headset',
    tier: 4,
    tierName: TIER_NAMES[4],
    price: 4200000,
    description: 'Không dây kép 2.4G & Bluetooth, micro AI lọc tiếng ồn phòng máy.',
    specs: 'Dual Wireless • ClearCast AI Mic • 360° Spatial Audio',
    targetSurface: 'desk',
    primaryColor: '#1e1b4b',
    accentColor: '#6366f1',
    glowColor: '#6366f1',
    icon: '🎧',
    boxDimensions: [0.22, 0.24, 0.18],
  },
  {
    id: 'hs_t5',
    name: 'Tai Nghe Sennheiser EPOS H3PRO Hybrid Esports',
    category: 'Headset',
    tier: 5,
    tierName: TIER_NAMES[5],
    price: 7900000,
    description: 'Chất âm Audiophile phòng thu, chống ồn chủ động ANC tuyệt đối.',
    specs: 'Active Noise Canceling ANC • Audio Studio Grade',
    targetSurface: 'desk',
    primaryColor: '#09090b',
    accentColor: '#e11d48',
    glowColor: '#e11d48',
    icon: '🎧',
    boxDimensions: [0.23, 0.25, 0.19],
  },

  // 6. DESK (Bàn máy tính - Đặt trên Sàn nhà)
  {
    id: 'desk_t1',
    name: 'Bàn Gỗ Ép Khung Sắt Chữ Z 1m',
    category: 'Desk',
    tier: 1,
    tierName: TIER_NAMES[1],
    price: 650000,
    description: 'Bàn đơn giản gọn nhẹ đủ đặt màn hình và phím chuột.',
    specs: 'Kích thước: 100 x 60 x 75 cm • Gỗ MFC',
    targetSurface: 'floor',
    primaryColor: '#78350f',
    accentColor: '#451a03',
    icon: '🪑',
    boxDimensions: [1.10, 0.75, 0.65],
  },
  {
    id: 'desk_t2',
    name: 'Bàn Cyber Net Mặt Kính Cường Lực 1m2',
    category: 'Desk',
    tier: 2,
    tierName: TIER_NAMES[2],
    price: 1400000,
    description: 'Mặt kính cường lực in hình gaming, chân sắt sơn tĩnh điện vững chãi.',
    specs: 'Kích thước: 120 x 65 x 75 cm • Kính cường lực 8mm',
    targetSurface: 'floor',
    primaryColor: '#1e293b',
    accentColor: '#0284c7',
    glowColor: '#0284c7',
    icon: '🪑',
    boxDimensions: [1.25, 0.75, 0.70],
  },
  {
    id: 'desk_t3',
    name: 'Bàn Gaming Khung K Carbon Chống Rung 1m4',
    category: 'Desk',
    tier: 3,
    tierName: TIER_NAMES[3],
    price: 2800000,
    description: 'Mặt bàn vân carbon chống trầy, có khay để cốc nước và móc treo tai nghe.',
    specs: 'Kích thước: 140 x 70 x 75 cm • Mặt vân Carbon 3D',
    targetSurface: 'floor',
    primaryColor: '#18181b',
    accentColor: '#8b5cf6',
    glowColor: '#8b5cf6',
    icon: '🪑',
    boxDimensions: [1.45, 0.75, 0.75],
  },
  {
    id: 'desk_t4',
    name: 'Bàn Cyber Thi Đấu Đèn LED RGB Âm Bàn 1m6',
    category: 'Desk',
    tier: 4,
    tierName: TIER_NAMES[4],
    price: 5200000,
    description: 'Đèn LED ARGB viền xung quanh bàn đồng bộ màu, khe luồn dây thông minh.',
    specs: 'Kích thước: 160 x 75 x 75 cm • Viền LED ARGB Neon',
    targetSurface: 'floor',
    primaryColor: '#0f172a',
    accentColor: '#06b6d4',
    glowColor: '#06b6d4',
    icon: '🪑',
    boxDimensions: [1.65, 0.75, 0.80],
  },
  {
    id: 'desk_t5',
    name: 'Bàn Nâng Hạ Điện Tử Dual-Motor ROG Arena 1m8',
    category: 'Desk',
    tier: 5,
    tierName: TIER_NAMES[5],
    price: 11500000,
    description: '2 động cơ êm ái nâng hạ theo chiều cao người chơi, thép cán nguội chịu tải 150kg.',
    specs: 'Kích thước: 180 x 80 x 75 cm • 2 Động cơ điện nhớ 4 vị trí',
    targetSurface: 'floor',
    primaryColor: '#09090b',
    accentColor: '#ef4444',
    glowColor: '#ef4444',
    icon: '🪑',
    boxDimensions: [1.85, 0.75, 0.85],
  },

  // 7. CHAIR (Ghế chơi game - Đặt trên Sàn nhà)
  {
    id: 'chair_t1',
    name: 'Ghế Nhựa Đỏ Quán Nét Cổ Điển',
    category: 'Chair',
    tier: 1,
    tierName: TIER_NAMES[1],
    price: 150000,
    description: 'Ghế nhựa Song Long bất diệt của tuổi thơ cày cuốc.',
    specs: 'Nhựa đúc PP • Chiều cao 45cm',
    targetSurface: 'floor',
    primaryColor: '#dc2626',
    accentColor: '#991b1b',
    icon: '💺',
    boxDimensions: [0.50, 0.80, 0.50],
  },
  {
    id: 'chair_t2',
    name: 'Ghế Chân Quỳ Cyber Da Simili G32',
    category: 'Chair',
    tier: 2,
    tierName: TIER_NAMES[2],
    price: 680000,
    description: 'Ghế quỳ quốc dân phòng net, lưng lưới thoáng khí bọc da simili.',
    specs: 'Chân quỳ thép mạ crom • Da simili + Lưới chịu lực',
    targetSurface: 'floor',
    primaryColor: '#1e293b',
    accentColor: '#0284c7',
    glowColor: '#0284c7',
    icon: '💺',
    boxDimensions: [0.60, 0.95, 0.60],
  },
  {
    id: 'chair_t3',
    name: 'Ghế Gaming Xoay Ngả Lưng E-Dra Jupiter',
    category: 'Chair',
    tier: 3,
    tierName: TIER_NAMES[3],
    price: 1950000,
    description: 'Ngả lưng 150 độ nghỉ ngơi, bánh xe xoay 360 độ êm ái.',
    specs: 'Da PU cao cấp • Piston thủy lực Class 4 • Ngả 150°',
    targetSurface: 'floor',
    primaryColor: '#18181b',
    accentColor: '#8b5cf6',
    glowColor: '#8b5cf6',
    icon: '💺',
    boxDimensions: [0.65, 1.25, 0.65],
  },
  {
    id: 'chair_t4',
    name: 'Ghế Công Thái Học Ergonomic Sihoo Doro',
    category: 'Chair',
    tier: 4,
    tierName: TIER_NAMES[4],
    price: 4900000,
    description: 'Đỡ thắt lưng tự động, ngồi chơi game 12 tiếng không đau mỏi cột sống.',
    specs: 'Lưới Cloud Mesh • Đỡ lưng 6D Dynamic • Tay 4D',
    targetSurface: 'floor',
    primaryColor: '#0f172a',
    accentColor: '#10b981',
    glowColor: '#10b981',
    icon: '💺',
    boxDimensions: [0.68, 1.30, 0.68],
  },
  {
    id: 'chair_t5',
    name: 'Ghế Noblechairs / Secretlab Titan Evo Esports',
    category: 'Chair',
    tier: 5,
    tierName: TIER_NAMES[5],
    price: 12500000,
    description: 'Ngai vàng dành cho game thủ chuyên nghiệp hàng đầu thế giới, da lai nappa chống trầy.',
    specs: 'Da NEO Hybrid • Đệm mút lạnh Cold-Cure • Gối từ tính Memory',
    targetSurface: 'floor',
    primaryColor: '#09090b',
    accentColor: '#ef4444',
    glowColor: '#ef4444',
    icon: '💺',
    boxDimensions: [0.72, 1.35, 0.72],
  },
];
