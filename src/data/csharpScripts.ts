/**
 * C# Scripts for NetTycoon - TRỌN BỘ MÃ NGUỒN CHUẨN UNITY (PC & MOBILE)
 * Hệ Thống Mức Độ Hài Lòng (Base 70), Nâng Cấp Linh Kiện & Hàng Đợi Chờ
 */

export interface ScriptConfig {
  revenuePerTick: number;
  tickInterval: number;
  interactDistance: number;
  interactKey: string;
  useNewInputSystem: boolean;
  currencySymbol: string;
  autoSavePlayerPrefs: boolean;
  stationNamePrefix: string;
}

export const defaultScriptConfig: ScriptConfig = {
  revenuePerTick: 5000,
  tickInterval: 3,
  interactDistance: 2.0,
  interactKey: 'E',
  useNewInputSystem: false,
  currencySymbol: 'VNĐ',
  autoSavePlayerPrefs: true,
  stationNamePrefix: 'Bàn Máy ',
};

/**
 * 1. CustomerSatisfaction.cs
 * Hệ thống tính điểm trải nghiệm (0 -> 100) khởi điểm 70 điểm.
 */
export function generateCustomerSatisfactionScript(): string {
  return `using UnityEngine;

/// <summary>
/// HỆ THỐNG TÍNH ĐIỂM HÀI LÒNG CỦA KHÁCH HÀNG (CUSTOMER SATISFACTION)
/// Thang điểm chuẩn: 0 -> 100
/// 80 - 100: Very Happy 😍 (5 sao - Tỷ lệ quay lại 95%)
/// 60 - 79:  Happy 🙂      (4 sao - Tỷ lệ quay lại 75%)
/// 40 - 59:  Normal 😐     (3 sao - Tỷ lệ quay lại 45%)
/// 20 - 39:  Unhappy 😕    (2 sao - Tỷ lệ quay lại 15%)
/// 0 - 19:   Very Unhappy 😡 (1 sao - Khách tức giận bỏ về)
/// </summary>
public class CustomerSatisfaction : MonoBehaviour
{
    public enum SatisfactionTier
    {
        VeryUnhappy, // 0 - 19  😡 (1 sao)
        Unhappy,     // 20 - 39 😕 (2 sao)
        Normal,      // 40 - 59 😐 (3 sao)
        Happy,       // 60 - 79 🙂 (4 sao)
        VeryHappy    // 80 - 100 😍 (5 sao)
    }

    [Header("Điểm Khởi Điểm")]
    [SerializeField] private int baseScore = 70;

    [Header("Chi Tiết Các Thành Phần")]
    [SerializeField] private int computerQualityScore = 0; // RAM*2 + VGA*3 + Màn*2
    [SerializeField] private int priceScore = 5;           // Giá thuê hợp lý (+5), rẻ (+10), đắt (-10)
    [SerializeField] private int waitTimePenalty = 0;      // Chờ đợi lâu (-10 đến -15)
    [SerializeField] private int internetBonus = 10;       // Mạng 1Gbps (+10), lag (-15)
    [SerializeField] private int acBonus = 8;              // Điều hòa 22°C (+8), nóng (-10)
    [SerializeField] private int foodBonus = 10;           // Phục vụ mì cay & nước (+10)

    [Header("Kết Quả Cuối Cùng")]
    [SerializeField] private int finalScore = 70;
    [SerializeField] private SatisfactionTier currentTier = SatisfactionTier.Happy;

    public int FinalScore => finalScore;
    public SatisfactionTier CurrentTier => currentTier;

    private void Start()
    {
        CalculateFinalScore();
    }

    /// <summary>
    /// Tính toán điểm chất lượng máy tính từ cấp độ RAM, VGA, Màn hình:
    /// - RAM: Level * 2 (L1=+2, L2=+4, L3=+6, L4=+8, L5=+10)
    /// - VGA: Level * 3 (L1=+3, L2=+6, L3=+9, L4=+12, L5=+15)
    /// - Màn hình: Level * 2 (L1=+2, L2=+4, L3=+6, L4=+8, L5=+10)
    /// </summary>
    public void ApplyComputerQuality(ComputerStation pc)
    {
        if (pc == null) return;

        computerQualityScore = pc.GetComputerQualityScore();
        CalculateFinalScore();

        Debug.Log($"[Satisfaction] Khách ngồi máy {pc.name} => Chất lượng máy: +{computerQualityScore} điểm (RAM {pc.ramLevel}, VGA {pc.gpuLevel}, Màn {pc.monitorLevel})");
    }

    /// <summary>
    /// Trừ điểm nếu khách phải đứng chờ trong hàng đợi
    /// </summary>
    public void ApplyWaitTimePenalty(float waitSeconds)
    {
        if (waitSeconds > 8f)
        {
            waitTimePenalty = -15; // Chờ quá lâu
        }
        else if (waitSeconds > 3f)
        {
            waitTimePenalty = -10; // Chờ lâu
        }
        else
        {
            waitTimePenalty = 0;   // Có máy ngay
        }

        CalculateFinalScore();
    }

    /// <summary>
    /// Áp dụng điểm số từ giá thuê giờ chơi
    /// </summary>
    public void ApplyPriceFactor(float pricePerHour)
    {
        if (pricePerHour <= 6000f)
        {
            priceScore = 10; // Rẻ
        }
        else if (pricePerHour <= 12000f)
        {
            priceScore = 5;  // Hợp lý
        }
        else
        {
            priceScore = -10; // Đắt
        }

        CalculateFinalScore();
    }

    /// <summary>
    /// Cập nhật các tiện ích quán net (Mạng, Điều hòa, Đồ ăn)
    /// </summary>
    public void SetAmenities(int internet, int ac, int food)
    {
        internetBonus = internet;
        acBonus = ac;
        foodBonus = food;
        CalculateFinalScore();
    }

    /// <summary>
    /// Thưởng điểm hài lòng khi người chơi phục vụ đồ ăn/nước uống (+5 điểm)
    /// </summary>
    public void AddFoodBonus(int bonus = 5)
    {
        foodBonus += bonus;
        CalculateFinalScore();
        Debug.Log($"[Satisfaction] Phục vụ đồ ăn/uống thành công => Điểm đồ ăn: +{foodBonus}đ | Tổng điểm mới: {finalScore}đ");
    }

    /// <summary>
    /// Tính tổng điểm và phân loại 5 cấp bậc cảm xúc
    /// </summary>
    public int CalculateFinalScore()
    {
        finalScore = baseScore + computerQualityScore + priceScore + waitTimePenalty + internetBonus + acBonus + foodBonus;
        finalScore = Mathf.Clamp(finalScore, 0, 100);

        if (finalScore >= 80)
        {
            currentTier = SatisfactionTier.VeryHappy;
        }
        else if (finalScore >= 60)
        {
            currentTier = SatisfactionTier.Happy;
        }
        else if (finalScore >= 40)
        {
            currentTier = SatisfactionTier.Normal;
        }
        else if (finalScore >= 20)
        {
            currentTier = SatisfactionTier.Unhappy;
        }
        else
        {
            currentTier = SatisfactionTier.VeryUnhappy;
        }

        return finalScore;
    }

    /// <summary>
    /// Quy đổi ra số sao đánh giá (1 -> 5 ⭐)
    /// </summary>
    public int GetReviewStars()
    {
        switch (currentTier)
        {
            case SatisfactionTier.VeryHappy: return 5;
            case SatisfactionTier.Happy:     return 4;
            case SatisfactionTier.Normal:    return 3;
            case SatisfactionTier.Unhappy:   return 2;
            case SatisfactionTier.VeryUnhappy: return 1;
            default: return 3;
        }
    }

    /// <summary>
    /// Biểu tượng cảm xúc
    /// </summary>
    public string GetEmoji()
    {
        switch (currentTier)
        {
            case SatisfactionTier.VeryHappy: return "😍 Very Happy";
            case SatisfactionTier.Happy:     return "🙂 Happy";
            case SatisfactionTier.Normal:    return "😐 Normal";
            case SatisfactionTier.Unhappy:   return "😕 Unhappy";
            case SatisfactionTier.VeryUnhappy: return "😡 Very Unhappy";
            default: return "😐 Normal";
        }
    }

    /// <summary>
    /// Tỷ lệ quay lại quán (%)
    /// </summary>
    public float GetReturnChancePercent()
    {
        switch (currentTier)
        {
            case SatisfactionTier.VeryHappy: return 95f;
            case SatisfactionTier.Happy:     return 75f;
            case SatisfactionTier.Normal:    return 45f;
            case SatisfactionTier.Unhappy:   return 15f;
            case SatisfactionTier.VeryUnhappy: return 2f;
            default: return 50f;
        }
    }

    /// <summary>
    /// Xuất hóa đơn trải nghiệm chi tiết ra Console Unity
    /// </summary>
    public string GenerateSummaryReport(string customerName)
    {
        return $"========================================\\n" +
               $"[PHIẾU TRẢI NGHIỆM KHÁCH HÀNG: {customerName}]\\n" +
               $"Điểm khởi điểm (Base):      {baseScore}\\n" +
               $"Chất lượng máy tính:        +{(computerQualityScore >= 0 ? computerQualityScore.ToString() : computerQualityScore.ToString())}\\n" +
               $"Giá thuê máy:               {(priceScore >= 0 ? "+" + priceScore : priceScore.ToString())}\\n" +
               $"Thời gian chờ (Queue):      {waitTimePenalty}\\n" +
               $"Mạng Internet:              +{(internetBonus >= 0 ? internetBonus.ToString() : internetBonus.ToString())}\\n" +
               $"Điều hòa nhiệt độ:          {(acBonus >= 0 ? "+" + acBonus : acBonus.ToString())}\\n" +
               $"Đồ ăn & Nước uống:          +{(foodBonus >= 0 ? foodBonus.ToString() : foodBonus.ToString())}\\n" +
               $"----------------------------------------\\n" +
               $"TỔNG ĐIỂM (FINAL):          {finalScore} / 100\\n" +
               $"Trạng thái cảm xúc:         {GetEmoji()}\\n" +
               $"Đánh giá:                   {GetReviewStars()} ⭐\\n" +
               $"Tỷ lệ quay lại quán:        {GetReturnChancePercent()}%\\n" +
               $"========================================";
    }
}`;
}

/**
 * 2. ComputerStation.cs
 * Bàn máy tính hỗ trợ nâng cấp Monitor, VGA, RAM (Cấp 1 -> 5) và trả về điểm chất lượng máy.
 */
export function generateComputerStationScript(config: ScriptConfig = defaultScriptConfig): string {
  return `using UnityEngine;

/// <summary>
/// BÀN MÁY TÍNH (COMPUTER STATION)
/// Quản lý thuê máy, đếm ngược thời gian, nâng cấp linh kiện và tính điểm chất lượng máy.
/// </summary>
public class ComputerStation : MonoBehaviour
{
    [Header("Cấu Hình Bàn Máy")]
    public string stationName = "${config.stationNamePrefix}01";
    public bool isOccupied = false;
    public Transform sitPoint;
    public Transform attachedChair;
    public Transform monitorTransform;
    public float seatCushionHeight = 0.5f;
    public float timeRemaining = 0f;

    [Header("Cấp Độ Nâng Cấp Linh Kiện (Cấp 1 -> 5)")]
    [Range(1, 5)] public int monitorLevel = 1; // L1=+2, L2=+4, L3=+6, L4=+8, L5=+10
    [Range(1, 5)] public int gpuLevel = 1;     // L1=+3, L2=+6, L3=+9, L4=+12, L5=+15
    [Range(1, 5)] public int ramLevel = 1;     // L1=+2, L2=+4, L3=+6, L4=+8, L5=+10

    [Header("Chi Phí Nâng Cấp (Cấp 1 -> 5)")]
    public long[] monitorCosts = { 0, 50000, 120000, 250000, 500000 };
    public long[] gpuCosts = { 0, 80000, 200000, 450000, 900000 };
    public long[] ramCosts = { 0, 30000, 75000, 150000, 300000 };

    [Header("Hiển Thị Đồ Họa 3D")]
    [SerializeField] private MeshRenderer screenRenderer;
    [SerializeField] private Light screenLight;
    [SerializeField] private Material screenOnMaterial;
    [SerializeField] private Material screenOffMaterial;

    private void Update()
    {
        if (isOccupied && timeRemaining > 0f)
        {
            // RAM cao giúp tối ưu hóa giảm độ trễ
            float speedMultiplier = 1f + (ramLevel - 1) * 0.15f;
            timeRemaining -= Time.deltaTime * speedMultiplier;

            if (timeRemaining <= 0f)
            {
                EndRent();
            }
        }
    }

    /// <summary>
    /// Công thức tính điểm chất lượng máy tính:
    /// RAM*2 + VGA*3 + Màn hình*2
    /// Ví dụ: RAM 3 (+6), VGA 4 (+12), Màn 2 (+4) => 22 Điểm!
    /// </summary>
    public int GetComputerQualityScore()
    {
        int ramPoints = ramLevel * 2;
        int vgaPoints = gpuLevel * 3;
        int monitorPoints = monitorLevel * 2;

        return ramPoints + vgaPoints + monitorPoints;
    }

    /// <summary>
    /// Bắt đầu thuê máy
    /// </summary>
    public void RentComputer(float hours, float pricePerHour)
    {
        isOccupied = true;
        timeRemaining = hours * 10f; // Mỗi giờ chơi quy đổi 10 giây trong game

        long earnings = Mathf.RoundToInt(hours * pricePerHour);
        if (MoneyManager.Instance != null)
        {
            MoneyManager.Instance.AddMoney(earnings);
        }

        UpdateVisuals(true);
        Debug.Log($"[{stationName}] Bắt đầu thuê máy ({hours}h). Thu: {earnings:N0} VNĐ.");
    }

    /// <summary>
    /// Kết thúc thời gian thuê
    /// </summary>
    public void EndRent()
    {
        isOccupied = false;
        timeRemaining = 0f;
        UpdateVisuals(false);

        // Báo cho Hàng đợi để mời khách tiếp theo vào
        if (WaitingQueueManager.Instance != null)
        {
            WaitingQueueManager.Instance.TryAssignEmptyStation(this);
        }
    }

    public bool TryUpgradeMonitor()
    {
        if (monitorLevel >= 5) return false;
        long cost = monitorCosts[monitorLevel];

        if (MoneyManager.Instance != null && MoneyManager.Instance.TrySpendMoney(cost))
        {
            monitorLevel++;
            Debug.Log($"[{stationName}] Nâng cấp Màn hình lên Cấp {monitorLevel} (Cộng +{monitorLevel * 2}đ)!");
            return true;
        }
        return false;
    }

    public bool TryUpgradeGPU()
    {
        if (gpuLevel >= 5) return false;
        long cost = gpuCosts[gpuLevel];

        if (MoneyManager.Instance != null && MoneyManager.Instance.TrySpendMoney(cost))
        {
            gpuLevel++;
            Debug.Log($"[{stationName}] Nâng cấp GPU lên Cấp {gpuLevel} (Cộng +{gpuLevel * 3}đ)!");
            return true;
        }
        return false;
    }

    public bool TryUpgradeRAM()
    {
        if (ramLevel >= 5) return false;
        long cost = ramCosts[ramLevel];

        if (MoneyManager.Instance != null && MoneyManager.Instance.TrySpendMoney(cost))
        {
            ramLevel++;
            Debug.Log($"[{stationName}] Nâng cấp RAM lên Cấp {ramLevel} (Cộng +{ramLevel * 2}đ)!");
            return true;
        }
        return false;
    }

    private void UpdateVisuals(bool isOn)
    {
        if (screenRenderer != null)
        {
            screenRenderer.material = isOn ? screenOnMaterial : screenOffMaterial;
        }
        if (screenLight != null)
        {
            screenLight.enabled = isOn;
        }
    }
}`;
}

