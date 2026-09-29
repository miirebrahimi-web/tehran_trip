# 🗼 راه‌اندازی مینی‌اپ سفر تهران (۸ مرحله، بدون کدنویسی)

فقط اکانت می‌سازی، مقدارها رو کپی‌پیست می‌کنی و Deploy می‌زنی.

---

## مقدارهایی که بین مرحله‌ها لازم داری

| نام | از کجا میاد | نوع |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | مرحله ۲ (Project URL) | 🟢 عمومی |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مرحله ۲ (anon / publishable key) | 🟢 عمومی |
| `SUPABASE_SERVICE_ROLE_KEY` | مرحله ۲ (service_role / secret key) | 🔴 سری |
| `TELEGRAM_BOT_TOKEN` | مرحله ۱ (BotFather) | 🔴 سری |
| `TELEGRAM_WEBHOOK_SECRET` | خودت می‌سازی، مثلاً `tehran2026Trip9x8k7q` (فقط حرف انگلیسی، عدد، `_` و `-`) | 🔴 سری |

🔴 سری‌ها رو برای هیچ‌کس نفرست و توی گروه نذار.

---

## STEP 1 — ساخت ربات با BotFather

1. توی تلگرام `@BotFather` رو (با تیک آبی) باز کن و **Start** بزن.
2. بفرست: `/newbot`
3. اسم ربات: `سفر تهران`
4. یوزرنیم ربات (باید آخرش `bot` باشه)، مثلاً: `tehran_trip_2026_bot` (اگه گرفته شده بود یه عدد یا کلمه عوض کن)
5. BotFather یه **توکن** میده شبیه `123456789:AAxxxx...`. کپیش کن و جایی نگه دار ← این `TELEGRAM_BOT_TOKEN` توئه.

## STEP 2 — ساخت پروژه Supabase

1. برو به **supabase.com** ← Sign up (با GitHub یا ایمیل).
2. **New project** ← اسم: `tehran-trip` ← یه پسورد دیتابیس بذار (ذخیره‌ش کن) ← نزدیک‌ترین Region ← **Create new project**. حدود ۲ دقیقه صبر کن.
3. کلیدها رو بردار: از منوی چپ **Project Settings** (چرخ‌دنده) ← **API** (یا **API Keys**):
   - **Project URL** ← `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (یا Publishable key) ← `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (یا Secret key) ← `SUPABASE_SERVICE_ROLE_KEY`
   - اگه تب **Legacy API keys** دیدی، همون سه‌تا رو از اونجا بردار (سازگارترن).

## STEP 3 — اجرای یک فایل SQL

1. توی Supabase از منوی چپ **SQL Editor** ← **New query**.
2. فایل `supabase/schema.sql` رو باز کن، **همه‌ش** رو کپی کن و توی صفحه Paste کن.
3. **Run** بزن. باید بنویسه `Success. No rows returned`.

این یک فایل همه چیز رو می‌سازه: جدول‌ها، سفر پیش‌فرض، همه غذاها و مکان‌ها، و امنیت (RLS).
(برای چک کردن: **Table Editor** ← باید جدول‌های `food_options` و `location_options` پر باشن.)

## STEP 4 — آپلود پروژه و اتصال به Vercel

1. فایل ZIP پروژه رو **از حالت فشرده دربیار** (Extract).
2. برو به **github.com** ← Sign up ← **New repository** ← اسم: `tehran-trip` ← **Create repository**.
3. توی صفحه ریپازیتوری لینک **uploading an existing file** رو بزن، بعد **همه فایل‌ها و پوشه‌های داخل** پوشه استخراج‌شده (`app`، `components`، `lib`، `supabase`، `package.json` و ...) رو بکش و رها کن (نه خود ZIP رو). پایین صفحه **Commit changes**.
   - مهمه که `package.json` مستقیم توی ریشه ریپازیتوری باشه، نه داخل یه پوشه دیگه.
4. برو به **vercel.com** ← **Sign up with GitHub** ← **Add New… → Project** ← کنار `tehran-trip` روی **Import** بزن.
5. ⚠️ هنوز **Deploy** نزن. برو مرحله ۵.

## STEP 5 — اضافه کردن Environment Variables و Deploy

