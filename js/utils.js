/**
 * YouTube DeepSearch Utility Functions
 * 유틸리티 함수들
 */

/**
 * 숫자를 사람이 읽기 쉬운 형태로 변환
 * @param {number} num - 변환할 숫자
 * @returns {string} 포맷된 문자열 (예: 1234567 -> 123만)
 */
function formatNumber(num) {
    if (num >= 100000000) {
        return Math.floor(num / 100000000) + '억';
    } else if (num >= 10000) {
        return Math.floor(num / 10000) + '만';
    } else if (num >= 1000) {
        return Math.floor(num / 1000) + '천';
    }
    return num.toString();
}

/**
 * YouTube 동영상 길이를 ISO 8601 형식에서 사람이 읽기 쉬운 형태로 변환
 * @param {string} duration - ISO 8601 duration (예: PT4M13S)
 * @returns {string} 포맷된 시간 (예: 4:13)
 */
function formatDuration(duration) {
    if (!duration) return '0:00';
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

/**
 * 날짜를 상대적 시간으로 표시
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 상대적 시간 (예: 2시간 전)
 */
function formatRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return '방금 전';
    } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}분 전`;
    } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    } else if (diffInSeconds < 2592000) {
        return `${Math.floor(diffInSeconds / 86400)}일 전`;
    } else if (diffInSeconds < 31536000) {
        return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
    } else {
        return `${Math.floor(diffInSeconds / 31536000)}년 전`;
    }
}

/**
 * 텍스트 절단 (말줄임표 추가)
 * @param {string} text - 원본 텍스트
 * @param {number} maxLength - 최대 길이
 * @returns {string} 절단된 텍스트
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * URL에서 YouTube 비디오 ID 추출
 * @param {string} url - YouTube URL
 * @returns {string|null} 비디오 ID 또는 null
 */
function extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * YouTube 썸네일 URL 생성
 * @param {string} videoId - 비디오 ID
 * @param {string} quality - 품질 ('default', 'medium', 'high', 'standard', 'maxres')
 * @returns {string} 썸네일 URL
 */
function getThumbnailUrl(videoId, quality = 'medium') {
    return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * HTML 엔티티 디코딩
 * @param {string} html - HTML 문자열
 * @returns {string} 디코딩된 문자열
 */
function decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

/**
 * 검색어 하이라이팅
 * @param {string} text - 원본 텍스트
 * @param {string} query - 검색어
 * @returns {string} 하이라이트된 HTML
 */
function highlightText(text, query) {
    if (!query || !text) return text;
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 쓰로틀 함수
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (ms)
 * @returns {Function} 쓰로틀된 함수
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 로컬 스토리지에 데이터 저장 (JSON)
 * @param {string} key - 키
 * @param {any} data - 저장할 데이터
 * @returns {boolean} 성공 여부
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save to storage:', error);
        return false;
    }
}

/**
 * 로컬 스토리지에서 데이터 불러오기 (JSON)
 * @param {string} key - 키
 * @param {any} defaultValue - 기본값
 * @returns {any} 불러온 데이터
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Failed to load from storage:', error);
        return defaultValue;
    }
}

/**
 * 검색 기록 저장
 * @param {string} query - 검색어
 * @param {Object} filters - 필터 설정
 */
function saveSearchHistory(query, filters) {
    const history = loadFromStorage(CONFIG.APP.STORAGE_KEYS.SEARCH_HISTORY, []);
    
    const searchItem = {
        id: Date.now(),
        query: query,
        filters: filters,
        timestamp: new Date().toISOString(),
        resultsCount: 0
    };
    
    // 중복 검색어 제거
    const filtered = history.filter(item => 
        !(item.query === query && JSON.stringify(item.filters) === JSON.stringify(filters))
    );
    
    // 최신 검색을 맨 앞에 추가
    filtered.unshift(searchItem);
    
    // 최대 개수 제한
    const limited = filtered.slice(0, CONFIG.APP.MAX_HISTORY_ITEMS);
    
    return saveToStorage(CONFIG.APP.STORAGE_KEYS.SEARCH_HISTORY, limited);
}

/**
 * 검색 기록 불러오기
 * @returns {Array} 검색 기록 배열
 */
function getSearchHistory() {
    return loadFromStorage(CONFIG.APP.STORAGE_KEYS.SEARCH_HISTORY, []);
}

/**
 * 즐겨찾기 추가
 * @param {Object} video - 동영상 정보
 * @returns {boolean} 성공 여부
 */
function addToFavorites(video) {
    const favorites = loadFromStorage(CONFIG.APP.STORAGE_KEYS.FAVORITES, []);
    
    // 이미 즐겨찾기에 있는지 확인
    if (favorites.find(fav => fav.id === video.id)) {
        return false;
    }
    
    const favoriteItem = {
        ...video,
        addedAt: new Date().toISOString()
    };
    
    favorites.unshift(favoriteItem);
    
    // 최대 개수 제한
    const limited = favorites.slice(0, CONFIG.APP.MAX_FAVORITES);
    
    return saveToStorage(CONFIG.APP.STORAGE_KEYS.FAVORITES, limited);
}

/**
 * 즐겨찾기에서 제거
 * @param {string} videoId - 동영상 ID
 * @returns {boolean} 성공 여부
 */
function removeFromFavorites(videoId) {
    const favorites = loadFromStorage(CONFIG.APP.STORAGE_KEYS.FAVORITES, []);
    const filtered = favorites.filter(fav => fav.id !== videoId);
    
    return saveToStorage(CONFIG.APP.STORAGE_KEYS.FAVORITES, filtered);
}

/**
 * 즐겨찾기 목록 불러오기
 * @returns {Array} 즐겨찾기 배열
 */
function getFavorites() {
    return loadFromStorage(CONFIG.APP.STORAGE_KEYS.FAVORITES, []);
}

/**
 * 즐겨찾기 여부 확인
 * @param {string} videoId - 동영상 ID
 * @returns {boolean} 즐겨찾기 여부
 */
function isFavorited(videoId) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === videoId);
}

/**
 * 데이터 내보내기 (CSV, JSON)
 * @param {Array} data - 내보낼 데이터
 * @param {string} filename - 파일명
 * @param {string} format - 형식 ('csv', 'json')
 */
function exportData(data, filename, format = 'json') {
    let content, mimeType, extension;
    
    if (format === 'csv') {
        content = convertToCSV(data);
        mimeType = 'text/csv';
        extension = 'csv';
    } else {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

/**
 * 배열을 CSV 형식으로 변환
 * @param {Array} data - 변환할 데이터
 * @returns {string} CSV 문자열
 */
function convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header] || '';
            // CSV 특수문자 처리
            return typeof value === 'string' && value.includes(',') 
                ? `"${value.replace(/"/g, '""')}"` 
                : value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

