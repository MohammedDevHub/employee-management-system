# LOFA BEAUTY — Phase 1 (Foundation)

ده الأساس اللي كل حاجة تانية في المشروع هتتبني عليه: Auth + RBAC + Data Scope +
Database Schema الكاملة لأول 4 مراحل (Users/Roles, CRM, Orders, Delivery,
Marketing جزئيًا) + **Frontend حقيقي (Next.js) تقدر تفتحه في المتصفح** — صفحة
Login + Dashboard + صفحة Leads شغالة ببيانات حقيقية من الـ API.

## القرارات الافتراضية اللي اتبنى عليها الكود ده

لحد ما تأكدهم أو تغيّرهم، الكود ماشي على:

1. **Confirmed Sale** = الـ Sales أكّد مع العميل، مش شرط يكون اتحصّل الفلوس.
2. **Delivered ≠ Paid تلقائي.** الدفع متتبّع في جدول `payments` منفصل.
3. **Delivery Fee داخل في `totalValue`** (Revenue)، لكن متسجل في عمود لوحده عشان
   نقدر نحسب Net Sales (من غير رسوم التوصيل) في أي وقت.
4. **Payment Method في الـ MVP: COD بس.** الجدول `payments` فيه `ONLINE` كخيار
   جاهز لما تحتاجه لاحقًا من غير Migration كبيرة.
5. **العملة: جنيه مصري، عملة واحدة بس** (مفيش جدول Currencies دلوقتي).

لو أي قرار من دول غلط بالنسبة لشغلك الفعلي، قولّي وهغيّره — التغيير في المرحلة دي
سهل، بعد ما يتبني عليه بيانات حقيقية هيبقى أصعب.

## هيكل المشروع

```
lofa-beauty/
  docker-compose.yml       # Postgres + Redis محليًا
  apps/
    api/                    # NestJS backend
      prisma/schema.prisma  # الـ Schema الكاملة (كل الجداول اللي اتفقنا عليها)
      prisma/seed.ts         # بيزرع الـ Roles + Permissions + Scopes + أول Super Admin
      src/
        auth/                # Login/Refresh/Logout + JWT Strategy
        auth/guards/
          jwt-auth.guard.ts       # بيتأكد إن فيه Token صالح
          permissions.guard.ts    # بيتأكد إن اليوزر عنده الـ Permission، وبيحل الـ Scope بتاعه
        common/scope/scope-filter.util.ts   # بيحول الـ Scope (OWN/TEAM/...) لـ Prisma WHERE
        users/               # مثال Module بسيط (COMPANY scope)
        leads/               # مثال Module كامل بيوضح إزاي الـ Scope بيشتغل عمليًا
    web/                     # Next.js frontend (Login + Dashboard + Leads)
      app/login               # صفحة تسجيل الدخول
      app/dashboard            # الـ Shell (Sidebar + Topbar) + صفحة Overview
      app/dashboard/leads       # أول صفحة بيانات حقيقية متصلة بالـ API
      lib/api.ts                # API client
      lib/auth-context.tsx        # الجلسة (Token + المستخدم الحالي)
```

## طريقة التشغيل (لو عندك Node 20+ و pnpm محليًا)

### 1) الـ Backend الأول

```bash
# شغّل Postgres + Redis
docker compose up -d

cd apps/api
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate      # هيسألك اسم للـ Migration، اكتب "init"
pnpm prisma:seed         # هيعمل الـ Roles/Permissions + Super Admin

pnpm dev
```

هيشتغل على `http://localhost:3001/api/v1`. سيبه شغال في الـ Terminal ده.

### 2) الـ Website (Frontend) — في Terminal تاني

```bash
cd apps/web
cp .env.local.example .env.local
pnpm install
pnpm dev
```

هيشتغل على **`http://localhost:3000`** — افتحه في المتصفح، ده الـ Website بتاعك.

سجّل دخول بالبيانات اللي عملها الـ seed:

```
Email:    admin@lofabeauty.com
Password: ChangeMe123!
```

(غيّر الباسورد ده أول حاجة بمجرد ما تعمل Users module فيها Change Password —
لسه مش مبني، هو مذكور في المرحلة الجاية).

هتلاقي: صفحة Login بالتصميم (Dark Royal Purple + Gold)، وبعد الدخول Dashboard
فيه Sidebar بكل الموديولات (اللي لسه مبنيش عليه حاجة متعلم عليه "soon")،
وصفحة **Leads** شغالة فعليًا وبتجيب بيانات حقيقية من الـ API محكومة بالـ Scope
بتاع اليوزر.

**ملاحظة:** الـ Admin اللي الـ seed عمله لسه معندوش Leads فعلية (الجدول فاضي)،
فهتشوف "No leads yet" — ده متوقع، مش Bug. لو حابب تجرب بيانات حقيقية، قولّي
وأعمل Endpoint بسيط لإضافة Lead من الـ Dashboard كجزء من Phase 2.

**تجربة الـ API لوحده (اختياري، من غير الـ Website):**

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lofabeauty.com","password":"ChangeMe123!"}'
```

## إزاي RBAC + Data Scope شغالين مع بعض (المنطق الأساسي)

1. `@RequirePermission('leads.read')` على أي Route بيقول "لازم يكون عندك
   الصلاحية دي".
2. `PermissionsGuard` بيدور على كل الـ Roles بتاعة اليوزر، ولو لقى صلاحية
   `leads.read`، بياخد الـ Scope المرتبط بيها (OWN / TEAM / DEPARTMENT /
   COMPANY / ASSIGNED / CAMPAIGN) — ولو عنده أكتر من Role بيسيب الأوسع.
3. الـ Scope ده بيتحط في `request.dataScope`.
4. الـ Service (زي `LeadsService`) بيستخدم `buildScopeWhere()` عشان يحوّل
   الـ Scope ده لفلتر حقيقي في الـ Query — Sales Rep هيشوف بياناته بس،
   Sales Manager هيشوف فريقه، Super Admin هيشوف كل حاجة، بنفس الـ Endpoint
   بالظبط وبنفس الكود.

كل موديول جديد (Orders, Delivery, Campaigns...) هيتبني بنفس الباترن ده بالظبط.

## الخطوة الجاية

بعد ما تجرب الموقع وتتأكد إنه شغال زي ما إنت عايز:

1. **Add Lead form** في الـ Dashboard — عشان تقدر تدخل بيانات حقيقية وتشوفها فورًا
2. **Orders Module** كامل (State Machine + Status History + Payments)
3. **Delivery Module** (Assignment + Agent mobile-friendly views)
4. **Audit Log Interceptor** عام يسجل أي عملية Write مهمة تلقائيًا

قولّي تحب نكمل بإيه الأول.
