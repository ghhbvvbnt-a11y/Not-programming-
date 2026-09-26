/* ============================================================
   Not Programming — الواجهة
   ============================================================ */
import {
  onAuthChange, getMe,
  registerUser, loginUser, logoutUser, resetPassword,
  updateMyProfile, uploadProfilePhoto,
  logActivity, watchActivity, watchStudents,
  watchCourses, addCourse, deleteCourse, getCourse, uploadCourseImage,
  addCourseContent, deleteCourseContent, watchCourseContent,
  enrollCourse, watchMyEnrollments, grantCourseAccess,
  uploadPaymentProof, watchPayments, updatePaymentStatus,
  addExam, deleteExam, watchExams, submitExam, watchExamResults, watchMyResults,
  getSettings, setSettings, askAI,
} from "./firebase.js";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $("#app");

function toast(msg, type = "") {
  const t = document.createElement("div");
  t.className = "toast " + type; t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 3600);
}
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = ts => { try { return ts?.toDate?.().toLocaleString("ar-EG") || ""; } catch { return ""; } };
const fmtDate = ts => { try { return ts?.toDate?.().toLocaleDateString("en-US") || "-"; } catch { return "-"; } };
const initials = n => (n || "؟").trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("");

let unsubs = [];
const cleanSubs = () => { unsubs.forEach(u => { try { u(); } catch {} }); unsubs = []; };
const sub = u => { if (typeof u === "function") unsubs.push(u); };

let route = "home";
window.addEventListener("hashchange", () => { route = (location.hash || "#home").slice(1); render(); });

/* ================= الهيدر ================= */
function renderHeader() {
  const me = getMe();
  $("#header").classList.remove("hidden");
  const nav = $("#nav"), ua = $("#userArea");
  nav.innerHTML = ""; ua.innerHTML = "";

  const icons = { home:"🏠", login:"🔑", register:"✨", dashboard:"🏡", profile:"👤", courses:"📚", exams:"📝", chat:"💬" };
  const links = me.isLoggedIn
    ? [["dashboard","لوحتي"],["profile","ملفي"],["courses","الكورسات"],["exams","الامتحانات"],["chat","المساعد الذكي"]]
    : [["home","الرئيسية"],["login","دخول"],["register","حساب جديد"]];

  links.forEach(([r, t]) => {
    const b = document.createElement("button");
    b.innerHTML = `<span class="nav-ic">${icons[r] || "•"}</span><span class="nav-lb">${t}</span>`;
    if (route === r) b.classList.add("active");
    b.onclick = () => { location.hash = "#" + r; };
    nav.appendChild(b);
  });

  if (me.isLoggedIn) {
    const av = document.createElement("div"); av.className = "avatar";
    if (me.profile?.photoURL) { av.classList.add("has-photo"); av.innerHTML = `<img src="${me.profile.photoURL}" alt="">`; }
    else av.textContent = initials(me.profile?.name);
    av.style.cursor = "pointer";
    av.onclick = () => { location.hash = "#profile"; };
    const nm = document.createElement("span"); nm.className = "user-name"; nm.textContent = me.profile?.name || "مستخدم";
    const out = document.createElement("button"); out.className = "logout-btn"; out.textContent = "خروج";
    out.onclick = async () => { await logoutUser(); location.hash = "#home"; };
    ua.append(av, nm, out);
  }
}

/* ================= الرئيسية ================= */
function viewHome() {
  app.innerHTML = `
    <div class="page-title">تعلّم البرمجة من الصفر 🚀</div>
    <div class="page-sub">كورسات عربية، امتحانات تفاعلية، مساعد ذكي، ومتابعة لحظية.</div>
    <div class="grid">
      <div class="card"><h3>📚 كورسات</h3><p>من الأساسيات للاحتراف.</p></div>
      <div class="card"><h3>📝 امتحانات</h3><p>اختبر نفسك والنتيجة تظهر للمعلم فوراً.</p></div>
      <div class="card"><h3>🤖 مساعد ذكي</h3><p>اسأل أي سؤال في البرمجة.</p></div>
    </div><div class="space"></div>
    <button class="btn" onclick="location.hash='#register'">ابدأ الآن مجاناً</button>`;
}

/* ================= الدخول ================= */
function viewLogin() {
  app.innerHTML = `
    <div class="form card">
      <h2 class="page-title" style="font-size:20px">تسجيل الدخول</h2>
      <div><label>البريد الإلكتروني</label><input id="email" type="email" autocomplete="email"></div>
      <div><label>كلمة المرور</label><input id="pass" type="password" autocomplete="current-password"></div>
      <button class="btn" id="loginBtn">دخول</button>
      <button class="btn ghost sm" id="forgotBtn">نسيت كلمة المرور؟</button>
      <p class="muted" style="font-size:14px;text-align:center">معندكش حساب؟ <a href="#register" style="color:var(--acc2)">سجل الآن</a></p>
    </div>`;
  $("#loginBtn").onclick = async () => {
    const em = $("#email").value, ps = $("#pass").value;
    if (!em || !ps) return toast("املا الحقول", "err");
    $("#loginBtn").disabled = true;
    try { await loginUser(em, ps); toast("أهلاً بيك 👋","ok"); location.hash = "#dashboard"; }
    catch (e) { toast("خطأ في الدخول: " + e.message, "err"); }
    finally { $("#loginBtn").disabled = false; }
  };
  $("#forgotBtn").onclick = async () => {
    const em = $("#email").value;
    if (!em) return toast("اكتب إيميلك الأول","err");
    try { await resetPassword(em); toast("بعتنالك رابط على إيميلك","ok"); } catch (e) { toast(e.message,"err"); }
  };
}

