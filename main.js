 document.addEventListener('DOMContentLoaded', function() {
            const fileInput = document.getElementById('fileInput');
            const fileInputLabel = document.getElementById('fileInputLabel');
            const fileInfo = document.getElementById('fileInfo');
            const fileName = document.getElementById('fileName');
            const serialCount = document.getElementById('serialCount');
            const generateBtn = document.getElementById('generateBtn');
            const clearBtn = document.getElementById('clearBtn');
            const downloadAllBtn = document.getElementById('downloadAllBtn');
            const qrGrid = document.getElementById('qrGrid');
            const noData = document.getElementById('noData');
            const progressBar = document.getElementById('progressBar');
            const progress = document.getElementById('progress');
            const pagination = document.getElementById('pagination');
            const prevPageBtn = document.getElementById('prevPageBtn');
            const nextPageBtn = document.getElementById('nextPageBtn');
            const pageInfo = document.getElementById('pageInfo');
            const paginationInfo = document.getElementById('paginationInfo');
            const currentRange = document.getElementById('currentRange');
            const totalItems = document.getElementById('totalItems');
            
            let serialNumbers = [];
            let qrCodes = [];
            let currentPage = 1;
            const itemsPerPage = 100;
            let totalPages = 1;
            
            // Fayl yuklashni qayta ishlash
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                // Progress bar ko'rsatish
                progressBar.style.display = 'block';
                progress.style.width = '30%';
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = e.target.result;
                    processFile(data, file);
                };
                
                // Fayl turiga qarab o'qish
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    reader.readAsArrayBuffer(file);
                } else {
                    reader.readAsText(file);
                }
            });
            
            // Fayl turlarini qayta ishlash
            function processFile(data, file) {
                serialNumbers = [];
                
                // Fayl nomini ko'rsatish
                fileName.textContent = file.name;
                fileInfo.style.display = 'block';
                progress.style.width = '60%';
                
                try {
                    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        // Excel faylni qayta ishlash
                        processExcelFile(data);
                    } else if (file.name.endsWith('.csv')) {
                        // CSV faylni qayta ishlash
                        processCSVFile(data);
                    } else {
                        // TXT faylni qayta ishlash
                        processTextFile(data);
                    }
                    
                    // Seriya raqamlar sonini ko'rsatish
                    serialCount.textContent = serialNumbers.length;
                    
                    // QR kod yaratish tugmasini faollashtirish
                    generateBtn.disabled = serialNumbers.length === 0;
                    
                    if (serialNumbers.length === 0) {
                        noData.style.display = 'block';
                        alert('Faylda hech qanday seriya raqami topilmadi!');
                    }
                    
                    progress.style.width = '100%';
                    setTimeout(() => {
                        progressBar.style.display = 'none';
                    }, 500);
                    
                } catch (error) {
                    console.error(error);
                    alert('Faylni qayta ishlashda xatolik yuz berdi: ' + error.message);
                    progressBar.style.display = 'none';
                }
            }
            
            // Excel faylni qayta ishlash
            function processExcelFile(data) {
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Excel ma'lumotlarini JSON formatiga o'tkazish
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Barcha qatorlarni aylanib chiqish
                for (let row of jsonData) {
                    if (Array.isArray(row)) {
                        for (let cell of row) {
                            if (cell !== null && cell !== undefined) {
                                const value = String(cell).trim();
                                if (value) serialNumbers.push(value);
                            }
                        }
                    } else if (row !== null && row !== undefined) {
                        const value = String(row).trim();
                        if (value) serialNumbers.push(value);
                    }
                }
            }
            
            // CSV faylni qayta ishlash
            function processCSVFile(data) {
                const lines = data.split(/\r?\n/);
                
                for (let line of lines) {
                    line = line.trim();
                    if (line) {
                        // Vergul, nuqta-vergul yoki tab bilan ajratilgan qiymatlarni olish
                        const separators = /[,;\t]/;
                        if (separators.test(line)) {
                            const parts = line.split(separators);
                            for (let part of parts) {
                                part = part.trim().replace(/^"|"$/g, '');
                                if (part) serialNumbers.push(part);
                            }
                        } else {
                            serialNumbers.push(line);
                        }
                    }
                }
            }
            
            // Matn faylni qayta ishlash
            function processTextFile(data) {
                const lines = data.split(/\r?\n/);
                
                for (let line of lines) {
                    line = line.trim();
                    if (line) {
                        serialNumbers.push(line);
                    }
                }
            }
            
            // QR kodlarni yaratish
            generateBtn.addEventListener('click', function() {
                if (serialNumbers.length === 0) {
                    alert('Iltimos, avval fayl yuklang!');
                    return;
                }
                
                // Progress bar ko'rsatish
                progressBar.style.display = 'block';
                progress.style.width = '0%';
                
                // Avvalgi QR kodlarni tozalash
                qrGrid.innerHTML = '';
                qrCodes = [];
                noData.style.display = 'none';
                
                // Sahifalash parametrlarini sozlash
                currentPage = 1;
                totalPages = Math.ceil(serialNumbers.length / itemsPerPage);
                updatePaginationInfo();
                
                // Har bir seriya raqam uchun QR kod yaratish
                let completed = 0;
                serialNumbers.forEach((serial, index) => {
                    setTimeout(() => {
                        createQRCode(serial, index);
                        completed++;
                        progress.style.width = `${(completed / serialNumbers.length) * 100}%`;
                        
                        if (completed === serialNumbers.length) {
                            setTimeout(() => {
                                progressBar.style.display = 'none';
                                showCurrentPage();
                            }, 500);
                        }
                    }, index * 50);
                });
                
                // Yuklab olish tugmasini faollashtirish
                downloadAllBtn.disabled = false;
            });
            
            // QR kod yaratish funksiyasi
            function createQRCode(serial, index) {
                const qrCard = document.createElement('div');
                qrCard.className = 'qr-card';
                qrCard.dataset.index = index;
                
                // Sanoq raqami
                const serialIndex = document.createElement('div');
                serialIndex.className = 'serial-index';
                serialIndex.textContent = index + 1;
                
                const serialElement = document.createElement('div');
                serialElement.className = 'serial-number';
                serialElement.textContent = serial.length > 20 ? serial.substring(0, 20) + '...' : serial;
                serialElement.title = serial;
                
                const qrCodeElement = document.createElement('div');
                qrCodeElement.className = 'qr-code';
                qrCodeElement.id = `qrcode-${index}`;
                
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.textContent = 'Yuklab olish';
                downloadBtn.onclick = function() {
                    downloadQRCode(serial, index);
                };
                
                qrCard.appendChild(serialIndex);
                qrCard.appendChild(serialElement);
                qrCard.appendChild(qrCodeElement);
                qrCard.appendChild(downloadBtn);
                
                qrGrid.appendChild(qrCard);
                
                // QR kod yaratish
                try {
                    const qrcode = new QRCode(qrCodeElement, {
                        text: serial,
                        width: 120,
                        height: 120,
                        colorDark: "#2c3e50",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    
                    qrCodes.push({
                        element: qrCodeElement,
                        serial: serial
                    });
                } catch (error) {
                    console.error(error);
                }
            }
            
            // Sahifalash ma'lumotlarini yangilash
            function updatePaginationInfo() {
                pageInfo.textContent = `Sahifa ${currentPage}/${totalPages}`;
                
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = Math.min(startIndex + itemsPerPage, serialNumbers.length);
                
                currentRange.textContent = `${startIndex + 1}-${endIndex}`;
                totalItems.textContent = serialNumbers.length;
                
                // Tugmalarni faollashtirish/faolsizlashtirish
                prevPageBtn.disabled = currentPage === 1;
                nextPageBtn.disabled = currentPage === totalPages;
                
                // Sahifalashni ko'rsatish
                pagination.style.display = totalPages > 1 ? 'flex' : 'none';
                paginationInfo.style.display = totalPages > 1 ? 'block' : 'none';
            }
            
            // Joriy sahifani ko'rsatish
            function showCurrentPage() {
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = Math.min(startIndex + itemsPerPage, serialNumbers.length);
                
                // Barcha QR kodlarni yashirish
                const allCards = qrGrid.querySelectorAll('.qr-card');
                allCards.forEach(card => {
                    card.style.display = 'none';
                });
                
                // Faqat joriy sahifadagi QR kodlarni ko'rsatish
                for (let i = startIndex; i < endIndex; i++) {
                    const card = qrGrid.querySelector(`.qr-card[data-index="${i}"]`);
                    if (card) {
                        card.style.display = 'block';
                    }
                }
                
                updatePaginationInfo();
            }
            
            // Oldingi sahifa
            prevPageBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    showCurrentPage();
                }
            });
            
            // Keyingi sahifa
            nextPageBtn.addEventListener('click', function() {
                if (currentPage < totalPages) {
                    currentPage++;
                    showCurrentPage();
                }
            });
            
            // QR kodni yuklab olish
            function downloadQRCode(serial, index) {
                const canvas = document.querySelector(`#qrcode-${index} canvas`);
                if (!canvas) {
                    alert('QR kod hali tayyor emas!');
                    return;
                }
                
                try {
                    const link = document.createElement('a');
                    link.download = `qr-code-${serial.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (error) {
                    console.error(error);
                    alert('QR kodni yuklab olishda xatolik yuz berdi!');
                }
            }
            
            // Barcha QR kodlarni yuklab olish
            downloadAllBtn.addEventListener('click', function() {
                if (qrCodes.length === 0) {
                    alert('QR kodlar hali yaratilmagan!');
                    return;
                }
                
                alert('Har bir QR kodni alohida yuklab olishingiz mumkin. ZIP arxivini yaratish funksiyasi keyingi yangilanishda qoʻshiladi.');
            });
            
            // Tozalash
            clearBtn.addEventListener('click', function() {
                fileInput.value = '';
                fileInfo.style.display = 'none';
                qrGrid.innerHTML = '';
                serialNumbers = [];
                qrCodes = [];
                generateBtn.disabled = true;
                downloadAllBtn.disabled = true;
                noData.style.display = 'block';
                progressBar.style.display = 'none';
                pagination.style.display = 'none';
                paginationInfo.style.display = 'none';
            });
            
            // Drag and drop qo'llab-quvvatlash
            fileInputLabel.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                fileInputLabel.style.backgroundColor = '#d6dbdf';
                fileInputLabel.style.borderColor = '#2980b9';
            });
            
            fileInputLabel.addEventListener('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                fileInputLabel.style.backgroundColor = '#ecf0f1';
                fileInputLabel.style.borderColor = '#3498db';
            });
            
            fileInputLabel.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                fileInputLabel.style.backgroundColor = '#ecf0f1';
                fileInputLabel.style.borderColor = '#3498db';
                
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    fileInput.files = e.dataTransfer.files;
                    const event = new Event('change');
                    fileInput.dispatchEvent(event);
                }
            });
        });