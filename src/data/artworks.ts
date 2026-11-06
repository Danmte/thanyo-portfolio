// ===== ภาพวาด / งานภาพ =====
// รูปอยู่ใน public/art/ · title ที่มี TODO = ชื่อชั่วคราว ตั้งชื่อจริงเองได้เลย
export type Artwork = {
  id: string
  title: string
  category: 'Illustration' | '3D' | 'Game Asset' | 'Process'
  year: string
  tools: string
  note: string
  image: string
  pixel?: boolean // pixel art → ขยายแบบไม่เบลอ
}

export const artworks: Artwork[] = [
  {
    id: 'coastal-town',
    title: 'Coastal Town', // TODO: ชื่อจริง
    category: 'Illustration',
    year: '2026',
    tools: 'Clip Studio Paint',
    note: 'ภาพวาดเต็ม 7016×4960 — วางองค์ประกอบด้วย golden ratio จากฉาก 3D ที่บล็อกไว้ก่อน',
    image: 'art/gallery/coastal-town.webp',
  },
  {
    id: 'undertaker-key',
    title: 'Undertaker — Key Art',
    category: '3D',
    year: '2026',
    tools: 'Blender · EEVEE',
    note: 'เรนเดอร์จากไฟล์ rig จริง (Unity Humanoid + face rig) ท่าจากแอนิเมชัน Horse Catwalk',
    image: 'art/undertaker_key.webp',
  },
  {
    id: 'composition-study',
    title: 'Composition Study',
    category: 'Process',
    year: '2026',
    tools: 'Blender',
    note: 'บล็อกฉากใน Blender + เส้น golden ratio ก่อนวาดทับเป็นภาพ Coastal Town',
    image: 'art/gallery/composition-study.webp',
  },
  {
    id: 'base-mesh',
    title: 'Character Base Mesh',
    category: 'Process',
    year: '2026',
    tools: 'Blender',
    note: 'ขั้นตอนโมเดลตัวละครก่อนใส่เสื้อผ้า',
    image: 'art/gallery/base-mesh.webp',
  },
  {
    id: 'lom-sprites',
    title: 'Lom — Sprite Sheet',
    category: 'Game Asset',
    year: '2026',
    tools: 'Pixel art',
    note: 'สไปรต์เดิน 4 ทิศของตัวละคร Lom (LomAtSchool2D)',
    image: 'art/gallery/lom-sprites.png',
    pixel: true,
  },
  {
    id: 'liminal-tree',
    title: 'LIMINAL — Tree',
    category: 'Game Asset',
    year: '2026',
    tools: 'Digital painting',
    note: 'asset ต้นไม้ของโปรเจกต์ LIMINAL',
    image: 'art/gallery/liminal-tree.webp',
  },
  {
    id: 'liminal-logs',
    title: 'LIMINAL — Logs',
    category: 'Game Asset',
    year: '2026',
    tools: 'Digital painting',
    note: 'asset กองท่อนไม้ของโปรเจกต์ LIMINAL',
    image: 'art/gallery/liminal-logs.webp',
  },
  {
    id: 'undertaker-bust',
    title: 'Undertaker — Portrait',
    category: '3D',
    year: '2026',
    tools: 'Blender · EEVEE',
    note: 'โคลสอัพหน้า — หน้าเป็น shape key face rig 41 แบบ',
    image: 'art/undertaker_bust.webp',
  },
]