1. توی همون صفحه Import، بخش **Environment Variables** رو باز کن.
2. این ۵ تا رو یکی‌یکی اضافه کن (Name و Value، بعد **Add**):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
```

3. حالا **Deploy** بزن. حدود ۲ دقیقه صبر کن.
4. آدرس سایتت رو کپی کن، شبیه: `https://tehran-trip-xxxx.vercel.app`

> اگه متغیرها رو بعد از Deploy اضافه کردی: **Deployments ← سه‌نقطه ← Redeploy**.

## STEP 6 — تنظیم مینی‌اپ ربات در BotFather

1. توی `@BotFather` بفرست: `/mybots`
2. رباتت رو انتخاب کن ← **Bot Settings** ← **Configure Mini App** ← **Enable Mini App**.
3. وقتی URL خواست، آدرس Vercel رو بفرست (مثلاً `https://tehran-trip-xxxx.vercel.app`).

(دکمه منوی داخل چت خصوصی ربات توی مرحله ۸ خودکار تنظیم میشه.)

## STEP 7 — اضافه کردن ربات به گروه

1. گروه سفر رو باز کن (یا یه گروه جدید بساز).
2. **Add members** ← یوزرنیم رباتت رو سرچ کن ← اضافه‌ش کن. لازم نیست ادمین بشه.

## STEP 8 — تنظیم Webhook (فقط یک لینک)

1. توی مرورگر این آدرس رو باز کن (دو مقدار رو با مقدارهای خودت عوض کن):

```
https://آدرس-سایتت.vercel.app/api/setup?key=مقدار_TELEGRAM_WEBHOOK_SECRET
```

2. باید چند تا ✅ ببینی (وب‌هوک، دستورات ربات، دکمه منو، عکس مکان‌ها).
3. حالا **داخل گروه** بنویس: `/start` ← ربات یه دکمه «🚀 ورود به سفر تهران» میفرسته. همه اون رو می‌زنن، اسمشون رو وارد می‌کنن و رأی میدن.

این کار گروه رو هم برای ارسال نتایج ثبت می‌کنه.

---

## دستورات گروه

| دستور | کار |
|---|---|
| `/start` | دکمه ورود به مینی‌اپ |
| `/results` | ارسال نتایج فعلی (فقط درصدها) |
| `/plan` | ارسال برنامه نهایی سفر |
| `/participants` | تعداد و اسم شرکت‌کننده‌ها |

توی خود مینی‌اپ هم بخش «نتایج» دکمه «ارسال به گروه» داره.

---

## مشکل‌یابی سریع

- **«فقط داخل تلگرام کار می‌کنه»**: لینک رو توی مرورگر باز کردی. از دکمه ربات باز کن.
- **«متغیر محیطی … تنظیم نشده»**: مرحله ۵ رو چک کن و Redeploy بزن.
- **ارسال به گروه کار نمی‌کنه**: داخل گروه یک‌بار `/start` بفرست.
- **دکمه ورود توی گروه مینی‌اپ رو باز نمی‌کنه**: مرحله ۶ (Configure Mini App) رو چک کن.
- **عکس یه مکان اشتباهه یا نیست**: عکس‌ها خودکار از ویکی‌پدیای فارسی گرفته میشن. برای اصلاح: Supabase ← **Table Editor** ← `location_options` ← ستون `image_url` رو عوض کن. عکس نبودن مشکلی ایجاد نمی‌کنه (عکس جایگزین نشون داده میشه).
- **اگه آدرس vercel.app برای بعضی‌ها باز نمیشه**: توی Vercel ← Settings ← Domains یه دامنه شخصی اضافه کن و مرحله ۶ و ۸ رو با آدرس جدید تکرار کن.
- **Deploy با خطا تموم شد**: متن خطا رو برام بفرست.

## امنیت (خلاصه)

- هویت هر نفر فقط با `initData` امضاشده تلگرام روی سرور تأیید میشه، آیدی ارسالی از مرورگر هیچ‌وقت قبول نمیشه.
- توکن ربات و کلید service_role فقط سمت سرور هستن.
- جدول‌ها RLS دارن و مرورگر مستقیم بهشون دسترسی نداره. رأی تک‌تک افراد هیچ‌جا نمایش داده نمیشه، فقط مجموع و درصد.
