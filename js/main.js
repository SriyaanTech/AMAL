/* ==========================================================
   AMAL website – main script
   ========================================================== */
const CONTACT_EMAIL = "minesh.shah@alvestmillennium.com";
const FORM_ENDPOINT = "https://formsubmit.co/ajax/minesh.shah@alvestmillennium.com";
const PHONE = "+91 97121 48373";

(function () {
  "use strict";

  /* ---------- Email link ---------- */
  document.querySelectorAll(".js-email").forEach(function (el) {
    el.href = "mailto:" + CONTACT_EMAIL;
    if (el.id === "emailLink") el.textContent = CONTACT_EMAIL;
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
  window.addEventListener("resize", function () { if (window.innerWidth > 860) closeMenu(); });

  /* ---------- Header shadow + back to top ---------- */
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

  /* ---------- Active nav link + reveal ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll("a"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });

    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add("is-visible");
          revealer.unobserve(el);
          // Clear the stagger delay once revealed so hover effects respond instantly
          setTimeout(function () { el.style.setProperty("--d", "0s"); }, 1600);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { revealer.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? "" : "Please enter your name."; },
    mobile: function (v) {
      var d = v.replace(/[^\d]/g, "");
      return d.length >= 10 && d.length <= 15 ? "" : "Please enter a valid mobile number.";
    },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email address."; },
    message: function (v) { return v.trim().length >= 10 ? "" : "Please write a short message (at least 10 characters)."; }
  };

  function validateField(input) {
    var msg = rules[input.name](input.value);
    var field = input.closest(".field");
    field.classList.toggle("has-error", !!msg);
    field.querySelector(".field__error").textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
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

    // Honeypot: bots fill this hidden field
    if (form.elements._honey.value.trim()) return;

    var data = {
      name: form.elements.name.value.trim(),
      mobile: form.elements.mobile.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim()
    };
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Sending…";
    setStatus("Sending your enquiry…", "");

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(Object.assign({}, data, {
        _subject: "New enquiry - AMAL website",
        _template: "table",
        _captcha: "false"
      }))
    })
      .then(function (res) {
        if (!res.ok) throw new Error("The enquiry service returned HTTP " + res.status + ".");
        return res.json();
      })
      .then(function (reply) {
        if (reply.success !== true && reply.success !== "true") {
          throw new Error(reply.message || "The enquiry service could not accept your message.");
        }
        form.reset();
        setStatus("Thank you, " + data.name + ". Your enquiry has been sent. We will get back to you soon.", "success");
      })
      .catch(function (error) {
        console.error("AMAL contact form error:", error);
        setStatus("Your enquiry could not be sent. Please email " + CONTACT_EMAIL + " or call " + PHONE + ".", "error");
      })
      .finally(function () { button.disabled = false; button.textContent = "Send Message"; });
  });
})();
