import { checkAuth, logout } from './auth.js';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'https://localhost:443'
  : 'https://api-mindeasy.ru';
let currentTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        window.location.href = '/';
        return;
    }
    const headerUsername = document.querySelector('.username');

    async function loadProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки профиля');
            }

            const data = await response.json();

            headerUsername.textContent = data.username;

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить данные профиля');
        }
    }

    await loadProfile();
    // Настройка кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Загрузка задач
    await loadTasks();

    // Обработчики событий
    document.getElementById('new-task-btn').addEventListener('click', showTaskForm);
    document.getElementById('cancel-edit').addEventListener('click', hideTaskForm);
    document.getElementById('task-edit-form').addEventListener('submit', handleTaskSubmit);
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
});

async function loadTasks(params = new URLSearchParams()) {
    try {
        const token = localStorage.getItem('access_token');

        // Добавляем пагинацию по умолчанию, если не указана
        if (!params.has('page')) params.append('page', '1');
        if (!params.has('per_page')) params.append('per_page', '20');

        const response = await fetch(`${API_BASE_URL}/api/tasks?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки задач');
        }

        const data = await response.json();
        currentTasks = data.items;
        console.log(data)
        renderTasks(currentTasks);
        renderPagination(data); // Рендерим пагинацию

    } catch (error) {
        console.error('Full error loading tasks:', error);

        // Более информативное сообщение об ошибке
        let errorMessage = 'Не удалось загрузить задачи';
        if (error.message.includes('401')) {
            errorMessage = 'Ошибка авторизации. Пожалуйста, войдите снова.';
            logout();
        } else if (error.message) {
            errorMessage += `: ${error.message}`;
        }

        alert(errorMessage);
    }
}

function renderPagination(data) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (data.total_pages <= 1) return;

    // Создаем кнопку "Назад"
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.className = 'pagination-btn';
    prevButton.disabled = data.page === 1;
    prevButton.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', data.page - 1);
        loadTasks(params);
    });
    paginationContainer.appendChild(prevButton);

    // Создаем кнопки страниц
    for (let i = 1; i <= data.total_pages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `pagination-btn ${i === data.page ? 'active' : ''}`;
        pageButton.addEventListener('click', () => {
            const params = new URLSearchParams(window.location.search);
            params.set('page', i);
            loadTasks(params);
        });
        paginationContainer.appendChild(pageButton);
    }

    // Создаем кнопку "Вперед"
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.className = 'pagination-btn';
    nextButton.disabled = data.page === data.total_pages;
    nextButton.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', data.page + 1);
        loadTasks(params);
    });
    paginationContainer.appendChild(nextButton);
}



// Добавляем после renderTasks функцию

function renderFileSection(taskId, files = []) {
    const fileSection = document.createElement('div');
    fileSection.className = 'task-files-section';
    fileSection.innerHTML = `
        <div class="file-list" id="file-list-${taskId}">
            ${files.length === 0 ? 
              '<p>Нет прикрепленных файлов</p>' : 
              files.map(file => `
                <div class="file-item" data-s3_key="${file.s3_key}">
                    <i class="fas fa-file file-icon"></i>
                    <a href="${file.download_url}" 
                       target="_blank" 
                       download="${file.file_name}">
                        ${file.file_name}
                    </a>
                    <div class="file-actions">
                        <button class="btn btn-sm btn-danger delete-file">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
              `).join('')}
        </div>
        <button class="upload-file-btn" data-task-id="${taskId}">
            <i class="fas fa-plus"></i> Добавить файл
        </button>
    `;

    return fileSection;
}

// Обновляем renderTasks
function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<p>Нет задач, соответствующих фильтрам</p>';
        return;
    }

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card'; // Используем нейтральный класс
        taskElement.innerHTML = `
            <div class="task-card-header">
                <div class="task-title">${task.title}</div>
                <div class="task-priority">Приоритет: ${task.priority}</div>
                ${task.group ? `
                <div class="task-group">
                    <i class="fas fa-folder"></i> ${task.group.name}
                </div>` : ''}
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-dates">
                <div>Создано: ${new Date(task.created_at).toLocaleDateString()}</div>
                ${task.due_date ? `<div>Срок: ${new Date(task.due_date).toLocaleDateString()}</div>` : ''}
            </div>
            <div class="task-status status-${task.status}">
                ${getStatusText(task.status)}
            </div>
            <div class="task-actions">
                <button class="btn btn-outline edit-task" data-id="${task.id}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn btn-danger delete-task" data-id="${task.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;

        // Добавляем секцию с файлами
        taskElement.appendChild(renderFileSection(task.id, task.files || []));

        // Добавляем остальные элементы
        taskElement.innerHTML += `
            <div class="task-actions">
                <!-- Ваши кнопки действий -->
            </div>
        `;

        taskList.appendChild(taskElement);
    });

    // Обработчики для кнопок загрузки файлов
    document.querySelectorAll('.upload-file-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.dataset.taskId;
            showUploadModal(taskId);
        });
    });

    // Обработчики для удаления файлов
    document.querySelectorAll('.delete-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fileItem = e.currentTarget.closest('.file-item');
            const fileId = fileItem.dataset.s3_key;
            deleteFile(fileId);
        });
    });
        // Добавляем обработчики для кнопок редактирования и удаления
    document.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', (e) => editTask(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', (e) => deleteTask(e.target.dataset.id));
    });
}

