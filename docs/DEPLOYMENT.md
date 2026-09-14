# نشر Nova في الإنتاج / UAT

الواجهة **تُستضاف على نفس أصل Frappe** (same origin). هذا ليس تفضيلًا جماليًا: كوكي جلسة Desk تُرسل
بنطاق المضيف، وهيدر `Host` هو ما يحدّد السايت في Frappe — وكلاهما يعمل فقط عند نفس الأصل.

---

## 1. البناء

```bash
cd ~/cardboard-frontend-nova
source ~/.nvm/nvm.sh
npm ci
cp .env.production.example .env.production
npm run build          # typecheck + vite build → dist/
```

التحقق من الحزمة قبل النشر:

```bash
grep -c "VITE_API_MODE" dist/assets/*.js    # يجب أن يظهر "real" فقط، ولا يظهر "mock"
```

بناء بـ`VITE_API_MODE=mock` في وضع الإنتاج **يفشل عن قصد** (`config.ts` يرمي خطأ عند الإقلاع) حتى لا
تُنشر بيانات تجريبية بالخطأ.

## 2. الاستضافة (nginx — نفس أصل السايت)

```nginx
server {
    listen 443 ssl;
    server_name cardboard.localhost;

    root /var/www/nova;          # محتوى dist/
    index index.html;

    # الأصول المُجزّأة تُخزَّن سنة كاملة؛ index.html بلا تخزين.
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # كل مسارات الـAPI تذهب للـbackend مع تمرير Host الأصلي.
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # SPA: أي مسار غير ملف فعلي يعود إلى index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

`proxy_set_header Host $host;` هو السطر الحرج: بدون تمرير المضيف الأصلي، يصل الطلب إلى Frappe بلا سايت
فترد كل دوال التطبيق `is not whitelisted` (وليس خطأ صلاحيات).

## 3. تسجيل الدخول والجلسة

- المستخدم يفتح `https://cardboard.localhost/` (نفس أصل Desk) → كوكي الجلسة نفسه صالح للواجهة والـDesk.
- عند انتهاء الجلسة تعرض Nova شاشة «انتهت جلسة الدخول» مع زر يعيده إلى `/login?redirect-to=<المسار>` ثم
  يعود إلى نفس الشاشة.
- رمز CSRF يُجلب من `session.get_session_context` عبر **GET** ويُجدَّد تلقائيًا مرة واحدة إذا رفضه الخادم.

## 4. تشغيل معاينة بشكل الإنتاج (نفس الأثر بلا nginx)

`serve.py` يخدم حزمة مبنية ويعمل كوكيل لنفس الأصل (يُعيد كتابة `Host` كما يفعل nginx):

```bash
python serve.py 5200 --dist dist --proxy http://127.0.0.1:8000 --host-header cardboard.localhost
# ثم افتح http://cardboard.localhost:5200
```

## 5. التشغيل في التطوير

```bash
npm run dev        # real mode → http://cardboard.localhost:5173
npm run dev:mock   # mock mode  → http://cardboard.localhost:5180 (بلا خادم)
```

## 6. قائمة تحقق النشر

1. `npm run typecheck && npm run lint && npm test && npm run build` كلها خضراء.
2. فتح الواجهة على مضيف السايت → تظهر بيانات حقيقية (لا mock).
3. انتهاء الجلسة مقصودًا → تظهر شاشة إعادة الدخول، وبعد الدخول يعود لنفس المسار.
4. إيقاف الـbackend → تظهر شاشة «تعذر الاتصال بالخادم» وتعود بعد إعادته (لا شاشة بيضاء).
5. مراجعة عربية/بصرية للثيمين (فاتح/داكن) من مالك المنتج.
