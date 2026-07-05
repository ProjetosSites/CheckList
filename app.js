// 1. CONFIGURAÇÕES
const IMGBB_API_KEY = '372848fbfcdf87bb3acc7a3a877201de'; 

const fileInput = document.getElementById('fileInput');
const loadingDiv = document.getElementById('loading');
const galleryContainer = document.getElementById('galleryContainer');

document.addEventListener('DOMContentLoaded', loadAndRenderPhotos);

fileInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    loadingDiv.classList.remove('hidden');

    for (let file of files) {
        await uploadImage(file);
    }

    loadingDiv.classList.add('hidden');
    fileInput.value = ''; 
    loadAndRenderPhotos();
});

// 2. FUNÇÃO DE UPLOAD PARA IMGBB
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            const now = new Date();
            const photoData = {
                id: Date.now() + Math.random(),
                url: data.data.url,
                dateStr: now.toLocaleDateString('pt-BR'), 
                timeStr: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 
                timestamp: now.getTime()
            };

            savePhotoData(photoData);
        } else {
            alert('Erro no ImgBB: ' + (data.error ? data.error.message : 'Desconhecido'));
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Falha na conexão ao tentar enviar foto.');
    }
}

// 3. ARMAZENAMENTO LOCAL
function savePhotoData(photoData) {
    let photos = JSON.parse(localStorage.getItem('checklist_photos')) || [];
    photos.unshift(photoData); 
    localStorage.setItem('checklist_photos', JSON.stringify(photos));
}

function getSavedPhotos() {
    return JSON.parse(localStorage.getItem('checklist_photos')) || [];
}

// 4. RENDERIZAÇÃO COM TODAS AS MELHORIAS VISUAIS
function loadAndRenderPhotos() {
    const photos = getSavedPhotos();
    galleryContainer.innerHTML = '';

    if (photos.length === 0) {
        galleryContainer.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color:#64748b;">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" style="margin: 0 auto 12px; opacity: 0.5;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p>Nenhuma foto registrada no checklist ainda.</p>
            </div>`;
        return;
    }

    const grouped = photos.reduce((acc, photo) => {
        acc[photo.dateStr] = acc[photo.dateStr] || [];
        acc[photo.dateStr].push(photo);
        return acc;
    }, {});

    for (const [dateStr, dayPhotos] of Object.entries(grouped)) {
        const daySection = document.createElement('div');
        daySection.className = 'day-group'; 

        let gridHtml = '';
        dayPhotos.forEach(photo => {
            gridHtml += `
                <div class="photo-card">
                    <div class="photo-img-wrapper">
                        <a href="${photo.url}" target="_blank">
                            <img src="${photo.url}" alt="Foto Checklist" loading="lazy">
                        </a>
                        <span class="photo-time-overlay">
                            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${photo.timeStr}
                        </span>
                    </div>
                    <div class="photo-info">
                        <button class="btn-download-single" onclick="event.stopPropagation(); downloadPhoto('${photo.url}', 'checklist_${photo.dateStr.replaceAll('/','-')}_${photo.timeStr.replaceAll(':','-')}.jpg')">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Baixar
                        </button>
                    </div>
                </div>
            `;
        });

        // Estrutura com Pill Badge no Cabeçalho e Ícones Vetorial nos Botões
        daySection.innerHTML = `
            <div class="day-header" onclick="toggleSection(this)">
                <div class="day-title-wrapper">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="#3b82f6" stroke-width="2" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span class="day-title">${dateStr}</span>
                </div>
                <div class="header-right">
                    <span class="photo-badge">${dayPhotos.length} ${dayPhotos.length === 1 ? 'foto' : 'fotos'}</span>
                    <span class="chevron">▼</span>
                </div>
            </div>
            <div class="day-content">
                <button class="btn-download-day" onclick="event.stopPropagation(); downloadDayPhotos('${dateStr}')">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Baixar Dia Completo (${dayPhotos.length})
                </button>
                <div class="photos-grid">
                    ${gridHtml}
                </div>
            </div>
        `;

        galleryContainer.appendChild(daySection);
    }
}

function toggleSection(headerElement) {
    const parentGroup = headerElement.parentElement;
    parentGroup.classList.toggle('active');
}

// 5. FUNÇÕES DE DOWNLOAD
async function downloadPhoto(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        a.remove();
    } catch (e) {
        window.open(url, '_blank');
    }
}

function downloadDayPhotos(dateStr) {
    const photos = getSavedPhotos().filter(p => p.dateStr === dateStr);
    if (photos.length === 0) return;

    alert(`Iniciando download de ${photos.length} foto(s) do dia ${dateStr}...`);
    
    photos.forEach((photo, index) => {
        setTimeout(() => {
            const fileName = `checklist_${dateStr.replaceAll('/','-')}_${photo.timeStr.replaceAll(':','-')}_${index+1}.jpg`;
            downloadPhoto(photo.url, fileName);
        }, index * 600);
    });
}
