import { Suspense } from 'react'
import ClientPage from './ClientPage'

function LoadingFallback() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: '1.125rem', color: '#666' }}>Cargando...</p>
      </div>
    </div>
  )
}

export default function Page({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ClientPage slug={params.slug} />
    </Suspense>
  )
}
