import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Smile,
  Frown,
  Meh,
  Heart,
  Flame,
  Star,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Monitor,
  Layers,
  Wifi,
  Wind,
  Coffee,
  DollarSign,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

export interface CustomerSatisfactionBreakdown {
  id: string;
  customerName: string;
  customerType: 'Học Sinh' | 'Game Thủ' | 'Khách VIP';
  stationName: string;
  baseScore: number;
  computerQualityScore: number;
  ramLevel: number;
  vgaLevel: number;
  monitorLevel: number;
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
  reviewComment: string;
  timestamp: string;
}

export interface SatisfactionTrendPoint {
  time: string;
  timestamp: number;
  avgScore: number;
  sandboxScore: number;
  customerCount: number;
  activeAverage: number | null;
  tier: string;
  emoji: string;
}

const generateInitialTrendData = (): SatisfactionTrendPoint[] => {
  const points: SatisfactionTrendPoint[] = [];
  const now = Date.now();
  // Realistic initial timeline trajectory
  const sampleScores = [70.0, 71.5, 73.0, 72.0, 75.5, 77.0, 76.2, 79.8, 81.0, 83.5, 82.0, 84.5];
  for (let i = 12; i >= 1; i--) {
    const timeDate = new Date(now - i * 3500);
    const score = sampleScores[12 - i] ?? 75;
    points.push({
      time: timeDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp: timeDate.getTime(),
      avgScore: score,
      sandboxScore: 82,
      customerCount: Math.min(6, Math.max(1, Math.floor(score / 16))),
      activeAverage: score,
      tier: score >= 80 ? 'Very Happy' : score >= 60 ? 'Happy' : 'Normal',
      emoji: score >= 80 ? '😍' : score >= 60 ? '🙂' : '😐',
    });
  }
  return points;
};

interface SatisfactionDashboardProps {
  activeCustomers?: CustomerSatisfactionBreakdown[];
  recentReviews?: CustomerSatisfactionBreakdown[];
  onApplyEnvironmentChange?: (settings: {
    internetPlan: 'gigabit' | 'normal' | 'laggy';
    acEnabled: boolean;
    foodService: boolean;
    pricingTier: 'cheap' | 'standard' | 'expensive';
  }) => void;
}

