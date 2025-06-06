import { NextResponse } from 'next/server';
import { mentorService } from '@/app/services/mentor/mentor.service';
import { getServerSession } from 'next-auth/next';
import { storage } from '@/lib/firebase/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Helper function to upload file to Firebase Storage
async function uploadFileToStorage(file, path) {
  if (!file || file.size === 0) return null;
  
  // Validate file type (images only)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`지원하지 않는 파일 형식입니다: ${file.type}. JPG, PNG, GIF, WebP만 지원됩니다.`);
  }
  
  // Validate file size (max 10MB for mentor profile images)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`파일 크기가 너무 큽니다. 최대 10MB까지 지원됩니다.`);
  }
  
  // Sanitize filename to prevent path traversal
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  try {
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const fileRef = ref(storage, path);
    const snapshot = await uploadBytes(fileRef, uint8Array, {
      contentType: file.type,
      customMetadata: {
        originalName: sanitizedFileName,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'mentor-registration'
      }
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`파일 업로드 성공: ${path} -> ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error(`파일 업로드 실패: ${path}`, error);
    throw new Error(`파일 업로드에 실패했습니다: ${error.message}`);
  }
}

export async function POST(request) {
  try {
    // Get the actual session from NextAuth
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Extract basic information
    const mentorData = {
      selectedGame: formData.get('selectedGame'),
      nickname: formData.get('nickname'),
      oneLineIntro: formData.get('oneLineIntro'),
      detailedIntro: formData.get('detailedIntro'),
      contact: formData.get('contact'),
      responseRate: parseInt(formData.get('responseRate') || '100'),
      experienceYears: parseInt(formData.get('experienceYears') || '1'),
      tags: JSON.parse(formData.get('tags') || '{}'),
      curriculums: JSON.parse(formData.get('curriculums') || '[]'),
      experienceDetails: JSON.parse(formData.get('experienceDetails') || '[]'),
      accounts: [],
      services: []
    };

    // Generate unique user ID for file paths
    const userId = session.user.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
    const timestamp = Date.now();

    // Upload profile image
    const profileImage = formData.get('profileImage');
    if (profileImage && profileImage.size > 0) {
      console.log('프로필 이미지 업로드 시작:', profileImage.name, profileImage.size, 'bytes');
      const sanitizedProfileName = profileImage.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const profileImagePath = `mentors/${userId}/profile_${timestamp}_${sanitizedProfileName}`;
      const profileImageUrl = await uploadFileToStorage(profileImage, profileImagePath);
      mentorData.profileImageUrl = profileImageUrl;
      console.log('프로필 이미지 업로드 완료:', profileImageUrl);
    }

    // Extract account information with screenshot uploads
    let accountIndex = 0;
    while (formData.get(`account_${accountIndex}_name`)) {
      const accountName = formData.get(`account_${accountIndex}_name`);
      const screenshotFile = formData.get(`account_${accountIndex}_screenshot`);
      
      let screenshotUrl = null;
      if (screenshotFile && screenshotFile.size > 0) {
        console.log(`계정 ${accountIndex} 스크린샷 업로드 시작:`, screenshotFile.name, screenshotFile.size, 'bytes');
        const sanitizedScreenshotName = screenshotFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const screenshotPath = `mentors/${userId}/accounts/account_${accountIndex}_${timestamp}_${sanitizedScreenshotName}`;
        screenshotUrl = await uploadFileToStorage(screenshotFile, screenshotPath);
        console.log(`계정 ${accountIndex} 스크린샷 업로드 완료:`, screenshotUrl);
      }
      
      mentorData.accounts.push({
        name: accountName,
        screenshotUrl: screenshotUrl
      });
      accountIndex++;
    }

    // Extract service information
    let serviceIndex = 0;
    while (formData.get(`service_${serviceIndex}_type`)) {
      mentorData.services.push({
        type: formData.get(`service_${serviceIndex}_type`),
        price: parseInt(formData.get(`service_${serviceIndex}_price`) || '0')
      });
      serviceIndex++;
    }

    // Register mentor using the service with user info
    console.log('🔍 멘토 등록 API - session.user:', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image
    });
    
    const result = await mentorService.registerMentor(mentorData, session.user);
    
    console.log('🔍 멘토 등록 결과:', {
      mentorId: result.id,
      userId: result.userId
    });

    return NextResponse.json({
      success: true,
      mentor: result
    });

  } catch (error) {
    console.error('멘토 등록 오류:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || '멘토 등록에 실패했습니다.',
        details: error.stack
      },
      { status: 500 }
    );
  }
}