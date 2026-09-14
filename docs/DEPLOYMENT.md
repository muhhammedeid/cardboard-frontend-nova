# نشر Nova في الإنتاج / UAT

**Nova هي الواجهة الأمامية المعتمدة** (قرار صاحب المنتج). الواجهة القديمة `frontend/` **أُخرجت من
مستودع الـbackend** ونُقلت إلى `D:\Mohamed\cardboard-bench\legacy-frontend\` — لا تُخدَم ولا تُبنى،
و`root` في الوصفة أدناه يشير إلى حزمة Nova وحدها.

الواجهة **تُستضاف على نفس أصل Frappe** (same origin). هذا ليس تفضيلًا جماليًا: كوكي جلسة Desk تُرسل بنطاق
المضيف، وهيدر `Host` هو ما يحدّد السايت في Frappe — وكلاهما يعمل فقط عند نفس الأصل.

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
ls dist            # index.html + favicon.svg + nova/
grep -o 'VITE_API_MODE[^,)]*' dist/nova/index-*.js | head -2   # يجب أن يظهر real فقط
```

- الأصول تُبنى تحت **`/nova/`** (`build.assetsDir`) وليس `/assets/` — لأن Frappe يخدم أصوله هو من
  `/assets/<app>/…` على نفس الأصل، وأي تعارض يكسر لوحة Desk.
- بناء بـ`VITE_API_MODE=mock` في وضع الإنتاج **يفشل عن قصد** (`config.ts`) حتى لا تُنشر بيانات تجريبية بالخطأ.

## 2. الاستضافة (nginx — نفس أصل السايت)

Frappe يبقى مالكًا لمساراته، وNova تخدم `/` و`/nova/` فقط:

```nginx
server {
    listen 443 ssl;
    server_name cardboard.localhost;

    root /var/www/nova;          # محتوى dist/
    index index.html;

    # مسارات Frappe: API، تسجيل الدخول، لوحة Desk، وحدة الطباعة، الملفات، وأصول Frappe.
    location ~ ^/(api|app|login|printview|files|private|assets)(/|$) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;          # ← السطر الحرج: يحدد السايت والجلسة
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # حزمة Nova المُجزّأة: تخزين سنة كاملة آمن.
    location /nova/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location = /index.html { add_header Cache-Control "no-cache"; }

    # SPA: أي مسار غير ملف فعلي يعود إلى index.html
    location / { try_files $uri $uri/ /index.html; }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

`proxy_set_header Host $host;` هو السطر الحرج: بدون تمرير المضيف الأصلي يصل الطلب إلى Frappe بلا سايت فترد كل
دوال التطبيق `is not whitelisted` (وليس خطأ صلاحيات). و`/printview` **يجب** أن يصل إلى Frappe، وإلا فتح زر
«طباعة الكارتة» صفحة الواجهة نفسها بدل الكارتة.

## 3. تسجيل الدخول والجلسة

- المستخدم يفتح `https://cardboard.localhost/` (نفس أصل Desk) → كوكي الجلسة نفسه صالح للواجهة والـDesk.
- عند انتهاء الجلسة تعرض Nova شاشة «انتهت جلسة الدخول» مع زر يعيده إلى `/login?redirect-to=<المسار>` ثم يعود
  إلى نفس الشاشة (والمسار مجهّز في بروكسي التطوير أيضًا).
- رمز CSRF يُجلب من `session.get_session_context` عبر **GET** ويُجدَّد تلقائيًا مرة واحدة إذا رفضه الخادم.

### 3.1 عمر الجلسة — مضبوط الآن: **مفتوحة دائمًا**

المرجع الفعلي ليس `System Settings` وحده، بل سجل `DefaultValue` بالمفتاح `session_expiry` (parent `__default`)،
لأن `frappe.sessions.get_expiry_period()` يقرأه من `frappe.defaults.get_global_default`. حقل System Settings
يبقى للعرض/التحقق فقط — فحدّث الاثنين معًا حتى لا يختلف ما تراه في الواجهة عمّا ينفّذه الخادم.

