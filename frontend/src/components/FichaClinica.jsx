import React from 'react';

const FichaClinica = () => {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Ficha Clínica</h1>
          <p style={styles.subtitle}>Resumen básico de la información clínica del paciente.</p>
        </div>
        <button style={styles.button}>Guardar cambios</button>
      </header>

      <main style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Datos del paciente</h2>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre completo</label>
              <div style={styles.input}>Paciente ejemplo</div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Edad</label>
              <div style={styles.input}>32 años</div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Sexo</label>
              <div style={styles.input}>Femenino</div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Fecha de atención</label>
              <div style={styles.input}>29/05/2026</div>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Antecedentes</h2>
          <div style={styles.textBox}>
            Sin antecedentes relevantes reportados. Se mantiene seguimiento general.
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Evaluación clínica</h2>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Motivo de consulta</label>
              <div style={styles.input}>Control nutricional</div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Diagnóstico</label>
              <div style={styles.input}>Seguimiento preventivo</div>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Observaciones</h2>
          <div style={styles.textBox}>
            Se recomienda mantener hábitos saludables, hidratación adecuada y control periódico.
          </div>
        </section>
      </main>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f3fbf8 0%, #eef7f5 100%)',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
    color: '#1f3b36',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    background: '#ffffff',
    border: '1px solid #d8ebe6',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 8px 24px rgba(31, 59, 54, 0.06)',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#1d6b5f',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#5e7c76',
    fontSize: '14px',
  },
  button: {
    border: 'none',
    background: '#1d6b5f',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #d8ebe6',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 8px 20px rgba(31, 59, 54, 0.05)',
  },
  cardTitle: {
    margin: '0 0 16px',
    fontSize: '18px',
    color: '#1d6b5f',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    color: '#5e7c76',
    fontWeight: 700,
  },
  input: {
    background: '#f8fcfb',
    border: '1px solid #cfe3dd',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#1f3b36',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
  },
  textBox: {
    background: '#f8fcfb',
    border: '1px solid #cfe3dd',
    borderRadius: '10px',
    padding: '14px',
    color: '#1f3b36',
    lineHeight: 1.6,
  },
};

export default FichaClinica;