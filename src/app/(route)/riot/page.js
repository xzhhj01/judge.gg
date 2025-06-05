'use client';

import { useState } from 'react';

export default function RiotPage() {
  const [gameName, setGameName] = useState('쵸비');
  const [tagLine,  setTagLine ] = useState('KR001');
  const [result,   setResult  ] = useState(null);
  const [error,    setError   ] = useState(null);
  const [loading,  setLoading ] = useState(false);

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `/api/riot?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`
      );

      if (!res.ok) {
        // Riot 프록시 라우트가 JSON 에러 메시지를 내려줌
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const account = await res.json();      // { puuid, gameName, tagLine }
      setResult(account);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>Riot ID 조회</h2>

      <input
        placeholder="gameName"
        value={gameName}
        onChange={e => setGameName(e.target.value)}
      />
      <input
        placeholder="tagLine"
        value={tagLine}
        onChange={e => setTagLine(e.target.value)}
        style={{ marginLeft: 8 }}
      />
      <button onClick={handleSearch} style={{ marginLeft: 8 }}>
        {loading ? '조회 중…' : '조회'}
      </button>

      {error  && <p style={{ color: 'red' }}>에러: {error}</p>}
      {result && (
        <pre style={{ background: '#f6f6f6', padding: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
