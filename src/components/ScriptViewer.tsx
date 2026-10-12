import React, { useState } from 'react';
import {
  ScriptConfig,
  generateCustomerSatisfactionScript,
  generateCustomerAIFullCycleScript,
  generateWaitingQueueManagerScript,
  generateComputerStationScript,
  generateMoneyManagerScript,
  generatePlayerFBDeliveryScript,
  generateRealisticCustomerIKScript,
  generateHumanoidModelGLTFLoaderScript,
  generateCustomerAnimationControllerScript,
  generatePropertyPurchasingScript,
  generateVipDoorControllerScript,
  generateHardwarePlacementSystemScript,
} from '../data/csharpScripts';
import { Copy, Check, Users, Cpu, Smile, DollarSign, UtensilsCrossed, UserCheck, Sparkles, CheckCircle2, Download, Network, Box, PlayCircle, Building2, DoorOpen, Hammer, ShoppingBag } from 'lucide-react';

interface ScriptViewerProps {
  config: ScriptConfig;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<'hardware_placement' | 'vip_door' | 'property_purchasing' | 'gltf_loader' | 'anim_controller' | 'ik_npc' | 'flow' | 'station' | 'queue' | 'money' | 'delivery' | 'satisfaction'>('hardware_placement');
  const [copied, setCopied] = useState<boolean>(false);

