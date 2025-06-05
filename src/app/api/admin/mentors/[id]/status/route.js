import { NextResponse } from 'next/server';
import { mentorService } from '@/app/services/mentor/mentor.service';

export async function PUT(request, { params }) {
  try {
    const { id: mentorId } = params;
    const { status, reason } = await request.json();

    // TODO: Add admin authentication check here
    // For now, we'll allow anyone to update status for testing

    if (!mentorId) {
      return NextResponse.json(
        { error: '멘토 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다. (approved, rejected만 허용)' },
        { status: 400 }
      );
    }

    if (status === 'rejected' && !reason) {
      return NextResponse.json(
        { error: '거절 시 사유가 필요합니다.' },
        { status: 400 }
      );
    }

    await mentorService.updateMentorStatusDirect(mentorId, status, reason);

    return NextResponse.json({
      success: true,
      message: `멘토 상태가 ${status}로 업데이트되었습니다.`
    });

  } catch (error) {
    console.error('멘토 상태 업데이트 오류:', error);
    
    return NextResponse.json(
      {
        error: error.message || '멘토 상태 업데이트에 실패했습니다.',
        details: error.stack
      },
      { status: 500 }
    );
  }
}