'use client';

type Props = {
  hygiene: {
    confidenceLevel: 'high' | 'reduced' | 'low';
  } | null;
};

export default function HygieneWarnings({ hygiene }: Props) {
  if (!hygiene) return null;

  return (
    <div className="border-2 border-dashed border-stone-300 p-4">
      <div className="text-xs font-black uppercase text-stone-500 mb-1">
        Data Confidence
      </div>

      <div className="font-black text-stone-800">
        {hygiene.confidenceLevel === 'high' && 'High confidence'}
        {hygiene.confidenceLevel === 'reduced' && 'Reduced confidence'}
        {hygiene.confidenceLevel === 'low' && 'Low confidence'}
      </div>
    </div>
  );
}
