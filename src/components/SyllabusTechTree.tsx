'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lock, Sprout, CheckCircle2, Folder, FolderOpen } from 'lucide-react';
import { SyllabusNode } from '@/lib/syllabusLogic';

interface TechTreeProps {
  nodes: SyllabusNode[];
  onNodeClick: (node: SyllabusNode) => void;
}

export default function SyllabusTechTree({ nodes, onNodeClick }: TechTreeProps) {
  const [activePath, setActivePath] = useState<string[]>([]);

  // Calculate Columns
  const columns = [nodes]; 
  let currentLevelNodes = nodes;
  for (const id of activePath) {
    const foundNode = currentLevelNodes.find(n => n.id === id);
    if (foundNode && foundNode.children && foundNode.children.length > 0) {
      currentLevelNodes = foundNode.children;
      columns.push(currentLevelNodes);
    } else {
      break;
    }
  }

  const handleCardClick = (node: SyllabusNode, level: number) => {
    if (node.type === 'leaf') {
      onNodeClick(node);
    } else {
      const newPath = activePath.slice(0, level);
      newPath.push(node.id);
      setActivePath(newPath);
    }
  };

  return (
    <div className="w-full h-full overflow-x-auto bg-[#FDFBF7] p-6">
      <div className="flex h-full gap-6 min-w-max">
        {columns.map((colNodes, colIndex) => (
          <div key={colIndex} className="flex flex-col w-[300px] h-full">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-black mb-4 pb-2 border-b-4 border-black shrink-0">
              LEVEL {colIndex + 1}
            </div>
            <div className="overflow-y-auto pr-2 pb-20 space-y-3 scrollbar-thin scrollbar-thumb-stone-900 scrollbar-track-transparent flex-1">
              <AnimatePresence mode='popLayout'>
                {colNodes.map((node) => (
                  <TechCard 
                    key={node.id} 
                    node={node} 
                    isActive={activePath.includes(node.id)}
                    onClick={() => handleCardClick(node, colIndex)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechCard({ node, isActive, onClick }: { node: SyllabusNode, isActive: boolean, onClick: () => void }) {
  const isLocked = node.status === 'locked';
  const isGrowing = node.status === 'growing';
  const isHarvested = node.status === 'harvested';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`relative p-4 border-[3px] shadow-[4px_4px_0_#000] cursor-pointer transition-all duration-100 group select-none
        ${isActive 
          ? 'bg-black border-black text-white scale-105 z-10' 
          : isLocked 
            ? 'bg-stone-100 border-stone-300 text-stone-500' // Changed text color, removed line-through
            : 'bg-white border-black text-black hover:-translate-y-1 hover:shadow-[6px_6px_0_#000]'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {node.type === 'branch' ? (
             isActive ? <FolderOpen size={20} strokeWidth={3} /> : <Folder size={20} strokeWidth={3} />
          ) : (
             <>
               {isLocked && <Lock size={16} strokeWidth={3} />}
               {isGrowing && <Sprout size={18} className="text-emerald-600 animate-pulse" strokeWidth={3} />}
               {isHarvested && <CheckCircle2 size={18} className="text-amber-600" strokeWidth={3} />}
               {!isLocked && !isGrowing && !isHarvested && <div className="w-4 h-4 rounded-full border-[3px] border-stone-300" />}
             </>
          )}
          
          <span className="font-serif text-sm font-black leading-tight uppercase tracking-wide">
            {node.title}
          </span>
        </div>
        
        {node.type === 'branch' && (
          <ChevronRight size={16} strokeWidth={4} className={isActive ? "text-white" : "text-stone-300"} />
        )}
      </div>
    </motion.div>
  );
}