/* ================= التسجيل ================= */
const STAGES = ["تعليم حر", "أولى ثانوي", "ثانية ثانوي", "ثالثة ثانوي"];
const SUBJECTS = ["Python", "JavaScript", "HTML/CSS", "Java", "C++", "C#"];

function viewRegister() {
  app.innerHTML = `
    <div class="form card register">
      <h2 class="page-title" style="font-size:22px;text-align:center">إنشاء حساب</h2>
      <p class="muted" style="text-align:center;margin-top:-8px">ابدأ رحلتك معنا</p>
      <div><label>الاسم الكامل</label><input id="name" autocomplete="name"></div>
      <div><label>البريد الإلكتروني</label><input id="email" type="email" autocomplete="email"></div>
      <div><label>السن</label><input id="age" type="number" min="4" max="99" placeholder="مثال: 16"></div>
      <div><label>المرحلة الدراسية</label>
        <select id="stage">${STAGES.map(s => `<option>${s}</option>`).join("")}</select>
      </div>
      <div><label>رقم الطالب</label><input id="studentPhone" type="tel" placeholder="01xxxxxxxxx"></div>
      <div><label>رقم ولي الأمر</label><input id="parentPhone" type="tel" placeholder="01xxxxxxxxx"></div>
      <div><label>كلمة المرور (6 حروف على الأقل)</label><input id="pass" type="password" autocomplete="new-password"></div>
      <div><label>تأكيد كلمة المرور</label><input id="pass2" type="password" autocomplete="new-password"></div>
      <button class="btn" id="regBtn">إنشاء الحساب</button>
      <p class="muted" style="font-size:14px;text-align:center">عندك حساب؟ <a href="#login" style="color:var(--acc2)">سجّل دخول</a></p>
    </div>`;
  $("#regBtn").onclick = async () => {
    const nm = $("#name").value.trim(), em = $("#email").value;
    const ps = $("#pass").value, ps2 = $("#pass2").value;
    const age = $("#age").value.trim(), stage = $("#stage").value;
    const studentPhone = $("#studentPhone").value.trim(), parentPhone = $("#parentPhone").value.trim();
    if (!nm || !em || ps.length < 6) return toast("تأكد من البيانات (6 حروف على الأقل)","err");
    if (ps !== ps2) return toast("كلمة المرور وتأكيدها مش متطابقين","err");
    $("#regBtn").disabled = true;
    try {
      await registerUser(em, ps, { name: nm, age, stage, studentPhone, parentPhone });
      toast("تم إنشاء الحساب ✅","ok"); location.hash = "#dashboard";
    }
    catch (e) { toast(e.code === "auth/email-already-in-use" ? "الإيميل مستخدم" : e.message, "err"); }
    finally { $("#regBtn").disabled = false; }
  };
}

/* ================= ✅ الملف الشخصي ================= */
function viewProfile() {
  const me = getMe();
  const p = me.profile || {};
  app.innerHTML = `
    <div class="page-title">ملفي الشخصي</div>
    <div class="page-sub">بياناتك وصورتك الشخصية.</div>
    <div class="card" style="max-width:460px;margin:0 auto">
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
        <div class="profile-avatar" id="profileAvatarBox">
          ${p.photoURL ? `<img src="${esc(p.photoURL)}" alt="">` : `<span>${esc(initials(p.name))}</span>`}
        </div>
        <label class="btn sm ghost" style="cursor:pointer">
          📷 تغيير الصورة
          <input type="file" id="photoInput" accept="image/*" style="display:none">
        </label>
      </div>
      <div class="space"></div>
      <div id="viewMode">
        <div class="profile-row"><span class="muted">الاسم</span><b>${esc(p.name || "-")}</b></div>
        <div class="profile-row"><span class="muted">البريد الإلكتروني</span><b>${esc(p.email || "-")}</b></div>
        <div class="profile-row"><span class="muted">السن</span><b>${esc(p.age || "-")}</b></div>
        <div class="profile-row"><span class="muted">المرحلة الدراسية</span><b>${esc(p.stage || "-")}</b></div>
        <div class="profile-row"><span class="muted">رقم الطالب</span><b>${esc(p.studentPhone || "-")}</b></div>
        <div class="profile-row"><span class="muted">رقم ولي الأمر</span><b>${esc(p.parentPhone || "-")}</b></div>
        <div class="profile-row"><span class="muted">تاريخ التسجيل</span><b>${fmtDate(p.createdAt)}</b></div>
        <div class="space"></div>
        <button class="btn" id="editBtn" style="width:100%">✏️ تعديل بياناتي</button>
      </div>
      <div id="editMode" class="hidden" style="display:flex;flex-direction:column;gap:12px">
        <div><label>الاسم</label><input id="e-name" value="${esc(p.name || "")}"></div>
        <div><label>السن</label><input id="e-age" type="number" value="${esc(p.age || "")}"></div>
        <div><label>المرحلة الدراسية</label>
          <select id="e-stage">${STAGES.map(s => `<option ${p.stage === s ? "selected" : ""}>${s}</option>`).join("")}</select>
        </div>
        <div><label>رقم الطالب</label><input id="e-sp" value="${esc(p.studentPhone || "")}"></div>
        <div><label>رقم ولي الأمر</label><input id="e-pp" value="${esc(p.parentPhone || "")}"></div>
        <div class="row">
          <button class="btn" id="saveProfileBtn">حفظ</button>
          <button class="btn ghost" id="cancelEditBtn">إلغاء</button>
        </div>
      </div>
    </div>`;

  $("#photoInput").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { await uploadProfilePhoto(f); toast("تم تحديث الصورة ✅","ok"); renderHeader(); viewProfile(); }
    catch (err) { toast(err.message,"err"); }
  };
  $("#editBtn").onclick = () => { $("#viewMode").classList.add("hidden"); $("#editMode").classList.remove("hidden"); };
  $("#cancelEditBtn").onclick = () => { $("#editMode").classList.add("hidden"); $("#viewMode").classList.remove("hidden"); };
  $("#saveProfileBtn").onclick = async () => {
    const data = {
      name: $("#e-name").value.trim(), age: $("#e-age").value.trim(),
      stage: $("#e-stage").value, studentPhone: $("#e-sp").value.trim(), parentPhone: $("#e-pp").value.trim(),
    };
    if (!data.name) return toast("الاسم مطلوب","err");
    try { await updateMyProfile(data); toast("تم حفظ التعديلات ✅","ok"); renderHeader(); viewProfile(); }
    catch (err) { toast(err.message,"err"); }
  };
}

