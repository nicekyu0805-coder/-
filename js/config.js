/**
 * YouTube DeepSearch Configuration
 * API 키 및 설정 관리
 */

const CONFIG = {
    // YouTube Data API v3 설정
    YOUTUBE_API: {
        // API 키를 여기에 입력하세요
        // https://console.developers.google.com 에서 발급받을 수 있습니다
        KEY: 'YOUR_YOUTUBE_API_KEY_HERE',
        BASE_URL: 'https://www.googleapis.com/youtube/v3',
        
        // API 요청 제한
        MAX_RESULTS_PER_REQUEST: 50,
        DEFAULT_RESULTS: 25,
        
        // 지원되는 지역 코드 (한국)
        REGION_CODE: 'KR',
        
        // 기본 언어
        LANGUAGE: 'ko'
    },
    
    // 애플리케이션 설정
    APP: {
        NAME: 'YouTube DeepSearch',
        VERSION: '1.0.0',
        
        // 로컬 스토리지 키
        STORAGE_KEYS: {
            API_KEY: 'youtube_deepsearch_api_key',
            SEARCH_HISTORY: 'youtube_deepsearch_history',
            FAVORITES: 'youtube_deepsearch_favorites',
            SETTINGS: 'youtube_deepsearch_settings'
        },
        
        // 기본 설정
        DEFAULT_SETTINGS: {
            maxResults: 25,
            order: 'relevance',
            duration: '',
            publishedAfter: '',
            viewCountRange: '',
            subscriberRange: '',
            safeSearch: 'moderate',
            viewMode: 'grid', // 'grid' or 'list'
            autoplay: false,
            darkMode: false
        },
        
        // 검색 기록 최대 개수
        MAX_HISTORY_ITEMS: 100,
        
        // 즐겨찾기 최대 개수
        MAX_FAVORITES: 500
    },
    
    // 날짜 필터 옵션
    DATE_FILTERS: {
        'hour': {
            label: '지난 1시간',
            value: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        },
        'today': {
            label: '오늘',
            value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        'week': {
            label: '이번 주',
            value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        'month': {
            label: '이번 달',
            value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        'year': {
            label: '올해',
            value: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        }
    },
    
    // 동영상 길이 필터
    DURATION_FILTERS: {
        'short': {
            label: '4분 미만',
            value: 'short'
        },
        'medium': {
            label: '4-20분',
            value: 'medium'
        },
        'long': {
            label: '20분 초과',
            value: 'long'
        }
    },
    
    // 조회수 범위 필터
    VIEW_COUNT_FILTERS: {
        '1000-': {
            label: '1천 이상',
            min: 1000,
            max: null
        },
        '10000-': {
            label: '1만 이상',
            min: 10000,
            max: null
        },
        '100000-': {
            label: '10만 이상',
            min: 100000,
            max: null
        },
        '1000000-': {
            label: '100만 이상',
            min: 1000000,
            max: null
        },
        '10000000-': {
            label: '1천만 이상',
            min: 10000000,
            max: null
        },
        '-10000': {
            label: '1만 미만',
            min: 0,
            max: 10000
        },
        '10000-100000': {
            label: '1만~10만',
            min: 10000,
            max: 100000
        },
        '100000-1000000': {
            label: '10만~100만',
            min: 100000,
            max: 1000000
        },
        '1000000-10000000': {
            label: '100만~1천만',
            min: 1000000,
            max: 10000000
        }
    },
    
    // 구독자수 범위 필터
    SUBSCRIBER_FILTERS: {
        '1000-': {
            label: '1천 이상',
            min: 1000,
            max: null
        },
        '10000-': {
            label: '1만 이상',
            min: 10000,
            max: null
        },
        '50000-': {
            label: '5만 이상',
            min: 50000,
            max: null
        },
        '100000-': {
            label: '10만 이상',
            min: 100000,
            max: null
        },
        '500000-': {
            label: '50만 이상',
            min: 500000,
            max: null
        },
        '1000000-': {
            label: '100만 이상',
            min: 1000000,
            max: null
        },
        '5000000-': {
            label: '500만 이상',
            min: 5000000,
            max: null
        },
        '-10000': {
            label: '1만 미만',
            min: 0,
            max: 10000
        },
        '10000-100000': {
            label: '1만~10만',
            min: 10000,
            max: 100000
        },
        '100000-1000000': {
            label: '10만~100만',
            min: 100000,
            max: 1000000
        },
        '1000000-5000000': {
            label: '100만~500만',
            min: 1000000,
            max: 5000000
        }
    },
    
    // 정렬 옵션
    ORDER_OPTIONS: {
        'relevance': '관련성',
        'date': '최신순',
        'viewCount': '조회수',
        'rating': '평점',
        'title': '제목순'
    },
    
    // 에러 메시지
    ERROR_MESSAGES: {
        API_KEY_MISSING: 'YouTube API 키를 설정해주세요.',
        API_KEY_INVALID: 'YouTube API 키가 유효하지 않습니다.',
        NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
        QUOTA_EXCEEDED: 'API 사용량 한도를 초과했습니다. 나중에 다시 시도해주세요.',
        SEARCH_FAILED: '검색에 실패했습니다. 다시 시도해주세요.',
        NO_RESULTS: '검색 결과가 없습니다.',
        INVALID_SEARCH: '올바른 검색어를 입력해주세요.'
    },
    
    // 성공 메시지
    SUCCESS_MESSAGES: {
        FAVORITE_ADDED: '즐겨찾기에 추가되었습니다.',
        FAVORITE_REMOVED: '즐겨찾기에서 제거되었습니다.',
        SETTINGS_SAVED: '설정이 저장되었습니다.',
        EXPORT_SUCCESS: '검색 결과를 내보냈습니다.'
    },
    
    // 디버그 모드
    DEBUG: false
};

/**
 * API 키 유효성 검사
 * @param {string} apiKey - 검사할 API 키
 * @returns {boolean} 유효성 여부
 */
function validateApiKey(apiKey) {
    return apiKey && 
           apiKey.trim() !== '' && 
           apiKey !== 'YOUR_YOUTUBE_API_KEY_HERE' &&
           apiKey.length > 20;
}

/**
 * 설정 저장
 * @param {Object} settings - 저장할 설정
 */
function saveSettings(settings) {
    try {
        const currentSettings = loadSettings();
        const newSettings = { ...currentSettings, ...settings };
        localStorage.setItem(CONFIG.APP.STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
        
        if (CONFIG.DEBUG) {
            console.log('Settings saved:', newSettings);
        }
        
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
}

/**
 * 설정 불러오기
 * @returns {Object} 현재 설정
 */
function loadSettings() {
    try {
        const stored = localStorage.getItem(CONFIG.APP.STORAGE_KEYS.SETTINGS);
        if (stored) {
            return { ...CONFIG.APP.DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    
    return { ...CONFIG.APP.DEFAULT_SETTINGS };
}

/**
 * API 키 저장
 * @param {string} apiKey - 저장할 API 키
 */
function saveApiKey(apiKey) {
    if (validateApiKey(apiKey)) {
        localStorage.setItem(CONFIG.APP.STORAGE_KEYS.API_KEY, apiKey);
        CONFIG.YOUTUBE_API.KEY = apiKey;
        return true;
    }
    return false;
}

/**
 * 저장된 API 키 불러오기
 * @returns {string|null} 저장된 API 키
 */
function loadApiKey() {
    const stored = localStorage.getItem(CONFIG.APP.STORAGE_KEYS.API_KEY);
    if (stored && validateApiKey(stored)) {
        CONFIG.YOUTUBE_API.KEY = stored;
        return stored;
    }
    return null;
}

/**
 * 디버그 로그
 * @param {...any} args - 로그할 내용
 */
function debugLog(...args) {
    if (CONFIG.DEBUG) {
        console.log('[YouTube DeepSearch Debug]', ...args);
    }
}

// 페이지 로드 시 설정 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 API 키 불러오기
    loadApiKey();
    
    // 저장된 설정 불러오기
    const settings = loadSettings();
    
    debugLog('Configuration initialized:', {
        hasApiKey: !!CONFIG.YOUTUBE_API.KEY && CONFIG.YOUTUBE_API.KEY !== 'YOUR_YOUTUBE_API_KEY_HERE',
        settings: settings
    });
});