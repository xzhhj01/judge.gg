import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { riotService } from '@/app/services/riot/riot.service';
import { userService } from '@/app/services/user/user.service';
import { db } from '@/lib/firebase/firebase.config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { communityService } from '@/app/services/community/community.service';

export async function POST(request) {
  try {
    // 세션 확인
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { riotId } = body;

    if (!riotId) {
      return NextResponse.json(
        { error: 'Riot ID를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Riot ID 형식 검증
    const parsedId = riotService.parseRiotId(riotId);
    if (!parsedId) {
      return NextResponse.json(
        { 
          error: '올바르지 않은 Riot ID 형식입니다.',
          details: 'Riot ID는 "게임이름#태그" 형식이어야 합니다. (예: Hide on bush#KR1)'
        },
        { status: 400 }
      );
    }

    // Riot API를 통해 계정 검증 및 정보 수집
    try {
      console.log('Riot ID 검증 시작:', riotId);
      const playerProfile = await riotService.getPlayerProfile(riotId);
      console.log('Riot API 응답:', playerProfile);

      // 사용자 ID 생성
      const userId = communityService.generateConsistentUserId(session.user);
      
      // Firebase에 사용자 LoL 정보 저장
      const userRef = doc(db, 'users', userId);
      const lolData = {
        lolRiotId: riotId,
        lolVerified: true,
        lolProfile: {
          puuid: playerProfile.account.puuid,
          summonerId: playerProfile.summoner.id,
          summonerName: playerProfile.account.gameName,
          tagLine: playerProfile.account.tagLine,
          profileIconId: playerProfile.summoner.profileIconId,
          summonerLevel: playerProfile.summoner.summonerLevel,
          ranks: playerProfile.ranks,
          championMastery: playerProfile.championMastery,
          lastUpdated: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, lolData, { merge: true });

      console.log('사용자 LoL 정보 저장 완료:', userId);

      // 성공 응답
      return NextResponse.json({
        success: true,
        message: 'Riot ID가 성공적으로 연동되었습니다!',
        profile: {
          riotId: riotId,
          summonerName: playerProfile.account.gameName,
          tagLine: playerProfile.account.tagLine,
          summonerLevel: playerProfile.summoner.summonerLevel,
          soloRank: playerProfile.ranks.soloRank ? 
            riotService.getFullRankString(playerProfile.ranks.soloRank) : 'Unranked',
          flexRank: playerProfile.ranks.flexRank ? 
            riotService.getFullRankString(playerProfile.ranks.flexRank) : 'Unranked',
          topChampions: playerProfile.championMastery.slice(0, 3).map(mastery => ({
            championId: mastery.championId,
            championLevel: mastery.championLevel,
            championPoints: mastery.championPoints.toLocaleString()
          }))
        }
      });

    } catch (riotError) {
      console.error('Riot API 오류:', riotError);
      
      // Riot API 특정 오류 처리
      if (riotError.message.includes('존재하지 않는')) {
        return NextResponse.json(
          { 
            error: '존재하지 않는 Riot ID입니다.',
            details: 'Riot ID를 다시 확인해주세요.'
          },
          { status: 404 }
        );
      } else if (riotError.message.includes('API 키')) {
        return NextResponse.json(
          { 
            error: '일시적인 서버 오류입니다.',
            details: '잠시 후 다시 시도해주세요.'
          },
          { status: 500 }
        );
      } else if (riotError.message.includes('요청 한도')) {
        return NextResponse.json(
          { 
            error: 'API 요청 한도를 초과했습니다.',
            details: '잠시 후 다시 시도해주세요.'
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Riot ID 검증에 실패했습니다.',
          details: riotError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Riot ID 검증 API 오류:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // 세션 확인
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = communityService.generateConsistentUserId(session.user);
    
    // 사용자의 LoL 정보 조회
    const userInfo = await userService.getUserInfo(userId);
    
    if (!userInfo || !userInfo.lolProfile) {
      return NextResponse.json(
        { 
          verified: false,
          message: '연동된 LoL 계정이 없습니다.'
        }
      );
    }

    return NextResponse.json({
      verified: true,
      profile: {
        riotId: userInfo.lolRiotId,
        summonerName: userInfo.lolProfile.summonerName,
        tagLine: userInfo.lolProfile.tagLine,
        summonerLevel: userInfo.lolProfile.summonerLevel,
        soloRank: userInfo.lolProfile.ranks?.soloRank ? 
          riotService.getFullRankString(userInfo.lolProfile.ranks.soloRank) : 'Unranked',
        flexRank: userInfo.lolProfile.ranks?.flexRank ? 
          riotService.getFullRankString(userInfo.lolProfile.ranks.flexRank) : 'Unranked',
        topChampions: (userInfo.lolProfile.championMastery || []).slice(0, 3).map(mastery => ({
          championId: mastery.championId,
          championLevel: mastery.championLevel,
          championPoints: mastery.championPoints?.toLocaleString?.() || mastery.championPoints
        })),
        lastUpdated: userInfo.lolProfile.lastUpdated
      }
    });

  } catch (error) {
    console.error('LoL 프로필 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '프로필 조회에 실패했습니다.',
        details: error.message
      },
      { status: 500 }
    );
  }
}