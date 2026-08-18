import { API_BASE, BACKEND_URL } from '../config';
import { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, RefreshCw, Folder, WifiOff, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

// ---------- Session intervals in Ethiopian time (EAT) – unchanged ----------
const sydneyHours = [[0, 4], [18, 24]];
const tokyoHours   = [[0, 7], [21, 24]];
const londonHours  = [[4, 14]];
const newYorkHours = [[9, 18]];

const sessionColors = {
  sydney: '#f97316',
  tokyo: '#eab308',
  london: '#38bdf8',
  newYork: '#b91c1c',
};

// ---------- Relative time helper (handles Invalid Date) ----------
function getRelativeTime(eventDateStr, nowCairo) {
  const eventDate = new Date(eventDateStr);
  if (isNaN(eventDate.getTime())) return '';   // ignore broken dates

  const now = nowCairo || new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
  const diffMs = eventDate - now;
  const absMs = Math.abs(diffMs);
  const absTotalMinutes = Math.floor(absMs / 60000);

  if (absTotalMinutes < 1) return 'Just now';

  if (absTotalMinutes < 1440) {
    const hours = Math.floor(absTotalMinutes / 60);
    const minutes = absTotalMinutes % 60;
    const hhmm = `${hours}h ${String(minutes).padStart(2, '0')}m`;
    return diffMs >= 0 ? `in ${hhmm}` : `${hhmm} ago`;
  }

  const absDiffDays = Math.floor(absTotalMinutes / 1440);
  if (absDiffDays < 7) {
    return diffMs >= 0
      ? `in ${absDiffDays} day${absDiffDays > 1 ? 's' : ''}`
      : `${absDiffDays} day${absDiffDays > 1 ? 's' : ''} ago`;
  }

  return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------- Mini animated particles ----------
function SessionParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId, particles = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    class Particle {
      constructor() { this.reset(); }
      reset() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3; this.radius = Math.random() * 1.5 + 0.2; }
      update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > canvas.width) this.vx *= -1; if (this.y < 0 || this.y > canvas.height) this.vy *= -1; if (Math.random() < 0.002) this.reset(); }
      draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; ctx.fill(); }
    }
    const init = () => { resize(); particles = Array.from({ length: 40 }, () => new Particle()); };
    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(59, 130, 246, ${1 - dist / 80})`; ctx.lineWidth = 0.4; ctx.stroke(); }
      }
    };
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); drawLines(); animationFrameId = requestAnimationFrame(animate); };
    init(); animate(); window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl" style={{ zIndex: 0 }} />;
}

const isActive = (d, i) => i.some(([s, e]) => d >= s && d < e);
const polarToCartesian = (cx, cy, r, deg) => { const rad = deg * Math.PI / 180; return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }; };
const describeArc = (cx, cy, r, s, e) => {
  const start = polarToCartesian(cx, cy, r, e), end = polarToCartesian(cx, cy, r, s);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${e - s <= 180 ? '0' : '1'} 0 ${end.x} ${end.y}`;
};

export default function Market() {
  const [times, setTimes] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);  // -1, 0, 1 only

