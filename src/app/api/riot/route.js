// app/api/riot/route.js
import { NextResponse } from 'next/server';

const RIOT_BASE = 'https://asia.api.riotgames.com';
const API_KEY   = process.env.RIOT_API_KEY;        // .env.local 에 저장

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get('gameName');
  const tagLine  = searchParams.get('tagLine');
  const puuid    = searchParams.get('puuid');

  // 1. PUUID로 Riot ID 조회
  if (puuid) {
    const url = `${RIOT_BASE}/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
    
    try {
      const res = await fetch(url, {
        headers: {
          'Accept'       : 'application/json',
          'X-Riot-Token' : API_KEY
        },
        cache: 'no-store'
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });

    } catch (err) {
      return NextResponse.json(
        { message: 'Riot API 호출 실패 (PUUID)', detail: err.message },
        { status: 502 }
      );
    }
  }

  // 2. Riot ID (gameName + tagLine)로 계정 조회
  if (!gameName || !tagLine) {
    return NextResponse.json(
      { message: 'query ?gameName=...&tagLine=... 또는 ?puuid=... 가 필요합니다' },
      { status: 400 }
    );
  }

  const url =
    `${RIOT_BASE}/riot/account/v1/accounts/by-riot-id/` +
    `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept'       : 'application/json',
        'X-Riot-Token' : API_KEY            // 🔑 Riot 권장 방식 (헤더)
      },
      cache: 'no-store'                     // 항상 최신값 (revalidate=0 과 동일)
    });

    // Riot 쪽 응답 바디
    const data = await res.json();

    // 그대로 클라이언트로 전달 (status 200/4xx/5xx 유지)
    return NextResponse.json(data, { status: res.status });

  } catch (err) {
    // 네트워크 등 예외 상황
    return NextResponse.json(
      { message: 'Riot API 호출 실패', detail: err.message },
      { status: 502 }
    );
  }
}
