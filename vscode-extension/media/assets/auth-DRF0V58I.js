import{c as l,d as s,h as p,b as t,n as r,q as S,G as k,t as x,u as E,s as c,v as $,m as d,o as A}from"./index-CH1Kwb_S.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=l("AlertCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=l("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=l("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=l("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);async function m(n){if(!s)return null;const e=await d(t(s,`usernames/${n.toLowerCase()}`));return e.exists()?e.val():null}async function v(n){if(!s)return null;const e=await d(t(s,`users/${n}`));return e.exists()?e.val():null}const C=24*60*60*1e3;function b(){return`${Date.now()}_${Math.random().toString(36).slice(2,9)}`}async function y(n){if(!s)return;const e=await d(t(s,n));if(!e.exists())return;const a=e.val();if(Date.now()-((a==null?void 0:a.loginAt)??0)>C){await p(t(s,n));return}throw new Error("session-active")}async function u(n){if(!s)return;const e=t(s,n);await c(e,{token:b(),loginAt:Date.now()}),A(e).remove()}async function I(n){if(!s)return;const e=n==="admin"?"activeSessions/admin":`users/${n}/activeSession`;await p(t(s,e))}async function M(){s&&(await y("activeSessions/admin"),await u("activeSessions/admin"))}async function q(n){if(!s||!r)throw new Error("firebase-not-configured");const{email:e,password:a,username:i,pin:o,color:g}=n;if(await m(i))throw new Error("username-taken");const w=(await E(r,e,a)).user.uid,h={username:i,email:e,role:"Usuario",color:g,pin:o,provider:"email",createdAt:Date.now()};return await c(t(s,`users/${w}`),h),await c(t(s,`usernames/${i.toLowerCase()}`),w),await u(`users/${w}/activeSession`),{...h,uid:w}}async function R(n,e){if(!s||!r)throw new Error("firebase-not-configured");const a=await m(n);if(!a)throw new Error("user-not-found");const i=await v(a);if(!i)throw new Error("user-not-found");return await y(`users/${a}/activeSession`),await S(r,i.email,e),await u(`users/${a}/activeSession`),{...i,uid:a}}async function z(){if(!r)throw new Error("firebase-not-configured");const n=new k,e=await x(r,n),a=e.user.uid,i=e.user.email??"",o=await v(a);return o&&(await y(`users/${a}/activeSession`),await u(`users/${a}/activeSession`)),{profile:o,isNew:!o,uid:a,googleEmail:i}}async function B(n){if(!s)throw new Error("firebase-not-configured");const{uid:e,email:a,username:i,color:o}=n;if(await m(i))throw new Error("username-taken");const f={username:i,email:a,role:"Usuario",color:o,pin:"",provider:"google",createdAt:Date.now()};return await c(t(s,`users/${e}`),f),await c(t(s,`usernames/${i.toLowerCase()}`),e),await u(`users/${e}/activeSession`),{...f,uid:e}}async function O(n){if(!r)throw new Error("firebase-not-configured");await $(r,n)}export{P as A,U as C,W as L,G as S,B as a,O as b,M as c,I as d,R as l,q as r,z as s};