  const scripts = {
    hardware_placement: {
      fileName: 'HardwareShopAndPlacementSystem.cs',
      path: 'Assets/Scripts/Hardware/HardwareShopAndPlacementSystem.cs',
      title: 'HardwareShopAndPlacementSystem.cs (7 Loại Linh Kiện x 5 Tiers, Balo Inventory [B], Raycast Hologram & Snap Surface)',
      description: 'Kiến trúc mô phỏng lắp ráp tự do (Internet Cafe Simulator Style): Quản lý 7 loại linh kiện (Monitor, PCCase, Mouse, Keyboard, Headset, Desk, Chair) chia thành 5 Tiers. Tích hợp Balo [B], Raycast Hologram Ghost Mesh có Snapping Surface (Desk & Chair bám Floor; Màn hình, Case, Phím, Chuột, Tai nghe bám Mặt Bàn) và kiểm tra va chạm OverlapBox (Green: Hợp lệ / Red: Trùng lặp).',
      code: generateHardwarePlacementSystemScript(config),
      highlights: [
        '7 Component Types: Monitor, PCCase, Mouse, Keyboard, Headset, Desk, Chair chuẩn enum.',
        '5 Tiers cấp độ linh kiện: Tier 1 Standard -> Tier 2 Gaming -> Tier 3 Mechanical -> Tier 4 Premium -> Tier 5 Esports.',
        'Hệ thống Balo Inventory [B]: Mua từ shop vào Balo, click bất kỳ để bắt đầu Build Mode.',
        'Snapping Surface Logic: Desk và Chair bắt buộc snap Floor; Phụ kiện PC bắt buộc snap Desk Top.',
        'Collision Validation Hologram: Physics.OverlapBox kiểm tra va chạm (Vật liệu xanh trong suốt 0x00FF00 / Đỏ 0xFF0000).',
        'Finalize Placement: Nhấn Chuột Trái hoặc [E] sinh prefab thật và trừ món đồ khỏi Balo.',
      ],
    },
    vip_door: {
      fileName: 'VipDoorController.cs',
      path: 'Assets/Scripts/VIP/VipDoorController.cs',
      title: 'VipDoorController.cs (Bản Lề Hinge Pivot, Đồng Bộ BoxCollider isTrigger & NavMesh Update)',
      description: 'Quản lý bản lề mở cửa phòng VIP (Hinge Pivot đặt tại mép jamb). Đồng bộ BoxCollider: khi cửa mở chuyển sang isTrigger = true (giải phóng physical volume) để người chơi và NPC tự do bước qua lối vào rộng 1.6m mà không bị va chạm với collider tĩnh. Tự động cập nhật NavMeshObstacle (tắt carving khi mở) để AI NavMeshAgent xem khe cửa là đường đi bộ thông suốt.',
      code: generateVipDoorControllerScript(config),
      highlights: [
        'Hinge Pivot Logic: Xoay trục rỗng tại mép cửa (-3.4, 0, -4.8), cánh cửa lệch nửa bề rộng (+0.8m).',
        'BoxCollider Synchronization: Khi mở cửa, chuyển isTrigger = true (hoặc disable) để không còn vật thể va chạm tĩnh.',
        'Lối vào rộng chuẩn 1.6m: Đảm bảo capsule người chơi (bán kính 0.3 - 0.5m) bước qua dễ dàng, không bị kẹt mép.',
        'NavMesh Obstacle Update: Tắt carving khi mở cửa để AI NPC xem lối đi là walkable ground.',
        'Hiển thị UI prompt tương tác trong phạm vi 2.5m: "[E] Đẩy cửa phòng VIP" / "[E] Đóng cửa phòng VIP".',
        'Hỗ trợ âm thanh mở/đóng cửa và xoay mượt mà với Quaternion.Lerp (góc mở 90 độ).',
      ],
    },
    property_purchasing: {
      fileName: 'PropertyPurchasingManager.cs',
      path: 'Assets/Scripts/RealEstate/PropertyPurchasingManager.cs',
      title: 'PropertyPurchasingManager.cs (Hệ Thống Mua Mặt Bằng Mở Rộng 5.000.000 VNĐ)',
      description: 'Mở rộng bản đồ ra mặt đường phố bên ngoài Cyber Cafe, quản lý 2 tòa nhà/mặt bằng mở rộng bên cạnh với bảng hiệu "BÁN MẶT BẰNG / FOR SALE". Tích hợp Raycast góc nhìn thứ nhất, hiển thị UI prompt "[E] Mua mặt bằng mở rộng - Giá: 5.000.000 VNĐ", kiểm tra MoneyManager, dỡ bỏ BoxCollider chặn cửa, bật đèn nội thất và log kết quả console.',
      code: generatePropertyPurchasingScript(config),
      highlights: [
        'Tích hợp Raycast góc nhìn thứ nhất dò tìm bảng BÁN MẶT BẰNG trong tầm tương tác 3.5m.',
        'Hiển thị floating UI prompt: "[E] Mua mặt bằng mở rộng - Giá: 5.000.000 VNĐ".',
        'Kiểm tra MoneyManager.Instance: nếu < 5.000.000 VNĐ -> báo lỗi đỏ: "Không đủ tiền! Cần 5.000.000 VNĐ để mua mặt bằng."',
        'Nếu đủ tiền: trừ đúng 5.000.000 VNĐ qua MoneyManager.Instance.TrySpendMoney().',
        'Vô hiệu hóa bảng "FOR SALE" và tắt BoxCollider chặn cửa để người chơi tự do bước vào trong.',
        'Tự động bật sáng dàn đèn nội thất bên trong mặt bằng vừa mở khóa.',
        'Ghi nhật ký thành công màu xanh trong console: "Chúc mừng! Đã mở khóa mặt bằng mới."',
      ],
    },
    gltf_loader: {
      fileName: 'HumanoidModelGLTFLoader.cs',
      path: 'Assets/Scripts/Customer/HumanoidModelGLTFLoader.cs',
      title: 'HumanoidModelGLTFLoader.cs (Nạp 3D GLTF/GLB Từ CDN - THAY THẾ HOÀN TOÀN PRIMITIVES)',
      description: 'CHẤM DỨT HOÀN TOÀN việc dùng GameObject.CreatePrimitive hay ghép hình khối thô sơ. Tải bất đồng bộ mô hình 3D nam Châu Á / Việt Nam siêu chân thực (GLTF/GLB) từ URL/CDN công khai (Ready Player Me / Mixamo), map Humanoid Rig và gắn Animator có sẵn state "Idle" (thở tự nhiên) và "Sitting" (ngồi chơi máy net).',
      code: generateHumanoidModelGLTFLoaderScript(config),
      highlights: [
        'NGHIÊM CẤM GameObject.CreatePrimitive(): Loại bỏ triệt để các hình hộp Cube, hình trụ Cylinder, hình cầu Sphere.',
        'Tải bất đồng bộ GLTF/GLB qua UnityWebRequest từ CDN công khai (Ready Player Me: 6460d3594ae79bdd72a67a84.glb).',
        'Lưới đa giác cao cấp (High-poly smooth meshes) với vật liệu PBR đầy đủ Albedo, Normal, Roughness, Subsurface Scattering.',
        'Tự động map Mecanim Humanoid Avatar Rig chuẩn cho toàn bộ xương (Hips, Spine, Head, Arms, 5-finger bones).',
        'Animator Component với 2 trạng thái cốt lõi: "Idle" (thở phập phồng, lắc nhẹ) và "Sitting" (ngồi tự nhiên tại ghế gaming).',
        'Tự động gắn CustomerAnimationController điều khiển clip và IK bàn máy, cùng RealisticCustomerModelController.',
      ],
    },
    anim_controller: {
      fileName: 'CustomerAnimationController.cs',
      path: 'Assets/Scripts/Customer/CustomerAnimationController.cs',
      title: 'CustomerAnimationController.cs (Animator Clips & Desk Surface Hand IK)',
      description: 'Nhắm mục tiêu chuẩn Mecanim Humanoid Rig từ mô hình GLTF/GLB đã nạp. Áp dụng animation clips chuẩn "Sitting" và "Idle" từ AnimatorController, đồng thời kích hoạt hệ thống Inverse Kinematics (IK) hai bàn tay tương tác lên mặt bàn, phím WASD và chuột gaming.',
      code: generateCustomerAnimationControllerScript(config),
      highlights: [
        'Targeting Mecanim Humanoid Avatar Rig từ mô hình 3D GLTF/GLB đã nạp.',
        'Áp dụng Animation Clips chuẩn Unity Humanoid "Sitting" (ngồi chơi máy) và "Idle" (đứng thở tự nhiên).',
        'Inverse Kinematics (OnAnimatorIK): Tay trái đặt lên cụm phím WASD, tay phải ôm chuột gaming.',
        'Tự động raycast phát hiện mặt bàn (Desk Surface Snapping) tránh lún/lơ lửng bàn tay.',
        'Micro-motions: nhấp phím WASD, rê chuột quang vi mô, nhịp thở ngực và F&B drinking routine.',
      ],
    },
    ik_npc: {
      fileName: 'RealisticCustomerModelController.cs',
      path: 'Assets/Scripts/Customer/RealisticCustomerModelController.cs',
      title: 'RealisticCustomerModelController.cs (Mô Hình 3D Nam Á & Inverse Kinematics IK)',
      description: 'Điều khiển mô hình khách hàng 3D nam Châu Á / Việt Nam chân thực: cấu trúc khuôn mặt chuẩn, tóc layer xước gai nhọn (hair cards), bàn tay 5 ngón đầy đủ 3 khớp, Inverse Kinematics (IK) lên phím WASD & chuột gaming, chớp mắt tự nhiên và LOD Group.',
      code: generateRealisticCustomerIKScript(config),
      highlights: [
        'Khuôn mặt nam Châu Á: xương hàm vuông vừa, sống mũi thẳng gọn, mắt 2 mí, môi tự nhiên.',
        'Hệ xương bàn tay 5 ngón đầy đủ 3 đốt (MCP, PIP, DIP), móng tay bóng nhẹ và cơ bắp cẳng tay.',
        'Inverse Kinematics (OnAnimatorIK): Tay trái đặt lên cụm WASD gõ phím, tay phải ôm chuột gaming rê và click.',
        'Biểu cảm khuôn mặt & chớp mắt tự nhiên (Blendshape), fidgets xoa mặt, bẻ ngón tay và uống nước.',
        'Tích hợp LODGroup (LOD 0/1/2) và CapsuleCollider (0.35m x 1.7m) tương thích F&B Delivery.',
      ],
    },
    delivery: {
      fileName: 'PlayerFBDeliveryController.cs',
      path: 'Assets/Scripts/Player/PlayerFBDeliveryController.cs',
      title: 'PlayerFBDeliveryController.cs (Hệ Thống Giao Đồ Ăn & Tủ Mát Nước Ngọt F&B)',
      description: 'Quản lý trạng thái bưng bê (isCarryingFood). Lại gần tủ lạnh bấm [E] để lấy khay mì/nước, lại gần khách gọi món bấm [E] Phục Vụ -> Thu +15.000 VNĐ vào MoneyManager và tăng +5đ Hài Lòng.',
      code: generatePlayerFBDeliveryScript(config),
      highlights: [
        'Biến trạng thái bool isCarryingFood = false được quản lý chặt chẽ theo State Machine.',
        'Tương tác Tủ Lạnh: Cự ly gần hiện UI prompt "[E] Chuẩn bị đồ ăn/uống" -> Bấm [E] set isCarryingFood = true.',
        'Hiện biểu tượng khay đồ ăn trên màn hình HUD người chơi khi đang bưng bê.',
        'Tương tác Phục vụ: Đến bàn khách NeedsFoodOrDrink -> Hiện "[E] Phục vụ" -> Thu +15.000đ và tăng +5đ hài lòng.',
      ],
    },
    satisfaction: {
      fileName: 'CustomerSatisfaction.cs',
      path: 'Assets/Scripts/Customer/CustomerSatisfaction.cs',
      title: 'CustomerSatisfaction.cs (Hệ Thống Điểm Hài Lòng Base 70 & Đánh Giá Sao)',
      description: 'Khởi điểm 70đ. Cộng điểm chất lượng máy (RAM*2, VGA*3, Monitor*2), giá thuê, phục vụ đồ ăn (+5đ), trừ điểm chờ đợi. Phân loại 5 cấp bậc từ Very Unhappy (0-19 😡) đến Very Happy (80-100 😍).',
      code: generateCustomerSatisfactionScript(),
      highlights: [
        'Khởi điểm 70đ. Giới hạn trong khoảng 0 -> 100 điểm.',
        'Công thức chuẩn: RAM(Lvl*2) + VGA(Lvl*3) + Màn(Lvl*2). Ví dụ: RAM 3, VGA 4, Màn 2 => +22đ!',
        '5 Mức độ: Very Happy 😍 (80-100), Happy 🙂 (60-79), Normal 😐 (40-59), Unhappy 😕 (20-39), Very Unhappy 😡 (0-19).',
        'Tự động xuất báo cáo trải nghiệm và xác suất khách quay lại quán (Return Chance %).',
      ],
    },
    flow: {
      fileName: 'CustomerAI.cs',
      path: 'Assets/Scripts/Customer/CustomerAI.cs',
      title: 'CustomerAI.cs (Tích Hợp CustomerSatisfaction, WaitingQueue & Gọi Đồ Ăn F&B)',
      description: 'Trọn vòng đời khách: Vào quán -> Tìm máy -> Nếu hết máy: Vào hàng đợi -> Ngồi máy -> Đếm ngược 60-120s chuyển sang NeedsFoodOrDrink & hiện Billboard Bubble "Nước/Mì (+15k)" -> Nhận phục vụ -> Tính điểm hài lòng -> Rời đi.',
      code: generateCustomerAIFullCycleScript(),
      highlights: [
        'Trạng thái CustomerState.NeedsFoodOrDrink xuất hiện sau timer ngẫu nhiên (60 - 120s).',
        'Hiển thị 2D Billboard Bubble Canvas trên màn hình PC khách hàng.',
        'Hàm ReceiveFood() xóa bubble order, reset timer và kích hoạt +5đ hài lòng.',
        'Xuất log Console: "[Máy {ID}] Khách gọi đồ ăn/thức uống!".',
      ],
    },
    station: {
      fileName: 'ComputerStation.cs',
      path: 'Assets/Scripts/Computer/ComputerStation.cs',
      title: 'ComputerStation.cs (Bàn Máy Tính & Nâng Cấp Linh Kiện Cấp 1 -> 5)',
      description: 'Cung cấp điểm số chất lượng máy tính dựa trên cấp độ nâng cấp của RAM, GPU và Màn hình. Quản lý thời gian thuê và tích hợp MoneyManager.',
      code: generateComputerStationScript(config),
      highlights: [
        'RAM Level 1..5: +2, +4, +6, +8, +10',
        'VGA Level 1..5: +3, +6, +9, +12, +15',
        'Monitor Level 1..5: +2, +4, +6, +8, +10',
        'Hàm GetComputerQualityScore() trả về tổng điểm linh kiện.',
      ],
    },
    queue: {
      fileName: 'WaitingQueueManager.cs',
      path: 'Assets/Scripts/Customer/WaitingQueueManager.cs',
      title: 'WaitingQueueManager.cs (Hàng Đợi Dự Phòng Khi Hết Máy)',
      description: 'Khách đứng chờ trong hàng đợi sẽ bị trừ điểm kiên nhẫn vào CustomerSatisfaction. Khi máy trống, khách đầu hàng đợi tự động vào máy.',
      code: generateWaitingQueueManagerScript(),
      highlights: [
        'Cơ chế FIFO: Khách đến trước vào máy trước.',
        'Tự động điều phối vị trí khách tại các ghế chờ.',
        'Trừ điểm hài lòng nếu phải chờ lâu.',
      ],
    },
    money: {
      fileName: 'MoneyManager.cs',
      path: 'Assets/Scripts/Managers/MoneyManager.cs',
      title: 'MoneyManager.cs (Quản Lý Dòng Tiền Tiệm Net & Thu Tiền F&B)',
      description: 'Singleton quản lý tiền doanh thu từ thuê máy tính, doanh thu phục vụ đồ ăn/nước uống (+15.000 VNĐ) và chi tiêu nâng cấp linh kiện an toàn.',
      code: generateMoneyManagerScript(),
      highlights: [
        'Singleton Pattern dễ truy cập toàn cục: MoneyManager.Instance.',
        'Hàm TrySpendMoney(amount) kiểm tra số dư an toàn trước khi trừ tiền.',
        'Sự kiện OnMoneyChanged cập nhật UI tức thì.',
      ],
    },
  };

