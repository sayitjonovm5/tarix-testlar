# 📜 Tarix Testlari – 11-sinf (O‘zbekiston tarixi & Jahon tarixi)

11-sinf maktab o‘quvchilari va abituriyentlar uchun yangi 2025-yilgi darsliklar asosida yaratilgan interaktiv, zamonaviy va qulay MCQ test platformasi.

---

## 🌟 Asosiy Xususiyatlar

1. **Tanlangan 19 mavzu bo‘yicha 570 ta savol**:
   - **O‘zbekiston tarixi**: 9 ta mavzu, 270 ta savol
   - **Jahon tarixi**: 10 ta mavzu, 300 ta savol
   - 570 savollik to‘plam 2025-yilgi darsliklarning tanlangan mavzulari asosida tuzilgan.
   - Har bir mavzuda **30 ta savol: 10 ta oson, 10 ta o‘rta va 10 ta qiyin**. Mavzu sahifasida daraja tanlab, mashq yoki imtihon rejimida ishlash mumkin.
   - Oson: asosiy faktlar; o‘rta: tafsilotlar va tushunchalar; qiyin: ketma-ketlik, taqqoslash va sabab–oqibat.

2. **Ikki xil o‘rganish rejimi**:
   - 📖 **Mashq rejimi (Practice Mode)**: Har bir tanlangan javobdan so‘ng to‘g‘ri yoki noto‘g‘ri ekanligi darhol yashil/qizil rangda ko‘rsatiladi. Vaqt cheklovisiz erkin o‘rganish.
   - ⏱️ **Imtihon rejimi (Exam Mode)**: Har bir savol uchun 60 soniyali orqaga hisoblovchi taymer, savollar bo‘yicha tezkor o‘tish paneli (Question Palette), javoblarni erkin o‘zgartirish imkoniyati va yakuniy natijalar.

3. **🔀 Aralash test (Mixed Test)**:
   - Faqat O‘zbekiston tarixi bo‘yicha aralash test (10, 20, 30 ta yoki barcha 270 ta)
   - Faqat Jahon tarixi bo‘yicha aralash test (10, 20, 30 ta yoki barcha 300 ta)
   - Umumiy tarix bo‘yicha aralash test (15, 30, 50 ta yoki barcha 570 ta)

4. **📊 Aniq va Ko‘rgazmali Natijalar (Green & Red Statistic Bars)**:
   - Katta foiz ko‘rsatkichi va kasr (masalan: `9 / 10 ta to‘g‘ri (90%)`)
   - Yashil va qizil rangli statistik vizual progress bar
   - Sarflangan vaqt hisoblagichi
   - Savollar tahlili filtri: *Barchasi*, *Faqat xatolar*, *Faqat to‘g‘ri javoblar*

5. **⚠️ "Xatolarim" Banki**:
   - Siz xato qilgan savollar avtomatik ravishda qurilmangiz xotirasiga yozib boriladi.
   - Yuqori paneldagi nishon (badge) orqali xatolar sonini ko‘rib turish mumkin.
   - *"Xatolarni ishlash"* tugmasi orqali faqat adashgan savollaringiz ustida alohida mashq qilish imkoniyati.
   - Xato savolga keyingi safar to‘g‘ri javob berilganda, u xatolar ro‘yxatidan avtomatik o‘chiriladi.

6. **🌓 Kunduzgi va Kechki rejim (Light / Dark Mode)**:
   - Ko‘zni toliqtirmaydigan issiq qog‘oz va quyuq minimalist ranglar palitrasi.
   - Silliq va chiroyli animatsiyali almashtirish tugmasi.
   - Tanlangan rejim eslab qolinadi.

7. **🔊 Ovozli effektlar (Web Audio API)**:
   - Hech qanday tashqi fayllarsiz brauzerning o‘zida ishlovchi yoqimli chertish, to‘g‘ri va noto‘g‘ri ovozlari.
   - Yuqori paneldan ovozni bitta tugma bilan yoqish/o‘chirish mumkin.

8. **⌨️ Klaviatura orqali boshqarish**:
   - `A`, `B`, `C`, `D` — variantlarni tanlash
   - `O‘ng strelka` yoki `Enter` — keyingi savolga o‘tish
   - `Chap strelka` — oldingi savolga qaytish

9. **💾 100% Mahalliy (Offline-First, Ma'lumotlar bazasisiz)**:
   - Hech qanday server yoki ma'lumotlar bazasi talab etilmaydi.
   - Barcha natijalar va xatolar `localStorage`da saqlanadi.
   - Internet bo‘lmaganda ham to‘liq ishlaydi.

---

## 🚀 GitHub Pages orqali bepul joylash (Hosting)

Ushbu loyiha 100% statik fayllardan (HTML, CSS, JS) iborat bo‘lgani uchun uni GitHub Pages orqali 1 daqiqada butun dunyoga bepul e'lon qilishingiz mumkin:

1. **GitHub**da yangi ochiq (Public) repozitoriy oching (masalan, `tarix-testlari`).
2. Loyiha papkasidagi 5 ta faylni ushbu repozitoriyga yuklang:
   - `index.html`
   - `style.css`
   - `data.js`
   - `app.js`
   - `uzb-flag.png`
3. Repozitoriy sozlamalariga kiring: **Settings** → **Pages** (chap menyuda).
4. **Branch** bo‘limida `main` (yoki `master`) tarmog‘ini va `/ (root)` papkasini tanlab, **Save** tugmasini bosing.
5. 1 daqiqa ichida sizga havola beriladi:  
   `https://<username>.github.io/tarix-testlari/`

Saytingiz butunlay bepul va cheklovlarsiz ishlaydi!

## Savollar bazasini tekshirish

Node.js bilan: `node --test tests/question-bank.test.cjs`.

`data.js` dagi har bir savolda `difficulty` (`easy`, `medium`, `hard`) va mavzu ichidagi `number` (1–30) bor. Avvalgi 190 savolning ID raqamlari saqlangan, yangi savollar 191–570 ID raqamlarini olgan. Shu sababli oldingi xatolar bankidagi ID raqamlari boshqa savolga biriktirilmaydi. Variantlar va javob harflari 570 savollik to‘plamga moslangan; oldin saqlangan xatolar o‘z variantlari bilan ishlashda davom etadi.

Daraja bo‘yicha testlar umumiy statistikaga qo‘shiladi, lekin mavzuning barcha darajalar bo‘yicha eng yaxshi natijasini almashtirmaydi.
