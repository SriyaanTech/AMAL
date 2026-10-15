
/* ==========================================================
   AMAL website – main script
   ========================================================== */

/* ----------------------------------------------------------
   CONTACT_EMAIL : specified AMAL recipient.
   FORM_ENDPOINT : FormSubmit JSON endpoint; first use needs inbox activation.
   The form needs to be served over HTTP(S), not opened via file://.
   ---------------------------------------------------------- */
const CONTACT_EMAIL = "minesh.shah@alvestmillennium.com";
const FORM_ENDPOINT = "https://formsubmit.co/ajax/minesh.shah@alvestmillennium.com";

(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  /* ---------- Email links ---------- */
  document.querySelectorAll(".js-email").forEach(function (el) {
    if (CONTACT_EMAIL) {
      el.href = "mailto:" + CONTACT_EMAIL;
      if (el.id === "emailLink") el.textContent = CONTACT_EMAIL;
    } else {
      // No email configured yet – hide the email entries instead of showing a broken link
      var row = el.id === "emailLink" ? el.closest("div") : el;
      if (row) row.hidden = true;
    }
  });

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { closeMenu(); toggle.focus(); }
  });
  window.addEventListener("resize", function () { if (window.innerWidth > 960) closeMenu(); });

  /* ---------- Header shadow + back-to-top ---------- */
  var header = document.getElementById("header");
  var toTop = document.getElementById("toTop");
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 10);
    toTop.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a:not(.btn)'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });

    /* ---------- Reveal on scroll ---------- */
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { revealer.observe(el); });

    /* ---------- Count-up stats ---------- */
    var counter = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        counter.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach(function (el) {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.textContent = "0";
      counter.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
    document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = el.dataset.count; });
  }

  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = target; return; }
    var start = null, duration = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? "" : "Please enter your name."; },
    mobile: function (v) {
      var digits = v.replace(/[^\d]/g, "");
      return digits.length >= 10 && digits.length <= 15 ? "" : "Please enter a valid mobile number.";
    },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address."; },
    message: function (v) { return v.trim().length >= 10 ? "" : "Please write a short message (at least 10 characters)."; }
  };

  function validateField(input) {
    var msg = rules[input.name] ? rules[input.name](input.value) : "";
    var field = input.closest(".field");
    field.classList.toggle("has-error", !!msg);
    field.querySelector(".field__error").textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  Array.prototype.forEach.call(form.elements, function (el) {
    if (!rules[el.name]) return;
    el.addEventListener("blur", function () { validateField(el); });
    el.addEventListener("input", function () {
      if (el.closest(".field").classList.contains("has-error")) validateField(el);
    });
  });

  function setStatus(text, type) {
    status.textContent = text;
    status.className = "form__status" + (type ? " is-" + type : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); setStatus("Please correct the highlighted fields.", "error"); return; }

    var data = {
      name: form.elements.name.value.trim(),
      mobile: form.elements.mobile.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim()
    };
    var button = form.querySelector('button[type="submit"]');

    // Submit via FormSubmit's documented JSON endpoint. The inbox owner MUST
    // click its activation link on the first test submission, then test again.
    if (FORM_ENDPOINT) {
      // Honeypot field for basic spam mitigation.
      if (form.elements._honey && form.elements._honey.value.trim()) return;
      button.disabled = true;
      button.textContent = "Sending…";
      setStatus("Sending your enquiry…", "");
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: data.name,
          mobile: data.mobile,
          email: data.email,
          message: data.message,
          _subject: "New enquiry - AMAL website",
          _template: "table",
          _captcha: "false",
          _honey: form.elements._honey ? form.elements._honey.value : ""
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("The enquiry service returned HTTP " + res.status + ".");
          return res.json();
        })
        .then(function (reply) {
          // IMPORTANT: FormSubmit sometimes returns the string "false" on HTTP 200.
          // Do not accidentally claim success in that situation.
          if (reply.success !== true && reply.success !== "true") {
            throw new Error(reply.message || "The enquiry service could not accept your message.");
          }
          form.reset();
          setStatus("Thank you, " + data.name + ". Your enquiry has been accepted for email delivery.", "success");
        })
        .catch(function (error) {
          console.error("AMAL contact form error:", error);
          setStatus("Your enquiry could not be confirmed. Please email " + CONTACT_EMAIL + " or call +91 97121 48373. " + (error.message || ""), "error");
        })
        .finally(function () { button.disabled = false; button.textContent = "Send message"; });
      return;
    }

    // Option 2: open the visitor's email app with the enquiry filled in
    if (CONTACT_EMAIL) {
      var subject = "Website enquiry from " + data.name;
      var body =
        "Name: " + data.name + "\n" +
        "Mobile: " + data.mobile + "\n" +
        "Email: " + data.email + "\n\n" +
        data.message;
      window.location.href = "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      setStatus("Your email app should open with your message ready to send. If it doesn't, call us on +91 97121 48373.", "success");
      return;
    }

    setStatus("Online enquiries are not set up yet. Please call us on +91 97121 48373.", "error");
  });
})();

/* Hero carousel: autoplay, controls, indicators, keyboard, pause on hover */
(function(){const root=document.querySelector('.amal-slider');if(!root)return;const slides=[...root.querySelectorAll('.amal-slide')],dots=[...root.querySelectorAll('.amal-dots button')];let index=0,timer;function show(n){index=(n+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('is-active',i===index);s.setAttribute('aria-hidden',i===index?'false':'true')});dots.forEach((d,i)=>{d.classList.toggle('is-active',i===index);if(i===index)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')})}function stop(){clearInterval(timer)}function start(){stop();if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(index+1),6000)}root.querySelector('.amal-arrow--prev').addEventListener('click',()=>{show(index-1);start()});root.querySelector('.amal-arrow--next').addEventListener('click',()=>{show(index+1);start()});dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i);start()}));root.addEventListener('mouseenter',stop);root.addEventListener('mouseleave',start);root.addEventListener('focusin',stop);root.addEventListener('focusout',start);root.addEventListener('keydown',e=>{if(e.key==='ArrowRight')show(index+1);if(e.key==='ArrowLeft')show(index-1)});document.addEventListener('visibilitychange',()=>document.hidden?stop():start());show(0);start()})();