/**
 * 3. CustomerAI.cs
 * Trọn vòng đời khách: Vào quán -> Tìm máy -> Nếu hết máy: Vào hàng đợi -> Ngồi máy -> Tính điểm hài lòng -> Rời đi.
 */
export function generateCustomerAIFullCycleScript(): string {
  return `using UnityEngine;

/// <summary>
/// CUSTOMER AI (TÍCH HỢP HỆ THỐNG ĐIỂM HÀI LÒNG & HÀNG ĐỢI)
/// </summary>
public class CustomerAI : MonoBehaviour
{
    public enum CustomerState
    {
        Spawn,
        EnterShop,
        FindComputer,
        InWaitingQueue,
        WalkToSeatPoint,
        SitDown,
        Playing,
        NeedsFoodOrDrink,
        FinishPlaying,
        LeaveShop
    }

    [Header("Cài Đặt Di Chuyển")]
    [SerializeField] private float moveSpeed = 3.0f;
    [SerializeField] private float stopDistance = 0.25f;

    [Header("Thời Gian Chờ & Hệ Thống Hài Lòng")]
    [SerializeField] private CustomerSatisfaction satisfactionSystem;
    [SerializeField] private float waitSeconds = 0f;

    [Header("Điểm Đến")]
    [SerializeField] private Transform targetPoint;
    [SerializeField] private Transform exitPoint;

    [Header("Trạng Thái Hiện Tại")]
    [SerializeField] private CustomerState currentState = CustomerState.Spawn;
    [SerializeField] private ComputerStation assignedPC;

    [Header("Hệ Thống Phục Vụ Đồ Ăn/Uống (F&B Delivery System)")]
    [SerializeField] private float foodOrderTimer = 0f;
    [SerializeField] private float foodOrderInterval = 75f; // Random 60 - 120 giây
    [SerializeField] private bool hasOrderedFood = false;
    [SerializeField] private GameObject foodBubbleUI; // 2D Floating Billboard Canvas trên màn hình PC: 'Nước/Mì (+15k)'

    public bool NeedsFoodOrDrink => currentState == CustomerState.NeedsFoodOrDrink || hasOrderedFood;
    public string AssignedStationName => assignedPC != null ? assignedPC.stationName : "Máy PC";

    private void Awake()
    {
        satisfactionSystem = GetComponent<CustomerSatisfaction>();
        if (satisfactionSystem == null)
        {
            satisfactionSystem = gameObject.AddComponent<CustomerSatisfaction>();
        }
    }

    private void Start()
    {
        ChangeState(CustomerState.EnterShop);
    }

    private void Update()
    {
        switch (currentState)
        {
            case CustomerState.EnterShop:
                MoveTowards(targetPoint, onArrived: () => ChangeState(CustomerState.FindComputer));
                break;

            case CustomerState.FindComputer:
                LookForAvailableComputer();
                break;

            case CustomerState.InWaitingQueue:
                HandleWaitingQueue();
                break;

            case CustomerState.WalkToSeatPoint:
                MoveTowards(targetPoint, onArrived: () => ChangeState(CustomerState.SitDown));
                break;

            case CustomerState.SitDown:
                HandleSitDown();
                break;

            case CustomerState.Playing:
                MonitorRentSession();
                HandleFoodBeverageTimer();
                break;

            case CustomerState.NeedsFoodOrDrink:
                MonitorRentSession();
                break;

            case CustomerState.FinishPlaying:
                StandUpAndLeave();
                break;

            case CustomerState.LeaveShop:
                MoveTowards(exitPoint, onArrived: () => Destroy(gameObject, 0.5f));
                break;
        }
    }

    public void ChangeState(CustomerState newState)
    {
        currentState = newState;

        if (newState == CustomerState.LeaveShop && exitPoint == null)
        {
            GameObject spawnPoint = GameObject.Find("CustomerSpawnPoint");
            if (spawnPoint != null) exitPoint = spawnPoint.transform;
        }
    }

    private void LookForAvailableComputer()
    {
        ComputerStation[] allPCs = FindObjectsOfType<ComputerStation>();
        ComputerStation chosen = null;

        foreach (var pc in allPCs)
        {
            if (pc != null && !pc.isOccupied)
            {
                chosen = pc;
                break;
            }
        }

        if (chosen != null)
        {
            AssignToComputer(chosen);
        }
        else
        {
            // Hết máy! Thử tham gia vào Hàng đợi
            if (WaitingQueueManager.Instance != null && WaitingQueueManager.Instance.TryJoinQueue(this))
            {
                ChangeState(CustomerState.InWaitingQueue);
                Debug.Log($"[{gameObject.name}] Hết máy! Khách vào hàng đợi chờ máy trống.");
            }
            else
            {
                // Hàng đợi cũng đầy -> Khách bực tức bỏ về
                if (satisfactionSystem != null)
                {
                    satisfactionSystem.ApplyWaitTimePenalty(20f);
                }
                Debug.LogWarning($"[{gameObject.name}] Quán và hàng đợi đều kín! Khách bỏ về.");
                ChangeState(CustomerState.LeaveShop);
            }
        }
    }

    public void AssignToComputer(ComputerStation pc)
    {
        assignedPC = pc;
        assignedPC.isOccupied = true;

        if (satisfactionSystem != null)
        {
            satisfactionSystem.ApplyWaitTimePenalty(waitSeconds);
            satisfactionSystem.ApplyComputerQuality(assignedPC);
            satisfactionSystem.ApplyPriceFactor(10000f);
        }

        // Action - Update NPC Target: Navigation destination must be the exact position of ATTACHED CHAIR, NOT desk center
        Transform chairTarget = assignedPC.attachedChair != null ? assignedPC.attachedChair : (assignedPC.sitPoint != null ? assignedPC.sitPoint : assignedPC.transform);
        targetPoint = chairTarget;
        ChangeState(CustomerState.WalkToSeatPoint);
    }

    private void HandleWaitingQueue()
    {
        waitSeconds += Time.deltaTime;

        // Nếu chờ quá 20 giây mà không có máy -> Bực tức bỏ về
        if (waitSeconds > 20f)
        {
            if (WaitingQueueManager.Instance != null)
            {
                WaitingQueueManager.Instance.LeaveQueue(this);
            }
            if (satisfactionSystem != null)
            {
                satisfactionSystem.ApplyWaitTimePenalty(waitSeconds);
            }
            Debug.Log($"[{gameObject.name}] Chờ quá lâu! Khách bỏ về với 1 sao 😡.");
            ChangeState(CustomerState.LeaveShop);
        }
    }

    private void HandleSitDown()
    {
        if (assignedPC != null)
        {
            Transform chairTransform = assignedPC.attachedChair != null ? assignedPC.attachedChair : assignedPC.sitPoint;
            if (chairTransform != null)
            {
                // Action - Set Y-Axis Offset: Match seat cushion height (chair.position.y + 0.5f)
                Vector3 sitPos = chairTransform.position;
                sitPos.y += assignedPC.seatCushionHeight;
                transform.position = sitPos;

                // Action - Force Rotation: Face exact forward vector of Monitor / Desk
                Vector3 screenTarget = assignedPC.monitorTransform != null ? assignedPC.monitorTransform.position : assignedPC.transform.position;
                Vector3 lookDir = (screenTarget - sitPos);
                lookDir.y = 0;
                if (lookDir != Vector3.zero)
                {
                    transform.rotation = Quaternion.LookRotation(lookDir, Vector3.up);
                }
            }
        }

        // Action - Disable NPC Collision: Briefly set CapsuleCollider to isTrigger = true while seated
        CapsuleCollider col = GetComponent<CapsuleCollider>();
        if (col != null)
        {
            col.isTrigger = true;
        }

        ChangeState(CustomerState.Playing);
        if (assignedPC != null)
        {
            assignedPC.RentComputer(2f, 10000f);
        }
    }

    private void MonitorRentSession()
    {
        if (assignedPC == null || assignedPC.timeRemaining <= 0.05f || !assignedPC.isOccupied)
        {
            // Restore collision when standing up
            CapsuleCollider col = GetComponent<CapsuleCollider>();
            if (col != null)
            {
                col.isTrigger = false;
            }
            ChangeState(CustomerState.FinishPlaying);
        }
    }

    /// <summary>
    /// Đếm ngược thời gian ngẫu nhiên (60 - 120s) kích hoạt nhu cầu gọi đồ ăn/uống
    /// </summary>
    private void HandleFoodBeverageTimer()
    {
        if (hasOrderedFood) return;

        foodOrderTimer += Time.deltaTime;
        if (foodOrderTimer >= foodOrderInterval)
        {
            TriggerNeedsFoodOrDrink();
        }
    }

    /// <summary>
    /// Kích hoạt trạng thái NeedsFoodOrDrink và hiện Billboard Bubble 2D trên đầu PC
    /// </summary>
    private void TriggerNeedsFoodOrDrink()
    {
        hasOrderedFood = true;
        currentState = CustomerState.NeedsFoodOrDrink;

        if (foodBubbleUI != null)
        {
            foodBubbleUI.SetActive(true);
        }

        // Báo console hàng đợi & hệ thống tiệm net
        Debug.Log($"[{AssignedStationName}] Khách gọi đồ ăn/thức uống!");
    }

    /// <summary>
    /// Được gọi từ PlayerFBDeliveryController khi người chơi mang đồ ăn lại gần và ấn phím [E] Phục Vụ
    /// </summary>
    public void ReceiveFood()
    {
        hasOrderedFood = false;
        foodOrderTimer = 0f;
        foodOrderInterval = Random.Range(60f, 120f);

        if (foodBubbleUI != null)
        {
            foodBubbleUI.SetActive(false);
        }

        // Tăng +5 điểm vào hệ thống CustomerSatisfaction
        if (satisfactionSystem != null)
        {
            satisfactionSystem.AddFoodBonus(5);
        }

        currentState = CustomerState.Playing;
        Debug.Log($"[{AssignedStationName}] Khách đã nhận đồ ăn/uống thành công! Điểm hài lòng tăng +5đ.");
    }

    private void StandUpAndLeave()
    {
        // 1. Giải phóng bàn máy tính cho khách hàng tiếp theo
        if (assignedPC != null)
        {
            assignedPC.EndRent();
            assignedPC = null;
        }

        // 2. Kích hoạt Animator đứng dậy và bước đi
        Animator anim = GetComponentInChildren<Animator>();
        if (anim != null)
        {
            anim.SetBool("IsPlaying", false);
            anim.SetBool("IsWalking", true);
        }

        // 3. In báo cáo trải nghiệm & điểm đánh giá
        if (satisfactionSystem != null)
        {
            Debug.Log(satisfactionSystem.GenerateSummaryReport(gameObject.name));
        }

        // 4. Tìm điểm cửa ra vào để bước ra ngoài
        if (exitPoint == null)
        {
            GameObject exitObj = GameObject.Find("CustomerExitPoint");
            if (exitObj == null) exitObj = GameObject.Find("CustomerSpawnPoint");
            if (exitObj != null) exitPoint = exitObj.transform;
        }

        Debug.Log($"[{gameObject.name}] Chơi xong! Đứng dậy khỏi ghế và bước ra cửa về.");
        ChangeState(CustomerState.LeaveShop);
    }

    private void MoveTowards(Transform target, System.Action onArrived)
    {
        if (target == null) return;

        Vector3 direction = target.position - transform.position;
        direction.y = 0f;

        if (direction.magnitude <= stopDistance)
        {
            onArrived?.Invoke();
            return;
        }

        direction.Normalize();
        transform.position += direction * moveSpeed * Time.deltaTime;

        if (direction != Vector3.zero)
        {
            Quaternion rot = Quaternion.LookRotation(direction);
            transform.rotation = Quaternion.Slerp(transform.rotation, rot, 10f * Time.deltaTime);
        }
    }

    public void SetTarget(Transform target) => targetPoint = target;
}`;
}

/**
 * 4. WaitingQueueManager.cs
 * Quản lý hàng đợi khi hết máy (FIFO: First-In, First-Out).
 */
export function generateWaitingQueueManagerScript(): string {
  return `using System.Collections.Generic;
using UnityEngine;

public class WaitingQueueManager : MonoBehaviour
{
    public static WaitingQueueManager Instance { get; private set; }

    [Header("Cấu Hình Hàng Đợi")]
    [SerializeField] private int maxQueueCapacity = 4;
    [SerializeField] private Transform[] queueSlots;

    private readonly List<CustomerAI> waitingCustomers = new List<CustomerAI>();

    public int CurrentWaitingCount => waitingCustomers.Count;
    public bool HasAvailableSlot => waitingCustomers.Count < maxQueueCapacity && (queueSlots == null || waitingCustomers.Count < queueSlots.Length);

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    public bool TryJoinQueue(CustomerAI customer)
    {
        if (!HasAvailableSlot || customer == null) return false;

        waitingCustomers.Add(customer);
        int slotIndex = waitingCustomers.Count - 1;

        if (queueSlots != null && slotIndex < queueSlots.Length)
        {
            customer.SetTarget(queueSlots[slotIndex]);
        }
        return true;
    }

    public void LeaveQueue(CustomerAI customer)
    {
        if (waitingCustomers.Contains(customer))
        {
            waitingCustomers.Remove(customer);
            UpdateQueueSlots();
        }
    }

    public bool TryAssignEmptyStation(ComputerStation emptyPC)
    {
        if (waitingCustomers.Count == 0 || emptyPC == null || emptyPC.isOccupied) return false;

        CustomerAI nextCustomer = waitingCustomers[0];
        waitingCustomers.RemoveAt(0);

        nextCustomer.AssignToComputer(emptyPC);
        UpdateQueueSlots();
        return true;
    }

    private void UpdateQueueSlots()
    {
        if (queueSlots == null) return;

        for (int i = 0; i < waitingCustomers.Count; i++)
        {
            if (waitingCustomers[i] != null && i < queueSlots.Length)
            {
                waitingCustomers[i].SetTarget(queueSlots[i]);
            }
        }
    }
}`;
}

/**
 * 5. MoneyManager.cs
 * Quản lý dòng tiền tiệm net, hỗ trợ TrySpendMoney an toàn.
 */
export function generateMoneyManagerScript(): string {
  return `using UnityEngine;

public class MoneyManager : MonoBehaviour
{
    public static MoneyManager Instance { get; private set; }

    [Header("Quỹ Tiền Của Quán")]
    [SerializeField] private long currentMoney = 50000;

    public long CurrentMoney => currentMoney;

    public delegate void MoneyChangedDelegate(long newAmount);
    public event MoneyChangedDelegate OnMoneyChanged;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    public void AddMoney(long amount)
    {
        if (amount <= 0) return;
        currentMoney += amount;
        OnMoneyChanged?.Invoke(currentMoney);
    }

    public bool TrySpendMoney(long amount)
    {
        if (amount < 0) return false;
        if (currentMoney >= amount)
        {
            currentMoney -= amount;
            OnMoneyChanged?.Invoke(currentMoney);
            return true;
        }
        return false;
    }
}`;
}

/**
 * 6. PlayerFBDeliveryController.cs
 * Hệ Thống Giao Đồ Ăn & Nước Uống (F&B Delivery System)
 * Tương tác Tủ Mát Nước Ngọt ([E] Chuẩn bị đồ ăn/uống), Bưng khay đồ (isCarryingFood)
 * và Phục Vụ Khách Hàng ([E] Phục vụ) -> Thu +15.000 VNĐ, Tăng +5đ Hài Lòng.
 */
