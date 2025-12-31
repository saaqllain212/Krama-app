// lib/syllabusLogic.ts

export type SyllabusNode = {
  id: string;
  title: string;
  type: 'branch' | 'leaf';
  children?: SyllabusNode[];
  status?: 'locked' | 'unlocked' | 'growing' | 'harvested';
  // NEW: Store the dates here
  metadata?: {
    planted_at?: string;
    completed_at?: string; // Optional, if you add this column later
  };
};

export type UserProgress = {
  origin_id: string;
  status: 'active' | 'completed';
  created_at: string; // NEW: We get this from Supabase
};

export function mergeSyllabusWithProgress(
  staticNodes: SyllabusNode[],
  userProgress: UserProgress[]
): SyllabusNode[] {

  // 1. Create Map with Data
  const progressMap = new Map<string, { status: string, date: string }>();
  
  if (userProgress && userProgress.length > 0) {
    userProgress.forEach(p => {
      if(p.origin_id) {
        progressMap.set(p.origin_id, { 
          status: p.status, 
          date: p.created_at 
        });
      }
    });
  }

  // 2. Recursive Walker
  const walk = (nodes: SyllabusNode[]): SyllabusNode[] => {
    return nodes.map((node) => {
      const newNode = { ...node };
      const match = progressMap.get(newNode.id);

      if (match) {
        if (match.status === 'completed') newNode.status = 'harvested';
        else newNode.status = 'growing';
        
        // ATTACH DATES
        newNode.metadata = {
          planted_at: match.date
        };
      } else {
        newNode.status = 'locked';
      }

      if (newNode.children && newNode.children.length > 0) {
        newNode.children = walk(newNode.children);
        const hasActiveChild = newNode.children.some(
          (child) => child.status === 'growing' || child.status === 'harvested' || child.status === 'unlocked'
        );
        if (hasActiveChild) newNode.status = 'unlocked';
      }

      return newNode;
    });
  };

  return walk(staticNodes);
}