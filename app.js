/* ========================================
   위드물맷돌수학학원 - JavaScript
   ======================================== */

// ========================================
// 초기 데이터 설정
// ========================================
const DEFAULT_ADMIN = {
    email: 'admin@math.academy',
    password: 'admin123',
    name: '관리자',
    role: 'admin',
    status: 'approved'
};

// LocalStorage 키
const STORAGE_KEYS = {
    USERS: 'math_academy_users',
    PENDING_USERS: 'math_academy_pending',
    MATERIALS: 'math_academy_materials',
    CURRENT_USER: 'math_academy_current_user'
};

// 초기화
function initializeApp() {
    // 관리자 계정 확인 및 생성
    let users = getFromStorage(STORAGE_KEYS.USERS) || [];
    const adminExists = users.some(u => u.email === DEFAULT_ADMIN.email);

    if (!adminExists) {
        users.push(DEFAULT_ADMIN);
        saveToStorage(STORAGE_KEYS.USERS, users);
    }

    // 샘플 자료 생성 (처음 한 번만)
    let materials = getFromStorage(STORAGE_KEYS.MATERIALS);
    if (!materials) {
        materials = getSampleMaterials();
        saveToStorage(STORAGE_KEYS.MATERIALS, materials);
    }
}

// 샘플 자료 데이터
function getSampleMaterials() {
    return [
        {
            id: Date.now() + 1,
            title: '중1 일차방정식 개념정리',
            grade: '중1',
            category: '개념정리',
            unit: '일차방정식',
            fileName: '중1_일차방정식_개념.pdf',
            fileSize: '2.4 MB',
            fileType: 'pdf',
            uploadDate: '2024-12-10',
            downloads: 45
        },
        {
            id: Date.now() + 2,
            title: '중2 연립방정식 문제풀이',
            grade: '중2',
            category: '문제풀이',
            unit: '연립방정식',
            fileName: '중2_연립방정식_문제.pdf',
            fileSize: '3.1 MB',
            fileType: 'pdf',
            uploadDate: '2024-12-08',
            downloads: 32
        },
        {
            id: Date.now() + 3,
            title: '고1 수학 중간고사 기출문제',
            grade: '고1',
            category: '기출문제',
            unit: '',
            fileName: '고1_중간고사_기출.pdf',
            fileSize: '5.2 MB',
            fileType: 'pdf',
            uploadDate: '2024-12-05',
            downloads: 78
        },
        {
            id: Date.now() + 4,
            title: '초6 분수와 소수 연산',
            grade: '초6',
            category: '개념정리',
            unit: '분수와 소수',
            fileName: '초6_분수소수_개념.pdf',
            fileSize: '1.8 MB',
            fileType: 'pdf',
            uploadDate: '2024-12-12',
            downloads: 23
        }
    ];
}

// 앱 초기화 실행
initializeApp();

// ========================================
// Storage 유틸리티
// ========================================
function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Storage read error:', e);
        return null;
    }
}

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Storage write error:', e);
    }
}

// ========================================
// 토스트 알림
// ========================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// 모달 관리
// ========================================
function showLoginModal() {
    closeModal('registerModal');
    document.getElementById('loginModal').classList.add('active');
}

function showRegisterModal() {
    closeModal('loginModal');
    document.getElementById('registerModal').classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal('loginModal');
        closeModal('registerModal');
    }
});

// ========================================
// 모바일 메뉴
// ========================================
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// ========================================
// 회원가입
// ========================================
function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const grade = document.getElementById('regGrade').value;
    const phone = document.getElementById('regPhone').value.trim();

    // 유효성 검사
    if (!name || !email || !password || !grade || !phone) {
        showToast('모든 필드를 입력해주세요.', 'error');
        return;
    }

    // 이메일 중복 확인
    const users = getFromStorage(STORAGE_KEYS.USERS) || [];
    const pendingUsers = getFromStorage(STORAGE_KEYS.PENDING_USERS) || [];

    if (users.some(u => u.email === email) || pendingUsers.some(u => u.email === email)) {
        showToast('이미 등록된 이메일입니다.', 'error');
        return;
    }

    // 대기 목록에 추가
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        grade,
        phone,
        role: 'student',
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    pendingUsers.push(newUser);
    saveToStorage(STORAGE_KEYS.PENDING_USERS, pendingUsers);

    // 폼 초기화 및 모달 닫기
    document.getElementById('registerForm').reset();
    closeModal('registerModal');

    showToast('가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.', 'success');
}