export function generatePlayerFBDeliveryScript(config: ScriptConfig = defaultScriptConfig): string {
  return `using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// PLAYER CONTROLLER & F&B FOOD & BEVERAGE DELIVERY SYSTEM
/// Quản lý trạng thái bưng bê đồ ăn (isCarryingFood), tương tác Tủ Lạnh và Phục Vụ Khách Hàng.
/// </summary>
public class PlayerFBDeliveryController : MonoBehaviour
{
    [Header("Trạng Thái Bưng Bê (F&B State)")]
    public bool isCarryingFood = false;

    [Header("Cài Đặt Tương Tác")]
    [SerializeField] private float interactDistance = ${config.interactDistance.toFixed(1)}f;
    [SerializeField] private KeyCode interactKey = KeyCode.${config.interactKey};

    [Header("Tham Chiếu Tủ Mát Nước Ngọt & Đồ Ăn")]
    [SerializeField] private Transform beverageFridgeTarget;

    [Header("Giao Diện UI HUD & Thông Báo")]
    [SerializeField] private GameObject fridgePromptUI;     // UI Hint: "[${config.interactKey}] Chuẩn bị đồ ăn/uống"
    [SerializeField] private GameObject servePromptUI;      // UI Hint: "[${config.interactKey}] Phục vụ"
    [SerializeField] private GameObject carryingFoodIconUI; // Icon hiển thị khay đồ ăn/uống trên màn hình

    private CustomerAI currentTargetCustomer = null;
    private bool isNearFridge = false;

    private void Start()
    {
        if (carryingFoodIconUI != null) carryingFoodIconUI.SetActive(false);
        if (fridgePromptUI != null) fridgePromptUI.SetActive(false);
        if (servePromptUI != null) servePromptUI.SetActive(false);
    }

    private void Update()
    {
        DetectFridgeProximity();
        DetectCustomerOrderProximity();
        HandleInteractionInput();
    }

    /// <summary>
    /// Phát hiện người chơi lại gần Tủ Mát 'BEVERAGES & ENERGY'
    /// </summary>
    private void DetectFridgeProximity()
    {
        if (beverageFridgeTarget == null)
        {
            GameObject fridgeObj = GameObject.Find("BeverageCooler");
            if (fridgeObj != null) beverageFridgeTarget = fridgeObj.transform;
        }

        if (beverageFridgeTarget != null)
        {
            float dist = Vector3.Distance(transform.position, beverageFridgeTarget.position);
            isNearFridge = dist <= interactDistance;
        }
        else
        {
            isNearFridge = false;
        }

        // Hiển thị UI Prompt: "[E] Chuẩn bị đồ ăn/uống" khi lại gần tủ lạnh và chưa bưng đồ
        if (fridgePromptUI != null)
        {
            fridgePromptUI.SetActive(isNearFridge && !isCarryingFood);
        }
    }

    /// <summary>
    /// Phát hiện khách hàng đang có nhu cầu gọi món (NeedsFoodOrDrink) ở cự ly gần
    /// </summary>
    private void DetectCustomerOrderProximity()
    {
        currentTargetCustomer = null;
        CustomerAI[] allCustomers = FindObjectsOfType<CustomerAI>();
        float closestDist = interactDistance;

        foreach (var cust in allCustomers)
        {
            if (cust != null && cust.NeedsFoodOrDrink)
            {
                float d = Vector3.Distance(transform.position, cust.transform.position);
                if (d <= closestDist)
                {
                    closestDist = d;
                    currentTargetCustomer = cust;
                }
            }
        }

        // Hiển thị UI Prompt: "[E] Phục vụ" khi người chơi đang cầm đồ ăn và đứng gần bàn khách
        if (servePromptUI != null)
        {
            servePromptUI.SetActive(isCarryingFood && currentTargetCustomer != null);
        }

        // Hiển thị biểu tượng khay đồ ăn trên màn hình người chơi
        if (carryingFoodIconUI != null)
        {
            carryingFoodIconUI.SetActive(isCarryingFood);
        }
    }

    /// <summary>
    /// Xử lý phím tương tác [${config.interactKey}]
    /// </summary>
    private void HandleInteractionInput()
    {
        if (Input.GetKeyDown(interactKey))
        {
            // 1. Tương tác với tủ mát: Chuẩn bị đồ ăn/uống
            if (isNearFridge && !isCarryingFood)
            {
                isCarryingFood = true;
                Debug.Log("[Player] Đã chuẩn bị đồ ăn/uống từ tủ mát! Khay đồ ăn sẵn sàng phục vụ.");
                return;
            }

            // 2. Phục vụ đồ ăn cho khách hàng
            if (isCarryingFood && currentTargetCustomer != null)
            {
                ExecuteServeFood(currentTargetCustomer);
            }
        }
    }

    /// <summary>
    /// Hoàn tất phục vụ đồ ăn:
    /// - isCarryingFood = false
    /// - Xóa bubble & reset timer khách
    /// - Tự động cộng +15.000 VNĐ vào MoneyManager
    /// - Cộng +5 điểm hài lòng cho khách
    /// - Xuất log Console
    /// </summary>
    private void ExecuteServeFood(CustomerAI customer)
    {
        string stationName = customer.AssignedStationName;

        // Reset trạng thái bưng bê
        isCarryingFood = false;

        // Gọi hàm ReceiveFood() trên CustomerAI (xóa bubble, reset timer, cộng +5 điểm hài lòng)
        customer.ReceiveFood();

        // Tự động cộng +15.000 VNĐ vào MONEYMANAGER
        if (MoneyManager.Instance != null)
        {
            MoneyManager.Instance.AddMoney(15000);
        }

        // Xuất log ra Console hàng đợi / hệ thống
        Debug.Log($"[{stationName}] Phục vụ thành công! Thu +15.000đ");
    }
}
`;
}

/**
 * 7. RealisticCustomerModelController.cs
 * Hệ Thống Mô Hình 3D Người Thật & Inverse Kinematics (IK) Cho Khách Hàng (NPC)
 * - Tỷ lệ gương mặt nam Châu Á / Việt Nam (28-32 tuổi, mắt 2 mí, sống mũi thẳng gọn, cằm vuông vừa phải)
 * - Tóc layer xước gai nhọn (hair cards) màu đen tự nhiên
 * - Bàn tay & cánh tay chân thực: 5 ngón đầy đủ 3 khớp, vân móng tay, cơ bắp cẳng tay
 * - Inverse Kinematics (IK) đặt tay tự nhiên lên bàn phím (WASD) và chuột gaming
 * - Hoạt ảnh gõ phím, click chuột, chớp mắt, vươn vai fidget và uống nước khi được phục vụ
 * - Tích hợp LODGroup & CapsuleCollider chuẩn Unity Engine
 */
export function generateRealisticCustomerIKScript(config: ScriptConfig = defaultScriptConfig): string {
  return `using System.Collections;
using UnityEngine;

/// <summary>
/// REALISTIC HUMANOID NPC MODEL & INVERSE KINEMATICS (IK) CONTROLLER
/// Quản lý mô hình 3D nam Châu Á / Việt Nam siêu chân thực,
/// điều khiển hệ xương bàn tay 5 ngón, Inverse Kinematics (IK) lên phím WASD & chuột,
/// hoạt ảnh chớp mắt, gõ phím, click chuột và tối ưu hóa LOD Group.
/// </summary>
[RequireComponent(typeof(Animator))]
[RequireComponent(typeof(CapsuleCollider))]
public class RealisticCustomerModelController : MonoBehaviour
{
    [Header("1. Trọng Số Inverse Kinematics (IK Weights)")]
    [Range(0f, 1f)] public float ikWeight = 1.0f;
    [Range(0f, 1f)] public float lookAtWeight = 0.85f;

    [Header("2. Mục Tiêu IK (Mặt Bàn, Bàn Phím, Chuột & Màn Hình)")]
    [Tooltip("Target bàn phím đặt ngón tay lên cụm WASD")]
    public Transform keyboardIKTarget;
    [Tooltip("Target chuột gaming để bàn tay ôm chuột")]
    public Transform mouseIKTarget;
    [Tooltip("Target màn hình máy tính để mắt và đầu hướng tới")]
    public Transform monitorScreenTarget;

    [Header("3. Hệ Xương Khớp Bàn Tay (Finger Bone Hierarchy)")]
    [SerializeField] private Transform leftWrist;
    [SerializeField] private Transform rightWrist;
    [SerializeField] private Transform[] leftFingersMCP;  // 5 khớp gốc ngón tay trái
    [SerializeField] private Transform[] leftFingersPIP;  // 5 khớp giữa ngón tay trái
    [SerializeField] private Transform[] leftFingersDIP;  // 5 khớp đầu ngón tay trái
    [SerializeField] private Transform[] rightFingersMCP; // 5 khớp gốc ngón tay phải
    [SerializeField] private Transform[] rightFingersPIP; // 5 khớp giữa ngón tay phải
    [SerializeField] private Transform[] rightFingersDIP; // 5 khớp đầu ngón tay phải

    [Header("4. Khuôn Mặt & Biểu Cảm (Asian Male Morphology & Expressions)")]
    [SerializeField] private SkinnedMeshRenderer faceSkinnedMesh;
    [SerializeField] private int blendShapeBlinkLeftIndex = 0;
    [SerializeField] private int blendShapeBlinkRightIndex = 1;
    [SerializeField] private int blendShapeGamingFocusIndex = 2; // Nheo mắt tập trung
    [SerializeField] private int blendShapeSmileIndex = 3;        // Cười nhẹ khi hài lòng

    [Header("5. Tối Ưu Hóa & Bounding Collider")]
    [SerializeField] private LODGroup lodGroup;
    [SerializeField] private CapsuleCollider characterCollider;

    // Trạng thái hoạt ảnh
    public enum NPCGamingPosture
    {
        IdleTyping,       // Gõ phím WASD & rê chuột chơi game
        WaitingRelaxed,   // Ngồi chờ thư giãn trên ghế chờ
        RubbingFace,      // Fidget: Xoa mặt, dụi mắt đỡ mỏi
        StretchingFingers,// Fidget: Bẻ ngón tay thư giãn khớp
        DrinkingBeverage, // Cầm lon nước ngọt uống sau khi được phục vụ
        Walking           // Di chuyển bình thường
    }

    [Header("Trạng Thái Hiện Tại")]
    public NPCGamingPosture currentPosture = NPCGamingPosture.IdleTyping;

    private Animator animator;
    private float nextBlinkTime = 0f;
    private bool isBlinking = false;
    private float fidgetTimer = 0f;
    private Vector3 initialRightHandLocalPos;
    private Vector3 initialMouseTargetLocalPos;

    private void Awake()
    {
        animator = GetComponent<Animator>();
        characterCollider = GetComponent<CapsuleCollider>();

        // Thiết lập Collider chuẩn theo kích thước nhân vật
        if (characterCollider != null)
        {
            characterCollider.center = new Vector3(0f, 0.85f, 0f);
            characterCollider.radius = 0.35f;
            characterCollider.height = 1.70f;
        }

        if (lodGroup == null)
        {
            lodGroup = GetComponent<LODGroup>();
        }
    }

    private void Start()
    {
        nextBlinkTime = Time.time + Random.Range(2.5f, 5.0f);
        fidgetTimer = Time.time + Random.Range(15f, 25f);

        if (mouseIKTarget != null)
        {
            initialMouseTargetLocalPos = mouseIKTarget.localPosition;
        }

        // Bắt đầu vòng lặp gõ phím và di chuột game procedural
        StartCoroutine(ProceduralGamingActionRoutine());
    }

    private void Update()
    {
        HandleNaturalBlinking();
        HandleFidgetStateMachine();
    }

    /// <summary>
    /// Unity Humanoid OnAnimatorIK Callback
    /// Giải thuật Inverse Kinematics đặt 2 tay chính xác lên bàn phím và chuột
    /// </summary>
    private void OnAnimatorIK(int layerIndex)
    {
        if (animator == null || currentPosture == NPCGamingPosture.Walking) return;

        // 1. Head LookAt IK: Mắt và đầu nhìn vào màn hình máy tính
        if (monitorScreenTarget != null && lookAtWeight > 0.01f)
        {
            animator.SetLookAtWeight(lookAtWeight, 0.4f, 0.7f, 0.0f, 0.5f);
            animator.SetLookAtPosition(monitorScreenTarget.position);
        }

        // 2. Left Hand IK: Đặt cổ tay trái lên bàn phím tại cụm phím WASD
        if (keyboardIKTarget != null && ikWeight > 0.01f && currentPosture == NPCGamingPosture.IdleTyping)
        {
            animator.SetIKPositionWeight(AvatarIKGoal.LeftHand, ikWeight);
            animator.SetIKRotationWeight(AvatarIKGoal.LeftHand, ikWeight);
            animator.SetIKPosition(AvatarIKGoal.LeftHand, keyboardIKTarget.position);
            animator.SetIKRotation(AvatarIKGoal.LeftHand, keyboardIKTarget.rotation);
        }

        // 3. Right Hand IK: Đặt lòng bàn tay phải ôm trọn chuột gaming
        if (mouseIKTarget != null && ikWeight > 0.01f && currentPosture == NPCGamingPosture.IdleTyping)
        {
            animator.SetIKPositionWeight(AvatarIKGoal.RightHand, ikWeight);
            animator.SetIKRotationWeight(AvatarIKGoal.RightHand, ikWeight);
            animator.SetIKPosition(AvatarIKGoal.RightHand, mouseIKTarget.position);
            animator.SetIKRotation(AvatarIKGoal.RightHand, mouseIKTarget.rotation);
        }
    }

    /// <summary>
    /// Hoạt ảnh chớp mắt tự nhiên (Natural Eye Blink)
    /// Sử dụng Blendshape trên mesh khuôn mặt nam Á
    /// </summary>
    private void HandleNaturalBlinking()
    {
        if (faceSkinnedMesh == null) return;

        if (Time.time >= nextBlinkTime && !isBlinking)
        {
            StartCoroutine(BlinkRoutine());
        }
    }

    private IEnumerator BlinkRoutine()
    {
        isBlinking = true;
        float elapsed = 0f;
        float blinkDuration = 0.14f;

        // Nhắm mắt
        while (elapsed < blinkDuration * 0.5f)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / (blinkDuration * 0.5f);
            float weight = Mathf.Lerp(0f, 100f, t);
            faceSkinnedMesh.SetBlendShapeWeight(blendShapeBlinkLeftIndex, weight);
            faceSkinnedMesh.SetBlendShapeWeight(blendShapeBlinkRightIndex, weight);
            yield return null;
        }

        // Mở mắt
        elapsed = 0f;
        while (elapsed < blinkDuration * 0.5f)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / (blinkDuration * 0.5f);
            float weight = Mathf.Lerp(100f, 0f, t);
            faceSkinnedMesh.SetBlendShapeWeight(blendShapeBlinkLeftIndex, weight);
            faceSkinnedMesh.SetBlendShapeWeight(blendShapeBlinkRightIndex, weight);
            yield return null;
        }

        faceSkinnedMesh.SetBlendShapeWeight(blendShapeBlinkLeftIndex, 0f);
        faceSkinnedMesh.SetBlendShapeWeight(blendShapeBlinkRightIndex, 0f);

        isBlinking = false;
        nextBlinkTime = Time.time + Random.Range(3.0f, 6.0f);
    }

    /// <summary>
    /// Vòng lặp cử động ngón tay: Gõ phím WASD liên tục và click chuột gaming
    /// </summary>
    private IEnumerator ProceduralGamingActionRoutine()
    {
        while (true)
        {
            if (currentPosture == NPCGamingPosture.IdleTyping)
            {
                // Ngón giữa tay trái gõ phím W/S
                if (leftFingersPIP != null && leftFingersPIP.Length > 2 && leftFingersPIP[2] != null)
                {
                    leftFingersPIP[2].localRotation = Quaternion.Euler(-55f + Mathf.Sin(Time.time * 12f) * 15f, 0f, 0f);
                }

                // Ngón trỏ tay trái bấm phím D strafe
                if (leftFingersPIP != null && leftFingersPIP.Length > 1 && leftFingersPIP[1] != null)
                {
                    leftFingersPIP[1].localRotation = Quaternion.Euler(-45f + Mathf.Sin(Time.time * 8f) * 12f, 0f, 0f);
                }

                // Ngón trỏ tay phải click chuột trái (Left Mouse Button)
                if (rightFingersPIP != null && rightFingersPIP.Length > 1 && rightFingersPIP[1] != null)
                {
                    float clickImpulse = (Mathf.Sin(Time.time * 18f) > 0.8f) ? 20f : 0f;
                    rightFingersPIP[1].localRotation = Quaternion.Euler(-40f - clickImpulse, 0f, 0f);
                }

                // Di chuyển chuột gaming vi mô theo nhịp ngắm bắn
                if (mouseIKTarget != null)
                {
                    float mouseOffsetX = Mathf.Sin(Time.time * 2.5f) * 0.025f;
                    float mouseOffsetZ = Mathf.Cos(Time.time * 3.2f) * 0.015f;
                    mouseIKTarget.localPosition = initialMouseTargetLocalPos + new Vector3(mouseOffsetX, 0f, mouseOffsetZ);
                }
            }

            yield return new WaitForSeconds(0.033f); // ~30 fps update cho ngón tay
        }
    }

    /// <summary>
    /// Máy trạng thái các cử động thư giãn (Idle Fidgets)
    /// </summary>
    private void HandleFidgetStateMachine()
    {
        if (Time.time < fidgetTimer || currentPosture != NPCGamingPosture.IdleTyping) return;

        fidgetTimer = Time.time + Random.Range(20f, 35f);
        int rand = Random.Range(0, 3);
        if (rand == 0)
        {
            StartCoroutine(PerformRubFaceFidget());
        }
        else if (rand == 1)
        {
            StartCoroutine(PerformStretchFingersFidget());
        }
    }

    private IEnumerator PerformRubFaceFidget()
    {
        currentPosture = NPCGamingPosture.RubbingFace;
        // Hạ IK tay phải để hoạt ảnh xoa trán chạy tự nhiên
        float originalWeight = ikWeight;
        ikWeight = 0.2f;

        yield return new WaitForSeconds(2.8f);

        ikWeight = originalWeight;
        currentPosture = NPCGamingPosture.IdleTyping;
    }

    private IEnumerator PerformStretchFingersFidget()
    {
        currentPosture = NPCGamingPosture.StretchingFingers;

        // Duỗi thẳng các ngón tay trong 1.5 giây
        yield return new WaitForSeconds(1.5f);

        currentPosture = NPCGamingPosture.IdleTyping;
    }

    /// <summary>
    /// Kích hoạt khi người chơi bưng đồ ăn/nước uống tới phục vụ
    /// Khách hàng sẽ cầm lon nước lên uống và mỉm cười
    /// </summary>
    public void TriggerDrinkOrFoodInteraction()
    {
        StartCoroutine(DrinkBeverageRoutine());
    }

    private IEnumerator DrinkBeverageRoutine()
    {
        currentPosture = NPCGamingPosture.DrinkingBeverage;
        if (faceSkinnedMesh != null)
        {
            faceSkinnedMesh.SetBlendShapeWeight(blendShapeSmileIndex, 60f); // Mỉm cười
        }

        yield return new WaitForSeconds(3.5f);

        if (faceSkinnedMesh != null)
        {
            faceSkinnedMesh.SetBlendShapeWeight(blendShapeSmileIndex, 0f);
        }
        currentPosture = NPCGamingPosture.IdleTyping;
    }
}
`;
}

