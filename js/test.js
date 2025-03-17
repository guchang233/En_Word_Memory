// 测试模块全局变量
let testWords = [];
let testIndex = 0;
let testScore = 0;

// 初始化测试模块
function initTestModule() {
    // 测试按钮事件监听
    document.getElementById('start-test-btn').addEventListener('click', startTest);
    document.getElementById('next-question-btn').addEventListener('click', nextTestQuestion);
    
    // 如果有返回按钮，绑定事件
    const backButton = document.getElementById('back-to-test');
    if (backButton) {
        backButton.addEventListener('click', resetTestInterface);
    }
}

// 开始测试
function startTest() {
    const testType = document.getElementById('test-type').value;
    const testRange = document.getElementById('test-range').value;
    
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
    
    // 随机选择20个单词（或全部，如果少于20个）
    testWords = [];
    const testCount = Math.min(wordsToTest.length, 20);
    const shuffled = [...wordsToTest].sort(() => 0.5 - Math.random());
    testWords = shuffled.slice(0, testCount);
    
    // 重置测试状态
    testIndex = 0;
    testScore = 0;
    
    // 显示第一个测试题
    displayTestQuestion(testType);
}

// 显示测试题目
function displayTestQuestion(testType) {
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
    
    // 根据测试类型生成题目
    if (testType === 'word-meaning') {
        // 单词 → 含义
        testQuestion.textContent = `请选择单词 "${currentTestWord.word}" 的中文含义：`;
        
        // 生成选项（1个正确答案，3个干扰项）
        const options = generateOptions(currentTestWord, 'meaning');
        createOptions(options, currentTestWord.meaning);
    } else if (testType === 'meaning-word') {
        // 含义 → 单词
        testQuestion.textContent = `请选择 "${currentTestWord.meaning}" 对应的英文单词：`;
        
        // 生成选项
        const options = generateOptions(currentTestWord, 'word');
        createOptions(options, currentTestWord.word);
    } else if (testType === 'spelling') {
        // 拼写测试
        testQuestion.textContent = `请输入 "${currentTestWord.meaning}" 对应的英文单词：`;
        
        createSpellingInput();
    }
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

// 创建拼写输入框
function createSpellingInput() {
    const optionsContainer = document.querySelector('.test-options');
    
    const inputDiv = document.createElement('div');
    inputDiv.className = 'spelling-input';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '请输入单词...';
    input.id = 'spelling-answer';
    input.autocomplete = 'off';
    input.autocapitalize = 'none';
    
    // 添加回车键提交功能
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            nextTestQuestion();
        }
    });
    
    inputDiv.appendChild(input);
    optionsContainer.appendChild(inputDiv);
    
    // 自动聚焦输入框
    setTimeout(() => input.focus(), 100);
}

// 生成测试选项
function generateOptions(currentWord, type) {
    // 正确答案
    const correctAnswer = type === 'meaning' ? currentWord.meaning : currentWord.word;
    
    // 随机选择3个干扰项
    const otherWords = words.filter(w => w.id !== currentWord.id);
    const shuffled = [...otherWords].sort(() => 0.5 - Math.random());
    const distractors = shuffled.slice(0, 3).map(w => type === 'meaning' ? w.meaning : w.word);
    
    // 合并选项并随机排序
    const options = [correctAnswer, ...distractors];
    return options.sort(() => 0.5 - Math.random());
}

// 下一个测试题
function nextTestQuestion() {
    const testType = document.getElementById('test-type').value;
    
    // 检查答案
    if (testType === 'spelling') {
        const input = document.getElementById('spelling-answer');
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = testWords[testIndex].word.toLowerCase();
        
        if (userAnswer === correctAnswer) {
            testScore++;
        }
    } else {
        const selectedOption = document.querySelector('.option.selected');
        
        if (selectedOption && selectedOption.dataset.correct === 'true') {
            testScore++;
        }
    }
    
    // 进入下一题
    testIndex++;
    displayTestQuestion(testType);
}

// 完成测试
function finishTest() {
    const accuracy = Math.round((testScore / testWords.length) * 100);
    
    // 保存测试正确率
    localStorage.setItem('testAccuracy', `${accuracy}%`);
    
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
            <button id="back-to-test" class="back-btn">返回</button>
        </div>
    `;
    
    // 更新统计信息
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // 返回按钮事件
    document.getElementById('back-to-test').addEventListener('click', resetTestInterface);
}

// 重置测试界面
function resetTestInterface() {
    const testCard = document.querySelector('.test-card');
    testCard.innerHTML = `
        <div class="test-progress">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <span class="progress-text">1/20</span>
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

// 导出测试模块函数
window.TestModule = {
    init: initTestModule,
    start: startTest,
    next: nextTestQuestion,
    finish: finishTest
};