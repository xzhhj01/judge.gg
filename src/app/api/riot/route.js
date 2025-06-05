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
      console.log('🔍 Riot API 호출 (PUUID):', url);
      
      if (!API_KEY) {
        return NextResponse.json(
          { message: 'Riot API Key가 설정되지 않았습니다.' },
          { status: 500 }
        );
      }

      const res = await fetch(url, {
        headers: {
          'Accept'       : 'application/json',
          'X-Riot-Token' : API_KEY
        },
        cache: 'no-store'
      });

      console.log('🔍 Riot API 응답 상태 (PUUID):', res.status, res.statusText);

      const contentType = res.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await res.text();
        console.error('🔍 Non-JSON 응답 (PUUID):', errorText);
        return NextResponse.json(
          { message: `Riot API 오류: ${res.status} ${res.statusText}`, detail: errorText },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });

    } catch (err) {
      console.error('🔍 Riot API 호출 예외 (PUUID):', err);
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
    console.log('🔍 Riot API 호출:', url);
    console.log('🔍 API Key 확인:', API_KEY ? 'OK' : 'MISSING');
    
    if (!API_KEY) {
      return NextResponse.json(
        { message: 'Riot API Key가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const res = await fetch(url, {
      headers: {
        'Accept'       : 'application/json',
        'X-Riot-Token' : API_KEY
      },
      cache: 'no-store'
    });

    console.log('🔍 Riot API 응답 상태:', res.status, res.statusText);

    // 응답이 JSON인지 확인
    const contentType = res.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await res.text();
      console.error('🔍 Non-JSON 응답:', errorText);
      return NextResponse.json(
        { message: `Riot API 오류: ${res.status} ${res.statusText}`, detail: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log('🔍 Riot API 응답 데이터:', data);

    return NextResponse.json(data, { status: res.status });

  } catch (err) {
    console.error('🔍 Riot API 호출 예외:', err);
    return NextResponse.json(
      { message: 'Riot API 호출 실패', detail: err.message },
      { status: 502 }
    );
  }
}
