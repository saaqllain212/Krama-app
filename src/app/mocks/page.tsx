'use client';

import { useState } from 'react';
import Link from 'next/link';
import MocksModal from '@/components/mocks/MocksModal';

export default function MocksPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8">
      <h1 className="text-3xl font-black uppercase mb-4">
        Mocks
      </h1>

      <p className="text-sm font-mono text-stone-600 mb-4 max-w-xl">
        Log mock tests and track performance trends over time.
        Phase analysis and insights are derived automatically.
      </p>

      {/* Navigation to Insights */}
      <Link
        href="/mocks/insights"
        className="inline-block mb-8 text-sm font-black uppercase underline"
      >
        View Insights →
      </Link>

      <div>
        <button
          onClick={() => setOpen(true)}
          className="border-4 border-black px-6 py-3 font-black uppercase bg-white hover:bg-black hover:text-white transition shadow-[4px_4px_0_#000]"
        >
          Open Mocks Laboratory
        </button>
      </div>

      <MocksModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
