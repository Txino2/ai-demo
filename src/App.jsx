import React, { useState, useRef, useEffect } from 'react';

// ==================== 自定义弹幕配置区域 ====================
// 每条弹幕包含：
// - text: 弹幕文本内容
// - startTime: 出现时间（秒）
// - showDuration: 滚动的持续时间（秒）
// - top: 垂直位置（可选，如 '30%', '50px'，默认 '45%'）
const DANMAKU_CONFIG = [
  // === 0-10s：弹幕较少 (铺垫期) ===
  { id: 101, text: "范闲真想见老婆了吧（捂嘴）", startTime: 2, showDuration: 8, top: '25%' },
  { id: 102, text: "敲锣打鼓敲锣打鼓", startTime: 4, showDuration: 8, top: '45%' },
  { id: 103, text: "那就见一见", startTime: 6, showDuration: 8, top: '15%' },
  { id: 104, text: "别去啊她哥哥要害你", startTime: 8, showDuration: 8, top: '65%' },

  // === 10s-20s：弹幕激增 (高潮互动期：见一见) ===
  { id: 201, text: "见一见见一见见一见见一见", startTime: 10, showDuration: 7, top: '10%' },
  { id: 202, text: "cos热心群众", startTime: 10.5, showDuration: 8, top: '30%' },
  { id: 203, text: "我也要喊吗", startTime: 11, showDuration: 7, top: '50%' },
  { id: 204, text: "婉儿婉儿婉儿", startTime: 11.8, showDuration: 8, top: '70%' },
  { id: 205, text: "这段怎么这么长啊，全是废话", startTime: 13, showDuration: 7, top: '20%' },
  { id: 206, text: "我剧情呢", startTime: 14, showDuration: 8, top: '40%' },
  { id: 207, text: "范闲你小子可美了", startTime: 15, showDuration: 7, top: '60%' },
  { id: 208, text: "磕到了", startTime: 16, showDuration: 8, top: '80%' },
  { id: 209, text: "哈哈哈哈哈哈范思辙助攻大师", startTime: 17, showDuration: 7, top: '15%' },
  { id: 210, text: "弹幕更是助攻大师（吃瓜）", startTime: 17.5, showDuration: 8, top: '35%' },

  // === 50s-60s：弹幕较多 (反馈转化期：KFC 联动) ===
  { id: 301, text: "？？？刚刚是什么", startTime: 50, showDuration: 7, top: '25%' },
  { id: 302, text: "真叫出来啦", startTime: 50.5, showDuration: 8, top: '45%' },
  { id: 303, text: "不用谢", startTime: 51, showDuration: 7, top: '65%' },
  { id: 304, text: "范闲人还怪好的，帮他喊人真送我疯四的券", startTime: 52, showDuration: 9, top: '15%' },
  { id: 305, text: "不是，你们在说什么？？", startTime: 52.5, showDuration: 7, top: '35%' },
  { id: 305, text: "追剧暂停，吃个KFC", startTime: 53, showDuration: 7, top: '25%' },
  { id: 306, text: "范闲：这顿我请", startTime: 53.5, showDuration: 8, top: '55%' },
  { id: 307, text: "鸡腿蛮逼真的，现在AI科技这么发达了", startTime: 54.5, showDuration: 8, top: '75%' },
  { id: 308, text: "你没有婉儿吃鸡腿的彩蛋啊", startTime: 56, showDuration: 7, top: '20%' },
  { id: 309, text: "AI!？ 蛮有意思的", startTime: 57, showDuration: 8, top: '40%' },

  // === 60s-65s：弹幕减少 (收尾收敛期) ===
  { id: 401, text: "哦，见了", startTime: 60, showDuration: 7, top: '30%' },
  { id: 402, text: "不错不错", startTime: 61, showDuration: 8, top: '50%' },
  { id: 403, text: "后面会怎么样", startTime: 62.5, showDuration: 7, top: '70%' },
  { id: 404, text: "范闲不要有事啊", startTime: 63.5, showDuration: 8, top: '40%' },
];
  // 用户可自行增删，未设置 top 的弹幕默认居中显示