السلوك: العمر **مهلة خمول** (`now - last_updated > expiry` تُبطل الجلسة) وتُجدَّد مع كل طلب، فالمستخدم النشط لا
يُفصل أبدًا. القيمة الحالية `87600:00` = 10 سنوات.

```bash
S=cardboard.localhost
# القيمة الفعّالة
bench --site $S execute frappe.db.get_value --kwargs "{'doctype':'DefaultValue','filters':{'defkey':'session_expiry'},'fieldname':'defvalue'}"
bench --site $S execute frappe.sessions.get_expiry_period          # "87600:00:00"
bench --site $S execute frappe.sessions.get_expiry_in_seconds      # 315360000

# التغيير (طريقة الواجهة نفسها) ثم تفريغ كاش الافتراضيات فقط — بلا إعادة تشغيل ولا إنزال جلسات
bench --site $S execute frappe.defaults.set_default --kwargs "{'key':'session_expiry','value':'87600:00','parent':'__default'}"
bench --site $S execute frappe.db.set_single_value --kwargs "{'doctype':'System Settings','fieldname':'session_expiry','value':'87600:00'}"
bench --site $S execute frappe.cache_manager.clear_defaults_cache --args "['__default']"
```

- **لا تستخدم `bench clear-cache`** لتطبيق هذا التغيير: يمحو الكاش العام، والمحتاج هنا هو كاش الافتراضيات فقط.
- للرجوع إلى 7 أيام: نفس الأمر بالقيمة `170:00`. وللإنتاج، مدة أصغر (مثلًا `720:00` = 30 يومًا) تحصر أثر
  الجهاز المتروك مفتوحًا.

> تحذير أمني مقصود: مع `87600:00` يبقى أي متصفح مسجَّل دخوله صالحًا حتى بعد سنوات من عدم الاستخدام، ما لم
> يسجّل المستخدم خروجًا أو يُبطَل من `User` → «إبطال الجلسات». هذا مناسب لمرحلة التشغيل/الاعتماد الحالية؛
> قرّر المدة النهائية للإنتاج بوضوح.

## 4. تشغيل معاينة بشكل الإنتاج (بلا nginx)

`serve.py` يخدم حزمة مبنية ويعمل كوكيل لنفس الأصل — يمرّر `Host` ويوجّه مسارات Frappe كما في الوصفة أعلاه:

```bash
python serve.py 5200 --dist dist --proxy http://127.0.0.1:8000 --host-header cardboard.localhost
# ثم افتح http://cardboard.localhost:5200   (وشغّل الطباعة من كارتة توريدة للتأكد من /printview)
```

## 5. التشغيل في التطوير

```bash
npm run dev        # real mode → http://cardboard.localhost:5173 (البروكسي يمرّر /api و/login و/app و/printview)
npm run dev:mock   # mock mode  → http://cardboard.localhost:5180 (بلا خادم)
```

## 6. قائمة تحقق النشر

1. `npm run typecheck && npm run lint && npm test && npm run build` كلها خضراء.
2. فتح الواجهة على مضيف السايت → بيانات حقيقية (لا mock).
3. زر «طباعة الكارتة» يفتح تذكرة الوزن (لا صفحة الواجهة).
4. انتهاء الجلسة مقصودًا → شاشة إعادة الدخول، وبعد الدخول يعود لنفس المسار.
5. إيقاف الـbackend → شاشة «تعذر الاتصال بالخادم» وتعود بعد إعادته (لا شاشة بيضاء).
6. مسودة توريدة/مصروف/دفعة لا تغيّر أي مجموع، ويظهر زر التعديل في صفها فقط.
7. مراجعة عربية/بصرية للثيمين (فاتح/داكن) من مالك المنتج.
