'use client';

type Props = {
  recovery: {
    status:
      | 'fast'
      | 'moderate'
      | 'slow'
      | 'none'
      | 'insufficient-data';
  } | null;
};

export default function RecoveryCard({ recovery }: Props) {
  if (!recovery) return null;

  return (
    <div className="border-2 border-dashed border-stone-300 p-4">
      <div className="text-xs font-black uppercase text-stone-500 mb-1">
        Recovery
      </div>

      <div className="font-black text-stone-800">
        {recovery.status === 'fast' && 'Fast recovery'}
        {recovery.status === 'moderate' && 'Moderate recovery'}
        {recovery.status === 'slow' && 'Slow recovery'}
        {recovery.status === 'none' && 'No recovery detected'}
        {recovery.status === 'insufficient-data' && 'Insufficient data'}
      </div>
    </div>
  );
}