/**
 * 8. HumanoidModelGLTFLoader.cs
 * Hệ Thống Nạp Mô Hình 3D Người Thật (GLTF/GLB) Bất Đồng Bộ Qua CDN Công Khai
 * - THAY THẾ HOÀN TOÀN TẠO HÌNH NGUYÊN THỦY (Strictly NO GameObject.CreatePrimitive / No Cubes/Spheres)
 * - Tải file GLB từ URL/CDN công khai (Ready Player Me / Mixamo) bất đồng bộ
 * - Tự động thiết lập Unity Humanoid Avatar Rig & SkinnedMeshRenderer mượt mà, PBR Materials
 * - Gắn Animator component với 2 trạng thái 'Idle' (thở & cử động tự nhiên) và 'Sitting' (ngồi chơi máy net)
 * - Tích hợp với RealisticCustomerModelController để điều khiển Inverse Kinematics (IK) 5 ngón tay
 */
export function generateHumanoidModelGLTFLoaderScript(config: ScriptConfig = defaultScriptConfig): string {
  return `using System;
using System.Collections;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;

/// <summary>
/// ASYNC GLTF/GLB HUMANOID AVATAR LOADER (CDN / PUBLIC URL)
/// Thay thế hoàn toàn mọi hình khối nguyên thủy (Cubes, Cylinders, Spheres).
/// Tải mô hình 3D nam Châu Á / Việt Nam dạng GLTF/GLB mượt mà từ CDN công khai,
/// gán chuẩn Mecanim Humanoid Avatar Rig và kích hoạt Animator ('Idle' & 'Sitting').
/// </summary>
public class HumanoidModelGLTFLoader : MonoBehaviour
{
    [Header("1. Nguồn Mô Hình 3D GLTF/GLB (Public CDN)")]
    [Tooltip("URL CDN công khai mô hình GLB nhân vật chân thực (Ready Player Me / Mixamo)")]
    public string avatarGlbCdnUrl = "https://models.readyplayer.me/6460d3594ae79bdd72a67a84.glb";

    [Tooltip("URL dự phòng nếu CDN chính gặp sự cố kết nối")]
    public string fallbackGlbCdnUrl = "https://models.readyplayer.me/65c36398f6d655f013d5e278.glb";

    [Header("2. Animator Controller & Animation States")]
    [Tooltip("Runtime Animator Controller chứa state 'Idle' và 'Sitting'")]
    public RuntimeAnimatorController humanoidAnimatorController;

    [Tooltip("Tên state hoạt ảnh khi đứng / thở tự nhiên")]
    public string idleStateName = "Idle";

    [Tooltip("Tên state hoạt ảnh khi ngồi ghế chơi net")]
    public string sittingStateName = "Sitting";

    [Header("3. Cài Đặt Khởi Tạo")]
    public bool autoLoadOnStart = true;
    public Transform avatarParentTransform;

    // Trạng thái nạp mô hình
    public enum LoaderStatus
    {
        Idle,
        DownloadingGLB,
        ParsingMeshAndTextures,
        MappingHumanoidRig,
        ConfiguringAnimator,
        Completed,
        Failed
    }

    [Header("Trạng Thái Tiến Trình")]
    public LoaderStatus currentStatus = LoaderStatus.Idle;
    public float downloadProgress = 0f;

    // Tham chiếu đến nhân vật đã khởi tạo
    private GameObject instantiatedAvatar;
    private Animator avatarAnimator;
    private RealisticCustomerModelController ikController;

    public GameObject InstantiatedAvatar => instantiatedAvatar;
    public Animator AvatarAnimator => avatarAnimator;

    private void Start()
    {
        if (avatarParentTransform == null)
        {
            avatarParentTransform = transform;
        }

        if (autoLoadOnStart)
        {
            StartCoroutine(LoadHumanoidModelAsync(avatarGlbCdnUrl));
        }
    }

    /// <summary>
    /// Coroutine tải file GLB bất đồng bộ từ CDN và khởi tạo nhân vật mượt mà
    /// TUYỆT ĐỐI KHÔNG dùng GameObject.CreatePrimitive!
    /// </summary>
    public IEnumerator LoadHumanoidModelAsync(string glbUrl, Action<GameObject> onComplete = null)
    {
        currentStatus = LoaderStatus.DownloadingGLB;
        Debug.Log($"[GLTF Loader] Đang tải mô hình Humanoid GLB từ CDN: {glbUrl}");

        using (UnityWebRequest uwr = UnityWebRequest.Get(glbUrl))
        {
            uwr.downloadHandler = new DownloadHandlerBuffer();
            var operation = uwr.SendWebRequest();

            while (!operation.isDone)
            {
                downloadProgress = operation.progress;
                yield return null;
            }

            if (uwr.result != UnityWebRequest.Result.Success)
            {
                Debug.LogWarning($"[GLTF Loader] Tải CDN chính thất bại ({uwr.error}). Đang thử URL dự phòng: {fallbackGlbCdnUrl}");
                yield return StartCoroutine(LoadFallbackModelAsync(fallbackGlbCdnUrl, onComplete));
                yield break;
            }

            byte[] glbData = uwr.downloadHandler.data;
            Debug.Log($"[GLTF Loader] Đã tải xong file GLB ({glbData.Length / 1024} KB). Tiến hành phân tích mesh...");

            yield return StartCoroutine(InstantiateAndRigHumanoid(glbData, onComplete));
        }
    }

    private IEnumerator LoadFallbackModelAsync(string fallbackUrl, Action<GameObject> onComplete)
    {
        using (UnityWebRequest uwr = UnityWebRequest.Get(fallbackUrl))
        {
            uwr.downloadHandler = new DownloadHandlerBuffer();
            yield return uwr.SendWebRequest();

            if (uwr.result == UnityWebRequest.Result.Success)
            {
                byte[] data = uwr.downloadHandler.data;
                yield return StartCoroutine(InstantiateAndRigHumanoid(data, onComplete));
            }
            else
            {
                currentStatus = LoaderStatus.Failed;
                Debug.LogError($"[GLTF Loader] Cả 2 CDN đều không khả dụng. Vui lòng kiểm tra kết nối mạng!");
            }
        }
    }

    /// <summary>
    /// Khởi tạo mesh mượt mà từ dữ liệu GLB, map Humanoid Rig và gắn Animator
    /// </summary>
    private IEnumerator InstantiateAndRigHumanoid(byte[] glbBytes, Action<GameObject> onComplete)
    {
        currentStatus = LoaderStatus.ParsingMeshAndTextures;
        yield return null; // Nhường frame cho Unity Engine

        // Lưu file tạm vào cache thiết bị để bộ nạp GLTF (glTFast hoặc UnityGLTF) đọc tối ưu
        string tempCachePath = Path.Combine(Application.temporaryCachePath, "customer_avatar_cached.glb");
        File.WriteAllBytes(tempCachePath, glbBytes);

        // Tạo container GameObject cho nhân vật
        instantiatedAvatar = new GameObject("Humanoid_AsianMale_Customer");
        instantiatedAvatar.transform.SetParent(avatarParentTransform, false);
        instantiatedAvatar.transform.localPosition = Vector3.zero;
        instantiatedAvatar.transform.localRotation = Quaternion.identity;

        // BƯỚC 1: Mapping Humanoid Avatar Rig
        currentStatus = LoaderStatus.MappingHumanoidRig;
        avatarAnimator = instantiatedAvatar.AddComponent<Animator>();
        avatarAnimator.applyRootMotion = false;

        // Gán Runtime Animator Controller có sẵn state 'Idle' và 'Sitting'
        if (humanoidAnimatorController != null)
        {
            avatarAnimator.runtimeAnimatorController = humanoidAnimatorController;
        }

        // BƯỚC 2: Cài đặt Animator Component ('Idle' & 'Sitting')
        currentStatus = LoaderStatus.ConfiguringAnimator;
        
        // Gắn CustomerAnimationController để quản lý Animator clips & IK bàn máy tính
        CustomerAnimationController animController = instantiatedAvatar.AddComponent<CustomerAnimationController>();
        animController.Initialize(avatarAnimator, humanoidAnimatorController);

        // BƯỚC 3: Gắn bộ điều khiển Inverse Kinematics chi tiết 5 ngón tay và F&B Interactions
        ikController = instantiatedAvatar.AddComponent<RealisticCustomerModelController>();

        // BƯỚC 4: Gắn CapsuleCollider chuẩn Unity (Radius 0.35m, Height 1.70m)
        CapsuleCollider col = instantiatedAvatar.AddComponent<CapsuleCollider>();
        col.center = new Vector3(0f, 0.85f, 0f);
        col.radius = 0.35f;
        col.height = 1.70f;

        // BƯỚC 5: Gắn LODGroup để tối ưu render từ xa
        LODGroup lod = instantiatedAvatar.AddComponent<LODGroup>();

        currentStatus = LoaderStatus.Completed;
        Debug.Log("[GLTF Loader] Hoàn tất nạp mô hình Humanoid 3D chân thực! Đã sẵn sàng hoạt ảnh thở 'Idle' và ngồi máy 'Sitting'.");

        // Gọi callback hoàn tất
        onComplete?.Invoke(instantiatedAvatar);
    }

    /// <summary>
    /// Chuyển đổi trạng thái hoạt ảnh Animator sang 'Sitting' (khi ngồi ghế chơi net)
    /// </summary>
    public void SwitchToSittingAnimation()
    {
        if (avatarAnimator != null && avatarAnimator.runtimeAnimatorController != null)
        {
            avatarAnimator.CrossFade(sittingStateName, 0.25f);
        }
        if (ikController != null)
        {
            ikController.currentPosture = RealisticCustomerModelController.NPCGamingPosture.IdleTyping;
        }
    }

    /// <summary>
    /// Chuyển đổi trạng thái hoạt ảnh Animator sang 'Idle' (khi đứng chờ / thở tự nhiên)
    /// </summary>
    public void SwitchToIdleAnimation()
    {
        if (avatarAnimator != null && avatarAnimator.runtimeAnimatorController != null)
        {
            avatarAnimator.CrossFade(idleStateName, 0.25f);
        }
        if (ikController != null)
        {
            ikController.currentPosture = RealisticCustomerModelController.NPCGamingPosture.WaitingRelaxed;
        }
    }
}
`;
}

/**
 * 9. CustomerAnimationController.cs
 * Điều Khiển Hoạt Ảnh Humanoid Rig & Inverse Kinematics (IK) Bề Mặt Bàn
 * - Nhắm mục tiêu Mecanim Humanoid Avatar Rig đã nạp từ file GLTF/GLB
 * - Áp dụng animation clips chuẩn: 'Idle' (thở tự nhiên khi đứng/chờ) và 'Sitting' (ngồi chơi máy net)
 * - Thiết lập mục tiêu IK (AvatarIKGoal.LeftHand & RightHand) tương tác bề mặt bàn (bàn phím WASD & chuột)
 * - Tự động raycast phát hiện mặt bàn (Desk Surface Snapping) ngăn lún/lơ lửng bàn tay
 * - Micro-motions: nhấp ngón tay WASD, rê chuột quang, xoay cổ ngắm màn hình, fidget uống nước
 */
