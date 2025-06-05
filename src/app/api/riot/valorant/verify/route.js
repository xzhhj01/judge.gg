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
          details: 'Riot ID는 "게임이름#태그" 형식이어야 합니다. (예: PlayerName#KR1)'
        },
        { status: 400 }
      );
    }

    // Riot API를 통해 발로란트 계정 검증 및 정보 수집
    try {
      console.log('발로란트 Riot ID 검증 시작:', riotId);
      const playerProfile = await riotService.getValorantPlayerProfile(riotId);
      console.log('발로란트 Riot API 응답:', playerProfile);

      // 사용자 ID 생성
      const userId = communityService.generateConsistentUserId(session.user);
      
      // Firebase에 사용자 발로란트 정보 저장
      const userRef = doc(db, 'users', userId);
      const valorantData = {
        valorantRiotId: riotId,
        valorantVerified: true,
        valorantProfile: {
          puuid: playerProfile.account.puuid,
          gameName: playerProfile.account.gameName,
          tagLine: playerProfile.account.tagLine,
          recentMatches: playerProfile.recentMatches?.slice(0, 3) || [], // 최근 3경기만 저장
          currentAct: playerProfile.currentAct,
          contentVersion: playerProfile.contentVersion,
          lastUpdated: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, valorantData, { merge: true });

      console.log('사용자 발로란트 정보 저장 완료:', userId);

      // 최근 매치에서 통계 계산
      let totalKills = 0;
      let totalDeaths = 0;
      let totalAssists = 0;
      let wins = 0;
      let totalGames = playerProfile.recentMatches?.length || 0;
      let mostPlayedAgent = null;

      if (playerProfile.recentMatches && playerProfile.recentMatches.length > 0) {
        const agentCount = {};
        
        playerProfile.recentMatches.forEach(match => {
          // 해당 사용자의 플레이어 정보 찾기
          const playerData = match.players?.find(p => p.puuid === playerProfile.account.puuid);
          if (playerData) {
            totalKills += playerData.stats?.kills || 0;
            totalDeaths += playerData.stats?.deaths || 0;
            totalAssists += playerData.stats?.assists || 0;
            
            // 승리 여부 확인
            const playerTeam = match.teams?.find(team => team.teamId === playerData.teamId);
            if (playerTeam?.won) {
              wins++;
            }
            
            // 가장 많이 플레이한 에이전트
            const agent = playerData.characterId;
            if (agent) {
              agentCount[agent] = (agentCount[agent] || 0) + 1;
            }
          }
        });
        
        // 가장 많이 플레이한 에이전트 찾기
        if (Object.keys(agentCount).length > 0) {
          mostPlayedAgent = Object.entries(agentCount)
            .sort(([,a], [,b]) => b - a)[0][0];
        }
      }

      // 성공 응답
      return NextResponse.json({
        success: true,
        message: '발로란트 Riot ID가 성공적으로 연동되었습니다!',
        profile: {
          riotId: riotId,
          gameName: playerProfile.account.gameName,
          tagLine: playerProfile.account.tagLine,
          recentGames: totalGames,
          winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
          avgKDA: totalGames > 0 && totalDeaths > 0 ? 
            ((totalKills + totalAssists) / totalDeaths).toFixed(2) : 'N/A',
          mostPlayedAgent: mostPlayedAgent ? 
            riotService.getValorantCharacterName(mostPlayedAgent) : 'N/A',
          currentAct: playerProfile.currentAct?.id || 'Unknown'
        }
      });

    } catch (riotError) {
      console.error('발로란트 Riot API 오류:', riotError);
      
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
          error: '발로란트 Riot ID 검증에 실패했습니다.',
          details: riotError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('발로란트 Riot ID 검증 API 오류:', error);
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
    
    // 사용자의 발로란트 정보 조회
    const userInfo = await userService.getUserInfo(userId);
    
    if (!userInfo || !userInfo.valorantProfile) {
      return NextResponse.json(
        { 
          verified: false,
          message: '연동된 발로란트 계정이 없습니다.'
        }
      );
    }

    // 최근 매치에서 통계 재계산
    const recentMatches = userInfo.valorantProfile.recentMatches || [];
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let wins = 0;
    let mostPlayedAgent = null;

    if (recentMatches.length > 0) {
      const agentCount = {};
      
      recentMatches.forEach(match => {
        const playerData = match.players?.find(p => p.puuid === userInfo.valorantProfile.puuid);
        if (playerData) {
          totalKills += playerData.stats?.kills || 0;
          totalDeaths += playerData.stats?.deaths || 0;
          totalAssists += playerData.stats?.assists || 0;
          
          const playerTeam = match.teams?.find(team => team.teamId === playerData.teamId);
          if (playerTeam?.won) {
            wins++;
          }
          
          const agent = playerData.characterId;
          if (agent) {
            agentCount[agent] = (agentCount[agent] || 0) + 1;
          }
        }
      });
      
      if (Object.keys(agentCount).length > 0) {
        mostPlayedAgent = Object.entries(agentCount)
          .sort(([,a], [,b]) => b - a)[0][0];
      }
    }

    return NextResponse.json({
      verified: true,
      profile: {
        riotId: userInfo.valorantRiotId,
        gameName: userInfo.valorantProfile.gameName,
        tagLine: userInfo.valorantProfile.tagLine,
        recentGames: recentMatches.length,
        winRate: recentMatches.length > 0 ? Math.round((wins / recentMatches.length) * 100) : 0,
        avgKDA: recentMatches.length > 0 && totalDeaths > 0 ? 
          ((totalKills + totalAssists) / totalDeaths).toFixed(2) : 'N/A',
        mostPlayedAgent: mostPlayedAgent ? 
          riotService.getValorantCharacterName(mostPlayedAgent) : 'N/A',
        currentAct: userInfo.valorantProfile.currentAct?.id || 'Unknown',
        lastUpdated: userInfo.valorantProfile.lastUpdated
      }
    });

  } catch (error) {
    console.error('발로란트 프로필 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '프로필 조회에 실패했습니다.',
        details: error.message
      },
      { status: 500 }
    );
  }
}