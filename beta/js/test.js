// 测试模块全局变量
let testWords = [];
let testIndex = 0;
let testScore = 0;
let testHistory = []; // 存储当前测试历史记录
let allTestHistory = {}; // 存储所有测试历史记录，按日期分类

// 初始化测试模块
function initTestModule() {
    // 测试按钮事件监听
    const startTestBtn = document.getElementById('start-test-btn');
    if (startTestBtn) {
        startTestBtn.addEventListener('click', startTest);
    }
    
    const nextQuestionBtn = document.getElementById('next-question-btn');
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', nextTestQuestion);
    }
    
    // 如果有返回按钮，绑定事件
    const backButton = document.getElementById('back-to-test');
    if (backButton) {
        backButton.addEventListener('click', resetTestInterface);
    }
}

// 开始测试
function startTest() {
    const testRange = document.getElementById('test-range').value;
    
    // 确保words变量已定义
    if (typeof words === 'undefined' || !Array.isArray(words) || words.length === 0) {
        alert('单词数据尚未加载完成，请稍后再试！');
        return;
    }
    
    // 根据范围选择测试单词
    let wordsToTest = [];
    switch (testRange) {
        case 'starred':
            wordsToTest = words.filter(word => word.starred);
            break;
        case 'learned':
            wordsToTest = words.filter(word => word.learned);
            break;
        case 'unlearned':
            wordsToTest = words.filter(word => !word.learned);
            break;
        default:
            wordsToTest = [...words];
    }
    
    // 如果没有可测试的单词
    if (wordsToTest.length === 0) {
        alert('没有可测试的单词！');
        return;
    }
    
    // 随机选择10个单词（或全部，如果少于10个）
    testWords = [];
    const testCount = Math.min(wordsToTest.length, 10);
    const shuffled = [...wordsToTest].sort(() => 0.5 - Math.random());
    testWords = shuffled.slice(0, testCount);
    
    // 重置测试状态
    testIndex = 0;
    testScore = 0;
    testHistory = []; // 清空历史记录
    
    // 显示第一个测试题
    displayTestQuestion();
}

// 显示测试题目
function displayTestQuestion() {
    if (testIndex >= testWords.length) {
        // 测试结束
        finishTest();
        return;
    }
    
    const currentTestWord = testWords[testIndex];
    const testQuestion = document.querySelector('.test-question h3');
    const optionsContainer = document.querySelector('.test-options');
    optionsContainer.innerHTML = '';
    
    // 更新进度条
    const progressPercentage = ((testIndex + 1) / testWords.length) * 100;
    document.querySelector('.progress-fill').style.width = `${progressPercentage}%`;
    document.querySelector('.progress-text').textContent = `${testIndex + 1}/${testWords.length}`;
    
    // 单词 → 含义测试
    testQuestion.textContent = `请选择单词 "${currentTestWord.word}" 的中文含义：`;
    
    // 生成选项（1个正确答案，3个干扰项）
    const options = generateOptions(currentTestWord);
    createOptions(options, currentTestWord.meaning);
    
    // 更新导航按钮
    updateNavigationButtons();
}

// 创建选项
function createOptions(options, correctAnswer) {
    const optionsContainer = document.querySelector('.test-options');
    
    options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
        optionDiv.dataset.correct = option === correctAnswer;
        
        optionDiv.addEventListener('click', function() {
            // 移除之前的选择
            document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            
            // 标记当前选择
            this.classList.add('selected');
            
            // 记录当前选择
            const selectedOption = this.textContent.substring(3); // 去掉"A. "等前缀
            const isCorrect = this.dataset.correct === 'true';
            
            // 保存到历史记录
            testHistory[testIndex] = {
                word: testWords[testIndex].word,
                meaning: testWords[testIndex].meaning,
                selectedOption: selectedOption,
                isCorrect: isCorrect
            };
            
            // 移动端自动进入下一题（可选功能）
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    nextTestQuestion();
                }, 500);
            }
        });
        
        optionsContainer.appendChild(optionDiv);
    });
}

// 生成测试选项
function generateOptions(currentWord) {
    // 正确答案
    const correctAnswer = currentWord.meaning;
    
    // 随机选择3个干扰项
    const otherWords = words.filter(w => w.id !== currentWord.id);
    const shuffled = [...otherWords].sort(() => 0.5 - Math.random());
    const distractors = shuffled.slice(0, 3).map(w => w.meaning);
    
    // 合并选项并随机排序
    const options = [correctAnswer, ...distractors];
    return options.sort(() => 0.5 - Math.random());
}

// 下一个测试题
function nextTestQuestion() {
    // 检查是否已经选择了答案
    if (!testHistory[testIndex]) {
        const selectedOption = document.querySelector('.option.selected');
        
        if (selectedOption) {
            // 记录当前选择
            const isCorrect = selectedOption.dataset.correct === 'true';
            if (isCorrect) testScore++;
            
            testHistory[testIndex] = {
                word: testWords[testIndex].word,
                meaning: testWords[testIndex].meaning,
                selectedOption: selectedOption.textContent.substring(3),
                isCorrect: isCorrect
            };
        } else {
            // 如果没有选择，提示用户
            alert('请选择一个选项！');
            return;
        }
    }
    
    // 进入下一题
    testIndex++;
    displayTestQuestion();
}

// 上一个测试题
function prevTestQuestion() {
    if (testIndex > 0) {
        testIndex--;
        displayTestQuestion();
        
        // 如果有历史记录，恢复之前的选择
        if (testHistory[testIndex]) {
            const options = document.querySelectorAll('.option');
            const selectedText = testHistory[testIndex].selectedOption;
            
            options.forEach(option => {
                if (option.textContent.substring(3) === selectedText) {
                    option.classList.add('selected');
                }
            });
        }
    }
}