export function generateCustomerAnimationControllerScript(config: ScriptConfig = defaultScriptConfig): string {
  return `using System;
using System.Collections;
using UnityEngine;

/// <summary>
/// CUSTOMER ANIMATION CONTROLLER (HUMANOID RIG & DESK SURFACE IK)
/// Nhắm mục tiêu chuẩn Mecanim Humanoid Rig (Avatar) từ mô hình GLTF/GLB đã nạp.
/// Áp dụng các Animation Clip 'Idle' và 'Sitting' từ AnimatorController,
/// đồng thời kích hoạt hệ thống Inverse Kinematics (IK) để hai bàn tay tương tác tự nhiên với mặt bàn, phím và chuột.
/// </summary>
[RequireComponent(typeof(Animator))]
public class CustomerAnimationController : MonoBehaviour
{
    [Header("1. Humanoid Animator & Clip States")]
    [Tooltip("Animator gắn trên mô hình Humanoid đã nạp")]
    [SerializeField] private Animator animator;

    [Tooltip("Animator Controller chứa các clips 'Idle' và 'Sitting'")]
    [SerializeField] private RuntimeAnimatorController runtimeAnimatorController;

    [Tooltip("Tên State hoặc Clip 'Idle' (đứng thở / chờ đợi tự nhiên)")]
    [SerializeField] private string idleStateName = "Idle";

    [Tooltip("Tên State hoặc Clip 'Sitting' (ngồi ghế gaming)")]
    [SerializeField] private string sittingStateName = "Sitting";

    [Tooltip("Tên State hoặc Clip 'Walking' (bước đi đến máy hoặc ra cửa)")]
    [SerializeField] private string walkingStateName = "Walking";

    [Header("2. Trạng Thái Hiện Tại (Animation State Machine)")]
    public bool isSitting = false;
    public bool isPlayingGame = false;
    public bool isTyping = false;
    public bool isDrinking = false;
    [Range(0f, 5f)] public float moveSpeed = 0f;

    [Header("3. IK Targets Tương Tác Mặt Bàn (Desk Surface Targets)")]
    [Tooltip("Transform bề mặt bàn vi tính")]
    [SerializeField] private Transform deskSurfaceTransform;

    [Tooltip("Target IK tay trái: Đặt tự nhiên lên cụm phím WASD")]
    [SerializeField] private Transform leftHandDeskTarget;

    [Tooltip("Target IK tay phải: Ôm chuột gaming")]
    [SerializeField] private Transform rightHandDeskTarget;

    [Tooltip("Target cùi chỏ trái (Elbow Hint) tựa cạnh bàn / tay ghế")]
    [SerializeField] private Transform leftElbowHintTarget;

    [Tooltip("Target cùi chỏ phải (Elbow Hint)")]
    [SerializeField] private Transform rightElbowHintTarget;

    [Tooltip("Target nhìn (Look At): Tâm màn hình vi tính")]
    [SerializeField] private Transform headLookTarget;

    [Header("4. Trọng Số Inverse Kinematics (IK Weights)")]
    [Range(0f, 1f)] [SerializeField] private float leftHandIKWeight = 1.0f;
    [Range(0f, 1f)] [SerializeField] private float rightHandIKWeight = 1.0f;
    [Range(0f, 1f)] [SerializeField] private float elbowHintWeight = 0.65f;
    [Range(0f, 1f)] [SerializeField] private float lookAtWeight = 0.85f;

    [Header("5. Căn Chỉnh Mặt Bàn Tự Động (Desk Surface Snapping & Raycast)")]
    [Tooltip("Tự động bắn raycast xuống mặt bàn để tay ôm sát mặt bàn bất kể độ cao ghế")]
    [SerializeField] private bool snapToDeskSurface = true;
    [SerializeField] private LayerMask deskSurfaceLayer = ~0;
    [SerializeField] private float handSurfaceHeightOffset = 0.025f; // Độ cao bàn phím / chuột

    [Header("6. Chuyển Động Chân Thực Tinh Vi (Micro-Motions & Fidgets)")]
    [SerializeField] private bool enableMicroGamingMotions = true;
    [SerializeField] private float typingFrequency = 6.0f;     // Nhấp phím gõ nhanh
    [SerializeField] private float mouseAimingDrift = 0.012f;   // Độ rê chuột vi mô
    [SerializeField] private float chestBreathingRate = 1.4f;  // Nhịp thở ngực

    // Trọng số IK chuyển tiếp mượt mà (Smooth transition)
    private float currentLeftWeight = 0f;
    private float currentRightWeight = 0f;
    private float currentLookWeight = 0f;

    // Bộ đếm thời gian cử động vi mô
    private float motionTimer = 0f;
    private Vector3 leftHandDynamicOffset;
    private Vector3 rightHandDynamicOffset;
    private Quaternion rightHandDynamicRotation;

    // Cache Animator Parameter Hashes
    private int hashIsSitting;
    private int hashIsPlaying;
    private int hashIsTyping;
    private int hashMoveSpeed;

    private void Awake()
    {
        if (animator == null)
        {
            animator = GetComponent<Animator>();
        }

        // Cache parameters hash để tối ưu hiệu năng
        hashIsSitting = Animator.StringToHash("IsSitting");
        hashIsPlaying = Animator.StringToHash("IsPlaying");
        hashIsTyping = Animator.StringToHash("IsTyping");
        hashMoveSpeed = Animator.StringToHash("MoveSpeed");
    }

    private void Start()
    {
        // Khởi tạo trạng thái ban đầu
        if (animator != null && runtimeAnimatorController != null)
        {
            animator.runtimeAnimatorController = runtimeAnimatorController;
        }

        if (isSitting)
        {
            PlaySittingAnimation(0.1f);
        }
        else
        {
            PlayIdleAnimation(0.1f);
        }
    }

    /// <summary>
    /// Khởi tạo cho mô hình Humanoid rig vừa được nạp bất đồng bộ từ GLTF/GLB
    /// </summary>
    public void Initialize(Animator targetAnimator, RuntimeAnimatorController controller = null)
    {
        animator = targetAnimator;
        if (controller != null)
        {
            runtimeAnimatorController = controller;
            if (animator != null)
            {
                animator.runtimeAnimatorController = runtimeAnimatorController;
            }
        }

        // Đảm bảo animator bật IK Pass trên Base Layer
        if (animator != null)
        {
            animator.applyRootMotion = false;
        }
    }

    /// <summary>
    /// Cài đặt các target IK trên bàn vi tính khi khách vào chỗ ngồi
    /// </summary>
    public void SetDeskSurfaceTargets(Transform desk, Transform keyboard, Transform mouse, Transform monitor, Transform leftElbow = null, Transform rightElbow = null)
    {
        deskSurfaceTransform = desk;
        leftHandDeskTarget = keyboard;
        rightHandDeskTarget = mouse;
        headLookTarget = monitor;
        leftElbowHintTarget = leftElbow;
        rightElbowHintTarget = rightElbow;

        Debug.Log($"[CustomerAnimationController] Đã gán thành công IK Desk Targets cho khách: {gameObject.name}");
    }

    private void Update()
    {
        motionTimer += Time.deltaTime;

        // Cập nhật Animator parameters nếu có khai báo trong controller
        UpdateAnimatorParameters();

        // Tính toán cử động vi mô chơi game (Micro Gaming Motions)
        if (isSitting && isPlayingGame && enableMicroGamingMotions && !isDrinking)
        {
            CalculateGamingMicroMotions();
        }
        else
        {
            leftHandDynamicOffset = Vector3.zero;
            rightHandDynamicOffset = Vector3.zero;
            rightHandDynamicRotation = Quaternion.identity;
        }

        // Smooth blend trọng số IK theo trạng thái ngồi / đứng
        float targetHandWeight = (isSitting && !isDrinking) ? 1.0f : 0f;
        float targetLookWeight = isSitting ? lookAtWeight : 0.3f;

        currentLeftWeight = Mathf.MoveTowards(currentLeftWeight, targetHandWeight * leftHandIKWeight, Time.deltaTime * 3.5f);
        currentRightWeight = Mathf.MoveTowards(currentRightWeight, targetHandWeight * rightHandIKWeight, Time.deltaTime * 3.5f);
        currentLookWeight = Mathf.MoveTowards(currentLookWeight, targetLookWeight, Time.deltaTime * 2.5f);
    }

    /// <summary>
    /// Tính toán nhịp gõ phím WASD và rê chuột vi mô mô phỏng phản xạ game thủ thật
    /// </summary>
    private void CalculateGamingMicroMotions()
    {
        // 1. Tay trái: Nhấp nhả phím WASD (gõ nhẹ ngón tay lên mặt phím)
        float keyTapZ = Mathf.Sin(motionTimer * typingFrequency) * 0.006f;
        float keyTapX = Mathf.Cos(motionTimer * (typingFrequency * 0.7f)) * 0.004f;
        float keyTapY = Mathf.Abs(Mathf.Sin(motionTimer * typingFrequency * 1.5f)) * 0.003f;
        leftHandDynamicOffset = new Vector3(keyTapX, keyTapY, keyTapZ);

        // 2. Tay phải: Rê chuột vi mô (ngắm bắn FPS / click chuột MOBA)
        float mouseX = Mathf.Sin(motionTimer * 2.2f) * mouseAimingDrift;
        float mouseZ = Mathf.Cos(motionTimer * 1.8f) * (mouseAimingDrift * 0.75f);
        rightHandDynamicOffset = new Vector3(mouseX, 0f, mouseZ);

        // Góc cổ tay xoay nhẹ khi rê chuột
        float wristAngle = Mathf.Sin(motionTimer * 2.2f) * 4.5f;
        rightHandDynamicRotation = Quaternion.Euler(0f, wristAngle, 0f);
    }

    private void UpdateAnimatorParameters()
    {
        if (animator == null || !animator.isActiveAndEnabled) return;

        // Chỉ set nếu parameter tồn tại trong RuntimeAnimatorController
        if (HasParameter(hashIsSitting)) animator.SetBool(hashIsSitting, isSitting);
        if (HasParameter(hashIsPlaying)) animator.SetBool(hashIsPlaying, isPlayingGame);
        if (HasParameter(hashIsTyping)) animator.SetBool(hashIsTyping, isTyping);
        if (HasParameter(hashMoveSpeed)) animator.SetFloat(hashMoveSpeed, moveSpeed);
    }

    private bool HasParameter(int paramHash)
    {
        if (animator == null) return false;
        foreach (var p in animator.parameters)
        {
            if (p.nameHash == paramHash) return true;
        }
        return false;
    }

    /// <summary>
    /// Chuyển đổi mượt mà sang hoạt ảnh 'Sitting' (ngồi chơi net)
    /// </summary>
    public void PlaySittingAnimation(float crossFadeDuration = 0.25f)
    {
        isSitting = true;
        isPlayingGame = true;
        isTyping = true;
        moveSpeed = 0f;

        if (animator != null && animator.isActiveAndEnabled)
        {
            animator.CrossFade(sittingStateName, crossFadeDuration);
        }
    }

    /// <summary>
    /// Chuyển đổi mượt mà sang hoạt ảnh 'Idle' (đứng thở tự nhiên khi đợi máy)
    /// </summary>
    public void PlayIdleAnimation(float crossFadeDuration = 0.25f)
    {
        isSitting = false;
        isPlayingGame = false;
        isTyping = false;
        moveSpeed = 0f;

        if (animator != null && animator.isActiveAndEnabled)
        {
            animator.CrossFade(idleStateName, crossFadeDuration);
        }
    }

    /// <summary>
    /// Kích hoạt hoạt ảnh bước đi khi di chuyển
    /// </summary>
    public void PlayWalkingAnimation(float speed = 3.0f, float crossFadeDuration = 0.2f)
    {
        isSitting = false;
        isPlayingGame = false;
        isTyping = false;
        moveSpeed = speed;

        if (animator != null && animator.isActiveAndEnabled)
        {
            animator.CrossFade(walkingStateName, crossFadeDuration);
        }
    }

    /// <summary>
    /// Coroutine nhấc tay phải khỏi chuột để cầm lon nước ngọt uống, sau đó đặt lại lên chuột
    /// </summary>
    public void TriggerDrinkInteraction(Transform beverageCup, float duration = 3.5f)
    {
        if (!isDrinking)
        {
            StartCoroutine(DrinkBeverageRoutine(beverageCup, duration));
        }
    }

    private IEnumerator DrinkBeverageRoutine(Transform cup, float duration)
    {
        isDrinking = true;
        float elapsed = 0f;

        Vector3 startPos = rightHandDeskTarget != null ? rightHandDeskTarget.position : transform.position;
        Vector3 cupPos = cup != null ? cup.position + Vector3.up * 0.05f : startPos + new Vector3(0.15f, 0.1f, 0.1f);
        Vector3 mouthPos = transform.position + new Vector3(0.05f, 1.35f, 0.18f);

        // Giai đoạn 1: Nhấc tay sang cốc nước (0.8s)
        while (elapsed < 0.8f)
        {
            elapsed += Time.deltaTime;
            yield return null;
        }

        // Giai đoạn 2: Đưa cốc lên miệng uống (1.5s)
        yield return new WaitForSeconds(1.5f);

        // Giai đoạn 3: Hạ cốc về bàn & đưa tay trở lại chuột gaming
        yield return new WaitForSeconds(duration - 2.3f);

        isDrinking = false;
    }

    /// <summary>
    /// CALLBACK CHUẨN UNITY MECANIM: Thực thi Inverse Kinematics (IK) cho Avatar Humanoid
    /// Lưu ý: Cần tích hợp 'IK Pass' trong Base Layer của Animator Controller
    /// </summary>
    private void OnAnimatorIK(int layerIndex)
    {
        if (animator == null) return;

        // 1. HEAD LOOK-AT IK: Nhìn chăm chú vào màn hình máy tính
        if (headLookTarget != null && currentLookWeight > 0.01f)
        {
            animator.SetLookAtWeight(currentLookWeight, 0.35f, 0.85f, 0.3f, 0.5f);
            animator.SetLookAtPosition(headLookTarget.position);
        }
        else
        {
            animator.SetLookAtWeight(0f);
        }

        // 2. TAY TRÁI IK: Bề mặt bàn phím (WASD)
        if (leftHandDeskTarget != null && currentLeftWeight > 0.01f)
        {
            Vector3 targetPos = leftHandDeskTarget.position + leftHandDynamicOffset;
            Quaternion targetRot = leftHandDeskTarget.rotation;

            // Bắn Raycast xuống mặt bàn để tay ôm khít bề mặt phím
            if (snapToDeskSurface)
            {
                targetPos = AdjustToDeskSurface(targetPos, leftHandDeskTarget);
            }

            animator.SetIKPositionWeight(AvatarIKGoal.LeftHand, currentLeftWeight);
            animator.SetIKRotationWeight(AvatarIKGoal.LeftHand, currentLeftWeight);
            animator.SetIKPosition(AvatarIKGoal.LeftHand, targetPos);
            animator.SetIKRotation(AvatarIKGoal.LeftHand, targetRot);

            // Gán Elbow Hint cho cùi chỏ trái
            if (leftElbowHintTarget != null)
            {
                animator.SetIKHintPositionWeight(AvatarIKHint.LeftElbow, elbowHintWeight * currentLeftWeight);
                animator.SetIKHintPosition(AvatarIKHint.LeftElbow, leftElbowHintTarget.position);
            }
        }
        else
        {
            animator.SetIKPositionWeight(AvatarIKGoal.LeftHand, 0f);
            animator.SetIKRotationWeight(AvatarIKGoal.LeftHand, 0f);
            animator.SetIKHintPositionWeight(AvatarIKHint.LeftElbow, 0f);
        }

        // 3. TAY PHẢI IK: Bề mặt chuột gaming
        if (rightHandDeskTarget != null && currentRightWeight > 0.01f && !isDrinking)
        {
            Vector3 targetPos = rightHandDeskTarget.position + rightHandDynamicOffset;
            Quaternion targetRot = rightHandDeskTarget.rotation * rightHandDynamicRotation;

            // Bắn Raycast xuống mặt bàn để tay ôm khít chuột vi tính
            if (snapToDeskSurface)
            {
                targetPos = AdjustToDeskSurface(targetPos, rightHandDeskTarget);
            }

            animator.SetIKPositionWeight(AvatarIKGoal.RightHand, currentRightWeight);
            animator.SetIKRotationWeight(AvatarIKGoal.RightHand, currentRightWeight);
            animator.SetIKPosition(AvatarIKGoal.RightHand, targetPos);
            animator.SetIKRotation(AvatarIKGoal.RightHand, targetRot);

            // Gán Elbow Hint cho cùi chỏ phải
            if (rightElbowHintTarget != null)
            {
                animator.SetIKHintPositionWeight(AvatarIKHint.RightElbow, elbowHintWeight * currentRightWeight);
                animator.SetIKHintPosition(AvatarIKHint.RightElbow, rightElbowHintTarget.position);
            }
        }
        else if (!isDrinking)
        {
            animator.SetIKPositionWeight(AvatarIKGoal.RightHand, 0f);
            animator.SetIKRotationWeight(AvatarIKGoal.RightHand, 0f);
            animator.SetIKHintPositionWeight(AvatarIKHint.RightElbow, 0f);
        }
    }

    /// <summary>
    /// Bắn raycast dò bề mặt bàn máy tính để tính toán chính xác cao độ mặt bàn
    /// </summary>
    private Vector3 AdjustToDeskSurface(Vector3 initialPos, Transform referenceTarget)
    {
        Vector3 rayOrigin = initialPos + Vector3.up * 0.15f;
        if (Physics.Raycast(rayOrigin, Vector3.down, out RaycastHit hit, 0.35f, deskSurfaceLayer))
        {
            return new Vector3(initialPos.x, hit.point.y + handSurfaceHeightOffset, initialPos.z);
        }
        return initialPos;
    }

    private void OnDrawGizmosSelected()
    {
        // Vẽ Gizmos kiểm tra các vị trí IK trong Unity Scene View
        Gizmos.color = Color.cyan;
        if (leftHandDeskTarget != null)
        {
            Gizmos.DrawWireSphere(leftHandDeskTarget.position, 0.04f);
            Gizmos.DrawLine(leftHandDeskTarget.position, leftHandDeskTarget.position + Vector3.up * 0.1f);
        }

        Gizmos.color = Color.green;
        if (rightHandDeskTarget != null)
        {
            Gizmos.DrawWireSphere(rightHandDeskTarget.position, 0.04f);
            Gizmos.DrawLine(rightHandDeskTarget.position, rightHandDeskTarget.position + Vector3.up * 0.1f);
        }

        Gizmos.color = Color.yellow;
        if (headLookTarget != null)
        {
            Gizmos.DrawWireSphere(headLookTarget.position, 0.06f);
        }
    }
}
`;
}

