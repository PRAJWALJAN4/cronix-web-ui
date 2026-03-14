import React, { useState, useEffect } from 'react';

// --- Constants & Config ---
const STATUS_CYCLE = ['available', 'occupied', 'opened'];
const STATUS_LABEL = { available: 'AVAILABLE', occupied: 'OCCUPIED', opened: 'OPENED' };
const STATUS_ICON = { available: '🟢', occupied: '🔒', opened: '📂' };
// Map BoxType strings back to size chars
const TYPE_MAP = { SMALL: 's', MEDIUM: 'm', LARGE: 'l', EXTRA_LARGE: 'xl' };
const REVERSE_TYPE_MAP = { s: 'SMALL', m: 'MEDIUM', l: 'LARGE', xl: 'EXTRA_LARGE' };
const BLOCK_SHAPE = { s: [1, 2], m: [2, 2], l: [2, 3], xl: [2, 4] };
const LABEL_MAP = { s: 'SMALL', m: 'MEDIUM', l: 'LARGE', xl: 'EXTRA LARGE' };
const CODE_PREFIX = { s: 'S', m: 'M', l: 'L', xl: 'XL' };

export default function CustomLockerGrid({
    mode = 'design', // 'design' | 'live'
    initialLayoutData, // { shape: '5x4', gridData: {...} } OR null
    onLayoutChange, // (layoutData) => void  (for design mode)
    boxStatuses = {}, // map of box blockId -> status (e.g., { 'm-123': 'available' })
    onBoxSelect, // (boxDetail) => void (for live mode)
    selectedBoxes = [] // list of currently selected boxIds
}) {
    // State
    const [setupData, setSetupData] = useState(initialLayoutData || { shape: '5x4', gridData: {} });
    const [currentDrawTool, setCurrentDrawTool] = useState('m');

    // Sync with external state changes (like switching terminals or loading saved layouts)
    useEffect(() => {
        if (initialLayoutData) {
            setSetupData(initialLayoutData);
        } else {
            setSetupData({ shape: '5x4', gridData: {} });
        }
    }, [initialLayoutData]);

    const notifyLayoutChange = (newData) => {
        setSetupData(newData);
        if (onLayoutChange) {
            onLayoutChange(newData);
        }
    };

    // --- Drawing Logic (Design Mode) ---
    const placeBlock = (startR, startC) => {
        if (mode !== 'design' || currentDrawTool === 'empty') return;

        const [rows, cols] = setupData.shape.split('x').map(Number);
        let [rSpan, cSpan] = BLOCK_SHAPE[currentDrawTool];

        // Rotate logic
        if (startR + rSpan > rows || startC + cSpan > cols) {
            [rSpan, cSpan] = [cSpan, rSpan];
        }

        // Final Bounds Check
        if (startR + rSpan > rows || startC + cSpan > cols) {
            alert("🚫 Doesn't fit here (out of bounds)");
            return;
        }

        // Collision Check: Check all cells in the potential span
        const newGridData = { ...setupData.gridData };
        for (let r = startR; r < startR + rSpan; r++) {
            for (let c = startC; c < startC + cSpan; c++) {
                if (newGridData[`${r}-${c}`]) {
                    alert("⚠️ Overlap detected! Clear the space first.");
                    return;
                }
            }
        }

        const blockId = `${currentDrawTool}-${Date.now()}`;
        for (let r = startR; r < startR + rSpan; r++) {
            for (let c = startC; c < startC + cSpan; c++) {
                newGridData[`${r}-${c}`] = { size: currentDrawTool, blockId };
            }
        }

        notifyLayoutChange({ ...setupData, gridData: newGridData });
    };

    const eraseBlock = (blockId) => {
        if (mode !== 'design') return;
        const newGridData = { ...setupData.gridData };
        Object.keys(newGridData).forEach(id => {
            if (newGridData[id]?.blockId === blockId) delete newGridData[id];
        });
        notifyLayoutChange({ ...setupData, gridData: newGridData });
    };

    // --- Block Aggregation Logic ---
    const getBlocks = () => {
        const gd = setupData.gridData;
        const [rows, cols] = setupData.shape.split('x').map(Number);
        const blockMap = {};

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = gd[`${r}-${c}`];
                if (cell) {
                    if (!blockMap[cell.blockId]) {
                        blockMap[cell.blockId] = { size: cell.size, blockId: cell.blockId, cells: [], minR: r, maxR: r, minC: c, maxC: c };
                    }
                    const b = blockMap[cell.blockId];
                    b.cells.push(`${r}-${c}`);
                    b.minR = Math.min(b.minR, r);
                    b.maxR = Math.max(b.maxR, r);
                    b.minC = Math.min(b.minC, c);
                    b.maxC = Math.max(b.maxC, c);
                }
            }
        }

        const sizeCounts = { s: 0, m: 0, l: 0, xl: 0 };
        return Object.values(blockMap)
            .sort((a, b) => a.minR - b.minR || a.minC - b.minC)
            .map(b => {
                const num = ++sizeCounts[b.size];
                return {
                    ...b,
                    identifiableName: `${CODE_PREFIX[b.size]}-${num}`, // Used for DB correlation
                    displayCode: `${CODE_PREFIX[b.size]}-${num}`,
                    type: REVERSE_TYPE_MAP[b.size]
                };
            });
    };

    const blocks = getBlocks();

    // --- Render Logic ---
    const renderGrid = () => {
        const [rows, cols] = setupData.shape.split('x').map(Number);
        const cellToBlock = {};
        blocks.forEach(b => b.cells.forEach(id => { cellToBlock[id] = b; }));

        const rendered = new Set();
        const gridItems = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const id = `${r}-${c}`;
                const block = cellToBlock[id];

                if (block && !rendered.has(block.blockId)) {
                    // Render large block
                    rendered.add(block.blockId);

                    let s = 'available'; // Default 
                    if (mode === 'live') {
                        const rawStatus = boxStatuses[block.identifiableName]; // e.g., 'EMPTY_CLOSED'
                        if (rawStatus === 'EMPTY_CLOSED') s = 'available';
                        else if (rawStatus === 'BOOKED' || rawStatus?.startsWith('OCCUPIED')) s = 'occupied';
                        else s = 'available';
                    }

                    const isSelected = selectedBoxes.some(b => b.identifiableName === block.identifiableName);

                    // Design mode styles vs Live mode Styles
                    let className = `locker-cell `;
                    if (mode === 'design') {
                        className += `size-${block.size}`;
                    } else {
                        className += `status-${s}`;
                        if (isSelected) className += ` ring-4 ring-offset-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10`; // Selection highlighter
                    }

                    gridItems.push(
                        <div
                            key={block.blockId}
                            className={className}
                            style={{
                                gridColumn: `${block.minC + 1} / ${block.maxC + 2}`,
                                gridRow: `${block.minR + 1} / ${block.maxR + 2}`,
                                borderRadius: '10px'
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                if (mode === 'design') {
                                    if (currentDrawTool === 'empty') eraseBlock(block.blockId);
                                    else { eraseBlock(block.blockId); placeBlock(block.minR, block.minC); }
                                } else if (mode === 'live') {
                                    if (s === 'available' && onBoxSelect) {
                                        onBoxSelect(block); // Pass aggregate block info upstream
                                    }
                                }
                            }}
                        >
                            {mode === 'design' ? (
                                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-full tw-select-none">
                                    <div style={{ fontSize: '0.55rem', opacity: .65, fontWeight: 900, letterSpacing: '0.05em' }}>
                                        {LABEL_MAP[block.size]}
                                    </div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{block.displayCode}</div>
                                </div>
                            ) : (
                                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-full tw-select-none tw-gap-1">
                                    <div style={{ fontSize: isSelected ? '1.8rem' : '1.4rem', transition: 'all 0.2s', filter: isSelected ? 'drop-shadow(0px 0px 4px rgba(255,255,255,0.7))' : '' }}>
                                        {isSelected ? '💜' : STATUS_ICON[s]}
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 900 }}>{block.displayCode}</div>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: .8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        {isSelected ? 'SELECTED' : STATUS_LABEL[s]}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                } else if (!block && !rendered.has(`cell-${id}`)) {
                    // Render Empty Slot
                    rendered.add(`cell-${id}`);
                    gridItems.push(
                        <div
                            key={`empty-${r}-${c}`}
                            className={mode === 'design'
                                ? "locker-cell tw-text-stone-300 tw-bg-white/50 tw-border tw-border-stone-200/50 hover:tw-bg-stone-50"
                                : "locker-cell live-empty"}
                            style={{
                                gridColumn: `${c + 1}`,
                                gridRow: `${r + 1}`,
                                fontSize: mode === 'design' ? '0.8rem' : '0.75rem'
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                if (mode === 'design' && currentDrawTool !== 'empty') {
                                    placeBlock(r, c);
                                }
                            }}
                        >
                            {String.fromCharCode(65 + r)}{c + 1}
                        </div>
                    );
                }
            }
        }

        return (
            <div
                className="locker-grid tw-shadow-xl"
                style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(72px, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(72px, 1fr))`
                }}
            >
                {gridItems}
            </div>
        );
    };

    // Handle Shape changing
    const changeShape = (shape) => {
        notifyLayoutChange({ shape, gridData: {} });
    };

    return (
        <div className="tw-w-full tw-bg-white tw-rounded-3xl tw-shadow-2xl tw-overflow-hidden tw-border tw-border-white/10 tw-text-stone-800" style={{ fontFamily: "'Inter', sans-serif" }}>

            <div className="tw-flex tw-min-h-[500px]">
                {/* --- SIDEBAR --- */}
                {mode === 'design' && (
                    <div className="tw-w-80 tw-flex-shrink-0 tw-border-r tw-border-stone-100 tw-p-5 tw-overflow-y-auto scrollbar-hide tw-bg-stone-50">
                        <p className="tw-text-xs tw-font-black tw-text-stone-400 tw-uppercase tw-tracking-widest tw-mb-3">Select Size Tool</p>

                        <div className="tw-space-y-2 tw-mb-4">
                            {[
                                { id: 's', label: 'Small — 1×2', desc: 'Keys, Wallets' },
                                { id: 'm', label: 'Medium — 2×2', desc: 'Backpacks, Helmets' },
                                { id: 'l', label: 'Large — 2×3', desc: 'Suitcases' },
                                { id: 'xl', label: 'XL — 2×4', desc: 'Trunks, Heavy bags' }
                            ].map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setCurrentDrawTool(tool.id)}
                                    className={`tool-btn tw-w-full tw-text-left tw-p-3 tw-rounded-xl tw-border-2 tw-transition-all tw-flex tw-items-center tw-gap-3 ${currentDrawTool === tool.id ? 'active' : 'tw-border-transparent hover:tw-bg-white'}`}
                                >
                                    <div className={`tw-w-8 tw-h-8 tw-rounded-lg size-${tool.id} tw-flex-shrink-0`}></div>
                                    <div>
                                        <div className="tw-font-bold tw-text-sm">{tool.label}</div>
                                        <div className="tw-text-[11px] tw-text-stone-400">{tool.desc}</div>
                                    </div>
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentDrawTool('empty')}
                                className={`tool-btn tw-w-full tw-text-left tw-p-3 tw-rounded-xl tw-border-2 tw-transition-all tw-flex tw-items-center tw-gap-3 ${currentDrawTool === 'empty' ? 'active' : 'tw-border-transparent hover:tw-bg-white'}`}
                            >
                                <div className="tw-w-8 tw-h-8 tw-rounded-lg tw-bg-white tw-border tw-border-stone-300 tw-flex tw-items-center tw-justify-center tw-text-stone-300 tw-flex-shrink-0">✕</div>
                                <div><div className="tw-font-bold tw-text-sm tw-text-stone-500">Eraser</div></div>
                            </button>
                        </div>

                        <div className="tw-flex tw-items-center tw-gap-2 tw-bg-white tw-px-3 tw-py-2 tw-rounded-xl tw-border tw-border-stone-200">
                            <span className="tw-text-xs tw-font-bold tw-text-stone-400 tw-uppercase tw-tracking-widest">Shape</span>
                            <select value={setupData.shape} onChange={(e) => changeShape(e.target.value)} className="tw-bg-transparent tw-font-bold tw-text-stone-700 outline-none hover:tw-cursor-pointer tw-text-sm tw-flex-1">
                                <option value="5x4">5R × 4C</option>
                                <option value="4x8">4R × 8C</option>
                                <option value="6x6">6R × 6C</option>
                                <option value="3x3">3R × 3C</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* --- MAIN PANEL --- */}
                <div className="tw-flex-1 tw-flex tw-flex-col tw-overflow-hidden tw-bg-stone-100/50 tw-items-center tw-justify-center tw-p-8 tw-relative">
                    <div className="tw-flex-1 tw-flex tw-items-center tw-justify-center tw-overflow-auto tw-w-full">
                        {renderGrid()}
                    </div>
                </div>

            </div>
        </div>
    );
}