/* ================= الكورسات ================= */
function viewCourses() {
  app.innerHTML = `<div class="page-title">الكورسات</div><div class="page-sub">اختر كورس وابدأ.</div>
    <div id="courseList" class="grid"><div class="empty">جاري التحميل…</div></div>`;
  sub(watchCourses(list => {
    const box = $("#courseList"); if (!box) return;
    box.innerHTML = list.length ? list.map(c => `
      <div class="card">
        ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="" class="course-thumb">` : ""}
        <h3>${esc(c.title)}</h3><p>${esc(c.description || "")}</p><div class="space"></div>
        <div class="row">
          ${c.stage ? `<span class="badge">${esc(c.stage)}</span>` : ""}
          ${c.subject ? `<span class="badge">${esc(c.subject)}</span>` : ""}
          <span class="badge ok">${esc(c.price || "مجاني")}</span>
        </div>
        <div class="space"></div>
        <div class="row">
          <button class="btn sm ghost" data-open="${c.id}">📂 المحتوى</button>
          <button class="btn sm" data-enroll="${c.id}" data-title="${esc(c.title)}">اشترك</button>
        </div>
      </div>`).join("") : `<div class="empty">لا توجد كورسات بعد.</div>`;
    $$("[data-open]", box).forEach(b => b.onclick = () => { location.hash = "#course/" + b.dataset.open; });
    $$("[data-enroll]", box).forEach(b => b.onclick = async () => {
      try { await enrollCourse(b.dataset.enroll, b.dataset.title); toast("تم الاشتراك ✅","ok"); }
      catch (e) { toast(e.message,"err"); }
    });
  }));
}

/* ================= ✅ تفاصيل الكورس ومحتواه ================= */
async function viewCourseDetail(id) {
  app.innerHTML = `<div class="page-title">تفاصيل الكورس</div><div id="courseDetailBox"><div class="empty">جاري التحميل…</div></div>`;
  let c = null;
  try { c = await getCourse(id); } catch {}
  const box = $("#courseDetailBox"); if (!box) return;
  if (!c) { box.innerHTML = `<div class="empty">الكورس مش موجود. <a href="#courses" style="color:var(--acc2)">رجوع للكورسات</a></div>`; return; }

  const titleEl = $(".page-title"); if (titleEl) titleEl.textContent = c.title;
  box.innerHTML = `
    <div class="card">
      ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="" class="course-thumb">` : ""}
      <p>${esc(c.description || "")}</p><div class="space"></div>
      <div class="row">
        ${c.stage ? `<span class="badge">${esc(c.stage)}</span>` : ""}
        ${c.subject ? `<span class="badge">${esc(c.subject)}</span>` : ""}
        <span class="badge ok">${esc(c.price || "مجاني")}</span>
      </div>
      <div class="space"></div>
      <div class="row">
        <button class="btn sm" data-enroll="${c.id}" data-title="${esc(c.title)}">اشترك</button>
      </div>
    </div>
    <div class="space"></div>
    <h3 style="margin-bottom:12px">محتوى الكورس</h3>
    <div id="contentBox" class="grid"><div class="empty">جاري التحميل…</div></div>`;

  $$("[data-enroll]", box).forEach(b => b.onclick = async () => {
    try { await enrollCourse(b.dataset.enroll, b.dataset.title); toast("تم الاشتراك ✅","ok"); }
    catch (e) { toast(e.message,"err"); }
  });

  const typeMeta = { video: ["🎬","فيديو"], pdf: ["📄","PDF"], exam: ["📝","امتحان"] };
  sub(watchCourseContent(id, items => {
    const cb = $("#contentBox"); if (!cb) return;
    cb.innerHTML = items.length ? items.map(it => {
      const [ic, lb] = typeMeta[it.type] || ["📎", it.type];
      return `
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3>${ic} ${esc(it.title)}</h3>
          <span class="badge">${lb}</span>
        </div>
        <div class="space"></div>
        <a class="btn sm ghost" href="${esc(it.url)}" target="_blank" rel="noopener">فتح المحتوى</a>
      </div>`;
    }).join("") : `<div class="empty">لسه المعلم مضافش محتوى للكورس ده.</div>`;
  }));
}

/* ================= لوحة الطالب ================= */
function viewDashboard() {
  const me = getMe();
  if (me.isTeacher) return viewTeacherDashboard();

  app.innerHTML = `
    <div class="page-title">مرحباً ${esc(me.profile?.name || "")} 👋</div>
    <div class="page-sub">لوحتك الشخصية.</div>
    <div class="grid" id="stats"></div>
    <div class="space"></div>
    <h3 style="margin-bottom:12px">كورساتي</h3>
    <div id="myCourses" class="grid"><div class="empty">جاري التحميل…</div></div>
    <div class="space"></div>
    <h3 style="margin-bottom:12px">نتائج امتحاناتي</h3>
    <div id="myResults"><div class="empty">جاري التحميل…</div></div>
    <div class="space"></div>
    <h3 style="margin-bottom:12px">رفع إشعار دفع</h3>
    <div class="card"><div class="row"><input type="file" id="proof" accept="image/*"><button class="btn sm" id="upBtn">رفع</button></div></div>`;

  sub(watchMyEnrollments(list => {
    const box = $("#myCourses"); if (!box) return;
    box.innerHTML = list.length ? list.map(e => `<div class="card"><h3>${esc(e.courseTitle)}</h3><p class="muted">اشتركت: ${fmt(e.enrolledAt)}</p></div>`).join("")
      : `<div class="empty">لسه مشتركتش في كورسات. <a href="#courses" style="color:var(--acc2)">تصفح</a></div>`;
    const s = $("#stats"); if (s) s.innerHTML = `<div class="card stat"><span class="muted">عدد كورساتك</span><b>${list.length}</b></div>`;
  }));

  sub(watchMyResults(list => {
    const box = $("#myResults"); if (!box) return;
    box.innerHTML = list.length ? list.map(r => `
      <div class="log-row">
        <div><b>${esc(r.examTitle)}</b></div>
        <span class="badge ${r.score / r.total >= 0.5 ? "ok" : "err"}">${r.score}/${r.total}</span>
      </div>`).join("") : `<div class="empty">لسه مضّيتش امتحانات. <a href="#exams" style="color:var(--acc2)">تصفح الامتحانات</a></div>`;
  }));

  $("#upBtn").onclick = async () => {
    const f = $("#proof").files[0];
    if (!f) return toast("اختر صورة أولاً","err");
    try { await uploadPaymentProof(f, "general", "دفع عام"); toast("تم الرفع ✅","ok"); }
    catch (e) { toast(e.message,"err"); }
  };
}

/* ================= ✅ الامتحانات (طالب) ================= */
function viewExams() {
  app.innerHTML = `<div class="page-title">الامتحانات 📝</div><div class="page-sub">اختبر نفسك، النتيجة تظهر للمعلم فوراً.</div>
    <div id="examList" class="grid"><div class="empty">جاري التحميل…</div></div>`;
  sub(watchExams(list => {
    const box = $("#examList"); if (!box) return;
    box.innerHTML = list.length ? list.map(e => `
      <div class="card">
        <h3>${esc(e.title)}</h3>
        <p class="muted">${e.courseTitle ? esc(e.courseTitle) + " • " : ""}${(e.questions || []).length} سؤال${e.duration ? " • " + e.duration + " دقيقة" : ""}</p>
        <div class="space"></div>
        <button class="btn" data-start="${e.id}">ابدأ الامتحان</button>
      </div>`).join("") : `<div class="empty">لا توجد امتحانات بعد.</div>`;
    $$("[data-start]", box).forEach(b => b.onclick = () => {
      const ex = list.find(x => x.id === b.dataset.start);
      startExam(ex);
    });
  }));
}

function startExam(ex) {
  const questions = ex.questions || [];
  if (!questions.length) return toast("الامتحان فاضي","err");
  const answers = new Array(questions.length).fill(-1);

  app.innerHTML = `
    <div class="page-title">${esc(ex.title)}</div>
    ${ex.duration ? `<div class="timer" id="timer">⏱️ ${ex.duration}:00</div>` : ""}
    <form id="examForm">
      ${questions.map((q, i) => `
        <div class="q-box">
          <div class="q-text">${i + 1}) ${esc(q.q)}</div>
          ${(q.options || []).map((op, j) => `
            <label class="opt" data-q="${i}" data-o="${j}">
              <input type="radio" name="q${i}" value="${j}">
              <span>${esc(op)}</span>
            </label>`).join("")}
        </div>`).join("")}
      <button class="btn" id="submitBtn" type="submit">تسليم الامتحان</button>
    </form>`;

  // تحديد الإجابة
  app.addEventListener("click", e => {
    const lab = e.target.closest(".opt"); if (!lab) return;
    const qi = +lab.dataset.q, oi = +lab.dataset.o;
    answers[qi] = oi;
    $$(`.opt[data-q="${qi}"]`, app).forEach(l => l.classList.remove("sel"));
    lab.classList.add("sel");
  });

  // المؤقّت
  let interval = null;
  if (ex.duration) {
    let left = ex.duration * 60;
    interval = setInterval(() => {
      left--;
      const el = $("#timer"); if (!el) return;
      const m = String(Math.floor(left / 60)).padStart(2, "0");
      const s = String(left % 60).padStart(2, "0");
      el.textContent = `⏱️ ${m}:${s}`;
      if (left <= 60) el.classList.add("danger");
      if (left <= 0) { clearInterval(interval); toast("انتهى الوقت!","err"); doSubmit(); }
    }, 1000);
  }

  const doSubmit = async () => {
    if (interval) clearInterval(interval);
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) score++; });

    try {
      await submitExam({
        examId: ex.id, examTitle: ex.title,
        score, total: questions.length,
        answers, duration: ex.duration || null,
      });
      // عرض النتيجة
      app.innerHTML = `
        <div class="page-title">تم التسليم ✅</div>
        <div class="card">
          <div class="stat"><span class="muted">نتيجتك</span><b>${score} / ${questions.length}</b></div>
          <div class="space"></div>
          ${questions.map((q, i) => `
            <div class="q-box">
              <div class="q-text">${i + 1}) ${esc(q.q)}</div>
              ${(q.options || []).map((op, j) => {
                let cls = "";
                if (j === q.correct) cls = "correct";
                else if (j === answers[i]) cls = "wrong";
                return `<div class="opt ${cls}"><span>${esc(op)}</span></div>`;
              }).join("")}
            </div>`).join("")}
          <div class="space"></div>
          <button class="btn" onclick="location.hash='#dashboard'">رجوع للوحة</button>
        </div>`;
      toast("تم إرسال النتيجة للمعلم ✅","ok");
    } catch (e) { toast(e.message,"err"); }
  };

  $("#examForm").onsubmit = (e) => {
    e.preventDefault();
    if (answers.includes(-1) && !confirm("فيه أسئلة من غير إجابة، تكمل؟")) return;
    doSubmit();
  };
}