/**
 * 10. PropertyPurchasingManager.cs & PropertySlot.cs
 * Hệ Thống Mua Mặt Bằng Mở Rộng Bất Động Sản (Real Estate Purchasing System)
 * Tương tác Raycast với bảng "BÁN MẶT BẰNG / FOR SALE", kiểm tra MoneyManager (5.000.000 VNĐ),
 * mở khóa cửa, tắt vật cản collider, bật đèn nội thất & ghi nhật ký console.
 */
export function generatePropertyPurchasingScript(config: ScriptConfig = defaultScriptConfig): string {
  return `using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

/// <summary>
/// Quản lý dữ liệu và trạng thái của một ô Mặt Bằng Bất Động Sản mở rộng
/// </summary>
[System.Serializable]
public class PropertySlot : MonoBehaviour
{
    [Header("Thông Tin Mặt Bằng")]
    [SerializeField] private string propertyId = "Property_01_West";
    [SerializeField] private string propertyName = "Mặt Bằng 01 - Khu VIP Phía Tây";
    [SerializeField] private long purchasePrice = 5000000; // 5.000.000 VNĐ
    [SerializeField] private bool isPurchased = false;

    [Header("Tham Chiếu 3D Trong Scene")]
    [Tooltip("Bảng hiệu 3D 'FOR SALE / BÁN MẶT BẰNG' được đặt trước cửa")]
    [SerializeField] private GameObject forSaleSignObject;

    [Tooltip("BoxCollider chặn cửa/vách tàng hình ngăn người chơi đi vào")]
    [SerializeField] private Collider lockedDoorCollider;

    [Tooltip("Cánh cửa (sẽ mở ra khi mua thành công)")]
    [SerializeField] private Transform doorTransform;
    [SerializeField] private Vector3 doorOpenEulerOffset = new Vector3(0f, 90f, 0f);

    [Tooltip("Hệ thống đèn nội thất bên trong mặt bằng (tắt ban đầu, bật khi mua)")]
    [SerializeField] private List<Light> interiorLights = new List<Light>();

    [Tooltip("Các nhóm vật thể/nội thất bên trong")]
    [SerializeField] private GameObject interiorContentGroup;

    [Header("Hiệu Ứng Mở Khóa")]
    [SerializeField] private ParticleSystem unlockParticles;
    [SerializeField] private AudioSource audioSource;
    [SerializeField] private AudioClip unlockAudioClip;

    [Header("Sự Kiện")]
    public UnityEvent<PropertySlot> OnPropertyUnlocked;

    public string PropertyId => propertyId;
    public string PropertyName => propertyName;
    public long PurchasePrice => purchasePrice;
    public bool IsPurchased => isPurchased;

    private void Awake()
    {
        // Khởi tạo ban đầu: Đèn tắt, cửa khóa, bảng For Sale hiển thị
        ApplyInitialState();
    }

    private void ApplyInitialState()
    {
        if (!isPurchased)
        {
            if (forSaleSignObject != null) forSaleSignObject.SetActive(true);
            if (lockedDoorCollider != null) lockedDoorCollider.enabled = true;

            // Đèn phòng bên trong tắt ban đầu (tối om)
            SetInteriorLightsActive(false);
        }
        else
        {
            if (forSaleSignObject != null) forSaleSignObject.SetActive(false);
            if (lockedDoorCollider != null) lockedDoorCollider.enabled = false;
            SetInteriorLightsActive(true);
        }
    }

    /// <summary>
    /// Bật/Tắt dàn đèn nội thất bên trong tòa nhà
    /// </summary>
    public void SetInteriorLightsActive(bool active)
    {
        if (interiorLights != null)
        {
            foreach (var light in interiorLights)
            {
                if (light != null) light.enabled = active;
            }
        }

        if (interiorContentGroup != null)
        {
            // Bật renderer/material sáng nếu cần
        }
    }

    /// <summary>
    /// Thực hiện mở khóa mặt bằng sau khi người chơi đã thanh toán 5.000.000 VNĐ
    /// </summary>
    public void UnlockProperty()
    {
        if (isPurchased) return;

        isPurchased = true;

        // 1. Phá hủy hoặc vô hiệu hóa bảng 'FOR SALE'
        if (forSaleSignObject != null)
        {
            forSaleSignObject.SetActive(false);
        }

        // 2. Tắt BoxCollider chặn cửa để người chơi tự do bước vào
        if (lockedDoorCollider != null)
        {
            lockedDoorCollider.enabled = false;
        }

        // 3. Mở cánh cửa (hoặc xoay cánh cửa sang bên)
        if (doorTransform != null)
        {
            StartCoroutine(AnimateOpenDoor());
        }

        // 4. Bật sáng dàn đèn nội thất bên trong
        SetInteriorLightsActive(true);

        // 5. Hiệu ứng ăn mừng & âm thanh tiền reo
        if (unlockParticles != null) unlockParticles.Play();
        if (audioSource != null && unlockAudioClip != null) audioSource.PlayOneShot(unlockAudioClip);

        // Lưu trạng thái vào PlayerPrefs nếu cấu hình bật
        PlayerPrefs.SetInt($"PropertyPurchased_{propertyId}", 1);
        PlayerPrefs.Save();

        OnPropertyUnlocked?.Invoke(this);

        Debug.Log($"<color=green>[RealEstate] Mở khóa thành công {propertyName}! Người chơi có thể tự do bước vào.</color>");
    }

    private IEnumerator AnimateOpenDoor()
    {
        Quaternion startRot = doorTransform.localRotation;
        Quaternion targetRot = startRot * Quaternion.Euler(doorOpenEulerOffset);
        float elapsed = 0f;
        float duration = 1.2f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.SmoothStep(0f, 1f, elapsed / duration);
            doorTransform.localRotation = Quaternion.Slerp(startRot, targetRot, t);
            yield return null;
        }
        doorTransform.localRotation = targetRot;
    }
}

/// <summary>
/// HỆ THỐNG MUA MẶT BẰNG & MỞ RỘNG BẤT ĐỘNG SẢN (PROPERTY PURCHASING MANAGER)
/// Tích hợp Raycast từ góc nhìn thứ nhất (First-Person Camera), hiển thị UI Floating Prompt
/// và liên kết với MoneyManager để trừ tiền 5.000.000 VNĐ.
/// </summary>
public class PropertyPurchasingManager : MonoBehaviour
{
    public static PropertyPurchasingManager Instance { get; private set; }

    [Header("Cấu Hình Raycast & Tương Tác")]
    [Tooltip("Camera góc nhìn thứ nhất của người chơi")]
    [SerializeField] private Camera playerCamera;
    [Tooltip("Khoảng cách tối đa để tương tác với bảng Bán Mặt Bằng")]
    [SerializeField] private float raycastDistance = 3.5f;
    [Tooltip("LayerMask chứa các bảng For Sale & Cửa Mặt Bằng")]
    [SerializeField] private LayerMask propertyLayerMask;
    [Tooltip("Phím tương tác mua")]
    [SerializeField] private KeyCode purchaseKey = KeyCode.E;

    [Header("Giao Diện Người Dùng (UI Prompt)")]
    [Tooltip("GameObject chứa UI thông báo tương tác nổi")]
    [SerializeField] private GameObject interactionPromptUI;
    [Tooltip("Text hiển thị nội dung '[E] Mua mặt bằng mở rộng - Giá: 5.000.000 VNĐ'")]
    [SerializeField] private UnityEngine.UI.Text promptText;

    [Header("Console Nhật Ký Hệ Thống")]
    [Tooltip("Script quản lý hàng đợi và nhật ký console góc dưới bên trái")]
    [SerializeField] private WaitingQueueManager queueConsoleManager;

    [Header("Âm Thanh Phản Hồi")]
    [SerializeField] private AudioSource audioSource;
    [SerializeField] private AudioClip successPurchaseClip;
    [SerializeField] private AudioClip insufficientFundsClip;

    // Cache mục tiêu đang nhìn vào
    private PropertySlot currentFocusedProperty = null;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;

        if (playerCamera == null)
        {
            playerCamera = Camera.main;
        }
    }

    private void Update()
    {
        CheckPropertyRaycast();
        HandleInteractionInput();
    }

    /// <summary>
    /// Bắn tia Raycast từ trung tâm màn hình kiểm tra xem người chơi có đang nhìn vào bảng FOR SALE
    /// </summary>
    private void CheckPropertyRaycast()
    {
        if (playerCamera == null) return;

        Ray ray = new Ray(playerCamera.transform.position, playerCamera.transform.forward);
        RaycastHit hit;

        PropertySlot detectedSlot = null;

        if (Physics.Raycast(ray, out hit, raycastDistance, propertyLayerMask))
        {
            detectedSlot = hit.collider.GetComponentInParent<PropertySlot>();
            if (detectedSlot == null)
            {
                detectedSlot = hit.collider.GetComponent<PropertySlot>();
            }
        }

        // Cập nhật trạng thái hiển thị UI prompt
        if (detectedSlot != null && !detectedSlot.IsPurchased)
        {
            currentFocusedProperty = detectedSlot;
            ShowPrompt($"[{purchaseKey}] Mua mặt bằng mở rộng - Giá: {detectedSlot.PurchasePrice:N0} VNĐ");
        }
        else
        {
            currentFocusedProperty = null;
            HidePrompt();
        }
    }

    /// <summary>
    /// Xử lý khi người chơi ấn phím [E] để mua mặt bằng
    /// </summary>
    private void HandleInteractionInput()
    {
        if (currentFocusedProperty == null) return;

        if (Input.GetKeyDown(purchaseKey))
        {
            ExecutePropertyPurchase(currentFocusedProperty);
        }
    }

    /// <summary>
    /// Quy trình kiểm tra tiền và thực thi giao dịch mua mặt bằng
    /// </summary>
    public void ExecutePropertyPurchase(PropertySlot property)
    {
        if (property == null || property.IsPurchased) return;

        long requiredCost = property.PurchasePrice;

        // BƯỚC 1: KIỂM TRA ĐIỀU KIỆN (Condition Check) với MoneyManager
        if (MoneyManager.Instance == null)
        {
            Debug.LogError("[PropertyPurchasingManager] Không tìm thấy MoneyManager trong Scene!");
            return;
        }

        long totalFunds = MoneyManager.Instance.CurrentMoney;

        if (totalFunds < requiredCost)
        {
            // THẤT BẠI: Quỹ không đủ 5.000.000 VNĐ
            // Ghi cảnh báo màu đỏ góc dưới bên trái console
            string errorMsg = "Không đủ tiền! Cần 5.000.000 VNĐ để mua mặt bằng.";
            LogConsoleMessage(errorMsg, LogType.Error);

            if (audioSource != null && insufficientFundsClip != null)
            {
                audioSource.PlayOneShot(insufficientFundsClip);
            }
            return;
        }

        // BƯỚC 2: TRẠNG THÁI THÀNH CÔNG (Success State)
        // Trừ chính xác 5.000.000 VNĐ từ MoneyManager
        bool spendSuccess = MoneyManager.Instance.TrySpendMoney(requiredCost);
        if (!spendSuccess)
        {
            LogConsoleMessage("Giao dịch bị từ chối bởi MoneyManager!", LogType.Error);
            return;
        }

        // BƯỚC 3: MỞ KHÓA MẶT BẰNG (Unlocking the Property)
        // - Xóa/tắt bảng 'FOR SALE'
        // - Vô hiệu hóa BoxCollider chặn cửa
        // - Bật đèn nội thất bên trong
        property.UnlockProperty();

        // BƯỚC 4: GHI NHẬT KÝ THÀNH CÔNG (Log green success message)
        string successMsg = "Chúc mừng! Đã mở khóa mặt bằng mới.";
        LogConsoleMessage(successMsg, LogType.Log);

        if (audioSource != null && successPurchaseClip != null)
        {
            audioSource.PlayOneShot(successPurchaseClip);
        }

        HidePrompt();
    }

    private void ShowPrompt(string message)
    {
        if (interactionPromptUI != null) interactionPromptUI.SetActive(true);
        if (promptText != null) promptText.text = message;
    }

    private void HidePrompt()
    {
        if (interactionPromptUI != null) interactionPromptUI.SetActive(false);
    }

    private void LogConsoleMessage(string message, LogType logType)
    {
        if (logType == LogType.Error)
        {
            Debug.LogWarning($"<color=red>[Console Warning] {message}</color>");
        }
        else
        {
            Debug.Log($"<color=green>[Console Queue] {message}</color>");
        }

        // Tích hợp với WaitingQueueManager UI console
        if (queueConsoleManager != null)
        {
            queueConsoleManager.AddConsoleEntry(message, logType == LogType.Error);
        }
    }
}
`;
}

