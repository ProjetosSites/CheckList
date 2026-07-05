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

// 4. RENDERIZAÇÃO COM ABAS RETRÁTEIS
function loadAndRenderPhotos() {
    const photos = getSavedPhotos();
    galleryContainer.innerHTML = '';

    if (photos.length === 0) {
        galleryContainer.innerHTML = `<p style="text-align:center; color:#94a3b8; margin-top:20px;">Nenhuma foto registrada no checklist ainda.</p>`;
        return;
    }

    const grouped = photos.reduce((acc, photo) => {
        acc[photo.dateStr] = acc[photo.dateStr] || [];
        acc[photo.dateStr].push(photo);
        return acc;
    }, {});

    // Renderizar cada bloco de dia como uma aba recolhível
    for (const [dateStr, dayPhotos] of Object.entries(grouped)) {
        const daySection = document.createElement('div');
        daySection.className = 'day-group'; // Pode adicionar 'active' aqui se quiser que o dia atual nasça aberto por padrão

        let gridHtml = '';
        dayPhotos.forEach(photo => {
            gridHtml += `
                <div class="photo-card">
                    <a href="${photo.url}" target="_blank">
                        <img src="${photo.url}" alt="Foto Checklist" loading="lazy">
                    </a>
                    <div class="photo-info">
                        <span class="photo-time">🕒 ${photo.timeStr}</span>
                        <button class="btn-download-single" onclick="event.stopPropagation(); downloadPhoto('${photo.url}', 'checklist_${photo.dateStr.replaceAll('/','-')}_${photo.timeStr.replaceAll(':','-')}.jpg')">⬇️ Baixar</button>
                    </div>
                </div>
            `;
        });

        // Estrutura HTML da Aba: Cabeçalho clicável + Bloco de Conteúdo que expande
        daySection.innerHTML = `
            <div class="day-header" onclick="toggleSection(this)">
                <h2 class="day-title">📅 ${dateStr}</h2>
            </div>
            <div class="day-content">
                <button class="btn-download-day" onclick="event.stopPropagation(); downloadDayPhotos('${dateStr}')">📥 Baixar Todo o Dia (${dayPhotos.length})</button>
                <div class="photos-grid">
                    ${gridHtml}
                </div>
            </div>
        `;

        galleryContainer.appendChild(daySection);
    }
}

// Lógica de abrir e fechar ao clicar na barra do dia
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