// =======================================================

const App = () => {
  const [stage, setStage] = useState('landing'); 
  const [chatText, setChatText] = useState('');
  const [showInteraction, setShowInteraction] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [activeDanmakus, setActiveDanmakus] = useState([]);
  const videoRef = useRef(null);
  const danmakuTimersRef = useRef({});

  const videoUrl = "https://res.cloudinary.com/duuqoff8g/video/upload/v1778005774/AI-ads-product-demo_bbl5yg.mov?dl=0&format=mp4";

  // 同步弹幕：根据当前视频时间，激活/停用弹幕
  const syncDanmakus = (currentTime) => {
    Object.values(danmakuTimersRef.current).forEach(timer => clearTimeout(timer));
    danmakuTimersRef.current = {};
    
    const newActive = DANMAKU_CONFIG.filter(d => {
      const endTime = d.startTime + d.showDuration;
      return currentTime >= d.startTime && currentTime <= endTime;
    }).map(d => ({
      id: d.id,
      text: d.text,
      duration: d.showDuration,
      startTime: d.startTime,
      top: d.top || '45%',          // 支持自定义垂直位置，默认居中
    }));
    
    setActiveDanmakus(newActive);
    
    newActive.forEach(d => {
      const endTime = d.startTime + d.duration;
      const remaining = Math.max(0, (endTime - currentTime) * 1000);
      const timer = setTimeout(() => {
        setActiveDanmakus(prev => prev.filter(item => item.id !== d.id));
        delete danmakuTimersRef.current[d.id];
      }, remaining);
      danmakuTimersRef.current[d.id] = timer;
    });
  };

  // 监听视频时间变化，同步弹幕
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isStarted) return;
    
    const handleTimeUpdate = () => {
      const ct = video.currentTime;
      syncDanmakus(ct);
    };
    
    const handleSeeked = () => {
      const ct = video.currentTime;
      syncDanmakus(ct);
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
      Object.values(danmakuTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [isStarted]);

  // 1. Chatbot 逻辑打磨
  useEffect(() => {
    if (stage === 'chatting') {
      const fullText = 
      "► [Protocol] AI-Native 原生广告重置启动...\n" +
      "► [Target] 庆余年剧情：范闲求见林婉儿。\n" +
      "► [Agent Logic] 算法多维决策矩阵：\n" +
      "   1.【氛围识别】场景调性欢快，契合 KFC 品牌轻松属性。\n" +
      "   2.【剧情赋能】分析“见一见”台词+弹幕“求见婉儿”，下发“助攻见婉儿”互动策略。\n" +
      "   3.【安全判定】选中彩蛋片段为“千万级高频重温”内容 & 无其他品牌方植入，确认 0 剧透风险、0 侵权风险。\n" +
      "   4.【视觉关联】捕捉彩蛋片段中“鸡腿”关键语义，锚定 KFC 核心视觉符号。\n" +
      "► [Status] 视觉重绘完成，等待用户交互触发。";
      let i = 0;
      const timer = setInterval(() => {
        setChatText(fullText.slice(0, i));
        i++;
        if (i > fullText.length) {
          clearInterval(timer);
          setTimeout(() => setStage('playing'), 1200); 
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [stage]);

  // 获取 Chatbot 在播放时的动态话术
  const getAiStatus = (t) => {
    if (t < 10) return "🔍 AI 正在解析剧集内容与情感曲线...";
    if (t < 20) return "⚡ 检测到关键情感锚点，准备重构视觉道具...";
    if (t < 41.8) return "🎁 “鉴AI”彩蛋广告已加载：KFC 联动道具重绘完成，可交互。";
    if (t < 50) return "🔗 品牌链路已打通，点击可直达官方阵地。";
    return "✅ 交互闭环完成，算法推送记录已存档。";
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    
    setCountdown((t >= 17 && t < 20) ? Math.ceil(20 - t) : 0);
    setShowInteraction((t >= 28.8 && t <= 32.8) || (t >= 35 && t <= 39));
  };

  const handleStartPlay = async () => {
    if (!videoRef.current) return;
    try {
      videoRef.current.load();
      await videoRef.current.play();
      setIsStarted(true);
    } catch (err) { console.error(err); }
  };

  const handleDanmakuAnimationEnd = (id) => {
    setActiveDanmakus(prev => prev.filter(d => d.id !== id));
    if (danmakuTimersRef.current[id]) {
      clearTimeout(danmakuTimersRef.current[id]);
      delete danmakuTimersRef.current[id];
    }
  };

  if (stage === 'landing') {
    return (
      <div style={styles.container}>
        <div style={styles.heroSection}>
          <h1 style={styles.title}>AI 原生广告重构引擎</h1>
          <p style={styles.subtitle}>让品牌内容成为剧情的一部分</p>
        </div>
        <div style={styles.grid}>
          <div style={styles.card}><h4>实时识别</h4><p>自动锚定剧集道具与空镜</p></div>
          <div style={styles.card}><h4>动态重绘</h4><p>AI 毫秒级生成品牌植入</p></div>
          <div style={styles.card}><h4>交互转化</h4><p>打破第四面墙的点击体验</p></div>
        </div>
        <button style={styles.mainBtn} onClick={() => setStage('chatting')}>开始演示</button>
      </div>
    );
  }

  if (stage === 'chatting') {
    return (
      <div style={styles.container}>
        <div style={styles.chatBox}>
          <p style={{whiteSpace: 'pre-wrap', color: '#00f2ff', fontSize: '16px'}}>{chatText}</p>
        </div>
      </div>
    );
  }

  const currentTime = videoRef.current?.currentTime || 0;

  return (
    <div style={styles.container}>
      <div style={styles.aiMonitor}>
        <span style={{color: '#00f2ff', marginRight: '10px'}}>● AI MONITOR:</span>
        {getAiStatus(currentTime)}
      </div>

      <div style={styles.videoWrapper}>
        <video 
          ref={videoRef} src={videoUrl} crossOrigin="anonymous" playsInline
          onTimeUpdate={handleTimeUpdate} onEnded={() => setVideoEnded(true)}
          style={styles.video} controls={isStarted}
        />

        {!isStarted && (
          <div style={styles.playOverlay}>
            <button style={styles.mainBtn} onClick={handleStartPlay}>▶ 进入沉浸式互动剧集</button>
          </div>
        )}

        {isStarted && !videoEnded && (
          <div style={styles.danmuContainer}>
            {activeDanmakus.map(danmaku => (
              <div
                key={danmaku.id}
                className="danmu"
                style={{
                  top: danmaku.top,                    // 使用每条弹幕自定义的垂直位置
                  animationDuration: `${danmaku.duration}s`,
                }}
                onAnimationEnd={() => handleDanmakuAnimationEnd(danmaku.id)}
              >
                {danmaku.text}
              </div>
            ))}
          </div>
        )}

        {countdown > 0 && <div style={styles.countdown}>AI 彩蛋载入中... {countdown}s</div>}

        {showInteraction && (
          <div style={styles.target} onClick={() => alert("领券成功！")}>
            <div style={styles.ping} />
            <div style={styles.targetText}>👆 点击抢券</div>
          </div>
        )}

        {isStarted && currentTime >= 41.3 && currentTime < 48.8 && (
          <div style={styles.kfcButton} onClick={() => window.open('https://www.kfc.com.cn')}>
            <span style={{fontSize: '24px', marginRight: '8px'}}>🍗</span>
            <span>直通 KFC 疯狂星期四 ➔</span>
          </div>
        )}

        {isStarted && videoRef.current && !videoEnded && (
          <div style={styles.progressMarkers}>
            <div style={styles.markerTrack}>
              <div 
                style={{
                  ...styles.markerDot,
                  left: `${Math.min(100, Math.max(0, (20 / videoRef.current.duration) * 100))}%`
                }}
              >
                <span style={styles.markerLabel}>广告开始</span>
              </div>
              <div 
                style={{
                  ...styles.markerDot,
                  left: `${Math.min(100, Math.max(0, (50 / videoRef.current.duration) * 100))}%`
                }}
              >
                <span style={styles.markerLabel}>广告结束</span>
              </div>
            </div>
          </div>
        )}

        {videoEnded && (
          <div style={styles.overlay}>
            <h2 style={{color: '#fff', marginBottom: '20px'}}>演示结束</h2>
            <button style={{...styles.mainBtn, background: '#333'}} onClick={() => window.location.reload()}>重新播放</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes moveLeft { 
          from { transform: translateX(100vw); } 
          to { transform: translateX(-1200px); } 
        }
        @keyframes ping { 
          from { transform: scale(0.8); opacity: 1; } 
          to { transform: scale(1.4); opacity: 0; } 
        }
        .danmu { 
          position: absolute; 
          white-space: nowrap; 
          color: rgba(255,255,255,0.9); 
          font-size: 18px; 
          font-weight: 500;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          animation: moveLeft linear forwards;
          pointer-events: none;
          z-index: 15;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: { width: '100vw', height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'PingFang SC, sans-serif' },
  heroSection: { textAlign: 'center', marginBottom: '30px' },
  title: { fontSize: '28px', color: '#fff', fontWeight: '500', marginBottom: '10px' },
  subtitle: { fontSize: '14px', color: '#666' },
  grid: { display: 'flex', gap: '20px', marginBottom: '40px' },
  card: { background: '#1a1a1a', padding: '15px 25px', borderRadius: '8px', textAlign: 'center', width: '160px', border: '1px solid #333' },
  mainBtn: { padding: '12px 35px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', backdropFilter: 'blur(10px)' },
  chatBox: { width: '500px', padding: '30px', background: '#111', borderRadius: '4px', borderLeft: '3px solid #00f2ff' },
  aiMonitor: { width: '92%', maxWidth: '1000px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)' },
  videoWrapper: { position: 'relative', width: '92%', maxWidth: '1000px', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' },
  video: { width: '100%', display: 'block' },
  playOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', zIndex: 100 },
  danmuContainer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 10 },
  countdown: { position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', border: '1px solid #00f2ff', color: '#00f2ff', zIndex: 20 },
  target: { position: 'absolute', top: '60%', left: '28%', cursor: 'pointer', zIndex: 110, textAlign: 'center' },
  ping: { width: '70px', height: '70px', border: '2px solid #00f2ff', borderRadius: '50%', animation: 'ping 1s infinite' },
  targetText: { color: '#00f2ff', fontSize: '12px', marginTop: '8px', textShadow: '0 0 4px #000' },
  kfcButton: {
    position: 'absolute',
    bottom: '80px',
    right: '20px',
    background: 'rgba(60, 70, 90, 0.7)',
    backdropFilter: 'blur(10px)',
    padding: '12px 24px',
    borderRadius: '50px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    border: '1px solid rgba(150, 180, 210, 0.5)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    zIndex: 130,
    fontFamily: 'PingFang SC, sans-serif',
    letterSpacing: '1px',
  },
  progressMarkers: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    height: '30px',
    pointerEvents: 'none',
    zIndex: 25,
  },
  markerTrack: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  markerDot: {
    position: 'absolute',
    bottom: '8px',
    width: '10px',
    height: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    transform: 'translateX(-50%)',
    boxShadow: '0 0 6px rgba(255,255,255,0.8)',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  markerLabel: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '10px',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '2px 6px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  overlay: { position: 'absolute', inset: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200 }
};

export default App;
