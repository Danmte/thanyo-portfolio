# THANYO — Portfolio

เว็บพอร์ตแบบเลื่อนลง (ตามดีไซน์ Figma "Web — THANYO Studio"): Hero + ผลงาน + 3D Studio (โมเดลจริงหมุนได้) + Gallery + About + ติดต่อ
และหน้า `/studio` สำหรับดูโมเดลแบบเต็มจอ

```bash
npm install
npm run dev      # http://localhost:5173  ← แก้เว็บได้จากในเบราว์เซอร์
npm run build    # ไฟล์เว็บอยู่ใน dist/ เอาไปขึ้น GitHub Pages / Netlify / itch.io ได้
```

## แก้เว็บเองในเบราว์เซอร์
1. `npm run dev` แล้วเปิด http://localhost:5173
2. กด **แก้ไขเว็บ** มุมขวาบน
   - **ข้อความ**: คลิกที่ข้อความ (มีเส้นประ) แล้วพิมพ์ได้เลย
   - **รูป**: ลากไฟล์รูปมาวางบนรูปไหนก็ได้ = เปลี่ยนทันที (หรือกด **เปลี่ยนรูป**) · ลากรูปหลายรูปไปวางที่ **+ เพิ่มภาพ** = เพิ่มเข้า Gallery · ในหน้าผลงาน ลากรูปมาวางที่ “ภาพจากงาน” = เพิ่มรูปให้งานนั้น
   - **ผลงาน / ภาพ / โมเดล**: ปุ่ม **แก้ไข** บนการ์ด → แก้ทุกช่อง, เพิ่มรูปหลายรูป, ลิงก์วิดีโอ, ↑↓ เรียงลำดับ, 🗑 ลบ
   - **เพิ่มใหม่**: ปุ่ม **+ เพิ่มผลงาน** / **+ เพิ่มภาพ** / **+ เพิ่มโมเดล** (อัปโหลดไฟล์ `.glb` ได้ในฟอร์ม)
   - **About / ช่องทางติดต่อ**: ปุ่ม **แก้ไขข้อมูล About ทั้งหมด** / **แก้ไขช่องทางติดต่อ**
3. กด **บันทึก** ที่แถบล่าง → เขียนลง `src/content/site.json` (สำรองไฟล์เก่า 10 ชุดใน `.cms-backup/`)
   ไฟล์ที่อัปโหลดไปอยู่ใน `public/media/uploads/` และ `public/models/uploads/`

ยังไม่ได้บันทึกก็ไม่หาย (เก็บเป็น draft ในเบราว์เซอร์) · บนเว็บที่ build แล้วเปิด `?edit` ได้ แต่จะบันทึกเป็นการดาวน์โหลด `site.json` แทน (เว็บ static ไม่มีเซิร์ฟเวอร์ให้เขียนไฟล์)

## โมเดล 3D
- ทุกโมเดลแสดงแบบ flat (ไม่มีแสง)
- ช่อง `clips` = ท่าที่โชว์ ตามลำดับ · `T-Pose` คือท่ายืนตั้งต้นของ rig (สร้างจากไฟล์ ไม่ต้อง export แยก) · ว่าง = ทุกท่าในไฟล์
- Undertaker: `T-Pose` + `Horse Catwalk`

## ไฟล์สำคัญ
- `src/content/site.json` — เนื้อหาทั้งเว็บ (ผลงาน, รูป, โมเดล, About, ติดต่อ)
- `src/content/store.tsx` · `Editable.tsx` — ระบบแก้ไขในเว็บ · `cms.plugin.ts` — endpoint บันทึก/อัปโหลด (เฉพาะ `npm run dev`)
- `src/pages/Home.tsx` · `Work.tsx` · `Studio.tsx` — หน้าเว็บ
- `src/components/Viewport.tsx` — ฉาก 3D + `toFlat()` + ท่า T-Pose · `StudioView.tsx` — viewer ในหน้าเว็บ
- `src/index.css` — สี/ฟอนต์ (ตรงกับ Figma variables "Studio Web")

วิธี export โมเดลจาก Blender ให้เล็กพอสำหรับเว็บ: Obsidian `knowledge/modeling/glb-web-export`
