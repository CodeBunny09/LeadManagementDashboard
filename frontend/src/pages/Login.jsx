import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Login({ setToken }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const cursorGlowRef = useRef(null);
  const particlesRef = useRef(null);

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  // ===== Cursor Glow =====
  useEffect(() => {
    const glow = cursorGlowRef.current;
    let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function animate() {
      glowX += (mouseX - glowX) * 0.1;
      glowY += (mouseY - glowY) * 0.1;
      glow.style.left = glowX + "px";
      glow.style.top = glowY + "px";
      requestAnimationFrame(animate);
    }

    document.addEventListener("mousemove", onMouseMove);
    animate();

    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);

  // ===== Floating Particles =====
  useEffect(() => {
    const container = particlesRef.current;
    for (let i = 0; i < 80; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDelay = Math.random() * 15 + "s";
      p.style.animationDuration = Math.random() * 10 + 10 + "s";
      container.appendChild(p);
    }
  }, []);

  // ===== Card Tilt =====
  function handleCardMove(e) {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
  }

  function handleCardLeave() {
    cardRef.current.style.transform =
      "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
  }

  // ===== LOGIN =====
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      navigate("/");
    } catch (err) {
      alert("Login failed");
    }
    setLoading(false);
  }

  return (
    <>
      {/* ===== Inline Global Styles ===== */}
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:Segoe UI,Roboto,Arial;background:#0a0e27;overflow:hidden;}
        .background{position:fixed;width:100%;height:100%;background:linear-gradient(135deg,#0a0e27,#1a1f3a,#0f1428);}
        .orb{position:absolute;border-radius:50%;filter:blur(60px);opacity:.6;animation:float 20s infinite;}
        .orb1{width:400px;height:400px;background:linear-gradient(135deg,#667eea,#764ba2);top:-100px;left:-100px;}
        .orb2{width:350px;height:350px;background:linear-gradient(135deg,#f093fb,#f5576c);bottom:-100px;right:-100px;animation-delay:5s;}
        .orb3{width:300px;height:300px;background:linear-gradient(135deg,#4facfe,#00f2fe);top:50%;left:50%;transform:translate(-50%,-50%);animation-delay:10s;}
        .orb4{width:250px;height:250px;background:linear-gradient(135deg,#fa709a,#fee140);top:20%;right:10%;animation-delay:3s;}
        .orb5{width:200px;height:200px;background:linear-gradient(135deg,#30cfd0,#330867);bottom:30%;left:20%;animation-delay:7s;}
        .particle{position:absolute;width:2px;height:2px;background:rgba(255,255,255,.5);border-radius:50%;animation:particleFloat linear infinite;}
        .cursor-glow{position:fixed;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(102,126,234,.4),transparent 70%);pointer-events:none;filter:blur(40px);z-index:1;}
        .container{position:relative;z-index:10;display:flex;justify-content:center;align-items:center;min-height:100vh;}
        .login-card{background:rgba(255,255,255,.05);backdrop-filter:blur(20px);border-radius:24px;padding:50px 40px;width:440px;border:1px solid rgba(255,255,255,.1);box-shadow:0 25px 50px rgba(0,0,0,.3);}
        h1{color:white;font-size:28px;font-weight:700;}
        .subtitle{color:rgba(255,255,255,.6);font-size:14px;}
        label{color:white;font-size:14px;margin-bottom:6px;display:block;}
        input{width:100%;padding:14px 16px 14px 48px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:12px;color:white;}
        .input-wrapper{position:relative;margin-bottom:20px;}
        .input-icon{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.5);}
        .submit-btn{width:100%;padding:16px;border:none;border-radius:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-weight:600;cursor:pointer;}
        @keyframes float{0%,100%{transform:translate(0,0);}33%{transform:translate(50px,-50px);}66%{transform:translate(-50px,50px);}}
        @keyframes particleFloat{0%{transform:translateY(100vh);opacity:0;}10%{opacity:1;}100%{transform:translateY(-100vh);opacity:0;}}
      `}</style>

      {/* ===== BACKGROUND ===== */}
      <div className="background">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
        <div className="orb orb4"></div>
        <div className="orb orb5"></div>
        <div ref={particlesRef}></div>
      </div>

      <div ref={cursorGlowRef} className="cursor-glow"></div>

      {/* ===== LOGIN CARD ===== */}
      <div className="container">
        <div
          className="login-card"
          ref={cardRef}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{
              width:60,height:60,borderRadius:16,
              background:"linear-gradient(135deg,#667eea,#764ba2)",
              display:"inline-flex",alignItems:"center",justifyContent:"center",
              fontSize:32,color:"white",marginBottom:16
            }}>⚡</div>
            <h1>Welcome Back</h1>
            <p className="subtitle">Sign in to access your CRM dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input value={email} onChange={e=>setEmail(e.target.value)} />
            </div>

            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>

            <button className="submit-btn" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
