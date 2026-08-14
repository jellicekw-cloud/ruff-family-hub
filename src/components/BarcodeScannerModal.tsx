import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, ScanBarcode, Loader2, Check, PackagePlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PantryItem, CategoryType } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Partial<PantryItem>) => void;
  existingPantry: PantryItem[];
}

const CATEGORIES: CategoryType[] = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Pantry & Grains',
  'Spices & Condiments',
  'Canned Goods',
  'Snacks & Drinks',
  'Frozen',
  'Bakery'
];

// Rough keyword mapping from Open Food Facts category tags to our pantry categories.
function guessCategory(tags: string[]): CategoryType {
  const joined = tags.join(' ').toLowerCase();
  if (joined.includes('dairy') || joined.includes('milk') || joined.includes('cheese') || joined.includes('egg')) return 'Dairy & Eggs';
  if (joined.includes('meat') || joined.includes('poultry') || joined.includes('seafood') || joined.includes('fish')) return 'Meat & Seafood';
  if (joined.includes('fruit') || joined.includes('vegetable') || joined.includes('produce')) return 'Produce';
  if (joined.includes('spice') || joined.includes('condiment') || joined.includes('sauce') || joined.includes('seasoning')) return 'Spices & Condiments';
  if (joined.includes('canned') || joined.includes('can-')) return 'Canned Goods';
  if (joined.includes('snack') || joined.includes('drink') || joined.includes('beverage') || joined.includes('soda') || joined.includes('chip')) return 'Snacks & Drinks';
  if (joined.includes('frozen')) return 'Frozen';
  if (joined.includes('bakery') || joined.includes('bread') || joined.includes('pastr')) return 'Bakery';
  return 'Pantry & Grains';
}

type LookupState =
  | { phase: 'idle' }
  | { phase: 'looking-up'; barcode: string }
  | { phase: 'confirm'; barcode: string; name: string; category: CategoryType; quantity: number; unit: string; foundOnline: boolean };

const SCANNER_ELEMENT_ID = 'barcode-scanner-viewport';

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  existingPantry,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<LookupState>({ phase: 'idle' });
  const [sessionAdded, setSessionAdded] = useState<{ name: string; barcode: string }[]>([]);
  const lastCodeRef = useRef<string | null>(null);
  const lastCodeTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 140 } },
        (decodedText) => {
          if (cancelled) return;
          const now = Date.now();
          // Debounce: ignore re-triggers of the same code within 4 seconds
          // (the camera keeps "seeing" the same barcode for multiple frames)
          if (decodedText === lastCodeRef.current && now - lastCodeTimeRef.current < 4000) return;
          lastCodeRef.current = decodedText;
          lastCodeTimeRef.current = now;
          handleDetected(decodedText);
        },
        () => {
          // Fires continuously while no code is detected — expected, ignore.
        }
      )
      .catch((err) => {
        if (!cancelled) {
          console.error('Camera start failed:', err);
          setCameraError('Could not access the camera. Make sure camera permission is allowed for this site.');
        }
      });

    return () => {
      cancelled = true;
      scanner.stop().catch(() => {}).finally(() => scanner.clear());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDetected = async (barcode: string) => {
    // Already in your pantry with this barcode? Just bump the quantity by 1 instead of a full lookup.
    const existing = existingPantry.find(p => p.barcode === barcode);
    if (existing) {
      onAddItem({ id: existing.id, quantity: existing.quantity + 1 });
      setSessionAdded(prev => [{ name: `${existing.name} (+1)`, barcode }, ...prev]);
      return;
    }

    setLookup({ phase: 'looking-up', barcode });

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const name = data.product.product_name || data.product.product_name_en || `Item ${barcode}`;
        const tags: string[] = data.product.categories_tags || [];
        setLookup({
          phase: 'confirm',
          barcode,
          name,
          category: guessCategory(tags),
          quantity: 1,
          unit: 'pcs',
          foundOnline: true,
        });
      } else {
        setLookup({
          phase: 'confirm',
          barcode,
          name: '',
          category: 'Pantry & Grains',
          quantity: 1,
          unit: 'pcs',
          foundOnline: false,
        });
      }
    } catch (err) {
      console.error('Barcode lookup failed:', err);
      setLookup({
        phase: 'confirm',
        barcode,
        name: '',
        category: 'Pantry & Grains',
        quantity: 1,
        unit: 'pcs',
        foundOnline: false,
      });
    }
  };

  const handleConfirmAdd = () => {
    if (lookup.phase !== 'confirm' || !lookup.name.trim()) return;

    onAddItem({
      name: lookup.name.trim(),
      category: lookup.category,
      quantity: lookup.quantity,
      unit: lookup.unit,
      status: 'in_stock',
      barcode: lookup.barcode,
      updatedAt: new Date().toISOString(),
    });

    setSessionAdded(prev => [{ name: lookup.name.trim(), barcode: lookup.barcode }, ...prev]);
    setLookup({ phase: 'idle' });
  };

  const handleSkip = () => {
    setLookup({ phase: 'idle' });
  };

  const handleClose = () => {
    setLookup({ phase: 'idle' });
    setSessionAdded([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-emerald-600" />
            <span>Scan Pantry Items</span>
          </h3>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Camera viewport */}
          <div className="relative bg-black">
            <div id={SCANNER_ELEMENT_ID} className="w-full" />

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/90">
                <div className="text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-sm text-white font-semibold">{cameraError}</p>
                </div>
              </div>
            )}

            {lookup.phase === 'looking-up' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                  <p className="text-xs text-white font-bold">Looking up {lookup.barcode}...</p>
                </div>
              </div>
            )}
          </div>

          {/* Confirm card */}
          {lookup.phase === 'confirm' && (
            <div className="p-4 space-y-3 bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {lookup.foundOnline ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Found it! Confirm the details:</span>
                  </>
                ) : (
                  <>
                    <PackagePlus className="w-4 h-4" />
                    <span>Not in the product database — enter it manually:</span>
                  </>
                )}
              </div>

              <input
                type="text"
                placeholder="Item name"
                value={lookup.name}
                onChange={(e) => setLookup({ ...lookup, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                autoFocus
              />

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={lookup.category}
                  onChange={(e) => setLookup({ ...lookup, category: e.target.value as CategoryType })}
                  className="col-span-2 px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="number"
                  min={1}
                  value={lookup.quantity}
                  onChange={(e) => setLookup({ ...lookup, quantity: Number(e.target.value) })}
                  className="px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-center"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Skip
                </button>
                <button
                  onClick={handleConfirmAdd}
                  disabled={!lookup.name.trim()}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Add to Pantry</span>
                </button>
              </div>
            </div>
          )}

          {/* Session list */}
          {sessionAdded.length > 0 && (
            <div className="p-4 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Added this session ({sessionAdded.length})
              </p>
              {sessionAdded.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}

          {lookup.phase === 'idle' && sessionAdded.length === 0 && !cameraError && (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Point your camera at a barcode. Items scan continuously — no need to close this between items.
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-extrabold"
          >
            Done Scanning
          </button>
        </div>

      </div>
    </div>
  );
};