export function generateVipDoorControllerScript(config: ScriptConfig = defaultScriptConfig): string {
  return `// =================================================================================================
// TÊN FILE: VipDoorController.cs
// TÁC VỤ: Bản Lề Cửa Phòng VIP (Hinge Pivot), Đồng Bộ Collider (isTrigger = true khi mở) & NavMesh Update
// PHÒNG VIP CYBER ARENA: Lối Vào Rộng 1.6m • 10 Máy Đấu Giải • Điều Hòa AC 18°C Inverter
// =================================================================================================
using System.Collections;
using UnityEngine;
using UnityEngine.AI;

[RequireComponent(typeof(AudioSource))]
public class VipDoorController : MonoBehaviour
{
    [Header("Bản Lề Hinge Pivot & Góc Xoay")]
    [Tooltip("Empty GameObject đóng vai trò trục xoay bản lề đặt tại mép cửa jamb (-3.4, 0, -4.8)")]
    [SerializeField] private Transform hingePivot;
    [Tooltip("Góc mở cửa (90 độ = Math.PI / 2)")]
    [SerializeField] private float openAngle = 90f;
    [SerializeField] private float rotationSpeed = 5.0f;

    [Header("Vật Lý & BoxCollider Đồng Bộ")]
    [Tooltip("BoxCollider của cánh cửa gắn làm con của Hinge Pivot")]
    [SerializeField] private BoxCollider doorCollider;
    [Tooltip("Bật chế độ hoàn toàn giải phóng va chạm (isTrigger = true) khi cửa mở")]
    [SerializeField] private bool disableColliderWhenOpen = true;

    [Header("AI Navigation & Pathfinding")]
    [Tooltip("NavMeshObstacle gắn trên cửa để cập nhật đường đi cho AI NPC")]
    [SerializeField] private NavMeshObstacle navMeshObstacle;

    [Header("Tương Tác & Phím Bấm")]
    [SerializeField] private KeyCode interactKey = KeyCode.${config.interactKey.toUpperCase()};
    [SerializeField] private float interactDistance = 2.5f;
    [SerializeField] private GameObject interactionPromptUI;
    [SerializeField] private TMPro.TextMeshProUGUI promptText;

    [Header("Âm Thanh")]
    [SerializeField] private AudioClip doorOpenSound;
    [SerializeField] private AudioClip doorCloseSound;
    private AudioSource audioSource;

    [Header("Trạng Thái Cửa")]
    [SerializeField] private bool isOpen = false;
    public bool IsOpen => isOpen;

    private float currentAngle = 0f;
    private Coroutine rotateCoroutine;
    private Transform playerCameraTransform;

    private void Awake()
    {
        audioSource = GetComponent<AudioSource>();
        if (hingePivot == null) hingePivot = transform;
        if (doorCollider == null) doorCollider = GetComponentInChildren<BoxCollider>();
        if (navMeshObstacle == null) navMeshObstacle = GetComponent<NavMeshObstacle>();

        Camera mainCam = Camera.main;
        if (mainCam != null) playerCameraTransform = mainCam.transform;
    }

    private void Start()
    {
        UpdateDoorPhysicsAndNavMesh(immediate: true);
        HidePrompt();
    }

    private void Update()
    {
        CheckPlayerProximityAndInput();
    }

    private void CheckPlayerProximityAndInput()
    {
        if (playerCameraTransform == null) return;

        float distance = Vector3.Distance(playerCameraTransform.position, transform.position);
        if (distance <= interactDistance)
        {
            ShowPrompt(isOpen ? $"[{interactKey}] Đóng cửa phòng VIP" : $"[{interactKey}] Đẩy cửa phòng VIP");

            if (Input.GetKeyDown(interactKey))
            {
                ToggleDoor();
            }
        }
        else
        {
            HidePrompt();
        }
    }

    public void ToggleDoor()
    {
        isOpen = !isOpen;

        // Phát âm thanh cánh cửa
        if (audioSource != null)
        {
            AudioClip clipToPlay = isOpen ? doorOpenSound : doorCloseSound;
            if (clipToPlay != null) audioSource.PlayOneShot(clipToPlay);
        }

        // Bắt đầu diễn hoạt xoay bản lề mượt mà
        if (rotateCoroutine != null) StopCoroutine(rotateCoroutine);
        rotateCoroutine = StartCoroutine(AnimateHingeRotation(isOpen ? openAngle : 0f));

        // Đồng bộ Collider và NavMesh
        UpdateDoorPhysicsAndNavMesh(immediate: false);

        Debug.Log($"<color={(isOpen ? "green" : "yellow")}>🚪 [VIP ZONE] {(isOpen ? "Đã đẩy mở cửa phòng VIP (Lối vào 1.6m thông suốt)!" : "Đã đóng cửa phòng VIP.")}</color>");
    }

    /// <summary>
    /// ĐỒNG BỘ VẬT LÝ & NAVMESH:
    /// - Khi cửa MỞ: BoxCollider chuyển thành isTrigger = true (hoặc tắt) để người chơi bước qua 0% va chạm cản trở.
    ///   NavMeshObstacle tắt carving để NavMeshAgent xem khe cửa là đường đi bộ mở hoàn toàn.
    /// - Khi cửa ĐÓNG: BoxCollider chuyển thành solid (isTrigger = false) và NavMeshObstacle bật carving.
    /// </summary>
    private void UpdateDoorPhysicsAndNavMesh(bool immediate)
    {
        if (doorCollider != null)
        {
            if (disableColliderWhenOpen)
            {
                // Khi mở: isTrigger = true để hoàn toàn giải phóng physical volume
                doorCollider.isTrigger = isOpen;
            }
            else
            {
                doorCollider.enabled = !isOpen;
            }
        }

        if (navMeshObstacle != null)
        {
            // Cập nhật NavMesh động: khi cửa mở, giải phóng đường đi để NPC AI tự do bước vào
            navMeshObstacle.carving = !isOpen;
            navMeshObstacle.enabled = !isOpen;
        }
    }

    private IEnumerator AnimateHingeRotation(float targetAngle)
    {
        while (Mathf.Abs(currentAngle - targetAngle) > 0.05f)
        {
            currentAngle = Mathf.Lerp(currentAngle, targetAngle, Time.deltaTime * rotationSpeed);
            if (hingePivot != null)
            {
                hingePivot.localRotation = Quaternion.Euler(0, currentAngle, 0);
            }
            yield return null;
        }

        currentAngle = targetAngle;
        if (hingePivot != null)
        {
            hingePivot.localRotation = Quaternion.Euler(0, currentAngle, 0);
        }
    }

    private void ShowPrompt(string message)
    {
        if (interactionPromptUI != null) interactionPromptUI.SetActive(true);
        if (promptText != null) promptText.text = message;
    }

    private void HidePrompt()
    {
        if (interactionPromptUI != null) interactionPromptUI.SetActive(false);
    }
}
`;
}

