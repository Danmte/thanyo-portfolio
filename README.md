# THANYO — Game-style Portfolio (Neon Archive)

เว็บพอร์ตที่เล่นเหมือนเกม: Title → Menu (โลก 3D) → GAMES / MODELS / GALLERY / STATUS

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # ไฟล์เว็บอยู่ใน dist/ เอาไปขึ้น GitHub Pages / Netlify / itch.io ได้
```

## หน้าต่าง ๆ
| Route | หน้า |
|---|---|
| `/` | Title — โถงจอ 3D กล้องอยู่หลังตัวละคร กดปุ่มอะไรก็ได้ กล้องจะหมุนมาด้านหน้า |
| `/menu` | เมนูหลัก 3D — ลากเมาส์มองรอบ ๆ, ↑↓ เลือก, Enter เข้า |
| `/projects` | GAMES — การ์ดเกม + ข้อมูลจาก Obsidian vault |
| `/characters` | MODELS — viewer โมเดล (flat), timeline, wireframe |
| `/gallery` | ARCHIVE — งานภาพจริง |
| `/profile` | DOSSIER — แฟ้มประวัติ |

## แก้เนื้อหา (ไม่ต้องแตะ UI)
| อยากแก้ | ไฟล์ | สื่อ |
|---|---|---|
| ชื่อ สกิล ลิงก์ | `src/data/profile.ts` | `public/art/` |
| เกม | `src/data/projects.ts` | `public/projects/` (ตอนนี้เป็น title card จาก Figma) |
| โมเดล | `src/data/characters.ts` | `public/models/*.glb` |
| ภาพวาด | `src/data/artworks.ts` | `public/art/gallery/` |

ช่องที่ยังไม่รู้ข้อมูลจริงเขียน `TODO` ไว้ในไฟล์ data

## ไฟล์สำคัญ
- `src/components/MenuScene.tsx` — โลก 3D ของ title/menu (จอ, hologram shader, คริสตัล, วงแหวน, bloom)
- `src/components/CharacterStage.tsx` — viewer โมเดล + `toFlat()` (ทำให้ 3D เป็น flat)
- `src/lib/sfx.ts` — เสียง UI + ambient (สังเคราะห์ด้วย WebAudio)
- `src/index.css` — ธีม (สีอยู่ใน `:root`)

วิธี export โมเดลจาก Blender ให้เล็กพอสำหรับเว็บ: Obsidian `knowledge/modeling/glb-web-export`
