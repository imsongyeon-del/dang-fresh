document.addEventListener('DOMContentLoaded', () => {
    // Initializing Lucide Icons
    lucide.createIcons();

    // --- State Management ---
    const appState = {
        dogName: '',
        avatar: 'poodle',
        customBreed: '',
        ageGroup: 'puppy', // puppy, adult, senior
        healthConcerns: ['general'], // Array for multi-select
        upsellSelected: false, // upsell state
        currentStep: 1
    };

    // --- DOM Elements ---
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3'),
        4: document.getElementById('step-4'),
        5: document.getElementById('step-5'),
        6: document.getElementById('step-6')
    };

    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressIndicator = document.getElementById('progress-indicator');
    const progressSteps = document.querySelectorAll('.progress-step');

    // Inputs
    const dogNameInput = document.getElementById('dog-name');
    const nameError = document.getElementById('name-error');
    const avatarCards = document.querySelectorAll('.avatar-card');
    const customBreedGroup = document.getElementById('custom-breed-group');
    const breedSelect = document.getElementById('breed-select');
    const breedLoadingSpinner = document.getElementById('breed-loading-spinner');
    const directBreedInputWrapper = document.getElementById('direct-breed-input-wrapper');
    const customBreedInput = document.getElementById('custom-breed');
    const customBreedError = document.getElementById('custom-breed-error');
    const upsellCheckbox = document.getElementById('upsell-checkbox');

    // Step 2 & 3 Option Cards
    const ageCards = document.querySelectorAll('#step-2 .option-card');
    const concernCards = document.querySelectorAll('#step-3 .option-card');

    // Navigation Buttons
    const btnToStep2 = document.getElementById('btn-to-step2');
    const btnToStep3 = document.getElementById('btn-to-step3');
    const btnToStep4 = document.getElementById('btn-to-step4');
    const btnSubscribe = document.getElementById('btn-subscribe');
    const btnReset = document.getElementById('btn-reset');
    const prevButtons = document.querySelectorAll('.btn-prev');

    // Dynamic Text Elements
    const dogLoadingName = document.getElementById('dog-loading-name');
    const loadingSubtext = document.getElementById('loading-subtext');
    const loadingProgress = document.getElementById('loading-progress');
    
    const resultCongratsTitle = document.getElementById('result-congrats-title');
    const boxLblName = document.getElementById('box-lbl-name');
    const recItemsContainer = document.getElementById('recommendation-items-container');
    
    const successDogName = document.getElementById('success-dog-name');
    const firstDeliveryDay = document.getElementById('first-delivery-day');
    const deliveryDateText = document.getElementById('delivery-date-text');
    const arrivalDateText = document.getElementById('arrival-date-text');
    const receiptDogInfo = document.getElementById('receipt-dog-info');
    const receiptPrice = document.getElementById('receipt-price');

    // --- Fetch Dog Breeds API ---
    let fetchedBreeds = [];
    async function loadBreedData() {
        if (!breedSelect) return;
        
        if (breedLoadingSpinner) breedLoadingSpinner.style.display = 'flex';
        
        const url = "/api/breeds";
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
            
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    fetchedBreeds = data;
                }
            }
        } catch (error) {
            console.warn("정부 오픈 API 호출에 실패했습니다. (CORS 또는 네트워크 에러). 방어용 리스트를 사용합니다.", error);
        }
        
        // Fallback list
        if (!fetchedBreeds || fetchedBreeds.length === 0) {
            fetchedBreeds = ["말티즈", "포메라니안", "푸들", "치와와", "골든 리트리버", "시바견", "웰시코기", "진돗개", "시츄", "요크셔 테리어", "비숑 프리제", "닥스훈트", "비글", "리트리버"];
        }
        
        // Deduplicate and filter any invalid items
        fetchedBreeds = [...new Set(fetchedBreeds)].map(name => name.trim()).filter(name => name.length > 0);
        
        // Populate Select Box
        breedSelect.innerHTML = '<option value="">-- 견종 선택 --</option>';
        
        fetchedBreeds.forEach(breed => {
            const opt = document.createElement('option');
            opt.value = breed;
            opt.textContent = breed;
            breedSelect.appendChild(opt);
        });
        
        const directOpt = document.createElement('option');
        directOpt.value = 'direct';
        directOpt.textContent = '직접 입력하기';
        breedSelect.appendChild(directOpt);
        
        if (breedLoadingSpinner) breedLoadingSpinner.style.display = 'none';
    }

    // Call API loading on startup
    loadBreedData();

    // --- Step Navigation Functions ---
    function navigateToStep(stepNum) {
        // Hide all steps
        Object.keys(steps).forEach(key => {
            steps[key].classList.remove('active');
        });

        // Show targets
        steps[stepNum].classList.add('active');
        appState.currentStep = stepNum;

        // Update Progress Tracker UI
        updateProgressBar(stepNum);

        // Scroll to top of wizard container for smooth mobile transitions
        window.scrollTo({
            top: document.querySelector('.main-header').offsetTop,
            behavior: 'smooth'
        });
    }

    function updateProgressBar(stepNum) {
        // Hide progress bar on loading (4) and success (6) steps to keep checkout clean
        if (stepNum === 4 || stepNum === 6) {
            progressBarContainer.style.opacity = '0';
            progressBarContainer.style.pointerEvents = 'none';
            return;
        } else {
            progressBarContainer.style.opacity = '1';
            progressBarContainer.style.pointerEvents = 'all';
        }

        // Percentage calculations
        let percent = 0;
        if (stepNum === 1) percent = 0;
        else if (stepNum === 2) percent = 33;
        else if (stepNum === 3) percent = 66;
        else if (stepNum === 5) percent = 100;

        progressIndicator.style.width = `${percent}%`;

        // Step active state
        progressSteps.forEach(stepEl => {
            const stepVal = parseInt(stepEl.getAttribute('data-step'));
            
            // For mapping simplicity, visual step 4 corresponds to data-step 5 (results)
            if (stepVal < stepNum) {
                stepEl.classList.add('completed');
                stepEl.classList.remove('active');
            } else if (stepVal === stepNum || (stepNum === 5 && stepVal === 5)) {
                stepEl.classList.remove('completed');
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('completed');
                stepEl.classList.remove('active');
            }
        });
    }

    // --- Form Event Listeners ---

    // Validate and Advance from Step 1
    btnToStep2.addEventListener('click', () => {
        const nameVal = dogNameInput.value.trim();
        if (!nameVal) {
            nameError.style.display = 'block';
            dogNameInput.classList.add('error');
            dogNameInput.focus();
            return;
        }

        nameError.style.display = 'none';
        dogNameInput.classList.remove('error');
        appState.dogName = nameVal;

        // Custom breed validation if 'other' is selected
        if (appState.avatar === 'other') {
            const selectedVal = breedSelect.value;
            if (!selectedVal) {
                customBreedError.textContent = '견종을 선택해 주세요!';
                customBreedError.style.display = 'block';
                breedSelect.classList.add('error');
                breedSelect.focus();
                return;
            }
            
            breedSelect.classList.remove('error');
            
            if (selectedVal === 'direct') {
                const breedVal = customBreedInput.value.trim();
                if (!breedVal) {
                    customBreedError.textContent = '견종명을 직접 입력해 주세요!';
                    customBreedError.style.display = 'block';
                    customBreedInput.classList.add('error');
                    customBreedInput.focus();
                    return;
                }
                customBreedError.style.display = 'none';
                customBreedInput.classList.remove('error');
                appState.customBreed = breedVal;
            } else {
                customBreedError.style.display = 'none';
                appState.customBreed = selectedVal;
            }
        } else {
            appState.customBreed = '';
        }

        navigateToStep(2);
    });

    // Handle typing enter key on Name input
    dogNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnToStep2.click();
        }
    });

    // Hide name error on input
    dogNameInput.addEventListener('input', () => {
        if (dogNameInput.value.trim()) {
            nameError.style.display = 'none';
            dogNameInput.classList.remove('error');
        }
    });

    // Handle typing enter key on Custom Breed input
    customBreedInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnToStep2.click();
        }
    });

    // Hide custom breed error on input
    customBreedInput.addEventListener('input', () => {
        if (customBreedInput.value.trim()) {
            customBreedError.style.display = 'none';
            customBreedInput.classList.remove('error');
        }
    });

    // Avatar card selections
    avatarCards.forEach(card => {
        card.addEventListener('click', () => {
            avatarCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            appState.avatar = card.getAttribute('data-avatar');

            if (appState.avatar === 'other') {
                customBreedGroup.style.display = 'flex';
                // Reset dropdown state
                if (breedSelect) {
                    breedSelect.value = '';
                    breedSelect.classList.remove('error');
                }
                if (directBreedInputWrapper) {
                    directBreedInputWrapper.style.display = 'none';
                }
                if (customBreedInput) {
                    customBreedInput.value = '';
                    customBreedInput.classList.remove('error');
                }
                if (customBreedError) {
                    customBreedError.style.display = 'none';
                }
                setTimeout(() => {
                    if (breedSelect) breedSelect.focus();
                }, 50);
            } else {
                customBreedGroup.style.display = 'none';
                if (breedSelect) {
                    breedSelect.value = '';
                    breedSelect.classList.remove('error');
                }
                if (directBreedInputWrapper) {
                    directBreedInputWrapper.style.display = 'none';
                }
                if (customBreedInput) {
                    customBreedInput.value = '';
                    customBreedInput.classList.remove('error');
                }
                if (customBreedError) {
                    customBreedError.style.display = 'none';
                }
            }
        });
    });

    // Handle breed select change event
    if (breedSelect) {
        breedSelect.addEventListener('change', () => {
            const selectedVal = breedSelect.value;
            if (selectedVal === 'direct') {
                if (directBreedInputWrapper) directBreedInputWrapper.style.display = 'block';
                setTimeout(() => {
                    if (customBreedInput) customBreedInput.focus();
                }, 50);
            } else {
                if (directBreedInputWrapper) directBreedInputWrapper.style.display = 'none';
                if (customBreedInput) {
                    customBreedInput.value = '';
                    customBreedInput.classList.remove('error');
                }
            }
            if (customBreedError) customBreedError.style.display = 'none';
            breedSelect.classList.remove('error');
        });
    }

    // Step 2 Age selections
    ageCards.forEach(card => {
        card.addEventListener('click', () => {
            ageCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            appState.ageGroup = card.getAttribute('data-value');
        });
    });

    // Step 3 Health Concern selections (Multi-select)
    concernCards.forEach(card => {
        card.addEventListener('click', () => {
            const val = card.getAttribute('data-value');
            
            if (val === 'general') {
                // If "일반 건강식" is clicked, deselect all other options
                concernCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                appState.healthConcerns = ['general'];
            } else {
                // If a specific concern is clicked, deselect "일반 건강식"
                const generalCard = document.querySelector('#step-3 .option-card[data-value="general"]');
                if (generalCard) generalCard.classList.remove('active');
                
                // Toggle clicked concern card active state
                card.classList.toggle('active');
                
                // Gather all active concern values
                const activeCards = document.querySelectorAll('#step-3 .option-card.active');
                const selectedConcerns = [];
                activeCards.forEach(c => {
                    selectedConcerns.push(c.getAttribute('data-value'));
                });
                
                // If nothing is selected, fall back to "일반 건강식"
                if (selectedConcerns.length === 0) {
                    if (generalCard) generalCard.classList.add('active');
                    appState.healthConcerns = ['general'];
                } else {
                    appState.healthConcerns = selectedConcerns;
                }
            }
        });
    });

    // Upsell checkbox listener
    upsellCheckbox.addEventListener('change', (e) => {
        appState.upsellSelected = e.target.checked;
        
        // Dynamic price update in Step 5 Result Screen
        const priceValEl = document.querySelector('.price-value');
        if (priceValEl) {
            if (appState.upsellSelected) {
                priceValEl.innerHTML = '월 43,900원 <span class="original-price">58,900원</span>';
            } else {
                priceValEl.innerHTML = '월 39,000원 <span class="original-price">54,000원</span>';
            }
        }

        // Re-render recommendation list to add/remove the gift pack
        renderResults();
    });

    // Prev Buttons
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStep = parseInt(btn.getAttribute('data-target'));
            navigateToStep(targetStep);
        });
    });

    // Go to analysis loading step
    btnToStep3.addEventListener('click', () => {
        navigateToStep(3);
    });

    btnToStep4.addEventListener('click', () => {
        // Start Analysis Simulation
        navigateToStep(4);
        startAIAnalysisSimulation();
    });

    // Reset button
    btnReset.addEventListener('click', () => {
        resetWizard();
    });

    // Subscribe Complete Button
    btnSubscribe.addEventListener('click', () => {
        // Go to success screen
        navigateToStep(6);
        
        // Render delivery dates
        populateDeliveryDates();
        
        // Start full screen confetti
        startConfetti();
    });

    // --- Breed Vulnerability Group Helper ---
    function getBreedGroup(breedName) {
        if (!breedName) return 'general';
        const cleaned = breedName.replace(/\s+/g, '').toLowerCase();
        
        // Check for joint breeds: 말티즈, 포메라니안, 푸들 (and derivatives)
        if (cleaned.includes('말티즈') || cleaned.includes('maltese') ||
            cleaned.includes('포메라니안') || cleaned.includes('포메') || cleaned.includes('pomeranian') ||
            cleaned.includes('푸들') || cleaned.includes('poodle') || cleaned.includes('말티푸')) {
            return 'joint';
        }
        
        // Check for skin/weight breeds: 골든 리트리버, 시바견, 웰시코기 (and derivatives)
        if (cleaned.includes('리트리버') || cleaned.includes('retriever') ||
            cleaned.includes('시바') || cleaned.includes('shiba') ||
            cleaned.includes('웰시') || cleaned.includes('corgi')) {
            return 'skin';
        }
        
        return 'general';
    }

    // --- Dynamic Breed Genetic Vulnerability Alert Banner ---
    function updateGeneticBanner() {
        const name = appState.dogName;
        const breedName = getBreedName();
        const breedGroup = getBreedGroup(breedName);
        const bannerEl = document.getElementById('breed-genetic-banner');
        
        if (!bannerEl) return;
        
        if (breedGroup === 'joint') {
            bannerEl.innerHTML = `💡 <strong>${name}</strong>은(는) 유전적으로 <strong>[관절/슬개골]</strong>이 취약한 편입니다. <strong>'관절 강화 박스'</strong>를 기본 추천합니다.`;
            bannerEl.style.display = 'block';
        } else if (breedGroup === 'skin') {
            bannerEl.innerHTML = `💡 <strong>${name}</strong>은(는) 유전적으로 <strong>[피부 및 체중 조절]</strong> 관리가 필요합니다. <strong>'피모 웰니스 박스'</strong>를 기본 추천합니다.`;
            bannerEl.style.display = 'block';
        } else {
            bannerEl.innerHTML = `💡 <strong>${name}</strong>을(를) 위한 <strong>'종합 면역 밸런스 박스'</strong>를 추천합니다.`;
            bannerEl.style.display = 'block';
        }
    }

    // --- Core Matching Logic & Result Card Generation ---
    function calculateRecommendations() {
        const name = appState.dogName;
        const age = appState.ageGroup;
        const concerns = appState.healthConcerns;
        const breedName = getBreedName();
        const breedGroup = getBreedGroup(breedName);

        const results = [];

        // 1. Food Recommendation (Age-based)
        if (age === 'senior') {
            results.push({
                tag: 'MAIN DIET',
                img: 'images/cooked_food.png',
                title: '기력 회복 부드러운 화식 사료',
                desc: '특허 공법으로 수분 함량을 높여 소화 흡수율을 95%로 극대화한 노령견 전용 영양식'
            });
        } else {
            results.push({
                tag: 'MAIN DIET',
                img: 'images/dry_food.png',
                title: '영양 가득 밸런스 건식 사료',
                desc: '동물성 단백질 70% 구성으로 뼈와 근육 발달을 돕는 유기농 홀리스틱 등급 사료'
            });
        }

        // 2. Base Recommendation from Breed Genetic Profile (Deduplicated with selected health concerns)
        let addedJoint = false;
        let addedSkin = false;
        let addedGeneral = false;

        if (breedGroup === 'joint') {
            results.push({
                tag: 'GENETIC SUPPORT (SUPPLEMENT)',
                img: 'images/joint_supplement.png',
                title: '초록입홍합 관절 영양제',
                desc: '뉴질랜드산 초록입홍합 100% 분말로 연골 손상 예방 및 염증 완화 케어'
            }, {
                tag: 'GENETIC SUPPORT (CHEW)',
                img: 'images/duck_jerky.png',
                title: '슬개골 부담 없는 오리 안심 져키',
                desc: '체질 저알레르기 국내산 무항생제 오리 안심살을 오븐 로스팅한 쫀득한 간식'
            });
            addedJoint = true;
        } else if (breedGroup === 'skin') {
            results.push({
                tag: 'GENETIC SUPPORT (SUPPLEMENT)',
                img: 'images/salmon_oil.png',
                title: '연어유 피모 영양제',
                desc: '오메가3와 필수지방산이 다량 함유되어 건조한 피부 완화 및 모질 윤기 개선'
            }, {
                tag: 'GENETIC SUPPORT (CHEW)',
                img: 'images/collagen_chew.png',
                title: '저칼로리 콜라겐 껌',
                desc: '저지방 고콜라겐 피시 젤라틴으로 제조하여 체중 조절 및 모질 윤기 부여에 도움을 주는 기능성 껌'
            });
            addedSkin = true;
        } else {
            if (concerns.includes('general')) {
                results.push({
                    tag: 'GENETIC SUPPORT (SUPPLEMENT)',
                    img: 'images/digest_probiotics.png',
                    title: '종합 면역 유산균 영양제',
                    desc: '기초 면역력을 높여주고 장 건강을 동시에 책임지는 복합 락토바실러스 영양 파우더'
                }, {
                    tag: 'GENETIC SUPPORT (CHEW)',
                    img: 'images/milk_chew.png',
                    title: '락토프리 천연 우유 껌',
                    desc: '유당을 완벽 분해하여 소화가 잘되며 오래 씹어 치석 제거에 탁월한 프리미엄 우유 껌'
                });
                addedGeneral = true;
            }
        }

        // 3. User Selected Concerns (Step 3, multi-select), keeping it deduplicated
        concerns.forEach(concern => {
            if (concern === 'joint' && !addedJoint) {
                results.push({
                    tag: 'HEALTH SUPPORT (SUPPLEMENT)',
                    img: 'images/joint_supplement.png',
                    title: '초록입홍합 관절 영양제',
                    desc: '뉴질랜드산 초록입홍합 100% 분말로 연골 손상 예방 및 염증 완화 케어'
                }, {
                    tag: 'HEALTH SUPPORT (CHEW)',
                    img: 'images/duck_jerky.png',
                    title: '슬개골 부담 없는 오리 안심 져키',
                    desc: '체질 저알레르기 국내산 무항생제 오리 안심살을 오븐 로스팅한 쫀득한 간식'
                });
                addedJoint = true;
            } else if (concern === 'skin' && !addedSkin) {
                results.push({
                    tag: 'HEALTH SUPPORT (SUPPLEMENT)',
                    img: 'images/salmon_oil.png',
                    title: '연어유 피모 영양제',
                    desc: '오메가3와 필수지방산이 다량 함유되어 건조한 피부 완화 및 모질 윤기 개선'
                }, {
                    tag: 'HEALTH SUPPORT (CHEW)',
                    img: 'images/beef_chew.png',
                    title: '눈물 자국 개선 소가죽 껌',
                    desc: '천연 소가죽에 클로렐라와 비타민을 더해 눈물 자국을 지워주는 위생 기능성 덴탈 껌'
                });
                addedSkin = true;
            } else if (concern === 'digest') {
                const hasProbiotics = results.some(r => r.img === 'images/digest_probiotics.png');
                if (!hasProbiotics) {
                    results.push({
                        tag: 'HEALTH SUPPORT (SUPPLEMENT)',
                        img: 'images/digest_probiotics.png',
                        title: '장건강 포뮬러 유산균 영양제',
                        desc: '50억 보장 유산균과 프리바이오틱스가 결합하여 원활한 소화 및 예민한 장 환경 개선'
                    });
                }
                const hasMilkChew = results.some(r => r.img === 'images/milk_chew.png');
                if (!hasMilkChew) {
                    results.push({
                        tag: 'HEALTH SUPPORT (CHEW)',
                        img: 'images/milk_chew.png',
                        title: '락토프리 천연 우유 껌',
                        desc: '유당을 분해한 신선 유기농 산양유로 만든 풍부한 칼슘 소화 부담 없는 수제 차즈 껌'
                    });
                }
            }
        });

        // 4. Upselling product pack if selected
        if (appState.upsellSelected) {
            results.push({
                tag: 'SPECIAL GIFT',
                img: 'images/gift_pack.png',
                title: '한정판 수제 노즈워크 토이 & 한우 져키 기획팩',
                desc: '댕프레시 10만 돌파 기념! 정가 19,800원 상당의 프리미엄 토이와 영양 만점 수제 한우 우둔살 져키 세트'
            });
        }

        return results;
    }

    function getBreedName() {
        const avatarToBreed = {
            poodle: '푸들',
            retriever: '리트리버',
            pomeranian: '포메',
            beagle: '비글',
            maltese: '말티즈',
            other: appState.customBreed || '기타 견종'
        };
        return avatarToBreed[appState.avatar] || '기타 견종';
    }

    function renderResults() {
        const name = appState.dogName;
        const breedName = getBreedName();
        
        // Update Title Texts
        resultCongratsTitle.textContent = `🎉 ${name}만을 위한 웰니스 맞춤 박스가 완성되었습니다!`;
        boxLblName.textContent = `${name} (${breedName})용 맞춤 박스`;
        
        // Update breed-specific genetic banner
        updateGeneticBanner();
        
        // Clear items
        recItemsContainer.innerHTML = '';

        // Generate Item Blocks
        const recommendations = calculateRecommendations();
        recommendations.forEach(item => {
            const itemHTML = `
                <div class="rec-item">
                    <div class="rec-item-img-wrapper">
                        <img src="${item.img}" alt="${item.title}" class="rec-item-img">
                    </div>
                    <div class="rec-item-details">
                        <div class="rec-item-tag">${item.tag}</div>
                        <h4 class="rec-item-title">${item.title}</h4>
                        <p class="rec-item-desc">${item.desc}</p>
                    </div>
                </div>
            `;
            recItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
        
        // Re-initialize dynamic Lucide icons if any
        lucide.createIcons();
    }

    // --- AI Simulation Logic ---
    function startAIAnalysisSimulation() {
        const name = appState.dogName;
        dogLoadingName.textContent = name;
        
        let progress = 0;
        loadingProgress.style.width = '0%';
        
        const loadingTexts = [
            `${name}의 신체 성장 데이터를 기반으로 맞춤 칼로리를 산정하고 있습니다...`,
            `${name}의 연령대에 필요한 최적의 영양소 밸런스 비율을 조합 중입니다...`,
            `신경 쓰이는 고민 해결을 위한 전용 건강보조제와 맞춤 간식을 엄선하고 있습니다...`,
            `댕프레시 웰니스 1:1 맞춤 배송 박스 패키징 디자인을 구성 완료하는 중...`
        ];

        const interval = setInterval(() => {
            progress += 5;
            loadingProgress.style.width = `${progress}%`;

            // Change subtext dynamically
            if (progress < 25) {
                loadingSubtext.textContent = loadingTexts[0];
            } else if (progress < 55) {
                loadingSubtext.textContent = loadingTexts[1];
            } else if (progress < 80) {
                loadingSubtext.textContent = loadingTexts[2];
            } else {
                loadingSubtext.textContent = loadingTexts[3];
            }

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    renderResults();
                    navigateToStep(5);
                }, 300);
            }
        }, 100); // Total 2000ms duration
    }

    // --- Date Calculations Utilities ---
    function populateDeliveryDates() {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

        // Delivery display formats
        const formattedTomorrow = `${tomorrow.getFullYear()}년 ${tomorrow.getMonth() + 1}월 ${tomorrow.getDate()}일 (${daysOfWeek[tomorrow.getDay()]})`;

        // Target outputs
        successDogName.textContent = appState.dogName;
        firstDeliveryDay.textContent = `${formattedTomorrow} (배송비 무료)`;
        
        const breedName = getBreedName();
        receiptDogInfo.textContent = `${appState.dogName} (${breedName})`;
        
        if (appState.upsellSelected) {
            receiptPrice.textContent = '월 43,900원 (한정판 기획팩 포함)';
        } else {
            receiptPrice.textContent = '월 39,000원 (배송비 무료)';
        }
        
        // Delivery tracker texts
        deliveryDateText.textContent = `오늘 밤 10시 일괄 출고`;
        arrivalDateText.textContent = `내일 아침 7시 전 문 앞 배송 완료`;
    }

    // --- Reset State ---
    function resetWizard() {
        // Reset state
        appState.dogName = '';
        appState.avatar = 'poodle';
        appState.customBreed = '';
        appState.ageGroup = 'puppy';
        appState.healthConcerns = ['general'];
        appState.upsellSelected = false;
        
        if (upsellCheckbox) upsellCheckbox.checked = false;
        
        // Reset Pricing display values in Step 5 Result Screen
        const priceValEl = document.querySelector('.price-value');
        if (priceValEl) {
            priceValEl.innerHTML = '월 39,000원 <span class="original-price">54,000원</span>';
        }
        
        // Reset Form Inputs
        dogNameInput.value = '';
        if (breedSelect) {
            breedSelect.value = '';
            breedSelect.classList.remove('error');
        }
        if (directBreedInputWrapper) {
            directBreedInputWrapper.style.display = 'none';
        }
        customBreedInput.value = '';
        customBreedGroup.style.display = 'none';
        customBreedError.style.display = 'none';
        customBreedInput.classList.remove('error');
        
        // Hide genetic alert banner
        const bannerEl = document.getElementById('breed-genetic-banner');
        if (bannerEl) bannerEl.style.display = 'none';
        
        // Reset selections visual indicators
        avatarCards.forEach(c => c.classList.remove('active'));
        avatarCards[0].classList.add('active'); // Default poodle

        ageCards.forEach(c => c.classList.remove('active'));
        ageCards[0].classList.add('active'); // Default puppy

        concernCards.forEach(c => c.classList.remove('active'));
        concernCards[0].classList.add('active'); // Default general

        // Stop Confetti animation
        stopConfetti();

        // Navigate back to step 1
        navigateToStep(1);
    }

    // --- High-Performance Custom Canvas Confetti Engine ---
    let confettiActive = false;
    let confettiAnimationId = null;
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);

    class ConfettiParticle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -canvas.height - 20;
            this.size = Math.random() * 8 + 6;
            this.color = ['#FF7A59', '#FFAE59', '#34D399', '#60A5FA', '#F472B6', '#FBBF24'][Math.floor(Math.random() * 6)];
            this.speedY = Math.random() * 5 + 4;
            this.speedX = Math.random() * 3 - 1.5;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 4 - 2;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotationSpeed;

            // Reset particle when it drops off bottom
            if (this.y > canvas.height) {
                this.y = -20;
                this.x = Math.random() * canvas.width;
                this.speedY = Math.random() * 5 + 4;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.fillStyle = this.color;
            // Draw rectangle confetti piece
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
            ctx.restore();
        }
    }

    function startConfetti() {
        resizeCanvas();
        particles = [];
        const maxParticles = 120;
        
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new ConfettiParticle());
        }

        confettiActive = true;
        animateConfetti();
        
        // Stop spawning new ones or disable after 6 seconds to save system CPU resources
        setTimeout(() => {
            confettiActive = false;
        }, 5000);
    }

    function animateConfetti() {
        if (!confettiActive && particles.length === 0) {
            cancelAnimationFrame(confettiAnimationId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, index) => {
            p.update();
            p.draw();

            // If we are turning off confetti, let particles fall off and delete them
            if (!confettiActive && p.y < 0) {
                particles.splice(index, 1);
            }
        });

        confettiAnimationId = requestAnimationFrame(animateConfetti);
    }

    function stopConfetti() {
        confettiActive = false;
        cancelAnimationFrame(confettiAnimationId);
        if(ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        particles = [];
    }
});
