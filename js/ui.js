/**
 * YouTube DeepSearch UI Functions
 * 사용자 인터페이스 관련 함수들
 */

class UIManager {
    constructor() {
        this.currentViewMode = 'grid';
        this.currentPage = 1;
        this.currentSearchParams = null;
        this.searchResults = [];
        this.isLoading = false;
        
        this.initializeEventListeners();
        this.loadSettings();
    }

    /**
     * 이벤트 리스너 초기화
     */
    initializeEventListeners() {
        // 검색 폼
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', this.handleSearch.bind(this));
        }

        // 고급 필터 토글
        const toggleFilters = document.getElementById('toggleFilters');
        if (toggleFilters) {
            toggleFilters.addEventListener('click', this.toggleAdvancedFilters.bind(this));
        }

        // 보기 모드 버튼
        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => this.setViewMode('grid'));
        }
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => this.setViewMode('list'));
        }

        // 즐겨찾기 버튼
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', this.showFavorites.bind(this));
        }

        // 검색 기록 버튼
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', this.showSearchHistory.bind(this));
        }

        // 내보내기 버튼
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.exportResults.bind(this));
        }

        // 모달 닫기 버튼들
        this.setupModalCloseButtons();

        // 페이지네이션 버튼
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.loadPage(this.currentPage - 1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.loadPage(this.currentPage + 1));
        }

        // 검색어 입력 시 자동완성
        const searchInput = document.getElementById('searchQuery');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(this.handleSearchInput.bind(this), 300));
            searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
        }

        // 키보드 단축키
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    /**
     * 모달 닫기 버튼 설정
     */
    setupModalCloseButtons() {
        const closeButtons = [
            'closeModalBtn',
            'closeFavoritesBtn', 
            'closeHistoryBtn'
        ];

        closeButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', this.closeAllModals.bind(this));
            }
        });

        // 모달 배경 클릭으로 닫기
        const modals = [
            'videoModal',
            'favoritesModal',
            'historyModal'
        ];

        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeAllModals();
                    }
                });
            }
        });
    }

    /**
     * 설정 불러오기 및 UI 적용
     */
    loadSettings() {
        const settings = loadSettings();
        
        // 결과 개수 설정
        const maxResultsSelect = document.getElementById('maxResults');
        if (maxResultsSelect) {
            maxResultsSelect.value = settings.maxResults;
        }

        // 정렬 순서 설정
        const orderSelect = document.getElementById('order');
        if (orderSelect) {
            orderSelect.value = settings.order;
        }

        // 새 필터 설정값 적용
        const viewCountRange = document.getElementById('viewCountRange');
        if (viewCountRange) {
            viewCountRange.value = settings.viewCountRange || '';
        }

        const subscriberRange = document.getElementById('subscriberRange');
        if (subscriberRange) {
            subscriberRange.value = settings.subscriberRange || '';
        }

        // 보기 모드 설정
        this.setViewMode(settings.viewMode);
    }

    /**
     * 검색 처리
     * @param {Event} event - 폼 제출 이벤트
     */
    async handleSearch(event) {
        event.preventDefault();
        
        if (this.isLoading) return;

        const query = document.getElementById('searchQuery').value.trim();
        if (!query) {
            showNotification('검색어를 입력해주세요.', 'warning');
            return;
        }

        // API 키 확인
        if (!CONFIG.YOUTUBE_API.KEY || CONFIG.YOUTUBE_API.KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
            showApiKeySetup();
            return;
        }

        const searchParams = this.getSearchParams();
        
        // 검색 기록 저장
        saveSearchHistory(query, searchParams);
        
        // 검색 실행
        await this.performSearch(searchParams);
    }

    /**
     * 현재 검색 파라미터 수집
     * @returns {Object} 검색 파라미터
     */
    getSearchParams() {
        return {
            query: document.getElementById('searchQuery').value.trim(),
            maxResults: parseInt(document.getElementById('maxResults').value),
            order: document.getElementById('order').value,
            duration: document.getElementById('duration').value,
            publishedAfter: this.getPublishedAfterDate(),
            viewCountRange: document.getElementById('viewCountRange').value,
            subscriberRange: document.getElementById('subscriberRange').value,
            pageToken: ''
        };
    }

    /**
     * 날짜 필터 값 계산
     * @returns {string} ISO 날짜 문자열
     */
    getPublishedAfterDate() {
        const filterValue = document.getElementById('publishedAfter').value;
        return CONFIG.DATE_FILTERS[filterValue]?.value || '';
    }

    /**
     * 검색 실행
     * @param {Object} searchParams - 검색 파라미터
     */
    async performSearch(searchParams) {
        this.showLoading(true);
        this.currentSearchParams = searchParams;
        this.currentPage = 1;

        try {
            const result = await youtubeAPI.searchVideos(searchParams);
            
            // 클라이언트 측 필터링 적용
            let filteredVideos = result.videos;
            
            // 조회수 범위 필터 적용
            if (searchParams.viewCountRange) {
                filteredVideos = filterByViewCount(filteredVideos, searchParams.viewCountRange);
            }
            
            // 구독자수 범위 필터 적용  
            if (searchParams.subscriberRange) {
                filteredVideos = filterBySubscriberCount(filteredVideos, searchParams.subscriberRange);
            }
            
            this.searchResults = filteredVideos;
            
            // 필터링된 결과로 응답 객체 업데이트
            const filteredResult = {
                ...result,
                videos: filteredVideos,
                totalResults: filteredVideos.length
            };
            
            this.displayResults(filteredResult);
            this.updateResultsHeader(filteredVideos.length, searchParams.query, searchParams);
            
            // 검색 기록 업데이트 (필터링된 결과 개수 포함)
            this.updateSearchHistoryWithResults(searchParams.query, filteredVideos.length);
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showNoResults();
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 페이지 로드
     * @param {number} page - 페이지 번호
     */
    async loadPage(page) {
        if (!this.currentSearchParams || this.isLoading || page < 1) return;

        // 페이지 토큰 계산 (간소화된 버전)
        const pageToken = page > 1 ? `page_${page}` : '';
        
        const searchParams = {
            ...this.currentSearchParams,
            pageToken: pageToken
        };

        this.showLoading(true);
        
        try {
            const result = await youtubeAPI.searchVideos(searchParams);
            this.searchResults = result.videos;
            this.currentPage = page;
            
            this.displayResults(result);
            this.updatePagination(result);
            
            // 페이지 상단으로 스크롤
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Page load failed:', error);
            showNotification('페이지를 불러오는데 실패했습니다.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 검색 결과 표시
     * @param {Object} result - 검색 결과
     */
    displayResults(result) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (!result.videos || result.videos.length === 0) {
            this.showNoResults();
            return;
        }

        resultsSection.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        
        // 보기 모드에 따른 컨테이너 클래스 설정
        this.applyViewMode();
        
        result.videos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            resultsContainer.appendChild(videoCard);
        });

        // 페이지네이션 업데이트
        this.updatePagination(result);

        // 애니메이션 효과
        resultsContainer.classList.add('fade-in');
    }

    /**
     * 비디오 카드 생성
     * @param {Object} video - 비디오 데이터
     * @returns {HTMLElement} 비디오 카드 요소
     */
    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                <span class="video-duration">${video.formattedDuration}</span>
            </div>
            <div class="video-info">
                <h3 class="video-title">${truncateText(video.title, 100)}</h3>
                <div class="video-channel-info">
                    <p class="video-channel">${video.channelTitle}</p>
                    ${video.formattedSubscriberCount ? 
                        `<p class="text-xs text-gray-500">구독자 ${video.formattedSubscriberCount}명</p>` : ''
                    }
                </div>
                <div class="video-stats">
                    <span class="flex items-center">
                        <i class="fas fa-eye mr-1"></i>
                        ${video.formattedViewCount}회
                    </span>
                    <span class="flex items-center">
                        <i class="fas fa-thumbs-up mr-1"></i>
                        ${video.formattedLikeCount}
                    </span>
                    <span class="flex items-center">
                        <i class="fas fa-clock mr-1"></i>
                        ${video.formattedPublishedAt}
                    </span>
                </div>
                <div class="video-actions">
                    <button class="action-btn" onclick="uiManager.watchVideo('${video.id}')">
                        <i class="fas fa-play"></i>
                        재생
                    </button>
                    <button class="action-btn" onclick="uiManager.showVideoDetails('${video.id}')">
                        <i class="fas fa-info-circle"></i>
                        상세정보
                    </button>
                    <button class="action-btn ${isFavorited(video.id) ? 'favorited' : ''}" 
                            onclick="uiManager.toggleFavorite('${video.id}')">
                        <i class="fas fa-heart"></i>
                        ${isFavorited(video.id) ? '즐겨찾기됨' : '즐겨찾기'}
                    </button>
                </div>
            </div>
        `;

        // 썸네일 클릭 시 동영상 재생
        const thumbnail = card.querySelector('.video-thumbnail');
        thumbnail.addEventListener('click', () => this.watchVideo(video.id));
        
        // 제목 클릭 시 상세 정보
        const title = card.querySelector('.video-title');
        title.addEventListener('click', () => this.showVideoDetails(video.id));

        return card;
    }

    /**
     * 보기 모드 설정
     * @param {string} mode - 'grid' 또는 'list'
     */
    setViewMode(mode) {
        this.currentViewMode = mode;
        
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (gridBtn && listBtn && resultsContainer) {
            // 버튼 상태 업데이트
            gridBtn.classList.toggle('text-blue-600', mode === 'grid');
            listBtn.classList.toggle('text-blue-600', mode === 'list');
            
            this.applyViewMode();
        }

        // 설정 저장
        saveSettings({ viewMode: mode });
    }

    /**
     * 보기 모드 적용
     */
    applyViewMode() {
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;

        resultsContainer.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'list-view');
        
        if (this.currentViewMode === 'list') {
            resultsContainer.classList.add('list-view');
        } else {
            resultsContainer.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
        }
    }

    /**
     * 로딩 상태 표시
     * @param {boolean} show - 표시 여부
     */
    showLoading(show) {
        this.isLoading = show;
        const loadingSpinner = document.getElementById('loadingSpinner');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (loadingSpinner) {
            loadingSpinner.style.display = show ? 'block' : 'none';
        }
        
        if (resultsContainer) {
            resultsContainer.style.display = show ? 'none' : 'grid';
        }

        // 검색 버튼 비활성화
        const submitBtn = document.querySelector('#searchForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = show;
            if (show) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>검색 중...';
            } else {
                submitBtn.innerHTML = '<i class="fas fa-search mr-2"></i>검색';
            }
        }
    }

    /**
     * 결과 없음 표시
     */
    showNoResults() {
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">검색 결과가 없습니다</h3>
                    <p class="text-gray-500">다른 검색어로 시도해보세요.</p>
                </div>
            `;
        }

        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }

        // 페이지네이션 숨기기
        const pagination = document.getElementById('pagination');
        if (pagination) {
            pagination.classList.add('hidden');
        }
    }

    /**
     * 결과 헤더 업데이트
     * @param {number} totalResults - 전체 결과 개수
     * @param {string} query - 검색어
     * @param {Object} searchParams - 검색 파라미터 (필터 정보 포함)
     */
    updateResultsHeader(totalResults, query, searchParams = {}) {
        const resultsTitle = document.getElementById('resultsTitle');
        if (resultsTitle) {
            let headerText = `"${query}" 검색 결과 (${formatNumber(totalResults)}개)`;
            
            // 활성 필터 정보 표시
            const activeFilters = [];
            
            if (searchParams.duration) {
                const durationLabel = CONFIG.DURATION_FILTERS[searchParams.duration]?.label;
                if (durationLabel) activeFilters.push(`길이: ${durationLabel}`);
            }
            
            if (searchParams.viewCountRange) {
                const viewLabel = getRangeFilterLabel('viewCount', searchParams.viewCountRange);
                if (viewLabel) activeFilters.push(`조회수: ${viewLabel}`);
            }
            
            if (searchParams.subscriberRange) {
                const subLabel = getRangeFilterLabel('subscriber', searchParams.subscriberRange);
                if (subLabel) activeFilters.push(`구독자: ${subLabel}`);
            }
            
            if (searchParams.publishedAfter) {
                const dateLabel = CONFIG.DATE_FILTERS[searchParams.publishedAfter]?.label;
                if (dateLabel) activeFilters.push(`날짜: ${dateLabel}`);
            }
            
            if (activeFilters.length > 0) {
                headerText += ` • ${activeFilters.join(', ')}`;
            }
            
            resultsTitle.textContent = headerText;
        }
    }

    /**
     * 페이지네이션 업데이트
     * @param {Object} result - 검색 결과
     */
    updatePagination(result) {
        const pagination = document.getElementById('pagination');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageNumbers = document.getElementById('pageNumbers');
        
        if (!pagination) return;

        // 페이지네이션 표시
        pagination.classList.remove('hidden');
        
        // 이전/다음 버튼 상태
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = !result.nextPageToken;
        }

        // 페이지 번호 생성 (간소화된 버전)
        if (pageNumbers) {
            pageNumbers.innerHTML = '';
            
            const totalPages = Math.ceil(result.totalResults / (this.currentSearchParams?.maxResults || 25));
            const maxVisiblePages = 5;
            const startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `px-3 py-2 text-sm rounded ${i === this.currentPage 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => this.loadPage(i));
                pageNumbers.appendChild(pageBtn);
            }
        }
    }

    /**
     * 고급 필터 토글
     */
    toggleAdvancedFilters() {
        const filtersDiv = document.getElementById('advancedFilters');
        const toggleBtn = document.getElementById('toggleFilters');
        
        if (filtersDiv && toggleBtn) {
            const isHidden = filtersDiv.classList.contains('hidden');
            
            if (isHidden) {
                filtersDiv.classList.remove('hidden');
                filtersDiv.classList.add('slide-down');
                toggleBtn.querySelector('i:last-child').style.transform = 'rotate(180deg)';
            } else {
                filtersDiv.classList.add('hidden');
                toggleBtn.querySelector('i:last-child').style.transform = 'rotate(0deg)';
            }
        }
    }

    /**
     * 동영상 재생
     * @param {string} videoId - 동영상 ID
     */
    watchVideo(videoId) {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }

    /**
     * 동영상 상세 정보 표시
     * @param {string} videoId - 동영상 ID
     */
    showVideoDetails(videoId) {
        const video = this.searchResults.find(v => v.id === videoId);
        if (!video) return;

        const modal = document.getElementById('videoModal');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalContent) {
            modalContent.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <img src="${video.thumbnail}" alt="${video.title}" class="w-full rounded-lg">
                    </div>
                    <div>
                        <h3 class="text-xl font-bold mb-3">${video.title}</h3>
                        <div class="mb-4">
                            <p class="text-gray-600">채널: ${video.channelTitle}</p>
                            ${video.formattedSubscriberCount ? 
                                `<p class="text-sm text-gray-500">구독자 ${video.formattedSubscriberCount}명</p>` : ''
                            }
                        </div>
                        
                        <div class="grid grid-cols-2 ${video.formattedSubscriberCount ? 'lg:grid-cols-3' : ''} gap-4 mb-4">
                            <div class="text-center p-3 bg-gray-50 rounded">
                                <div class="text-2xl font-bold text-blue-600">${video.formattedViewCount}</div>
                                <div class="text-sm text-gray-500">조회수</div>
                            </div>
                            <div class="text-center p-3 bg-gray-50 rounded">
                                <div class="text-2xl font-bold text-red-600">${video.formattedLikeCount}</div>
                                <div class="text-sm text-gray-500">좋아요</div>
                            </div>
                            ${video.formattedSubscriberCount ? `
                                <div class="text-center p-3 bg-gray-50 rounded">
                                    <div class="text-2xl font-bold text-green-600">${video.formattedSubscriberCount}</div>
                                    <div class="text-sm text-gray-500">구독자</div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="mb-4">
                            <strong>게시일:</strong> ${video.formattedPublishedAt}<br>
                            <strong>길이:</strong> ${video.formattedDuration}
                        </div>
                        
                        ${video.description ? `
                            <div class="mb-4">
                                <strong>설명:</strong>
                                <p class="text-sm text-gray-600 mt-2">${truncateText(video.description, 300)}</p>
                            </div>
                        ` : ''}
                        
                        <div class="flex space-x-3">
                            <button onclick="uiManager.watchVideo('${video.id}')" 
                                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                <i class="fab fa-youtube mr-2"></i>YouTube에서 보기
                            </button>
                            <button onclick="uiManager.toggleFavorite('${video.id}')" 
                                    class="px-4 py-2 ${isFavorited(video.id) ? 'bg-pink-600' : 'bg-gray-600'} text-white rounded-lg hover:opacity-90">
                                <i class="fas fa-heart mr-2"></i>
                                ${isFavorited(video.id) ? '즐겨찾기 제거' : '즐겨찾기 추가'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.classList.remove('hidden');
        }
    }

    /**
     * 즐겨찾기 토글
     * @param {string} videoId - 동영상 ID
     */
    toggleFavorite(videoId) {
        const video = this.searchResults.find(v => v.id === videoId);
        if (!video) return;

        const isCurrentlyFavorited = isFavorited(videoId);
        
        if (isCurrentlyFavorited) {
            removeFromFavorites(videoId);
            showNotification(CONFIG.SUCCESS_MESSAGES.FAVORITE_REMOVED, 'success');
        } else {
            addToFavorites(video);
            showNotification(CONFIG.SUCCESS_MESSAGES.FAVORITE_ADDED, 'success');
        }

        // UI 업데이트
        this.updateFavoriteButtons(videoId);
    }

    /**
     * 즐겨찾기 버튼 상태 업데이트
     * @param {string} videoId - 동영상 ID
     */
    updateFavoriteButtons(videoId) {
        const buttons = document.querySelectorAll(`button[onclick*="${videoId}"]`);
        buttons.forEach(btn => {
            const isHeartButton = btn.innerHTML.includes('fa-heart');
            if (isHeartButton) {
                const favorited = isFavorited(videoId);
                btn.classList.toggle('favorited', favorited);
                
                const text = btn.querySelector('span') || btn.childNodes[btn.childNodes.length - 1];
                if (text) {
                    text.textContent = favorited ? '즐겨찾기됨' : '즐겨찾기';
                }
            }
        });
    }

    /**
     * 즐겨찾기 모달 표시
     */
    showFavorites() {
        const favorites = getFavorites();
        const modal = document.getElementById('favoritesModal');
        const content = document.getElementById('favoritesContent');
        
        if (!modal || !content) return;

        if (favorites.length === 0) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-heart text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">즐겨찾기가 비어있습니다</h3>
                    <p class="text-gray-500">마음에 드는 동영상을 즐겨찾기에 추가해보세요.</p>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${favorites.map(video => `
                        <div class="video-card">
                            <div class="video-thumbnail">
                                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                                <span class="video-duration">${video.formattedDuration}</span>
                            </div>
                            <div class="video-info">
                                <h3 class="video-title">${truncateText(video.title, 60)}</h3>
                                <p class="video-channel">${video.channelTitle}</p>
                                <div class="video-stats">
                                    <span><i class="fas fa-eye mr-1"></i>${video.formattedViewCount}회</span>
                                    <span><i class="fas fa-clock mr-1"></i>${formatRelativeTime(video.addedAt)}</span>
                                </div>
                                <div class="video-actions">
                                    <button class="action-btn" onclick="uiManager.watchVideo('${video.id}')">
                                        <i class="fas fa-play"></i> 재생
                                    </button>
                                    <button class="action-btn favorited" onclick="uiManager.toggleFavorite('${video.id}')">
                                        <i class="fas fa-heart"></i> 제거
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        modal.classList.remove('hidden');
    }

    /**
     * 검색 기록 모달 표시
     */
    showSearchHistory() {
        const history = getSearchHistory();
        const modal = document.getElementById('historyModal');
        const content = document.getElementById('historyContent');
        
        if (!modal || !content) return;

        if (history.length === 0) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-history text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">검색 기록이 없습니다</h3>
                    <p class="text-gray-500">검색을 시작해보세요.</p>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="space-y-3">
                    ${history.map(item => `
                        <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                             onclick="uiManager.searchFromHistory('${item.query}', ${JSON.stringify(item.filters).replace(/"/g, '&quot;')})">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-medium">${item.query}</h4>
                                    <p class="text-sm text-gray-500">${formatRelativeTime(item.timestamp)}</p>
                                </div>
                                <div class="text-sm text-gray-400">
                                    ${item.resultsCount ? `${formatNumber(item.resultsCount)}개 결과` : ''}
                                </div>
                            </div>
                            ${Object.keys(item.filters).length > 1 ? `
                                <div class="mt-2 flex flex-wrap gap-1">
                                    ${Object.entries(item.filters).filter(([key, value]) => key !== 'query' && value).map(([key, value]) => `
                                        <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">${key}: ${value}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        modal.classList.remove('hidden');
    }

    /**
     * 검색 기록에서 검색
     * @param {string} query - 검색어
     * @param {Object} filters - 필터 설정
     */
    searchFromHistory(query, filters) {
        // 검색 폼에 값 설정
        document.getElementById('searchQuery').value = query;
        
        Object.entries(filters).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element && value) {
                element.value = value;
            }
        });

        // 모달 닫기
        this.closeAllModals();

        // 검색 실행
        const searchParams = { query, ...filters };
        this.performSearch(searchParams);
    }

    /**
     * 결과 내보내기
     */
    exportResults() {
        if (!this.searchResults || this.searchResults.length === 0) {
            showNotification('내보낼 검색 결과가 없습니다.', 'warning');
            return;
        }

        const exportData = this.searchResults.map(video => ({
            제목: video.title,
            채널: video.channelTitle,
            URL: video.url,
            조회수: video.viewCount,
            좋아요: video.likeCount,
            게시일: video.publishedAt,
            길이: video.formattedDuration,
            설명: video.description.substring(0, 200)
        }));

        const filename = `youtube_search_${new Date().toISOString().split('T')[0]}`;
        exportData(exportData, filename, 'csv');
        
        showNotification(CONFIG.SUCCESS_MESSAGES.EXPORT_SUCCESS, 'success');
    }

    /**
     * 모든 모달 닫기
     */
    closeAllModals() {
        const modals = ['videoModal', 'favoritesModal', 'historyModal'];
        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    }

    /**
     * 검색어 입력 처리
     * @param {Event} event - 입력 이벤트
     */
    async handleSearchInput(event) {
        const query = event.target.value.trim();
        if (query.length >= 2) {
            const suggestions = await youtubeAPI.getSearchSuggestions(query);
            this.showSearchSuggestions(suggestions, event.target);
        } else {
            this.hideSearchSuggestions();
        }
    }

    /**
     * 검색 제안 표시
     * @param {Array} suggestions - 제안 목록
     * @param {HTMLElement} inputElement - 입력 요소
     */
    showSearchSuggestions(suggestions, inputElement) {
        this.hideSearchSuggestions();
        
        if (!suggestions || suggestions.length === 0) return;

        const container = inputElement.parentElement;
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'search-suggestions';
        suggestionsDiv.id = 'searchSuggestions';
        
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.addEventListener('click', () => {
                inputElement.value = suggestion;
                this.hideSearchSuggestions();
                inputElement.focus();
            });
            suggestionsDiv.appendChild(item);
        });
        
        container.appendChild(suggestionsDiv);
    }

    /**
     * 검색 제안 숨기기
     */
    hideSearchSuggestions() {
        const existing = document.getElementById('searchSuggestions');
        if (existing) {
            existing.remove();
        }
    }

    /**
     * 검색 키 다운 처리
     * @param {Event} event - 키보드 이벤트
     */
    handleSearchKeydown(event) {
        if (event.key === 'Escape') {
            this.hideSearchSuggestions();
        }
    }

    /**
     * 키보드 단축키 처리
     * @param {Event} event - 키보드 이벤트
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K: 검색 포커스
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.getElementById('searchQuery');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // ESC: 모달 닫기
        if (event.key === 'Escape') {
            this.closeAllModals();
            this.hideSearchSuggestions();
        }
    }

    /**
     * 검색 기록에 결과 개수 업데이트
     * @param {string} query - 검색어
     * @param {number} resultsCount - 결과 개수
     */
    updateSearchHistoryWithResults(query, resultsCount) {
        const history = getSearchHistory();
        const updated = history.map(item => {
            if (item.query === query) {
                return { ...item, resultsCount };
            }
            return item;
        });
        
        saveToStorage(CONFIG.APP.STORAGE_KEYS.SEARCH_HISTORY, updated);
    }
}

// 전역 UI 관리자 인스턴스
let uiManager;

// DOM 로드 완료 시 UI 관리자 초기화
document.addEventListener('DOMContentLoaded', function() {
    uiManager = new UIManager();
    debugLog('UI Manager initialized');
});