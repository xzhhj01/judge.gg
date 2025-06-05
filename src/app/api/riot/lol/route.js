// app/api/riot/lol/route.js
import { NextResponse } from 'next/server';

const RIOT_BASE = 'https://asia.api.riotgames.com';
const LOL_BASE = 'https://kr.api.riotgames.com';
const API_KEY = process.env.RIOT_API_KEY;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get('puuid');

  if (!puuid) {
    return NextResponse.json(
      { message: 'query ?puuid=... 가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    // 1. 소환사 정보 조회 (by PUUID)
    const summonerUrl = `${LOL_BASE}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    const summonerRes = await fetch(summonerUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Riot-Token': API_KEY
      },
      cache: 'no-store'
    });

    if (!summonerRes.ok) {
      const errorData = await summonerRes.json();
      return NextResponse.json(errorData, { status: summonerRes.status });
    }

    const summonerData = await summonerRes.json();

    // 2. 랭크 정보 조회 (by summonerId)
    const rankUrl = `${LOL_BASE}/lol/league/v4/entries/by-summoner/${summonerData.id}`;
    const rankRes = await fetch(rankUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Riot-Token': API_KEY
      },
      cache: 'no-store'
    });

    let rankData = [];
    if (rankRes.ok) {
      rankData = await rankRes.json();
    }

    // 3. 최근 매치 목록 조회 (by PUUID) - 최근 5경기
    const matchListUrl = `${RIOT_BASE}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=5`;
    const matchListRes = await fetch(matchListUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Riot-Token': API_KEY
      },
      cache: 'no-store'
    });

    let recentMatches = [];
    if (matchListRes.ok) {
      const matchIds = await matchListRes.json();
      
      // 각 매치 상세 정보 조회
      const matchPromises = matchIds.slice(0, 3).map(async (matchId) => {
        const matchUrl = `${RIOT_BASE}/lol/match/v5/matches/${matchId}`;
        const matchRes = await fetch(matchUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Riot-Token': API_KEY
          },
          cache: 'no-store'
        });
        
        if (matchRes.ok) {
          return await matchRes.json();
        }
        return null;
      });

      const matchDetails = await Promise.all(matchPromises);
      recentMatches = matchDetails.filter(Boolean);
    }

    // 랭크 정보 정리
    const soloRank = rankData.find(rank => rank.queueType === 'RANKED_SOLO_5x5');
    const flexRank = rankData.find(rank => rank.queueType === 'RANKED_FLEX_SR');

    // 응답 데이터 구성
    const responseData = {
      summoner: {
        id: summonerData.id,
        accountId: summonerData.accountId,
        puuid: summonerData.puuid,
        name: summonerData.name,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel
      },
      ranks: {
        solo: soloRank ? {
          tier: soloRank.tier,
          rank: soloRank.rank,
          leaguePoints: soloRank.leaguePoints,
          wins: soloRank.wins,
          losses: soloRank.losses,
          winRate: Math.round((soloRank.wins / (soloRank.wins + soloRank.losses)) * 100)
        } : null,
        flex: flexRank ? {
          tier: flexRank.tier,
          rank: flexRank.rank,
          leaguePoints: flexRank.leaguePoints,
          wins: flexRank.wins,
          losses: flexRank.losses,
          winRate: Math.round((flexRank.wins / (flexRank.wins + flexRank.losses)) * 100)
        } : null
      },
      recentMatches: recentMatches.map(match => {
        const participant = match.info.participants.find(p => p.puuid === puuid);
        return {
          gameId: match.metadata.matchId,
          gameMode: match.info.gameMode,
          gameDuration: match.info.gameDuration,
          gameCreation: match.info.gameCreation,
          champion: {
            name: participant.championName,
            id: participant.championId
          },
          stats: {
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            kda: participant.deaths === 0 ? 'Perfect' : ((participant.kills + participant.assists) / participant.deaths).toFixed(2),
            win: participant.win,
            cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
            items: [
              participant.item0,
              participant.item1,
              participant.item2,
              participant.item3,
              participant.item4,
              participant.item5,
              participant.item6
            ].filter(item => item !== 0)
          }
        };
      })
    };

    return NextResponse.json(responseData);

  } catch (err) {
    return NextResponse.json(
      { message: 'LoL API 호출 실패', detail: err.message },
      { status: 502 }
    );
  }
}