// 更新导航按钮
function updateNavigationButtons() {
    const testFooter = document.querySelector('.test-footer');
    testFooter.innerHTML = '';
    
    // 添加上一题按钮（如果不是第一题）
    if (testIndex > 0) {
        const prevButton = document.createElement('button');
        prevButton.id = 'prev-question-btn';
        prevButton.innerHTML = '<i class="fa fa-arrow-left"></i> 上一题';
        prevButton.addEventListener('click', prevTestQuestion);
        testFooter.appendChild(prevButton);
    }
    
    // 添加下一题按钮
    const nextButton = document.createElement('button');
    nextButton.id = 'next-question-btn';
    nextButton.textContent = testIndex < testWords.length - 1 ? '下一题' : '完成测试';
    nextButton.addEventListener('click', nextTestQuestion);
    testFooter.appendChild(nextButton);
}

// 完成测试
function finishTest() {
    const accuracy = Math.round((testScore / testWords.length) * 100);
    
    // 保存测试正确率
    localStorage.setItem('testAccuracy', `${accuracy}%`);
    
    // 保存测试历史记录
    saveTestHistory(accuracy);
    
    // 显示结果
    const testCard = document.querySelector('.test-card');
    testCard.innerHTML = `
        <div class="test-result">
            <h3>测试完成！</h3>
            <div class="result-details">
                <p>总题数: ${testWords.length}</p>
                <p>正确数: ${testScore}</p>
                <p>正确率: ${accuracy}%</p>
            </div>
            <div class="result-chart">
                <div class="accuracy-circle" style="background: conic-gradient(#3498db 0% ${accuracy}%, #ecf0f1 ${accuracy}% 100%)">
                    <span>${accuracy}%</span>
                </div>
            </div>
            <button id="review-test-btn" class="review-btn">查看答题记录</button>
            <button id="back-to-test" class="back-btn">返回</button>
        </div>
    `;
    
    // 更新统计信息
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // 返回按钮事件
    document.getElementById('back-to-test').addEventListener('click', resetTestInterface);
    
    // 查看答题记录按钮事件
    document.getElementById('review-test-btn').addEventListener('click', showTestReview);
}

// 显示测试回顾
function showTestReview() {
    const testCard = document.querySelector('.test-card');
    let reviewHTML = `
        <div class="test-review">
            <h3>测试回顾</h3>
            <div class="review-list">
    `;
    
    testHistory.forEach((record, index) => {
        reviewHTML += `
            <div class="review-item ${record.isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-question">
                    <span class="question-number">${index + 1}.</span>
                    <span class="question-word">${record.word}</span>
                </div>
                <div class="review-answer">
                    <div class="user-answer">
                        <span>你的答案:</span> ${record.selectedOption}
                    </div>
                    <div class="correct-answer">
                        <span>正确答案:</span> ${record.meaning}
                    </div>
                </div>
            </div>
        `;
    });
    
    reviewHTML += `
            </div>
            <button id="back-to-result" class="back-btn">返回结果</button>
        </div>
    `;
    
    testCard.innerHTML = reviewHTML;
    
    // 返回结果按钮事件
    document.getElementById('back-to-result').addEventListener('click', finishTest);
}

// 重置测试界面
function resetTestInterface() {
    const testCard = document.querySelector('.test-card');
    testCard.innerHTML = `
        <div class="test-progress">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <span class="progress-text">1/10</span>
        </div>
        <div class="test-question">
            <h3>请选择单词的中文含义：</h3>
        </div>
        <div class="test-options">
            <!-- 选项将通过JavaScript动态生成 -->
        </div>
        <div class="test-footer">
            <button id="next-question-btn">下一题</button>
        </div>
    `;
    
    // 重新绑定事件
    document.getElementById('next-question-btn').addEventListener('click', nextTestQuestion);
}

// 保存测试历史记录
function saveTestHistory(accuracy) {
    // 获取当前日期作为键
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
    
    // 创建测试记录对象
    const testRecord = {
        date: dateKey,
        timestamp: today.getTime(),
        words: testWords.map(word => word.id),
        score: testScore,
        total: testWords.length,
        accuracy: accuracy,
        details: testHistory
    };
    
    // 从localStorage获取已有的测试历史记录
    const savedHistory = localStorage.getItem('allTestHistory');
    if (savedHistory) {
        allTestHistory = JSON.parse(savedHistory);
    }
    
    // 按日期添加新的测试记录
    if (!allTestHistory[dateKey]) {
        allTestHistory[dateKey] = [];
    }
    allTestHistory[dateKey].push(testRecord);
    
    // 保存回localStorage
    localStorage.setItem('allTestHistory', JSON.stringify(allTestHistory));
    
    // 更新统计信息
    if (typeof updateStats === 'function') {
        updateStats();
    }
}

// 重置测试历史记录
function resetTestHistory() {
    allTestHistory = {};
}

// 导出测试模块函数
window.TestModule = {
    init: initTestModule,
    start: startTest,
    next: nextTestQuestion,
    prev: prevTestQuestion,
    finish: finishTest,
    resetTestHistory: resetTestHistory
};

// 确保在DOM加载完成后初始化测试模块
document.addEventListener('DOMContentLoaded', function() {
    // 初始化测试模块
    if (typeof initTestModule === 'function') {
        initTestModule();
    }
});