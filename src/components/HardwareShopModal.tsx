import React, { useState } from 'react';
import {
  HardwareItemDefinition,
  HardwareCategory,
  HARDWARE_CATALOG,
  TIER_NAMES,
  HardwareTier,
} from '../data/hardwareCatalog';
import {
  Monitor,
  Cpu,
  Mouse,
  Keyboard,
  Headphones,
  Table,
  Armchair,
  ShoppingBag,
  X,
  Check,
  Coins,
  Sparkles,
  Info,
} from 'lucide-react';

interface HardwareShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalFunds: number;
  onBuyItem: (item: HardwareItemDefinition) => boolean;
}

const CATEGORY_TABS: { key: HardwareCategory | 'All'; label: string; icon: React.ReactNode }[] = [
  { key: 'All', label: 'Tất Cả', icon: <ShoppingBag className="w-4 h-4" /> },
  { key: 'Monitor', label: 'Màn Hình', icon: <Monitor className="w-4 h-4" /> },
  { key: 'PCCase', label: 'Case PC', icon: <Cpu className="w-4 h-4" /> },
  { key: 'Mouse', label: 'Chuột', icon: <Mouse className="w-4 h-4" /> },
  { key: 'Keyboard', label: 'Bàn Phím', icon: <Keyboard className="w-4 h-4" /> },
  { key: 'Headset', label: 'Tai Nghe', icon: <Headphones className="w-4 h-4" /> },
  { key: 'Desk', label: 'Bàn Net', icon: <Table className="w-4 h-4" /> },
  { key: 'Chair', label: 'Ghế Gaming', icon: <Armchair className="w-4 h-4" /> },
];

const TIER_COLORS: Record<HardwareTier, { badge: string; border: string }> = {
  1: { badge: 'bg-slate-700 text-slate-200 border-slate-600', border: 'border-slate-700 hover:border-slate-500' },
  2: { badge: 'bg-sky-950 text-sky-300 border-sky-700', border: 'border-sky-800/60 hover:border-sky-500' },
  3: { badge: 'bg-purple-950 text-purple-300 border-purple-700', border: 'border-purple-800/60 hover:border-purple-500' },
  4: { badge: 'bg-amber-950 text-amber-300 border-amber-600', border: 'border-amber-700/60 hover:border-amber-400' },
  5: { badge: 'bg-rose-950 text-rose-300 border-rose-600', border: 'border-rose-700/60 hover:border-rose-400' },
};

export const HardwareShopModal: React.FC<HardwareShopModalProps> = ({
  isOpen,
  onClose,
  totalFunds,
  onBuyItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HardwareCategory | 'All'>('All');
  const [selectedTier, setSelectedTier] = useState<HardwareTier | 0>(0); // 0 = all tiers
  const [buySuccessNotice, setBuySuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = HARDWARE_CATALOG.filter(item => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchTier = selectedTier === 0 || item.tier === selectedTier;
    return matchCat && matchTier;
  });

  const handleBuy = (item: HardwareItemDefinition) => {
    const ok = onBuyItem(item);
    if (ok) {
      setBuySuccessNotice(`Đã mua ${item.name}! Đã thêm vào Balo [B].`);
      setTimeout(() => setBuySuccessNotice(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 text-xl font-bold shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-white tracking-wide uppercase">
                  PC HARDWARE &amp; UPGRADES STORE
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Cửa Hàng Linh Kiện &amp; Nội Thất Net
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mua linh kiện &amp; bàn ghế vào Balo [B] rồi mang về tiệm tự do lắp đặt (Internet Cafe Simulator Style)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Funds Pill */}
            <div className="bg-slate-950/90 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-emerald-400">
              <Coins className="w-4 h-4 text-emerald-400" />
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Quỹ Quán</div>
                <div className="text-sm font-mono font-black">{totalFunds.toLocaleString('vi-VN')} VNĐ</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Đóng cửa hàng [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {buySuccessNotice && (
          <div className="bg-emerald-950 border-b border-emerald-500/40 px-6 py-2 text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top-1">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{buySuccessNotice}</span>
          </div>
        )}

        {/* CATEGORY & TIER FILTER TOOLBAR */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  selectedCategory === tab.key
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] mr-1">Cấp Độ:</span>
            <button
              onClick={() => setSelectedTier(0)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                selectedTier === 0 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất Cả (T1-T5)
            </button>
            {([1, 2, 3, 4, 5] as HardwareTier[]).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                  selectedTier === t
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                T{t}
              </button>
            ))}
          </div>
        </div>

        {/* ITEMS GRID */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const canAfford = totalFunds >= item.price;
            const tierStyle = TIER_COLORS[item.tier];

            return (
              <div
                key={item.id}
                className={`bg-slate-950/70 rounded-2xl border p-4 flex flex-col justify-between transition-all group ${tierStyle.border} hover:shadow-lg`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.2 rounded border text-[9px] ${tierStyle.badge}`}>
                            Tier {item.tier}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-white leading-snug">{item.name}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Surface placement rule badge */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1">
                      <Info className="w-2.5 h-2.5 text-cyan-400" />
                      {item.targetSurface === 'floor' ? 'Đặt Trên Mặt Sàn (Floor)' : 'Đặt Trên Mặt Bàn (Desk Top)'}
                    </span>
                  </div>

                  {/* Description & Specs */}
                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">{item.description}</p>
                  <div className="text-[11px] font-mono text-cyan-300/90 bg-cyan-950/30 px-2.5 py-1 rounded-lg border border-cyan-800/30 mb-3">
                    {item.specs}
                  </div>
                </div>

                {/* Footer of Card: Price & Buy Button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Giá Bán</div>
                    <div className="text-base font-black font-mono text-emerald-400">
                      {item.price.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 ${
                      canAfford
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{canAfford ? 'Mua Vào Balo' : 'Thiếu Tiền'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Phím tắt: Bấm [B] ngoài game để mở Balo &amp; chọn món đồ bắt đầu Chế Độ Đặt (Build Mode).</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Đóng Cửa Hàng
          </button>
        </div>
      </div>
    </div>
  );
};