// ========================================
// 로그인
// ========================================
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // 승인된 사용자 확인
    const users = getFromStorage(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        // 대기 중인 사용자 확인
        const pendingUsers = getFromStorage(STORAGE_KEYS.PENDING_USERS) || [];
        const pendingUser = pendingUsers.find(u => u.email === email);

        if (pendingUser) {
            showToast('아직 관리자 승인 대기 중입니다.', 'warning');
        } else {
            showToast('이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
        }
        return;
    }

    // 로그인 성공
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    closeModal('loginModal');

    showToast(`${user.name}님, 환영합니다!`, 'success');

    // 페이지 이동
    setTimeout(() => {
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }, 1000);
}

// ========================================
// 로그아웃
// ========================================
function handleLogout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    showToast('로그아웃 되었습니다.', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ========================================
// 인증 확인 (자료실)
// ========================================
function checkAuthForDashboard() {
    const user = getFromStorage(STORAGE_KEYS.CURRENT_USER);

    if (!user) {
        showToast('로그인이 필요합니다.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    // 사용자 정보 표시
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    const dashUserName = document.getElementById('dashUserName');
    const dashUserGrade = document.getElementById('dashUserGrade');
    const adminLink = document.getElementById('adminLink');

    if (userNameDisplay) userNameDisplay.textContent = user.name + '님';
    if (userAvatar) userAvatar.textContent = user.name.charAt(0);
    if (dashUserName) dashUserName.textContent = user.name;
    if (dashUserGrade) dashUserGrade.textContent = user.grade || '관리자';

    // 관리자 링크 표시
    if (adminLink && user.role === 'admin') {
        adminLink.style.display = 'inline-flex';
    }

    // 자료 목록 로드
    loadMaterials();
}

// ========================================
// 관리자 인증 확인
// ========================================
function checkAdminAuth() {
    const user = getFromStorage(STORAGE_KEYS.CURRENT_USER);

    if (!user || user.role !== 'admin') {
        showToast('관리자 권한이 필요합니다.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    // 관리자 이름 표시
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    if (adminNameDisplay) {
        adminNameDisplay.textContent = user.name + '님';
    }

    // 대기 목록 로드
    loadPendingUsers();
    loadAllUsers();
    loadAdminMaterials();
}

// ========================================
// 자료 목록 로드 (학생용)
// ========================================
function loadMaterials() {
    const materials = getFromStorage(STORAGE_KEYS.MATERIALS) || [];
    const grid = document.getElementById('materialsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    if (materials.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = materials.map(m => `
        <div class="material-card" data-grade="${m.grade}" data-category="${m.category}">
            <div class="material-icon">${getFileIcon(m.fileType)}</div>
            <h4>${escapeHtml(m.title)}</h4>
            <div class="material-meta">
                <span>📅 ${m.uploadDate}</span>
                <span>📥 ${m.downloads}회</span>
            </div>
            <div style="margin-bottom: 12px;">
                <span class="material-tag">${m.grade}</span>
                <span class="material-tag">${m.category}</span>
            </div>
            <div class="material-actions">
                <button class="btn-download" onclick="downloadMaterial(${m.id})">
                    📥 다운로드
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// 자료 필터링
// ========================================
function filterMaterials() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const gradeFilter = document.getElementById('gradeFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    const cards = document.querySelectorAll('.material-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const grade = card.dataset.grade || '';
        const category = card.dataset.category || '';

        const matchesSearch = title.includes(searchTerm);
        const matchesGrade = !gradeFilter || grade === gradeFilter;
        const matchesCategory = !categoryFilter || category === categoryFilter;

        if (matchesSearch && matchesGrade && matchesCategory) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // 검색 결과가 없을 때
    const emptyState = document.getElementById('emptyState');
    const grid = document.getElementById('materialsGrid');

    if (visibleCount === 0 && cards.length > 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h3').textContent = '검색 결과가 없습니다';
        }
    } else if (cards.length > 0) {
        if (emptyState) emptyState.style.display = 'none';
    }
}

// ========================================
// 자료 다운로드
// ========================================
function downloadMaterial(id) {
    const materials = getFromStorage(STORAGE_KEYS.MATERIALS) || [];
    const material = materials.find(m => m.id === id);

    if (!material) {
        showToast('자료를 찾을 수 없습니다.', 'error');
        return;
    }

    // 다운로드 횟수 증가
    material.downloads = (material.downloads || 0) + 1;
    saveToStorage(STORAGE_KEYS.MATERIALS, materials);

    // 다운로드 시뮬레이션 (실제로는 파일 URL이 필요)
    showToast(`"${material.title}" 다운로드를 시작합니다.`, 'success');

    // 실제 파일이 있다면 아래와 같이 다운로드
    // const link = document.createElement('a');
    // link.href = material.fileUrl;
    // link.download = material.fileName;
    // link.click();

    // 카드 다운로드 수 업데이트
    loadMaterials();
}

// ========================================
// 관리자: 탭 전환
// ========================================
function switchTab(tabName) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // 클릭한 탭 활성화
    event.target.classList.add('active');

    // 모든 섹션 숨기기
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('pendingSection').style.display = 'none';
    document.getElementById('usersSection').style.display = 'none';
    document.getElementById('materialsSection').style.display = 'none';

    // 선택한 섹션 표시
    switch (tabName) {
        case 'upload':
            document.getElementById('uploadSection').style.display = 'block';
            break;
        case 'pending':
            document.getElementById('pendingSection').style.display = 'block';
            loadPendingUsers();
            break;
        case 'users':
            document.getElementById('usersSection').style.display = 'block';
            loadAllUsers();
            break;
        case 'materials':
            document.getElementById('materialsSection').style.display = 'block';
            loadAdminMaterials();
            break;
    }
}

// ========================================
// 관리자: 가입 대기자 목록
// ========================================
function loadPendingUsers() {
    const pendingUsers = getFromStorage(STORAGE_KEYS.PENDING_USERS) || [];
    const list = document.getElementById('pendingList');
    const countSpan = document.getElementById('pendingCount');
    const emptyState = document.getElementById('noPendingState');

    if (!list) return;

    if (countSpan) countSpan.textContent = pendingUsers.length;

    if (pendingUsers.length === 0) {
        list.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    list.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';

    list.innerHTML = pendingUsers.map(user => `
        <div class="pending-item" data-id="${user.id}">
            <div class="pending-info">
                <div class="pending-avatar">${user.name.charAt(0)}</div>
                <div class="pending-details">
                    <h4>${escapeHtml(user.name)}</h4>
                    <span>${escapeHtml(user.email)} · ${user.grade} · ${escapeHtml(user.phone)}</span>
                </div>
            </div>
            <div class="pending-actions">
                <button class="btn-approve" onclick="approveUser(${user.id})">✓ 승인</button>
                <button class="btn-reject" onclick="rejectUser(${user.id})">✕ 거부</button>
            </div>
        </div>
    `).join('');
}

// ========================================
// 관리자: 가입 승인
// ========================================
function approveUser(id) {
    let pendingUsers = getFromStorage(STORAGE_KEYS.PENDING_USERS) || [];
    let users = getFromStorage(STORAGE_KEYS.USERS) || [];

    const userIndex = pendingUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
        showToast('사용자를 찾을 수 없습니다.', 'error');
        return;
    }

    // 대기 목록에서 제거하고 승인 목록에 추가
    const user = pendingUsers.splice(userIndex, 1)[0];
    user.status = 'approved';
    users.push(user);

    saveToStorage(STORAGE_KEYS.PENDING_USERS, pendingUsers);
    saveToStorage(STORAGE_KEYS.USERS, users);

    showToast(`${user.name}님의 가입이 승인되었습니다.`, 'success');
    loadPendingUsers();
    loadAllUsers();
}

// ========================================
// 관리자: 가입 거부
// ========================================
function rejectUser(id) {
    let pendingUsers = getFromStorage(STORAGE_KEYS.PENDING_USERS) || [];

    const userIndex = pendingUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
        showToast('사용자를 찾을 수 없습니다.', 'error');
        return;
    }

    const user = pendingUsers.splice(userIndex, 1)[0];
    saveToStorage(STORAGE_KEYS.PENDING_USERS, pendingUsers);

    showToast(`${user.name}님의 가입이 거부되었습니다.`, 'warning');
    loadPendingUsers();
}

// ========================================
// 관리자: 전체 회원 목록
// ========================================
function loadAllUsers() {
    const users = getFromStorage(STORAGE_KEYS.USERS) || [];
    const tbody = document.getElementById('usersTableBody');

    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${user.grade || '-'}</td>
            <td>${escapeHtml(user.phone || '-')}</td>
            <td>
                <span class="status-badge ${user.role === 'admin' ? 'admin' : 'approved'}">
                    ${user.role === 'admin' ? '관리자' : '학생'}
                </span>
            </td>
            <td>
                ${user.role !== 'admin' ? `
                    <button class="btn-delete" onclick="deleteUser(${user.id})" title="삭제">🗑️</button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

// ========================================
// 관리자: 회원 삭제
// ========================================
function deleteUser(id) {
    if (!confirm('정말 이 회원을 삭제하시겠습니까?')) return;

    let users = getFromStorage(STORAGE_KEYS.USERS) || [];
    users = users.filter(u => u.id !== id);
    saveToStorage(STORAGE_KEYS.USERS, users);

    showToast('회원이 삭제되었습니다.', 'success');
    loadAllUsers();
}

// ========================================
// 관리자: 파일 업로드 처리
// ========================================
let selectedFile = null;

// 드래그 앤 드롭
const uploadZone = document.getElementById('uploadZone');
if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    selectedFile = file;

    // 파일 미리보기 표시
    const form = document.getElementById('uploadForm');
    const fileNameEl = document.getElementById('previewFileName');
    const fileSizeEl = document.getElementById('previewFileSize');

    if (form) form.classList.add('active');
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);

    // 파일명에서 제목 추출
    const titleInput = document.getElementById('uploadTitle');
    if (titleInput && !titleInput.value) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        titleInput.value = nameWithoutExt;
    }
}

function clearUpload() {
    selectedFile = null;
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');

    if (form) form.classList.remove('active');
    if (fileInput) fileInput.value = '';

    document.getElementById('uploadTitle').value = '';
    document.getElementById('uploadGrade').value = '';
    document.getElementById('uploadCategory').value = '';
    document.getElementById('uploadUnit').value = '';
}

function uploadMaterial() {
    if (!selectedFile) {
        showToast('파일을 선택해주세요.', 'error');
        return;
    }

    const title = document.getElementById('uploadTitle').value.trim();
    const grade = document.getElementById('uploadGrade').value;
    const category = document.getElementById('uploadCategory').value;
    const unit = document.getElementById('uploadUnit').value.trim();

    if (!title || !grade || !category) {
        showToast('제목, 학년, 유형을 모두 선택해주세요.', 'error');
        return;
    }

    // 파일 확장자 추출
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();

    // 새 자료 생성
    const newMaterial = {
        id: Date.now(),
        title,
        grade,
        category,
        unit,
        fileName: selectedFile.name,
        fileSize: formatFileSize(selectedFile.size),
        fileType: fileExt,
        uploadDate: new Date().toISOString().split('T')[0],
        downloads: 0
    };

    // 저장
    let materials = getFromStorage(STORAGE_KEYS.MATERIALS) || [];
    materials.unshift(newMaterial);
    saveToStorage(STORAGE_KEYS.MATERIALS, materials);

    showToast('자료가 업로드되었습니다!', 'success');
    clearUpload();
    loadAdminMaterials();
}

// ========================================
// 관리자: 업로드된 자료 목록
// ========================================
function loadAdminMaterials() {
    const materials = getFromStorage(STORAGE_KEYS.MATERIALS) || [];
    const grid = document.getElementById('adminMaterialsGrid');
    const emptyState = document.getElementById('noMaterialsState');

    if (!grid) return;

    if (materials.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = materials.map(m => `
        <div class="material-card">
            <div class="material-icon">${getFileIcon(m.fileType)}</div>
            <h4>${escapeHtml(m.title)}</h4>
            <div class="material-meta">
                <span>📅 ${m.uploadDate}</span>
                <span>📥 ${m.downloads}회</span>
            </div>
            <div style="margin-bottom: 12px;">
                <span class="material-tag">${m.grade}</span>
                <span class="material-tag">${m.category}</span>
            </div>
            <div class="material-actions">
                <button class="btn-download" onclick="downloadMaterial(${m.id})">📥 다운로드</button>
                <button class="btn-delete" onclick="deleteMaterial(${m.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ========================================
// 관리자: 자료 삭제
// ========================================
function deleteMaterial(id) {
    if (!confirm('정말 이 자료를 삭제하시겠습니까?')) return;

    let materials = getFromStorage(STORAGE_KEYS.MATERIALS) || [];
    materials = materials.filter(m => m.id !== id);
    saveToStorage(STORAGE_KEYS.MATERIALS, materials);

    showToast('자료가 삭제되었습니다.', 'success');
    loadAdminMaterials();
}

// ========================================
// 유틸리티 함수
// ========================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    const icons = {
        pdf: '📕',
        doc: '📘',
        docx: '📘',
        hwp: '📙',
        xls: '📗',
        xlsx: '📗',
        ppt: '📒',
        pptx: '📒',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️'
    };
    return icons[fileType?.toLowerCase()] || '📄';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// 스크롤 애니메이션
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.about-card, .program-card, .contact-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
