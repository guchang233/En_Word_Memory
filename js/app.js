// 全局变量
let words = [];
let currentWordIndex = 0;
let currentPage = 1;
let wordsPerPage = 50;
let filterType = 'all';
let isPlaying = false;
// 测试变量已移至test.js
let learnedWords = [];
let starredWords = [];

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航切换
    initNavigation();
    
    // 加载单词数据
    loadWords();
    
    // 初始化事件监听
    initEventListeners();
    
    // 初始化移动端触摸事件
    initTouchEvents();
    
    // 初始化测试模块
    if (window.TestModule && typeof window.TestModule.init === 'function') {
        window.TestModule.init();
    }
});

// 初始化导航切换
function initNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有导航链接的active类
            navLinks.forEach(link => link.classList.remove('active'));
            
            // 为当前点击的链接添加active类
            this.classList.add('active');
            
            // 隐藏所有section
            sections.forEach(section => section.classList.remove('section-active'));
            
            // 显示对应的section
            const targetSection = this.getAttribute('data-section');
            document.getElementById(targetSection).classList.add('section-active');
        });
    });
}

// 加载单词数据
async function loadWords() {
    try {
        // 从3500.txt文件加载单词数据
        const response = await fetch('word3500-master/3500.txt');
        const text = await response.text();
        
        // 解析单词数据
        const lines = text.split('\n');
        let wordObj = {};
        let wordIndex = 0;
        
        for (let i = 0; i < lines.length; i += 3) {
            if (i + 2 < lines.length) {
                wordObj = {
                    id: wordIndex + 1,
                    word: lines[i].trim(),
                    pronunciation: lines[i + 1].trim(),
                    meaning: lines[i + 2].trim(),
                    learned: false,
                    starred: false
                };
                words.push(wordObj);
                wordIndex++;
            }
        }
        
        // 从本地存储加载学习状态
        loadLearningStatus();
        
        // 显示单词
        displayCurrentWord();
        
        // 更新单词列表
        updateWordList();
        
        // 更新统计信息
        updateStats();
    } catch (error) {
        console.error('加载单词数据失败:', error);
    }
}

// 从本地存储加载学习状态
function loadLearningStatus() {
    const savedLearnedWords = localStorage.getItem('learnedWords');
    const savedStarredWords = localStorage.getItem('starredWords');
    
    if (savedLearnedWords) {
        learnedWords = JSON.parse(savedLearnedWords);
        learnedWords.forEach(id => {
            const word = words.find(w => w.id === id);
            if (word) word.learned = true;
        });
    }
    
    if (savedStarredWords) {
        starredWords = JSON.parse(savedStarredWords);
        starredWords.forEach(id => {
            const word = words.find(w => w.id === id);
            if (word) word.starred = true;
        });
    }
}

// 保存学习状态到本地存储
function saveLearningStatus() {
    localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
    localStorage.setItem('starredWords', JSON.stringify(starredWords));
}

// 初始化事件监听
function initEventListeners() {
    // 搜索按钮
    document.getElementById('search-btn').addEventListener('click', searchWord);
    
    // 搜索框回车
    document.getElementById('word-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchWord();
    });
    
    // 过滤选择
    document.getElementById('filter-type').addEventListener('change', function() {
        filterType = this.value;
        currentPage = 1;
        updateWordList();
    });
    
    // 上一页
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updateWordList();
            document.getElementById('current-page').textContent = currentPage;
        }
    });
    
    // 下一页
    document.getElementById('next-page').addEventListener('click', function() {
        const filteredWords = getFilteredWords();
        const totalPages = Math.ceil(filteredWords.length / wordsPerPage);
        
        if (currentPage < totalPages) {
            currentPage++;
            updateWordList();
            document.getElementById('current-page').textContent = currentPage;
        }
    });
    
    // 标记星标
    document.querySelector('.star-btn').addEventListener('click', toggleStar);
    
    // 标记已学习
    document.querySelector('.mark-learned-btn').addEventListener('click', toggleLearned);
    
    // 自动播放
    document.querySelector('.auto-play-btn').addEventListener('click', toggleAutoPlay);
    
    // 发音按钮
    document.querySelector('.accent-btn.uk').addEventListener('click', function() {
        playWordAudio(words[currentWordIndex].word, 1); // 英式发音
    });
    
    document.querySelector('.accent-btn.us').addEventListener('click', function() {
        playWordAudio(words[currentWordIndex].word, 0); // 美式发音
    });
    
    // 测试按钮事件监听已移至test.js
    
    // 复习按钮
    document.getElementById('start-review-btn').addEventListener('click', startReview);
    
    // 翻转卡片按钮
    document.querySelector('.flip-btn').addEventListener('click', flipReviewCard);
    
    // 复习反馈按钮
    document.querySelectorAll('.feedback-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const difficulty = this.classList.contains('easy') ? 'easy' : 
                             this.classList.contains('medium') ? 'medium' : 'hard';
            provideReviewFeedback(difficulty);
        });
    });
}

