/**
 * YouTube DeepSearch Main Application
 * 메인 애플리케이션 진입점
 */

class YouTubeDeepSearch {
    constructor() {
        this.initialized = false;
        this.apiKeyChecked = false;
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        if (this.initialized) return;
        
        try {
            debugLog('Initializing YouTube DeepSearch...');
            
            // 설정 검증
            this.validateConfiguration();
            
            // API 키 확인
            await this.checkApiKey();
            
            // 이벤트 리스너 초기화
            this.initializeGlobalEventListeners();
            
            // 초기 데이터 로드
            this.loadInitialData();
            
            // 웰컴 메시지 표시
            this.showWelcomeMessage();
            
            this.initialized = true;
            debugLog('YouTube DeepSearch initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize YouTube DeepSearch:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 설정 검증
     */
    validateConfiguration() {
        // 필수 DOM 요소 확인
        const requiredElements = [
            'searchForm',
            'searchQuery',
            'resultsSection',
            'resultsContainer'
        ];

        for (const id of requiredElements) {
            if (!document.getElementById(id)) {
                throw new Error(`Required element not found: ${id}`);
            }
        }

        debugLog('Configuration validation passed');
    }

    /**
     * API 키 확인
     */
    async checkApiKey() {
        const apiKey = loadApiKey();
        
        if (!apiKey) {
            debugLog('No API key found, showing setup');
            // 페이지 로드 후 잠시 기다린 다음 API 키 설정 모달 표시
            setTimeout(() => {
                if (!this.apiKeyChecked) {
                    showApiKeySetup();
                    this.apiKeyChecked = true;
                }
            }, 1000);
            return;
        }

        try {
            const isValid = await youtubeAPI.validateApiKey(apiKey);
            if (isValid) {
                debugLog('API key validated successfully');
                this.apiKeyChecked = true;
            } else {
                debugLog('Invalid API key, showing setup');
                showApiKeySetup();
            }
        } catch (error) {
            debugLog('API key validation failed:', error);
            showNotification('API 키 검증에 실패했습니다.', 'warning');
        }
    }

    /**
     * 전역 이벤트 리스너 초기화
     */
    initializeGlobalEventListeners() {
        // 페이지 가시성 변경 시 처리
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onPageVisible();
            }
        });

        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            showNotification('인터넷 연결이 복구되었습니다.', 'success');
        });

        window.addEventListener('offline', () => {
            showNotification('인터넷 연결이 끊어졌습니다.', 'warning');
        });

        // 브라우저 뒤로 가기 버튼 처리
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.searchParams) {
                this.restoreSearchFromState(event.state.searchParams);
            }
        });

        // 전역 에러 처리
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // 처리되지 않은 Promise 거부 처리
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });

        debugLog('Global event listeners initialized');
    }

    /**
     * 초기 데이터 로드
     */
    loadInitialData() {
        try {
            // URL에서 검색 파라미터 확인
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');
            
            if (query) {
                // URL에 검색어가 있으면 자동 검색
                document.getElementById('searchQuery').value = decodeURIComponent(query);
                
                // 다른 파라미터도 설정
                const order = urlParams.get('order');
                const duration = urlParams.get('duration');
                const maxResults = urlParams.get('maxResults');
                
                if (order) document.getElementById('order').value = order;
                if (duration) document.getElementById('duration').value = duration;
                if (maxResults) document.getElementById('maxResults').value = maxResults;
                
                // API 키가 있으면 자동 검색 실행
                if (this.apiKeyChecked && CONFIG.YOUTUBE_API.KEY && CONFIG.YOUTUBE_API.KEY !== 'YOUR_YOUTUBE_API_KEY_HERE') {
                    setTimeout(() => {
                        uiManager.handleSearch({ preventDefault: () => {} });
                    }, 500);
                }
            }
            
            debugLog('Initial data loaded');
        } catch (error) {
            debugLog('Error loading initial data:', error);
        }
    }

    /**
     * 웰컴 메시지 표시
     */
    showWelcomeMessage() {
        const isFirstVisit = !localStorage.getItem('youtube_deepsearch_visited');
        
        if (isFirstVisit) {
            setTimeout(() => {
                showNotification('YouTube DeepSearch에 오신 것을 환영합니다! 🎉', 'info', 5000);
                localStorage.setItem('youtube_deepsearch_visited', 'true');
            }, 2000);
        }
    }

    /**
     * 페이지가 보일 때 처리
     */
    onPageVisible() {
        // 캐시된 검색 결과가 너무 오래된 경우 새로고침 제안
        const lastSearch = localStorage.getItem('last_search_time');
        if (lastSearch) {
            const lastSearchTime = parseInt(lastSearch);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            
            if (now - lastSearchTime > oneHour && uiManager.searchResults.length > 0) {
                showNotification('검색 결과를 새로고침하시겠습니까?', 'info');
            }
        }
    }

    /**
     * 브라우저 상태에서 검색 복원
     * @param {Object} searchParams - 검색 파라미터
     */
    restoreSearchFromState(searchParams) {
        if (!searchParams || !uiManager) return;
        
        try {
            // 폼에 값 설정
            Object.entries(searchParams).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element && value) {
                    element.value = value;
                }
            });
            
            // 검색 실행
            uiManager.performSearch(searchParams);
            
            debugLog('Search restored from browser state');
        } catch (error) {
            debugLog('Error restoring search state:', error);
        }
    }

    /**
     * 초기화 오류 처리
     * @param {Error} error - 오류 객체
     */
    handleInitializationError(error) {
        const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
        
        // 사용자에게 오류 알림
        showNotification(`초기화 오류: ${errorMessage}`, 'error', 0);
        
        // 오류 상세 정보를 콘솔에 로그
        console.error('Initialization error details:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        
        // 기본적인 기능이라도 작동하도록 시도
        try {
            this.enableBasicFunctionality();
        } catch (fallbackError) {
            console.error('Fallback initialization failed:', fallbackError);
        }
    }

    /**
     * 전역 오류 처리
     * @param {Error} error - 오류 객체
     */
    handleGlobalError(error) {
        // 사용자에게는 간단한 메시지만 표시
        if (error.message && !error.message.includes('Script error')) {
            let userMessage = '문제가 발생했습니다.';
            
            if (error.message.includes('network')) {
                userMessage = '네트워크 연결을 확인해주세요.';
            } else if (error.message.includes('quota')) {
                userMessage = 'API 사용량 한도를 초과했습니다.';
            }
            
            showNotification(userMessage, 'error');
        }
        
        // 개발자를 위한 상세 로그
        debugLog('Global error handled:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 기본 기능 활성화 (오류 시 폴백)
     */
    enableBasicFunctionality() {
        // 최소한의 검색 기능 활성화
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showNotification('초기화가 완료되지 않았습니다. 페이지를 새로고침해주세요.', 'warning');
            });
        }
        
        debugLog('Basic functionality enabled');
    }

    /**
     * URL 업데이트 (검색 상태 저장)
     * @param {Object} searchParams - 검색 파라미터
     */
    updateURL(searchParams) {
        if (!searchParams || !searchParams.query) return;
        
        try {
            const url = new URL(window.location);
            url.searchParams.set('q', encodeURIComponent(searchParams.query));
            
            if (searchParams.order && searchParams.order !== 'relevance') {
                url.searchParams.set('order', searchParams.order);
            } else {
                url.searchParams.delete('order');
            }
            
            if (searchParams.duration) {
                url.searchParams.set('duration', searchParams.duration);
            } else {
                url.searchParams.delete('duration');
            }
            
            if (searchParams.maxResults && searchParams.maxResults !== 25) {
                url.searchParams.set('maxResults', searchParams.maxResults);
            } else {
                url.searchParams.delete('maxResults');
            }
            
            // 브라우저 히스토리에 상태 저장
            const state = { searchParams };
            window.history.pushState(state, '', url.toString());
            
            debugLog('URL updated with search params');
        } catch (error) {
            debugLog('Error updating URL:', error);
        }
    }

    /**
     * 통계 수집 (개인정보 보호를 위해 익명화)
     * @param {string} action - 액션 타입
     * @param {Object} data - 추가 데이터
     */
    trackEvent(action, data = {}) {
        if (!CONFIG.DEBUG) return; // 디버그 모드일 때만 추적
        
        try {
            const event = {
                action: action,
                timestamp: new Date().toISOString(),
                data: data,
                // 개인정보가 포함되지 않은 기본 정보만 수집
                session: {
                    language: navigator.language,
                    platform: navigator.platform,
                    userAgent: navigator.userAgent.substring(0, 100) // 일부만
                }
            };
            
            debugLog('Event tracked:', event);
            
            // 로컬 스토리지에 통계 저장 (선택사항)
            const stats = loadFromStorage('app_statistics', []);
            stats.push(event);
            
            // 최대 1000개 항목만 유지
            const limitedStats = stats.slice(-1000);
            saveToStorage('app_statistics', limitedStats);
            
        } catch (error) {
            debugLog('Error tracking event:', error);
        }
    }

    /**
     * 성능 모니터링
     */
    monitorPerformance() {
        if (!window.performance || !CONFIG.DEBUG) return;
        
        try {
            // 페이지 로드 시간
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = window.performance.timing;
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    
                    this.trackEvent('page_load', {
                        loadTime: loadTime,
                        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
                    });
                }, 0);
            });
            
            // API 응답 시간 모니터링
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
                const startTime = performance.now();
                const response = await originalFetch.apply(this, args);
                const endTime = performance.now();
                
                if (args[0] && args[0].includes('googleapis.com')) {
                    youtubeDeepSearch.trackEvent('api_request', {
                        duration: endTime - startTime,
                        status: response.status,
                        endpoint: args[0].split('/').pop()
                    });
                }
                
                return response;
            };
            
            debugLog('Performance monitoring enabled');
        } catch (error) {
            debugLog('Error setting up performance monitoring:', error);
        }
    }

    /**
     * 앱 정보 표시
     */
    showAppInfo() {
        const info = {
            name: CONFIG.APP.NAME,
            version: CONFIG.APP.VERSION,
            initialized: this.initialized,
            apiKeySet: !!CONFIG.YOUTUBE_API.KEY && CONFIG.YOUTUBE_API.KEY !== 'YOUR_YOUTUBE_API_KEY_HERE',
            featuresEnabled: {
                search: true,
                favorites: !!localStorage.getItem(CONFIG.APP.STORAGE_KEYS.FAVORITES),
                history: !!localStorage.getItem(CONFIG.APP.STORAGE_KEYS.SEARCH_HISTORY),
                export: true
            },
            browserSupport: {
                localStorage: !!window.localStorage,
                fetch: !!window.fetch,
                history: !!window.history,
                performance: !!window.performance
            }
        };
        
        console.table(info);
        return info;
    }
}

// 전역 인스턴스 생성
const youtubeDeepSearch = new YouTubeDeepSearch();

// DOM 로드 완료 시 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', function() {
    youtubeDeepSearch.init();
    
    // 성능 모니터링 시작 (디버그 모드에서만)
    if (CONFIG.DEBUG) {
        youtubeDeepSearch.monitorPerformance();
    }
    
    // 개발자 도구에서 앱 정보 확인 가능하도록
    window.appInfo = youtubeDeepSearch.showAppInfo;
    
    debugLog('Main application loaded');
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
    // 마지막 검색 시간 저장
    if (uiManager && uiManager.searchResults.length > 0) {
        localStorage.setItem('last_search_time', Date.now().toString());
    }
});

// 전역 객체에 주요 기능 노출 (디버깅용)
if (CONFIG.DEBUG) {
    window.YouTubeDeepSearch = {
        app: youtubeDeepSearch,
        api: youtubeAPI,
        ui: () => uiManager,
        config: CONFIG,
        utils: {
            formatNumber,
            formatDuration,
            formatRelativeTime,
            showNotification,
            exportData
        }
    };
}