const fetchTimes = async () => {
  setTimes(null);
  try {
    // 1. Fetch accurate UTC time from WorldTimeAPI
    const utcRes = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
    if (!utcRes.ok) throw new Error('time fail');
    const utcData = await utcRes.json();

    // 2. Create a Date object from the UTC datetime string
    const utcDate = new Date(utcData.datetime);

    // 3. Derive Cairo and Addis Ababa times using toLocaleString with their timezones
    const cairoDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    const addisDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }));

    // 4. Add the 15‑minute shift (as before)
    cairoDate.setMinutes(cairoDate.getMinutes());
    addisDate.setMinutes(addisDate.getMinutes());

    setTimes({ cairo: cairoDate, addis: addisDate });
  } catch (err) {
    console.error('Time fetch error (using local fallback):', err);
    // Fallback to device time (still using timezones, but may be affected by VPN)
    const now = new Date();
    const cairoFallback = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    const addisFallback = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }));
    cairoFallback.setMinutes(cairoFallback.getMinutes());
    addisFallback.setMinutes(addisFallback.getMinutes());
    setTimes({ cairo: cairoFallback, addis: addisFallback });
  }
};

 const fetchCalendar = async () => {
  setLoadingEvents(true);
  try {
    // Use Ethiopian time to determine the current week (starts Sunday)
    const nowEthiopia = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' }));
    // Find the most recent Sunday (or today if it is Sunday)
    const sunday = new Date(nowEthiopia);
    sunday.setDate(nowEthiopia.getDate() - nowEthiopia.getDay() + weekOffset * 7);
    sunday.setHours(0, 0, 0, 0);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const fmt = d => d.toISOString().slice(0, 10);
    const url = `${API_BASE}/calendar?from=${fmt(sunday)}&to=${fmt(saturday)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    setEvents(data.events || []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingEvents(false);
  }
};

  useEffect(() => { fetchTimes(); const iv = setInterval(fetchTimes, 60000); return () => clearInterval(iv); }, []);
  useEffect(() => { fetchCalendar(); }, [weekOffset]);

  const goPrev = () => { if (weekOffset > -1) setWeekOffset(prev => prev - 1); };
  const goNext = () => { if (weekOffset < 1) setWeekOffset(prev => prev + 1); };
  const goCurr = () => setWeekOffset(0);

  const eatH = times?.addis ? times.addis.getHours() : 0;
  const eatM = times?.addis ? times.addis.getMinutes() : 0;
  const dec = eatH + eatM / 60;
  const sh = (eatH - 6 + 24) % 24; const sm = eatM; const sdec = sh + sm / 60;
  const act = [];
  if (isActive(sdec, sydneyHours)) act.push("Sydney");
  if (isActive(sdec, tokyoHours)) act.push("Tokyo");
  if (isActive(sdec, londonHours)) act.push("London");
  if (isActive(sdec, newYorkHours)) act.push("New York");
  const sess = act.length ? act.join(" + ") : "No Session";
  const open = times?.addis ? !(times.addis.getDay() === 6 || times.addis.getDay() === 0) : false;
  const angle = (sdec / 24) * 360 - 90;
  const center = 170, radius = 130, sw = 10;
  const segments = [];
  const allSess = [{ i: sydneyHours, c: sessionColors.sydney }, { i: tokyoHours, c: sessionColors.tokyo }, { i: londonHours, c: sessionColors.london }, { i: newYorkHours, c: sessionColors.newYork }];
  allSess.forEach(({ i, c }) => i.forEach(([s, e]) => { segments.push({ s: ((s / 24) * 360 - 90), e: ((e / 24) * 360 - 90), c }); }));
  const fmt12 = (d) => d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';
  const fmtSh = (h, m) => { const h12 = h % 12 || 12; return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };

  const grouped = {};
  events.forEach(ev => {
    const key = ev.adjustedISO || ev.date?.slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  return (
    <div className="space-y-5 animate-fade-in px-[5px] py-4">
      {/* Header clocks */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-av-text">Market Overview</h1><p className="text-av-muted text-sm">Live internet time & economic calendar</p></div>
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 flex items-center gap-2 border border-av-border/50 rounded-xl"><Clock size={16} className="text-av-primary"/><div><p className="text-[10px] text-av-muted uppercase">Cairo</p><p className="text-sm font-mono font-bold text-av-text">{fmt12(times?.cairo)}</p></div></div>
          <div className="glass-card px-4 py-2 flex items-center gap-2 border border-av-border/50 rounded-xl"><Clock size={16} className="text-av-accent"/><div><p className="text-[10px] text-av-muted uppercase">Addis Ababa</p><p className="text-sm font-mono font-bold text-av-text">{fmtSh(sh, sm)}</p></div></div>
        </div>
      </div>

      {/* Session clock */}
      {times && (
        <div className="glass-card border border-av-border/50 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <SessionParticles />
          <div className="relative z-10 p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-av-muted mb-4 flex items-center gap-2"><Clock size={16} className="text-av-accent"/> Trading Session Clock</h3>
            <div className="relative w-[340px] h-[340px] mx-auto">
              <svg width="340" height="340" viewBox="0 0 340 340">
                <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e293b" strokeWidth={sw} />
                {segments.map((seg, i) => <path key={i} d={describeArc(center, center, radius, seg.s, seg.e)} fill="none" stroke={seg.c} strokeWidth={sw} opacity="0.8" strokeLinecap="round"/>)}
                {Array.from({ length: 24 }).map((_, i) => { const a = (i / 24) * 360 - 90; const p1 = polarToCartesian(center, center, radius - sw / 2 - 6, a), p2 = polarToCartesian(center, center, radius + sw / 2 + 6, a); return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#334155" strokeWidth="1"/>; })}
                <line x1={center} y1={center} x2={polarToCartesian(center, center, radius - 12, angle).x} y2={polarToCartesian(center, center, radius - 12, angle).y} stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx={polarToCartesian(center, center, radius - 12, angle).x} cy={polarToCartesian(center, center, radius - 12, angle).y} r="5" fill="white" filter="url(#glow)"/>
                <defs><filter id="glow"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-av-text">{fmtSh(sh, sm)}</span>
                <span className="text-xs text-av-muted mt-1">Session Time</span>
                <span className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${open ? 'bg-av-accent/20 text-av-accent' : 'bg-av-danger/20 text-av-danger'}`}>{open ? sess : 'Weekend'}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">{Object.entries(sessionColors).map(([n, c]) => <div key={n} className="flex items-center gap-1.5 text-xs text-av-muted"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}` }}/>{n.charAt(0).toUpperCase()+n.slice(1)}</div>)}</div>
          </div>
        </div>
      )}

      {/* Timezone warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5"/>
        <div><p className="text-sm text-av-text">⚠️ All event times are in <strong className="text-yellow-400">Cairo time zone (EET/EEST)</strong>, not in <strong className="text-yellow-400">Addis Ababa</strong>.</p></div>
      </div>

      {/* Economic Calendar – real data */}
      <div className="glass-card p-5 border border-av-border/50 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar size={20} className="text-av-primary"/> Economic Calendar</h3>
          <div className="flex items-center gap-1">
            <button onClick={goPrev} disabled={weekOffset <= -1} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${weekOffset === -1 ? 'bg-av-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-av-surface text-av-muted border border-av-border hover:border-av-primary/50'}`}><ChevronLeft size={14} className="inline mr-1"/>Previous Week</button>
            <button onClick={goCurr} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${weekOffset === 0 ? 'bg-av-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-av-surface text-av-muted border border-av-border hover:border-av-primary/50'}`}>Current Week</button>
            <button onClick={goNext} disabled={weekOffset >= 1} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${weekOffset === 1 ? 'bg-av-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-av-surface text-av-muted border border-av-border hover:border-av-primary/50'}`}>Next Week<ChevronRight size={14} className="inline ml-1"/></button>
            <button onClick={fetchCalendar} className="ml-2 p-1 text-av-muted hover:text-av-text" title="Refresh"><RefreshCw size={16}/></button>
          </div>
        </div>

        {loadingEvents ? <p className="text-center text-av-muted py-8">Loading events…</p> :
         events.length === 0 ? <p className="text-center text-av-muted py-8">No events for this week.</p> :
         <div className="space-y-3">
           {Object.entries(grouped).map(([dateKey, dayEvents]) => (
             <div key={dateKey}>
               <h4 className="text-sm font-bold text-av-text mb-1 ml-1">{dayEvents[0]?.day} – <span className="text-av-muted font-normal">{dayEvents[0]?.dayDate}</span></h4>
               <div className="overflow-x-auto rounded-xl">
                 <table className="w-full text-sm">
                   <thead><tr className="text-left text-av-muted border-b border-av-border"><th className="pb-2 pr-3">Time</th><th className="pb-2 pr-3">Currency</th><th className="pb-2 pr-3">Event</th><th className="pb-2 pr-3">Impact</th><th className="pb-2 pr-3">Actual</th><th className="pb-2 pr-3">Forecast</th><th className="pb-2">Previous</th></tr></thead>
                   <tbody>
                     {dayEvents.map((ev, idx) => {
                       const eventDate = new Date(ev.date);
                       const isInvalid = isNaN(eventDate.getTime());
                       const nowCairo = times?.cairo || new Date();
                       const isPast = !isInvalid && eventDate < nowCairo;
                       const relative = !isInvalid ? getRelativeTime(ev.date, nowCairo) : '';
                       return (
                         <tr key={idx} className={`border-b border-av-border/40 hover:bg-av-bg/50 ${isPast ? 'text-gray-500 font-normal' : 'text-av-text font-bold'}`}>
                           <td className="py-3 pr-3 font-mono">{ev.time}{relative && <span className="ml-1 text-[10px] opacity-70">({relative})</span>}</td>
                           <td className="py-3 pr-3">{ev.currency}</td>
                           <td className="py-3 pr-3">{ev.event}</td>
                           <td className="py-3 pr-3"><ImpactFolder impact={ev.impact}/></td>
                           <td className={`py-3 pr-3 ${ev.actual ? '' : 'opacity-60'}`}>{ev.actual || '--'}</td>
                           <td className="py-3 pr-3 opacity-80">{ev.forecast || '--'}</td>
                           <td className="py-3 opacity-80">{ev.previous || '--'}</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             </div>
           ))}
         </div>}
      </div>
    </div>
  );
}

function ImpactFolder({ impact }) {
  let color = 'text-yellow-400', label = 'Low';
  if (impact === 'high') { color = 'text-av-danger'; label = 'High'; }
  else if (impact === 'medium') { color = 'text-av-warning'; label = 'Medium'; }
  return <span className={`inline-flex items-center gap-1.5 font-medium ${color}`}><Folder size={16} className="fill-current"/><span className="text-xs">{label}</span></span>;
}