import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { mentorService } from '@/app/services/mentor/mentor.service';

export async function GET(request) {
  try {
    // 관리자 인증 확인
    const session = await getServerSession(authOptions);
    const adminEmails = [
      'admin@judge.gg',
      'leaf4937@gmail.com',
    ];

    console.log('Admin API - Session:', session);
    console.log('Admin API - User email:', session?.user?.email);

    // 임시로 인증 체크 비활성화
    // if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    //   return NextResponse.json(
    //     { error: '관리자 권한이 필요합니다.' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    console.log('Admin API - Requested status:', status);

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      console.log('Admin API - Invalid status:', status);
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다. (pending, approved, rejected만 허용)' },
        { status: 400 }
      );
    }

    console.log('Admin API - Calling getMentorsByStatusDirect with status:', status);
    const mentors = await mentorService.getMentorsByStatusDirect(status);
    console.log('Admin API - Retrieved mentors count:', mentors.length);

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