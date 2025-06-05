import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { mentorService } from '@/app/services/mentor/mentor.service';

export async function PUT(request, { params }) {
  try {
    // 관리자 인증 확인
    const session = await getServerSession(authOptions);
    const adminEmails = [
      'admin@judge.gg',
      'leaf4937@gmail.com',
    ];

    // 임시로 인증 체크 비활성화
    // if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    //   return NextResponse.json(
    //     { error: '관리자 권한이 필요합니다.' },
    //     { status: 403 }
    //   );
    // }

    const { id: mentorId } = params;
    const { status, reason } = await request.json();

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