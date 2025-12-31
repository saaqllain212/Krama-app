// lib/examRegistry.ts

// 1. THE RAW FILES (The Content)
export const EXAM_REGISTRY = [
  // SSC (Corrected Name)
  { id: 'ssc', title: 'SSC Exams (CGL/CHSL)', filename: 'ssc-syllabus.json' },
  
  // BANKING (Ensure this file exists in your folder too!)
  { id: 'banking', title: 'Banking (IBPS/SBI/RBI)', filename: 'banking exam.json' },
  
  // UPSC PRELIMS
  { id: 'prelims-gs', title: 'UPSC Prelims: GS Paper I', filename: 'prelims_gs.json' },
  { id: 'csat', title: 'UPSC Prelims: CSAT (Paper II)', filename: 'CSAT.json' },
  
  // UPSC MAINS
  { id: 'gs1', title: 'UPSC Mains: GS Paper I', filename: 'gs1.json' },
  { id: 'gs2', title: 'UPSC Mains: GS Paper II', filename: 'gs2.json' },
  { id: 'gs3', title: 'UPSC Mains: GS Paper III', filename: 'gs3.json' },
  { id: 'gs4', title: 'UPSC Mains: GS Paper IV (Ethics)', filename: 'gs4.json' },
  
  // UPSC OPTIONALS
  { id: 'anthro1', title: 'Optional: Anthropology I', filename: 'anthro1.json' },
  { id: 'anthro2', title: 'Optional: Anthropology II', filename: 'anthro2.json' },
  { id: 'econ1', title: 'Optional: Economics I', filename: 'economics1.json' },
  { id: 'econ2', title: 'Optional: Economics II', filename: 'economics2.json' },
  { id: 'geog1', title: 'Optional: Geography I', filename: 'geography.json' },
  { id: 'geog2', title: 'Optional: Geography II', filename: 'geography2.json' },
  { id: 'hist1', title: 'Optional: History I', filename: 'history1.json' },
  { id: 'hist2', title: 'Optional: History II', filename: 'history2.json' },
  { id: 'psir1', title: 'Optional: PSIR I', filename: 'psir1.json' },
  { id: 'psir2', title: 'Optional: PSIR II', filename: 'psir2.json' },
  { id: 'pubad1', title: 'Optional: Public Admin I', filename: 'public admin1.json' },
  { id: 'pubad2', title: 'Optional: Public Admin II', filename: 'public admin2.json' },
  { id: 'socio1', title: 'Optional: Sociology I', filename: 'sociology1.json' },
  { id: 'socio2', title: 'Optional: Sociology II', filename: 'sociology2.json' }
];

// 2. THE PRODUCTS (The Bundles)
// This is required for the new "Enrollment" logic to work
export const EXAM_BUNDLES = [
  {
    id: 'upsc-civil-services',
    title: 'UPSC Civil Services',
    description: 'Complete package: Prelims, GS Mains 1-4, and all major Optionals.',
    paperIds: [
      'prelims-gs', 'csat', 
      'gs1', 'gs2', 'gs3', 'gs4',
      'anthro1', 'anthro2', 'econ1', 'econ2', 'geog1', 'geog2',
      'hist1', 'hist2', 'psir1', 'psir2', 'pubad1', 'pubad2', 'socio1', 'socio2'
    ]
  },
  {
    id: 'ssc-exams',
    title: 'SSC Combined (CGL/CHSL)',
    description: 'Includes Tier I and Tier II syllabus for all major SSC posts.',
    paperIds: ['ssc']
  },
  {
    id: 'banking-exams',
    title: 'Banking & Insurance',
    description: 'Comprehensive syllabus for IBPS PO, SBI, and RBI Grade B.',
    paperIds: ['banking']
  }
];