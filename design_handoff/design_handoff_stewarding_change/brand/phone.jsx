// Phone mockup — Stewarding Change round-ups dashboard
// iPhone 14 Pro silhouette, navy app interior matching the brand.

function PhoneMockup({ scale = 1 }) {
  const W = 320, H = 650; // phone body
  const s = v => v * scale;
  return (
    <div style={{
      width: s(W + 24), height: s(H + 24), position:'relative',
      filter:'drop-shadow(0 40px 60px rgba(0,0,0,0.5))',
    }}>
      <div style={{
        width: s(W), height: s(H),
        background:'#0B1224',
        borderRadius: s(48),
        border:`${s(3)}px solid #1a2340`,
        position:'absolute', left: s(12), top: s(12),
        overflow:'hidden',
        boxShadow:`inset 0 0 0 ${s(2)}px #000`,
      }}>
        {/* dynamic island */}
        <div style={{
          position:'absolute', top: s(14), left:'50%', transform:'translateX(-50%)',
          width: s(100), height: s(28), background:'#000', borderRadius: s(20), zIndex:10,
        }}/>
        {/* status bar */}
        <div style={{
          position:'absolute', top: s(18), left: s(24), right: s(24),
          display:'flex', justifyContent:'space-between', alignItems:'center',
          color:'#fff', fontSize: s(13), fontWeight:600, fontFamily:'Inter',
        }}>
          <span>9:41</span>
          <div style={{display:'flex', gap: s(5), alignItems:'center'}}>
            {/* signal */}
            <svg width={s(17)} height={s(10)} viewBox="0 0 17 10">
              {[0,1,2,3].map(i => <rect key={i} x={i*4} y={9-i*2-1} width="3" height={i*2+2} rx="0.5" fill="#fff"/>)}
            </svg>
            {/* wifi */}
            <svg width={s(15)} height={s(10)} viewBox="0 0 15 10" fill="#fff">
              <path d="M7.5 0C4.5 0 1.8 1.2 0 3l1.4 1.4C2.9 3 5.1 2 7.5 2s4.6 1 6.1 2.4L15 3C13.2 1.2 10.5 0 7.5 0z"/>
              <path d="M7.5 4C5.6 4 3.9 4.8 2.8 6l1.4 1.4c.9-.9 2.1-1.4 3.3-1.4s2.4.5 3.3 1.4L12.2 6C11.1 4.8 9.4 4 7.5 4z"/>
              <circle cx="7.5" cy="9" r="1.2"/>
            </svg>
            {/* battery */}
            <svg width={s(24)} height={s(10)} viewBox="0 0 24 10">
              <rect x="0.5" y="0.5" width="21" height="9" rx="2" fill="none" stroke="#fff" strokeOpacity="0.5"/>
              <rect x="2" y="2" width="18" height="6" rx="1" fill="#fff"/>
              <rect x="22" y="3.5" width="1.5" height="3" rx="0.5" fill="#fff" fillOpacity="0.5"/>
            </svg>
          </div>
        </div>

        {/* app body */}
        <div style={{
          position:'absolute', top: s(58), left: 0, right: 0, bottom: 0,
          background:'#0B1224',
          padding: `${s(14)}px ${s(18)}px 0`,
          fontFamily:'Inter',
        }}>
          {/* app header */}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: s(16)}}>
            <div style={{display:'flex', alignItems:'center', gap: s(8)}}>
              <div style={{width: s(22), height: s(22)}}><FlatMark size={s(22)} variant="navy-filled"/></div>
              <span style={{color:'#fff', fontSize: s(14), fontWeight:600}}>Stewarding Change</span>
            </div>
            <svg width={s(18)} height={s(18)} viewBox="0 0 18 18" fill="none" stroke="#B8C4DD" strokeWidth="1.5">
              <path d="M9 2a5 5 0 0 0-5 5v3l-2 3h14l-2-3V7a5 5 0 0 0-5-5zM7 15a2 2 0 0 0 4 0"/>
            </svg>
          </div>

          {/* hero balance card */}
          <div style={{
            background:'linear-gradient(135deg, #1E3A8A 0%, #0B1F3A 100%)',
            borderRadius: s(18),
            padding: `${s(16)}px ${s(18)}px`,
            border: '1px solid rgba(79,143,247,0.22)',
            marginBottom: s(14),
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: s(10)}}>
              <div style={{display:'flex', alignItems:'center', gap: s(6)}}>
                <span style={{width: s(6), height: s(6), borderRadius:'50%', background:'#34D399'}}/>
                <span style={{color:'#34D399', fontSize: s(10), fontWeight:500}}>Active</span>
              </div>
              <span style={{color:'#B8C4DD', fontSize: s(10)}}>Grace Community</span>
            </div>
            <div style={{display:'flex', alignItems:'baseline', gap: s(6), marginBottom: s(4)}}>
              <span style={{color:'#fff', fontSize: s(36), fontWeight:600, letterSpacing:'-0.02em'}}>$1.72</span>
              <span style={{color:'#B8C4DD', fontSize: s(13)}}>today</span>
            </div>
            <div style={{color:'#60A5FA', fontSize: s(11), fontWeight:500, marginBottom: s(10)}}>
              ↑ +$21.46 this month
            </div>
            {/* progress bar */}
            <div style={{height: s(4), background:'rgba(255,255,255,0.1)', borderRadius: s(3), overflow:'hidden', marginBottom: s(8)}}>
              <div style={{width:'64%', height:'100%', background:'#60A5FA'}}/>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize: s(10)}}>
              <span style={{color:'#B8C4DD'}}>Roof Restoration Fund</span>
              <span style={{color:'#fff', fontWeight:500}}>$21.46 / $33.42</span>
            </div>
          </div>

          {/* round-ups header */}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: s(10)}}>
            <span style={{color:'#fff', fontSize: s(14), fontWeight:600}}>Round-ups</span>
            <span style={{color:'#60A5FA', fontSize: s(11), fontWeight:500}}>See all</span>
          </div>

          {/* transaction rows */}
          {[
            {icon:'☕', name:'Coffee Shop',  sub:'Today · $4.27',    amount:'+$0.73'},
            {icon:'⛽', name:'Gas Station',  sub:'Yesterday · $38.59', amount:'+$0.41'},
            {icon:'🎬', name:'Theater Tickets', sub:'Apr 18 · $24.42', amount:'+$0.58'},
          ].map((t,i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap: s(10),
              padding: `${s(10)}px ${s(12)}px`,
              background:'rgba(30,58,138,0.2)',
              border:'1px solid rgba(79,143,247,0.12)',
              borderRadius: s(14),
              marginBottom: s(8),
            }}>
              <div style={{
                width: s(32), height: s(32), borderRadius: s(9),
                background:'rgba(79,143,247,0.18)',
                display:'grid', placeItems:'center', fontSize: s(14),
              }}>{t.icon}</div>
              <div style={{flex:1}}>
                <div style={{color:'#fff', fontSize: s(12), fontWeight:500}}>{t.name}</div>
                <div style={{color:'#6B7BA3', fontSize: s(10)}}>{t.sub}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{color:'#60A5FA', fontSize: s(12), fontWeight:600}}>{t.amount}</div>
                <div style={{color:'#6B7BA3', fontSize: s(9)}}>rounded</div>
              </div>
            </div>
          ))}
        </div>

        {/* bottom tab bar */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          height: s(72),
          background:'rgba(11,18,36,0.95)',
          borderTop:'1px solid rgba(79,143,247,0.1)',
          display:'flex', justifyContent:'space-around', alignItems:'flex-start',
          paddingTop: s(10),
        }}>
          {[
            {label:'Home', icon:'M3 10l7-7 7 7v9a2 2 0 0 1-2 2h-3v-6H8v6H5a2 2 0 0 1-2-2z', active:true},
            {label:'Mission', icon:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z', active:false},
            {label:'Activity', icon:'M3 12h4l2-7 4 14 2-7h4', active:false},
            {label:'Account', icon:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z', active:false},
          ].map((t,i) => (
            <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap: s(3)}}>
              <svg width={s(20)} height={s(20)} viewBox="0 0 24 24" fill="none"
                stroke={t.active ? '#60A5FA' : '#6B7BA3'} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                <path d={t.icon}/>
              </svg>
              <span style={{fontSize: s(9.5), color: t.active ? '#60A5FA' : '#6B7BA3', fontWeight: t.active?600:500}}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PhoneMockup });
