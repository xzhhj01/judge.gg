import { NextResponse } from 'next/server';
import { mentorService } from '@/app/services/mentor/mentor.service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // TODO: Add admin authentication check here
    // For now, we'll allow anyone to access for testing

    if (!['pending', 'approved'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다. (pending, approved만 허용)' },
        { status: 400 }
      );
    }

    const mentors = await mentorService.getMentorsByStatusDirect(status);

    return NextResponse.json({
      success: true,
      mentors: mentors,
      count: mentors.length
    });

  } catch (error) {
    console.error('멘토 목록 조회 오류:', error);
    
    return NextResponse.json(
      {
        error: error.message || '멘토 목록 조회에 실패했습니다.',
        details: error.stack
      },
      { status: 500 }
    );
  }
}