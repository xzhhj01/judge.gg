// 커뮤니티 관련 유효성 검사 유틸 함수들

// 글자수 제한 상수
export const VALIDATION_LIMITS = {
    POST_TITLE: 100, // 게시글 제목
    POST_CONTENT: 5000, // 게시글 본문 (2000 → 5000으로 증가)
    VOTE_OPTION: 50, // 투표 옵션 (30 → 50으로 증가)
    COMMENT: 1000, // 댓글
    TAG_NAME: 20, // 태그명
};

// 글자수 검증 함수
export const validateLength = (text, maxLength, fieldName = "입력값") => {
    if (!text) {
        return { isValid: false, message: `${fieldName}을(를) 입력해주세요.` };
    }

    if (text.length > maxLength) {
        return {
            isValid: false,
            message: `${fieldName}은(는) ${maxLength}자 이하로 입력해주세요. (현재: ${text.length}자)`,
        };
    }

    return { isValid: true, message: "" };
};

// 게시글 제목 검증
export const validatePostTitle = (title) => {
    return validateLength(title, VALIDATION_LIMITS.POST_TITLE, "제목");
};

// 게시글 본문 검증
export const validatePostContent = (content) => {
    return validateLength(content, VALIDATION_LIMITS.POST_CONTENT, "본문");
};

// 투표 옵션 검증
export const validateVoteOption = (option) => {
    return validateLength(option, VALIDATION_LIMITS.VOTE_OPTION, "투표 옵션");
};

// 댓글 검증
export const validateComment = (comment) => {
    return validateLength(comment, VALIDATION_LIMITS.COMMENT, "댓글");
};

// 투표 옵션들 일괄 검증
export const validateVoteOptions = (options) => {
    for (let i = 0; i < options.length; i++) {
        const validation = validateVoteOption(options[i]);
        if (!validation.isValid) {
            return {
                isValid: false,
                message: `${i + 1}번째 ${validation.message}`,
            };
        }
    }

    // 옵션들이 중복되지 않는지 확인
    const uniqueOptions = new Set(options.filter((opt) => opt.trim()));
    if (uniqueOptions.size !== options.filter((opt) => opt.trim()).length) {
        return {
            isValid: false,
            message: "투표 옵션이 중복됩니다.",
        };
    }

    return { isValid: true, message: "" };
};

// 실시간 글자수 표시 헬퍼
export const getCharacterCountDisplay = (text, maxLength) => {
    const currentLength = text ? text.length : 0;
    const isOverLimit = currentLength > maxLength;

    return {
        text: `${currentLength}/${maxLength}자`,
        isOverLimit,
        className: isOverLimit ? "text-red-500" : "text-gray-500",
    };
};

// 태그 검증
export const validateTag = (tag) => {
    return validateLength(tag, VALIDATION_LIMITS.TAG_NAME, "태그");
};