// 显示当前单词
function displayCurrentWord() {
    if (words.length === 0) return;
    
    const currentWord = words[currentWordIndex];
    document.querySelector('.word-id').textContent = `#${currentWord.id}`;
    document.querySelector('.word-text').textContent = currentWord.word;
    document.querySelector('.pronunciation span').textContent = currentWord.pronunciation;
    document.querySelector('.meaning').textContent = currentWord.meaning;
    
    // 更新星标状态
    const starBtn = document.querySelector('.star-btn i');
    if (currentWord.starred) {
        starBtn.className = 'fa fa-star';
    } else {
        starBtn.className = 'fa fa-star-o';
    }
    
    // 更新学习状态
    const learnBtn = document.querySelector('.mark-learned-btn');
    if (currentWord.learned) {
        learnBtn.textContent = '已学习';
        learnBtn.style.backgroundColor = '#95a5a6';
    } else {
        learnBtn.textContent = '标记为已学习';
        learnBtn.style.backgroundColor = '#2ecc71';
    }
}

// 更新单词列表
function updateWordList() {
    const wordsList = document.getElementById('words');
    wordsList.innerHTML = '';
    
    const filteredWords = getFilteredWords();
    const startIndex = (currentPage - 1) * wordsPerPage;
    const endIndex = Math.min(startIndex + wordsPerPage, filteredWords.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const word = filteredWords[i];
        const li = document.createElement('li');
        li.textContent = word.word;
        
        // 修改判断条件，使用filterType === 'all'来判断是否是所有单词的情况
        if (words.indexOf(word) === currentWordIndex && (filterType === 'all' || 
            (filterType === 'starred' && word.starred) || 
            (filterType === 'learned' && word.learned) || 
            (filterType === 'unlearned' && !word.learned))) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', function() {
            currentWordIndex = words.indexOf(word);
            displayCurrentWord();
            
            // 更新活动状态
            document.querySelectorAll('#words li').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
        
        wordsList.appendChild(li);
    }
    
    // 更新页码
    document.getElementById('current-page').textContent = currentPage;
}

// 获取过滤后的单词列表
function getFilteredWords() {
    switch (filterType) {
        case 'starred':
            return words.filter(word => word.starred);
        case 'learned':
            return words.filter(word => word.learned);
        case 'unlearned':
            return words.filter(word => !word.learned);
        default:
            return words;
    }
}

// 搜索单词
function searchWord() {
    const searchInput = document.getElementById('word-search').value.trim().toLowerCase();
    if (!searchInput) return;
    
    const foundIndex = words.findIndex(word => 
        word.word.toLowerCase().includes(searchInput) || 
        word.meaning.toLowerCase().includes(searchInput)
    );
    
    if (foundIndex !== -1) {
        currentWordIndex = foundIndex;
        displayCurrentWord();
        
        // 计算页码
        const filteredWords = getFilteredWords();
        const wordIndexInFiltered = filteredWords.indexOf(words[currentWordIndex]);
        
        if (wordIndexInFiltered !== -1) {
            currentPage = Math.floor(wordIndexInFiltered / wordsPerPage) + 1;
            updateWordList();
        }
    } else {
        alert('未找到匹配的单词！');
    }
}

// 切换星标状态
function toggleStar() {
    const currentWord = words[currentWordIndex];
    currentWord.starred = !currentWord.starred;
    
    // 更新星标数组
    if (currentWord.starred) {
        if (!starredWords.includes(currentWord.id)) {
            starredWords.push(currentWord.id);
        }
    } else {
        const index = starredWords.indexOf(currentWord.id);
        if (index !== -1) {
            starredWords.splice(index, 1);
        }
    }
    
    // 保存状态
    saveLearningStatus();
    
    // 更新显示
    displayCurrentWord();
    updateWordList();
    updateStats();
}

