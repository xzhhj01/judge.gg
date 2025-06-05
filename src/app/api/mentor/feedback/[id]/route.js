import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { mentorService } from '@/app/services/mentor/mentor.service';

export async function PUT(request, { params }) {
  try {
    // Get the actual session from NextAuth
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, response, feedbackText } = body;

    console.log('🔍 피드백 요청 처리:', { id, action, response, feedbackText });

    if (action === 'accept' || action === 'reject') {
      // 피드백 요청 수락/거절
      const result = await mentorService.handleFeedbackRequest(id, action, response || '');
      
      return NextResponse.json({
        success: true,
        message: action === 'accept' ? '피드백 요청을 수락했습니다.' : '피드백 요청을 거절했습니다.'
      });
    } else if (action === 'submit') {
      // 피드백 제출
      const result = await mentorService.submitFeedback(id, feedbackText);
      
      return NextResponse.json({
        success: true,
        message: '피드백을 제출했습니다.'
      });
    } else {
      return NextResponse.json(
        { error: '올바르지 않은 액션입니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('피드백 처리 오류:', error);
    
    return NextResponse.json(
      { 
        error: error.message || '피드백 처리에 실패했습니다.',
        details: error.stack
      },
      { status: 500 }
    );
  }
}