/* ================= لوحة المعلم ================= */
function viewTeacherDashboard() {
  app.innerHTML = `
    <div class="page-title">لوحة المعلم 🎓</div>
    <div class="page-sub">كل حاجة بتوصلك لحظياً.</div>
    <div class="grid" id="stats"></div>
    <div class="space"></div>
    <div class="tabs" id="tabs">
      <button data-tab="activity" class="active">النشاط اللحظي</button>
      <button data-tab="students">الطلاب</button>
      <button data-tab="courses">الكورسات</button>
      <button data-tab="content">محتوى الكورسات</button>
      <button data-tab="exams">الامتحانات</button>
      <button data-tab="results">النتائج</button>
      <button data-tab="payments">المدفوعات</button>
      <button data-tab="settings">الإعدادات</button>
    </div>
    <div id="tabBody"></div>`;

  $("#stats").innerHTML = `
    <div class="card stat"><span class="muted">آخر حركات</span><b id="s-act">0</b></div>
    <div class="card stat"><span class="muted">طلاب</span><b id="s-stu">0</b></div>
    <div class="card stat"><span class="muted">كورسات</span><b id="s-crs">0</b></div>
    <div class="card stat"><span class="muted">امتحانات</span><b id="s-exm">0</b></div>
    <div class="card stat"><span class="muted">مدفوعات معلّقة</span><b id="s-pay">0</b></div>`;

  sub(watchActivity(rows => {
    const el = $("#s-act"); if (el) el.textContent = rows.length;
    const box = $("#activityBox");
    if (box) box.innerHTML = rows.length ? rows.map(r => `
      <div class="log-row">
        <div><b>${esc(r.name)}</b> <span class="muted">— ${esc(r.action)}</span>${r.note ? ` <span class="muted">(${esc(r.note)})</span>` : ""}</div>
        <span class="muted" style="font-size:12px">${fmt(r.time)}</span>
      </div>`).join("") : `<div class="empty">لا يوجد نشاط بعد.</div>`;
  }));
  sub(watchStudents(l => { const e = $("#s-stu"); if (e) e.textContent = l.length; }));
  sub(watchCourses(l => { const e = $("#s-crs"); if (e) e.textContent = l.length; }));
  sub(watchExams(l => { const e = $("#s-exm"); if (e) e.textContent = l.length; }));
  sub(watchPayments(l => { const e = $("#s-pay"); if (e) e.textContent = l.filter(p => p.status === "pending").length; }));

  const tabs = $("#tabs");
  tabs.onclick = e => {
    const b = e.target.closest("button[data-tab]"); if (!b) return;
    $$("button", tabs).forEach(x => x.classList.remove("active"));
    b.classList.add("active"); renderTab(b.dataset.tab);
  };
  renderTab("activity");
}

