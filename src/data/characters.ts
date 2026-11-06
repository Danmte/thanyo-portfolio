// ===== โมเดลตัวละคร =====
// ใส่ไฟล์ .glb ไว้ใน public/models/ แล้วใส่ model: 'models/ชื่อไฟล์.glb'
// ถ้ายังไม่มี model จะโชว์หุ่นตัวอย่างแทน (placeholder: 'knight' | 'mage' | 'drone')
export type Character = {
  id: string
  name: string
  title: string
  description: string
  model?: string
  avatar?: string // รูปไอคอนในรายชื่อ (public/)
  defaultClip?: string // ชื่อแอนิเมชันที่จะเล่นตอนเปิด (ไม่ใส่ = อันแรก)
  placeholder?: 'knight' | 'mage' | 'drone'
  color: string
  stats: { label: string; value: number }[] // 0–100
  specs: { label: string; value: string }[]
  tools: string[]
}

export const characters: Character[] = [
  {
    id: 'undertaker',
    name: 'UNDERTAKER', // TODO: ชื่อจริงของตัวละคร
    title: 'Gothic Swordswoman',
    description: 'ตัวละครหลัก — rig Unity Humanoid 165 กระดูก พร้อม face rig (blendshape) และแอนิเมชัน Idle กับเดิน Horse Catwalk ที่ทำเอง',
    model: 'models/character.glb',
    avatar: 'art/undertaker_bust.webp',
    defaultClip: 'Idle',
    color: '#b69cff',
    stats: [
      { label: 'Detail', value: 85 },
      { label: 'Topology', value: 70 },
      { label: 'Texturing', value: 80 },
      { label: 'Rigging', value: 88 },
    ],
    specs: [
      { label: 'Tris', value: '~55,000' },
      { label: 'Textures', value: '2048² (web)' },
      { label: 'Rig', value: 'Unity Humanoid · 165 bones' },
      { label: 'Face', value: '41 blendshapes' },
      { label: 'Clips', value: 'Idle · Horse Catwalk' },
    ],
    tools: ['Blender', 'Tripo', 'Unity'],
  },
  {
    id: 'vanguard',
    name: 'VANGUARD',
    title: 'Frontline Unit',
    description: 'ตัวละครตัวอย่าง — เปลี่ยนเป็นโมเดลของตัวเองได้ใน src/data/characters.ts',
    placeholder: 'knight',
    color: '#4de3ff',
    stats: [
      { label: 'Detail', value: 82 },
      { label: 'Topology', value: 74 },
      { label: 'Texturing', value: 68 },
      { label: 'Rigging', value: 60 },
    ],
    specs: [
      { label: 'Tris', value: '24,500' },
      { label: 'Textures', value: '2048² PBR' },
      { label: 'Rig', value: 'Humanoid' },
    ],
    tools: ['Blender', 'Substance Painter', 'Unity'],
  },
  {
    id: 'oracle',
    name: 'ORACLE',
    title: 'Arcane Support',
    description: 'ตัวละครตัวอย่างสายเวท — ใส่แนวคิดการออกแบบ แรงบันดาลใจ หรือ workflow',
    placeholder: 'mage',
    color: '#c58bff',
    stats: [
      { label: 'Detail', value: 70 },
      { label: 'Topology', value: 80 },
      { label: 'Texturing', value: 77 },
      { label: 'Rigging', value: 55 },
    ],
    specs: [
      { label: 'Tris', value: '18,200' },
      { label: 'Textures', value: '1024² Stylized' },
      { label: 'Rig', value: 'Humanoid + Cloth' },
    ],
    tools: ['Blender', 'Krita'],
  },
  {
    id: 'sentry',
    name: 'SENTRY-07',
    title: 'Recon Drone',
    description: 'โมเดลตัวอย่างแบบ hard-surface — ลองลากหมุน ซูม และกดดู wireframe',
    placeholder: 'drone',
    color: '#ffb547',
    stats: [
      { label: 'Detail', value: 65 },
      { label: 'Topology', value: 88 },
      { label: 'Texturing', value: 60 },
      { label: 'Rigging', value: 40 },
    ],
    specs: [
      { label: 'Tris', value: '6,800' },
      { label: 'Textures', value: '1024² Trim' },
      { label: 'Rig', value: 'Mechanical' },
    ],
    tools: ['Blender', 'Unity'],
  },
]
