import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { communityService } from '@/app/services/community/community.service';

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const postData = await request.json();

    // 세션 사용자 정보를 communityService에 전달
    const result = await communityService.createPost('lol', postData, session.user);

    return NextResponse.json({
      success: true,
      post: result
    });

  } catch (error) {
    console.error('LoL 게시글 작성 오류:', error);
    
    return NextResponse.json(
      { 
        error: error.message || '게시글 작성에 실패했습니다.',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sortBy = searchParams.get('sortBy') || 'recent';
    const tags = searchParams.get('tags') ? searchParams.get('tags').split(',') : [];
    const searchQuery = searchParams.get('search') || '';

    const result = await communityService.getPosts('lol', tags, searchQuery, page, limit, sortBy);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('LoL 게시글 목록 조회 오류:', error);
    
    return NextResponse.json(
      { 
        error: error.message || '게시글 목록 조회에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}