// Функции для работы с модальным окном
let currentUploadTaskId = null;

function showUploadModal(taskId) {
    currentUploadTaskId = taskId;
    document.getElementById('file-upload-modal').style.display = 'flex';
}

function hideUploadModal() {
    document.getElementById('file-upload-modal').style.display = 'none';
    document.getElementById('file-to-upload').value = '';
}

// Обработчики модального окна
document.getElementById('cancel-upload').addEventListener('click', hideUploadModal);
document.getElementById('confirm-upload').addEventListener('click', async () => {
    const files = document.getElementById('file-to-upload').files;

    if (files.length === 0) {
        alert('Выберите файл для загрузки');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();

        const file = files[0];

        formData.append('file', file);
        const response = await fetch(`${API_BASE_URL}/api/task/${currentUploadTaskId}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            await loadTasks();
            hideUploadModal();
        } else {
            throw new Error('Ошибка загрузки файла');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Не удалось загрузить файл');
    }
});

// Функция удаления файла (остается без изменений)
async function deleteFile(s3Key) {
    const confirmed = confirm("Вы уверены, что хотите удалить файл?");
    if (!confirmed) return;

    const token = localStorage.getItem('access_token');

    await fetch(`${API_BASE_URL}/api/task/files`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ s3_key: s3Key })
    });

    // удалить элемент из DOM
    document.querySelector(`[data-s3_key="${s3Key}"]`)?.remove();
}



function getStatusText(status) {
    switch(status) {
        case 'todo': return 'Сделать';
        case 'in_progress': return 'В работе';
        case 'done': return 'Готово';
        default: return status;
    }
}
async function loadGroupsForSelect() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/groups`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Ошибка загрузки групп');

        return await response.json();
    } catch (error) {
        console.error('Error loading groups:', error);
        return [];
    }
}

async function showTaskForm(task = null) {
    const form = document.getElementById('task-form');
    const formTitle = document.getElementById('form-title');

    // Загружаем группы для выпадающего списка
    const groups = await loadGroupsForSelect();
    const groupSelect = document.getElementById('task-group');
    groupSelect.innerHTML = '<option value="">Без группы</option>';

    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (task && task.group_id === group.id) {
            option.selected = true;
        }
        groupSelect.appendChild(option);
    });

    if (task) {
        formTitle.textContent = 'Редактировать задачу';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-priority').value = task.priority;

        if (task.due_date) {
            document.getElementById('task-due-date').value =
                new Date(task.due_date).toISOString().slice(0, 16);
        }
    } else {
        formTitle.textContent = 'Новая задача';
        document.getElementById('task-edit-form').reset();
        document.getElementById('task-id').value = '';
    }

    form.style.display = 'block';
}

function hideTaskForm() {
    document.getElementById('task-form').style.display = 'none';
}

