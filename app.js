// 1. CONFIGURAÇÕES
const IMGBB_API_KEY = '372848fbfcdf87bb3acc7a3a877201de'; 

const fileInput = document.getElementById('fileInput');
const loadingDiv = document.getElementById('loading');
const galleryContainer = document.getElementById('galleryContainer');

// Carregar fotos salvas ao abrir o app
document.addEventListener('DOMContentLoaded', loadAndRenderPhotos);

fileInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    loadingDiv.classList.remove('hidden');

    for (let file of files) {
        await uploadImage(file);
    }

    loadingDiv.classList.add('hidden');
    fileInput.value = ''; // Limpa o input
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
                dateStr: now.toLocaleDateString('pt-BR'), // Ex: 04/07/2026
                timeStr: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), // Ex: 20:45
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

// 3. ARMAZENAMENTO (Pronto para conectar ao Supabase)
function savePhotoData(photoData) {
    // Salva localmente para funcionamento imediato do PWA
    let photos = JSON.parse(localStorage.getItem('checklist_photos')) || [];
    photos.unshift(photoData); // Adiciona no início
    localStorage.setItem('checklist_photos', JSON.stringify(photos));

    /* =========================================================
       INTEGRAÇÃO SUPABASE (Descomente quando configurar o client):
       
       await supabase.from('checklist_veiculos').insert([{
           url: photoData.url,
           data_registro: photoData.dateStr,
           horario: photoData.timeStr
       }]);
    ========================================================== */
}

function getSavedPhotos() {
    return JSON.parse(localStorage.getItem('checklist_photos')) || [];
}

// 4. RENDERIZAÇÃO E AGRUPAMENTO POR DIA
function loadAndRenderPhotos() {
    const photos = getSavedPhotos();
    galleryContainer.innerHTML = '';

    if (photos.length === 0) {
        galleryContainer.innerHTML = `<p style="text-align:center; color:#94a3b8;">Nenhuma foto registrada no checklist ainda.</p>`;
        return;
    }

    // Agrupar fotos pela chave data (dateStr)
    const grouped = photos.reduce((acc, photo) => {
        acc[photo.dateStr] = acc[photo.dateStr] || [];
        acc[photo.dateStr].push(photo);
        return acc;
    }, {});

    // Renderizar cada grupo diário
    for (const [dateStr, dayPhotos] of Object.entries(grouped)) {
        const daySection = document.createElement('div');
        daySection.className = 'day-group';

        let gridHtml = '';
        dayPhotos.forEach(photo => {
            gridHtml += `
                <div class="photo-card">
                    <a href="${photo.url}" target="_blank">
                        <img src="${photo.url}" alt="Foto Checklist" loading="lazy">
                    </a>
                    <div class="photo-info">
                        <span class="photo-time">🕒 ${photo.timeStr}</span>
                        <button class="btn-download-single" onclick="downloadPhoto('${photo.url}', 'checklist_${photo.dateStr.replaceAll('/','-')}_${photo.timeStr.replaceAll(':','-')}.jpg')">⬇️ Baixar</button>
                    </div>
                </div>
            `;
        });

        daySection.innerHTML = `
            <div class="day-header">
                <h2 class="day-title">📅 ${dateStr}</h2>
                <button class="btn-download-day" onclick="downloadDayPhotos('${dateStr}')">📥 Baixar Dia (${dayPhotos.length})</button>
            </div>
            <div class="photos-grid">
                ${gridHtml}
            </div>
        `;

        galleryContainer.appendChild(daySection);
    }
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
        // Fallback caso o navegador bloqueie o blob cross-origin
        window.open(url, '_blank');
    }
}

function downloadDayPhotos(dateStr) {
    const photos = getSavedPhotos().filter(p => p.dateStr === dateStr);
    if (photos.length === 0) return;

    alert(`Iniciando download de ${photos.length} foto(s) do dia ${dateStr}...`);
    
    // Dispara o download sequencial com pequeno intervalo para não travar o navegador
    photos.forEach((photo, index) => {
        setTimeout(() => {
            const fileName = `checklist_${dateStr.replaceAll('/','-')}_${photo.timeStr.replaceAll(':','-')}_${index+1}.jpg`;
            downloadPhoto(photo.url, fileName);
        }, index * 600);
    });
}
