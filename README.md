# THANYO — Portfolio

เว็บพอร์ตแบบเลื่อนลง (ตามดีไซน์ Figma "Web — THANYO Studio"): Hero + ผลงาน + 3D Studio (โมเดลจริงหมุนได้) + Gallery + About + ติดต่อ
และหน้า `/studio` สำหรับดูโมเดลแบบเต็มจอ

```bash
npm install
npm run dev      # http://localhost:5173  ← แก้เว็บได้จากในเบราว์เซอร์
npm run build    # ไฟล์เว็บอยู่ใน dist/ เอาไปขึ้น GitHub Pages / Netlify / itch.io ได้
```

## 3 เวอร์ชัน: พอร์ต CAMT / พอร์ตลาดกระบัง / ส่วนตัว
โค้ดชุดเดียวกัน แต่เนื้อหาแยกไฟล์กัน แก้อันหนึ่งไม่กระทบอีกอัน

| | พอร์ต CAMT มช. | พอร์ต KMITL IT (ลาดกระบัง) | ส่วนตัว |
|---|---|---|---|
| เนื้อหา | `src/content/site.json` | `src/content/site.kmitl.json` | `src/content/site.personal.json` |
| รันแก้ไข | `npm run dev` → :5173 | `npm run dev:kmitl` → :5176 | `npm run dev:personal` → :5174 |
| build | `npm run build` → `dist/` | `npm run build:kmitl` → `dist/kmitl/` | `npm run build:personal` → `dist/me/` |
| บน GitHub Pages | `…/` | `…/kmitl/` | `…/me/` |

- `npm run build:all` build ทุกอัน (GitHub Actions ใช้คำสั่งนี้)
- ผลงานที่มีช่อง `demo` (เช่น Live Avatar → `public/avatar/`) จะมีปุ่ม **▶ กดเล่น · เปิดกล้อง** เล่นในหน้าเว็บได้เลย · ตัว tracker ต้นฉบับอยู่ที่ `ForUse\Portfolio\WEBCAM` แก้แล้วคัดลอก `Webส่วนตัว\avatar\` มาทับ `public/avatar/`
- `npm run build:personal-offline` → `dist/personal-offline/` = เว็บส่วนตัวที่**ดับเบิลคลิก `index.html` เปิดได้เลย** ไม่ต้องมีเซิร์ฟเวอร์ (โค้ดเป็นสคริปต์ธรรมดา + โมเดล 3D ฝังอยู่ใน `models.js`, ดู `offline.plugin.ts`) — ตัวที่ใช้ใน `ForUse\Portfolio\Webส่วนตัว`
- เวอร์ชันส่วนตัวใช้โทนสีอุ่น (coral) ภาษาสบาย ๆ ("เรา") ไม่มีข้อมูลโรงเรียน/เป้าหมายคณะ และมีลิงก์ "Portfolio" กลับไปพอร์ตในช่องติดต่อ
- รูป/โมเดลใน `public/` ใช้ร่วมกันทั้งสองเวอร์ชัน · draft ที่ยังไม่บันทึกแยกกัน

## Home (หน้าแรกส่วนตัว — อยู่ในเครื่องเท่านั้น)
แอปแยกใน `home/` · `npm run dev:home` (:5175) · `npm run build:home` → `dist/home/index.html` **ไฟล์เดียว** (คัดลอกไปที่ `ForUse\Portfolio\Webส่วนตัว\Home.html`)

มี: ค้นหา Google / ถาม Claude (เปิด claude.ai) · เควสรายวัน (ตั้งเองได้ เลือกวันได้) + เป้าหมาย + แต้ม/เลเวล/สตรีค/แลกรางวัล · ปฏิทิน · โน้ต · คลังโมเดล (ดู .glb 3D ได้) + โปรเจกต์เกม (เชื่อมโฟลเดอร์จริงในเครื่อง) · เว็บโปรดแบ่งหมวด (การ์ดห้อยเชือก เลื่อนแบบ dynamic) · GitHub · โปรไฟล์ · ตั้งค่าความปลอดภัย

ความปลอดภัย:
- ข้อมูลทั้งหมดเข้ารหัส AES-256-GCM ด้วยรหัสผ่าน (PBKDF2 600k รอบ) เก็บใน IndexedDB ของเบราว์เซอร์ — **ลืมรหัส = กู้ไม่ได้** (สำรองไฟล์ได้ที่หน้าตั้งค่า)
- โค้ดทั้งหมดฝังในไฟล์เดียว + CSP อนุญาตเฉพาะสคริปต์ที่ hash ตรง, Trusted Types, ติดต่อได้แค่ `api.github.com`
- ล็อกอัตโนมัติเมื่อไม่ใช้, ใส่รหัสผิดต้องรอนานขึ้น, ลิงก์เปิดได้เฉพาะ http/https
- ไฟล์ที่เกี่ยวข้อง: `vite.home.config.ts` (build + CSP), `home/src/lib/vault.ts` (เข้ารหัส), `home/src/lib/folders.ts` (โฟลเดอร์ในเครื่อง)

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
