import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import '@/styles/global.css';

// Simple components directly in App
function Header() {
  return (
    <header style={{ borderBottom: '1px solid #e5e5e5', padding: '16px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="GymFlow" style={{ height: '40px' }} />
        </Link>
        <nav style={{ display: 'flex', gap: '24px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#666', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Inicio</Link>
          <Link to="/login" style={{ textDecoration: 'none', color: '#666', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Login</Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #e5e5e5', padding: '32px 0', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
        <img src="/logo.png" alt="GymFlow" style={{ height: '50px', marginBottom: '16px' }} />
        <p style={{ color: '#666', fontSize: '14px' }}>© 2024 GymFlow. Gestión Integral de Gimnasios.</p>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <main>
      <section style={{ padding: '80px 16px', textAlign: 'center', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span style={{ display: 'inline-block', padding: '4px 12px', border: '1px solid #000', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
            Plataforma SaaS para Gimnasios
          </span>
          <img src="/logo.png" alt="GymFlow" style={{ height: '80px', marginBottom: '24px' }} />
          <p style={{ fontSize: '20px', color: '#666', maxWidth: '600px', margin: '0 auto 32px' }}>
            El sistema completo para gestionar tu gimnasio. Reservas, pagos, membresías y más.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register" style={{ padding: '16px 32px', background: '#000', color: '#fff', textDecoration: 'none', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>
              Comenzar Gratis
            </Link>
            <Link to="/login" style={{ padding: '16px 32px', border: '1px solid #000', color: '#000', textDecoration: 'none', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '64px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '48px' }}>Planes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { name: 'Básico', price: 49 },
              { name: 'Pro', price: 99 },
              { name: 'Enterprise', price: 199 }
            ].map(plan => (
              <div key={plan.name} style={{ border: '1px solid #e5e5e5', padding: '24px', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '8px' }}>{plan.name}</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>${plan.price}<span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>/mes</span></p>
                <Link to="/register" style={{ display: 'block', padding: '12px', border: '1px solid #000', color: '#000', textDecoration: 'none', textTransform: 'uppercase', fontSize: '11px' }}>
                  Elegir
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Login() {
  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', border: '1px solid #e5e5e5', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="GymFlow" style={{ height: '50px', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '20px' }}>Iniciar Sesión</h1>
        </div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="email" placeholder="Email" style={{ padding: '12px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
          <input type="password" placeholder="Contraseña" style={{ padding: '12px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
          <button type="submit" style={{ padding: '12px', background: '#000', color: '#fff', border: 'none', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', cursor: 'pointer' }}>
            Entrar
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          <Link to="/register" style={{ color: '#666' }}>¿No tienes cuenta? Regístrate</Link>
        </p>
      </div>
    </main>
  );
}

function Register() {
  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', border: '1px solid #e5e5e5', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="GymFlow" style={{ height: '50px', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '20px' }}>Crear Cuenta</h1>
        </div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="text" placeholder="Nombre" style={{ padding: '12px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
          <input type="email" placeholder="Email" style={{ padding: '12px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
          <input type="password" placeholder="Contraseña" style={{ padding: '12px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
          <button type="submit" style={{ padding: '12px', background: '#000', color: '#fff', border: 'none', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', cursor: 'pointer' }}>
            Registrarse
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#666' }}>¿Ya tienes cuenta? Entra</Link>
        </p>
      </div>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
