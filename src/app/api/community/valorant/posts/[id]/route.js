import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { communityService } from '@/app/services/community/community.service';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: postId } = params;
    const postData = await request.json();

    // 세션 사용자 정보를 communityService에 전달
    const result = await communityService.updatePost('valorant', postId, postData, session.user);

    return NextResponse.json({
      success: true,
      post: result
    });

  } catch (error) {
    console.error('Valorant 게시글 수정 오류:', error);
    
    return NextResponse.json(
      { 
        error: error.message || '게시글 수정에 실패했습니다.',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    const { id: postId } = params;
    
    console.log('🔍 [API] Valorant 게시글 상세 조회 - 세션 사용자:', session?.user);
    
    const post = await communityService.getPostById('valorant', postId, session?.user);

    return NextResponse.json({
      success: true,
      post: post
    });

  } catch (error) {
    console.error('Valorant 게시글 조회 오류:', error);
    
    return NextResponse.json(
      { 
        error: error.message || '게시글 조회에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: postId } = params;

    await communityService.deletePost('valorant', postId, session.user);

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Valorant 게시글 삭제 오류:', error);
    
    return NextResponse.json(
      { 
        error: error.message || '게시글 삭제에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}