// 切换学习状态
function toggleLearned() {
    const currentWord = words[currentWordIndex];
    currentWord.learned = !currentWord.learned;
    
    // 更新已学习数组
    if (currentWord.learned) {
        if (!learnedWords.includes(currentWord.id)) {
            learnedWords.push(currentWord.id);
        }
    } else {
        const index = learnedWords.indexOf(currentWord.id);
        if (index !== -1) {
            learnedWords.splice(index, 1);
        }
    }
    
    // 保存状态
    saveLearningStatus();
    
    // 更新显示
    displayCurrentWord();
    updateWordList();
    updateStats();
}

// 切换自动播放
function toggleAutoPlay() {
    const playBtn = document.querySelector('.auto-play-btn i');
    
    if (isPlaying) {
        isPlaying = false;
        playBtn.className = 'fa fa-play';
    } else {
        isPlaying = true;
        playBtn.className = 'fa fa-pause';
        autoPlayNext();
    }
}

// 自动播放下一个单词
function autoPlayNext() {
    if (!isPlaying) return;
    
    // 播放当前单词
    playWordAudio(words[currentWordIndex].word, 1);
    
    // 2秒后切换到下一个单词
    setTimeout(() => {
        if (!isPlaying) return;
        
        currentWordIndex = (currentWordIndex + 1) % words.length;
        displayCurrentWord();
        
        // 更新单词列表选中状态
        updateWordList();
        
        // 继续播放下一个
        setTimeout(autoPlayNext, 1000);
    }, 2000);
}

// 播放单词音频
function playWordAudio(word, accent) {
    const audio = new Audio(`https://dict.youdao.com/dictvoice?type=${accent}&audio=${word}`);
    audio.play();
}

// 更新统计信息
function updateStats() {
    // 更新学习进度
    const learnedPercentage = words.length > 0 ? Math.round((learnedWords.length / words.length) * 100) : 0;
    document.querySelector('.percentage').textContent = `${learnedPercentage}%`;
    document.querySelector('.progress-circle').style.background = 
        `conic-gradient(#3498db 0% ${learnedPercentage}%, #ecf0f1 ${learnedPercentage}% 100%)`;
    
    // 更新统计详情
    document.querySelectorAll('.stat-value')[0].textContent = words.length;
    document.querySelectorAll('.stat-value')[1].textContent = learnedWords.length;
    document.querySelectorAll('.stat-value')[2].textContent = starredWords.length;
    document.querySelectorAll('.stat-value')[3].textContent = localStorage.getItem('testAccuracy') || '0%';
}

// 测试函数已移至test.js

// 测试函数已移至test.js

// 测试函数已移至test.js

// 测试函数已移至test.js

// 开始复习
function startReview() {
    const reviewType = document.getElementById('review-type').value;
    let wordsToReview = [];
    
    // 根据复习类型选择单词
    switch (reviewType) {
        case 'spaced':
            // 间隔复习（优先复习已学习但记忆不牢的单词）
            wordsToReview = words.filter(word => word.learned);
            break;
        case 'random':
            // 随机复习
            wordsToReview = [...words];
            break;
        case 'difficult':
            // 难词复习（优先复习标记为星标的单词）
            wordsToReview = words.filter(word => word.starred);
            break;
    }
    
    // 如果没有可复习的单词
    if (wordsToReview.length === 0) {
        alert('没有可复习的单词！');
        return;
    }
    
    // 随机选择30个单词（或全部，如果少于30个）
    const reviewCount = Math.min(wordsToReview.length, 30);
    const shuffled = [...wordsToReview].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, reviewCount);
    
    // 显示第一个复习单词
    currentWordIndex = words.indexOf(selectedWords[0]);
    updateReviewCard(0, reviewCount);
}