export const SatisfactionDashboard: React.FC<SatisfactionDashboardProps> = ({
  activeCustomers = [],
  recentReviews = [],
}) => {
  // Interactive Formula Sandbox state
  const [ramLevel, setRamLevel] = useState<number>(3);
  const [vgaLevel, setVgaLevel] = useState<number>(4);
  const [monitorLevel, setMonitorLevel] = useState<number>(2);
  const [priceTier, setPriceTier] = useState<'cheap' | 'standard' | 'expensive'>('standard');
  const [hasWaited, setHasWaited] = useState<boolean>(false);
  const [internetQuality, setInternetQuality] = useState<'gigabit' | 'normal' | 'laggy'>('gigabit');
  const [acEnabled, setAcEnabled] = useState<boolean>(true);
  const [foodServed, setFoodServed] = useState<boolean>(true);

  // Formula Calculations:
  // Base: 70
  const baseScore = 70;
  // RAM: L1=+2, L2=+4, L3=+6, L4=+8, L5=+10
  const ramPoints = ramLevel * 2;
  // VGA: L1=+3, L2=+6, L3=+9, L4=+12, L5=+15
  const vgaPoints = vgaLevel * 3;
  // Monitor: L1=+2, L2=+4, L3=+6, L4=+8, L5=+10
  const monitorPoints = monitorLevel * 2;
  const computerQuality = ramPoints + vgaPoints + monitorPoints;

  // Price factor: cheap = +10, standard = +5, expensive = -10
  const priceScore = priceTier === 'cheap' ? 10 : priceTier === 'standard' ? 5 : -10;

  // Wait time penalty: -10 if waited in queue
  const waitPenalty = hasWaited ? -10 : 0;

  // Internet: gigabit = +10, normal = +5, laggy = -15
  const internetScore = internetQuality === 'gigabit' ? 10 : internetQuality === 'normal' ? 5 : -15;

  // AC: +8 if on, -10 if off
  const acScore = acEnabled ? 8 : -10;

  // Food: +10 if served, 0 if not
  const foodScore = foodServed ? 10 : 0;

  // Final Score Clamped 0-100
  const rawSum = baseScore + computerQuality + priceScore + waitPenalty + internetScore + acScore + foodScore;
  const finalScore = Math.max(0, Math.min(100, rawSum));

  // Determine Tier
  let tierInfo = {
    tier: 'VeryHappy',
    label: 'Very Happy',
    emoji: '😍',
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    stars: 5,
    returnChance: 95,
    desc: 'Khách cực kỳ hài lòng, đánh giá 5 sao tuyệt đối và chắc chắn sẽ quay lại quán!',
  };

  if (finalScore >= 80) {
    tierInfo = {
      tier: 'VeryHappy',
      label: 'Very Happy',
      emoji: '😍',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      stars: 5,
      returnChance: 95,
      desc: 'Khách cực kỳ hài lòng, đánh giá 5 sao tuyệt đối và có 95% tỷ lệ quay lại!',
    };
  } else if (finalScore >= 60) {
    tierInfo = {
      tier: 'Happy',
      label: 'Happy',
      emoji: '🙂',
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      stars: 4,
      returnChance: 75,
      desc: 'Khách hài lòng với trải nghiệm chơi net, cho 4 sao và 75% sẽ quay lại.',
    };
  } else if (finalScore >= 40) {
    tierInfo = {
      tier: 'Normal',
      label: 'Normal',
      emoji: '😐',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      stars: 3,
      returnChance: 45,
      desc: 'Trải nghiệm bình thường, 3 sao, tỷ lệ quay lại trung bình 45%.',
    };
  } else if (finalScore >= 20) {
    tierInfo = {
      tier: 'Unhappy',
      label: 'Unhappy',
      emoji: '😕',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      stars: 2,
      returnChance: 15,
      desc: 'Khách cảm thấy không thoải mái, cho 2 sao và nguy cơ cao không quay lại.',
    };
  } else {
    tierInfo = {
      tier: 'VeryUnhappy',
      label: 'Very Unhappy',
      emoji: '😡',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      stars: 1,
      returnChance: 2,
      desc: 'Khách tức giận, đánh giá 1 sao và bỏ đi, hầu như không bao giờ quay lại quán!',
    };
  }

  // Real-time Trend Chart State (Recharts)
  const [trendHistory, setTrendHistory] = useState<SatisfactionTrendPoint[]>(() => generateInitialTrendData());
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [showSandboxLine, setShowSandboxLine] = useState<boolean>(true);
  const [showReferenceLines, setShowReferenceLines] = useState<boolean>(true);
  const [streamSpeedMs, setStreamSpeedMs] = useState<number>(3000);

  const activeCustomersRef = useRef(activeCustomers);
  activeCustomersRef.current = activeCustomers;

  const finalScoreRef = useRef(finalScore);
  finalScoreRef.current = finalScore;

  // Real-time interval effect: updates satisfaction history every 3s
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setTrendHistory(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const currentCustomers = activeCustomersRef.current;
        const currentFinal = finalScoreRef.current;

        let baseValue = currentFinal;
        let activeAvg: number | null = null;
        if (currentCustomers.length > 0) {
          const sum = currentCustomers.reduce((acc, c) => acc + c.finalScore, 0);
          activeAvg = Math.round((sum / currentCustomers.length) * 10) / 10;
          baseValue = activeAvg;
        }

        // Add subtle organic micro-jitter (+/- 0.8 points) to emulate live customer reactions
        const jitter = (Math.random() - 0.48) * 1.6;
        const newScore = Math.max(0, Math.min(100, Math.round((baseValue + jitter) * 10) / 10));

        const newPoint: SatisfactionTrendPoint = {
          time: timeStr,
          timestamp: Date.now(),
          avgScore: newScore,
          sandboxScore: currentFinal,
          customerCount: currentCustomers.length,
          activeAverage: activeAvg,
          tier:
            newScore >= 80
              ? 'Very Happy'
              : newScore >= 60
              ? 'Happy'
              : newScore >= 40
              ? 'Normal'
              : newScore >= 20
              ? 'Unhappy'
              : 'Very Unhappy',
          emoji:
            newScore >= 80 ? '😍' : newScore >= 60 ? '🙂' : newScore >= 40 ? '😐' : newScore >= 20 ? '😕' : '😡',
        };

        const updated = [...prev, newPoint];
        if (updated.length > 25) {
          return updated.slice(updated.length - 25);
        }
        return updated;
      });
    }, streamSpeedMs);

    return () => clearInterval(interval);
  }, [isLiveStreaming, streamSpeedMs]);

  // Quick action: simulate customer mood burst / review spike
  const triggerSimulationSurge = useCallback((delta: number) => {
    setTrendHistory(prev => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const lastScore = prev.length > 0 ? prev[prev.length - 1].avgScore : finalScore;
      const targetScore = Math.max(0, Math.min(100, Math.round((lastScore + delta) * 10) / 10));
      const newPoint: SatisfactionTrendPoint = {
        time: timeStr,
        timestamp: Date.now(),
        avgScore: targetScore,
        sandboxScore: finalScore,
        customerCount: activeCustomers.length > 0 ? activeCustomers.length + (delta > 0 ? 1 : 0) : 3,
        activeAverage: targetScore,
        tier:
          targetScore >= 80
            ? 'Very Happy'
            : targetScore >= 60
            ? 'Happy'
            : targetScore >= 40
            ? 'Normal'
            : targetScore >= 20
            ? 'Unhappy'
            : 'Very Unhappy',
        emoji:
          targetScore >= 80 ? '😍' : targetScore >= 60 ? '🙂' : targetScore >= 40 ? '😐' : targetScore >= 20 ? '😕' : '😡',
      };
      const updated = [...prev, newPoint];
      return updated.length > 25 ? updated.slice(updated.length - 25) : updated;
    });
  }, [finalScore, activeCustomers.length]);

  const resetTrendHistory = useCallback(() => {
    setTrendHistory(generateInitialTrendData());
  }, []);

  // Summary Metrics for the chart
  const latestTrendPoint = trendHistory[trendHistory.length - 1];
  const firstTrendPoint = trendHistory[0];
  const currentAvgScore = latestTrendPoint ? latestTrendPoint.avgScore : finalScore;
  const trendDelta = latestTrendPoint && firstTrendPoint
    ? Math.round((latestTrendPoint.avgScore - firstTrendPoint.avgScore) * 10) / 10
    : 0;
  const peakScore = trendHistory.length > 0 ? Math.max(...trendHistory.map(p => p.avgScore)) : finalScore;
  const minScore = trendHistory.length > 0 ? Math.min(...trendHistory.map(p => p.avgScore)) : finalScore;
  const aboveBasePercentage = Math.round(
    (trendHistory.filter(p => p.avgScore >= 70).length / (trendHistory.length || 1)) * 100
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Smile className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ Thống Mức Độ Hài Lòng Khách Hàng (Customer Satisfaction)</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Mô Hình Điểm Số Khởi Điểm 70 &amp; Đánh Giá Sao Chuẩn
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Mỗi khách hàng bước vào quán khởi đầu với <strong className="text-emerald-400">70 điểm</strong>. Trải nghiệm tại quán
            (cấu hình máy RAM/VGA/Màn hình, giá thuê, hàng đợi, mạng internet, điều hòa, đồ ăn) sẽ cộng hoặc trừ điểm để ra{' '}
            <strong className="text-white">FINAL SATISFACTION (0 - 100)</strong>, quyết định số sao đánh giá và tỷ lệ quay lại!
          </p>
        </div>
      </div>

      {/* 2. 5 TIERS REFERENCE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            range: '80 - 100',
            name: 'Very Happy',
            emoji: '😍',
            stars: 5,
            chance: '95%',
            color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
            desc: 'Đánh giá 5 sao, rất dễ quay lại',
          },
          {
            range: '60 - 79',
            name: 'Happy',
            emoji: '🙂',
            stars: 4,
            chance: '75%',
            color: 'border-sky-500/40 bg-sky-950/20 text-sky-300',
            desc: 'Đánh giá 4 sao, có khả năng quay lại',
          },
          {
            range: '40 - 59',
            name: 'Normal',
            emoji: '😐',
            stars: 3,
            chance: '45%',
            color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
            desc: 'Đánh giá 3 sao, trung bình',
          },
          {
            range: '20 - 39',
            name: 'Unhappy',
            emoji: '😕',
            stars: 2,
            chance: '15%',
            color: 'border-orange-500/40 bg-orange-950/20 text-orange-300',
            desc: 'Đánh giá 2 sao, thất vọng',
          },
          {
            range: '0 - 19',
            name: 'Very Unhappy',
            emoji: '😡',
            stars: 1,
            chance: '2%',
            color: 'border-rose-500/40 bg-rose-950/20 text-rose-300',
            desc: 'Đánh giá 1 sao, tức giận bỏ về',
          },
        ].map(item => (
          <div
            key={item.name}
            className={`rounded-xl border p-4 transition-all hover:scale-[1.02] flex flex-col justify-between ${item.color}`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-200">
                  {item.range} đ
                </span>
              </div>
              <div className="font-bold text-sm text-white">{item.name}</div>
              <div className="text-xs opacity-80 mt-1">{item.desc}</div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
              <span className="text-amber-400">{'★'.repeat(item.stars)}</span>
              <span className="text-[11px] text-slate-400">Quay lại: {item.chance}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. REAL-TIME SATISFACTION TREND LINE CHART (RECHARTS) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Header with Title and Control Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <span>Biểu Đồ Xu Hướng Điểm Hài Lòng Trung Bình (Real-Time Trend)</span>
              </h3>
              {/* Pulse status badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <span className="relative flex h-2 w-2">
                  {isLiveStreaming && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isLiveStreaming ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                  />
                </span>
                <span>{isLiveStreaming ? 'Live (3s/nhịp)' : 'Đã Tạm Dừng'}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Trực quan hóa diễn biến điểm trung bình của khách hàng theo thời gian thực (Base 70 &rarr; 0-100), cập nhật cùng lúc với cấu hình máy và khách trong quán.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isLiveStreaming
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
              title={isLiveStreaming ? 'Tạm dừng ghi nhận' : 'Tiếp tục ghi nhận thời gian thực'}
            >
              {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLiveStreaming ? 'Tạm Dừng' : 'Tiếp Tục'}</span>
            </button>

            <button
              onClick={() => triggerSimulationSurge(5)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all"
              title="Mô phỏng đợt khách mới đánh giá hài lòng (+5 điểm)"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>+Đợt Khách Mới (+5đ)</span>
            </button>

            <button
              onClick={() => triggerSimulationSurge(-6)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 flex items-center gap-1.5 transition-all"
              title="Mô phỏng sự cố mạng lag / chờ lâu (-6 điểm)"
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>-Sự Cố (-6đ)</span>
            </button>

            <button
              onClick={resetTrendHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-all border border-slate-700"
              title="Đặt lại chuỗi dữ liệu biểu đồ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Real-time KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Điểm TB Hiện Tại</span>
              <span className="text-base">{latestTrendPoint?.emoji ?? '🙂'}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {currentAvgScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
              <span
                className={`text-[11px] font-mono font-bold ml-auto flex items-center gap-0.5 ${
                  trendDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trendDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendDelta >= 0 ? `+${trendDelta}` : trendDelta}đ
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Xếp hạng:</span>
              <span className="font-semibold text-slate-200">{latestTrendPoint?.tier ?? 'Happy'}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Đỉnh &amp; Đáy Chuỗi Đo</span>
              <span className="text-xs font-mono text-amber-400">Biên độ</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Max:</span>{' '}
                <span className="text-base font-bold text-emerald-400">{peakScore}đ</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Min:</span>{' '}
                <span className="text-base font-bold text-amber-400">{minScore}đ</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Chênh lệch đỉnh-đáy:</span>
              <span className="font-mono text-slate-300 font-semibold">
                {(peakScore - minScore).toFixed(1)}đ
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Tỷ Lệ Đạt Chuẩn (&ge;70đ)</span>
              <span className="text-xs font-mono text-emerald-400">Base 70</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-sky-400">
                {aboveBasePercentage}%
              </span>
              <span className="text-xs text-slate-500 font-mono">mẫu đạt</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${aboveBasePercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Khách &amp; Cấu Hình Lab</span>
              <Cpu className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <div className="mt-1 flex items-baseline justify-between font-mono">
              <div>
                <span className="text-[10px] text-slate-500">Khách live:</span>{' '}
                <span className="text-base font-bold text-white">{activeCustomers.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Lab:</span>{' '}
                <span className="text-base font-bold text-pink-400">{finalScore}đ</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Tổng số mẫu ghi:</span>
              <span className="font-mono text-slate-300 font-semibold">{trendHistory.length} nhịp</span>
            </div>
          </div>
        </div>

        {/* Display Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showSandboxLine}
                onChange={e => setShowSandboxLine(e.target.checked)}
                className="accent-pink-500 rounded"
              />
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-0.5 bg-pink-500 inline-block rounded" />
                Đường Điểm Cấu Hình Lab ({finalScore}đ)
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showReferenceLines}
                onChange={e => setShowReferenceLines(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block rounded" />
                Mốc Chuẩn (Base 70đ &amp; Mục Tiêu 80đ)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>Tốc độ quét:</span>
            <div className="flex items-center gap-1">
              {[
                { label: '1.5s', ms: 1500 },
                { label: '3s', ms: 3000 },
                { label: '5s', ms: 5000 },
              ].map(opt => (
                <button
                  key={opt.ms}
                  onClick={() => setStreamSpeedMs(opt.ms)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    streamSpeedMs === opt.ms
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recharts LineChart */}
        <div className="w-full h-72 sm:h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendHistory}
              margin={{ top: 12, right: 28, left: -14, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#475569' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 70, 80, 100]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#475569' }}
                unit="đ"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as SatisfactionTrendPoint;
                    return (
                      <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[210px] pointer-events-none">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                          <span className="font-mono text-[11px] flex items-center gap-1 text-slate-300">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            {data.time}
                          </span>
                          <span className="text-base">{data.emoji}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Điểm TB Hiện Tại:</span>
                            <span className="font-mono font-black text-emerald-400 text-sm">
                              {data.avgScore} đ
                            </span>
                          </div>
                          {showSandboxLine && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Điểm Cấu Hình Lab:</span>
                              <span className="font-mono font-bold text-pink-400">
                                {data.sandboxScore} đ
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Khách Đang Chơi:</span>
                            <span className="font-mono font-bold text-sky-400">
                              {data.customerCount} khách
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">So Với Base 70:</span>
                            <span
                              className={`font-mono font-bold ${
                                data.avgScore >= 70 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {data.avgScore >= 70
                                ? `+${(data.avgScore - 70).toFixed(1)}`
                                : (data.avgScore - 70).toFixed(1)}{' '}
                              đ
                            </span>
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Trạng Thái:</span>
                          <span
                            className={`font-semibold ${
                              data.avgScore >= 80
                                ? 'text-emerald-400'
                                : data.avgScore >= 60
                                ? 'text-sky-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {data.tier}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} iconType="circle" />

              {showReferenceLines && (
                <>
                  <ReferenceLine
                    y={70}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Base 70đ',
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                  <ReferenceLine
                    y={80}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Chuẩn 5⭐ (80đ)',
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                </>
              )}

              <Line
                type="monotone"
                dataKey="avgScore"
                name="Điểm Hài Lòng Trung Bình (Live)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 2.5, fill: '#10b981', stroke: '#020617', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />

              {showSandboxLine && (
                <Line
                  type="monotone"
                  dataKey="sandboxScore"
                  name="Điểm Cấu Hình Lab (Sandbox)"
                  stroke="#ec4899"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer info note */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>
              Mỗi khách vào quán bắt đầu với <strong>70đ</strong>. Điểm trung bình duy trì trên <strong>80đ (Very Happy)</strong> giúp kích hoạt hiệu ứng quán đông khách và đánh giá 5 sao.
            </span>
          </div>
          <span className="font-mono text-slate-500 whitespace-nowrap">
            Thư viện: recharts ^2.15 / react-19
          </span>
        </div>
      </div>

      {/* 4. INTERACTIVE FORMULA CALCULATOR SANDBOX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <span>Trình Tính Toán &amp; Thử Nghiệm Điểm Số Hài Lòng</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Thay đổi các thông số cấu hình và môi trường để xem điểm Final Satisfaction thay đổi tức thì
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              Khởi điểm: 70đ
            </div>
          </div>

          {/* Machine Quality Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-sky-400" />
                1. Chất Lượng Linh Kiện Máy Tính (Computer Quality Score)
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                +{computerQuality} Điểm (RAM +{ramPoints}, VGA +{vgaPoints}, Màn +{monitorPoints})
              </span>
            </div>

            {/* RAM Slider */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Bộ nhớ RAM (Cấp {ramLevel}):</span>
                <span className="font-mono text-emerald-400 font-bold">
                  Level {ramLevel} &times; 2 = +{ramPoints} điểm
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={ramLevel}
                onChange={e => setRamLevel(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Lvl 1 (+2đ)</span>
                <span>Lvl 2 (+4đ)</span>
                <span>Lvl 3 (+6đ)</span>
                <span>Lvl 4 (+8đ)</span>
                <span>Lvl 5 (+10đ)</span>
              </div>
            </div>

            {/* VGA Slider */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Card Đồ Họa VGA (Cấp {vgaLevel}):</span>
                <span className="font-mono text-purple-400 font-bold">
                  Level {vgaLevel} &times; 3 = +{vgaPoints} điểm
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={vgaLevel}
                onChange={e => setVgaLevel(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Lvl 1 (+3đ)</span>
                <span>Lvl 2 (+6đ)</span>
                <span>Lvl 3 (+9đ)</span>
                <span>Lvl 4 (+12đ)</span>
                <span>Lvl 5 (+15đ)</span>
              </div>
            </div>

            {/* Monitor Slider */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Màn Hình (Cấp {monitorLevel}):</span>
                <span className="font-mono text-cyan-400 font-bold">
                  Level {monitorLevel} &times; 2 = +{monitorPoints} điểm
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={monitorLevel}
                onChange={e => setMonitorLevel(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Lvl 1 (+2đ)</span>
                <span>Lvl 2 (+4đ)</span>
                <span>Lvl 3 (+6đ)</span>
                <span>Lvl 4 (+8đ)</span>
                <span>Lvl 5 (+10đ)</span>
              </div>
            </div>
          </div>

          {/* Pricing & Queue Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Price Tier */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>2. Giá Thuê Máy:</span>
                <span className="font-mono text-emerald-400">{priceScore >= 0 ? `+${priceScore}` : priceScore}đ</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['cheap', 'standard', 'expensive'] as const).map(tier => (
                  <button
                    key={tier}
                    onClick={() => setPriceTier(tier)}
                    className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                      priceTier === tier
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tier === 'cheap' ? 'Rẻ (+10)' : tier === 'standard' ? 'Chuẩn (+5)' : 'Đắt (-10)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Waiting Queue penalty */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>3. Thời Gian Chờ (Queue):</span>
                <span className="font-mono text-rose-400">{waitPenalty}đ</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setHasWaited(false)}
                  className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                    !hasWaited ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Có máy ngay (0đ)
                </button>
                <button
                  onClick={() => setHasWaited(true)}
                  className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                    hasWaited ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Chờ lâu (-10đ)
                </button>
              </div>
            </div>
          </div>

          {/* Shop Amenities: Internet, AC, Food */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Internet */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-sky-400" />
                  Mạng Net:
                </span>
                <span className="font-mono text-sky-400">{internetScore >= 0 ? `+${internetScore}` : internetScore}đ</span>
              </div>
              <select
                value={internetQuality}
                onChange={e => setInternetQuality(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-xs text-white"
              >
                <option value="gigabit">Cáp 1Gbps (+10đ)</option>
                <option value="normal">Mạng Thường (+5đ)</option>
                <option value="laggy">Mạng Lag (-15đ)</option>
              </select>
            </div>

            {/* Điều hòa */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  Điều Hòa:
                </span>
                <span className="font-mono text-teal-400">{acScore >= 0 ? `+${acScore}` : acScore}đ</span>
              </div>
              <button
                onClick={() => setAcEnabled(!acEnabled)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  acEnabled ? 'bg-teal-600 text-white' : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                }`}
              >
                {acEnabled ? 'Bật 22°C (+8đ)' : 'Tắt (Nóng -10đ)'}
              </button>
            </div>

            {/* Đồ ăn */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  Đồ Ăn/Uống:
                </span>
                <span className="font-mono text-amber-400">{foodScore > 0 ? `+${foodScore}` : '0'}đ</span>
              </div>
              <button
                onClick={() => setFoodServed(!foodServed)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  foodServed ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {foodServed ? 'Phục Vụ (+10đ)' : 'Không (0đ)'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-time Satisfaction Receipt & Tier Result (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Phiếu Trải Nghiệm Khách Hàng (Receipt)
              </span>
              <span className="text-2xl">{tierInfo.emoji}</span>
            </div>

            {/* Detailed math lines */}
            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Điểm khởi điểm (Base):</span>
                <span className="text-white font-bold">{baseScore}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">
                  Chất lượng máy (RAM {ramLevel}, VGA {vgaLevel}, Màn {monitorLevel}):
                </span>
                <span className="text-sky-400 font-bold">+{computerQuality}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Giá thuê máy:</span>
                <span className={priceScore >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {priceScore >= 0 ? `+${priceScore}` : priceScore}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Thời gian chờ (Wait Time):</span>
                <span className={waitPenalty < 0 ? 'text-rose-400 font-bold' : 'text-slate-500 font-bold'}>
                  {waitPenalty}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Chất lượng mạng Internet:</span>
                <span className={internetScore >= 0 ? 'text-sky-400 font-bold' : 'text-rose-400 font-bold'}>
                  {internetScore >= 0 ? `+${internetScore}` : internetScore}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Điều hòa nhiệt độ quán:</span>
                <span className={acScore >= 0 ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                  {acScore >= 0 ? `+${acScore}` : acScore}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Đồ ăn &amp; Nước giải khát:</span>
                <span className={foodScore > 0 ? 'text-amber-400 font-bold' : 'text-slate-500 font-bold'}>
                  {foodScore > 0 ? `+${foodScore}` : '+0'}
                </span>
              </div>

              {/* Total Final Score Big Display */}
              <div className="flex items-center justify-between pt-3 text-sm font-bold">
                <span className="text-white uppercase font-sans tracking-wide">TỔNG ĐIỂM (FINAL):</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {finalScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </span>
              </div>
            </div>

            {/* Tier Badge & Review Box */}
            <div className={`mt-5 p-4 rounded-xl border ${tierInfo.color} space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span className="text-xl">{tierInfo.emoji}</span>
                  <span>{tierInfo.label}</span>
                </div>
                <div className="flex text-amber-400 font-bold text-sm">
                  {'★'.repeat(tierInfo.stars)}
                  <span className="text-slate-600">{'★'.repeat(5 - tierInfo.stars)}</span>
                </div>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">{tierInfo.desc}</p>
              <div className="pt-2 border-t border-current/20 flex items-center justify-between text-xs font-semibold">
                <span>Tỷ lệ quay lại quán:</span>
                <span className="font-mono text-sm font-bold">{tierInfo.returnChance}%</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            💡 <strong>Quy luật Tycoon:</strong> Cấu hình máy tính cao kết hợp mạng Internet gigabit và điều hòa mát mẻ là chìa khóa để giữ điểm hài lòng luôn trên <strong>80đ (Very Happy 😍)</strong>, giúp quán luôn đông khách VIP và nhận đánh giá 5 sao!
          </div>
        </div>
      </div>

      {/* 5. REAL-TIME CUSTOMERS IN SHOP & WAITING QUEUE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Danh Sách Khách Hàng Đang Trong Quán (Live Satisfaction Tracker)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Dữ liệu được cập nhật thời gian thực từ trình mô phỏng 3D
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            Đang phục vụ: <span className="text-emerald-400 font-bold">{activeCustomers.length}</span> khách
          </div>
        </div>

        {activeCustomers.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Chưa có khách nào trong quán. Hãy bấm <strong>&quot;Gọi Khách&quot;</strong> hoặc đợi khách tự bước vào quán trong tab <strong>Mô Phỏng 3D</strong>!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeCustomers.map(cust => (
              <div
                key={cust.id}
                className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cust.emoji}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{cust.customerName}</div>
                      <div className="text-[10px] text-slate-400">
                        {cust.customerType} • {cust.stationName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-emerald-400">
                      {cust.finalScore} <span className="text-[10px] text-slate-400 font-normal">/100</span>
                    </div>
                    <div className="text-[11px] text-amber-400">{'★'.repeat(cust.stars)}</div>
                  </div>
                </div>

                {/* Score breakdown mini pills */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-400">
                    Máy: <span className="text-sky-400 font-bold">+{cust.computerQualityScore}đ</span>
                  </div>
                  <div className="text-slate-400">
                    Giá: <span className="text-emerald-400 font-bold">+{cust.priceScore}đ</span>
                  </div>
                  <div className="text-slate-400">
                    Chờ: <span className={cust.waitTimePenalty < 0 ? 'text-rose-400 font-bold' : 'text-slate-500 font-bold'}>{cust.waitTimePenalty}đ</span>
                  </div>
                  <div className="text-slate-400">
                    Mạng: <span className="text-sky-400 font-bold">+{cust.internetBonus}đ</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                  <span className="font-semibold text-slate-300">{cust.tierLabel}</span>
                  <span className="text-emerald-400 font-mono">Quay lại: {cust.returnChance}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. RECENT REVIEWS FEED */}
      {recentReviews.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Đánh Giá Khách Hàng Gần Đây (Customer Reviews)</span>
            </h3>
            <span className="text-xs text-slate-400">{recentReviews.length} lượt đánh giá</span>
          </div>

          <div className="space-y-3">
            {recentReviews.slice(0, 5).map(rev => (
              <div
                key={rev.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{rev.emoji}</span>
                    <span className="font-bold text-white">{rev.customerName}</span>
                    <span className="text-slate-500">({rev.customerType})</span>
                    <span className="text-amber-400 font-bold">{'★'.repeat(rev.stars)}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({rev.finalScore} điểm)</span>
                  </div>
                  <p className="text-slate-300 italic">&ldquo;{rev.reviewComment}&rdquo;</p>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  {rev.stationName} • {rev.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