function renderTab(tab) {
  const body = $("#tabBody"); if (!body) return;

  if (tab === "activity") body.innerHTML = `<div id="activityBox"><div class="empty">جاري التحميل…</div></div>`;
  if (tab === "students") body.innerHTML = `<div id="stuBox"><div class="empty">جاري التحميل…</div></div>`;
  if (tab === "exams") { body.innerHTML = examBuilderHTML(); bindExamBuilder(); }
  if (tab === "results") body.innerHTML = `<div id="resBox"><div class="empty">جاري التحميل…</div></div>`;
  if (tab === "payments") body.innerHTML = `<div id="payBox"><div class="empty">جاري التحميل…</div></div>`;
  if (tab === "courses") {
    body.innerHTML = `
      <div class="card">
        <h3>إنشاء كورس جديد</h3><div class="space"></div>
        <div style="display:grid;gap:10px">
          <input id="c-title" placeholder="عنوان الكورس">
          <textarea id="c-desc" rows="3" placeholder="وصف الكورس"></textarea>
          <select id="c-stage">${STAGES.map(s => `<option>${esc(s)}</option>`).join("")}</select>
          <select id="c-subject">${SUBJECTS.map(s => `<option>${esc(s)}</option>`).join("")}</select>
          <input id="c-price" placeholder="السعر (0 = مجاني)">
          <label class="muted" style="font-size:13px">صورة الكورس</label>
          <input id="c-image" type="file" accept="image/*">
          <button class="btn" id="addCourseBtn">نشر للطلاب</button>
        </div>
      </div><div class="space"></div>
      <div id="coursesBox" class="grid"><div class="empty">جاري التحميل…</div></div>`;
    $("#addCourseBtn").onclick = async () => {
      const t = $("#c-title").value.trim();
      if (!t) return toast("اكتب اسم الكورس","err");
      $("#addCourseBtn").disabled = true;
      try {
        let imageUrl = "";
        const file = $("#c-image").files[0];
        if (file) imageUrl = await uploadCourseImage(file);
        await addCourse({
          title: t, description: $("#c-desc").value.trim(),
          stage: $("#c-stage").value, subject: $("#c-subject").value,
          price: $("#c-price").value.trim() || "مجاني", imageUrl,
        });
        $("#c-title").value = $("#c-desc").value = $("#c-price").value = ""; $("#c-image").value = "";
        toast("تم نشر الكورس ✅","ok");
      } catch (e) { toast(e.message,"err"); }
      finally { $("#addCourseBtn").disabled = false; }
    };
    sub(watchCourses(list => {
      const box = $("#coursesBox"); if (!box) return;
      box.innerHTML = list.length ? list.map(c => `
        <div class="card">
          ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="" class="course-thumb">` : ""}
          <h3>${esc(c.title)}</h3><p>${esc(c.description || "")}</p><div class="space"></div>
          <div class="row">
            ${c.stage ? `<span class="badge">${esc(c.stage)}</span>` : ""}
            ${c.subject ? `<span class="badge">${esc(c.subject)}</span>` : ""}
            <span class="badge ok">${esc(c.price || "مجاني")}</span>
            <button class="btn sm err" data-del="${c.id}">حذف</button>
          </div>
        </div>`).join("")
        : `<div class="empty">لا توجد كورسات.</div>`;
      $$("[data-del]", box).forEach(b => b.onclick = async () => {
        if (confirm("تأكيد الحذف؟")) { await deleteCourse(b.dataset.del); toast("تم الحذف","ok"); }
      });
    }));
  }
  if (tab === "content") { body.innerHTML = contentBuilderHTML(); bindContentBuilder(); }
  if (tab === "settings") {
    body.innerHTML = `
      <div class="card">
        <h3>إعدادات المنصة</h3><div class="space"></div>
        <label>رابط خادم الذكاء الاصطناعي (Cloudflare Worker)</label>
        <input id="aiUrl" placeholder="https://xxx.workers.dev">
        <div class="space"></div>
        <button class="btn" id="saveSettings">حفظ</button>
      </div>`;
    getSettings().then(s => { const el = $("#aiUrl"); if (el) el.value = s.aiUrl || ""; });
    $("#saveSettings").onclick = async () => {
      await setSettings({ aiUrl: $("#aiUrl").value.trim() }); toast("تم الحفظ ✅","ok");
    };
  }

  if (tab === "students") {
    let studentsList = [], coursesList = [];
    const drawStudents = () => {
      const box = $("#stuBox"); if (!box) return;
      box.innerHTML = studentsList.length ? studentsList.map(u => `
        <div class="card">
          <div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap">
            <div>
              <h3>${esc(u.name)}</h3>
              <div class="muted" style="font-size:13px">${esc(u.email)} • ${esc(u.stage || "-")}</div>
              <div class="muted" style="font-size:13px">رقم الطالب: ${esc(u.studentPhone || "-")} | رقم ولي الأمر: ${esc(u.parentPhone || "-")}</div>
            </div>
            <div class="avatar" style="width:48px;height:48px;font-size:16px">
              ${u.photoURL ? `<img src="${esc(u.photoURL)}" alt="">` : esc(initials(u.name))}
            </div>
          </div>
          <div class="space"></div>
          <div class="row">
            <button class="btn sm ghost" data-grant="${u.id}" data-name="${esc(u.name)}" data-email="${esc(u.email)}">فتح كورس</button>
            <select data-course-for="${u.id}" style="flex:1;min-width:140px">
              ${coursesList.length ? coursesList.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join("") : `<option value="">لا توجد كورسات</option>`}
            </select>
          </div>
        </div>`).join("") : `<div class="empty">لا يوجد طلاب.</div>`;

      $$("[data-grant]", box).forEach(b => b.onclick = async () => {
        const sel = $(`select[data-course-for="${b.dataset.grant}"]`, box);
        const courseId = sel?.value; if (!courseId) return toast("اختر كورس أولاً","err");
        const course = coursesList.find(c => c.id === courseId);
        b.disabled = true;
        try {
          await grantCourseAccess({ uid: b.dataset.grant, name: b.dataset.name, email: b.dataset.email }, courseId, course?.title || "");
          toast(`تم فتح "${course?.title}" لـ ${b.dataset.name} ✅`,"ok");
        } catch (e) { toast(e.message,"err"); }
        finally { b.disabled = false; }
      });
    };
    sub(watchStudents(list => { studentsList = list; drawStudents(); }));
    sub(watchCourses(list => { coursesList = list; drawStudents(); }));
  }

  if (tab === "results") sub(watchExamResults(list => {
    const box = $("#resBox"); if (!box) return;
    box.innerHTML = list.length ? list.map(r => `
      <div class="log-row">
        <div>
          <b>${esc(r.name)}</b> <span class="muted">— ${esc(r.examTitle)}</span>
          <div class="muted" style="font-size:12px">${esc(r.email)} • ${fmt(r.submittedAt)}</div>
        </div>
        <span class="badge ${r.score / r.total >= 0.5 ? "ok" : "err"}">${r.score}/${r.total}</span>
      </div>`).join("") : `<div class="empty">لا توجد نتائج بعد.</div>`;
  }));

  if (tab === "payments") {
    sub(watchPayments(list => {
      const box = $("#payBox"); if (!box) return;
      box.innerHTML = list.length ? list.map(p => `
        <div class="log-row">
          <div><b>${esc(p.name)}</b> <span class="muted">— ${esc(p.courseTitle || "")}</span>
            <div class="muted" style="font-size:12px">${esc(p.email)} • ${fmt(p.createdAt)}</div></div>
          <div class="row">
            <a class="btn sm ghost" href="${esc(p.proofUrl)}" target="_blank" rel="noopener">عرض</a>
            ${p.status === "pending"
              ? `<button class="btn sm ok" data-ok="${p.id}" data-t="${esc(p.courseTitle || "")}">قبول</button>
                 <button class="btn sm err" data-no="${p.id}" data-t="${esc(p.courseTitle || "")}">رفض</button>`
              : `<span class="badge ${p.status === "approved" ? "ok" : "err"}">${p.status === "approved" ? "مقبول" : "مرفوض"}</span>`}
          </div>
        </div>`).join("") : `<div class="empty">لا توجد مدفوعات.</div>`;
      $$("[data-ok]", box).forEach(b => b.onclick = async () => { await updatePaymentStatus(b.dataset.ok, "approved", null, b.dataset.t); toast("تم القبول ✅","ok"); });
      $$("[data-no]", box).forEach(b => b.onclick = async () => { await updatePaymentStatus(b.dataset.no, "rejected", null, b.dataset.t); toast("تم الرفض","ok"); });
    }));
  }
}

/* ================= ✅ إضافة محتوى للكورس (فيديو / PDF / امتحان) ================= */
function contentBuilderHTML() {
  return `
  <div class="card">
    <h3>إضافة محتوى للكورس (فيديو / PDF / امتحان)</h3><div class="space"></div>
    <div style="display:grid;gap:10px">
      <select id="ct-course"><option value="">جاري تحميل الكورسات…</option></select>
      <select id="ct-type">
        <option value="video">فيديو</option>
        <option value="pdf">PDF</option>
        <option value="exam">امتحان</option>
      </select>
      <input id="ct-title" placeholder="عنوان المحتوى">
      <input id="ct-url" placeholder="الرابط (فيديو أو PDF أو امتحان)">
      <button class="btn" id="ct-addBtn">نشر للطلاب</button>
    </div>
  </div>
  <div class="space"></div>
  <h3 style="margin-bottom:12px">المحتوى المضاف</h3>
  <div id="ct-list" class="grid"><div class="empty">اختر كورس بالأعلى لعرض محتواه.</div></div>`;
}

function bindContentBuilder() {
  let courses = [];
  let contentUnsub = null;
  const stopContent = () => { if (contentUnsub) { contentUnsub(); contentUnsub = null; } };
  sub(stopContent);

  const typeMeta = { video: ["🎬","فيديو"], pdf: ["📄","PDF"], exam: ["📝","امتحان"] };

  function loadContentList() {
    const listBox = $("#ct-list"); if (!listBox) return;
    const courseId = $("#ct-course")?.value;
    stopContent();
    if (!courseId) { listBox.innerHTML = `<div class="empty">اختر كورس بالأعلى لعرض محتواه.</div>`; return; }
    listBox.innerHTML = `<div class="empty">جاري التحميل…</div>`;
    contentUnsub = watchCourseContent(courseId, items => {
      const box = $("#ct-list"); if (!box) return;
      box.innerHTML = items.length ? items.map(it => {
        const [ic, lb] = typeMeta[it.type] || ["📎", it.type];
        return `
        <div class="card">
          <div class="row" style="justify-content:space-between">
            <h3>${ic} ${esc(it.title)}</h3><span class="badge">${lb}</span>
          </div>
          <div class="space"></div>
          <div class="row">
            <a class="btn sm ghost" href="${esc(it.url)}" target="_blank" rel="noopener">فتح</a>
            <button class="btn sm err" data-delc="${it.id}">حذف</button>
          </div>
        </div>`;
      }).join("") : `<div class="empty">لسه مفيش محتوى لهذا الكورس.</div>`;
      $$("[data-delc]", box).forEach(b => b.onclick = async () => {
        if (confirm("تأكيد حذف المحتوى؟")) { await deleteCourseContent(b.dataset.delc); toast("تم الحذف","ok"); }
      });
    });
  }

  sub(watchCourses(list => {
    courses = list;
    const sel = $("#ct-course"); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = list.length
      ? list.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join("")
      : `<option value="">لا توجد كورسات — أضف كورس أولاً</option>`;
    if (cur && list.some(c => c.id === cur)) sel.value = cur;
    loadContentList();
  }));

  $("#ct-course").onchange = loadContentList;

  $("#ct-addBtn").onclick = async () => {
    const courseId = $("#ct-course").value;
    if (!courseId) return toast("اختر كورس أولاً","err");
    const title = $("#ct-title").value.trim();
    const url = $("#ct-url").value.trim();
    if (!title || !url) return toast("اكتب العنوان والرابط","err");
    const course = courses.find(c => c.id === courseId);
    $("#ct-addBtn").disabled = true;
    try {
      await addCourseContent({ courseId, courseTitle: course?.title || "", type: $("#ct-type").value, title, url });
      $("#ct-title").value = ""; $("#ct-url").value = "";
      toast("تم نشر المحتوى ✅","ok");
    } catch (e) { toast(e.message,"err"); }
    finally { $("#ct-addBtn").disabled = false; }
  };
}

/* ================= ✅ منشئ الامتحانات ================= */
function examBuilderHTML() {
  return `
  <div class="card">
    <h3>إنشاء امتحان جديد</h3><div class="space"></div>
    <div style="display:grid;gap:10px">
      <input id="e-title" placeholder="اسم الامتحان (مثلاً: امتحان JS الأساسي)">
      <input id="e-course" placeholder="الكورس المرتبط (اختياري)">
      <input id="e-dur" type="number" min="1" placeholder="المدة بالدقائق (اختياري)">
    </div>
    <div class="space"></div>
    <h4>الأسئلة</h4>
    <div id="qList"></div>
    <div class="row">
      <button class="btn ghost sm" id="addQBtn" type="button">+ إضافة سؤال</button>
      <button class="btn" id="saveExamBtn" type="button">حفظ الامتحان</button>
    </div>
  </div>
  <div class="space"></div>
  <h3>الامتحانات الحالية</h3>
  <div id="examsBox" class="grid" style="margin-top:12px"><div class="empty">جاري التحميل…</div></div>`;
}

function questionHTML(i) {
  return `
  <div class="q-box" data-qidx="${i}">
    <div class="row">
      <input class="q-input" placeholder="نص السؤال ${i + 1}" style="flex:1">
      <button class="btn sm err del-q" type="button">حذف</button>
    </div>
    <div class="space"></div>
    ${[0,1,2,3].map(j => `
      <div class="row" style="margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:8px;min-width:70px">
          <input type="radio" name="correct-${i}" value="${j}"> صحيح
        </label>
        <input class="q-opt" data-idx="${j}" placeholder="الاختيار ${j + 1}" style="flex:1">
      </div>`).join("")}
  </div>`;
}

function bindExamBuilder() {
  let counter = 0;
  const addQ = () => { $("#qList").insertAdjacentHTML("beforeend", questionHTML(counter)); counter++; };
  addQ(); addQ(); // سؤالين افتراضياً

  $("#addQBtn").onclick = addQ;

  $("#qList").addEventListener("click", e => {
    if (e.target.classList.contains("del-q")) {
      e.target.closest(".q-box").remove();
    }
  });

  $("#saveExamBtn").onclick = async () => {
    const title = $("#e-title").value.trim();
    if (!title) return toast("اكتب اسم الامتحان","err");

    const boxes = $$("#qList .q-box");
    const questions = [];
    for (const box of boxes) {
      const qText = $(".q-input", box).value.trim();
      if (!qText) continue;
      const options = $$(".q-opt", box).map(i => i.value.trim()).filter(Boolean);
      const correctRadio = $('input[type="radio"]:checked', box);
      if (options.length < 2) return toast("كل سؤال لازم اختيارين على الأقل","err");
      if (!correctRadio) return toast("حدد الإجابة الصحيحة لكل سؤال","err");
      const correct = +correctRadio.value;
      if (correct >= options.length) return toast("حدد إجابة صحيحة ضمن الاختيارات الموجودة","err");
      questions.push({ q: qText, options, correct });
    }

    if (!questions.length) return toast("أضف سؤال واحد على الأقل","err");

    await addExam({
      title,
      courseTitle: $("#e-course").value.trim(),
      duration: Number($("#e-dur").value) || null,
      questions,
    });
    toast("تم حفظ الامتحان ✅","ok");
    renderTab("exams");
  };

  sub(watchExams(list => {
    const box = $("#examsBox"); if (!box) return;
    box.innerHTML = list.length ? list.map(x => `
      <div class="card">
        <h3>${esc(x.title)}</h3>
        <p class="muted">${(x.questions || []).length} سؤال${x.duration ? " • " + x.duration + " دقيقة" : ""}</p>
        <div class="space"></div>
        <button class="btn sm err" data-del="${x.id}">حذف</button>
      </div>`).join("") : `<div class="empty">لا توجد امتحانات.</div>`;
    $$("[data-del]", box).forEach(b => b.onclick = async () => {
      if (confirm("تأكيد حذف الامتحان؟")) { await deleteExam(b.dataset.del); toast("تم الحذف","ok"); }
    });
  }));
}

/* ================= المساعد الذكي ================= */
function viewChat() {
  app.innerHTML = `
    <div class="page-title">المساعد الذكي 🤖</div>
    <div class="page-sub">اسأل أي سؤال في البرمجة.</div>
    <div class="chat">
      <div class="chat-body" id="chatBody"><div class="msg ai">أهلاً! اسألني أي حاجة في البرمجة 💡</div></div>
      <div class="chat-input"><input id="chatIn" placeholder="اكتب سؤالك…"><button class="btn" id="sendBtn">إرسال</button></div>
    </div>`;
  const history = [];
  const body = $("#chatBody");
  const send = async () => {
    const t = $("#chatIn").value.trim(); if (!t) return;
    $("#chatIn").value = ""; history.push({ role: "user", content: t });
    body.insertAdjacentHTML("beforeend", `<div class="msg me">${esc(t)}</div>`);
    body.scrollTop = body.scrollHeight;
    const th = document.createElement("div"); th.className = "msg ai"; th.textContent = "…يفكر";
    body.appendChild(th); body.scrollTop = body.scrollHeight;
    try {
      const r = await askAI(history, "أنت مساعد برمجة ودود، اشرح بالعربي وبساطة.");
      th.textContent = r; history.push({ role: "assistant", content: r });
    } catch (e) { th.textContent = "⚠️ " + e.message; }
    body.scrollTop = body.scrollHeight;
    logActivity("ai_chat", null, "استخدم المساعد الذكي");
  };
  $("#sendBtn").onclick = send;
  $("#chatIn").addEventListener("keydown", e => { if (e.key === "Enter") send(); });
}

/* ================= الراوتر ================= */
function render() {
  cleanSubs();
  const me = getMe();
  if (!me.isLoggedIn && ["dashboard","chat","exams","profile"].includes(route)) route = "login";
  renderHeader();
  if (route.startsWith("course/")) return viewCourseDetail(route.slice(7));
  switch (route) {
    case "login":     return viewLogin();
    case "register":  return viewRegister();
    case "profile":   return viewProfile();
    case "courses":   return viewCourses();
    case "exams":     return viewExams();
    case "dashboard": return me.isTeacher ? viewTeacherDashboard() : viewDashboard();
    case "chat":      return viewChat();
    default:          return me.isLoggedIn ? viewDashboard() : viewHome();
  }
}

/* ================= التشغيل ================= */
$("#brandBtn").onclick = () => { location.hash = getMe().isLoggedIn ? "#dashboard" : "#home"; };
let booted = false;
onAuthChange(() => {
  $("#splash").classList.add("hidden");
  if (!booted) { booted = true; route = location.hash.slice(1) || "home"; }
  render();
});
