/**
 * Step-by-step Unity Inspector and Setup guide for Net Tycoon:
 * Upgrades (Monitor, GPU, RAM) & Customer AI (NavMesh)
 */

export interface UnityStep {
  id: string;
  stepNumber: number;
  title: string;
  badge: string;
  summary: string;
  clicks: {
    action: string;
    target: string;
    detail: string;
    tip?: string;
  }[];
  inspectorFields?: {
    field: string;
    type: string;
    value: string;
    note: string;
  }[];
  hierarchyPreview?: string[];
  warningNote?: string;
}

export const unitySteps: UnityStep[] = [
  {
    id: 'step-navmesh',
    stepNumber: 1,
    title: 'Nướng NavMesh & Tạo Ghế Ngồi (sitPoint)',
    badge: 'AI Navigation & Scene',
    summary: 'Tạo đường đi thông minh để khách hàng có thể tự động bước tới bàn máy tính.',
    hierarchyPreview: [
      '▶ BanMayTinh_01',
      '  ├── Box Collider (Collider bàn máy)',
      '  ├── ComputerStation (Script đã cập nhật hệ thống nâng cấp)',
      '  └── sitPoint (Empty GameObject đặt ngay trước ghế ngồi)',
    ],
    clicks: [
      {
        action: 'Mở cửa sổ Navigation trong Unity',
        target: 'Window > AI > Navigation (hoặc Package NavMesh)',
        detail: 'Chọn sàn nhà của quán net, tích "Navigation Static", sau đó bấm tab "Bake" -> click nút "Bake" để tạo bản đồ di chuyển màu xanh dương.',
      },
      {
        action: 'Tạo điểm ghế ngồi cho bàn máy',
        target: 'Hierarchy > BanMayTinh_01 > Click phải > Create Empty',
        detail: 'Đặt tên là "sitPoint". Di chuyển vị trí sitPoint đặt ngay trước mặt ghế ngồi (khoảng Y = 0 trên sàn nhà).',
        tip: 'Kéo sitPoint này vào ô "Sit Point" trong Inspector của ComputerStation để khách biết đích đến.',
      },
    ],
  },
  {
    id: 'step-customer-prefab',
    stepNumber: 2,
    title: 'Tạo Nhân Vật Khách Hàng — Nạp Mô Hình 3D GLTF/GLB & Animator Hand IK',
    badge: 'Mecanim Humanoid Rig & Desk IK',
    summary: 'Loại bỏ hoàn toàn hình khối nguyên thủy (Primitives). Nạp mô hình 3D nam Châu Á GLTF/GLB từ CDN, gắn Animator clips "Sitting" & "Idle" cùng IK bàn phím và chuột.',
    hierarchyPreview: [
      '▶ Customer_Humanoid_Prefab',
      '  ├── NavMeshAgent (Tốc độ Speed: 3.0, Stopping Distance: 0.3)',
      '  ├── CustomerAI (Điều khiển State Machine & Vòng đời F&B)',
      '  ├── CustomerSatisfaction (Hệ thống tính điểm Base 70đ)',
      '  ├── HumanoidModelGLTFLoader (Nạp GLB bất đồng bộ từ CDN Ready Player Me / Mixamo)',
      '  ├── CustomerAnimationController (Điều khiển Animator Clips & Hand Desk IK)',
      '  └── Humanoid_AsianMale_Model (Mesh 3D chân thực, Avatar Mecanim Rig)',
      '      ├── SkinnedMeshRenderer (Vật liệu PBR SSS Skin, Áo phông trắng, Quần jeans)',
      '      ├── Animator (Clips "Idle" thở tự nhiên & "Sitting" ngồi chơi game)',
      '      ├── RealisticCustomerModelController (5 ngón tay đầy đủ 3 khớp, biểu cảm mặt)',
      '      └── LODGroup & CapsuleCollider (0.35m x 1.70m)',
    ],
    clicks: [
      {
        action: 'Nạp mô hình 3D GLTF/GLB từ CDN thay thế toàn bộ Primitives',
        target: 'Inspector > Add Component > HumanoidModelGLTFLoader',
        detail: 'Tuyệt đối KHÔNG ghép Cubes/Spheres. Điền URL CDN công khai (Ready Player Me: 6460d3594ae79bdd72a67a84.glb). Script sẽ tự động nạp mesh mượt mà, gán Humanoid Rig và Animator.',
        tip: 'Mô hình có sẵn khuôn mặt nam Á Đông 28 tuổi, mắt 2 mí, tóc hair cards và áo thun trắng cotton.',
      },
      {
        action: 'Gán CustomerAnimationController điều khiển Clips & Desk Surface Hand IK',
        target: 'Inspector > Add Component > CustomerAnimationController',
        detail: 'Gán Runtime Animator Controller có sẵn 2 state "Idle" và "Sitting". Điền các target IK: Bàn phím (WASD) cho tay trái, Chuột gaming cho tay phải, và Màn hình cho Head Look-At.',
      },
      {
        action: 'Bật Snap To Desk Surface (Raycast)',
        target: 'CustomerAnimationController > Snap To Desk Surface: True',
        detail: 'Script tự động bắn raycast xuống mặt bàn để hai bàn tay ôm khít mặt phím và chuột vi tính, không bị lún hoặc lơ lửng.',
      },
      {
        action: 'Lưu thành Prefab tái sử dụng',
        target: 'Kéo thả Customer_Humanoid_Prefab vào thư mục Assets/Prefabs',
        detail: 'Prefab đã có đầy đủ visual 3D cao cấp, cử động thở tự nhiên, IK gõ phím rê chuột và AI tìm máy.',
      },
    ],
  },
  {
    id: 'step-customer-manager',
    stepNumber: 3,
    title: 'Setup Người Quản Lý Cửa (CustomerManager)',
    badge: 'Doorway & Spawner',
    summary: 'Đặt Spawner ở cửa quán, tự động sinh khách sau mỗi 10 giây.',
    hierarchyPreview: [
      '▶ Doorway_Entrance',
      '  └── CustomerManager (Gán script CustomerManager.cs)',
      '      ├── Customer Prefab (Kéo Customer_Prefab vào)',
      '      ├── Spawn Point (Chính Transform này)',
      '      └── Spawn Interval: 10 (giây)',
    ],
    clicks: [
      {
        action: 'Tạo Spawner ở cửa',
        target: 'Hierarchy > Create Empty > Đổi tên CustomerManager',
        detail: 'Kéo vị trí GameObject này đặt ngay tại cửa ra vào của quán net.',
      },
      {
        action: 'Gán script CustomerManager',
        target: 'Inspector > Add Component > CustomerManager',
        detail: 'Kéo Customer_Prefab vừa tạo ở Bước 2 vào ô "Customer Prefab". Kéo chính GameObject CustomerManager vào ô "Spawn Point".',
      },
      {
        action: 'Chỉnh thời gian sinh khách',
        target: 'Spawn Interval = 10',
        detail: 'Cứ mỗi 10 giây sẽ có 1 khách mới bước vào quán.',
      },
    ],
  },
  {
    id: 'step-upgrade-ui',
    stepNumber: 4,
    title: 'Setup Popup Giao Diện Nâng Cấp (StationUpgradeUI)',
    badge: 'Canvas UI & Menu',
    summary: 'Tạo bảng Menu Nâng Cấp Màn hình, GPU, RAM xuất hiện khi người chơi đến gần < 2m bấm E.',
    hierarchyPreview: [
      '▶ Canvas_HUD',
      '  └── Panel_StationUpgrade (Mặc định SetActive: False)',
      '      ├── Text_Title ("CẤU HÌNH & NÂNG CẤP BÀN MÁY")',
      '      ├── Row_Monitor (Text tên màn hình + Button "Nâng Cấp")',
      '      ├── Row_GPU (Text tên Card đồ họa + Button "Nâng Cấp")',
      '      ├── Row_RAM (Text tên RAM + Button "Nâng Cấp")',
      '      └── Btn_Close (Nút đóng X hoặc ESC)',
    ],
    clicks: [
      {
        action: 'Tạo Panel UI Nâng Cấp',
        target: 'Hierarchy > Canvas > UI > Panel',
        detail: 'Đặt tên là "Panel_StationUpgrade". Thêm 3 hàng (Row) đại diện cho Màn hình, Card đồ họa và RAM. Mỗi hàng gồm 1 Text tên linh kiện và 1 Button.',
      },
      {
        action: 'Gán script StationUpgradeUI',
        target: 'Panel_StationUpgrade > Add Component > StationUpgradeUI',
        detail: 'Kéo các TextMeshProUGUI và Button tương ứng vào các ô Monitor, GPU, RAM của script.',
      },
      {
        action: 'Cơ chế hoạt động khi bấm phím E',
        target: 'PlayerInteraction.cs',
        detail: 'Khi người chơi đến gần bàn máy < 2m và bấm phím E, script sẽ tự động gọi StationUpgradeUI.Instance.OpenPanel(thisStation) và mở khóa chuột.',
      },
    ],
  },
  {
    id: 'step-custom-options',
    stepNumber: 5,
    title: 'Cách Tự Thêm Tùy Chọn Nâng Cấp Mới (CPU, Bàn Phím, Chuột)',
    badge: 'Mở Rộng Gameplay',
    summary: 'Hướng dẫn bổ sung thêm các linh kiện nâng cấp khác trong tương lai chỉ với vài dòng code.',
    clicks: [
      {
        action: 'Bước A: Mở file ComputerStation.cs',
        target: 'Khai báo biến level và giá tiền mới',
        detail: 'Ví dụ thêm Ghế Gaming: thêm "public int chairLevel = 1;" và mảng giá "public long[] chairCosts = { 0, 40000, 120000 };".',
      },
      {
        action: 'Bước B: Tạo hàm TryUpgradeChair()',
        target: 'ComputerStation.cs',
        detail: 'Kiểm tra MoneyManager.Instance.TrySpendMoney(cost), nếu thành công thì chairLevel++ và cập nhật visual ghế.',
      },
      {
        action: 'Bước C: Thêm nút trên StationUpgradeUI',
        target: 'StationUpgradeUI.cs',
        detail: 'Tạo thêm 1 hàng UI Ghế Gaming và gán sự kiện onClick gọi TryUpgradeChair(). Khách VIP sẽ ưu tiên quán có ghế êm hơn!',
      },
    ],
  },
  {
    id: 'step-satisfaction-system',
    stepNumber: 6,
    title: 'Gán CustomerSatisfaction & Thiết Lập Hàng Đợi (WaitingQueue)',
    badge: 'Hệ Thống Hài Lòng & Hàng Đợi',
    summary: 'Tích hợp thang điểm hài lòng Base 70đ, tính điểm cấu hình máy và hàng ghế chờ dự phòng khi hết máy.',
    hierarchyPreview: [
      '▶ Customer_Prefab',
      '  ├── CustomerAI.cs (Quản lý di chuyển & thuê máy)',
      '  └── CustomerSatisfaction.cs (Khởi điểm 70đ, tự cộng RAM*2, VGA*3, Màn*2, trừ chờ đợi)',
      '▶ WaitingQueueArea',
      '  ├── WaitingQueueManager.cs (Quản lý hàng đợi FIFO)',
      '  ├── Slot_01 (Ghế chờ số 1)',
      '  └── Slot_02 (Ghế chờ số 2)',
    ],
    clicks: [
      {
        action: 'Gán CustomerSatisfaction vào Customer_Prefab',
        target: 'Customer_Prefab > Add Component > CustomerSatisfaction',
        detail: 'Đặt Base Score = 70. Script sẽ tự động lắng nghe ComputerStation để cộng điểm cấu hình máy khi khách ngồi vào ghế.',
      },
      {
        action: 'Tạo khu vực hàng đợi chờ máy',
        target: 'Hierarchy > Create Empty > Đổi tên WaitingQueueArea',
        detail: 'Thêm component WaitingQueueManager. Tạo 2 GameObject con làm vị trí ghế chờ (Slot_01, Slot_02) và kéo vào mảng Queue Slots của script.',
      },
      {
        action: 'Kiểm tra điểm số khi chạy game (Play Mode)',
        target: 'Console & Inspector',
        detail: 'Khi hết máy, khách sẽ tự vào ghế chờ và bị trừ -10đ nếu đợi lâu. Khi máy trống, khách vào máy và xuất hóa đơn trải nghiệm cùng đánh giá 1-5 sao!',
      },
    ],
  },
  {
    id: 'step-street-property-purchasing',
    stepNumber: 7,
    title: 'Mở Rộng Đường Phố Ngoài Trời & Hệ Thống Mua Mặt Bằng (5.000.000 VNĐ)',
    badge: 'Mở Rộng Bản Đồ & Bất Động Sản',
    summary: 'Mở cửa chính quán net bước ra đường phố ngoài trời (vỉa hè, đường nhựa, đèn đường, bầu trời skybox) và tích hợp hệ thống mua 2 mặt bằng liền kề với giá 5.000.000 VNĐ.',
    hierarchyPreview: [
      '▶ Street_Environment (Môi trường đường phố)',
      '  ├── Sidewalk_Paved (Vỉa hè lát gạch)',
      '  ├── Asphalt_Road (Lòng đường nhựa đen & vạch kẻ sang đường)',
      '  ├── Streetlights (Cột đèn đường chiếu sáng ban đêm)',
      '  └── DirectionalLight_Sun (Đèn chiếu sáng chính)',
      '▶ Adjacent_Storefront_01 (Mặt bằng bên trái)',
      '  ├── PropertySlot.cs (Giá 5.000.000 VNĐ)',
      '  ├── Sign_ForSale_01 (Bảng 3D BÁN MẶT BẰNG)',
      '  ├── Door_Locked_Collider (BoxCollider chặn cửa)',
      '  └── Interior_Lights_Group (Dàn đèn phòng tắt ban đầu)',
      '▶ Main Camera',
      '  └── PropertyPurchasingManager.cs (Raycast [E] & MoneyManager 5M VNĐ)',
    ],
    clicks: [
      {
        action: 'Mở cửa chính của Cyber Cafe',
        target: 'FrontEntranceWall > Bỏ BoxCollider chắn toàn bộ cửa',
        detail: 'Tách tường cửa trước thành 2 phần bên hông và mở khoảng trống 2.2m ở giữa. Điều này cho phép người chơi tự do bước từ trong quán net ra ngoài đường phố.',
        tip: 'Khách hàng AI vẫn di chuyển bình thường theo navmesh nội bộ, không bị ảnh hưởng.',
      },
      {
        action: 'Gắn PropertySlot cho 2 tòa nhà cạnh quán',
        target: 'Storefront_01 & Storefront_02 > Add Component > PropertySlot',
        detail: 'Đặt giá mua 5.000.000 VNĐ. Kéo bảng "Sign_ForSale", BoxCollider chặn cửa và dàn đèn nội thất vào các trường tham chiếu tương ứng.',
      },
      {
        action: 'Thử nghiệm tương tác và mua mặt bằng',
        target: 'Góc nhìn thứ nhất > Nhìn vào bảng BÁN MẶT BẰNG > Nhấn [E]',
        detail: 'Nếu quỹ < 5 triệu VNĐ: Console báo lỗi đỏ "Không đủ tiền! Cần 5.000.000 VNĐ để mua mặt bằng.". Khi đủ 5 triệu VNĐ: Trừ đúng 5M, dỡ bỏ bảng hiệu, vô hiệu hóa collider cửa, bật đèn phòng và log xanh "Chúc mừng! Đã mở khóa mặt bằng mới.".',
      },
    ],
  },
];

