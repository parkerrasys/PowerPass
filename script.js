
document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked button and corresponding tab
            btn.classList.add('active');
            const tabId = `${btn.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });

    // File Upload Functionality
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const imagePreview = document.getElementById('imagePreview');
    const processImageBtn = document.getElementById('processImageBtn');
    const uploadStatus = document.getElementById('uploadStatus');

    // Trigger file input when upload button is clicked
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // File Drop event
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle selected files from file input
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length) {
            const file = files[0];
            if (file.type.match('image.*')) {
                displayImagePreview(file);
                uploadStatus.innerHTML = `<p class="status-success">File "${file.name}" ready for processing!</p>`;
                processImageBtn.disabled = false;
            } else {
                uploadStatus.innerHTML = `<p class="status-error">Please upload an image file.</p>`;
                imagePreview.style.display = 'none';
                processImageBtn.disabled = true;
            }
        }
    }

    function displayImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }

    // Process Image Button
    processImageBtn.addEventListener('click', () => {
        // This would normally call an API to process the image
        // For now, we'll simulate processing with a timeout
        uploadStatus.innerHTML = `<p class="status-processing">Processing image...</p>`;
        
        setTimeout(() => {
            // Simulate extracted grades (this would come from the API)
            const mockSummativeGrades = [
                { name: "Unit 1 Test", score: 85, total: 100 },
                { name: "Project", score: 92, total: 100 },
                { name: "Midterm Exam", score: 78, total: 100 }
            ];
            
            const mockFormativeGrades = [
                { name: "Homework 1", score: 10, total: 10 },
                { name: "Quiz 1", score: 8, total: 10 },
                { name: "Homework 2", score: 9, total: 10 }
            ];
            
            calculateAndDisplayResults(mockSummativeGrades, mockFormativeGrades);
            uploadStatus.innerHTML = `<p class="status-success">Image processed successfully!</p>`;
        }, 2000);
    });

    // Manual Grade Entry Functionality
    const addSummativeBtn = document.getElementById('addSummative');
    const addFormativeBtn = document.getElementById('addFormative');
    const summativeGradesContainer = document.getElementById('summativeGrades');
    const formativeGradesContainer = document.getElementById('formativeGrades');
    const calculateManualBtn = document.getElementById('calculateManualBtn');

    // Add new grade entry
    addSummativeBtn.addEventListener('click', () => {
        addGradeEntry(summativeGradesContainer);
    });

    addFormativeBtn.addEventListener('click', () => {
        addGradeEntry(formativeGradesContainer);
    });

    function addGradeEntry(container) {
        const gradeEntry = document.createElement('div');
        gradeEntry.className = 'grade-entry';
        gradeEntry.innerHTML = `
            <input type="text" placeholder="Assignment Name" class="assignment-name">
            <input type="number" placeholder="Score" class="score" min="0">
            <input type="number" placeholder="Total" class="total" min="1">
            <button class="remove-grade"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(gradeEntry);

        // Add event listener to remove button
        const removeBtn = gradeEntry.querySelector('.remove-grade');
        removeBtn.addEventListener('click', () => {
            container.removeChild(gradeEntry);
        });
    }

    // Add event listener for existing remove buttons
    document.querySelectorAll('.remove-grade').forEach(btn => {
        btn.addEventListener('click', () => {
            const entry = btn.closest('.grade-entry');
            entry.parentNode.removeChild(entry);
        });
    });

    // Calculate manual grades
    calculateManualBtn.addEventListener('click', () => {
        const summativeGrades = getGradesFromContainer(summativeGradesContainer);
        const formativeGrades = getGradesFromContainer(formativeGradesContainer);
        
        if (validateGrades(summativeGrades, formativeGrades)) {
            calculateAndDisplayResults(summativeGrades, formativeGrades);
        }
    });

    function getGradesFromContainer(container) {
        const grades = [];
        const entries = container.querySelectorAll('.grade-entry');
        
        entries.forEach(entry => {
            const nameInput = entry.querySelector('.assignment-name');
            const scoreInput = entry.querySelector('.score');
            const totalInput = entry.querySelector('.total');
            
            if (nameInput.value && scoreInput.value && totalInput.value) {
                grades.push({
                    name: nameInput.value,
                    score: parseFloat(scoreInput.value),
                    total: parseFloat(totalInput.value)
                });
            }
        });
        
        return grades;
    }

    function validateGrades(summativeGrades, formativeGrades) {
        if (summativeGrades.length === 0 && formativeGrades.length === 0) {
            alert('Please enter at least one grade.');
            return false;
        }
        
        // Validate scores don't exceed total
        const allGrades = [...summativeGrades, ...formativeGrades];
        for (const grade of allGrades) {
            if (grade.score > grade.total) {
                alert(`Score for "${grade.name}" cannot be greater than the total.`);
                return false;
            }
        }
        
        return true;
    }

    // Calculate and display results
    function calculateAndDisplayResults(summativeGrades, formativeGrades) {
        // Calculate summative percentage
        let summativeTotal = 0;
        let summativeEarned = 0;
        
        summativeGrades.forEach(grade => {
            summativeEarned += grade.score;
            summativeTotal += grade.total;
        });
        
        const summativePercentage = summativeTotal ? (summativeEarned / summativeTotal) * 100 : 0;
        
        // Calculate formative percentage
        let formativeTotal = 0;
        let formativeEarned = 0;
        
        formativeGrades.forEach(grade => {
            formativeEarned += grade.score;
            formativeTotal += grade.total;
        });
        
        const formativePercentage = formativeTotal ? (formativeEarned / formativeTotal) * 100 : 0;
        
        // Calculate final grade (70% summative, 30% formative)
        let finalGrade;
        
        if (summativeTotal === 0 && formativeTotal === 0) {
            finalGrade = 0;
        } else if (summativeTotal === 0) {
            finalGrade = formativePercentage;
        } else if (formativeTotal === 0) {
            finalGrade = summativePercentage;
        } else {
            finalGrade = (summativePercentage * 0.7) + (formativePercentage * 0.3);
        }
        
        // Update the UI
        document.getElementById('summativePercentage').textContent = `${summativePercentage.toFixed(2)}%`;
        document.getElementById('formativePercentage').textContent = `${formativePercentage.toFixed(2)}%`;
        document.getElementById('finalGrade').textContent = `${finalGrade.toFixed(1)}%`;
        
        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        
        // Generate recommendations
        generateRecommendations(finalGrade, summativeGrades, formativeGrades);
        
        // Generate grade breakdown
        generateGradeBreakdown(summativeGrades, formativeGrades);
    }

    function generateRecommendations(finalGrade, summativeGrades, formativeGrades) {
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = '';
        
        // Add recommendations based on grade
        if (finalGrade >= 90) {
            addRecommendation('good', 'trophy', 'You\'re doing excellent! Keep up the great work.');
        } else if (finalGrade >= 80) {
            addRecommendation('good', 'thumbs-up', 'You\'re doing well. Focus on improving your lower scores.');
        } else if (finalGrade >= 70) {
            addRecommendation('warning', 'exclamation-triangle', 'Your grade is average. Consider studying more for summative assessments.');
        } else {
            addRecommendation('danger', 'exclamation-circle', 'Your grade needs improvement. Schedule time with your teacher for extra help.');
        }
        
        // Analyze specific assignments
        const lowestSummative = findLowestGrade(summativeGrades);
        if (lowestSummative && lowestSummative.percentage < 70) {
            addRecommendation('warning', 'file-alt', `Your lowest summative grade is "${lowestSummative.name}" (${lowestSummative.percentage.toFixed(1)}%). Focus on improving in this area.`);
        }
        
        const lowestFormative = findLowestGrade(formativeGrades);
        if (lowestFormative && lowestFormative.percentage < 70) {
            addRecommendation('warning', 'clipboard-check', `Your lowest formative grade is "${lowestFormative.name}" (${lowestFormative.percentage.toFixed(1)}%). Work on this type of assignment.`);
        }
        
        // Grade improvement recommendations
        if (finalGrade < 90) {
            const targetGrade = 90;
            const improvementNeeded = (targetGrade - finalGrade).toFixed(1);
            addRecommendation('info', 'arrow-up', `To reach an A (90%), you need to improve your overall grade by ${improvementNeeded}%.`);
            
            // Recommend what score is needed on next summative
            if (summativeGrades.length > 0) {
                const nextSummativeScore = calculateRequiredScore(finalGrade, targetGrade, 100, 0.7);
                if (nextSummativeScore <= 100) {
                    addRecommendation('info', 'lightbulb', `If you score ${nextSummativeScore.toFixed(0)}% on your next summative assessment (worth 100 points), you could reach an A.`);
                }
            }
        }
    }

    function findLowestGrade(grades) {
        if (grades.length === 0) return null;
        
        let lowest = { percentage: 100 };
        
        grades.forEach(grade => {
            const percentage = (grade.score / grade.total) * 100;
            if (percentage < lowest.percentage) {
                lowest = {
                    name: grade.name,
                    percentage: percentage
                };
            }
        });
        
        return lowest;
    }

    function calculateRequiredScore(currentGrade, targetGrade, maxPoints, weight) {
        // Simple estimation
        const currentPoints = currentGrade / 100;
        const targetPoints = targetGrade / 100;
        const pointsNeeded = (targetPoints - currentPoints) / weight;
        return Math.min(100, Math.max(0, pointsNeeded * 100));
    }

    function addRecommendation(type, icon, text) {
        const recommendationsList = document.getElementById('recommendationsList');
        const recommendation = document.createElement('div');
        recommendation.className = `recommendation-item ${type}`;
        recommendation.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <p>${text}</p>
        `;
        recommendationsList.appendChild(recommendation);
    }

    function generateGradeBreakdown(summativeGrades, formativeGrades) {
        const gradeBreakdown = document.getElementById('gradeBreakdown');
        gradeBreakdown.innerHTML = '';
        
        // Add summative grades
        summativeGrades.forEach(grade => {
            addGradeItem(gradeBreakdown, grade, 'Summative');
        });
        
        // Add formative grades
        formativeGrades.forEach(grade => {
            addGradeItem(gradeBreakdown, grade, 'Formative');
        });
    }

    function addGradeItem(container, grade, type) {
        const percentage = (grade.score / grade.total) * 100;
        const item = document.createElement('div');
        item.className = 'grade-item';
        item.innerHTML = `
            <h4>${grade.name}</h4>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Score:</strong> ${grade.score}/${grade.total}</p>
            <p><strong>Percentage:</strong> ${percentage.toFixed(1)}%</p>
        `;
        container.appendChild(item);
    }
});