  const currentScript = scripts[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentScript.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = currentScript.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentScript.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentScript.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Mã Nguồn C# Trọn Vẹn &bull; Sẵn Sàng Build Trong Unity</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">
            Bộ C# Scripts Cho Net Tycoon (Đầy Đủ 6 Scripts Chuẩn Unity)
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Đã tích hợp đầy đủ hệ thống điểm hài lòng <strong>Base 70</strong>, nâng cấp linh kiện, hàng đợi chờ máy và <strong>Giao Đồ Ăn/Uống (F&amp;B System)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              copied
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã Sao Chép!' : 'Sao Chép Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Tải file .cs về máy tính"
          >
            <Download className="w-4 h-4" />
            <span>Tải File .cs</span>
          </button>
        </div>
      </div>

      {/* Script Selector Tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('hardware_placement')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'hardware_placement'
                ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                : 'text-cyan-300 hover:text-cyan-200'
            }`}
          >
            <Hammer className="w-4 h-4 text-cyan-300" />
            <span>★ Shop &amp; Đặt Đồ 5-Tier: HardwareShopAndPlacementSystem.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('vip_door')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'vip_door'
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                : 'text-amber-300 hover:text-amber-200'
            }`}
          >
            <DoorOpen className="w-4 h-4 text-amber-300" />
            <span>★ Cửa Phòng VIP (Hinge & NavMesh): VipDoorController.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('property_purchasing')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'property_purchasing'
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                : 'text-amber-300 hover:text-amber-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-300" />
            <span>★ Mua Mặt Bằng (Phố): PropertyPurchasingManager.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('gltf_loader')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'gltf_loader'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : 'text-blue-300 hover:text-blue-200'
            }`}
          >
            <Box className="w-4 h-4 text-blue-300" />
            <span>★ 3D GLTF Loader: HumanoidModelGLTFLoader.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('anim_controller')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'anim_controller'
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                : 'text-emerald-300 hover:text-emerald-200'
            }`}
          >
            <PlayCircle className="w-4 h-4 text-emerald-300" />
            <span>★ Animator & Hand IK: CustomerAnimationController.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('ik_npc')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'ik_npc'
                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                : 'text-purple-300 hover:text-purple-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>★ IK & Bàn Tay: RealisticCustomerIK.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'delivery'
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>★ F&B: PlayerFBDelivery.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('satisfaction')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'satisfaction'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>1. CustomerSatisfaction.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'flow'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. CustomerAI.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('station')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'station'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>3. ComputerStation.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'queue'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>4. WaitingQueueManager.cs</span>
          </button>

          <button
            onClick={() => setActiveTab('money')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'money'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>5. MoneyManager.cs</span>
          </button>
        </div>

        {/* Script Highlights Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono">{currentScript.path}</span>
            <span className="text-[11px] text-slate-500 font-mono">C# Source File</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{currentScript.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-900">
            {currentScript.highlights.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] text-emerald-400">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#1e1e1e] font-mono text-xs">
        <div className="bg-[#2d2d2d] px-4 py-2 border-b border-[#3e3e3e] flex items-center justify-between text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-bold text-slate-200">{currentScript.fileName}</span>
          </div>
          <span>UTF-8 &bull; C# 9.0+ &bull; Unity 2021/2022/6</span>
        </div>

        <pre className="p-4 md:p-6 text-slate-200 overflow-x-auto max-h-[520px] leading-relaxed selection:bg-emerald-500/30">
          <code>{currentScript.code}</code>
        </pre>
      </div>
    </div>
  );
};