export const troubleshootingList = [
  {
    issue: 'Khách hàng sinh ra nhưng đứng yên ở cửa, không đi tới bàn máy',
    cause: 'Sàn nhà chưa được Nướng (Bake) NavMesh, hoặc bàn máy chưa được gán sitPoint.',
    solution: 'Mở cửa sổ Window > AI > Navigation, chọn sàn và bấm Bake. Kiểm tra trong Inspector của ComputerStation ô "Sit Point" đã kéo GameObject vào chưa.',
  },
  {
    issue: 'Nâng cấp xong nhưng tiền không trừ hoặc trừ sai',
    cause: 'MoneyManager chưa có hàm TrySpendMoney() hoặc chưa có đủ số dư.',
    solution: 'Kiểm tra file MoneyManager.cs đã cập nhật hàm TrySpendMoney(long cost). Kiểm tra log Console xem có báo "Không đủ tiền" hay không.',
  },
  {
    issue: 'Khách VIP không chọn máy xịn mà ngồi máy cùi bắp',
    cause: 'Customer.cs chưa gọi hàm FindBestAvailableComputer() hoặc GetTotalScore().',
    solution: 'Đảm bảo Customer.cs sử dụng logic chấm điểm GetTotalScore() trong phiên bản code mới nhất.',
  },
  {
    issue: 'Người chơi hoặc NPC bị kẹt cứng, không thể bước vào phòng VIP dù cửa đã mở',
    cause: 'BoxCollider cánh cửa không xoay theo Hinge Pivot hoặc không chuyển isTrigger = true khi mở; hoặc collider vách ngăn đè lên khe cửa; hoặc sàn phòng VIP chưa nướng NavMesh.',
    solution: '1. Gắn BoxCollider làm con của Hinge Pivot và đặt doorCollider.isTrigger = true khi mở (giải phóng hoàn toàn physical volume). 2. Đảm bảo khe cửa mở rộng 1.6m và dời bàn ghế/kệ đồ ăn cách xa ngưỡng cửa tối thiểu 1.2m. 3. Đảm bảo sàn phòng VIP được tích Navigation Static và Bake NavMesh đầy đủ; tắt NavMeshObstacle khi mở cửa.',
  },
];
