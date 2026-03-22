'use client'

import { useState, useEffect } from 'react'

interface GymAccountPanelProps {
  gymId: string
  gymName: string
}

interface PayPalConnection {
  connected: boolean
  email?: string
  balance?: {
    total: string
    currency: string
  }
}

interface Transaction {
  id: string
  date: string
  type: string
  amount: string
  currency: string
  status: string
  payerEmail: string
  payerName: string
}

export function GymAccountPanel({ gymId, gymName }: GymAccountPanelProps) {
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [connection, setConnection] = useState<PayPalConnection>({ connected: false })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'settings'>('overview')

  useEffect(() => {
    loadPayPalStatus()
  }, [gymId])

  const loadPayPalStatus = async () => {
    try {
      setLoading(true)
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch('/api/paypal/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymId }),
        }),
        fetch('/api/paypal/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymId }),
        }),
      ])

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json()
        setConnection({
          connected: balanceData.connected,
          email: balanceData.email,
          balance: balanceData.balance,
        })
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        setTransactions(transactionsData.transactions || [])
      }
    } catch (error) {
      console.error('Error loading PayPal status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectPayPal = async () => {
    try {
      setConnecting(true)
      const res = await fetch('/api/paypal/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId }),
      })

      const data = await res.json()

      if (data.connectUrl) {
        // Redirect to PayPal authorization
        window.location.href = data.connectUrl
      } else {
        alert('Error al conectar PayPal')
      }
    } catch (error) {
      console.error('Error connecting PayPal:', error)
      alert('Error al conectar PayPal')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar tu cuenta PayPal?')) return

    try {
      // In production, you'd call an API to revoke tokens
      setConnection({ connected: false })
      alert('PayPal desconectado')
    } catch (error) {
      console.error('Error disconnecting PayPal:', error)
    }
  }

  // Check URL for PayPal connection success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('paypal_connected') === 'true') {
      const email = urlParams.get('email')
      setConnection({ connected: true, email: email || '' })
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
      // Reload data
      loadPayPalStatus()
    }
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Mi Cuenta</h1>
          <p style={{ color: '#666' }}>{gymName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '1rem' }}>
        {[
          { id: 'overview', label: 'Resumen' },
          { id: 'transactions', label: 'Transacciones' },
          { id: 'settings', label: 'Configuración' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === tab.id ? '#000' : 'none',
              color: activeTab === tab.id ? '#fff' : '#666',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* PayPal Connection Card */}
          <div style={{ 
            padding: '2rem', 
            backgroundColor: '#fff', 
            border: '1px solid #e5e5e5',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    backgroundColor: connection.connected ? '#003087' : '#f5f5f5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: connection.connected ? '#fff' : '#999',
                    fontSize: '1.5rem',
                  }}>
                    P
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Cuenta PayPal</h3>
                    <p style={{ color: '#666', fontSize: '0.875rem' }}>
                      {connection.connected 
                        ? `Conectada: ${connection.email}` 
                        : 'No conectada'}
                    </p>
                  </div>
                </div>

                {connection.connected ? (
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}>
                    <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></span>
                    Conectado
                  </div>
                ) : (
                  <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Conecta tu cuenta PayPal para recibir pagos de membresías directamente.
                  </p>
                )}
              </div>

              <div>
                {connection.connected ? (
                  <button
                    onClick={handleDisconnect}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e5e5',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={handleConnectPayPal}
                    disabled={connecting}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#003087',
                      color: '#fff',
                      border: 'none',
                      cursor: connecting ? 'wait' : 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {connecting ? 'Conectando...' : 'Conectar PayPal'}
                  </button>
                )}
              </div>
            </div>

            {/* Balance Section */}
            {connection.connected && connection.balance && (
              <div style={{ 
                marginTop: '2rem', 
                padding: '1.5rem', 
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Saldo disponible</p>
                <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                  ${connection.balance.total} <span style={{ fontSize: '1rem', color: '#666' }}>{connection.balance.currency}</span>
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {connection.connected && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Este Mes</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  ${transactions
                    .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
                    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
                    .toFixed(2)}
                </p>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Transacciones</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{transactions.length}</p>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Último Pago</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {transactions.length > 0 
                    ? `$${transactions[0]?.amount || '0'}`
                    : '$0'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          {!connection.connected ? (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Conecta tu cuenta PayPal para ver transacciones</p>
              <button
                onClick={handleConnectPayPal}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#003087',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Conectar PayPal
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
              <p style={{ color: '#666' }}>No hay transacciones recientes</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e5e5', backgroundColor: '#f9f9f9' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Fecha</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Cliente</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Monto</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((t, i) => (
                    <tr key={t.id || i} style={{ borderBottom: '1px solid #e5e5e5' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {new Date(t.date).toLocaleDateString('es-DO')}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {t.payerName}
                        <br />
                        <span style={{ color: '#666', fontSize: '0.75rem' }}>{t.payerEmail}</span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        ${t.amount} {t.currency}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: t.status === 'S' ? '#dcfce7' : '#fef3c7',
                          color: t.status === 'S' ? '#166534' : '#92400e',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          textTransform: 'capitalize',
                        }}>
                          {t.status === 'S' ? 'Completado' : t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ padding: '2rem', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Configuración de Pagos</h3>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Precio de Membresía Mensual
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '300px' }}>
              <span style={{ 
                padding: '0.75rem', 
                backgroundColor: '#f5f5f5', 
                border: '1px solid #e5e5e5',
                borderRight: 'none'
              }}>$</span>
              <input
                type="number"
                defaultValue="50"
                style={{ 
                  flex: 1, 
                  padding: '0.75rem', 
                  border: '1px solid #e5e5e5',
                  fontSize: '1rem'
                }}
              />
              <span style={{ 
                padding: '0.75rem', 
                backgroundColor: '#f5f5f5', 
                border: '1px solid #e5e5e5',
                borderLeft: 'none'
              }}>USD</span>
            </div>
            <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Este es el precio que tus miembros pagarán mensualmente
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Moneda
            </label>
            <select style={{ 
              padding: '0.75rem', 
              border: '1px solid #e5e5e5',
              fontSize: '1rem',
              width: '100%',
              maxWidth: '300px'
            }}>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
              <option value="DOP">DOP - Peso Dominicano</option>
            </select>
          </div>

          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}>
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  )
}
