import React, { useState } from 'react';
import {
  InventoryBackpackItem,
  HardwareCategory,
} from '../data/hardwareCatalog';
import {
  Package,
  X,
  Hammer,
  Trash2,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';

interface BackpackModalProps {
  isOpen: boolean;
  onClose: () => void;
  backpack: InventoryBackpackItem[];
  onSelectItemForBuild: (item: InventoryBackpackItem) => void;
  onDiscardItem?: (instanceId: string) => void;
}

export const BackpackModal: React.FC<BackpackModalProps> = ({
  isOpen,
  onClose,
  backpack,
  onSelectItemForBuild,
  onDiscardItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const filteredItems = backpack.filter(entry => {
    if (selectedCategory === 'All') return true;
    return entry.item.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/50 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 text-xl font-bold shadow-inner">
              🎒
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-white tracking-wide uppercase">
                  BALO LINH KIỆN &amp; NỘI THẤT (BACKPACK)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  {backpack.length} Món Đang Chứa
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nhấp vào bất kỳ món đồ nào để đóng menu và kích hoạt Chế Độ Đặt Tự Do (Build Mode)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Đóng Balo [B hoặc Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TIPS BANNER */}
        <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Quy tắc lắp đặt: Bàn &amp; Ghế raycast đặt lên <strong>Sàn nhà</strong>. Màn hình, Thùng Case, Chuột, Bàn phím &amp; Tai nghe raycast hít lên <strong>Mặt Bàn</strong>.
          </span>
        </div>

        {/* ITEMS LIST */}
        <div className="p-6 overflow-y-auto flex-1">
          {backpack.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl mx-auto mb-3">
                📦
              </div>
              <h3 className="text-base font-bold text-white mb-1">Balo Đang Trống</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Bạn chưa mua linh kiện hoặc đồ nội thất nào. Hãy sang Cửa Hàng PC HARDWARE đối diện đường và nhấn [E] ở quầy để mua sắm!
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
              >
                Quay Lại Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredItems.map(entry => {
                const item = entry.item;
                return (
                  <div
                    key={entry.instanceId}
                    className="bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-emerald-500/60 p-3.5 flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-emerald-500/10"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {item.category} • Tier {item.tier}
                            </div>
                            <h4 className="text-sm font-black text-white leading-tight">{item.name}</h4>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 mb-3">
                        <div className="font-mono text-cyan-300 font-semibold mb-0.5">{item.specs}</div>
                        <div>Mặt đặt: <span className="text-white font-medium">{item.targetSurface === 'floor' ? 'Sàn Nhà' : 'Mặt Bàn Máy'}</span></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectItemForBuild(entry)}
                        className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Đặt Món Đồ [Build]</span>
                      </button>

                      {onDiscardItem && (
                        <button
                          onClick={() => onDiscardItem(entry.instanceId)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 border border-slate-700 transition-colors"
                          title="Hủy / Bỏ bớt món đồ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Phím tắt: Bấm [B] để đóng/mở Balo bất cứ lúc nào trong trò chơi.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Đóng Balo
          </button>
        </div>
      </div>
    </div>
  );
};
