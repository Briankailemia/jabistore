"use strict";(()=>{var e={};e.id=4198,e.ids=[4198],e.modules={96330:e=>{e.exports=require("@prisma/client")},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},44870:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},79646:e=>{e.exports=require("child_process")},55511:e=>{e.exports=require("crypto")},14985:e=>{e.exports=require("dns")},94735:e=>{e.exports=require("events")},29021:e=>{e.exports=require("fs")},81630:e=>{e.exports=require("http")},55591:e=>{e.exports=require("https")},91645:e=>{e.exports=require("net")},21820:e=>{e.exports=require("os")},33873:e=>{e.exports=require("path")},27910:e=>{e.exports=require("stream")},34631:e=>{e.exports=require("tls")},79551:e=>{e.exports=require("url")},28354:e=>{e.exports=require("util")},74075:e=>{e.exports=require("zlib")},23153:(e,r,s)=>{s.r(r),s.d(r,{patchFetch:()=>b,routeModule:()=>h,serverHooks:()=>x,workAsyncStorage:()=>y,workUnitAsyncStorage:()=>f});var t={};s.r(t),s.d(t,{POST:()=>g});var o=s(42706),a=s(28203),i=s(45994),n=s(35743),p=s(65287),u=s(74559),l=s(14605),c=s(71018),m=s(51978);let d=m.Ikc({name:m.YjP().min(1,"Name is required").max(255,"Name is too long"),email:m.YjP().email("Invalid email format"),subject:m.YjP().min(1,"Subject is required").max(255,"Subject is too long"),message:m.YjP().min(10,"Message must be at least 10 characters").max(5e3,"Message is too long"),category:m.YjP().optional(),orderNumber:m.YjP().optional()}),g=(0,n.Rq)({rateLimiter:p.bO,validator:(0,u.S)(d),handler:async e=>{let r=e.validatedData;try{return await (0,l.og)(r),c.Ay.info("Support email sent",{email:r.email,subject:r.subject,category:r.category,orderNumber:r.orderNumber}),n.sh.success({message:"Your support request has been sent successfully. We will respond within 4 hours."},"Support request sent successfully")}catch(e){return c.Ay.error("Error sending support email",{error:e.message,email:r.email}),n.sh.error("Failed to send support request. Please try again later or contact us directly.",500)}}}),h=new o.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/support/email/route",pathname:"/api/support/email",filename:"route",bundlePath:"app/api/support/email/route"},resolvedPagePath:"/Users/user/Desktop/RogueApe/work/jabistore/src/app/api/support/email/route.js",nextConfigOutput:"",userland:t}),{workAsyncStorage:y,workUnitAsyncStorage:f,serverHooks:x}=h;function b(){return(0,i.patchFetch)({workAsyncStorage:y,workUnitAsyncStorage:f})}},14605:(e,r,s)=>{s.d(r,{Pe:()=>u,og:()=>l});var t=s(98721),o=s(84574),a=s(71018);async function i(){try{let e=await o.zR.settings.findUnique({where:{key:"smtp"}});if(e?.value){let r=e.value;return{host:r.host||process.env.SMTP_HOST,port:r.port||parseInt(process.env.SMTP_PORT||"587"),secure:r.secure||465===r.port,auth:{user:r.user||process.env.SMTP_USER,pass:r.pass||process.env.SMTP_PASS},from:r.from||process.env.SMTP_FROM||r.user||process.env.SMTP_USER}}return{host:process.env.SMTP_HOST,port:parseInt(process.env.SMTP_PORT||"587"),secure:"465"===process.env.SMTP_PORT,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},from:process.env.SMTP_FROM||process.env.SMTP_USER}}catch(e){return a.Ay.error("Error getting email config",{error:e.message}),{host:process.env.SMTP_HOST,port:parseInt(process.env.SMTP_PORT||"587"),secure:"465"===process.env.SMTP_PORT,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},from:process.env.SMTP_FROM||process.env.SMTP_USER}}}async function n(){let e=await i();if(!e.host||!e.auth?.user||!e.auth?.pass)throw Error("Email configuration is incomplete. Please configure SMTP settings in admin panel or environment variables.");return t.createTransport({host:e.host,port:e.port,secure:e.secure,auth:e.auth})}async function p({to:e,subject:r,text:s,html:t,from:o,replyTo:p,cc:u,bcc:l}){try{let c=await i(),m=await n(),d={from:o||c.from,to:e,subject:r,text:s,html:t||s?.replace(/\n/g,"<br>"),replyTo:p||o||c.from,cc:u,bcc:l},g=await m.sendMail(d);return a.Ay.info("Email sent successfully",{to:e,subject:r,messageId:g.messageId}),{success:!0,messageId:g.messageId,response:g.response}}catch(s){throw a.Ay.error("Error sending email",{error:s.message,to:e,subject:r,stack:s.stack}),Error(`Failed to send email: ${s.message}`)}}async function u(e){let{name:r,email:s,subject:t,message:i,category:n}=e,u="support@dilitechsolutions.com";try{let e=await o.zR.settings.findUnique({where:{key:"store"}});e?.value?.storeEmail&&(u=e.value.storeEmail)}catch(e){a.Ay.warn("Could not fetch store email from settings",{error:e.message})}return p({to:u,subject:n?`[${n}] ${t}`:t,text:`
New contact form submission from ${r} (${s})

Subject: ${t}
${n?`Category: ${n}
`:""}

Message:
${i}

---
This email was sent from the contact form on your website.
Reply directly to this email to respond to ${r} at ${s}
  `.trim(),html:`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">New Contact Form Submission</h2>
      <p><strong>From:</strong> ${r} (${s})</p>
      <p><strong>Subject:</strong> ${t}</p>
      ${n?`<p><strong>Category:</strong> ${n}</p>`:""}
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 5px;">${i.replace(/\n/g,"<br>")}</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This email was sent from the contact form on your website.<br>
        Reply directly to this email to respond to ${r} at ${s}
      </p>
    </div>
  `,replyTo:s})}async function l(e){let{name:r,email:s,subject:t,message:i,category:n,orderNumber:u}=e,l="support@dilitechsolutions.com";try{let e=await o.zR.settings.findUnique({where:{key:"store"}});e?.value?.storeEmail&&(l=e.value.storeEmail)}catch(e){a.Ay.warn("Could not fetch store email from settings",{error:e.message})}return p({to:l,subject:n?`[${n}] ${t}`:t,text:`
New support request from ${r} (${s})

Subject: ${t}
${n?`Category: ${n}
`:""}
${u?`Order Number: ${u}
`:""}

Message:
${i}

---
This email was sent from the support form on your website.
Reply directly to this email to respond to ${r} at ${s}
  `.trim(),html:`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">New Support Request</h2>
      <p><strong>From:</strong> ${r} (${s})</p>
      <p><strong>Subject:</strong> ${t}</p>
      ${n?`<p><strong>Category:</strong> ${n}</p>`:""}
      ${u?`<p><strong>Order Number:</strong> ${u}</p>`:""}
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 5px;">${i.replace(/\n/g,"<br>")}</p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        This email was sent from the support form on your website.<br>
        Reply directly to this email to respond to ${r} at ${s}
      </p>
    </div>
  `,replyTo:s})}}};var r=require("../../../../webpack-runtime.js");r.C(e);var s=e=>r(r.s=e),t=r.X(0,[5994,5452,1978,8721,472],()=>s(23153));module.exports=t})();