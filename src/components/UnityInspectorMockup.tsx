import React, { useState } from 'react';
import { ScriptConfig } from '../data/csharpScripts';
import { Eye, ChevronDown, CheckSquare, Square, Disc, CircleDot, HelpCircle } from 'lucide-react';

interface UnityInspectorMockupProps {
  config: ScriptConfig;
}

export const UnityInspectorMockup: React.FC<UnityInspectorMockupProps> = ({ config }) => {
  const [selectedComponent, setSelectedComponent] = useState<'real_estate' | 'satisfaction' | 'station' | 'player' | 'money' | 'mobile_button' | 'realistic_npc'>('real_estate');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>Mô Phỏng Giao Diện Unity Editor Inspector Thật</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white mt-1">
            Minh Họa Trực Quan Cửa Sổ Inspector Trong Unity
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Xem trước chính xác từng ô nhập liệu, danh sách kéo thả và cấu hình cần điền trong Unity.
          </p>
        </div>

        {/* Tab switcher for components */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {[
            { id: 'real_estate', label: '★ Mua Mặt Bằng (Real Estate 5M)' },
            { id: 'realistic_npc', label: '★ Khách 3D Nam Á (Humanoid & IK)' },
            { id: 'satisfaction', label: 'CustomerSatisfaction (Điểm Hài Lòng)' },
            { id: 'station', label: 'Bàn Máy (ComputerStation)' },
            { id: 'player', label: 'Camera Player (PlayerInteraction)' },
            { id: 'money', label: 'MoneyManager' },
            { id: 'mobile_button', label: 'Nút Mobile Button OnClick' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedComponent(tab.id as typeof selectedComponent)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedComponent === tab.id
                  ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Realistic Unity Dark Theme Inspector Container */}
      <div className="max-w-xl mx-auto bg-[#2b2b2b] text-[#dcdcdc] rounded-xl border border-[#3e3e3e] shadow-2xl overflow-hidden font-sans text-xs select-none">
        {/* Unity Inspector Title Bar */}
        <div className="bg-[#3c3c3c] px-3 py-2 border-b border-[#202020] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#e0e0e0]">Inspector</span>
          </div>
          <div className="flex items-center gap-2 text-[#8a8a8a]">
            <span>Normal</span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#505050]" />
          </div>
        </div>

        {/* GameObject Header (Name, Tag, Layer, Static checkbox) */}
        <div className="p-3 bg-[#383838] border-b border-[#282828] space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#4a90e2] rounded flex items-center justify-center text-[10px] text-white font-bold">
              3D
            </div>
            <input
              type="text"
              readOnly
              value={
                selectedComponent === 'real_estate'
                  ? 'MatBang_01_West_Storefront'
                  : selectedComponent === 'satisfaction'
                  ? 'Customer_Prefab (Clone)'
                  : selectedComponent === 'station'
                  ? 'BanMayTinh_01'
                  : selectedComponent === 'player'
                  ? 'Main Camera (Player)'
                  : selectedComponent === 'money'
                  ? 'MoneyManager'
                  : 'Btn_MobileInteract'
              }
              className="bg-[#2a2a2a] border border-[#202020] px-2 py-1 rounded text-[#ffffff] font-bold text-xs flex-1"
            />
            <div className="flex items-center gap-1 text-[#a0a0a0] text-[11px]">
              <Square className="w-3.5 h-3.5 text-[#606060]" />
              <span>Static</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1 bg-[#2e2e2e] border border-[#202020] px-2 py-1 rounded">
              <span className="text-[#808080]">Tag:</span>
              <span className="text-[#dcdcdc] font-semibold">
                {selectedComponent === 'real_estate' ? 'Property' : selectedComponent === 'satisfaction' || selectedComponent === 'realistic_npc' ? 'Customer' : selectedComponent === 'station' ? 'ComputerStation' : 'Untagged'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-[#2e2e2e] border border-[#202020] px-2 py-1 rounded">
              <span className="text-[#808080]">Layer:</span>
              <span className="text-[#dcdcdc] font-semibold">
                {selectedComponent === 'real_estate' ? 'PropertyInteractable' : selectedComponent === 'satisfaction' || selectedComponent === 'realistic_npc' ? 'Customer' : selectedComponent === 'station' ? 'Interactable' : 'Default'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Component Content Based On Selected Tab */}
        <div className="p-3 space-y-3">
          {/* COMPONENT: Real Estate Property Purchasing */}
          {selectedComponent === 'real_estate' && (
            <div className="space-y-3">
              {/* 1. PropertySlot Script */}
              <div className="bg-[#383838] border border-amber-500/50 rounded p-2.5 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Property Slot (Script)</span>
                  </div>
                  <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    Real Estate Slot
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Property Id:</span>
                    <span className="font-mono text-emerald-400 text-[10px]">Property_01_West</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Property Name:</span>
                    <span className="font-mono text-white text-[10px]">Mặt Bằng 01 - Khu VIP Phía Tây</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Purchase Price:</span>
                    <span className="font-mono text-amber-400 font-bold text-[11px]">5.000.000 VNĐ</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">For Sale 3D Sign:</span>
                    <span className="font-mono text-sky-400 text-[10px]">Sign_ForSale_01 (GameObject)</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Locked Door Collider:</span>
                    <span className="font-mono text-rose-400 text-[10px]">BoxCollider (Tường Chặn Cửa)</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Door Pivot Transform:</span>
                    <span className="font-mono text-sky-400 text-[10px]">Door_Pivot_Storefront</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Interior Lights (List):</span>
                    <span className="font-mono text-amber-300 text-[10px]">4 Lights (Tắt ban đầu, Bật khi mua)</span>
                  </div>
                </div>
              </div>

              {/* 2. PropertyPurchasingManager Script */}
              <div className="bg-[#383838] border border-emerald-500/50 rounded p-2.5 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Property Purchasing Manager (Script)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    Raycast &amp; Economy
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Player Camera:</span>
                    <span className="font-mono text-sky-400 text-[10px]">Main Camera (Transform)</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Raycast Distance:</span>
                    <span className="font-mono text-white text-[10px]">3.5 Mét</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Purchase Key:</span>
                    <span className="font-mono text-emerald-400 font-bold text-[10px]">KeyCode.E</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Interaction Prompt UI:</span>
                    <span className="font-mono text-white text-[10px]">[E] Mua mặt bằng mở rộng - Giá: 5.000.000 VNĐ</span>
                  </div>
                  <div className="bg-[#242424] p-2 rounded border border-[#333] space-y-1">
                    <div className="text-[#888] text-[10px] font-bold">XỬ LÝ ĐIỀU KIỆN (CONDITION EXECUTION):</div>
                    <div className="text-rose-400 text-[10px]">
                      • Quỹ &lt; 5.000.000 VNĐ: Log đỏ "Không đủ tiền! Cần 5.000.000 VNĐ để mua mặt bằng."
                    </div>
                    <div className="text-emerald-400 text-[10px]">
                      • Quỹ ≥ 5.000.000 VNĐ: Trừ 5.000.000đ, mở cửa, bật đèn, log xanh "Chúc mừng! Đã mở khóa mặt bằng mới."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* COMPONENT: Realistic Asian Male NPC & Inverse Kinematics */}
          {selectedComponent === 'realistic_npc' && (
            <div className="space-y-3">
              {/* 0. HumanoidModelGLTFLoader Script (Async GLTF/GLB from Public CDN - Replaces Primitives) */}
              <div className="bg-[#383838] border border-blue-500/50 rounded p-2.5 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Humanoid Model GLTF Loader (Script)</span>
                  </div>
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                    CDN Async GLB
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Avatar GLB CDN URL:</span>
                    <span className="font-mono text-emerald-400 text-[10px] truncate max-w-[210px]">
                      https://models.readyplayer.me/6460d3594ae79bdd72a67a84.glb
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Animator Controller:</span>
                    <span className="font-mono text-sky-400 text-[10px]">Customer_Humanoid_Controller</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-[#262626] p-1.5 rounded border border-[#333]">
                      <span className="text-[#888]">Animation State 1:</span>
                      <div className="text-emerald-400 font-bold font-mono">Idle (Thở & cử động)</div>
                    </div>
                    <div className="bg-[#262626] p-1.5 rounded border border-[#333]">
                      <span className="text-[#888]">Animation State 2:</span>
                      <div className="text-amber-400 font-bold font-mono">Sitting (Ngồi chơi net)</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded text-[10px] text-emerald-300">
                    <span>✓ Anti-Primitives Check:</span>
                    <span className="font-bold">Zero Cubes / Zero Spheres / 100% GLTF PBR Mesh</span>
                  </div>
                </div>
              </div>

              {/* 1. CustomerAnimationController Script (Mecanim Clips & Desk Surface Hand IK) */}
              <div className="bg-[#383838] border border-emerald-500/50 rounded p-2.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Customer Animation Controller (Script)</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-mono">🎮 Mecanim & Desk IK</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Runtime Animator Controller:</span>
                    <span className="font-mono text-white text-[10px] truncate max-w-[190px]">AC_CustomerHumanoid (AnimatorController)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-[#2e2e2e] p-1.5 rounded border border-[#242424] flex justify-between">
                      <span className="text-[#888]">Idle State:</span>
                      <span className="font-mono text-emerald-400 font-semibold">"Idle" (Thở tự nhiên)</span>
                    </div>
                    <div className="bg-[#2e2e2e] p-1.5 rounded border border-[#242424] flex justify-between">
                      <span className="text-[#888]">Sitting State:</span>
                      <span className="font-mono text-sky-400 font-semibold">"Sitting" (Ngồi net)</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Desk Surface IK Transform:</span>
                    <span className="font-mono text-amber-300 text-[10px] truncate max-w-[190px]">BanMay_01/Desk_Surface</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Left Hand IK (WASD keys):</span>
                    <span className="font-mono text-emerald-400 text-[10px] truncate max-w-[190px]">BanMay_01/Keyboard/WASD_Target</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Right Hand IK (Gaming Mouse):</span>
                    <span className="font-mono text-sky-400 text-[10px] truncate max-w-[190px]">BanMay_01/Mouse/Mouse_IK_Target</span>
                  </div>

                  <div className="pt-1 border-t border-[#444] text-[10px] space-y-1">
                    <div className="text-[#888] font-semibold">Cơ chế tương tác mặt bàn & Micro-motions:</div>
                    <div className="grid grid-cols-2 gap-1 text-[#bbb]">
                      <div className="bg-[#262626] p-1 rounded">✓ Snap To Desk Surface (Raycast)</div>
                      <div className="bg-[#262626] p-1 rounded">✓ Hand Surface Height: 0.025m</div>
                      <div className="bg-[#262626] p-1 rounded">✓ Micro Gaming: Nhấp phím & rê chuột</div>
                      <div className="bg-[#262626] p-1 rounded">✓ Drinking Routine: Nâng cốc uống nước</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. RealisticCustomerModelController Script */}
              <div className="bg-[#383838] border border-purple-500/50 rounded p-2.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-purple-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Realistic Customer Model Controller (Script)</span>
                  </div>
                  <span className="text-[10px] text-purple-300 font-mono">⚡ Humanoid IK</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">IK Weight (Tay & Mắt):</span>
                    <span className="font-mono text-purple-400 font-bold">1.0 (Full Control)</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Keyboard IK Target (WASD):</span>
                    <span className="font-mono text-emerald-400 text-[10px] truncate max-w-[190px]">BanMay_01/Keyboard/WASD_Target</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Mouse IK Target (Chuột Gaming):</span>
                    <span className="font-mono text-sky-400 text-[10px] truncate max-w-[190px]">BanMay_01/Mouse/Mouse_IK_Target</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2e2e2e] p-1.5 rounded border border-[#242424]">
                    <span className="text-[#aaa]">Monitor LookAt Target:</span>
                    <span className="font-mono text-amber-300 text-[10px] truncate max-w-[190px]">BanMay_01/Monitor/Screen_Center</span>
                  </div>

                  <div className="pt-1 border-t border-[#444] text-[10px] space-y-1">
                    <div className="text-[#888] font-semibold">Cấu trúc khớp bàn tay (3 khớp x 5 ngón):</div>
                    <div className="grid grid-cols-2 gap-1 text-[#bbb]">
                      <div className="bg-[#262626] p-1 rounded">✓ Ngón cái: Trapeziometacarpal + IP</div>
                      <div className="bg-[#262626] p-1 rounded">✓ Ngón trỏ: MCP + PIP + DIP</div>
                      <div className="bg-[#262626] p-1 rounded">✓ Ngón giữa: MCP + PIP + DIP (WASD)</div>
                      <div className="bg-[#262626] p-1 rounded">✓ Ngón đeo nhẫn & út: Rigging chuẩn</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Skinned Mesh Renderer (PBR SSS Skin Material) */}
              <div className="bg-[#383838] border border-slate-700 rounded p-2.5 space-y-2">
                <div className="flex items-center justify-between border-b border-[#444] pb-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#e0e0e0]">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Skinned Mesh Renderer (Asian Male Face & SSS Skin)</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-[10px] text-[#aaa]">
                  <div className="flex justify-between">
                    <span>Mesh Khuôn Mặt Nam Á:</span>
                    <span className="text-white font-mono">AsianMale_Face_LOD0.fbx</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vật liệu da (SSS PBR Material):</span>
                    <span className="text-emerald-400 font-mono">M_AsianSkin_SubsurfaceScatter (2K)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tóc Hair Cards (Texture gai xước):</span>
                    <span className="text-sky-400 font-mono">M_AsianHairCards_Aniso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trang phục:</span>
                    <span className="text-amber-300 font-mono">Áo Phông Trắng Casual (White Cotton Tee)</span>
                  </div>
                </div>
              </div>

              {/* 3. LOD Group Component */}
              <div className="bg-[#383838] border border-slate-700 rounded p-2.5 space-y-2">
                <div className="flex items-center justify-between border-b border-[#444] pb-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>LOD Group (Tối Ưu Hóa Render Theo Cự Ly)</span>
                  </div>
                  <span className="text-[10px] text-amber-300">3 Levels</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                  <div className="bg-emerald-950/60 border border-emerald-600/50 p-1.5 rounded">
                    <div className="font-bold text-emerald-400">LOD 0</div>
                    <div className="text-[9px] text-[#aaa]">100% - 60%</div>
                    <div className="text-[8px] text-emerald-300">Full Rig & Da 2K</div>
                  </div>
                  <div className="bg-sky-950/60 border border-sky-600/50 p-1.5 rounded">
                    <div className="font-bold text-sky-400">LOD 1</div>
                    <div className="text-[9px] text-[#aaa]">60% - 25%</div>
                    <div className="text-[8px] text-sky-300">Giảm bớt khớp</div>
                  </div>
                  <div className="bg-amber-950/60 border border-amber-600/50 p-1.5 rounded">
                    <div className="font-bold text-amber-400">LOD 2</div>
                    <div className="text-[9px] text-[#aaa]">25% - 5%</div>
                    <div className="text-[8px] text-amber-300">Low Poly Mesh</div>
                  </div>
                  <div className="bg-rose-950/60 border border-rose-600/50 p-1.5 rounded">
                    <div className="font-bold text-rose-400">Culled</div>
                    <div className="text-[9px] text-[#aaa]">&lt; 5%</div>
                    <div className="text-[8px] text-rose-300">Ẩn hoàn toàn</div>
                  </div>
                </div>
              </div>

              {/* 4. Capsule Collider Component */}
              <div className="bg-[#383838] border border-slate-700 rounded p-2.5 space-y-2">
                <div className="flex items-center justify-between border-b border-[#444] pb-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Capsule Collider (Hitbox Ngồi &amp; Tương Tác F&B)</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-[#aaa]">
                  <div className="bg-[#2e2e2e] p-1 rounded">Center Y: <span className="text-white font-mono">0.85m</span></div>
                  <div className="bg-[#2e2e2e] p-1 rounded">Radius: <span className="text-white font-mono">0.35m</span></div>
                  <div className="bg-[#2e2e2e] p-1 rounded">Height: <span className="text-white font-mono">1.70m</span></div>
                </div>
              </div>
            </div>
          )}

          {/* COMPONENT: CustomerSatisfaction */}
          {selectedComponent === 'satisfaction' && (
            <div className="space-y-3">
              <div className="bg-[#383838] border border-pink-500/50 rounded p-2.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-pink-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Customer Satisfaction (Script)</span>
                  </div>
                  <span className="text-[10px] text-pink-300 font-mono">😍 Base 70</span>
                </div>

                <div className="space-y-2 pl-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#aaa]">Script</span>
                    <div className="bg-[#242424] px-2 py-0.5 rounded border border-[#1e1e1e] text-[#4a90e2] font-mono">
                      CustomerSatisfaction
                    </div>
                  </div>

                  <div className="text-[10px] uppercase font-bold text-pink-400 tracking-wider pt-1">
                    Điểm Khởi Điểm &amp; Thành Phần
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Base Score</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-emerald-400 font-bold">
                      70
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Computer Quality Score</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-sky-400 font-bold">
                      22 (RAM 3*2 + VGA 4*3 + Màn 2*2)
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Price Score</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-emerald-400 font-bold">
                      5
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Wait Time Penalty</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-slate-400 font-bold">
                      0
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Internet Bonus</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-sky-400 font-bold">
                      10
                    </div>
                  </div>

                  <div className="text-[10px] uppercase font-bold text-pink-400 tracking-wider pt-1">
                    Kết Quả Đánh Giá Cuối Cùng
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Final Score</span>
                    <div className="bg-[#1e1e1e] px-2 py-0.5 rounded border border-emerald-500/50 font-mono text-emerald-400 font-black">
                      97 / 100
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Current Tier</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-semibold text-pink-300">
                      VeryHappy (😍 5 Sao)
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPONENT: Customer Visuals & Limbs */}
              <div className="bg-[#383838] border border-indigo-500/50 rounded p-2.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Customer Visuals &amp; Limbs (Script)</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono">3D Humanoid</span>
                </div>

                <div className="space-y-2 pl-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#aaa]">Outfit Preset</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] text-indigo-300 font-semibold">
                      Student / Gamer / VIP
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#aaa]">Arm &amp; Leg Limbs</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] text-emerald-400 font-mono">
                      Rigged (Shoulder, Elbow, Hip, Knee, Shoes)
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#aaa]">Active Accessories</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] text-amber-300">
                      Backpack / RGB Headset / Gold Watch
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* COMPONENT: ComputerStation */}
          {selectedComponent === 'station' && (
            <div className="space-y-3">
              {/* Box Collider Box */}
              <div className="bg-[#383838] border border-[#444] rounded p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#e6e6e6]">
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Box Collider</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-4 text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="text-[#999]">Is Trigger:</span>
                    <Square className="w-3.5 h-3.5 text-[#777]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[#999]">Size:</span>
                    <span className="text-[#ccc] font-mono">X:1.6 Y:1.2 Z:1.0</span>
                  </div>
                </div>
              </div>

              {/* ComputerStation Script Component */}
              <div className="bg-[#383838] border border-emerald-500/50 rounded p-2.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Computer Station (Script)</span>
                  </div>
                  <span className="text-[10px] text-[#888] font-mono">v1.0</span>
                </div>

                <div className="space-y-2 pl-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#aaa]">Script</span>
                    <div className="bg-[#242424] px-2 py-0.5 rounded border border-[#1e1e1e] text-[#4a90e2] font-mono">
                      ComputerStation
                    </div>
                  </div>

                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider pt-1">
                    Cấu Hình Doanh Thu
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Revenue Per Tick</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-emerald-400 font-bold">
                      {config.revenuePerTick}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Tick Interval</span>
                    <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-sky-400 font-bold">
                      {config.tickInterval}
                    </div>
                  </div>

                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider pt-1">
                    Hiệu Ứng Hình Ảnh &amp; Ánh Sáng
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Screen Renderer</span>
                    <div className="flex items-center gap-1 bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] text-[#dcdcdc]">
                      <span>Screen_Monitor (MeshRenderer)</span>
                      <CircleDot className="w-3 h-3 text-[#777]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#ccc]">Screen Light</span>
                    <div className="flex items-center gap-1 bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] text-[#dcdcdc]">
                      <span>Light_Glow (Light)</span>
                      <CircleDot className="w-3 h-3 text-[#777]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPONENT: PlayerInteraction */}
          {selectedComponent === 'player' && (
            <div className="bg-[#383838] border border-emerald-500/50 rounded p-2.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Player Interaction (Script)</span>
                </div>
              </div>

              <div className="space-y-2.5 pl-2 text-[11px]">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Cấu Hình Khoảng Cách
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#ccc]">Max Interact Distance</span>
                  <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-amber-300 font-bold">
                    {config.interactDistance}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#ccc]">Interactable Layer</span>
                  <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] text-[#dcdcdc] font-semibold">
                    Interactable (hoặc Everything)
                  </div>
                </div>

                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider pt-1">
                  Tham Chiếu Camera
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#ccc]">Player Camera</span>
                  <div className="flex items-center gap-1 bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] text-[#dcdcdc]">
                    <span>Main Camera (Camera)</span>
                    <CircleDot className="w-3 h-3 text-[#777]" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#ccc]">PC Interact Key</span>
                  <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] text-purple-400 font-bold font-mono">
                    {config.interactKey}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPONENT: MoneyManager */}
          {selectedComponent === 'money' && (
            <div className="bg-[#383838] border border-emerald-500/50 rounded p-2.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Money Manager (Script)</span>
                </div>
              </div>

              <div className="space-y-2.5 pl-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#ccc]">Current Money</span>
                  <div className="bg-[#202020] px-2 py-0.5 rounded border border-[#1e1e1e] font-mono text-emerald-400 font-bold">
                    50000
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#ccc]">Auto Save</span>
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          )}

          {/* COMPONENT: Mobile Button OnClick */}
          {selectedComponent === 'mobile_button' && (
            <div className="bg-[#383838] border border-emerald-500/50 rounded p-2.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#444] pb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Button (Component) - On Click ()</span>
                </div>
              </div>

              <div className="space-y-2 pl-2 text-[11px]">
                <div className="text-[10px] text-[#aaa]">
                  Danh sách sự kiện khi chạm ngón tay vào màn hình điện thoại:
                </div>

                <div className="bg-[#242424] border border-[#1e1e1e] rounded p-2 space-y-1.5">
                  <div className="text-[10px] text-emerald-400 font-bold">Runtime Only</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-[#1c1c1c] p-1 rounded border border-[#333] text-[10px] truncate text-[#ddd]">
                      Player (PlayerInteraction)
                    </div>
                    <div className="bg-[#1c1c1c] p-1 rounded border border-[#333] text-[10px] text-amber-300 font-semibold truncate">
                      PlayerInteraction.OnMobileInteractClicked
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#888] italic">
                  * Kéo GameObject Player vào ô bên trái, sau đó bấm menu chọn: PlayerInteraction &gt; OnMobileInteractClicked().
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
