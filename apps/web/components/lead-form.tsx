"use client";

import { FormEvent, useState } from "react";

type LeadFormProps = {
  productId?: string;
  productLabel?: string;
};

export function LeadForm({ productId, productLabel }: LeadFormProps) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error" | "db">("idle");

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
    setState(payload?.error === "database_unavailable" ? "db" : "error");
  }

  return (
    <form className="leadForm" onSubmit={submit}>
      {productLabel ? <p className="leadContext">Запрос по продукту: <strong>{productLabel}</strong></p> : null}
      <div className="formGrid">
        <label>Имя<input name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label>Компания<input name="company" maxLength={160} autoComplete="organization" /></label>
        <label>Email<input name="email" type="email" maxLength={200} autoComplete="email" /></label>
        <label>Телефон<input name="phone" maxLength={80} autoComplete="tel" /></label>
      </div>
      <label>Комментарий<textarea name="message" rows={4} maxLength={3000} placeholder="Опишите задачу, объект или интересующее оборудование" /></label>
      <div className="formFooter">
        <button className="button" type="submit" disabled={state === "sending"}>{state === "sending" ? "Отправляем…" : "Отправить запрос"}</button>
        <span>Укажите телефон или email, чтобы мы могли связаться с вами.</span>
      </div>
      {state === "success" ? <p className="formNotice success">Запрос принят. Он появился в панели управления.</p> : null}
      {state === "db" ? <p className="formNotice">Форма готова, но локальная PostgreSQL пока не подключена. После подключения БД запросы начнут сохраняться.</p> : null}
      {state === "error" ? <p className="formNotice error">Не удалось отправить запрос. Проверьте контактные данные и повторите попытку.</p> : null}
    </form>
  );
}
