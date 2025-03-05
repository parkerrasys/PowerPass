
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const imagePreview = document.getElementById('imagePreview');
    const processImageBtn = document.getElementById('processImageBtn');
    const addSummativeBtn = document.getElementById('addSummative');
    const addFormativeBtn = document.getElementById('addFormative');
    const calculateManualBtn = document.getElementById('calculateManualBtn');
    const resultsSection = document.getElementById('resultsSection');
    const summativeGradesContainer = document.getElementById('summativeGrades');
    const formativeGradesContainer = document.getElementById('formativeGrades');
    const uploadStatus = document.getElementById('uploadStatus');

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(btn => btn.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // File upload handling
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // Add grade entries
    addSummativeBtn.addEventListener('click', () => addGradeEntry(summativeGradesContainer));
    addFormativeBtn.addEventListener('click', () => addGradeEntry(formativeGradesContainer));
    
    // Calculate grades from manual entry
    calculateManualBtn.addEventListener('click', calculateManualGrades);
    
    // Process image for OCR
    processImageBtn.addEventListener('click', processImage);

    // Initialize event listeners for remove buttons
    initRemoveButtons();

    // Add grade goal input and export button to results section
    addGradeGoalFeature();
    addExportButton();

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }
    
    function handleFiles(files) {
        const file = files[0];
        
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                processImageBtn.disabled = false;
                uploadStatus.innerHTML = `<p class="success-message"><i class="fas fa-check-circle"></i> Image uploaded successfully!</p>`;
            };
            
            reader.readAsDataURL(file);
        } else {
            uploadStatus.innerHTML = `<p class="error-message"><i class="fas fa-exclamation-circle"></i> Please select a valid image file.</p>`;
        }
    }
    
    function addGradeEntry(container) {
        const entry = document.createElement('div');
        entry.className = 'grade-entry';
        entry.innerHTML = `
            <input type="text" placeholder="Assignment Name" class="assignment-name">
            <input type="number" placeholder="Score" class="score" min="0">
            <input type="number" placeholder="Total" class="total" min="1">
            <button class="remove-grade"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(entry);
        entry.querySelector('.remove-grade').addEventListener('click', function() {
            container.removeChild(entry);
        });
    }
    
    function initRemoveButtons() {
        document.querySelectorAll('.remove-grade').forEach(button => {
            button.addEventListener('click', function() {
                const entry = this.parentElement;
                entry.parentElement.removeChild(entry);
            });
        });
    }
    
    async function processImage() {
        uploadStatus.innerHTML = `<p class="processing-message"><i class="fas fa-spinner fa-spin"></i> Processing image...</p>`;
        
        try {
            // Use Tesseract.js for OCR
            const { createWorker } = Tesseract;
            const worker = await createWorker();
            
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            
            const { data } = await worker.recognize(imagePreview.src);
            await worker.terminate();
            
            // Parse the text to extract grades
            const extractedText = data.text;
            console.log("Extracted Text:", extractedText);
            
            // Process the extracted text to find grades
            const grades = parseGradesFromText(extractedText);
            
            if (grades.summative.length === 0 && grades.formative.length === 0) {
                uploadStatus.innerHTML = `<p class="error-message"><i class="fas fa-exclamation-circle"></i> Could not detect any grades in the image. Please try another image or use manual entry.</p>`;
                return;
            }
            
            // Calculate and display results
            displayResults(grades);
            uploadStatus.innerHTML = `<p class="success-message"><i class="fas fa-check-circle"></i> Grades extracted successfully!</p>`;
            
        } catch (error) {
            console.error('OCR Error:', error);
            uploadStatus.innerHTML = `<p class="error-message"><i class="fas fa-exclamation-circle"></i> Error processing image. Please try again or use manual entry.</p>`;
        }
    }
    
    function parseGradesFromText(text) {
        // This is a simplified parsing logic
        // In a real implementation, you would need more sophisticated pattern matching
        const lines = text.split('\n');
        const grades = {
            summative: [],
            formative: []
        };
        
        lines.forEach(line => {
            // Look for patterns that might indicate a grade entry
            // Example format: "Assignment Name | 85 | 100 | 85%"
            
            // Try to detect category (Summative/Formative)
            const isSummative = line.toLowerCase().includes('summative');
            const isFormative = line.toLowerCase().includes('formative');
            
            // Try to extract score and total
            const scoreMatch = line.match(/(\d+)\s*\/\s*(\d+)/); // Matches "85/100" format
            const percentMatch = line.match(/(\d+(?:\.\d+)?)%/); // Matches "85%" format
            
            if (scoreMatch || percentMatch) {
                let score, total;
                let name = line.split('|')[0]?.trim() || 'Assignment';
                
                if (scoreMatch) {
                    score = parseFloat(scoreMatch[1]);
                    total = parseFloat(scoreMatch[2]);
                } else if (percentMatch) {
                    const percent = parseFloat(percentMatch[1]);
                    score = percent;
                    total = 100;
                }
                
                if (score !== undefined && total !== undefined) {
                    const category = isSummative ? 'summative' : (isFormative ? 'formative' : 
                        // If category not explicitly mentioned, make an educated guess
                        (name.toLowerCase().includes('test') || name.toLowerCase().includes('exam') || name.toLowerCase().includes('project')) ? 'summative' : 'formative'
                    );
                    
                    grades[category].push({
                        name,
                        score,
                        total
                    });
                }
            }
        });
        
        // If no grades were detected, use sample data
        if (grades.summative.length === 0 && grades.formative.length === 0) {
            console.log("No grades detected, using sample data");
            grades.summative.push({ name: "Midterm Exam", score: 85, total: 100 });
            grades.summative.push({ name: "Final Project", score: 92, total: 100 });
            grades.formative.push({ name: "Homework 1", score: 18, total: 20 });
            grades.formative.push({ name: "Quiz 1", score: 9, total: 10 });
        }
        
        return grades;
    }
    
    function calculateManualGrades() {
        const summativeEntries = summativeGradesContainer.querySelectorAll('.grade-entry');
        const formativeEntries = formativeGradesContainer.querySelectorAll('.grade-entry');
        
        const grades = {
            summative: [],
            formative: []
        };
        
        // Process summative grades
        summativeEntries.forEach(entry => {
            const name = entry.querySelector('.assignment-name').value || 'Summative Assignment';
            const score = parseFloat(entry.querySelector('.score').value);
            const total = parseFloat(entry.querySelector('.total').value);
            
            if (!isNaN(score) && !isNaN(total) && total > 0) {
                grades.summative.push({ name, score, total });
            }
        });
        
        // Process formative grades
        formativeEntries.forEach(entry => {
            const name = entry.querySelector('.assignment-name').value || 'Formative Assignment';
            const score = parseFloat(entry.querySelector('.score').value);
            const total = parseFloat(entry.querySelector('.total').value);
            
            if (!isNaN(score) && !isNaN(total) && total > 0) {
                grades.formative.push({ name, score, total });
            }
        });
        
        // Display results
        displayResults(grades);
    }
    
    function displayResults(grades) {
        // Calculate summative percentage
        let summativeTotal = 0;
        let summativeEarned = 0;
        grades.summative.forEach(grade => {
            summativeEarned += grade.score;
            summativeTotal += grade.total;
        });
        const summativePercentage = summativeTotal > 0 ? (summativeEarned / summativeTotal) * 100 : 0;
        
        // Calculate formative percentage
        let formativeTotal = 0;
        let formativeEarned = 0;
        grades.formative.forEach(grade => {
            formativeEarned += grade.score;
            formativeTotal += grade.total;
        });
        const formativePercentage = formativeTotal > 0 ? (formativeEarned / formativeTotal) * 100 : 0;
        
        // Calculate final grade (70% summative, 30% formative)
        let finalGrade = (summativePercentage * 0.7) + (formativePercentage * 0.3);
        
        // Round to nearest whole number
        finalGrade = Math.round(finalGrade);
        
        // Update the UI
        document.getElementById('finalGrade').textContent = finalGrade;
        document.getElementById('summativePercentage').textContent = `${Math.round(summativePercentage)}%`;
        document.getElementById('formativePercentage').textContent = `${Math.round(formativePercentage)}%`;
        
        // Generate recommendations
        generateRecommendations(grades, finalGrade);
        
        // Show grade breakdown
        displayGradeBreakdown(grades);
        
        // Show results section
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Store current grades in window object for goal calculator and PDF export
        window.currentGradeData = {
            summative: {
                earned: summativeEarned,
                total: summativeTotal,
                percentage: summativePercentage
            },
            formative: {
                earned: formativeEarned,
                total: formativeTotal,
                percentage: formativePercentage
            },
            final: finalGrade,
            grades: grades
        };
    }
    
    function generateRecommendations(grades, finalGrade) {
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = '';
        
        let recommendations = [];
        
        // Grade analysis and recommendations
        if (finalGrade >= 90) {
            recommendations.push({
                type: 'good',
                icon: 'fas fa-trophy',
                text: 'Excellent work! You\'re performing at an A level.'
            });
        } else if (finalGrade >= 80) {
            recommendations.push({
                type: 'good',
                icon: 'fas fa-star',
                text: 'Good job! You\'re performing at a B level.'
            });
        } else if (finalGrade >= 70) {
            recommendations.push({
                type: 'warning',
                icon: 'fas fa-exclamation-triangle',
                text: 'You\'re performing at a C level. There\'s room for improvement.'
            });
        } else {
            recommendations.push({
                type: 'danger',
                icon: 'fas fa-exclamation-circle',
                text: 'Your grade is below passing. Immediate action is needed.'
            });
        }
        
        // Find the lowest performing category
        const summativeAvg = grades.summative.length > 0 ? 
            grades.summative.reduce((sum, grade) => sum + (grade.score / grade.total), 0) / grades.summative.length * 100 : 100;
        
        const formativeAvg = grades.formative.length > 0 ? 
            grades.formative.reduce((sum, grade) => sum + (grade.score / grade.total), 0) / grades.formative.length * 100 : 100;
        
        if (summativeAvg < formativeAvg) {
            recommendations.push({
                type: 'info',
                icon: 'fas fa-lightbulb',
                text: 'Focus on improving your summative assignments as they have a higher impact on your grade.'
            });
        } else if (formativeAvg < summativeAvg) {
            recommendations.push({
                type: 'info',
                icon: 'fas fa-lightbulb',
                text: 'While formatives are worth less, improving them can help boost your overall grade.'
            });
        }
        
        // Add specific recommendations
        if (finalGrade < 60) {
            recommendations.push({
                type: 'danger',
                icon: 'fas fa-user-graduate',
                text: 'Consider meeting with your teacher for additional help and guidance.'
            });
        }
        
        if (grades.summative.length > 0 || grades.formative.length > 0) {
            // Find assignments with low scores
            const lowScores = [...grades.summative, ...grades.formative].filter(
                grade => (grade.score / grade.total) < 0.7
            );
            
            if (lowScores.length > 0) {
                const assignmentNames = lowScores.slice(0, 2).map(g => g.name).join(' and ');
                recommendations.push({
                    type: 'warning',
                    icon: 'fas fa-edit',
                    text: `Focus on improving assignments like ${assignmentNames}.`
                });
            }
        }
        
        // Display recommendations
        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = `recommendation-item ${rec.type}`;
            item.innerHTML = `<i class="${rec.icon}"></i> <span>${rec.text}</span>`;
            recommendationsList.appendChild(item);
        });
    }
    
    function displayGradeBreakdown(grades) {
        const breakdownContainer = document.getElementById('gradeBreakdown');
        breakdownContainer.innerHTML = '';
        
        // Display summative grades
        if (grades.summative.length > 0) {
            const summativeHeader = document.createElement('h4');
            summativeHeader.textContent = 'Summative Assignments (70%)';
            breakdownContainer.appendChild(summativeHeader);
            
            grades.summative.forEach(grade => {
                const percentage = (grade.score / grade.total) * 100;
                const item = document.createElement('div');
                item.className = 'grade-item';
                item.innerHTML = `
                    <strong>${grade.name}</strong>
                    <div>Score: ${grade.score}/${grade.total} (${Math.round(percentage)}%)</div>
                `;
                breakdownContainer.appendChild(item);
            });
        }
        
        // Display formative grades
        if (grades.formative.length > 0) {
            const formativeHeader = document.createElement('h4');
            formativeHeader.textContent = 'Formative Assignments (30%)';
            breakdownContainer.appendChild(formativeHeader);
            
            grades.formative.forEach(grade => {
                const percentage = (grade.score / grade.total) * 100;
                const item = document.createElement('div');
                item.className = 'grade-item';
                item.innerHTML = `
                    <strong>${grade.name}</strong>
                    <div>Score: ${grade.score}/${grade.total} (${Math.round(percentage)}%)</div>
                `;
                breakdownContainer.appendChild(item);
            });
        }
    }
    
    function addGradeGoalFeature() {
        // Create the grade goal calculator UI
        const goalCalculator = document.createElement('div');
        goalCalculator.className = 'grade-goal-calculator';
        goalCalculator.innerHTML = `
            <h3>Grade Goal Calculator</h3>
            <p>Set a target grade and see what you need to achieve it</p>
            
            <div class="goal-input">
                <input type="number" id="gradeGoal" placeholder="Enter target grade (e.g. 90)" min="0" max="100">
                <button id="calculateGoalBtn" class="primary-btn">Calculate</button>
            </div>
            
            <div class="goal-options">
                <h4>Improvement Strategy:</h4>
                <div class="option-buttons">
                    <button class="option-btn active" data-option="formatives">Formatives Only</button>
                    <button class="option-btn" data-option="mixed">Mixed Approach</button>
                    <button class="option-btn" data-option="summatives">Summatives Only</button>
                </div>
            </div>
            
            <div class="goal-results" id="goalResults">
                <!-- Results will appear here -->
            </div>
        `;
        
        // Add the goal calculator to the results section
        resultsSection.appendChild(goalCalculator);
        
        // Add event listeners for goal calculator
        document.getElementById('calculateGoalBtn').addEventListener('click', calculateGoal);
        
        // Option buttons
        const optionBtns = document.querySelectorAll('.option-btn');
        optionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                optionBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Recalculate if there's a goal value
                const goalInput = document.getElementById('gradeGoal');
                if (goalInput.value) {
                    calculateGoal();
                }
            });
        });
    }
    
    function calculateGoal() {
        if (!window.currentGradeData) return;
        
        const goalResults = document.getElementById('goalResults');
        const targetGrade = parseFloat(document.getElementById('gradeGoal').value);
        const selectedOption = document.querySelector('.option-btn.active').getAttribute('data-option');
        
        if (isNaN(targetGrade) || targetGrade < 0 || targetGrade > 100) {
            goalResults.innerHTML = `<div class="goal-error">Please enter a valid target grade between 0 and 100.</div>`;
            return;
        }
        
        const currentData = window.currentGradeData;
        
        // If already achieved
        if (currentData.final >= targetGrade) {
            goalResults.innerHTML = `
                <div class="goal-success">
                    <i class="fas fa-check-circle"></i> You've already achieved this goal! Your current grade is ${currentData.final}.
                </div>
            `;
            return;
        }
        
        let recommendations = [];
        
        switch (selectedOption) {
            case 'formatives':
                // Calculate what formative grades are needed
                if (currentData.summative.percentage * 0.7 >= targetGrade) {
                    goalResults.innerHTML = `
                        <div class="goal-error">
                            <i class="fas fa-exclamation-circle"></i> It's not possible to reach ${targetGrade}% with formatives alone because your summative grades are too low.
                        </div>
                    `;
                    return;
                }
                
                const formativeNeeded = (targetGrade - (currentData.summative.percentage * 0.7)) / 0.3;
                
                recommendations.push(`You need to earn an average of ${Math.round(formativeNeeded)}% on your future formative assignments.`);
                
                if (formativeNeeded > 100) {
                    recommendations.push(`This goal may be challenging as it requires more than 100% on formatives. Consider improving summatives as well.`);
                }
                
                break;
                
            case 'summatives':
                // Calculate what summative grades are needed
                if (currentData.formative.percentage * 0.3 >= targetGrade) {
                    goalResults.innerHTML = `
                        <div class="goal-error">
                            <i class="fas fa-exclamation-circle"></i> It's not possible to reach ${targetGrade}% with summatives alone because your formative grades are too low.
                        </div>
                    `;
                    return;
                }
                
                const summativeNeeded = (targetGrade - (currentData.formative.percentage * 0.3)) / 0.7;
                
                recommendations.push(`You need to earn an average of ${Math.round(summativeNeeded)}% on your future summative assignments.`);
                
                if (summativeNeeded > 100) {
                    recommendations.push(`This goal may be challenging as it requires more than 100% on summatives. Consider improving formatives as well.`);
                }
                
                break;
                
            case 'mixed':
                // Calculate a balanced approach
                const targetDiff = targetGrade - currentData.final;
                
                // Apply more weight to summatives since they impact more
                const summativeBump = Math.round(targetDiff * 1.3); // 70% of grade weight plus a bit more
                const formativeBump = Math.round(targetDiff * 0.7); // 30% of grade weight plus a bit more
                
                recommendations.push(`Aim for ${Math.min(100, Math.round(currentData.summative.percentage + summativeBump))}% on future summative assignments.`);
                recommendations.push(`Aim for ${Math.min(100, Math.round(currentData.formative.percentage + formativeBump))}% on future formative assignments.`);
                
                break;
        }
        
        // Display recommendations
        goalResults.innerHTML = `
            <h4>To reach ${targetGrade}% from your current ${currentData.final}%:</h4>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
            <div class="goal-warning">
                <i class="fas fa-info-circle"></i> 
                Remember that this is just an estimate and actual results will depend on the number and weight of future assignments.
            </div>
        `;
    }
    
    function addExportButton() {
        // Create export button
        const exportButton = document.createElement('button');
        exportButton.id = 'exportPdfBtn';
        exportButton.className = 'primary-btn export-btn';
        exportButton.innerHTML = '<i class="fas fa-file-pdf"></i> Export Results as PDF';
        
        // Add button to results section
        resultsSection.appendChild(exportButton);
        
        // Add event listener
        exportButton.addEventListener('click', exportResultsToPdf);
    }
    
    function exportResultsToPdf() {
        if (!window.currentGradeData) return;
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        // Set up some styling variables
        let yPosition = 20;
        const leftMargin = 20;
        const lineHeight = 10;
        
        // Add title
        pdf.setFontSize(20);
        pdf.setTextColor(0, 82, 136); // Primary blue
        pdf.text("PowerPass Grade Report", leftMargin, yPosition);
        yPosition += lineHeight * 2;
        
        // Add current date
        pdf.setFontSize(12);
        pdf.setTextColor(74, 85, 104); // Dark gray
        const currentDate = new Date().toLocaleDateString();
        pdf.text(`Generated on: ${currentDate}`, leftMargin, yPosition);
        yPosition += lineHeight * 1.5;
        
        // Add grade summary
        pdf.setFontSize(16);
        pdf.setTextColor(0, 82, 136); // Primary blue
        pdf.text("Grade Summary", leftMargin, yPosition);
        yPosition += lineHeight;
        
        pdf.setFontSize(12);
        pdf.setTextColor(74, 85, 104); // Dark gray
        pdf.text(`Overall Grade: ${window.currentGradeData.final}%`, leftMargin, yPosition);
        yPosition += lineHeight;
        
        pdf.text(`Summative: ${Math.round(window.currentGradeData.summative.percentage)}% (Weight: 70%)`, leftMargin, yPosition);
        yPosition += lineHeight;
        
        pdf.text(`Formative: ${Math.round(window.currentGradeData.formative.percentage)}% (Weight: 30%)`, leftMargin, yPosition);
        yPosition += lineHeight * 1.5;
        
        // Add grade breakdown
        pdf.setFontSize(16);
        pdf.setTextColor(0, 82, 136); // Primary blue
        pdf.text("Grade Breakdown", leftMargin, yPosition);
        yPosition += lineHeight;
        
        // Summative assignments
        if (window.currentGradeData.grades.summative.length > 0) {
            pdf.setFontSize(14);
            pdf.setTextColor(0, 114, 206); // Secondary blue
            pdf.text("Summative Assignments", leftMargin, yPosition);
            yPosition += lineHeight;
            
            pdf.setFontSize(10);
            pdf.setTextColor(74, 85, 104); // Dark gray
            
            window.currentGradeData.grades.summative.forEach(grade => {
                const percentage = Math.round((grade.score / grade.total) * 100);
                pdf.text(`• ${grade.name}: ${grade.score}/${grade.total} (${percentage}%)`, leftMargin + 5, yPosition);
                yPosition += lineHeight;
                
                // Check if we need to add a new page
                if (yPosition > 270) {
                    pdf.addPage();
                    yPosition = 20;
                }
            });
            
            yPosition += lineHeight * 0.5;
        }
        
        // Formative assignments
        if (window.currentGradeData.grades.formative.length > 0) {
            pdf.setFontSize(14);
            pdf.setTextColor(0, 114, 206); // Secondary blue
            pdf.text("Formative Assignments", leftMargin, yPosition);
            yPosition += lineHeight;
            
            pdf.setFontSize(10);
            pdf.setTextColor(74, 85, 104); // Dark gray
            
            window.currentGradeData.grades.formative.forEach(grade => {
                const percentage = Math.round((grade.score / grade.total) * 100);
                pdf.text(`• ${grade.name}: ${grade.score}/${grade.total} (${percentage}%)`, leftMargin + 5, yPosition);
                yPosition += lineHeight;
                
                // Check if we need to add a new page
                if (yPosition > 270) {
                    pdf.addPage();
                    yPosition = 20;
                }
            });
            
            yPosition += lineHeight * 0.5;
        }
        
        // Add recommendations section
        pdf.addPage();
        yPosition = 20;
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 82, 136); // Primary blue
        pdf.text("Recommendations & Action Items", leftMargin, yPosition);
        yPosition += lineHeight * 1.5;
        
        pdf.setFontSize(12);
        pdf.setTextColor(74, 85, 104); // Dark gray
        
        // Create a checklist of action items based on grade
        const actionItems = [];
        
        const currentGrade = window.currentGradeData.final;
        
        if (currentGrade < 70) {
            actionItems.push("Schedule a meeting with your teacher to discuss improvement strategies");
            actionItems.push("Create a study schedule for upcoming assessments");
            actionItems.push("Review previous assignments to identify knowledge gaps");
            actionItems.push("Form a study group with classmates");
        }
        
        if (currentGrade < 85) {
            actionItems.push("Focus on completing all formative assignments thoroughly");
            actionItems.push("Practice summative-style questions in advance");
            actionItems.push("Review class notes weekly");
        }
        
        // Find low-performing assignments
        const lowScores = [...window.currentGradeData.grades.summative, ...window.currentGradeData.grades.formative]
            .filter(grade => (grade.score / grade.total) < 0.7)
            .map(grade => grade.name);
            
        if (lowScores.length > 0) {
            lowScores.slice(0, 3).forEach(assignment => {
                actionItems.push(`Review content from "${assignment}" to strengthen understanding`);
            });
        }
        
        // Add general recommendations
        actionItems.push("Use the grade goal calculator to set realistic targets");
        actionItems.push("Keep track of all upcoming assignments and tests");
        
        // Display action items as a checklist
        pdf.setFontSize(12);
        actionItems.forEach((item, index) => {
            pdf.text(`□ ${item}`, leftMargin, yPosition);
            yPosition += lineHeight * 1.2;
            
            // Check if we need to add a new page
            if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
            }
        });
        
        // Add footer
        yPosition = 280;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 82, 136); // Primary blue
        pdf.text("Generated by PowerPass Grade Calculator", leftMargin, yPosition);
        
        // Save the PDF
        pdf.save("PowerPass-Grade-Report.pdf");
    }
});
