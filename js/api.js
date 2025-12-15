/**
 * YouTube DeepSearch API Functions
 * YouTube Data API v3 연동 함수들
 */

class YouTubeAPI {
    constructor() {
        this.baseUrl = CONFIG.YOUTUBE_API.BASE_URL;
        this.apiKey = CONFIG.YOUTUBE_API.KEY;
        this.requestQueue = [];
        this.isProcessing = false;
    }

    /**
     * API 키 설정
     * @param {string} apiKey - YouTube API 키
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        CONFIG.YOUTUBE_API.KEY = apiKey;
    }

    /**
     * API 요청 큐 처리
     */
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const { resolve, reject, request } = this.requestQueue.shift();
            
            try {
                const result = await this.makeRequest(request.endpoint, request.params);
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // API 호출 간격 조절 (Rate limiting)
            await this.delay(100);
        }

        this.isProcessing = false;
    }

    /**
     * 지연 함수
     * @param {number} ms - 지연 시간 (밀리초)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * API 요청 추가
     * @param {string} endpoint - API 엔드포인트
     * @param {Object} params - 요청 파라미터
     * @returns {Promise} 요청 결과
     */
    queueRequest(endpoint, params) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                resolve,
                reject,
                request: { endpoint, params }
            });
            this.processQueue();
        });
    }

    /**
     * 실제 API 요청 실행
     * @param {string} endpoint - API 엔드포인트
     * @param {Object} params - 요청 파라미터
     * @returns {Promise} 응답 데이터
     */
    async makeRequest(endpoint, params) {
        if (!this.apiKey || this.apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
            throw new Error('API 키가 설정되지 않았습니다.');
        }

        const url = new URL(`${this.baseUrl}/${endpoint}`);
        url.searchParams.append('key', this.apiKey);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.append(key, value);
            }
        });

        debugLog('API Request:', url.toString());

        try {
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            debugLog('API Response:', data);
            
            return data;
        } catch (error) {
            debugLog('API Error:', error);
            throw error;
        }
    }

    /**
     * 동영상 검색
     * @param {Object} searchParams - 검색 파라미터
     * @returns {Promise} 검색 결과
     */
    async searchVideos(searchParams) {
        const {
            query,
            maxResults = CONFIG.YOUTUBE_API.DEFAULT_RESULTS,
            order = 'relevance',
            duration = '',
            publishedAfter = '',
            regionCode = CONFIG.YOUTUBE_API.REGION_CODE,
            pageToken = ''
        } = searchParams;

        const params = {
            part: 'snippet',
            type: 'video',
            q: query,
            maxResults: Math.min(maxResults, CONFIG.YOUTUBE_API.MAX_RESULTS_PER_REQUEST),
            order: order,
            regionCode: regionCode,
            relevanceLanguage: CONFIG.YOUTUBE_API.LANGUAGE
        };

        // 선택적 파라미터 추가
        if (duration) {
            params.videoDuration = duration;
        }

        if (publishedAfter) {
            params.publishedAfter = publishedAfter;
        }

        if (pageToken) {
            params.pageToken = pageToken;
        }

        try {
            const response = await this.queueRequest('search', params);
            
            if (!response.items || response.items.length === 0) {
                return {
                    videos: [],
                    totalResults: 0,
                    nextPageToken: null,
                    prevPageToken: null
                };
            }

            // 동영상 상세 정보 가져오기
            const videoIds = response.items.map(item => item.id.videoId);
            const detailedVideos = await this.getVideoDetails(videoIds);
            
            // 채널 정보를 포함한 동영상 정보 가져오기
            const videosWithChannelInfo = await this.enrichVideosWithChannelInfo(detailedVideos);

            return {
                videos: videosWithChannelInfo,
                totalResults: response.pageInfo?.totalResults || 0,
                nextPageToken: response.nextPageToken || null,
                prevPageToken: response.prevPageToken || null,
                pageInfo: response.pageInfo
            };
        } catch (error) {
            handleError(error, 'Video Search');
            throw error;
        }
    }

    /**
     * 동영상 상세 정보 조회
     * @param {Array} videoIds - 동영상 ID 배열
     * @returns {Promise} 상세 정보 배열
     */
    async getVideoDetails(videoIds) {
        if (!videoIds || videoIds.length === 0) {
            return [];
        }

        const params = {
            part: 'snippet,statistics,contentDetails',
            id: videoIds.join(',')
        };

        try {
            const response = await this.queueRequest('videos', params);
            
            return response.items.map(video => this.formatVideoData(video));
        } catch (error) {
            debugLog('Error getting video details:', error);
            // 상세 정보 조회 실패 시에도 기본 정보는 반환
            return videoIds.map(id => ({ id }));
        }
    }

    /**
     * 동영상 데이터 포맷팅
     * @param {Object} video - 원본 동영상 데이터
     * @returns {Object} 포맷된 동영상 데이터
     */
    formatVideoData(video) {
        const snippet = video.snippet || {};
        const statistics = video.statistics || {};
        const contentDetails = video.contentDetails || {};

        return {
            id: video.id,
            title: decodeHtml(snippet.title || '제목 없음'),
            description: decodeHtml(snippet.description || ''),
            channelTitle: decodeHtml(snippet.channelTitle || '알 수 없는 채널'),
            channelId: snippet.channelId || '',
            publishedAt: snippet.publishedAt || '',
            thumbnails: {
                default: snippet.thumbnails?.default?.url || '',
                medium: snippet.thumbnails?.medium?.url || '',
                high: snippet.thumbnails?.high?.url || '',
                standard: snippet.thumbnails?.standard?.url || '',
                maxres: snippet.thumbnails?.maxres?.url || ''
            },
            duration: contentDetails.duration || 'PT0S',
            viewCount: parseInt(statistics.viewCount) || 0,
            likeCount: parseInt(statistics.likeCount) || 0,
            commentCount: parseInt(statistics.commentCount) || 0,
            tags: snippet.tags || [],
            categoryId: snippet.categoryId || '',
            url: `https://www.youtube.com/watch?v=${video.id}`,
            embedUrl: `https://www.youtube.com/embed/${video.id}`,
            
            // 포맷된 데이터
            formattedDuration: formatDuration(contentDetails.duration),
            formattedViewCount: formatNumber(parseInt(statistics.viewCount) || 0),
            formattedLikeCount: formatNumber(parseInt(statistics.likeCount) || 0),
            formattedPublishedAt: formatRelativeTime(snippet.publishedAt),
            
            // 썸네일 우선순위 (고화질부터)
            thumbnail: snippet.thumbnails?.maxres?.url ||
                      snippet.thumbnails?.standard?.url ||
                      snippet.thumbnails?.high?.url ||
                      snippet.thumbnails?.medium?.url ||
                      snippet.thumbnails?.default?.url ||
                      `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`
        };
    }

    /**
     * 채널 정보 조회
     * @param {string} channelId - 채널 ID
     * @returns {Promise} 채널 정보
     */
    async getChannelInfo(channelId) {
        const params = {
            part: 'snippet,statistics',
            id: channelId
        };

        try {
            const response = await this.queueRequest('channels', params);
            
            if (!response.items || response.items.length === 0) {
                return null;
            }

            const channel = response.items[0];
            const snippet = channel.snippet || {};
            const statistics = channel.statistics || {};

            return {
                id: channel.id,
                title: decodeHtml(snippet.title || ''),
                description: decodeHtml(snippet.description || ''),
                thumbnails: snippet.thumbnails || {},
                subscriberCount: parseInt(statistics.subscriberCount) || 0,
                videoCount: parseInt(statistics.videoCount) || 0,
                viewCount: parseInt(statistics.viewCount) || 0,
                formattedSubscriberCount: formatNumber(parseInt(statistics.subscriberCount) || 0),
                formattedVideoCount: formatNumber(parseInt(statistics.videoCount) || 0),
                formattedViewCount: formatNumber(parseInt(statistics.viewCount) || 0)
            };
        } catch (error) {
            debugLog('Error getting channel info:', error);
            return null;
        }
    }

    /**
     * 동영상에 채널 정보 추가
     * @param {Array} videos - 동영상 배열
     * @returns {Promise} 채널 정보가 포함된 동영상 배열
     */
    async enrichVideosWithChannelInfo(videos) {
        if (!videos || videos.length === 0) {
            return videos;
        }

        try {
            // 유니크한 채널 ID들 추출
            const channelIds = [...new Set(videos.map(video => video.channelId).filter(Boolean))];
            
            if (channelIds.length === 0) {
                return videos;
            }

            // 채널 정보를 배치로 가져오기
            const channelInfoMap = await this.getMultipleChannelInfo(channelIds);
            
            // 동영상에 채널 정보 추가
            return videos.map(video => {
                const channelInfo = channelInfoMap[video.channelId];
                if (channelInfo) {
                    return {
                        ...video,
                        subscriberCount: channelInfo.subscriberCount,
                        formattedSubscriberCount: channelInfo.formattedSubscriberCount,
                        channelVideoCount: channelInfo.videoCount,
                        channelTotalViews: channelInfo.viewCount
                    };
                }
                return video;
            });
        } catch (error) {
            debugLog('Error enriching videos with channel info:', error);
            return videos; // 오류 시 원본 배열 반환
        }
    }

    /**
     * 여러 채널 정보를 한 번에 가져오기
     * @param {Array} channelIds - 채널 ID 배열
     * @returns {Promise} 채널 정보 맵
     */
    async getMultipleChannelInfo(channelIds) {
        if (!channelIds || channelIds.length === 0) {
            return {};
        }

        // API 호출 제한 때문에 50개씩 나누어 처리
        const chunks = [];
        for (let i = 0; i < channelIds.length; i += 50) {
            chunks.push(channelIds.slice(i, i + 50));
        }

        const channelInfoMap = {};

        for (const chunk of chunks) {
            try {
                const params = {
                    part: 'snippet,statistics',
                    id: chunk.join(',')
                };

                const response = await this.queueRequest('channels', params);
                
                if (response.items) {
                    response.items.forEach(channel => {
                        const snippet = channel.snippet || {};
                        const statistics = channel.statistics || {};

                        channelInfoMap[channel.id] = {
                            id: channel.id,
                            title: decodeHtml(snippet.title || ''),
                            description: decodeHtml(snippet.description || ''),
                            thumbnails: snippet.thumbnails || {},
                            subscriberCount: parseInt(statistics.subscriberCount) || 0,
                            videoCount: parseInt(statistics.videoCount) || 0,
                            viewCount: parseInt(statistics.viewCount) || 0,
                            formattedSubscriberCount: formatNumber(parseInt(statistics.subscriberCount) || 0),
                            formattedVideoCount: formatNumber(parseInt(statistics.videoCount) || 0),
                            formattedViewCount: formatNumber(parseInt(statistics.viewCount) || 0)
                        };
                    });
                }
            } catch (error) {
                debugLog('Error getting channel info for chunk:', error);
                // 특정 청크에서 오류가 발생해도 계속 진행
            }
        }

        return channelInfoMap;
    }

    /**
     * 검색 제안 가져오기
     * @param {string} query - 검색어
     * @returns {Promise} 제안 목록
     */
    async getSearchSuggestions(query) {
        if (!query || query.length < 2) {
            return [];
        }

        try {
            // YouTube의 suggest API는 공식적으로 지원되지 않으므로
            // 로컬 검색 기록을 기반으로 제안을 생성
            const history = getSearchHistory();
            const suggestions = history
                .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 10)
                .map(item => item.query);

            // 중복 제거
            return [...new Set(suggestions)];
        } catch (error) {
            debugLog('Error getting search suggestions:', error);
            return [];
        }
    }

    /**
     * 인기 동영상 가져오기
     * @param {Object} params - 파라미터
     * @returns {Promise} 인기 동영상 목록
     */
    async getTrendingVideos(params = {}) {
        const {
            maxResults = 25,
            regionCode = CONFIG.YOUTUBE_API.REGION_CODE,
            categoryId = ''
        } = params;

        const requestParams = {
            part: 'snippet,statistics,contentDetails',
            chart: 'mostPopular',
            maxResults: maxResults,
            regionCode: regionCode
        };

        if (categoryId) {
            requestParams.videoCategoryId = categoryId;
        }

        try {
            const response = await this.queueRequest('videos', requestParams);
            
            return {
                videos: response.items.map(video => this.formatVideoData(video)),
                totalResults: response.pageInfo?.totalResults || 0
            };
        } catch (error) {
            handleError(error, 'Trending Videos');
            throw error;
        }
    }

    /**
     * API 키 유효성 검사
     * @param {string} apiKey - 검사할 API 키
     * @returns {Promise} 유효성 검사 결과
     */
    async validateApiKey(apiKey) {
        const tempKey = this.apiKey;
        this.apiKey = apiKey;

        try {
            await this.makeRequest('search', {
                part: 'snippet',
                q: 'test',
                maxResults: 1,
                type: 'video'
            });
            return true;
        } catch (error) {
            this.apiKey = tempKey;
            return false;
        }
    }
}