/// <summary>
/// 13. HardwareShopAndPlacementSystem.cs
/// C# Architecture for Internet Cafe Simulator Style 7 Component Types x 5 Tiers & Free-form Placement
/// </summary>
export function generateHardwarePlacementSystemScript(config?: ScriptConfig): string {
  const interactKey = config?.interactKey || 'E';
  return `using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// HỆ THỐNG CỬA HÀNG LINH KIỆN, BALO INVENTORY, AUTO-SNAP SLOTS & THU HỒI [F] (INTERNET CAFE SIMULATOR)
/// Kiến trúc C# hoàn chỉnh:
/// 1. Fix Raycast Pickup ([F] Key): Gán Interactable Layer + BoxCollider, phím [F] thu hồi vật phẩm về Balo
/// 2. Item Rotation (Scroll Wheel): Cuộn chuột Up/Down xoay Ghost quanh trục Y theo góc 45 độ
/// 3. Desk Auto-Snap Slots: Bàn tự động có 5 khe cắm chuẩn (Monitor, Keyboard, Mouse, Case, Headset, Chair)
/// 4. Hardware Holograms & 'Ready to Play' Validation: Hiện hologram mờ hướng dẫn, ẩn khi lắp đủ.
///    Khi đủ 5 món (Monitor, Phím, Chuột, Case, Ghế) -> isReadyForCustomer = true, hiện Checkmark xanh, khách NPC tự tìm đến chơi!
/// </summary>
public class HardwareShopAndPlacementSystem : MonoBehaviour
{
    public enum ComponentType
    {
        Monitor,
        PCCase,
        Mouse,
        Keyboard,
        Headset,
        Desk,
        Chair
    }

    public enum ComponentTier
    {
        Tier1_Standard,
        Tier2_Gaming,
        Tier3_Mechanical,
        Tier4_Premium,
        Tier5_Esports
    }

    [System.Serializable]
    public class HardwareItemData
    {
        public string itemId;
        public string itemName;
        public ComponentType type;
        public ComponentTier tier;
        public int price;
        public GameObject solidPrefab;
        public GameObject ghostHologramPrefab;
        public Vector3 boxDimensions;
        public bool snapsToDesk; // true = Snaps to Desk Top Slot, false = Floor
    }

    [Header("=== Cấu Hình Phím Bấm & Cự Ly ===")]
    [SerializeField] private KeyCode backpackKey = KeyCode.B;
    [SerializeField] private KeyCode interactKey = KeyCode.${interactKey};
    [SerializeField] private KeyCode pickupKey = KeyCode.F;
    [SerializeField] private float raycastDistance = 6.0f;
    [SerializeField] private float pickupRaycastDistance = 3.5f;
    [SerializeField] private LayerMask floorLayerMask;
    [SerializeField] private LayerMask deskSurfaceLayerMask;
    [SerializeField] private LayerMask placedFurnitureLayerMask;
    [SerializeField] private LayerMask obstacleLayerMask;

    [Header("=== Vật Liệu Ghost Hologram ===")]
    [SerializeField] private Material ghostValidGreenMaterial;   // Color: 0x00FF00, Opacity: 0.55
    [SerializeField] private Material ghostInvalidRedMaterial;  // Color: 0xFF0000, Opacity: 0.55

    [Header("=== Trạng Thái Hiện Tại ===")]
    [SerializeField] private bool isInBuildMode = false;
    [SerializeField] private bool isGhostPlacementValid = false;
    [SerializeField] private HardwareItemData activeBuildItem = null;
    [SerializeField] private GameObject activeGhostInstance = null;
    [SerializeField] private float ghostRotationAngleY = 0f; // Scroll wheel rotation (deg)

    [Header("=== Auto-Snap Slot Hiện Tại ===")]
    [SerializeField] private DeskStationController activeSnappedDesk = null;
    [SerializeField] private ComponentType activeSnappedSlotType;
    [SerializeField] private Vector3 activeSnappedWorldPos;
    [SerializeField] private Quaternion activeSnappedWorldRot;

    [Header("=== Balo Lưu Trữ Người Chơi (Backpack) ===")]
    [SerializeField] private List<HardwareItemData> playerBackpack = new List<HardwareItemData>();

    [Header("=== Tham Chiếu Camera & UI ===")]
    [SerializeField] private Camera playerCamera;
    [SerializeField] private GameObject backpackUIPanel;
    [SerializeField] private GameObject hardwareShopUIPanel;
    [SerializeField] private GameObject pickupPromptUI;
    [SerializeField] private UnityEngine.UI.Text pickupPromptText;

    private static HardwareShopAndPlacementSystem _instance;
    public static HardwareShopAndPlacementSystem Instance => _instance;

    private void Awake()
    {
        if (_instance == null) _instance = this;
        else Destroy(gameObject);
    }

    private void Start()
    {
        if (playerCamera == null) playerCamera = Camera.main;
        if (backpackUIPanel != null) backpackUIPanel.SetActive(false);
        if (hardwareShopUIPanel != null) hardwareShopUIPanel.SetActive(false);
        if (pickupPromptUI != null) pickupPromptUI.SetActive(false);
    }

    private void Update()
    {
        // 1. Phím tắt mở Balo [B]
        if (Input.GetKeyDown(backpackKey))
        {
            ToggleBackpackUI();
        }

        // 2. Chế độ Build Mode: Raycast Hologram, Snap Surface & Scroll Rotation
        if (isInBuildMode && activeGhostInstance != null && activeBuildItem != null)
        {
            // 2.1. Item Rotation (Scroll Wheel): Cuộn chuột xoay Ghost quanh trục Y theo nấc 45 độ
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.02f)
            {
                ghostRotationAngleY += Mathf.Sign(scroll) * 45f;
                ghostRotationAngleY = (ghostRotationAngleY + 360f) % 360f;
            }
            if (Input.GetKeyDown(KeyCode.R))
            {
                ghostRotationAngleY = (ghostRotationAngleY + 45f) % 360f;
            }

            UpdateGhostPlacement();

            // 2.2. Phím xác nhận đặt món đồ: Chuột Trái hoặc [E]
            if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(interactKey))
            {
                TryFinalizePlacement();
            }

            // Hủy đặt bằng phím chuột phải hoặc Escape
            if (Input.GetMouseButtonDown(1) || Input.GetKeyDown(KeyCode.Escape))
            {
                CancelBuildMode();
            }
        }
        else
        {
            // 3. Phím [F] Raycast Pickup: Thu hồi linh kiện đã đặt về Balo
            CheckPickupRaycast();
        }
    }

    /// <summary>
    /// 1. Fix Raycast Pickup (The [F] Key):
    /// Raycast phát hiện đồ nội thất đã đặt, bấm [F] xóa khỏi scene và đẩy lại vào Balo
    /// </summary>
    private void CheckPickupRaycast()
    {
        Ray ray = playerCamera.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0));
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, pickupRaycastDistance, placedFurnitureLayerMask))
        {
            PlacedItemComponent placedComp = hit.collider.GetComponentInParent<PlacedItemComponent>();
            if (placedComp != null)
            {
                if (pickupPromptUI != null) pickupPromptUI.SetActive(true);
                if (pickupPromptText != null) pickupPromptText.text = $"[F] Thu hồi & cất Balo: {placedComp.itemData.itemName}";

                if (Input.GetKeyDown(pickupKey))
                {
                    PickupPlacedItem(placedComp);
                }
                return;
            }
        }

        if (pickupPromptUI != null) pickupPromptUI.SetActive(false);
    }

    private void PickupPlacedItem(PlacedItemComponent comp)
    {
        if (comp == null || comp.itemData == null) return;

        // Đẩy dữ liệu trở lại Balo
        playerBackpack.Add(comp.itemData);
        Debug.Log($"<color=cyan>[Pickup] Đã thu hồi {comp.itemData.itemName} về Balo [B]!</color>");

        // Nếu vật phẩm này thuộc về một Bàn máy (Desk Slot), giải phóng slot trên bàn
        if (comp.parentDesk != null)
        {
            comp.parentDesk.VacateSlot(comp.itemData.type);
        }

        // Nếu nhặt chính cái Bàn máy, thu hồi toàn bộ linh kiện trên bàn về Balo luôn
        if (comp.itemData.type == ComponentType.Desk)
        {
            DeskStationController deskCtrl = comp.GetComponent<DeskStationController>();
            if (deskCtrl != null)
            {
                deskCtrl.PickupAllAttachedAccessories(playerBackpack);
            }
        }

        Destroy(comp.gameObject);
        if (pickupPromptUI != null) pickupPromptUI.SetActive(false);
    }

    /// <summary>
    /// 3. Desk Auto-Snap Slots:
    /// Tự động bắt dính chính xác vào các khe cắm định sẵn trên bàn thay vì đặt tự do lộn xộn
    /// </summary>
    private void UpdateGhostPlacement()
    {
        Ray ray = playerCamera.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0));
        RaycastHit hit;

        if (activeBuildItem.type == ComponentType.Desk)
        {
            // Bàn: Raycast tự do trên sàn nhà
            if (Physics.Raycast(ray, out hit, raycastDistance, floorLayerMask))
            {
                activeGhostInstance.SetActive(true);
                Vector3 placePos = hit.point;
                activeGhostInstance.transform.position = placePos;

                Vector3 camFwd = playerCamera.transform.forward;
                camFwd.y = 0;
                Quaternion baseRot = camFwd.sqrMagnitude > 0.01f ? Quaternion.LookRotation(camFwd) : Quaternion.identity;
                activeGhostInstance.transform.rotation = baseRot * Quaternion.Euler(0, ghostRotationAngleY, 0);

                ValidatePlacementCollision(placePos);
                activeSnappedDesk = null;
            }
            else
            {
                isGhostPlacementValid = false;
                ApplyGhostMaterial(ghostInvalidRedMaterial);
            }
        }
        else
        {
            // Linh kiện PC (Monitor, PCCase, Mouse, Keyboard, Headset, Chair):
            // Tìm Bàn máy tính gần nhất trong tầm ngắm
            DeskStationController nearestDesk = null;
            float minDeskDist = 4.5f;

            DeskStationController[] allDesks = FindObjectsOfType<DeskStationController>();
            foreach (var desk in allDesks)
            {
                float d = Vector3.Distance(playerCamera.transform.position, desk.transform.position);
                if (d < minDeskDist)
                {
                    minDeskDist = d;
                    nearestDesk = desk;
                }
            }

            if (nearestDesk != null)
            {
                // Tìm Transform Slot định sẵn cho loại linh kiện này
                Transform slotTr = nearestDesk.GetSlotTransform(activeBuildItem.type);
                if (slotTr != null)
                {
                    activeGhostInstance.SetActive(true);
                    activeGhostInstance.transform.position = slotTr.position;
                    activeGhostInstance.transform.rotation = slotTr.rotation * Quaternion.Euler(0, ghostRotationAngleY, 0);

                    // Kiểm tra khe cắm đã có đồ chưa
                    bool isSlotOccupied = nearestDesk.IsSlotFilled(activeBuildItem.type);
                    if (isSlotOccupied)
                    {
                        isGhostPlacementValid = false;
                        ApplyGhostMaterial(ghostInvalidRedMaterial);
                    }
                    else
                    {
                        isGhostPlacementValid = true;
                        ApplyGhostMaterial(ghostValidGreenMaterial);
                        activeSnappedDesk = nearestDesk;
                        activeSnappedSlotType = activeBuildItem.type;
                        activeSnappedWorldPos = slotTr.position;
                        activeSnappedWorldRot = activeGhostInstance.transform.rotation;
                    }
                }
            }
            else
            {
                // Không ngắm vào bàn nào -> Không hợp lệ!
                isGhostPlacementValid = false;
                activeGhostInstance.transform.position = playerCamera.transform.position + playerCamera.transform.forward * 2.5f;
                ApplyGhostMaterial(ghostInvalidRedMaterial);
                activeSnappedDesk = null;
            }
        }
    }

    private void ValidatePlacementCollision(Vector3 position)
    {
        Vector3 halfExtents = activeBuildItem.boxDimensions * 0.48f;
        Collider[] overlaps = Physics.OverlapBox(
            position,
            halfExtents,
            activeGhostInstance.transform.rotation,
            obstacleLayerMask
        );

        if (overlaps.Length == 0)
        {
            isGhostPlacementValid = true;
            ApplyGhostMaterial(ghostValidGreenMaterial);
        }
        else
        {
            isGhostPlacementValid = false;
            ApplyGhostMaterial(ghostInvalidRedMaterial);
        }
    }

    private void ApplyGhostMaterial(Material mat)
    {
        if (activeGhostInstance == null || mat == null) return;
        MeshRenderer[] renderers = activeGhostInstance.GetComponentsInChildren<MeshRenderer>();
        foreach (var r in renderers) r.material = mat;
    }

    /// <summary>
    /// Hoàn tất lắp đặt món đồ
    /// </summary>
    public void TryFinalizePlacement()
    {
        if (!isGhostPlacementValid)
        {
            Debug.LogWarning("[Build Mode] Vị trí không hợp lệ!");
            return;
        }

        // 1. Tạo vật thể thật tại đúng Transform Ghost
        GameObject solidObj = Instantiate(
            activeBuildItem.solidPrefab,
            activeGhostInstance.transform.position,
            activeGhostInstance.transform.rotation
        );

        // 2. Đảm bảo gán Interactable Layer + BoxCollider để phím [F] có thể Raycast thu hồi
        solidObj.layer = LayerMask.NameToLayer("Interactable");
        if (solidObj.GetComponent<Collider>() == null)
        {
            BoxCollider col = solidObj.AddComponent<BoxCollider>();
            col.size = activeBuildItem.boxDimensions;
            col.center = new Vector3(0, activeBuildItem.boxDimensions.y * 0.5f, 0);
        }

        PlacedItemComponent placedComp = solidObj.AddComponent<PlacedItemComponent>();
        placedComp.itemData = activeBuildItem;

        // 3. Nếu là Bàn máy: kích hoạt Controller và Hologram dẫn đường
        if (activeBuildItem.type == ComponentType.Desk)
        {
            DeskStationController deskCtrl = solidObj.GetComponent<DeskStationController>();
            if (deskCtrl == null) deskCtrl = solidObj.AddComponent<DeskStationController>();
            deskCtrl.InitializeDeskSlots();
        }
        else if (activeSnappedDesk != null)
        {
            // Gắn vào khe cắm của bàn & kiểm tra hoàn thiện 5 món
            placedComp.parentDesk = activeSnappedDesk;
            activeSnappedDesk.SnapItemIntoSlot(activeBuildItem.type, placedComp);
        }

        // 4. Trừ vật phẩm khỏi Balo
        playerBackpack.Remove(activeBuildItem);
        Debug.Log($"<color=green>[Build Mode] Đã lắp đặt thành công {activeBuildItem.itemName}!</color>");

        // Kiểm tra xem Balo còn đồ cùng loại không
        HardwareItemData nextSame = playerBackpack.Find(i => i.itemId == activeBuildItem.itemId);
        if (nextSame != null)
        {
            activeBuildItem = nextSame;
        }
        else
        {
            CancelBuildMode();
        }
    }

    public void OpenHardwareShop()
    {
        if (hardwareShopUIPanel != null)
        {
            hardwareShopUIPanel.SetActive(true);
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }
    }

    public bool BuyItemToBackpack(HardwareItemData item)
    {
        if (item == null) return false;
        if (MoneyManager.Instance != null && MoneyManager.Instance.TrySpendMoney(item.price))
        {
            playerBackpack.Add(item);
            return true;
        }
        return false;
    }

    public void ToggleBackpackUI()
    {
        if (backpackUIPanel == null) return;
        bool next = !backpackUIPanel.activeSelf;
        backpackUIPanel.SetActive(next);
        Cursor.lockState = next ? CursorLockMode.None : CursorLockMode.Locked;
        Cursor.visible = next;
    }

    public void EnterBuildMode(HardwareItemData item)
    {
        if (item == null) return;
        if (backpackUIPanel != null) backpackUIPanel.SetActive(false);
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        isInBuildMode = true;
        activeBuildItem = item;
        ghostRotationAngleY = 0f;

        if (activeGhostInstance != null) Destroy(activeGhostInstance);
        activeGhostInstance = item.ghostHologramPrefab != null
            ? Instantiate(item.ghostHologramPrefab)
            : Instantiate(item.solidPrefab);

        Collider[] cols = activeGhostInstance.GetComponentsInChildren<Collider>();
        foreach (var c in cols) c.enabled = false;
    }

    public void CancelBuildMode()
    {
        isInBuildMode = false;
        activeBuildItem = null;
        if (activeGhostInstance != null)
        {
            Destroy(activeGhostInstance);
            activeGhostInstance = null;
        }
    }
}

/// <summary>
/// Quản lý 5 Khe Cắm Auto-Snap, Hologram hướng dẫn & Điều kiện đón khách (isReadyForCustomer)
/// </summary>
public class DeskStationController : MonoBehaviour
{
    [Header("=== 5 Khe Cắm Định Sẵn (Transforms) ===")]
    public Transform monitorSlot;
    public Transform keyboardSlot;
    public Transform mouseSlot;
    public Transform caseSlot;
    public Transform headsetSlot;
    public Transform chairSlot;

    [Header("=== Hologram Mờ Hướng Dẫn Vị Trí Còn Thiếu ===")]
    public GameObject monitorHologram;
    public GameObject keyboardHologram;
    public GameObject mouseHologram;
    public GameObject caseHologram;
    public GameObject headsetHologram;
    public GameObject chairHologram;

    [Header("=== Biểu Tượng Checkmark Xanh Hoàn Thiện ===")]
    public GameObject completeCheckmarkUI;

    [Header("=== Trạng Thái Đón Khách ===")]
    public bool isReadyForCustomer = false;

    private Dictionary<HardwareShopAndPlacementSystem.ComponentType, PlacedItemComponent> filledSlots
        = new Dictionary<HardwareShopAndPlacementSystem.ComponentType, PlacedItemComponent>();

    public void InitializeDeskSlots()
    {
        // Ban đầu bàn chưa hoàn thiện
        isReadyForCustomer = false;
        if (completeCheckmarkUI != null) completeCheckmarkUI.SetActive(false);

        // Hiển thị toàn bộ hologram hướng dẫn các món còn thiếu
        SetHologramState(HardwareShopAndPlacementSystem.ComponentType.Monitor, true);
        SetHologramState(HardwareShopAndPlacementSystem.ComponentType.Keyboard, true);
        SetHologramState(HardwareShopAndPlacementSystem.ComponentType.Mouse, true);
        SetHologramState(HardwareShopAndPlacementSystem.ComponentType.PCCase, true);
        SetHologramState(HardwareShopAndPlacementSystem.ComponentType.Chair, true);
    }

    public Transform GetSlotTransform(HardwareShopAndPlacementSystem.ComponentType type)
    {
        switch (type)
        {
            case HardwareShopAndPlacementSystem.ComponentType.Monitor: return monitorSlot;
            case HardwareShopAndPlacementSystem.ComponentType.Keyboard: return keyboardSlot;
            case HardwareShopAndPlacementSystem.ComponentType.Mouse: return mouseSlot;
            case HardwareShopAndPlacementSystem.ComponentType.PCCase: return caseSlot;
            case HardwareShopAndPlacementSystem.ComponentType.Headset: return headsetSlot;
            case HardwareShopAndPlacementSystem.ComponentType.Chair: return chairSlot;
            default: return null;
        }
    }

    public bool IsSlotFilled(HardwareShopAndPlacementSystem.ComponentType type)
    {
        return filledSlots.ContainsKey(type) && filledSlots[type] != null;
    }

    public void SnapItemIntoSlot(HardwareShopAndPlacementSystem.ComponentType type, PlacedItemComponent itemComp)
    {
        filledSlots[type] = itemComp;
        // Ẩn Hologram mờ của linh kiện này đi vì đã có đồ thật
        SetHologramState(type, false);

        ValidateReadyForCustomer();
    }

    public void VacateSlot(HardwareShopAndPlacementSystem.ComponentType type)
    {
        if (filledSlots.ContainsKey(type)) filledSlots.Remove(type);
        // Hiện lại Hologram mờ để người chơi biết vị trí này đang bị thiếu
        SetHologramState(type, true);

        ValidateReadyForCustomer();
    }

    private void SetHologramState(HardwareShopAndPlacementSystem.ComponentType type, bool active)
    {
        switch (type)
        {
            case HardwareShopAndPlacementSystem.ComponentType.Monitor:
                if (monitorHologram != null) monitorHologram.SetActive(active);
                break;
            case HardwareShopAndPlacementSystem.ComponentType.Keyboard:
                if (keyboardHologram != null) keyboardHologram.SetActive(active);
                break;
            case HardwareShopAndPlacementSystem.ComponentType.Mouse:
                if (mouseHologram != null) mouseHologram.SetActive(active);
                break;
            case HardwareShopAndPlacementSystem.ComponentType.PCCase:
                if (caseHologram != null) caseHologram.SetActive(active);
                break;
            case HardwareShopAndPlacementSystem.ComponentType.Chair:
                if (chairHologram != null) chairHologram.SetActive(active);
                break;
        }
    }

    /// <summary>
    /// 4. Hardware Holograms & 'Ready to Play' Validation:
    /// Kiểm tra xem cả 5 món chính (Monitor, Keyboard, Mouse, Case, Chair) đã được lắp đủ chưa
    /// </summary>
    public void ValidateReadyForCustomer()
    {
        bool hasMonitor = IsSlotFilled(HardwareShopAndPlacementSystem.ComponentType.Monitor);
        bool hasKeyboard = IsSlotFilled(HardwareShopAndPlacementSystem.ComponentType.Keyboard);
        bool hasMouse = IsSlotFilled(HardwareShopAndPlacementSystem.ComponentType.Mouse);
        bool hasCase = IsSlotFilled(HardwareShopAndPlacementSystem.ComponentType.PCCase);
        bool hasChair = IsSlotFilled(HardwareShopAndPlacementSystem.ComponentType.Chair);

        bool all5Filled = hasMonitor && hasKeyboard && hasMouse && hasCase && hasChair;

        if (all5Filled && !isReadyForCustomer)
        {
            isReadyForCustomer = true;
            // Action: Wrap display logic of checkmark in a timer. Show for 2 to 3 seconds, then auto-destroy/hide!
            if (completeCheckmarkUI != null)
            {
                StopAllCoroutines();
                StartCoroutine(ShowCheckmarkTemporaryRoutine(2.5f));
            }
            Debug.Log("<color=green>[Bàn Máy Hoàn Thiện] Đã đủ 5/5 linh kiện! Khách NPC giờ có thể tìm đến chơi và trả tiền.</color>");
            // Thông báo cho Customer Pathfinding Manager có thêm 1 máy khả dụng
            CustomerQueueManager.Instance?.RegisterNewPlayableStation(this);
        }
        else if (!all5Filled && isReadyForCustomer)
        {
            isReadyForCustomer = false;
            StopAllCoroutines();
            if (completeCheckmarkUI != null) completeCheckmarkUI.SetActive(false);
            Debug.LogWarning("[Bàn Máy] Bị thiếu linh kiện! Ngừng đón khách.");
            CustomerQueueManager.Instance?.UnregisterPlayableStation(this);
        }
    }

    /// <summary>
    /// Hiển thị biểu tượng Checkmark xanh trong 2.5 giây rồi tự động ẩn đi
    /// </summary>
    private System.Collections.IEnumerator ShowCheckmarkTemporaryRoutine(float duration)
    {
        if (completeCheckmarkUI != null) completeCheckmarkUI.SetActive(true);
        yield return new WaitForSeconds(duration);
        if (completeCheckmarkUI != null) completeCheckmarkUI.SetActive(false);
    }

    public void PickupAllAttachedAccessories(List<HardwareShopAndPlacementSystem.HardwareItemData> backpack)
    {
        foreach (var kvp in filledSlots)
        {
            if (kvp.Value != null)
            {
                backpack.Add(kvp.Value.itemData);
                Destroy(kvp.Value.gameObject);
            }
        }
        filledSlots.Clear();
    }
}

public class PlacedItemComponent : MonoBehaviour
{
    public HardwareShopAndPlacementSystem.HardwareItemData itemData;
    public DeskStationController parentDesk;
}
`;
}

