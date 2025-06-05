/**
 * Riot API 서비스
 * 사용자의 LoL 계정 정보, 랭크, 챔피언 숙련도 등을 조회합니다.
 */

const RIOT_API_BASE_URL = 'https://kr.api.riotgames.com';
const RIOT_API_ASIA_URL = 'https://asia.api.riotgames.com';

export const riotService = {
  /**
   * Riot ID로 계정 정보 조회 (PUUID 획득)
   * @param {string} gameName - 게임 이름 (예: "Hide on bush")
   * @param {string} tagLine - 태그라인 (예: "KR1")
   * @returns {Promise<Object>} 계정 정보 (puuid, gameName, tagLine)
   */
  async getAccountByRiotId(gameName, tagLine) {
    try {
      const apiKey = process.env.RIOT_API_KEY;
      if (!apiKey) {
        throw new Error('Riot API 키가 설정되지 않았습니다.');
      }

      const response = await fetch(
        `${RIOT_API_ASIA_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('존재하지 않는 Riot ID입니다.');
        } else if (response.status === 403) {
          throw new Error('API 키 권한이 없습니다.');
        } else if (response.status === 429) {
          throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        }
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      return {
        puuid: data.puuid,
        gameName: data.gameName,
        tagLine: data.tagLine
      };
    } catch (error) {
      console.error('Riot ID 조회 실패:', error);
      throw error;
    }
  },

  /**
   * PUUID로 소환사 정보 조회
   * @param {string} puuid - 플레이어 PUUID
   * @returns {Promise<Object>} 소환사 정보 (id, accountId, puuid, name, profileIconId, revisionDate, summonerLevel)
   */
  async getSummonerByPuuid(puuid) {
    try {
      const apiKey = process.env.RIOT_API_KEY;
      if (!apiKey) {
        throw new Error('Riot API 키가 설정되지 않았습니다.');
      }

      const response = await fetch(
        `${RIOT_API_BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('소환사 정보를 찾을 수 없습니다.');
        }
        throw new Error(`소환사 정보 조회 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('소환사 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 소환사 ID로 랭크 정보 조회
   * @param {string} summonerId - 소환사 ID
   * @returns {Promise<Array>} 랭크 정보 배열 (솔로랭크, 자유랭크 등)
   */
  async getRankInfoBySummonerId(summonerId) {
    try {
      const apiKey = process.env.RIOT_API_KEY;
      if (!apiKey) {
        throw new Error('Riot API 키가 설정되지 않았습니다.');
      }

      const response = await fetch(
        `${RIOT_API_BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // 랭크 정보가 없는 경우 빈 배열 반환
        }
        throw new Error(`랭크 정보 조회 실패: ${response.status}`);
      }

      const rankData = await response.json();
      
      // 솔로랭크와 자유랭크 정보 정리
      const soloRank = rankData.find(rank => rank.queueType === 'RANKED_SOLO_5x5');
      const flexRank = rankData.find(rank => rank.queueType === 'RANKED_FLEX_SR');

      return {
        soloRank: soloRank ? {
          tier: soloRank.tier,
          rank: soloRank.rank,
          leaguePoints: soloRank.leaguePoints,
          wins: soloRank.wins,
          losses: soloRank.losses,
          winRate: Math.round((soloRank.wins / (soloRank.wins + soloRank.losses)) * 100)
        } : null,
        flexRank: flexRank ? {
          tier: flexRank.tier,
          rank: flexRank.rank,
          leaguePoints: flexRank.leaguePoints,
          wins: flexRank.wins,
          losses: flexRank.losses,
          winRate: Math.round((flexRank.wins / (flexRank.wins + flexRank.losses)) * 100)
        } : null
      };
    } catch (error) {
      console.error('랭크 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * PUUID로 챔피언 숙련도 정보 조회
   * @param {string} puuid - 플레이어 PUUID
   * @param {number} count - 조회할 챔피언 수 (기본값: 10, 최대: 200)
   * @returns {Promise<Array>} 챔피언 숙련도 정보 배열
   */
  async getChampionMasteryByPuuid(puuid, count = 10) {
    try {
      const apiKey = process.env.RIOT_API_KEY;
      if (!apiKey) {
        throw new Error('Riot API 키가 설정되지 않았습니다.');
      }

      const response = await fetch(
        `${RIOT_API_BASE_URL}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}&api_key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // 숙련도 정보가 없는 경우 빈 배열 반환
        }
        throw new Error(`챔피언 숙련도 조회 실패: ${response.status}`);
      }

      const masteryData = await response.json();
      
      // 챔피언 정보와 함께 반환
      return masteryData.map(mastery => ({
        championId: mastery.championId,
        championLevel: mastery.championLevel,
        championPoints: mastery.championPoints,
        lastPlayTime: new Date(mastery.lastPlayTime),
        championPointsSinceLastLevel: mastery.championPointsSinceLastLevel,
        championPointsUntilNextLevel: mastery.championPointsUntilNextLevel,
        tokensEarned: mastery.tokensEarned
      }));
    } catch (error) {
      console.error('챔피언 숙련도 조회 실패:', error);
      throw error;
    }
  },

  /**
   * PUUID로 최근 매치 ID 목록 조회
   * @param {string} puuid - 플레이어 PUUID
   * @param {number} start - 시작 인덱스 (기본값: 0)
   * @param {number} count - 조회할 매치 수 (기본값: 20, 최대: 100)
   * @returns {Promise<Array>} 매치 ID 배열
   */
  async getMatchIdsByPuuid(puuid, start = 0, count = 20) {
    try {
      const apiKey = process.env.RIOT_API_KEY;
      if (!apiKey) {
        throw new Error('Riot API 키가 설정되지 않았습니다.');
      }

      const response = await fetch(
        `${RIOT_API_ASIA_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}&api_key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // 매치 정보가 없는 경우 빈 배열 반환
        }
        throw new Error(`매치 목록 조회 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('매치 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 매치 ID로 상세 매치 정보 조회
   * @param {string} matchId - 매치 ID
   * @returns {Promise<Object>} 매치 상세 정보
   */
  async getMatchById(matchId) {
    try {
      const apiKey = process.env.RIOT_API_KEY;
      if (!apiKey) {
        throw new Error('Riot API 키가 설정되지 않았습니다.');
      }

      const response = await fetch(
        `${RIOT_API_ASIA_URL}/lol/match/v5/matches/${matchId}?api_key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('매치 정보를 찾을 수 없습니다.');
        }
        throw new Error(`매치 정보 조회 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('매치 정보 조회 실패:', error);
      throw error;
    }
  },

  /**
   * Riot ID 형식 검증
   * @param {string} riotId - 검증할 Riot ID (형식: "gameName#tagLine")
   * @returns {Object|null} 파싱된 gameName과 tagLine 또는 null
   */
  parseRiotId(riotId) {
    if (!riotId || typeof riotId !== 'string') {
      return null;
    }

    const parts = riotId.split('#');
    if (parts.length !== 2) {
      return null;
    }

    const [gameName, tagLine] = parts;
    
    // 게임 이름과 태그라인 검증
    if (!gameName || !tagLine || gameName.length < 3 || gameName.length > 16 || tagLine.length < 3 || tagLine.length > 5) {
      return null;
    }

    return {
      gameName: gameName.trim(),
      tagLine: tagLine.trim()
    };
  },

  /**
   * 사용자 LoL 프로필 종합 정보 조회
   * @param {string} riotId - Riot ID (형식: "gameName#tagLine")
   * @returns {Promise<Object>} 종합 프로필 정보
   */
  async getPlayerProfile(riotId) {
    try {
      // Riot ID 파싱
      const parsedId = this.parseRiotId(riotId);
      if (!parsedId) {
        throw new Error('올바르지 않은 Riot ID 형식입니다. (예: Hide on bush#KR1)');
      }

      const { gameName, tagLine } = parsedId;

      // 1. 계정 정보 조회 (PUUID 획득)
      const accountInfo = await this.getAccountByRiotId(gameName, tagLine);
      
      // 2. 소환사 정보 조회
      const summonerInfo = await this.getSummonerByPuuid(accountInfo.puuid);
      
      // 3. 랭크 정보 조회
      const rankInfo = await this.getRankInfoBySummonerId(summonerInfo.id);
      
      // 4. 챔피언 숙련도 조회 (상위 5개)
      const championMastery = await this.getChampionMasteryByPuuid(accountInfo.puuid, 5);

      return {
        account: accountInfo,
        summoner: summonerInfo,
        ranks: rankInfo,
        championMastery: championMastery,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('플레이어 프로필 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 랭크 티어를 한글로 변환
   * @param {string} tier - 영문 티어명
   * @returns {string} 한글 티어명
   */
  getTierNameKorean(tier) {
    const tierMap = {
      'IRON': '아이언',
      'BRONZE': '브론즈',
      'SILVER': '실버',
      'GOLD': '골드',
      'PLATINUM': '플래티넘',
      'DIAMOND': '다이아몬드',
      'MASTER': '마스터',
      'GRANDMASTER': '그랜드마스터',
      'CHALLENGER': '챌린저'
    };
    return tierMap[tier] || tier;
  },

  /**
   * 랭크를 로마 숫자로 변환
   * @param {string} rank - 영문 랭크 (I, II, III, IV)
   * @returns {string} 한글 랭크
   */
  getRankNameKorean(rank) {
    const rankMap = {
      'I': '1',
      'II': '2', 
      'III': '3',
      'IV': '4'
    };
    return rankMap[rank] || rank;
  },

  /**
   * 완전한 랭크 문자열 생성
   * @param {Object} rankData - 랭크 데이터 객체
   * @returns {string} 완전한 랭크 문자열 (예: "골드 2 34LP")
   */
  getFullRankString(rankData) {
    if (!rankData) {
      return 'Unranked';
    }

    const tierKorean = this.getTierNameKorean(rankData.tier);
    const rankKorean = this.getRankNameKorean(rankData.rank);
    
    // 마스터 이상은 랭크 표시 안함
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rankData.tier)) {
      return `${tierKorean} ${rankData.leaguePoints}LP`;
    }
    
    return `${tierKorean} ${rankKorean} ${rankData.leaguePoints}LP`;
  }
};