// 更新复习卡片
function updateReviewCard(index, total) {
    const currentWord = words[currentWordIndex];
    
    // 更新复习进度
    document.querySelector('.review-count').textContent = `复习进度：${index + 1}/${total}`;
    
    // 更新单词内容
    document.querySelector('.word-front .word-text').textContent = currentWord.word;
    document.querySelector('.word-back .pronunciation').textContent = currentWord.pronunciation;
    document.querySelector('.word-back .meaning').textContent = currentWord.meaning;
    
    // 重置卡片状态
    document.querySelector('.word-front').classList.remove('hidden');
    document.querySelector('.word-back').classList.add('hidden');
}

// 翻转复习卡片
function flipReviewCard() {
    document.querySelector('.word-front').classList.add('hidden');
    document.querySelector('.word-back').classList.remove('hidden');
}

// 提供复习反馈
function provideReviewFeedback(difficulty) {
    const currentWord = words[currentWordIndex];
    
    // 根据难度更新单词状态
    if (difficulty === 'easy') {
        // 简单 - 标记为已学习
        if (!currentWord.learned) {
            toggleLearned();
        }
    } else if (difficulty === 'hard') {
        // 困难 - 标记为星标
        if (!currentWord.starred) {
            toggleStar();
        }
    }
    
    // 获取当前复习进度
    const progressText = document.querySelector('.review-count').textContent;
    const match = progressText.match(/(\d+)\/(\d+)/);
    
    if (match) {
        const currentIndex = parseInt(match[1]);
        const total = parseInt(match[2]);
        
        if (currentIndex < total) {
            // 继续下一个单词
            const nextIndex = words.findIndex((word, idx) => {
                return idx > currentWordIndex && (
                    (word.learned && document.getElementById('review-type').value === 'spaced') ||
                    (document.getElementById('review-type').value === 'random') ||
                    (word.starred && document.getElementById('review-type').value === 'difficult')
                );
            });
            
            if (nextIndex !== -1) {
                currentWordIndex = nextIndex;
                updateReviewCard(currentIndex, total);
            } else {
                // 如果找不到下一个符合条件的单词，回到第一个
                alert('复习完成！');
            }
        } else {
            // 复习完成
            alert('复习完成！');
        }
    }
}

// 初始化移动端触摸事件
function initTouchEvents() {
    // 单词卡片滑动手势
    const wordCard = document.getElementById('current-word');
    let touchStartX = 0;
    let touchEndX = 0;
    
    // 触摸开始事件
    wordCard.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    // 触摸结束事件
    wordCard.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
    
    // 处理滑动手势
    function handleSwipe() {
        // 向左滑动 - 下一个单词
        if (touchEndX < touchStartX - 50) {
            if (currentWordIndex < words.length - 1) {
                currentWordIndex++;
                displayCurrentWord();
                updateWordList();
            }
        }
        // 向右滑动 - 上一个单词
        if (touchEndX > touchStartX + 50) {
            if (currentWordIndex > 0) {
                currentWordIndex--;
                displayCurrentWord();
                updateWordList();
            }
        }
    }
    
    // 复习卡片滑动手势
    const reviewCard = document.querySelector('.review-card');
    if (reviewCard) {
        reviewCard.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        reviewCard.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            // 向左滑动 - 困难
            if (touchEndX < touchStartX - 50) {
                const hardBtn = document.querySelector('.feedback-btn.hard');
                if (hardBtn && !document.querySelector('.word-front').classList.contains('hidden')) {
                    flipReviewCard();
                } else if (hardBtn) {
                    hardBtn.click();
                }
            }
            // 向右滑动 - 简单
            if (touchEndX > touchStartX + 50) {
                const easyBtn = document.querySelector('.feedback-btn.easy');
                if (easyBtn && !document.querySelector('.word-front').classList.contains('hidden')) {
                    flipReviewCard();
                } else if (easyBtn) {
                    easyBtn.click();
                }
            }
        }, false);
    }
    
    // 测试卡片滑动手势
    const testCard = document.querySelector('.test-card');
    if (testCard) {
        testCard.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        testCard.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            // 向左滑动 - 下一题
            if (touchEndX < touchStartX - 50) {
                const nextBtn = document.getElementById('next-question-btn');
                if (nextBtn) {
                    nextBtn.click();
                }
            }
        }, false);
    }
    
    // 为单词列表添加触摸滚动优化
    const wordList = document.querySelector('.word-list');
    if (wordList) {
        wordList.style.overscrollBehavior = 'contain'; // 防止滚动穿透
    }
}