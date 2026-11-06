// ===== โปรเจคเกม =====
// ข้อมูลดึงจาก Obsidian vault (projects/*/README.md) — ช่องที่ยังไม่รู้ใส่ TODO ไว้
// cover: รูปปก ใน public/projects/ (ตอนนี้เป็น title card ที่ทำใน Figma — เปลี่ยนเป็นภาพเกมจริงได้) · youtube: video id
export type Project = {
  id: string
  code: string
  title: string
  subtitle: string
  status: 'RELEASED' | 'IN DEVELOPMENT' | 'PROTOTYPE' | 'GAME JAM' | 'CONCEPT'
  genre: string
  engine: string
  role: string
  team: string
  year: string
  cover?: string
  youtube?: string
  summary: string
  features: string[]
  links: { label: string; url: string }[]
}

export const projects: Project[] = [
  {
    id: 'trust-me-bro',
    cover: 'projects/trust-me-bro.webp', // key-visual title card (Figma), not a gameplay shot
    code: 'OP-01',
    title: 'Trust Me, Bro',
    subtitle: 'อาการหนักนะพี่ · Bro Studio',
    status: 'GAME JAM',
    genre: 'PC-building · Comedy',
    engine: 'Unity · C#',
    role: 'UI, visuals, camera, systems, assembly gameplay · 70+ Blender models',
    team: '3 คน · 11 วัน', // TODO: fact-check
    year: '2026', // TODO
    summary: 'เกมประกอบคอมที่แกล้งลูกค้าได้ — ไอเดียตั้งต้นของพี่นะโม หนูออกแบบ UI ภาพ กล้อง ระบบ และเกมเพลย์การประกอบ ทำโมเดลใน Blender 70+ ชิ้น และเขียน C# โค้ดเริ่มจากก้อนเดียวแล้วค่อยแยกเป็น OOP ทีหลัง',
    features: ['IInteractable — ระบบหยิบ/ใส่ชิ้นส่วน', 'ShopWallet + event Changed', 'PartCatalog → Knockoffs.Make (ของปลอม)', 'ไปป์ไลน์ Blender → IoTBench'],
    links: [],
  },
  {
    id: 'blurred-room',
    cover: 'projects/blurred-room.webp', // key-visual title card (Figma), not a gameplay shot
    code: 'OP-02',
    title: 'The Blurred Room',
    subtitle: 'หอพักที่คนหายไปทีละคน',
    status: 'IN DEVELOPMENT',
    genre: 'First-person · Thai psychological horror',
    engine: 'Unity 6 · URP',
    role: 'Team member (scene ThanYo)',
    team: 'Nate · ออมบุญ · Thanyo',
    year: '2026',
    summary: 'ผู้ดูแลหอพักเก่าในกรุงเทพฯ ต้องพาผู้เช่า 6 คนรอดให้ครบ 3 คืน กลางวันสืบ กลางคืนเฝ้ากล้องวงจรปิด เจ้าของหอคนเก่าเคยทำพิธีเพื่อ "เก็บคนไว้ในตึก" แต่พิธีเพี้ยน',
    features: ['วันละ 4 แอ็กชัน: สำรวจ ถ่ายรูป สัมภาษณ์', 'กระดานสืบสวน ปลดล็อกความจริงทีละชิ้น', 'กล้องวงจรปิด 3 ตัว จับความผิดปกติ', 'กฎเคาะประตู แยกคนจริง/ไม่ใช่คน'],
    links: [],
  },
  {
    id: 'afo-coop',
    cover: 'projects/afo-coop.webp', // key-visual title card (Figma), not a gameplay shot
    code: 'OP-03',
    title: 'All-For-One · Co-op',
    subtitle: 'ส่วน co-op ที่หนูทำ',
    status: 'IN DEVELOPMENT',
    genre: 'Online co-op · 3 players',
    engine: 'Unity 6 · Netcode for GameObjects · Relay',
    role: 'Co-op systems, lobby, map (in Assets/_Thanyo)',
    team: 'Team project',
    year: '2026',
    summary: 'ระบบเล่นออนไลน์ 3 คนด้วยโค้ดห้อง แต่ละคนได้บทบาทไม่ซ้ำ — คนตาบอด คนหูหนวก คนพูดอู้อี้ — แล้วต้องช่วยกันหนีออกจากห้างที่ไฟไหม้',
    features: ['Lobby + Ready + เลือกบทบาท sync ทุกเครื่อง', 'Unity Relay เล่นข้ามเน็ตด้วยโค้ดห้อง', 'อัปโหลดรูปหน้าใส่ตัวละคร Chibi', 'Editor script สร้างแมพห้างอัตโนมัติ'],
    links: [],
  },
  {
    id: 'afterglow',
    cover: 'projects/afterglow.webp', // key-visual title card (Figma), not a gameplay shot
    code: 'OP-04',
    title: 'City of Soul',
    subtitle: 'AFTERGLOW',
    status: 'PROTOTYPE',
    genre: '3D first-person story adventure',
    engine: 'Unity · ProBuilder blockout',
    role: 'Design · level blockout', // TODO: บทบาทจริง
    team: 'Team (Poon — systems)',
    year: '2026',
    summary: 'เด็กชายโคม่าตกลงไปในเมืองแห่งวิญญาณเพื่อตามหาแม่ โดยมีวิญญาณในสร้อยคอเป็นเพื่อนร่วมทาง เดโม 15–25 นาที สไตล์ยุโรปผสมไทย',
    features: ['สำรวจ + parkour + puzzle', 'บอสแบบไม่ต่อสู้', 'ปราสาท 8–10 ห้อง แบบ hub + กุญแจ', 'ตลาดวิญญาณ คลอง ซอยแคบ ศาลเจ้า'],
    links: [],
  },
  {
    id: 'dragon-racing',
    cover: 'projects/dragon-racing.webp', // key-visual title card (Figma), not a gameplay shot
    code: 'OP-05',
    title: 'Dragon Racing',
    subtitle: 'working title',
    status: 'CONCEPT',
    genre: 'Online racing · 6 players',
    engine: 'Unity 6 · URP',
    role: 'Solo',
    team: 'Thanyo',
    year: '2026',
    summary: 'แข่งความเร็วบนหลังมังกรคู่หูผ่านโลกแฟนตาซีสีสด เล่นกับเพื่อน สไตล์ anime cel-shaded ด่านแรก Ring Canyon บินลอดวงแหวนหิน',
    features: ['Boost · Drift · Dive', 'กล้อง 3rd-person chase', 'KB+mouse และ gamepad', 'ไฟพ่น = เอฟเฟกต์ล้วน ไม่มีต่อสู้'],
    links: [],
  },
]