async function editTask(taskId) {
    const task = currentTasks.find(t => t.id === taskId);
    if (task) {
        showTaskForm(task);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadTasks();
        } else {
            throw new Error('Ошибка удаления задачи');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Не удалось удалить задачу');
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();

    const taskId = document.getElementById('task-id').value;
    const isEdit = !(taskId === "undefined");

    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim() || null,
        status: document.getElementById('task-status').value,
        priority: parseInt(document.getElementById('task-priority').value),
        due_date: document.getElementById('task-due-date').value
            ? new Date(document.getElementById('task-due-date').value).toISOString()
            : null,
        group_id: document.getElementById('task-group').value || null
    };

    // Валидация
    if (!taskData.title) {
        alert('Название задачи обязательно!');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        let response;
        let endpoint;
        let method;

        if (isEdit) {
            // Редактирование существующей задачи
            endpoint = `${API_BASE_URL}/api/tasks/${taskId}`;
            method = 'PATCH';
        } else {
            // Создание новой задачи
            endpoint = `${API_BASE_URL}/api/tasks`;
            method = 'POST';
        }

        console.log('Sending request to:', endpoint); // Отладочная информация
        console.log('Request method:', method);
        console.log('Request data:', taskData);

        response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error details:', errorData);

            if (errorData.detail) {
                const errors = errorData.detail.map(err => {
                    const field = err.loc[err.loc.length - 1];
                    return `Ошибка в поле "${field}": ${err.msg}`;
                }).join('\n');
                alert(`Ошибка валидации:\n${errors}`);
            } else {
                throw new Error(errorData.message || 'Ошибка сохранения задачи');
            }
            return;
        }

        hideTaskForm();
        await loadTasks();

    } catch (error) {
        console.error('Error saving task:', error);
        alert(error.message || 'Не удалось сохранить задачу');
    }
}

async function applyFilters() {
    try {
        const token = localStorage.getItem('access_token');
        const params = new URLSearchParams();

        // 1. Статусы (множественный выбор)
        const statusCheckboxes = document.querySelectorAll('input[name="status"]:checked');
        statusCheckboxes.forEach(checkbox => {
            params.append('status', checkbox.value);
        });

        // 2. Диапазон приоритетов
        const priorityMin = document.getElementById('priority-min').value;
        const priorityMax = document.getElementById('priority-max').value;
        if (priorityMin) params.append('priority_min', priorityMin);
        if (priorityMax) params.append('priority_max', priorityMax);

        // 3. Диапазон дат создания
        const createdDateRangeInput = document.getElementById('created-date-range');
        if (createdDateRangeInput.value) {
            const dates = createdDateRangeInput.value.split(' — ');
            if (dates[0]) {
                params.append('start_date_from', new Date(dates[0]).toISOString());
            }
            if (dates[1]) {
                const endDate = new Date(dates[1]);
                endDate.setHours(23, 59, 59); // Устанавливаем конец дня
                params.append('start_date_to', endDate.toISOString());
            }
        }

        // 4. Диапазон сроков выполнения (Flatpickr)
        const dateRangeInput = document.getElementById('due-date-range');
        if (dateRangeInput.value) {
            const dates = dateRangeInput.value.split(' — ');
            if (dates[0]) {
                params.append('due_date_from', new Date(dates[0]).toISOString());
            }
            if (dates[1]) {
                const endDate = new Date(dates[1]);
                endDate.setHours(23, 59, 59); // Устанавливаем конец дня
                params.append('due_date_to', endDate.toISOString());
            }
        }

        // Добавляем пагинацию
        params.append('page', '1');
        params.append('per_page', '20');

        // Загружаем задачи с фильтрами
        await loadTasks(params);

    } catch (error) {
        console.error('Filter error:', error);
        alert('Ошибка при применении фильтров');
    }
}

function resetFilters() {
    // Сбрасываем приоритеты
    document.getElementById('priority-min').value = '';
    document.getElementById('priority-max').value = '';

    // Сбрасываем Flatpickr
    const dateRangePicker = document.getElementById('due-date-range')._flatpickr;
    if (dateRangePicker) {
        dateRangePicker.clear();
    }

    // Загружаем задачи сброшенные фильтры
    loadTasks(new URLSearchParams({ page: 1, per_page: 20 }));
}

document.addEventListener('DOMContentLoaded', () => {
    flatpickr("#due-date-range", {
        mode: "range",
        dateFormat: "Y-m-d",
        locale: "ru",
        allowInput: true
    });
});

document.addEventListener('DOMContentLoaded', () => {
    flatpickr("#created-date-range", {
        mode: "range",
        dateFormat: "Y-m-d",
        locale: "ru",
        allowInput: true
    });
});

