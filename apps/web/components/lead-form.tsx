"use client";

import { FormEvent, useState } from "react";

type LeadFormProps = {
  productId?: string;
  productLabel?: string;
  locale?: "ru" | "en";
};

const copy = {
  ru: {
    product: "Запрос по продукту:", website: "Сайт", name: "Имя", company: "Компания", phone: "Телефон", comment: "Комментарий",
    placeholder: "Опишите задачу, объект или интересующее оборудование", sending: "Отправляем…", send: "Отправить запрос",
    hint: "Укажите телефон или email, чтобы мы могли связаться с вами.", success: "Запрос принят. Он появился в панели управления.",
    db: "Форма готова, но PostgreSQL сейчас недоступна. Повторите попытку позже.", rate: "Слишком много запросов за короткое время. Подождите несколько минут и повторите.",
    error: "Не удалось отправить запрос. Проверьте контактные данные и повторите попытку.",
  },
  en: {
    product: "Request regarding product:", website: "Website", name: "Name", company: "Company", phone: "Phone", comment: "Message",
    placeholder: "Describe the site, engineering task or equipment you are interested in", sending: "Sending…", send: "Send request",
    hint: "Provide a phone number or email address so we can contact you.", success: "Request received and added to the ELSYSTAR administration panel.",
    db: "The form is available, but PostgreSQL is currently unavailable. Please try again later.", rate: "Too many requests in a short period. Please wait a few minutes and try again.",
    error: "The request could not be sent. Check your contact details and try again.",
  },
};

export function LeadForm({ productId, productLabel, locale = "ru" }: LeadFormProps) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error" | "db" | "rate">("idle");
  const text = copy[locale];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    const form = event.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams(window.location.search);

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        company: data.get("company"),
        email: data.get("email"),
        phone: data.get("phone"),
        message: data.get("message"),
        website: data.get("website"),
        productId,
        sourcePath: window.location.pathname,
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
      }),
    });

    if (response.ok) {
      form.reset();
      setState("success");
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (response.status === 429 || payload?.error === "rate_limited") setState("rate");
    else setState(payload?.error === "database_unavailable" ? "db" : "error");
  }

  return (
    <form className="leadForm" onSubmit={submit} lang={locale}>
      {productLabel ? <p className="leadContext">{text.product} <strong>{productLabel}</strong></p> : null}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>{text.website}<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="formGrid">
        <label>{text.name}<input name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label>{text.company}<input name="company" maxLength={160} autoComplete="organization" /></label>
        <label>Email<input name="email" type="email" maxLength={200} autoComplete="email" /></label>
        <label>{text.phone}<input name="phone" maxLength={80} autoComplete="tel" /></label>
      </div>
      <label>{text.comment}<textarea name="message" rows={4} maxLength={3000} placeholder={text.placeholder} /></label>
      <div className="formFooter">
        <button className="button" type="submit" disabled={state === "sending"}>{state === "sending" ? text.sending : text.send}</button>
        <span>{text.hint}</span>
      </div>
      {state === "success" ? <p className="formNotice success">{text.success}</p> : null}
      {state === "db" ? <p className="formNotice">{text.db}</p> : null}
      {state === "rate" ? <p className="formNotice error">{text.rate}</p> : null}
      {state === "error" ? <p className="formNotice error">{text.error}</p> : null}
    </form>
  );
}