// 전역 YouTube API 인스턴스
const youtubeAPI = new YouTubeAPI();

/**
 * API 키 설정 UI 표시
 */
function showApiKeySetup() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-md w-full p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">YouTube API 키 설정</h3>
            <p class="text-gray-600 mb-4">
                YouTube DeepSearch를 사용하려면 YouTube Data API v3 키가 필요합니다.
            </p>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">API 키</label>
                <input type="text" id="apiKeyInput" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="YouTube API 키를 입력하세요">
            </div>
            <div class="mb-4">
                <p class="text-sm text-gray-500">
                    API 키는 <a href="https://console.developers.google.com" target="_blank" class="text-blue-600 underline">Google Cloud Console</a>에서 발급받을 수 있습니다.
                </p>
            </div>
            <div class="flex justify-end space-x-3">
                <button id="cancelApiKey" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                    나중에
                </button>
                <button id="saveApiKey" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    저장
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 이벤트 리스너
    document.getElementById('cancelApiKey').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('saveApiKey').addEventListener('click', async () => {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        
        if (!apiKey) {
            showNotification('API 키를 입력해주세요.', 'warning');
            return;
        }

        // API 키 유효성 검사
        const isValid = await youtubeAPI.validateApiKey(apiKey);
        
        if (isValid) {
            saveApiKey(apiKey);
            showNotification('API 키가 저장되었습니다.', 'success');
            modal.remove();
            
            // 페이지 새로고침하여 설정 적용
            window.location.reload();
        } else {
            showNotification('유효하지 않은 API 키입니다.', 'error');
        }
    });
}