import { NextResponse } from 'next/server';
import { mentorService } from '@/app/services/mentor/mentor.service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('game') || 'all';
    const filters = {};

    // Get only approved mentors for public viewing
    const mentors = await mentorService.getMentorsDirect(gameType, filters);

    return NextResponse.json({
      success: true,
      mentors: mentors,
      count: mentors.length
    });

  } catch (error) {
    console.error('공개 멘토 목록 조회 오류:', error);
    
    return NextResponse.json(
      {
        error: error.message || '멘토 목록 조회에 실패했습니다.',
        details: error.stack
      },
      { status: 500 }
    );
  }
}