/**
 * 에러 처리 및 사용자 알림
 * @param {Error} error - 에러 객체
 * @param {string} context - 에러 발생 컨텍스트
 */
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    let message = CONFIG.ERROR_MESSAGES.SEARCH_FAILED;
    
    if (error.message.includes('quotaExceeded')) {
        message = CONFIG.ERROR_MESSAGES.QUOTA_EXCEEDED;
    } else if (error.message.includes('keyInvalid')) {
        message = CONFIG.ERROR_MESSAGES.API_KEY_INVALID;
    } else if (error.message.includes('Network Error')) {
        message = CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    showNotification(message, 'error');
}

/**
 * 사용자 알림 표시
 * @param {string} message - 알림 메시지
 * @param {string} type - 알림 타입 ('success', 'error', 'warning', 'info')
 * @param {number} duration - 표시 시간 (ms)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // 기존 알림 제거
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300`;
    
    // 타입별 스타일
    const typeClasses = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };
    
    notification.classList.add(...typeClasses[type].split(' '));
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button class="ml-4 text-xl leading-none" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 애니메이션
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // 자동 제거
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

/**
 * 조회수 범위 필터 적용
 * @param {Array} videos - 동영상 배열
 * @param {string} rangeFilter - 범위 필터 값
 * @returns {Array} 필터링된 동영상 배열
 */
function filterByViewCount(videos, rangeFilter) {
    if (!rangeFilter || !videos) return videos;
    
    const filter = CONFIG.VIEW_COUNT_FILTERS[rangeFilter];
    if (!filter) return videos;
    
    return videos.filter(video => {
        const viewCount = video.viewCount || 0;
        
        if (filter.min !== null && viewCount < filter.min) {
            return false;
        }
        
        if (filter.max !== null && viewCount > filter.max) {
            return false;
        }
        
        return true;
    });
}

/**
 * 구독자수 범위 필터 적용
 * @param {Array} videos - 동영상 배열  
 * @param {string} rangeFilter - 범위 필터 값
 * @returns {Array} 필터링된 동영상 배열
 */
function filterBySubscriberCount(videos, rangeFilter) {
    if (!rangeFilter || !videos) return videos;
    
    const filter = CONFIG.SUBSCRIBER_FILTERS[rangeFilter];
    if (!filter) return videos;
    
    return videos.filter(video => {
        const subscriberCount = video.subscriberCount || 0;
        
        if (filter.min !== null && subscriberCount < filter.min) {
            return false;
        }
        
        if (filter.max !== null && subscriberCount > filter.max) {
            return false;
        }
        
        return true;
    });
}

/**
 * 범위 필터 라벨 가져오기
 * @param {string} filterType - 필터 타입 ('viewCount' 또는 'subscriber')
 * @param {string} rangeValue - 범위 값
 * @returns {string} 라벨 텍스트
 */
function getRangeFilterLabel(filterType, rangeValue) {
    if (!rangeValue) return '';
    
    const filters = filterType === 'viewCount' 
        ? CONFIG.VIEW_COUNT_FILTERS 
        : CONFIG.SUBSCRIBER_FILTERS;
    
    return filters[rangeValue]?.label || '';
}

/**
 * 범위에 따른 동영상 개수 카운트
 * @param {Array} videos - 동영상 배열
 * @param {string} filterType - 필터 타입 ('viewCount' 또는 'subscriber')
 * @returns {Object} 각 범위별 동영상 개수
 */
function countVideosByRange(videos, filterType) {
    if (!videos || videos.length === 0) return {};
    
    const filters = filterType === 'viewCount' 
        ? CONFIG.VIEW_COUNT_FILTERS 
        : CONFIG.SUBSCRIBER_FILTERS;
    
    const counts = {};
    
    Object.entries(filters).forEach(([key, filter]) => {
        const count = videos.filter(video => {
            const value = filterType === 'viewCount' 
                ? (video.viewCount || 0)
                : (video.subscriberCount || 0);
            
            if (filter.min !== null && value < filter.min) return false;
            if (filter.max !== null && value > filter.max) return false;
            
            return true;
        }).length;
        
        counts[key] = count;
    });
    
    return counts;
}